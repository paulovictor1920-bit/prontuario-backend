const express = require('express');
const cors = require('cors');
const NodeCache = require('node-cache');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Importando o banco de medicamentos que montamos
const { medicamentosAcrizioMenezes, medicamentosBarreiro } = require('./farmacia');

const app = express();
app.use(express.json());
app.use(cors());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });

const patientCache = new NodeCache({ stdTTL: 259200, checkperiod: 3600 });

function formatarFarmacia(lista) {
    return lista.map(item => `- ${item.nome} (${item.apresentacao})`).join('\n');
}

app.post('/api/atendimento', async (req, res) => {
    try {
        const { beId, mensagem, unidade, opcoes } = req.body;

        if (!beId || !mensagem) {
            return res.status(400).json({ erro: 'Número do BE e mensagem são obrigatórios.' });
        }

        let historicoPaciente = patientCache.get(beId) || [];
        let tipoAtendimento = historicoPaciente.length > 0 ? 'EVOLUÇÃO (Retorno com exames/reavaliação)' : 'ADMISSÃO (Primeiro Contato)';

        if (historicoPaciente.length > 0) {
            patientCache.ttl(beId, 259200);
        }

        let contextoFarmacologico = '';
        if (unidade === 'BARREIRO') {
            contextoFarmacologico = `MEDICAMENTOS DISPONÍVEIS (REMUME PBH - SECUNDÁRIA/URGÊNCIA):\n${formatarFarmacia(medicamentosBarreiro)}`;
        } else if (unidade === 'ACRIZIO') {
            contextoFarmacologico = `MEDICAMENTOS DISPONÍVEIS (PADRONIZAÇÃO UPA ACRÍZIO):\n${formatarFarmacia(medicamentosAcrizioMenezes)}`;
        }

        // --- CONSTRUÇÃO DINÂMICA DA INSTRUÇÃO BASEADA NAS CHAVES (TOGGLES) ---
        let instrucoesAcao = "O médico solicitou as seguintes criações documentais. VOCÊ DEVE GERAR TODAS COM ABSOLUTA CONGRUÊNCIA CLÍNICA ENTRE SI (mesmos diagnósticos, mesma lógica):\n";
        
        if (opcoes.correcao) {
            instrucoesAcao = "⚠️ MODO DE CORREÇÃO: O médico identificou um erro ou pediu alteração na conduta anterior. Avalie a mensagem e REESCREVA APENAS os documentos que o médico deixou marcados, aplicando a correção solicitada.\n\nDOCUMENTOS SOLICITADOS PARA CORREÇÃO:\n";
        }

        if (opcoes.prontuario) {
            instrucoesAcao += "- PRONTUÁRIO: Gere a Admissão ou Evolução seguindo a estrutura do SIGRAH.\n";
        }
        if (opcoes.alta) {
            instrucoesAcao += "- RECEITA DE ALTA: Gere a prescrição domiciliar em bullet points. A conduta domiciliar DEVE CASAR com a hipótese diagnóstica do prontuário.\n";
        }
        if (opcoes.relatorio) {
            instrucoesAcao += "- RELATÓRIO APS: Gere um resumo de contrarreferência para o Médico de Família da UBS (Atenção Primária), informando o que foi diagnosticado e tratado na UPA.\n";
        }

        // Prompt Final Blindado
        const promptFinal = `Você é um médico assistente de retaguarda em uma UPA.
UNIDADE ATUAL: ${unidade}
TIPO DE ATENDIMENTO: ${tipoAtendimento}

${contextoFarmacologico}

REGRAS OBRIGATÓRIAS:
1. FORMATO DE SAÍDA EXIGIDO (JSON puro contendo sempre estas 4 chaves):
   - "discussao": Responda dúvidas do médico, alerte sinais de gravidade ou comente o caso.
   - "prontuario": Coloque o texto do prontuário aqui (deixe vazio "" se não foi solicitado).
   - "receita": Coloque o texto da receita de alta aqui (deixe vazio "" se não foi solicitado).
   - "relatorio": Coloque o texto do relatório para APS aqui (deixe vazio "" se não foi solicitado).

2. PRESCRIÇÃO E DOSES NA UPA:
   - Prescreva APENAS os medicamentos listados no contexto farmacológico acima.
   - NUNCA prescreva Dipirona 500mg. Sempre utilize Dipirona 1g para analgesia.
   - Respeite os tempos de infusão rigorosamente (ex: O Ciprofloxacino 400 mg NÃO deve correr em 30 minutos).
   - Não sugira USG, Tomografia de imediato ou nebulização com gotas na emergência.

3. ESTRUTURA PARA O SIGRAH (Se prontuário for solicitado):
BE: [Número] - Sexo: [M/F] - Idade: [X] anos
Queixa Principal (QP): [Texto]
História da Moléstia Atual (HMA): [Texto]
Exame Físico (EF): [Texto descritivo]
Hipóteses Diagnósticas (HD): [Texto com CID]
Conduta na UPA: [Medicamentos, Via, Diluição]

DIRETRIZ DA AÇÃO ATUAL (O que gerar agora):
${instrucoesAcao}

HISTÓRICO DO PACIENTE (Últimas ações no cache):
${JSON.stringify(historicoPaciente)}

NOVA MENSAGEM DO MÉDICO:
${mensagem}`;

        // Comunicação com o Gemini forçando JSON
        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: promptFinal }] }],
            generationConfig: {
                responseMimeType: "application/json",
            }
        });

        const respostaIA = result.response.text();
        const jsonParseado = JSON.parse(respostaIA);

        // Atualiza o histórico
        historicoPaciente.push({ 
            medico: mensagem, 
            comandos: opcoes,
            resposta: jsonParseado 
        });
        patientCache.set(beId, historicoPaciente);

        // Devolve tudo para o Frontend mostrar
        res.json(jsonParseado);

    } catch (error) {
        console.error('Erro no processamento:', error);
        res.status(500).json({ erro: 'Falha no processamento. Verifique a integração com a API.' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Servidor rodando na porta " + PORT);
});
