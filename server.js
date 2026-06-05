const express = require('express');
const cors = require('cors');
const NodeCache = require('node-cache');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(express.json());
app.use(cors());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.0-pro' });

const patientCache = new NodeCache({ stdTTL: 259200, checkperiod: 3600 });

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

        let contextoFarmacologico = '';
        if (unidade === 'BARREIRO') {
            contextoFarmacologico = '[PADRONIZAÇÃO UPA BARREIRO / REMUME PBH - MEDICAMENTOS DE URGÊNCIA]';
        } else if (unidade === 'ACRIZIO') {
            contextoFarmacologico = '[PADRONIZAÇÃO UPA ACRÍZIO MENEZES]';
        }

        let instrucoesAcao = '';
        if (acao === 'ALTA') {
            instrucoesAcao = 'O médico solicitou a ALTA DOMICILIAR. Ignore o prontuário completo. Gere APENAS a receita médica de alta em bullet points, utilizando EXCLUSIVAMENTE medicamentos do RENAME.';
        } else if (acao === 'EVOLUCAO') {
            instrucoesAcao = 'Gere APENAS uma Evolução Médica curta baseada nos novos dados fornecidos.';
        } else {
            instrucoesAcao = 'Gere o Prontuário Médico de Admissão completo.';
        }

        const promptFinal = "Você é um médico assistente de retaguarda em uma UPA.\nUNIDADE ATUAL: " + unidade + "\nTIPO DE ATENDIMENTO: " + tipoAtendimento + "\n\nREGRAS OBRIGATÓRIAS:\n1. INTERAÇÃO: Separe dúvidas diretas do médico (ex: 'concorda?') dos dados clínicos. Responda as dúvidas antes do prontuário.\n2. PRESCRIÇÃO E DOSES:\n- NUNCA prescreva Dipirona 500mg. Sempre utilize Dipirona 1g para analgesia.\n- Respeite tempos de infusão.\n- Não sugira USG, Tomografia de imediato ou nebulização com gotas.\n3. ESTRUTURA PARA O SIGRAH: O texto final DEVE ter quebra de linha limpa em cada tópico (QP, HMA, etc).\n\nDIRETRIZ DA AÇÃO ATUAL:\n" + instrucoesAcao + "\n\nHISTÓRICO DO PACIENTE:\n" + JSON.stringify(historicoPaciente) + "\n\nNOVA MENSAGEM:\n" + mensagem;

        const result = await model.generateContent(promptFinal);
        const respostaIA = result.response.text();

        historicoPaciente.push({ medico: mensagem, ia: respostaIA });
        patientCache.set(beId, historicoPaciente);

        res.json({ prontuario: respostaIA });

    } catch (error) {
        console.error('Erro:', error);
        res.status(500).json({ erro: 'Falha no processamento.' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Servidor rodando com sucesso na porta " + PORT);
});
