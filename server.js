const express = require('express');
const cors = require('cors');
const NodeCache = require('node-cache');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(express.json());
app.use(cors());

// Inicializa a API do Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// Memória de 72 horas (259200 segundos)
const patientCache = new NodeCache({ stdTTL: 259200, checkperiod: 3600 });

app.post('/api/atendimento', async (req, res) => {
    try {
        const { beId, mensagem, unidade, acao } = req.body;

        if (!beId || !mensagem) {
            return res.status(400).json({ erro: 'Número do BE e mensagem são obrigatórios.' });
        }

        // Recuperação de Memória
        let historicoPaciente = patientCache.get(beId);
        let tipoAtendimento = '';

        if (historicoPaciente) {
            tipoAtendimento = 'EVOLUÇÃO (Retorno com exames/reavaliação)';
            patientCache.ttl(beId, 259200); // Renova as 72h
        } else {
            tipoAtendimento = 'ADMISSÃO (Primeiro Contato)';
            historicoPaciente = [];
        }

        // Diretrizes Farmacológicas por Unidade
        let contextoFarmacologico = '';
        if (unidade === 'BARREIRO') {
            contextoFarmacologico = '[PADRONIZAÇÃO UPA BARREIRO / REMUME PBH - MEDICAMENTOS DE URGÊNCIA]';
        } else if (unidade === 'ACRIZIO') {
            contextoFarmacologico = '[PADRONIZAÇÃO UPA ACRÍZIO MENEZES]';
        }

        // Instruções Específicas de Ação
        let instrucoesAcao = '';
        if (acao === 'ALTA') {
            instrucoesAcao = `O médico solicitou a ALTA DOMICILIAR. Ignore o prontuário completo. Gere APENAS a receita médica de alta em bullet points, utilizando EXCLUSIVAMENTE medicamentos do RENAME (Atenção Básica do SUS).`;
        } else if (acao === 'EVOLUCAO') {
            instrucoesAcao = `Gere APENAS uma Evolução Médica curta baseada nos novos dados fornecidos.`;
        } else {
            instrucoesAcao = `Gere o Prontuário Médico de Admissão completo.`;
        }

        // SYSTEM PROMPT MESTRE
        const promptFinal = `
Você é um médico assistente de retaguarda em uma UPA.
UNIDADE ATUAL: ${unidade}
TIPO DE ATENDIMENTO: ${tipoAtendimento}

REGRAS OBRIGATÓRIAS (CHAIN OF THOUGHT):
1. INTERAÇÃO: Separe dúvidas diretas do médico (ex: "concorda?") dos dados clínicos. Responda as dúvidas antes do prontuário, fora do texto copiável.
2. PRESCRIÇÃO E DOSES: 
- NUNCA prescreva Dipirona 500mg. Sempre utilize Dipirona 1g (comprimido ou EV) para analgesia.
- Respeite rigorosamente tempos de infusão (ex: Ciprofloxacino 400 mg NÃO deve correr em 30 minutos).
- Não sugira USG ou Tomografia de imediato (exige vaga zero). Não sugira nebulização com gotas.
3. ESTRUTURA PARA O SIGRAH: O texto final do prontuário DEVE ser gerado dentro de um bloco de código (Markdown). Cada tópico (BE, QP, HMA, HP, EF, EC, HD, Conduta) deve ter uma quebra de linha limpa para facilitar a cópia para o sistema SIGRAH da PBH.

DIRETRIZ DA AÇÃO ATUAL:
${instrucoesAcao}

HISTÓRICO DO PACIENTE (Últimas 72h):
${JSON.stringify(historicoPaciente)}

NOVA MENSAGEM DO PLANTONISTA:
"${mensagem}"
        `;

        const result = await model.generateContent(promptFinal);
        const respostaIA = result.response.text();

        historicoPaciente.push({ medico: mensagem, ia: respostaIA });
        patientCache.set(beId, historicoPaciente);

        res.json({ prontuario: respostaIA });

    } catch (error) {
        console.error('Erro:', error);
        res.status(500).json({ erro: 'Falha no processamento. Tente novamente.' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(\`Servidor rodando na porta \${PORT}\`));
