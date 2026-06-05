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

REGRAS OBRIGATÓRIAS E FORMATAÇÃO:
1. SAÍDA EXIGIDA (JSON puro): chaves "discussao", "prontuario", "prescricao_interna", "receita", "relatorio". Deixe vazio "" se não solicitado.
2. DISCUSSÃO (Direta e Concisa):
   - Evite blocos de texto densos. Vá direto ao ponto.
   - Pule UMA LINHA (\n\n) entre os tópicos: [Red Flags], [Sala Vermelha], [Perfil], [Score/Conduta], [CIDs/Atestado] e [Trava Farmacológica].
3. PRONTUÁRIO (Estrutura Completa):
   - Siga rigorosamente a ordem: QP, HMA, HP, EF, HD e OBRIGATORIAMENTE inclua a seção "CD:" (Conduta), descrevendo exatamente as medicações e ações tomadas na UPA.
   - Pule UMA LINHA (\n\n) entre cada seção para o SIGRAH.
4. RECEITA DOMICILIAR (Padrão Impresso):
   - Agrupe OBRIGATORIAMENTE as medicações por via de administração. Escreva "USO ORAL", "USO TÓPICO", "USO INJETÁVEL" no topo dos blocos.
   - PROIBIDO: NUNCA insira textos burocráticos ou justificativas sobre falta de medicação no SUS/UPA na receita do paciente. As orientações devem ser puramente médicas (ex: repouso, hidratação, sinais de alarme).
5. RELATÓRIO APS (De médico para médico):
   - NÃO COPIE O PRONTUÁRIO. NÃO use tópicos como "História" ou "Exame Físico".
   - Escreva um PARÁGRAFO ÚNICO, curto e grosso, iniciando com "Colega, paciente avaliado nesta UPA por...".
   - Resuma a hipótese (ex: cefaleia primária), o manejo agudo realizado na UPA (ex: AINE e analgésico) e o motivo do encaminhamento (ex: seguimento ambulatorial e profilaxia).
6. PRESCRIÇÃO INTERNA: APENAS o que há na unidade. NUNCA Dipirona 500mg. Respeite infusões (ex: Ciprofloxacino NÃO corre em 30 min).

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
