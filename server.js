// ============================================================================
//  PRONTUÁRIO RÁPIDO - SERVIDOR (BACKEND)
//  Versão revisada com camadas de segurança.
//
//  COMO ISSO FUNCIONA, EM PALAVRAS SIMPLES:
//  - Este é o "cérebro" que fica num computador na nuvem (o Render).
//  - O site (a tela que você abre no navegador) manda o relato do paciente
//    pra cá. Aqui a gente conversa com a Inteligência Artificial do Google
//    (Gemini) e devolve os documentos prontos.
// ============================================================================

const express = require('express');
const cors = require('cors');
const NodeCache = require('node-cache');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Aqui a gente puxa as listas de medicamentos das duas unidades.
const { medicamentosAcrizioMenezes, medicamentosBarreiro } = require('./farmacia');

const app = express();
app.use(express.json());

// ----------------------------------------------------------------------------
//  CONFIGURAÇÕES QUE VOCÊ PODE QUERER MUDAR NO FUTURO (tudo num lugar só)
// ----------------------------------------------------------------------------

// Nomes dos modelos do Gemini. Se um dia o Google mudar os nomes ou você
// quiser usar um modelo mais novo, é AQUI que você troca, e só aqui.
// (Hoje, modelos mais novos como "gemini-3.5-flash" já existem; se quiser
//  testar, troque o texto entre aspas. Se der erro, volte pro que estava.)
//
//  ESCOLHA ATUAL (confirmada na documentação do Google em jun/2026):
//  - "gemini-3.5-flash" é a versão ESTÁVEL e mais inteligente da linha Flash.
//  - "gemini-2.5-pro" é a versão ESTÁVEL da linha Pro.
//  Existe um "gemini-3.1-pro" ainda mais forte, mas hoje está em PREVIEW
//  (versão de teste, pode mudar sem aviso). Quando ele virar estável, você
//  pode trocar a linha de baixo por 'gemini-3.1-pro'. Por enquanto, deixei
//  no estável pra não dar surpresa durante um plantão.
const MODELO_RAPIDO = 'gemini-3.5-flash';   // opção "Flash" (rápido)
const MODELO_PROFUNDO = 'gemini-2.5-pro';   // opção "Pro" (raciocina mais)

// Endereço(s) do seu site que TÊM PERMISSÃO de falar com este servidor.
// Isso impede que sites estranhos usem sua API e gastem seus créditos.
// Coloque aqui o endereço do site quando ele estiver hospedado (ex. Netlify).
// Enquanto estiver testando, pode deixar o '*' que libera geral — mas o ideal
// é trocar pelo endereço real depois.
const SITES_PERMITIDOS = [
    // 'https://seu-site.netlify.app',   // <- descomente e troque pelo seu link
    // 'http://localhost:5500',          // <- se testar abrindo o html no PC
];

// Quanto tempo guardar o histórico do paciente (em segundos). 259200 = 72 horas.
const TEMPO_HISTORICO = 259200;

// ----------------------------------------------------------------------------

// Configuração de quem pode acessar (CORS).
// Se você não listou nenhum site acima, libera geral (modo de teste).
if (SITES_PERMITIDOS.length === 0) {
    app.use(cors());
} else {
    app.use(cors({ origin: SITES_PERMITIDOS }));
}

// Verifica logo na partida se a chave da IA foi configurada no Render.
// Se faltar, o servidor avisa claramente em vez de quebrar misteriosamente.
if (!process.env.GEMINI_API_KEY) {
    console.error('ATENÇÃO: a variável GEMINI_API_KEY não foi configurada no Render. A IA não vai funcionar.');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const patientCache = new NodeCache({ stdTTL: TEMPO_HISTORICO, checkperiod: 3600 });

// ----------------------------------------------------------------------------
//  TRAVA SIMPLES CONTRA ABUSO (limite de pedidos por minuto)
//  Sem depender de bibliotecas extras: conta quantos pedidos cada
//  computador faz por minuto e bloqueia se passar do limite.
// ----------------------------------------------------------------------------
const contadorPedidos = new NodeCache({ stdTTL: 60, checkperiod: 30 });
const LIMITE_POR_MINUTO = 20;

function limitarAbuso(req, res, next) {
    const quemEsta = req.ip || 'desconhecido';
    const atual = contadorPedidos.get(quemEsta) || 0;
    if (atual >= LIMITE_POR_MINUTO) {
        return res.status(429).json({ erro: 'Muitos pedidos em pouco tempo. Aguarde um minuto e tente de novo.' });
    }
    contadorPedidos.set(quemEsta, atual + 1);
    next();
}

// ----------------------------------------------------------------------------
//  FUNÇÕES AUXILIARES
// ----------------------------------------------------------------------------

// Transforma a lista de remédios num texto que a IA consegue ler.
// Agora inclui a VIA (oral, EV, IM...) quando ela existe, porque isso
// é importante pra segurança (uma medicação EV não pode virar comprimido).
function formatarFarmacia(lista) {
    return lista.map(item => {
        const via = item.via ? ` | via: ${item.via}` : '';
        const obs = item.observacao ? ` | obs: ${item.observacao}` : '';
        return `- ${item.nome} (${item.apresentacao})${via}${obs}`;
    }).join('\n');
}

// Pega só os NOMES dos remédios em letras minúsculas, pra conseguir
// comparar depois com o que a IA prescreveu.
function nomesDosMedicamentos(lista) {
    return lista.map(item => item.nome.toLowerCase());
}

// CAMADA DE CONFERÊNCIA FARMACOLÓGICA (a "rede de segurança" de verdade).
// Depois que a IA gera os documentos, esta função relê o que ela escreveu
// e tenta encontrar nomes de remédios que NÃO estão na lista da unidade.
// Não bloqueia nada sozinha — ela AVISA o médico pra ele conferir.
// É uma conferência por palavra-chave: não é perfeita, mas pega muita coisa.
function conferirMedicamentos(textoGerado, listaUnidade) {
    if (!textoGerado) return [];

    // Lista de "primeiras palavras" dos remédios da unidade (ex: "dipirona",
    // "amoxicilina"). A ideia é reconhecer o princípio ativo mesmo que a IA
    // escreva a dose diferente.
    const principiosDisponiveis = new Set();
    listaUnidade.forEach(item => {
        const primeira = item.nome.toLowerCase().split(/[\s0-9]/)[0];
        if (primeira && primeira.length > 3) principiosDisponiveis.add(primeira);
    });

    const alertas = [];
    const linhas = textoGerado.split('\n');
    linhas.forEach(linha => {
        const minuscula = linha.toLowerCase();
        // Heurística simples: linhas de prescrição costumam ter mg, ml, comp, etc.
        const pareceMedicacao = /\d+\s*(mg|ml|mcg|g|ui|gota|comp|cp|amp)/i.test(minuscula);
        if (!pareceMedicacao) return;

        const algumBate = [...principiosDisponiveis].some(p => minuscula.includes(p));
        if (!algumBate) {
            const limpa = linha.trim();
            if (limpa.length > 0) alertas.push(limpa);
        }
    });
    return alertas;
}

// ----------------------------------------------------------------------------
//  ROTA PRINCIPAL: recebe o caso e devolve os documentos.
// ----------------------------------------------------------------------------
app.post('/api/atendimento', limitarAbuso, async (req, res) => {
    try {
        const { beId, mensagem, unidade, opcoes, modeloId } = req.body;

        // --- Conferências de entrada (evita quebrar com dados faltando) ---
        if (!beId || !mensagem) {
            return res.status(400).json({ erro: 'Número do BE e relato são obrigatórios.' });
        }
        if (unidade !== 'ACRIZIO' && unidade !== 'BARREIRO') {
            return res.status(400).json({ erro: 'Unidade inválida. Selecione Acrízio ou Barreiro.' });
        }
        // Se as opções não vierem, assume um padrão seguro (só o prontuário).
        const op = opcoes || { prontuario: true, alta: false, relatorio: false, correcao: false };

        // Escolhe o modelo. Qualquer coisa diferente de 'flash' usa o profundo.
        const modelToUse = modeloId === 'flash' ? MODELO_RAPIDO : MODELO_PROFUNDO;
        const model = genAI.getGenerativeModel({ model: modelToUse });

        // Histórico do paciente (admissão x evolução).
        let historicoPaciente = patientCache.get(beId) || [];
        let tipoAtendimento = historicoPaciente.length > 0
            ? 'EVOLUÇÃO (Retorno com exames/reavaliação)'
            : 'ADMISSÃO (Primeiro Contato)';
        if (historicoPaciente.length > 0) patientCache.ttl(beId, TEMPO_HISTORICO);

        // Monta o texto da farmácia da unidade escolhida.
        const listaUnidade = unidade === 'BARREIRO' ? medicamentosBarreiro : medicamentosAcrizioMenezes;
        const tituloFarmacia = unidade === 'BARREIRO'
            ? 'MEDICAMENTOS DISPONÍVEIS (REMUME PBH - SECUNDÁRIA/URGÊNCIA):'
            : 'MEDICAMENTOS DISPONÍVEIS (PADRONIZAÇÃO UPA ACRÍZIO):';
        const contextoFarmacologico = `${tituloFarmacia}\n${formatarFarmacia(listaUnidade)}`;

        // Monta as instruções do que gerar.
        let instrucoesAcao = 'O médico solicitou as seguintes criações. GERE TODAS COM ABSOLUTA CONGRUÊNCIA CLÍNICA:\n';
        if (op.correcao) {
            instrucoesAcao = '⚠️ MODO DE CORREÇÃO: O médico identificou um erro ou pediu alteração. REESCREVA APENAS os documentos marcados aplicando a correção.\n\n';
        }
        if (op.prontuario) instrucoesAcao += '- PRONTUÁRIO e PRESCRIÇÃO INTERNA DA UPA.\n';
        if (op.alta) instrucoesAcao += '- RECEITA DE ALTA.\n';
        if (op.relatorio) instrucoesAcao += '- RELATÓRIO APS.\n';

        // ------------------------------------------------------------------
        //  O PROMPT (as ordens que a IA recebe). Reorganizado e numerado certo.
        // ------------------------------------------------------------------
        const promptFinal = `Você é um médico assistente de retaguarda em uma UPA.
UNIDADE ATUAL: ${unidade}
TIPO DE ATENDIMENTO: ${tipoAtendimento}

${contextoFarmacologico}

REGRAS OBRIGATÓRIAS E FORMATAÇÃO:

1. SAÍDA EXIGIDA (JSON puro): retorne um objeto com as chaves "discussao", "prontuario", "prescricao_interna", "receita", "relatorio". Deixe o valor como texto vazio "" para qualquer documento que NÃO foi solicitado.

2. DISCUSSÃO (direta e concisa):
   - Evite blocos densos. Vá direto ao ponto.
   - Pule uma linha (\\n\\n) entre os tópicos.
   - Siga este template:
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

3. PRONTUÁRIO (estrutura completa):
   - Siga rigorosamente a ordem: QP, HMA, HP, EF, HD e OBRIGATORIAMENTE inclua a seção "CD:" (Conduta), descrevendo exatamente as medicações e ações tomadas na UPA.
   - Pule uma linha (\\n\\n) entre cada seção, para ficar legível no SIGRAH.

4. PRESCRIÇÃO INTERNA (na UPA):
   - Prescreva APENAS medicamentos que estão na lista acima desta unidade.
   - Respeite a VIA indicada na lista (uma medicação marcada como EV não vira comprimido).
   - Respeite tempos de infusão reais (ex: Ciprofloxacino NÃO corre em 30 min).
   - Se o médico pediu algo que não existe na unidade, escolha a alternativa equivalente que existe e explique a troca na DISCUSSÃO.

5. RECEITA DOMICILIAR (padrão impresso):
   - Agrupe OBRIGATORIAMENTE por via de administração: escreva "USO ORAL", "USO TÓPICO", "USO INJETÁVEL" no topo de cada bloco.
   - PROIBIDO inserir textos burocráticos ou justificativas sobre falta de medicação no SUS/UPA na receita do paciente. As orientações devem ser puramente médicas (repouso, hidratação, sinais de alarme).
   - Não prescreva medicações de alto custo indisponíveis no SUS para casa sem alertar na DISCUSSÃO.

6. RELATÓRIO APS (de médico para médico):
   - NÃO copie o prontuário. NÃO use tópicos como "História" ou "Exame Físico".
   - Escreva um PARÁGRAFO ÚNICO, curto e direto, iniciando com "Colega, paciente avaliado nesta UPA por...".
   - Resuma a hipótese, o manejo agudo realizado na UPA e o motivo do encaminhamento.

DIRETRIZ DA AÇÃO:
${instrucoesAcao}

HISTÓRICO DO PACIENTE (atendimentos anteriores neste BE):
${JSON.stringify(historicoPaciente)}

MENSAGEM DO MÉDICO:
${mensagem}`;

        // Chama a IA. Agora com:
        //  - responseMimeType: força resposta em formato JSON.
        //  - maxOutputTokens: garante espaço pra resposta longa não ser cortada.
        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: promptFinal }] }],
            generationConfig: {
                responseMimeType: 'application/json',
                maxOutputTokens: 8192,
                temperature: 0.4
            }
        });

        // ------------------------------------------------------------------
        //  LEITURA DA RESPOSTA — agora com proteção contra resposta quebrada.
        // ------------------------------------------------------------------
        const textoBruto = result.response.text();
        let jsonParseado;
        try {
            jsonParseado = JSON.parse(textoBruto);
        } catch (erroParse) {
            // Se a IA devolveu algo que não é JSON válido (acontece quando a
            // resposta é cortada), a gente registra o que veio e avisa o médico
            // com clareza, em vez de só dizer "falha".
            console.error('A IA devolveu um texto que não é JSON válido. Texto recebido:\n', textoBruto);
            return res.status(502).json({
                erro: 'A IA devolveu uma resposta incompleta ou fora do formato. Tente enviar de novo (caso muito longo pode precisar dividir em partes).'
            });
        }

        // ------------------------------------------------------------------
        //  REDE DE SEGURANÇA: confere se algum remédio prescrito não está
        //  na lista da unidade e, se achar, adiciona um aviso na discussão.
        // ------------------------------------------------------------------
        const textoParaConferir = [jsonParseado.prescricao_interna, jsonParseado.receita]
            .filter(Boolean)
            .join('\n');
        const alertas = conferirMedicamentos(textoParaConferir, listaUnidade);
        if (alertas.length > 0) {
            const aviso = '\n\n⚠️ CONFERÊNCIA AUTOMÁTICA (verifique pessoalmente): os itens abaixo podem não constar na padronização desta unidade. Confira antes de prescrever:\n- '
                + alertas.join('\n- ');
            jsonParseado.discussao = (jsonParseado.discussao || '') + aviso;
        }

        // Guarda este atendimento no histórico do paciente.
        historicoPaciente.push({ medico: mensagem, comandos: op, resposta: jsonParseado });
        patientCache.set(beId, historicoPaciente);

        res.json(jsonParseado);

    } catch (error) {
        console.error('Erro no processamento:', error);
        res.status(500).json({ erro: 'Falha no processamento. Tente novamente em instantes.' });
    }
});

// Rota simples só pra checar se o servidor está vivo (útil no Render).
app.get('/', (req, res) => res.send('Servidor do Prontuário Rápido está no ar.'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Servidor rodando na porta ' + PORT));
