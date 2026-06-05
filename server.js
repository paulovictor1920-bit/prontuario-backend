const express = require('express');
const cors = require('cors');
const NodeCache = require('node-cache');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// 1. Importando o banco de medicamentos que você criou
const { medicamentosAcrizioMenezes, medicamentosBarreiro } = require('./farmacia');

const app = express();
app.use(express.json());
app.use(cors());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });

const patientCache = new NodeCache({ stdTTL: 259200, checkperiod: 3600 });

// Função auxiliar para formatar a lista de medicamentos para a IA ler
function formatarFarmacia(lista) {
    return lista.map(item => `- ${item.nome} (${item.apresentacao})`).join('\n');
}

app.post('/api/atendimento', async (req, res) => {
    try {
        const { beId, mensagem, unidade, acao } = req.body;

        if (!beId || !mensagem) {
            return res.status(400).json({ erro: 'Número do BE e mensagem são obrigatórios.' });
        }

        let historicoPaciente = patientCache.get(beId) || [];
        let tipoAtendimento = historicoPaciente.length > 0 ? 'EVOLUÇÃO (Retorno com exames/reavaliação)' : 'ADMISSÃO (Primeiro Contato)';

        if (historicoPaciente.length > 0) {
            patientCache.ttl(beId, 259200);
        }

        // 2. Injeção Dinâmica da Farmacologia Correta
        let contextoFarmacologico = '';
        if (unidade === 'BARREIRO') {
            contextoFarmacologico = `MEDICAMENTOS DISPONÍVEIS (REMUME PBH - SECUNDÁRIA/URGÊNCIA):\n${formatarFarmacia(medicamentosBarreiro)}`;
        } else if (unidade === 'ACRIZIO') {
            contextoFarmacologico = `MEDICAMENTOS DISPONÍVEIS (PADRONIZAÇÃO UPA ACRÍZIO):\n${formatarFarmacia(medicamentosAcrizioMenezes)}`;
        }

        let instrucoesAcao = '';
        if (acao === 'ALTA') {
            instrucoesAcao = 'O médico solicitou a ALTA DOMICILIAR. Gere APENAS a receita médica de alta em bullet points na chave "prontuario".';
        } else if (acao === 'EVOLUCAO') {
            instrucoesAcao = 'Gere APENAS uma Evolução Médica curta baseada nos novos dados na chave "prontuario".';
        } else {
            instrucoesAcao = 'Gere o Prontuário Médico de Admissão completo na chave "prontuario".';
        }

        // 3. O Prompt Blindado e focado no retorno JSON
        const promptFinal = `Você é um médico assistente de retaguarda em uma UPA.
UNIDADE ATUAL: ${unidade}
TIPO DE ATENDIMENTO: ${tipoAtendimento}

${contextoFarmacologico}

REGRAS OBRIGATÓRIAS:
1. FORMATO DE SAÍDA: Responda EXCLUSIVAMENTE em formato JSON contendo duas chaves exatas: 
   - "discussao": Use esta chave para responder dúvidas do médico, alertar sobre Sinais de Alarme ou debater o caso.
   - "prontuario": Use esta chave APENAS para o texto do prontuário final.
2. PRESCRIÇÃO E DOSES:
   - Prescreva APENAS os medicamentos listados no contexto farmacológico acima.
   - NUNCA prescreva Dipirona 500mg. Sempre utilize Dipirona 1g para analgesia.
   - Respeite os tempos de infusão rigorosamente (ex: O Ciprofloxacino 400 mg NÃO deve correr em 30 minutos).
   - Não sugira USG, Tomografia de imediato ou nebulização com gotas na emergência.
3. ESTRUTURA DO PRONTUÁRIO: O texto dentro da chave "prontuario" deve possuir quebra de linhas limpas e seguir rigorosamente este modelo para o SIGRAH:

BE: [Número] - Sexo: [M/F] - Idade: [X] anos

Queixa Principal (QP): [Texto conciso]

História da Moléstia Atual (HMA): [Texto detalhado]

História Pregressa (HP): [Texto]

Exame Físico (EF):
[Texto descritivo por sistemas]
Sinais Vitais: [Texto]

Hipóteses Diagnósticas (HD): [Texto com CID]

Conduta:
- Feito na UPA: [Lista de medicamentos com diluição e via]

DIRETRIZ DA AÇÃO ATUAL:
${instrucoesAcao}

HISTÓRICO DO PACIENTE:
${JSON.stringify(historicoPaciente)}

NOVA MENSAGEM DO MÉDICO:
${mensagem}`;

        // 4. Forçando a API do Gemini a retornar JSON puro
        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: promptFinal }] }],
            generationConfig: {
                responseMimeType: "application/json",
            }
        });

        const respostaIA = result.response.text();
        const jsonParseado = JSON.parse(respostaIA);

        // Salvando no cache
        historicoPaciente.push({ 
            medico: mensagem, 
            ia_discussao: jsonParseado.discussao,
            ia_prontuario: jsonParseado.prontuario 
        });
        patientCache.set(beId, historicoPaciente);

        // Devolvendo o objeto estruturado para o seu Frontend
        res.json({ 
            discussao: jsonParseado.discussao,
            prontuario: jsonParseado.prontuario 
        });

    } catch (error) {
        console.error('Erro no processamento:', error);
        res.status(500).json({ erro: 'Falha no processamento. Verifique a integração com a API.' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Servidor rodando com sucesso na porta " + PORT);
});
