const express = require('express');
const cors = require('cors');
const NodeCache = require('node-cache');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Importando a farmácia (garanta que o arquivo farmacia.js está na mesma pasta)
const { medicamentosAcrizioMenezes, medicamentosBarreiro } = require('./farmacia');

const app = express();
app.use(express.json());
app.use(cors());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const patientCache = new NodeCache({ stdTTL: 259200, checkperiod: 3600 });

function formatarFarmacia(lista) {
    return lista.map(item => `- ${item.nome} (${item.apresentacao})`).join('\n');
}

app.post('/api/atendimento', async (req, res) => {
    try {
        // Agora recebemos a variável 'modeloId' do Frontend
        const { beId, mensagem, unidade, opcoes, modeloId } = req.body;

        if (!beId || !mensagem) {
            return res.status(400).json({ erro: 'Número do BE e mensagem são obrigatórios.' });
        }

        // Instancia o modelo escolhido pelo usuário (Flash para velocidade, Pro para raciocínio denso)
        const modelToUse = modeloId === 'flash' ? 'gemini-2.5-flash' : 'gemini-2.5-pro';
        const model = genAI.getGenerativeModel({ model: modelToUse });

        let historicoPaciente = patientCache.get(beId) || [];
        let tipoAtendimento = historicoPaciente.length > 0 ? 'EVOLUÇÃO (Retorno com exames/reavaliação)' : 'ADMISSÃO (Primeiro Contato)';

        if (historicoPaciente.length > 0) patientCache.ttl(beId, 259200);

        let contextoFarmacologico = '';
        if (unidade === 'BARREIRO') {
            contextoFarmacologico = `MEDICAMENTOS DISPONÍVEIS (REMUME PBH - SECUNDÁRIA/URGÊNCIA):\n${formatarFarmacia(medicamentosBarreiro)}`;
        } else if (unidade === 'ACRIZIO') {
            contextoFarmacologico = `MEDICAMENTOS DISPONÍVEIS (PADRONIZAÇÃO UPA ACRÍZIO):\n${formatarFarmacia(medicamentosAcrizioMenezes)}`;
        }

        let instrucoesAcao = "O médico solicitou as seguintes criações. GERE TODAS COM ABSOLUTA CONGRUÊNCIA CLÍNICA:\n";
        if (opcoes.correcao) {
            instrucoesAcao = "⚠️ MODO DE CORREÇÃO: O médico identificou um erro ou pediu alteração. REESCREVA APENAS os documentos marcados aplicando a correção.\n\n";
        }
        if (opcoes.prontuario) instrucoesAcao += "- PRONTUÁRIO e PRESCRIÇÃO INTERNA DA UPA.\n";
        if (opcoes.alta) instrucoesAcao += "- RECEITA DE ALTA.\n";
        if (opcoes.relatorio) instrucoesAcao += "- RELATÓRIO APS.\n";

        const promptFinal = `Você é um médico assistente de retaguarda em uma UPA.
UNIDADE ATUAL: ${unidade}
TIPO DE ATENDIMENTO: ${tipoAtendimento}

${contextoFarmacologico}

REGRAS OBRIGATÓRIAS:
1. FORMATO DE SAÍDA EXIGIDO (JSON com 5 chaves exatas):
   - "discussao": OBRIGATÓRIO usar o TEMPLATE DE DISCUSSÃO CLÍNICA abaixo.
   - "prontuario": Texto da anamnese e EF. Pule OBRIGATORIAMENTE uma linha (use \\n\\n) entre as seções (QP, HMA, HP, EF, HD).
   - "prescricao_interna": Apenas a lista da conduta imediata na UPA.
   - "receita": Receita domiciliar.
   - "relatorio": Relatório para APS.
   (Deixe vazio "" o que não foi solicitado).

2. TEMPLATE DE DISCUSSÃO CLÍNICA (Para a chave "discussao"):
ANÁLISE, ALERTAS E DIRECIONAMENTO (Fluxo SUS)
- Red Flags: [Análise]
- Sala Vermelha: [Análise de estabilidade]
- Perfil Atenção Primária (UBS): [A patologia é perfil UBS ou UPA?]
- Interconsultas e Repasses: [Há indicação?]
INVESTIGAÇÃO DIAGNÓSTICA E SCORES
- Score aplicável: [Se houver]
- Conduta e Raciocínio: [Discuta os diagnósticos "Can't Miss"]
- CIDs e Atestado: [Justificativa dos dias]
CONDUTA E PRESCRIÇÃO
- TRAVA FARMACOLÓGICA: [Analise interações, contraindicações e os medicamentos da unidade selecionados. Avise se algo pedido não tem na farmácia e justifique a substituição].

3. PRESCRIÇÃO NA UPA E DOMICILIAR:
   - Na UPA: Prescreva APENAS os medicamentos listados no contexto farmacológico. Adapte o que o médico pediu se não houver na unidade.
   - Nunca prescreva Dipirona 500mg.
   - Domiciliar: Não prescreva triptanos ou medicações de alto custo indisponíveis no SUS para casa sem alertar.

DIRETRIZ DA AÇÃO:
${instrucoesAcao}

HISTÓRICO DO PACIENTE:
${JSON.stringify(historicoPaciente)}

MENSAGEM DO MÉDICO:
${mensagem}`;

        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: promptFinal }] }],
            generationConfig: { responseMimeType: "application/json" }
        });

        const jsonParseado = JSON.parse(result.response.text());

        historicoPaciente.push({ medico: mensagem, comandos: opcoes, resposta: jsonParseado });
        patientCache.set(beId, historicoPaciente);

        res.json(jsonParseado);

    } catch (error) {
        console.error('Erro no processamento:', error);
        res.status(500).json({ erro: 'Falha no processamento. Tente novamente.' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Servidor rodando na porta " + PORT));
