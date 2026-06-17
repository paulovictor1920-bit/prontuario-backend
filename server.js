// ============================================================================
//  PRONTUÁRIO RÁPIDO - SERVIDOR (BACKEND) - v5
//
//  Novidades da v5 (17/jun/2026) — seis ajustes de qualidade dos documentos:
//   1) RECEITA DOMICILIAR: passa a terminar SEMPRE com um bloco curto de
//      ORIENTAÇÕES NÃO MEDICAMENTOSAS (3 a 4 itens no máximo).
//   2) CONDUTAS mais enxutas: as medicações feitas NA UNIDADE são agrupadas
//      em UMA ÚNICA linha (em vez de uma linha por fármaco), reduzindo o
//      tamanho do texto.
//   3) TEMPO VERBAL no prontuário: usar "administrar/fazer/realizar"
//      (o prontuário é redigido ANTES de a conduta ser executada), NUNCA
//      "administrado/feito/realizado". Reforço no prompt + função
//      preferirInfinitivoConduta no servidor.
//   4) PRESCRIÇÃO INTERNA: a quantidade de AMPOLAS/FRASCOS é sempre explícita
//      (ex.: "1 ampola (2 mL)"), nunca só o volume.
//   5) RECEITA sem dose flexível: posologia fechada ("tomar 1" OU "tomar 2"),
//      nunca "tomar 1 a 2 comprimidos" — a decisão é do médico, não do
//      paciente. Reforço no prompt + função fecharDoseFlexivel no servidor.
//   6) SINAIS VITAIS no ACRÍZIO: a TELA passa a exibi-los como PRIMEIRA LINHA
//      do exame físico (sem quadro/título separado). No Barreiro continua em
//      quadro próprio. (mudança só no index.html)
//   7) HISTÓRICO ENXUTO NO PROMPT: o que é COLADO no prompt da IA passa a ser
//      admissão completa + 2 últimas etapas completas + resumo de 1 linha das
//      etapas do meio. O Redis CONTINUA guardando a pilha inteira (intacta) —
//      muda só o que é enviado ao modelo (mais rápido, menos repetição de dado
//      antigo). Degrada para "pilha completa" em qualquer erro.
//   8) BLOCO MANCHESTER mais enxuto: removido o exemplo concreto de 6 linhas;
//      o formato segue totalmente especificado por rótulos. A INSTRUÇÃO de
//      avaliar todo paciente, a regra "só alerte se for red flag real" e o
//      marcador [[VERMELHO]] permanecem INALTERADOS.
//   9) DISCUSSÃO MAIS PROFUNDA (Movimentos 2 e 3): a instrução do campo
//      "discussao" foi reescrita para puxar RACIOCÍNIO (diferenciais com o que
//      favorece/afasta, can't-miss, "e-se" que muda conduta, justificativa
//      terapêutica), com PROFUNDIDADE PROPORCIONAL AO CASO — breve no trivial,
//      densa quando há red flag/dúvida. Não mexe em formatação.
//  10) FORMATAÇÃO ESTRUTURAL NO SERVIDOR (Movimento 1): três limpezas
//      MECÂNICAS (limparCabecalhoConduta, normalizarSeparadorVitais,
//      removerCidVazado) garantem no servidor formatos antes só pedidos no
//      prompt. Isso permitiu ALIVIAR o prompt dessas regras de aparência
//      (devolvendo atenção ao raciocínio) SEM perder a formatação, que agora é
//      garantida de forma determinística. Regras que dependem de juízo clínico
//      continuam no prompt.
//
//  Novidades da v4 (10/jun/2026):
//   - SENHA DE ACESSO: toda rota /api agora exige a senha (variável de
//     ambiente SENHA_ACESSO no Render; a tela envia no cabeçalho "x-senha").
//   - FOTOS DE DOCUMENTOS: a tela pode anexar fotos (exames, prontuários,
//     evoluções); a IA as lê conforme a instrução do médico. Fotos NUNCA são
//     gravadas no histórico de 72h.
//   - PONTE celular -> computador POR CÓDIGO: o celular "estaciona" até 9
//     fotos no Redis (30 min) e recebe um CÓDIGO de 4 dígitos; o outro
//     aparelho digita o código e as fotos aparecem anexadas (uso único).
//   - buscarDiluicao corrigida: casa por PALAVRA INTEIRA (antes, substring
//     podia associar a diluição de um fármaco parecido ao fármaco errado).
//
//  Novidades desta versão:
//   - Saída do prontuário FATIADA nos campos do SIGRAH (modo Barreiro):
//     história clínica, pregressa, exame físico, hipótese, CID, conduta.
//   - Sinais vitais separados do texto do exame físico (sem redundância).
//   - CID extraído num campo próprio (além de aparecer na discussão).
//   - Diluição de injetáveis (só Barreiro): consultada na tabela de
//     referência. O sistema NUNCA inventa diluição.
// ============================================================================

const express = require('express');
const cors = require('cors');
const NodeCache = require('node-cache');
const Redis = require('ioredis');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const { medicamentosAcrizioMenezes, medicamentosBarreiro } = require('./farmacia');
const { diluicoesBarreiro } = require('./diluicoes');

const app = express();
//  Limite do corpo aumentado: a tela agora pode enviar FOTOS de documentos
//  (já comprimidas no navegador) junto com o pedido.
app.use(express.json({ limit: '20mb' }));

// ----------------------------------------------------------------------------
//  CONFIGURAÇÕES (tudo num lugar só)
// ----------------------------------------------------------------------------
//  Modelos do Gemini (versões estáveis confirmadas jun/2026).
//  Para subir o Pro no futuro, troque por 'gemini-3.1-pro' quando virar estável.
const MODELO_RAPIDO = 'gemini-3.5-flash';
const MODELO_PROFUNDO = 'gemini-2.5-pro';

//  Modelo do Claude (Anthropic) — usado como ALTERNATIVA ao Gemini.
//  Serve para dois fins: (1) você pode escolhê-lo manualmente na tela; (2) se o
//  Gemini falhar com sobrecarga (erro 503), o servidor cai pro Claude sozinho.
const MODELO_CLAUDE = 'claude-opus-4-8';

// Sites autorizados a usar a API. Vazio = libera geral (modo teste).
// Abaixo esta o link do seu site (GitHub Pages), ja configurado.
const SITES_PERMITIDOS = [
    'https://paulovictor1920-bit.github.io',
];

const TEMPO_HISTORICO = 259200; // 72 horas em segundos

// ----------------------------------------------------------------------------

if (SITES_PERMITIDOS.length === 0) {
    app.use(cors());
} else {
    app.use(cors({ origin: SITES_PERMITIDOS }));
}

// ----------------------------------------------------------------------------
//  SENHA DE ACESSO (protege a API contra uso por estranhos)
// ----------------------------------------------------------------------------
//  O CORS só barra chamadas feitas POR NAVEGADOR a partir de outros sites; quem
//  descobrisse a URL do Render ainda conseguiria chamar a API direto (por
//  script) e queimar os créditos pagos das IAs. Esta trava exige senha em TODA
//  rota /api: a tela envia a senha no cabeçalho "x-senha" e o servidor confere
//  com a variável de ambiente SENHA_ACESSO (criada no Render, nunca no código).
//
//  IMPORTANTE: se a variável NÃO existir, o sistema funciona ABERTO como antes
//  (com aviso no log). Assim você pode subir este código primeiro e criar a
//  variável depois, sem risco de ficar trancado para fora.
if (!process.env.SENHA_ACESSO) {
    console.error('ATENÇÃO: SENHA_ACESSO não configurada no Render. A API está ABERTA (sem senha). Crie a variável para proteger seus créditos de IA.');
}
function exigirSenha(req, res, next) {
    if (!process.env.SENHA_ACESSO) return next(); // sem variável = modo aberto
    const enviada = req.headers['x-senha'] || '';
    if (enviada === process.env.SENHA_ACESSO) return next();
    return res.status(401).json({ erro: 'SENHA_INVALIDA' });
}
app.use('/api', exigirSenha);

if (!process.env.GEMINI_API_KEY) {
    console.error('ATENÇÃO: GEMINI_API_KEY não configurada no Render. A IA não vai funcionar.');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

//  Chave da Anthropic (Claude). Igual à do Gemini, fica no Render como variável
//  de ambiente ANTHROPIC_API_KEY — NUNCA escrita no código. Sem ela, o Claude
//  (escolha manual, fallback e comparação) não funciona, mas o Gemini continua
//  normal.
if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ATENÇÃO: ANTHROPIC_API_KEY não configurada no Render. O Claude (alternativa/fallback/comparação) não vai funcionar; o Gemini segue normal.');
}

// ----------------------------------------------------------------------------
//  HISTÓRICO PERSISTENTE (Redis / Upstash)
// ----------------------------------------------------------------------------
//  Antes o histórico ficava só na MEMÓRIA do Render (node-cache) e SUMIA quando
//  o servidor hibernava. Agora fica num Redis externo (Upstash, gratuito), que
//  NÃO morre quando o Render dorme. As 72h continuam valendo: o Redis expira
//  cada BE sozinho (TTL). Guardamos só BE + sexo + idade + atendimento — NUNCA
//  o nome do paciente (LGPD), igual antes.
//
//  RESILIÊNCIA: se o Redis estiver fora do ar ou sem senha configurada, o
//  atendimento NÃO quebra — o documento é gerado e entregue normalmente; apenas
//  o salvamento/leitura do histórico fica indisponível. Gerar o documento no
//  plantão é mais importante que guardar o histórico.
//
//  A senha de conexão vem da variável de ambiente REDIS_URL (configurada no
//  Render, igual à GEMINI_API_KEY). Nunca fica escrita no código.
let redis = null;
let redisOk = false;
if (process.env.REDIS_URL) {
    try {
        redis = new Redis(process.env.REDIS_URL, {
            // Não deixa o app travar tentando reconectar pra sempre.
            maxRetriesPerRequest: 2,
            connectTimeout: 4000,
            lazyConnect: false,
        });
        redis.on('ready', () => { redisOk = true; console.log('Redis (histórico) conectado.'); });
        redis.on('error', (e) => { redisOk = false; console.error('Redis indisponível:', e.message); });
    } catch (e) {
        console.error('Falha ao iniciar Redis:', e.message);
        redis = null;
    }
} else {
    console.error('ATENÇÃO: REDIS_URL não configurada. O histórico (reabrir BE / linha do tempo / recentes) ficará indisponível até configurar.');
}

const CHAVE_RECENTES = 'recentes'; // sorted set: score = timestamp, membro = BE

// Lê a pilha de atendimentos de um BE. Retorna [] se não houver ou se o Redis
// estiver fora (degradação elegante).
async function lerHistorico(beId) {
    if (!redis) return [];
    try {
        const txt = await redis.get('be:' + beId);
        return txt ? JSON.parse(txt) : [];
    } catch (e) {
        console.error('Erro ao ler histórico do Redis:', e.message);
        return [];
    }
}

// Grava a pilha de um BE, renova as 72h e atualiza a lista de recentes.
// Guarda nos recentes só metadados leves (BE/sexo/idade/quando) — sem clínica.
async function salvarHistorico(beId, pilha, sexo, idade, quando) {
    if (!redis) return false;
    try {
        const ts = quando || Date.now();
        await redis.set('be:' + beId, JSON.stringify(pilha), 'EX', TEMPO_HISTORICO);
        // O MEMBRO do sorted set é só o BE (único): regravar o mesmo BE atualiza
        // o score (sobe ao topo) sem duplicar. Os metadados leves (sexo/idade)
        // ficam num hash à parte, também com 72h de validade.
        await redis.zadd(CHAVE_RECENTES, ts, String(beId));
        await redis.set('meta:' + beId,
            JSON.stringify({ sexo: sexo || '', idade: (idade !== undefined ? idade : '') }),
            'EX', TEMPO_HISTORICO);
        // Mantém a lista de recentes enxuta (últimos 50; a tela mostra 8).
        await redis.zremrangebyrank(CHAVE_RECENTES, 0, -51);
        return true;
    } catch (e) {
        console.error('Erro ao salvar histórico no Redis:', e.message);
        return false;
    }
}

// ----------------------------------------------------------------------------
//  PONTE DE FOTOS celular -> computador (temporária, no Redis, POR CÓDIGO)
// ----------------------------------------------------------------------------
//  O celular envia as fotos e recebe um CÓDIGO de 4 números; o outro aparelho
//  digita o código e baixa as fotos — não precisa do BE. Tudo fica no Redis
//  por NO MÁXIMO 30 minutos e é APAGADO assim que usado num atendimento (o
//  TTL apaga sozinho o que sobrar). Fotos NUNCA entram no histórico de 72h.
//
//  IMPORTANTE (plano gratuito do Upstash): há limite de ~1 MB por gravação.
//  Por isso, CADA FOTO fica num registro próprio ("foto:<código>:<id>") e o
//  registro "fotos:<código>" guarda só o ÍNDICE leve (ids e metadados).
const TEMPO_FOTO = 1800;                    // 30 minutos, em segundos
const MAX_FOTOS_POR_CODIGO = 9;             // máximo de fotos por código
const TIPOS_IMAGEM = ['image/jpeg', 'image/png', 'image/webp'];
const TAMANHO_MAX_FOTO_PONTE = 1000 * 1024; // ~1 MB em base64 por foto (a tela comprime para <=950 KB; cabe na gravação de 1 MB do Upstash)
const TAMANHO_MAX_FOTO = 2 * 1024 * 1024;   // limite por foto anexada num atendimento

//  Gera um código de 4 números que ainda não esteja em uso e já cria o índice
//  vazio (com validade de 30 min). Devolve o código ou null se não conseguir.
async function gerarCodigoPonte() {
    if (!redis) return null;
    try {
        for (let i = 0; i < 25; i++) {
            const c = String(Math.floor(1000 + Math.random() * 9000));
            const existe = await redis.exists('fotos:' + c);
            if (!existe) {
                await redis.set('fotos:' + c, JSON.stringify([]), 'EX', TEMPO_FOTO);
                return c;
            }
        }
    } catch (e) {
        console.error('Erro ao gerar código da ponte:', e.message);
    }
    return null;
}

//  Lê o ÍNDICE de um código. Devolve null se o código não existe/expirou
//  (diferente de [] = código válido, ainda sem fotos).
async function lerIndicePonte(codigo) {
    if (!redis) return null;
    try {
        const txt = await redis.get('fotos:' + codigo);
        return txt === null ? null : JSON.parse(txt);
    } catch (e) {
        console.error('Erro ao ler índice da ponte:', e.message);
        return null;
    }
}

//  Guarda UMA foto sob um código. Devolve { id, pendentes } ou { erro }.
async function guardarFotoPonte(codigo, mimeType, data) {
    const indice = await lerIndicePonte(codigo);
    if (indice === null) {
        return { erro: 'Código inválido ou expirado (vale 30 minutos). Gere um novo código no outro aparelho.' };
    }
    if (indice.length >= MAX_FOTOS_POR_CODIGO) {
        return { erro: 'Este código já tem ' + MAX_FOTOS_POR_CODIGO + ' fotos (limite). Gere um novo código para enviar mais.' };
    }
    try {
        const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
        await redis.set('foto:' + codigo + ':' + id, data, 'EX', TEMPO_FOTO);
        indice.push({ id, mimeType, quando: Date.now() });
        await redis.set('fotos:' + codigo, JSON.stringify(indice), 'EX', TEMPO_FOTO);
        return { id, pendentes: indice.length };
    } catch (e) {
        console.error('Erro ao guardar foto na ponte:', e.message);
        return { erro: 'Não foi possível guardar a foto agora. Tente de novo em instantes.' };
    }
}

//  Lê TODAS as fotos de um código (índice + conteúdo de cada uma).
//  Devolve null se o código não existe/expirou.
async function lerFotosPonte(codigo) {
    const indice = await lerIndicePonte(codigo);
    if (indice === null) return null;
    const fotos = [];
    for (const m of indice) {
        try {
            const data = await redis.get('foto:' + codigo + ':' + m.id);
            if (data) fotos.push({ id: m.id, mimeType: m.mimeType, quando: m.quando, data });
        } catch (e) { /* foto individual expirada: segue para as demais */ }
    }
    return fotos;
}

//  Apaga fotos de um código: ids específicos, ou TODAS (se ids vier vazio).
async function apagarFotosPonte(codigo, ids) {
    if (!redis) return;
    try {
        const indice = await lerIndicePonte(codigo);
        if (indice === null) return;
        const apagarTodas = !ids || ids.length === 0;
        const remover = apagarTodas ? indice.map(m => m.id) : ids;
        for (const id of remover) {
            await redis.del('foto:' + codigo + ':' + id);
        }
        const restantes = apagarTodas ? [] : indice.filter(m => !remover.includes(m.id));
        if (restantes.length === 0) {
            await redis.del('fotos:' + codigo);
        } else {
            await redis.set('fotos:' + codigo, JSON.stringify(restantes), 'EX', TEMPO_FOTO);
        }
    } catch (e) {
        console.error('Erro ao apagar fotos da ponte:', e.message);
    }
}

// Trava simples anti-abuso (pedidos por minuto por IP).
// Continua em memória local: pode ser volátil sem problema.
const contadorPedidos = new NodeCache({ stdTTL: 60, checkperiod: 30 });
const LIMITE_POR_MINUTO = 20;
function limitarAbuso(req, res, next) {
    const quem = req.ip || 'desconhecido';
    const atual = contadorPedidos.get(quem) || 0;
    if (atual >= LIMITE_POR_MINUTO) {
        return res.status(429).json({ erro: 'Muitos pedidos em pouco tempo. Aguarde um minuto.' });
    }
    contadorPedidos.set(quem, atual + 1);
    next();
}


// ----------------------------------------------------------------------------
//  FUNÇÕES AUXILIARES
// ----------------------------------------------------------------------------

// Remove acentos pra facilitar comparação de nomes de remédios.
function semAcento(txt) {
    return (txt || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

// Transforma a lista de remédios da unidade em texto pra IA ler.
function formatarFarmacia(lista) {
    return lista.map(item => {
        const via = item.via ? ` | via: ${item.via}` : '';
        const obs = item.observacao ? ` | obs: ${item.observacao}` : '';
        return `- ${item.nome} (${item.apresentacao})${via}${obs}`;
    }).join('\n');
}

// Procura a diluição de um medicamento na tabela de referência (Barreiro).
// Compara pelo princípio ativo (primeira palavra). Retorna o objeto ou null.
// NUNCA inventa: se não achar, devolve null e o sistema avisa pra conferir.
//  CORRIGIDO (10/jun): antes casava por "contém" (substring), o que podia
//  associar a diluição de um fármaco PARECIDO ao fármaco errado — e diluição
//  errada com cara de oficial é pior que diluição ausente. Agora o princípio
//  ativo só casa como PALAVRA INTEIRA dentro da linha prescrita (mesmo padrão
//  já usado na conferência farmacológica).
function buscarDiluicao(nomeMedicamento) {
    const alvo = semAcento(nomeMedicamento);
    let melhor = null;
    diluicoesBarreiro.forEach(item => {
        const pa = semAcento(item.principio).trim();
        if (pa.length <= 3) return;
        // Palavra inteira: o princípio precisa estar cercado por início/fim de
        // linha ou por caracteres que não sejam letras (espaço, número, vírgula).
        const paEscapado = pa.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp('(^|[^a-z])' + paEscapado + '($|[^a-z])');
        if (regex.test(alvo)) {
            // se houver vários, prefere o de nome mais longo (mais específico)
            if (!melhor || pa.length > semAcento(melhor.principio).length) {
                melhor = item;
            }
        }
    });
    return melhor;
}

// Monta um texto de diluição legível a partir do registro da tabela.
function textoDiluicao(reg) {
    const partes = [];
    if (reg.via) partes.push(`Via: ${reg.via}`);
    if (reg.reconstituicao) partes.push(`Reconstituição: ${reg.reconstituicao}`);
    if (reg.diluicao) partes.push(`Diluição: ${reg.diluicao}`);
    if (reg.concentracaoMaxima) partes.push(`Conc. máx.: ${reg.concentracaoMaxima}`);
    if (reg.tempoInfusao) partes.push(`Tempo/velocidade: ${reg.tempoInfusao}`);
    if (reg.observacao) partes.push(`Obs.: ${reg.observacao}`);
    return partes.join(' | ');
}

// Detecta se uma linha de texto parece conter uma medicação (tem mg, ml, etc).
function pareceMedicacao(linha) {
    return /\d+\s*(mg|ml|mcg|g|ui|gota|comp|cp|amp|frasco)/i.test(linha);
}

// PREFERÊNCIA DE TERMO: o médico prefere "inalação" a "nebulização" para
// broncodilatadores (salbutamol/fenoterol/ipratrópio etc.). A IA às vezes
// insiste em "nebulização". Esta função troca a palavra na saída — cinto e
// suspensório, além da instrução no prompt. Troca só a forma da palavra,
// preservando o resto do texto (maiúsc./minúsc. aproximada).
function preferirInalacao(txt) {
    if (!txt || typeof txt !== 'string') return txt;
    return txt
        .replace(/nebuliza[çc][ãa]o/gi, (m) => (m[0] === m[0].toUpperCase() ? 'Inalação' : 'inalação'))
        .replace(/nebuliza[çc][õo]es/gi, (m) => (m[0] === m[0].toUpperCase() ? 'Inalações' : 'inalações'))
        .replace(/nebulizar/gi, (m) => (m[0] === m[0].toUpperCase() ? 'Inalar' : 'inalar'))
        .replace(/nebulizad[ao]s?/gi, (m) => (m[0] === m[0].toUpperCase() ? 'Inalado' : 'inalado'));
}

// TEMPO VERBAL DA CONDUTA: o prontuário é redigido ANTES de a conduta ser
// executada (sai junto com a prescrição interna, para só DEPOIS ser realizada).
// Por isso a conduta deve usar o INFINITIVO ("administrar", "fazer", "realizar")
// e NUNCA o particípio ("administrado", "feito", "realizado"), que daria a
// entender que a ação já ocorreu antes do registro. A IA às vezes escorrega
// para o particípio; esta função troca à força os verbos mais comuns na saída.
// Cinto e suspensório, além da instrução no prompt.
//
// CUIDADO: troca SÓ formas de conduta/ação. NÃO mexe em termos clínicos do
// exame ("orientado", "hidratado", "corado" etc.) nem em "medicado/sedado"
// — só nos verbos de execução de conduta listados abaixo.
function preferirInfinitivoConduta(txt) {
    if (!txt || typeof txt !== 'string') return txt;
    // pares: particípio (regex) -> infinitivo. Preserva maiúscula inicial.
    const trocas = [
        [/\badministrad[ao]s?\b/gi, 'administrar'],
        [/\brealizad[ao]s?\b/gi, 'realizar'],
        [/\bprescrit[ao]s?\b/gi, 'prescrever'],
        [/\bsolicitad[ao]s?\b/gi, 'solicitar'],
        [/\bencaminhad[ao]s?\b/gi, 'encaminhar'],
        [/\biniciad[ao]s?\b/gi, 'iniciar'],
        [/\baplicad[ao]s?\b/gi, 'aplicar'],
        [/\bpuncionad[ao]s?\b/gi, 'puncionar'],
        [/\bmonitorizad[ao]s?\b/gi, 'monitorizar'],
        [/\bfeit[ao]s?\b/gi, 'fazer'],
    ];
    let saida = txt;
    trocas.forEach(([re, inf]) => {
        saida = saida.replace(re, (m) => {
            // Mantém a primeira letra maiúscula se a original começava maiúscula.
            return (m[0] === m[0].toUpperCase())
                ? inf.charAt(0).toUpperCase() + inf.slice(1)
                : inf;
        });
    });
    return saida;
}

// RECEITA SEM DOSE FLEXÍVEL: uma receita correta não delega a decisão da dose
// ao paciente. "Tomar 1 a 2 comprimidos" ou "1-2 comprimidos" deve virar uma
// dose fechada. Como o servidor não tem critério clínico para escolher entre 1
// e 2, ele fecha pela MENOR dose (a mais segura) e o médico ajusta se quiser.
// Cobre os padrões mais comuns: "1 a 2", "1-2", "1 ou 2" seguidos de unidade.
function fecharDoseFlexivel(txt) {
    if (!txt || typeof txt !== 'string') return txt;
    const unidade = '(comprimidos?|comp\\.?|cp|c[áa]psulas?|gotas?|jatos?|borrifadas?|m[ée]didas?|colheres?(?:\\s+(?:de\\s+)?(?:ch[áa]|sopa))?|ml|mL)';
    // Após fechar a faixa, se o número virou "1", coloca a unidade no singular
    // (ex.: "1 comprimidos" -> "1 comprimido"). Não mexe em ml/mL (invariável).
    const singularizar = (num, uni) => {
        if (String(num) === '1') {
            const u = uni
                .replace(/colheres/i, 'colher')
                .replace(/s$/i, '');
            return num + ' ' + u;
        }
        return num + ' ' + uni;
    };
    // "1 a 2 comprimidos" / "1 à 2 comprimidos"
    let saida = txt.replace(
        new RegExp('(\\d+)\\s*[aà]\\s*\\d+\\s+(' + unidade + ')', 'gi'),
        (_m, num, uni) => singularizar(num, uni)
    );
    // "1-2 comprimidos" / "1–2"
    saida = saida.replace(
        new RegExp('(\\d+)\\s*[-–]\\s*\\d+\\s+(' + unidade + ')', 'gi'),
        (_m, num, uni) => singularizar(num, uni)
    );
    // "1 ou 2 comprimidos"
    saida = saida.replace(
        new RegExp('(\\d+)\\s+ou\\s+\\d+\\s+(' + unidade + ')', 'gi'),
        (_m, num, uni) => singularizar(num, uni)
    );
    return saida;
}

// ============================================================================
//  MOVIMENTO 1 — FORMATAÇÃO ESTRUTURAL GARANTIDA PELO SERVIDOR
// ----------------------------------------------------------------------------
//  Estas funções fazem só transformações MECÂNICAS de texto (sem qualquer
//  juízo clínico), garantindo no servidor formatos que antes dependiam de a IA
//  lembrar. Vantagem: o servidor é determinístico — nunca esquece, nunca fica
//  "esquisito". Isso permite ALIVIAR o prompt dessas regras de aparência,
//  devolvendo atenção do modelo ao raciocínio da discussão. NÃO entram aqui
//  regras que dependam de ENTENDER o conteúdo (ex.: quais ações agrupar) —
//  essas continuam no prompt, porque regex não tem critério clínico.
// ============================================================================

// Remove um cabeçalho redundante ("CD:", "CONDUTA:", "CONDUTAS:") no INÍCIO da
// conduta. O formato consagrado começa direto nos itens com hífen. Só mexe se o
// cabeçalho estiver logo no começo, seguido (ou não) de quebra de linha.
function limparCabecalhoConduta(txt) {
    if (!txt || typeof txt !== 'string') return txt;
    return txt.replace(/^\s*(cd|condutas?)\s*:?\s*\n?/i, '').replace(/^\s+/, '');
}

// Normaliza o separador dos sinais vitais para " | " consistente. A IA às vezes
// usa "/" ou ";" entre os itens. NÃO inventa nem remove valores — só padroniza
// o separador ENTRE itens já existentes. MUITO conservador: só troca ";" e "/"
// cercados por espaço (separadores inequívocos entre itens). NÃO mexe em hífen
// (ambíguo: "PA: 130-80"), nem em "/" colado (12/12h), nem em vírgula (decimal).
function normalizarSeparadorVitais(txt) {
    if (!txt || typeof txt !== 'string') return txt;
    let s = txt.trim();
    s = s.replace(/\s+[;/]\s+/g, ' | ');          // " ; " ou " / " entre itens
    s = s.replace(/\s*\|\s*/g, ' | ');             // padroniza espaçamento da barra
    s = s.replace(/(?: \| ){2,}/g, ' | ');         // colapsa barras repetidas
    return s.trim();
}

// Se um "CID: ..." vazou para dentro da conduta ou do exame físico (campos que
// NÃO devem conter o CID, pois ele tem campo próprio), remove essa linha.
// Conservador: só remove a LINHA que começa com "CID:" — não toca no resto.
function removerCidVazado(txt) {
    if (!txt || typeof txt !== 'string') return txt;
    return txt
        .split('\n')
        .filter(l => !/^\s*cid\s*:/i.test(l))
        .join('\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}
// O Redis continua guardando a pilha INTEIRA, intacta. Esta função só decide
// O QUE da pilha é colado no prompt da IA, para: (1) deixar o prompt menor e
// mais rápido; (2) reduzir o risco de a IA repetir dado antigo no documento
// novo. NÃO descarta informação do banco — só do texto enviado ao modelo.
//
// DESENHO SEGURO (o ponto crítico é não perder contexto clínico que decide
// conduta):
//   - A ADMISSÃO (primeira etapa) vai SEMPRE COMPLETA — é a âncora do caso
//     (alergias, comorbidades, exame inicial). Nunca é resumida.
//   - As 2 ÚLTIMAS etapas vão COMPLETAS — são as que importam para reavaliar
//     agora.
//   - As etapas do MEIO (entre a admissão e as 2 últimas) viram um RESUMO de
//     uma linha cada (data, tipo, e a conduta daquela etapa), só para registrar
//     que existiram e o que foi feito — sem o objeto inteiro.
//   - Se a pilha tem até 3 etapas, não há "meio": manda tudo completo (não vale
//     arriscar resumo quando o ganho é pequeno).
//
// Retorna SEMPRE um array (mesmo formato de antes), pronto para JSON.stringify.
// Em qualquer dúvida/erro, devolve a pilha original (degradação elegante:
// o pior caso é o comportamento de hoje, mandar tudo).
const ULTIMAS_COMPLETAS = 2; // quantas etapas finais vão completas
function resumirEtapaHistorico(etapa) {
    try {
        const r = etapa && etapa.resposta ? etapa.resposta : {};
        const conduta = (r.prontuario && r.prontuario.conduta) ? r.prontuario.conduta : '';
        const evol = r.evolucao || '';
        // Pega um resumo curto: a evolução (se houver) ou a conduta, encurtada.
        let trecho = (evol || conduta || '').replace(/\s+/g, ' ').trim();
        if (trecho.length > 240) trecho = trecho.slice(0, 240) + '…';
        const data = etapa && etapa.quando ? new Date(etapa.quando).toLocaleString('pt-BR') : '';
        return {
            _resumo: true,
            tipo: (etapa && etapa.tipo) ? etapa.tipo : 'prontuario',
            quando: data,
            resumo: trecho || '(sem conduta/evolução registrada)'
        };
    } catch (e) {
        return { _resumo: true, resumo: '(etapa anterior — resumo indisponível)' };
    }
}
function prepararHistoricoPrompt(pilha) {
    try {
        if (!Array.isArray(pilha)) return [];
        const n = pilha.length;
        // Até 3 etapas: manda tudo completo (não há meio que valha resumir).
        if (n <= ULTIMAS_COMPLETAS + 1) return pilha;
        const admissao = pilha[0];                       // âncora, completa
        const ultimas = pilha.slice(n - ULTIMAS_COMPLETAS); // recentes, completas
        const meio = pilha.slice(1, n - ULTIMAS_COMPLETAS); // resumir
        const meioResumido = meio.map(resumirEtapaHistorico);
        return [admissao, ...meioResumido, ...ultimas];
    } catch (e) {
        console.error('Falha ao enxugar histórico para o prompt; enviando pilha completa:', e.message);
        return Array.isArray(pilha) ? pilha : [];
    }
}
// remédios prescritos que talvez não estejam na farmácia da unidade. É um
// auxiliar de memória, NÃO uma verificação confiável: pode deixar passar item
// fora da lista (falso negativo) e pode alertar à toa (falso positivo). A
// conferência de verdade é sempre a sua, lendo a padronização.
//
// Melhorias frente à versão anterior (reduzir falso-alarme):
//  - casa por PALAVRA INTEIRA do princípio (não por "contém"), o que evita
//    casamentos espúrios entre nomes parecidos;
//  - ignora linhas que são claramente soro/diluente/veículo (SF, SG, água
//    destilada, ABD), que não são "medicação fora da lista";
//  - ignora linhas que são POSOLOGIA/INSTRUÇÃO de uso (começam com "Tomar",
//    "Inalar", "Aplicar"...), que não trazem o NOME do fármaco e geravam
//    alarme falso (ex.: "Tomar 20 gotas de 6/6h").
function conferirMedicamentos(texto, listaUnidade) {
    if (!texto) return [];
    const principios = new Set();
    listaUnidade.forEach(item => {
        const p = semAcento(item.nome).split(/[\s0-9]/)[0];
        if (p && p.length > 3) principios.add(p);
    });
    // Veículos/diluentes que NÃO devem disparar alerta de "fora da padronização".
    const ehVeiculo = (linha) => /(soro fisiol|\bsf\b|\bsg\b|glicos|cloreto de sodio|agua destil|\babd\b|ringer)/i.test(linha);
    // Linhas de POSOLOGIA/INSTRUÇÃO (começam com verbo de uso): não contêm o nome
    // do remédio, então NÃO devem ser conferidas (eram a causa do alarme falso).
    const ehPosologia = (linha) => /^\s*(tomar|inalar|aplicar|usar|pingar|fazer|repetir|administrar|instilar|diluir|manter|reavaliar|associar|suspender|iniciar|continuar|via|posologia|uso\b)/i.test(semAcento(linha));

    const alertas = [];
    texto.split('\n').forEach(linha => {
        if (!pareceMedicacao(linha)) return;
        if (ehVeiculo(semAcento(linha))) return;
        if (ehPosologia(linha)) return;
        const palavras = semAcento(linha).split(/[^a-z]+/).filter(Boolean);
        // casa se ALGUMA palavra inteira da linha for um princípio conhecido
        const conhecido = palavras.some(w => principios.has(w));
        if (!conhecido) {
            const t = linha.trim();
            if (t) alertas.push(t);
        }
    });
    return alertas;
}

// CONSTRÓI as diluições para os injetáveis prescritos (só Barreiro).
// Lê o texto da prescrição interna, acha as linhas injetáveis e, para cada
// uma, busca na tabela. Retorna:
//   - blocoSeparado: texto único com todas as diluições (campo à parte)
//   - naoEncontrados: lista de injetáveis sem diluição na tabela (alerta)
function montarDiluicoes(textoPrescricao) {
    const resultado = { blocoSeparado: '', naoEncontrados: [] };
    if (!textoPrescricao) return resultado;

    const linhas = textoPrescricao.split('\n');
    const blocos = [];
    const vistos = new Set();

    linhas.forEach(linha => {
        const minus = semAcento(linha);
        // só interessa o que é injetável (EV/IM/ampola/frasco/injetável)
        const ehInjetavel = /(ampola|frasco|injet|endoven|\bev\b|\bim\b|intramuscular|intravenos)/i.test(minus);
        if (!pareceMedicacao(linha) || !ehInjetavel) return;

        const reg = buscarDiluicao(linha);
        if (reg) {
            if (!vistos.has(reg.principio)) {
                vistos.add(reg.principio);
                blocos.push(`• ${reg.nome.split('  ')[0]}\n   ${textoDiluicao(reg)}`);
            }
        } else {
            const t = linha.trim();
            if (t) resultado.naoEncontrados.push(t);
        }
    });

    if (blocos.length > 0) {
        resultado.blocoSeparado =
            'DILUIÇÕES (Referência EBSERH — CONFERIR antes de administrar):\n\n'
            + blocos.join('\n\n');
    }
    return resultado;
}

// ----------------------------------------------------------------------------
//  EXTRATOR DE JSON ROBUSTO (reutilizável)
// ----------------------------------------------------------------------------
//  A IA às vezes devolve o JSON dentro de cercas ```json ... ``` ou com texto em
//  volta (sobretudo com a busca ligada). Esta função tenta várias formas de ler.
function extrairJson(txt) {
    if (!txt) return null;
    try { return JSON.parse(txt); } catch (e) {}
    let limpo = txt.replace(/```json/gi, '').replace(/```/g, '').trim();
    try { return JSON.parse(limpo); } catch (e) {}
    const ini = limpo.indexOf('{');
    const fim = limpo.lastIndexOf('}');
    if (ini !== -1 && fim !== -1 && fim > ini) {
        try { return JSON.parse(limpo.slice(ini, fim + 1)); } catch (e) {}
    }
    return null;
}

// ----------------------------------------------------------------------------
//  CHAMADA ÀS IAs — cada função recebe o prompt pronto e devolve texto bruto.
//  Lançam erro se falharem (quem chamou decide o que fazer: fallback, avisar...).
// ----------------------------------------------------------------------------

//  Chama o Gemini. 'modeloId' = 'flash' ou 'pro'. 'usarBusca' liga a busca web.
//  'imagens' (opcional) = fotos de documentos anexadas pela tela; o Gemini lê
//  imagens nativamente (vão como "inlineData" junto do texto do prompt).
async function chamarGemini(promptFinal, modeloId, usarBusca, imagens) {
    const modelToUse = modeloId === 'flash' ? MODELO_RAPIDO : MODELO_PROFUNDO;
    const configModelo = { model: modelToUse };
    if (usarBusca) {
        configModelo.tools = [{ googleSearch: {} }];
    }
    const model = genAI.getGenerativeModel(configModelo);
    const generationConfig = { maxOutputTokens: 8192, temperature: 0.4 };
    if (!usarBusca) {
        generationConfig.responseMimeType = 'application/json';
    }
    const parts = [{ text: promptFinal }];
    (imagens || []).forEach(img => {
        parts.push({ inlineData: { mimeType: img.mimeType, data: img.data } });
    });
    const result = await model.generateContent({
        contents: [{ role: 'user', parts }],
        generationConfig
    });
    return result.response.text();
}

//  Detecta se um erro do Gemini é "sobrecarga / indisponível" (vale tentar o
//  Claude). Cobre 503 (Service Unavailable), 429 (limite) e 500 (erro interno).
function ehFalhaTemporariaGemini(error) {
    const msg = (error && error.message) ? error.message : String(error || '');
    return /\b(503|429|500)\b/.test(msg)
        || /unavailable|overloaded|high demand|try again|internal/i.test(msg);
}

//  Chama o Claude (Anthropic) via API HTTP. Não precisa de biblioteca: usamos o
//  fetch que o Node moderno já tem. Devolve o texto da resposta.
//  OBS: a busca em fontes (googleSearch) é específica do Gemini; quando o Claude
//  é usado, ela não se aplica — pedimos só o JSON com o conhecimento do modelo.
//  'imagens' (opcional) = fotos de documentos; o Claude também lê imagens
//  nativamente (vão como blocos "image" antes do texto do prompt).
async function chamarClaude(promptFinal, imagens) {
    if (!process.env.ANTHROPIC_API_KEY) {
        throw new Error('ANTHROPIC_API_KEY não configurada no Render.');
    }
    let conteudo = promptFinal;
    if (imagens && imagens.length > 0) {
        conteudo = imagens.map(img => ({
            type: 'image',
            source: { type: 'base64', media_type: img.mimeType, data: img.data }
        }));
        conteudo.push({ type: 'text', text: promptFinal });
    }
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
            model: MODELO_CLAUDE,
            max_tokens: 8192,
            // Reforço para o Claude devolver SÓ o JSON (sem texto em volta).
            system: 'Você responde EXCLUSIVAMENTE com um objeto JSON válido, '
                + 'sem nenhum texto antes ou depois, sem cercas de código (```), '
                + 'seguindo exatamente o formato e as chaves pedidos no prompt.',
            messages: [{ role: 'user', content: conteudo }]
        })
    });
    if (!resp.ok) {
        let detalhe = '';
        try { detalhe = JSON.stringify(await resp.json()); } catch (e) {}
        throw new Error('Claude HTTP ' + resp.status + ' ' + resp.statusText + ' ' + detalhe);
    }
    const data = await resp.json();
    // A resposta vem em data.content (array de blocos); juntamos os de texto.
    return (data.content || [])
        .map(b => (b && b.type === 'text') ? b.text : '')
        .filter(Boolean)
        .join('\n');
}

//  ORQUESTRADOR: recebe o prompt e o modelo escolhido na tela. Decide quem chama
//  e aplica o FALLBACK AUTOMÁTICO. Devolve { dados, motorUsado, caiuParaClaude }.
//   - modeloId 'claude'        -> chama o Claude direto.
//   - modeloId 'flash' / 'pro' -> chama o Gemini; se ele cair por sobrecarga,
//                                 tenta o Claude automaticamente.
async function gerarComFallback(promptFinal, modeloId, usarBusca, imagens) {
    if (modeloId === 'claude') {
        const txt = await chamarClaude(promptFinal, imagens);
        return { dados: extrairJson(txt), motorUsado: 'claude', caiuParaClaude: false };
    }
    try {
        const txt = await chamarGemini(promptFinal, modeloId, usarBusca, imagens);
        return { dados: extrairJson(txt), motorUsado: 'gemini', caiuParaClaude: false };
    } catch (error) {
        // Só cai pro Claude se: (a) for falha temporária do Gemini E (b) houver
        // chave da Anthropic configurada. Senão, repassa o erro original.
        if (ehFalhaTemporariaGemini(error) && process.env.ANTHROPIC_API_KEY) {
            console.error('Gemini falhou (sobrecarga); tentando Claude. Detalhe:', error.message);
            const txt = await chamarClaude(promptFinal, imagens);
            return { dados: extrairJson(txt), motorUsado: 'claude', caiuParaClaude: true };
        }
        throw error;
    }
}

// ----------------------------------------------------------------------------
//  ROTA PRINCIPAL
// ----------------------------------------------------------------------------
app.post('/api/atendimento', limitarAbuso, async (req, res) => {
    try {
        const { beId, mensagem, unidade, opcoes, modeloId, sexo, idade, tipoDocumento, imagens } = req.body;

        if (!beId || !mensagem) {
            return res.status(400).json({ erro: 'Número do BE e relato são obrigatórios.' });
        }

        // FOTOS DE DOCUMENTOS anexadas pela tela (exames, prontuários antigos,
        // evoluções). Validação: só imagens, no máximo 9, cada uma até ~1 MB
        // (a tela já comprime antes de enviar). As fotos NUNCA são gravadas no
        // histórico — só o texto gerado a partir delas.
        let fotos = Array.isArray(imagens) ? imagens : [];
        fotos = fotos
            .filter(f => f && typeof f.data === 'string' && f.data.length > 0)
            .filter(f => TIPOS_IMAGEM.includes(f.mimeType))
            .slice(0, MAX_FOTOS_POR_CODIGO);
        if (fotos.some(f => f.data.length > TAMANHO_MAX_FOTO)) {
            return res.status(400).json({ erro: 'Uma das fotos ficou grande demais mesmo após a compressão. Fotografe de novo, de mais perto ou por partes.' });
        }
        if (unidade !== 'ACRIZIO' && unidade !== 'BARREIRO') {
            return res.status(400).json({ erro: 'Unidade inválida.' });
        }
        const op = opcoes || { prontuario: true, alta: false, relatorio: false, correcao: false };

        // NOVO: tipo de documento escolhido pelo médico (não mais adivinhado).
        //   'evolucao' = texto curto + conduta.  Qualquer outro valor = prontuário completo.
        const ehEvolucao = tipoDocumento === 'evolucao';

        // NOVO: o médico decide se haverá medicação NA UPA (toggle). Desligado por
        //   padrão: a IA NÃO deve criar prescrição interna se isto vier falso.
        const medicarUpa = op.medicarUpa === true;

        // Ponto 2: o médico pode ligar a "busca em fontes confiáveis" caso a caso.
        const usarBusca = op.buscarFontes === true;

        // NOVO: pedidos de exame. Só gera o texto se o respectivo toggle estiver
        //   ligado. "na unidade" = exames feitos aqui na UPA; "externo" = exames
        //   para o paciente fazer por conta (clínica/laboratório particular).
        const exameUnidade = op.exameUnidade === true;
        const exameExterno = op.exameExterno === true;

        // NOVO: comparação entre IAs (gera nas duas e resume as diferenças).
        const compararIAs = op.compararIAs === true;

        // O modelo escolhido na tela: 'flash', 'pro' ou 'claude'.
        // A instanciação/chamada agora é feita pelo orquestrador gerarComFallback.

        let historicoPaciente = await lerHistorico(beId);
        // O tipo agora é decidido pelo médico (botão), não mais adivinhado pelo histórico.
        let tipoAtendimento = ehEvolucao
            ? 'EVOLUÇÃO (reavaliação — texto curto + conduta)'
            : 'PRONTUÁRIO (documento completo)';

        // Dados demográficos para a IA contextualizar (não identificam o paciente).
        const idadeTxt = (idade !== undefined && idade !== null && String(idade).trim() !== '') ? `${idade} anos` : 'não informada';
        const sexoTxt = sexo === 'M' ? 'masculino' : sexo === 'F' ? 'feminino' : sexo === 'O' ? 'outro' : 'não informado';

        const listaUnidade = unidade === 'BARREIRO' ? medicamentosBarreiro : medicamentosAcrizioMenezes;
        const tituloFarmacia = unidade === 'BARREIRO'
            ? 'MEDICAMENTOS DISPONÍVEIS (REMUME PBH - URGÊNCIA):'
            : 'MEDICAMENTOS DISPONÍVEIS (PADRONIZAÇÃO UPA ACRÍZIO):';
        const contextoFarmacologico = `${tituloFarmacia}\n${formatarFarmacia(listaUnidade)}`;

        // Instruções de quais documentos gerar.
        let instrucoesAcao = 'Gere os documentos solicitados com congruência clínica:\n';
        if (op.correcao) {
            instrucoesAcao = '⚠️ MODO CORREÇÃO: reescreva aplicando a correção apontada.\n\n';
        }
        if (ehEvolucao) {
            instrucoesAcao += '- EVOLUÇÃO (texto curto, no campo "evolucao") + CONDUTA. NÃO preencha os campos de prontuário de admissão (história clínica, pregressa, exame físico, hipótese), a menos que o médico tenha descrito explicitamente um novo achado para eles.\n';
        } else if (op.prontuario) {
            instrucoesAcao += '- PRONTUÁRIO completo (todos os campos do SIGRAH).\n';
        }
        if (medicarUpa) {
            instrucoesAcao += '- PRESCRIÇÃO INTERNA (medicações a fazer NA UPA).\n';
        } else {
            instrucoesAcao += '- NÃO gere prescrição interna: deixe "prescricao_interna" VAZIA. Não houve medicação na unidade, a menos que o próprio relato do médico já descreva uma medicação como JÁ administrada.\n';
        }
        if (op.alta) instrucoesAcao += '- RECEITA DOMICILIAR.\n';
        if (op.relatorio) {
            instrucoesAcao += '- RELATÓRIO APS.\n';
        } else {
            instrucoesAcao += '- NÃO gere relatório: deixe "relatorio" SEMPRE VAZIO (""). O médico NÃO marcou relatório. NÃO escreva relatório por iniciativa própria, mesmo que pareça útil.\n';
        }
        if (exameUnidade) {
            instrucoesAcao += '- PEDIDO DE EXAME (NA UNIDADE): redija no campo "exame_unidade" o texto do(s) exame(s) a serem realizados AQUI na UPA, conforme o comando do médico. Se ele indicou quais exames, formate-os; se ele perguntou quais você pediria, escolha os pertinentes ao caso e liste-os de forma assertiva.\n';
        } else {
            instrucoesAcao += '- NÃO gere pedido de exame na unidade: deixe "exame_unidade" VAZIO ("").\n';
        }
        if (exameExterno) {
            instrucoesAcao += '- PEDIDO DE EXAME (EXTERNO): redija no campo "exame_externo" o texto de solicitação de exame(s) para o paciente realizar em serviço externo (clínica/laboratório particular ou referência), no formato que um médico usaria num pedido. Se o médico indicou o exame, formate-o; se ele perguntou quais pediria, escolha os pertinentes.\n';
        } else {
            instrucoesAcao += '- NÃO gere pedido de exame externo: deixe "exame_externo" VAZIO ("").\n';
        }

        // Ponto 2: bloco de fontes confiáveis (só entra no prompt se busca ligada).
        // A IA usa a busca do Gemini priorizando estas fontes e cita o link na
        // discussão. Buscamos a página atual na hora (link sempre válido).
        let blocoFontes = '';
        if (usarBusca) {
            blocoFontes = `
BUSCA EM FONTES CONFIÁVEIS — ATIVADA:
Use a busca para fundamentar diagnóstico/conduta em fontes científicas
brasileiras de alta credibilidade. PRIORIZE, nesta ordem:
- Ministério da Saúde / SUS (gov.br/saude, bvsms.saude.gov.br) e PCDT.
- Protocolos da Prefeitura de Belo Horizonte (prefeitura.pbh.gov.br/saude).
- Sociedades de especialidade, por ex.: Sociedade Brasileira de Cardiologia
  (portal.cardiol.br), Sociedade Brasileira de Pediatria (sbp.com.br),
  FEBRASGO (febrasgo.org.br), Sociedade Brasileira de Psiquiatria, de
  Infectologia, de Pneumologia, de Clínica Médica, ABRAMEDE (medicina de
  emergência), de Nefrologia, de Reumatologia, conforme o caso.
- Diretrizes internacionais reconhecidas só se não houver equivalente nacional.
REGRAS: cite o link da fonte ao final da "discussao" (campo "fontes"). NÃO
invente fonte nem link. Se a busca não trouxer nada útil, diga isso na discussão
e prossiga com conhecimento geral, sinalizando que não houve fonte confirmada.
`;
        }

        // Bloco de instruções sobre as FOTOS (só entra no prompt se houver foto).
        let blocoFotos = '';
        if (fotos.length > 0) {
            blocoFotos = `
DOCUMENTOS EM FOTO (${fotos.length} imagem(ns) anexada(s)):
- As imagens anexadas são DOCUMENTOS DE REFERÊNCIA fotografados (exames,
  prontuários antigos, evoluções, receitas).
- Use o conteúdo delas SOMENTE conforme a instrução do médico na mensagem
  (ex.: transcrever resultados de exame, aproveitar a história clínica,
  mesclar com a evolução atual).
- A foto NUNCA é, por si só, um novo atendimento: o documento a gerar é o que
  o médico pediu na mensagem, no tipo de atendimento indicado acima.
- PRIVACIDADE: IGNORE e OMITA qualquer identificador do paciente que apareça
  na foto (nome, nome da mãe, CPF, endereço, telefone, convênio). Aproveite
  APENAS os dados clínicos.
- TRANSCRIÇÃO FIEL: copie números, unidades e valores de exames EXATAMENTE
  como estão na foto. Se um trecho estiver ilegível, cortado ou borrado,
  escreva "[ilegível]" no lugar e avise na "discussao". É TERMINANTEMENTE
  PROIBIDO chutar, estimar ou completar valores que não dá para ler — valor
  de exame inventado é risco direto ao paciente.
`;
        }

        // ------------------------------------------------------------------
        //  PROMPT — agora pedindo o prontuário JÁ SEPARADO nos campos do SIGRAH.
        // ------------------------------------------------------------------
        const promptFinal = `Você é um médico assistente de retaguarda em uma UPA.
UNIDADE: ${unidade}
TIPO DE ATENDIMENTO: ${tipoAtendimento}
SEXO: ${sexoTxt} | IDADE: ${idadeTxt}

REGRA ABSOLUTA DE FIDELIDADE AO RELATO:
- NUNCA invente sinais vitais. Se o médico não informou um valor (SpO2, FC, FR,
  PA, temperatura, peso), NÃO ESCREVA esse item — simplesmente OMITA-O. NÃO
  escreva o rótulo seguido de branco (ex: NÃO escreva "FR: |" nem "Tax: °C").
  Liste APENAS os itens que o médico informou. Se ele não informou NENHUM sinal
  vital, deixe o campo "sinais_vitais" totalmente VAZIO (""). É proibido
  preencher com valores "normais" presumidos e proibido listar rótulos vazios.
- NUNCA invente medicação na UPA. Só descreva administração na unidade se o
  médico solicitou OU se o relato diz que já foi feita.
- MEDICAÇÃO FORA DA PADRONIZAÇÃO (SUS): se o médico prescreveu um remédio que
  NÃO consta na lista desta unidade, VOCÊ DEVE OBEDECER e incluí-lo normalmente
  na prescrição/receita. NÃO se recuse e NÃO substitua o medicamento só porque
  ele não está padronizado. Apenas SINALIZE na "discussao", EM CAIXA ALTA, que o
  item está fora da padronização (ex: "ATENÇÃO: AMOXICILINA + CLAVULANATO NÃO
  CONSTA NA PADRONIZAÇÃO DESTA UNIDADE"). Você SÓ pode contrariar/substituir uma
  prescrição do médico por motivo de SEGURANÇA (interação medicamentosa, alergia
  relatada, dose perigosa, contraindicação) — NUNCA pela simples ausência no SUS.
- Respeite literalmente o que o médico pediu, trocou ou proibiu na receita
  domiciliar. Se ele disse "não trocar" ou "manter", mantenha exatamente.
- TERMINOLOGIA: para broncodilatadores administrados por via inalatória
  (salbutamol, fenoterol, ipratrópio e combinações), use SEMPRE o termo
  "inalação" (ou "inalar"), NUNCA "nebulização"/"nebulizar". Ex.: escreva
  "Inalação com salbutamol + ipratrópio", não "Nebulização com...".
- Não invente comorbidades, alergias ou achados de exame não relatados. Quando
  um dado não foi informado, registre como "não informado" ou deixe em branco.

${contextoFarmacologico}
${blocoFontes}${blocoFotos}
REGRAS DE SAÍDA (responda em JSON puro com EXATAMENTE estas chaves):
{
  "discussao": "",
  "cid": "",
  "evolucao": "",
  "prontuario": {
     "historia_clinica": "",
     "historia_pregressa": "",
     "exame_fisico_texto": "",
     "sinais_vitais": "",
     "hipotese_diagnostica": "",
     "conduta": ""
  },
  "prescricao_interna": "",
  "receita": "",
  "relatorio": "",
  "exame_unidade": "",
  "exame_externo": "",
  "fontes": ""
}

INSTRUÇÕES DE CADA CAMPO:

1. "discussao": este é o campo de RACIOCÍNIO CLÍNICO — o mais importante para o
   médico, e o ÚNICO onde você pensa em voz alta. Dedique a ele sua melhor
   análise; os campos do prontuário são só o registro formal, mas é AQUI que
   você agrega valor. NÃO trate este campo como um resumo nem como uma lista de
   avisos: trate-o como a opinião de um colega experiente de retaguarda.
   PROFUNDIDADE PROPORCIONAL AO CASO (regra central): calibre o tamanho e a
   densidade ao RISCO e à AMBIGUIDADE do quadro.
   - Caso simples e típico (ex.: IVAS viral, lombalgia mecânica sem red flag):
     seja BREVE — 2 a 4 linhas. NÃO encha linguiça nem force diferenciais
     improváveis. Dizer "quadro típico, baixo risco, conduta sintomática
     adequada" basta quando é verdade.
   - Caso com red flag, dúvida diagnóstica, dor torácica/abdominal, sintoma
     neurológico, descompensação, interação medicamentosa ou achado que não
     fecha: APROFUNDE. Inclua, conforme couber ao caso:
       • os DIAGNÓSTICOS DIFERENCIAIS plausíveis e, para cada um, o que no caso
         o FAVORECE ou AFASTA (não só liste — raciocine);
       • os diagnósticos "CAN'T MISS" daquele quadro e como descartá-los;
       • o que MUDARIA A CONDUTA se um exame vier alterado (ex.: "se o ECG
         mostrar supra, isto deixa de ser área verde");
       • a JUSTIFICATIVA da escolha terapêutica e alternativas, quando relevante;
       • análise da prescrição: interações, ajuste por idade/função renal, dose.
   Densidade NÃO é comprimento: prefira frases que decidem conduta a parágrafos
   genéricos. Evite repetir o que já está no prontuário; aqui é para o que NÃO
   cabe lá — a dúvida, o porquê, o e-se.
   ESTE é o ÚNICO campo onde você PODE e DEVE expressar INCERTEZAS: marque
   claramente o que é dúvida, o que depende de exame para confirmar/descartar,
   e onde você tem menos confiança (ex: "ATENÇÃO: dose pediátrica — confira",
   "não dá para descartar X sem ECG"). Seja transparente sobre o grau de
   certeza. No FINAL, escreva em destaque: "CID: <código e descrição>".
   REGRA ABSOLUTA: NENHUMA incerteza, dúvida ou linguagem reflexiva pode
   aparecer nos campos do "prontuario". Toda hesitação fica AQUI, na discussão.
   PISTA DIAGNÓSTICA PELA MEDICAÇÃO CONTÍNUA: se o relato citar um medicamento de
   uso contínuo que seja marcador típico de uma doença (ex.: ácido valproico →
   epilepsia/transtorno do humor; levotiroxina → hipotireoidismo; insulina/
   metformina → diabetes; enalapril/losartana → hipertensão), e essa doença NÃO
   estiver na "historia_pregressa", acrescente UMA linha curta sinalizando a
   possibilidade para confirmar. Ex.: "⚕️ Uso contínuo de ácido valproico sugere
   epilepsia/transtorno do humor não citado na pregressa — confirmar." NÃO faça
   isso se a doença já constar na pregressa (não repita o óbvio nem gaste espaço).
   ALERTA DE GRAVIDADE / SALA VERMELHA (Protocolo de Manchester): este médico
   atende APENAS fichas VERDE e AMARELA. Avalie SE, pelos dados do relato, o
   paciente apresenta algum DISCRIMINADOR de Manchester de alta prioridade que
   justifique reclassificação para LARANJA/VERMELHO (urgência/emergência) e
   transferência para a sala vermelha — por ex.: comprometimento de via aérea,
   estridor, SpO2 baixa, dispneia grave, dor torácica de alto risco, sinais de
   choque/hipotensão, alteração aguda do nível de consciência, glicemia muito
   alterada, déficit neurológico agudo, dor severa (escala alta), sangramento
   exsanguinante, convulsão ativa, etc. REGRA: só inclua este alerta SE houver
   um red flag REAL nos dados informados. Se NÃO houver, NÃO escreva nada sobre
   isso (não gaste espaço nem crie alarme). QUANDO houver, escreva no INÍCIO da
   "discussao" um bloco EM CAIXA ALTA começando EXATAMENTE com o marcador
   "[[VERMELHO]]" (o sistema usa isso para destacar), contendo, EM CAIXA ALTA e
   nesta ordem: (a) o DISCRIMINADOR de Manchester aplicável; (b) os SINAIS
   OBJETIVOS do próprio paciente que o sustentam (citando os valores/achados do
   relato); (c) uma JUSTIFICATIVA CLÍNICA curta para a transferência. Comece o
   bloco por "[[VERMELHO]] POSSÍVEL CASO DE SALA VERMELHA — REAVALIAR
   CLASSIFICAÇÃO." e use rótulos "DISCRIMINADOR (MANCHESTER):", "SINAIS NO
   PACIENTE:" e "JUSTIFICATIVA:".
   IMPORTANTE: baseie-se SOMENTE nos dados que o médico informou; você NÃO
   examina o paciente. Encerre o bloco com: "(BASEADO APENAS NO RELATO —
   CONFIRMAR À BEIRA DO LEITO.)"

2. "cid": APENAS o(s) código(s) CID e descrição. Ex: "J00 - Nasofaringite aguda".
   Nada além disso neste campo.

2b. "evolucao": preencha SOMENTE quando o tipo de atendimento for EVOLUÇÃO.
   Texto curto e corrido (no máximo ~10 linhas), assertivo, descrevendo a
   reavaliação: resposta à conduta inicial, mudanças no quadro, estado atual e
   se há ou não sinais de alerta. NÃO repita a história clínica de admissão.
   Quando for EVOLUÇÃO, deixe os subcampos do "prontuario" VAZIOS (exceto
   "conduta", que deve ser preenchida). Quando NÃO for evolução, deixe
   "evolucao" como "".

3. "prontuario" — preencha cada subcampo SEPARADAMENTE para encaixar no SIGRAH.
   IMPORTANTE: o prontuário é DOCUMENTO DESCRITIVO E ASSERTIVO, não de reflexão.
   NUNCA escreva incertezas, dúvidas ou "pode ser/não descartado" aqui. No
   máximo, liste mais de uma hipótese diagnóstica quando clinicamente cabível,
   mas sem linguagem hesitante. Toda dúvida pertence à "discussao".
   - "historia_clinica": queixa, tempo de evolução, acompanhante, negativas
     relevantes. (corresponde ao campo 01 do SIGRAH)
   - "historia_pregressa": comorbidades, alergias, vacinas, uso de medicações
     crônicas. (campo 02)
   - "exame_fisico_texto": exame físico descritivo. NÃO inclua sinais vitais
     numéricos aqui (têm campo próprio). FORMATO OBRIGATÓRIO: UMA LINHA POR
     SISTEMA, usando abreviações e quebra de linha real (\\n) entre cada uma.
     Use estas abreviações: BEG (bom estado geral), ACV (ap. cardiovascular),
     AR (ap. respiratório), AD (abdome), MVF (murmúrio vesicular fisiológico),
     RA (ruídos adventícios). SIGA EXATAMENTE ESTE MODELO:
     "BEG, orientada no tempo e no espaço, eupneica, corada, hidratada, acianótica, anictérica
ACV: ritmo cardíaco regular em 2 tempos, bulhas normofonéticas, sem sopros
AR: MVF presente bilateralmente, sem RA
AD: plano, flácido, RHA presentes, indolor à palpação, sem massas ou visceromegalias
Neurológico: ECG 15, pupilas isocóricas e fotorreagentes, pares cranianos preservados, força e sensibilidade preservadas e simétricas nos 4 membros, sem sinais de irritação meníngea"
     (campo 03 - parte textual)
   - "sinais_vitais": liste APENAS os sinais que o médico informou, no formato
     "RÓTULO: valor" separados por " | ". Rótulos padrão: SpO2, FC, FR, PA,
     Tax (°C), Peso (kg). REGRA CRÍTICA DE SEGURANÇA: NÃO inclua rótulos de
     itens não informados (nada de "FR:" ou "Tax: °C" vazios) e, se NENHUM sinal
     vital foi informado, deixe o campo TOTALMENTE VAZIO (""). É TERMINANTEMENTE
     PROIBIDO inventar, estimar ou presumir valores "normais".
     (vai num quadro separado, NÃO copiado junto)
   - "hipotese_diagnostica": a(s) hipótese(s) em texto. (campo 04)
   - "conduta": condutas e orientações. SEJA CONCISO — nada de "encher
     linguiça". Comece direto pelos ITENS COM HÍFEN, um por linha (quebra real
     \\n). Mire em 3 a 5 itens curtos e objetivos; agrupe ações relacionadas no
     mesmo item.
     TEMPO VERBAL OBRIGATÓRIO: use SEMPRE o INFINITIVO da ação ("administrar",
     "fazer", "realizar", "prescrever", "encaminhar", "solicitar", "iniciar").
     NUNCA use o particípio ("administrado", "feito", "realizado", "prescrito"),
     pois o prontuário é redigido ANTES de a conduta ser executada — escrever no
     particípio daria a entender, falsamente, que a ação já ocorreu. EXCEÇÃO:
     se o próprio relato do médico disser que algo JÁ foi feito, aí sim relate no
     passado SÓ aquilo.
     AGRUPAR MEDICAÇÃO DA UNIDADE EM UMA LINHA: todas as medicações feitas NA UPA
     devem caber em UM ÚNICO item (uma linha), separadas por " + ", em vez de uma
     linha para cada fármaco — isso encurta a conduta. CITE-AS NOMINALMENTE com
     dose, via e frequência (tanto as da UPA quanto as da receita domiciliar; não
     escreva apenas "medicação sintomática" ou "receita entregue" sem nomear).
     MODELO:
     "- Administrar na UPA: Tenoxicam 20 mg IM + Dipirona 1 g (2 mL) EV, agora.
- Reavaliar após o efeito; se melhora, alta com sinais de alerta (piora súbita, febre, déficit).
- Receita domiciliar: Naproxeno 500 mg 12/12h por 5 dias e Metoclopramida 10 mg se náusea.
- Encaminhar para acompanhamento na APS."
     (campo 06)

4. "prescricao_interna": medicações usadas NA UPA. APENAS itens da lista desta
   unidade. Respeite a via indicada. FORMATO OBRIGATÓRIO: itens ENUMERADOS
   (1., 2., 3.), UM POR LINHA (quebra real \\n), cada um com dose, via e
   frequência. PARA INJETÁVEIS É OBRIGATÓRIO EXPLICITAR A QUANTIDADE DE AMPOLAS
   OU FRASCOS a administrar (ex.: "1 ampola", "2 ampolas", "1 frasco") — NUNCA
   informe só o volume/dose sem a quantidade de ampolas/frascos. Escreva também
   a via (EV/IM) para o sistema localizar a diluição. MODELO:
   "1. Dipirona 1 g — 1 ampola (2 mL) EV agora.
2. Tenoxicam 20 mg — 1 ampola IM agora.
3. SF 0,9% 500 mL — 1 frasco EV se necessário."

5. "receita": receita de uso DOMICILIAR, agrupada por via (USO ORAL, USO
   TÓPICO, USO INALATÓRIO...). FORMATO CONSAGRADO OBRIGATÓRIO para CADA item:
   primeiro o nome + concentração, depois a QUANTIDADE TOTAL a dispensar
   (nº de comprimidos, caixa(s), frasco(s), tubo(s)), e SÓ ENTÃO a posologia
   na linha de baixo. NUNCA pule a quantidade total.
   DOSE FECHADA OBRIGATÓRIA: a posologia NÃO pode delegar a decisão ao paciente.
   É PROIBIDO escrever faixas como "tomar 1 a 2 comprimidos" ou "1-2 comprimidos"
   — defina UMA dose única ("tomar 1 comprimido" OU "tomar 2 comprimidos").
   AO FINAL DA RECEITA, acrescente SEMPRE um bloco curto de ORIENTAÇÕES NÃO
   MEDICAMENTOSAS, com no MÁXIMO 3 a 4 itens objetivos e pertinentes ao quadro
   (ex.: hidratação, repouso, sinais de alerta para retornar, cuidados locais,
   dieta). Encabece esse bloco com a linha "ORIENTAÇÕES:" e use itens com hífen.
   MODELO:
   "USO ORAL
1. Naproxeno 500 mg ............................. 10 comprimidos
   Tomar 1 comprimido de 12/12 horas por 5 dias.

2. Metoclopramida 10 mg ......................... 1 caixa
   Tomar 1 comprimido até 3x ao dia se náusea.

ORIENTAÇÕES:
- Repouso relativo e hidratação oral abundante.
- Retornar se febre persistente, piora da dor ou novos sintomas.
- Evitar esforço físico intenso até reavaliação."
   Respeite LITERALMENTE o que o médico pediu/proibiu/trocou no relato. Sem
   textos burocráticos sobre falta de medicação.

6. "relatorio": parágrafo único, de médico para médico, começando com
   "Colega, paciente avaliado nesta UPA por...".

7. "exame_unidade": texto do pedido de exame(s) a serem realizados NA PRÓPRIA
   UPA. Preencha SOMENTE se solicitado na diretriz de ação; caso contrário "".
   Escreva como um pedido médico real (cabeçalho curto + lista dos exames).

8. "exame_externo": texto de solicitação de exame(s) para o paciente realizar
   FORA da unidade (clínica/laboratório particular ou serviço de referência).
   Preencha SOMENTE se solicitado na diretriz de ação; caso contrário "".
   Redija no formato consagrado de um pedido de exame ("Solicito..."), citando
   a indicação clínica quando pertinente.

Deixe vazio "" (ou subcampos vazios) o que não foi solicitado.

DIRETRIZ DA AÇÃO:
${instrucoesAcao}

HISTÓRICO DO PACIENTE (mesmo BE):
${JSON.stringify(prepararHistoricoPrompt(historicoPaciente))}

MENSAGEM DO MÉDICO:
${mensagem}`;

        // --------------------------------------------------------------
        //  PÓS-PROCESSAMENTO de uma resposta da IA (travas + segurança +
        //  diluições + fontes). Aplicado a CADA versão gerada (inclusive na
        //  comparação). Recebe e devolve o objeto 'dados' já tratado.
        // --------------------------------------------------------------
        function posProcessar(dados) {
            if (!dados) return null;
            if (!dados.prontuario) dados.prontuario = {};
            if (typeof dados.evolucao !== 'string') dados.evolucao = '';

            // --- Preferência de termo: "inalação" em vez de "nebulização" ---
            dados.evolucao = preferirInalacao(dados.evolucao);
            dados.prescricao_interna = preferirInalacao(dados.prescricao_interna);
            dados.receita = preferirInalacao(dados.receita);
            if (dados.prontuario) {
                dados.prontuario.conduta = preferirInalacao(dados.prontuario.conduta);
                dados.prontuario.exame_fisico_texto = preferirInalacao(dados.prontuario.exame_fisico_texto);
            }

            // --- Tempo verbal: infinitivo na conduta (prontuário é redigido
            //     ANTES de executar a conduta) ---
            if (dados.prontuario) {
                dados.prontuario.conduta = preferirInfinitivoConduta(dados.prontuario.conduta);
            }

            // --- Receita: fecha doses flexíveis ("1 a 2 comp" -> "1 comp") ---
            dados.receita = fecharDoseFlexivel(dados.receita);

            // --- Movimento 1: formatação estrutural garantida pelo servidor ---
            // (transformações mecânicas; não dependem de juízo clínico)
            if (dados.prontuario) {
                dados.prontuario.conduta = limparCabecalhoConduta(dados.prontuario.conduta);
                dados.prontuario.conduta = removerCidVazado(dados.prontuario.conduta);
                dados.prontuario.exame_fisico_texto = removerCidVazado(dados.prontuario.exame_fisico_texto);
                dados.prontuario.sinais_vitais = normalizarSeparadorVitais(dados.prontuario.sinais_vitais);
            }

            // --- TRAVAS DE SEGURANÇA (servidor manda, não a IA) ---
            if (!op.relatorio) dados.relatorio = '';
            if (!exameUnidade) dados.exame_unidade = '';
            if (!exameExterno) dados.exame_externo = '';
            if (typeof dados.exame_unidade !== 'string') dados.exame_unidade = '';
            if (typeof dados.exame_externo !== 'string') dados.exame_externo = '';

            // --- Rede de segurança farmacológica ---
            const textoConferir = [dados.prescricao_interna, dados.receita].filter(Boolean).join('\n');
            const alertas = conferirMedicamentos(textoConferir, listaUnidade);
            if (alertas.length > 0) {
                const aviso = '\n\n⚠️ LEMBRETE (verificação grosseira — NÃO confiável; confira você mesmo na padronização): possíveis itens fora da lista desta unidade:\n- '
                    + alertas.join('\n- ');
                dados.discussao = (dados.discussao || '') + aviso;
            }

            // --- Diluições (SÓ Barreiro) ---
            dados.diluicoes = '';
            if (unidade === 'BARREIRO') {
                const dil = montarDiluicoes(dados.prescricao_interna);
                dados.diluicoes = dil.blocoSeparado;
                if (dil.naoEncontrados.length > 0) {
                    const aviso = '\n\n💧 DILUIÇÃO NÃO ENCONTRADA na tabela de referência (consultar manualmente):\n- '
                        + dil.naoEncontrados.join('\n- ');
                    dados.discussao = (dados.discussao || '') + aviso;
                }
            }

            // --- Fontes citadas: anexa o link ao fim da discussão ---
            if (dados.fontes && dados.fontes.trim()) {
                dados.discussao = (dados.discussao || '')
                    + '\n\n📚 FONTES CONSULTADAS:\n' + dados.fontes.trim();
            }
            return dados;
        }

        const erroJsonInvalido = () => res.status(502).json({
            erro: 'A IA devolveu resposta incompleta. Tente enviar de novo' +
                  (usarBusca ? ' (a busca em fontes às vezes alonga a resposta; tente sem ela se persistir).' : '.')
        });

        // ==============================================================
        //  MODO COMPARAÇÃO: gera nas DUAS IAs (Gemini Pro + Claude) e pede
        //  ao Claude um resumo clínico das diferenças. NÃO salva no
        //  histórico (você ainda vai escolher qual versão fica).
        // ==============================================================
        if (compararIAs) {
            if (!process.env.ANTHROPIC_API_KEY) {
                return res.status(400).json({ erro: 'A comparação precisa da chave do Claude (ANTHROPIC_API_KEY) configurada no Render.' });
            }
            let textoGemini, textoClaude;
            try {
                // Gera as duas em paralelo para não somar os tempos de espera.
                [textoGemini, textoClaude] = await Promise.all([
                    chamarGemini(promptFinal, 'pro', usarBusca, fotos),
                    chamarClaude(promptFinal, fotos)
                ]);
            } catch (e) {
                console.error('Erro na geração comparativa:', e.message);
                return res.status(502).json({ erro: 'Não foi possível gerar as duas versões para comparar. Tente novamente.' });
            }
            const dadosGemini = posProcessar(extrairJson(textoGemini));
            const dadosClaude = posProcessar(extrairJson(textoClaude));
            if (!dadosGemini || !dadosClaude) return erroJsonInvalido();

            // Pede ao Claude (leitura neutra) um resumo das diferenças clínicas.
            let resumoDiferencas = '';
            try {
                const promptComparar = `Você é um médico revisor. Abaixo estão DUAS versões de documentação clínica geradas por IAs diferentes (A e B) para o MESMO caso. Compare-as e escreva um resumo OBJETIVO em português das DIFERENÇAS CLINICAMENTE RELEVANTES, cobrindo: hipótese diagnóstica, conduta, medicação/prescrição, CID e quaisquer red flags que uma citou e a outra não. Seja conciso (tópicos curtos com hífen). Se forem praticamente equivalentes, diga isso. Onde houver divergência de conduta ou medicação, destaque, pois é onde mora o risco. NÃO reescreva os documentos; só aponte as diferenças. Responda em TEXTO simples (não JSON).

VERSÃO A (Gemini):
${JSON.stringify(dadosGemini)}

VERSÃO B (Claude):
${JSON.stringify(dadosClaude)}`;
                const respCmp = await fetch('https://api.anthropic.com/v1/messages', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': process.env.ANTHROPIC_API_KEY,
                        'anthropic-version': '2023-06-01'
                    },
                    body: JSON.stringify({
                        model: MODELO_CLAUDE,
                        max_tokens: 2048,
                        messages: [{ role: 'user', content: promptComparar }]
                    })
                });
                if (respCmp.ok) {
                    const d = await respCmp.json();
                    resumoDiferencas = (d.content || []).map(b => b.type === 'text' ? b.text : '').filter(Boolean).join('\n');
                }
            } catch (e) {
                console.error('Erro ao resumir diferenças:', e.message);
            }
            if (!resumoDiferencas) {
                resumoDiferencas = 'Não foi possível gerar o resumo automático das diferenças. Compare as duas versões manualmente antes de escolher.';
            }

            // Devolve as DUAS versões + o resumo. A escolha (e o salvamento) é
            // feita depois, pela tela, na rota /api/escolher.
            return res.json({
                _comparacao: true,
                resumoDiferencas,
                versaoGemini: dadosGemini,
                versaoClaude: dadosClaude
            });
        }

        // ==============================================================
        //  MODO NORMAL: uma IA só (com fallback automático se for Gemini).
        // ==============================================================
        let saida;
        try {
            saida = await gerarComFallback(promptFinal, modeloId, usarBusca, fotos);
        } catch (error) {
            console.error('Erro ao gerar com a IA:', error.message);
            return res.status(502).json({ erro: 'A IA está indisponível no momento. Tente novamente em instantes ou troque o modelo (Flash / Pro / Claude).' });
        }

        let dados = posProcessar(saida.dados);
        if (!dados) {
            console.error('IA devolveu JSON inválido.');
            return erroJsonInvalido();
        }

        // Marca qual motor respondeu (e se foi fallback) para a tela avisar.
        dados._motorUsado = saida.motorUsado;
        dados._caiuParaClaude = saida.caiuParaClaude;

        // Salva no histórico (guarda também sexo/idade/tipo p/ reabrir o caso).
        // IMPORTANTE: as fotos em si NÃO entram aqui — só a CONTAGEM, para
        // registro. O conteúdo clínico extraído já está dentro de "resposta".
        const quando = Date.now();
        historicoPaciente.push({
            medico: mensagem, comandos: op, resposta: dados,
            sexo: sexo || '', idade: (idade !== undefined ? idade : ''),
            tipo: ehEvolucao ? 'evolucao' : 'prontuario',
            fotos: fotos.length,
            quando: quando
        });
        const salvou = await salvarHistorico(beId, historicoPaciente, sexo, idade, quando);
        dados._historicoSalvo = salvou;

        res.json(dados);

    } catch (error) {
        console.error('Erro no processamento:', error);
        res.status(500).json({ erro: 'Falha no processamento. Tente novamente.' });
    }
});

// ----------------------------------------------------------------------------
//  ROTA: salvar a versão ESCOLHIDA após uma comparação.
//  A comparação NÃO salva sozinha; depois que o médico escolhe (Gemini ou
//  Claude), a tela manda a versão escolhida para cá, que então empilha no
//  histórico do BE — exatamente como um atendimento normal faria.
// ----------------------------------------------------------------------------
app.post('/api/escolher', limitarAbuso, async (req, res) => {
    try {
        const { beId, mensagem, opcoes, sexo, idade, tipoDocumento, resposta, motorEscolhido } = req.body;
        if (!beId || !resposta) {
            return res.status(400).json({ erro: 'Faltam dados para salvar a versão escolhida.' });
        }
        const op = opcoes || {};
        const ehEvolucao = tipoDocumento === 'evolucao';
        const dados = resposta;
        dados._motorUsado = motorEscolhido || 'desconhecido';

        const historicoPaciente = await lerHistorico(beId);
        const quando = Date.now();
        historicoPaciente.push({
            medico: mensagem || '', comandos: op, resposta: dados,
            sexo: sexo || '', idade: (idade !== undefined ? idade : ''),
            tipo: ehEvolucao ? 'evolucao' : 'prontuario',
            quando: quando
        });
        const salvou = await salvarHistorico(beId, historicoPaciente, sexo, idade, quando);
        dados._historicoSalvo = salvou;
        res.json(dados);
    } catch (error) {
        console.error('Erro ao salvar versão escolhida:', error);
        res.status(500).json({ erro: 'Falha ao salvar a versão escolhida.' });
    }
});

// ----------------------------------------------------------------------------
//  ROTA: reabrir um caso pelo BE (clique no chip de recentes).
//  Devolve a ÚLTIMA resposta salva no cache (72h) para aquele BE.
// ----------------------------------------------------------------------------
app.get('/api/historico/:beId', async (req, res) => {
    const hist = await lerHistorico(req.params.beId);
    if (!hist || hist.length === 0) {
        return res.status(404).json({ erro: 'Sem histórico para este BE (pode ter expirado em 72h).' });
    }
    const ultimo = hist[hist.length - 1];
    res.json({
        beId: req.params.beId,
        sexo: ultimo.sexo || '',
        idade: ultimo.idade || '',
        tipo: ultimo.tipo || 'prontuario',
        resposta: ultimo.resposta || {}
    });
});

// ----------------------------------------------------------------------------
//  ROTA: linha do tempo de um BE (todas as etapas das últimas 72h).
//  Devolve a pilha inteira (prontuário, correções, evoluções) em ordem, para
//  o médico clicar e ver qualquer etapa. NÃO guarda nome do paciente (LGPD).
// ----------------------------------------------------------------------------
app.get('/api/timeline/:beId', async (req, res) => {
    const hist = await lerHistorico(req.params.beId);
    if (!hist || hist.length === 0) {
        return res.status(404).json({ erro: 'Sem histórico para este BE (pode ter expirado em 72h).' });
    }
    const ultimo = hist[hist.length - 1];
    const etapas = hist.map((h, i) => ({
        indice: i,
        tipo: h.tipo || 'prontuario',
        quando: h.quando || 0,
        correcao: !!(h.comandos && h.comandos.correcao),
        resposta: h.resposta || {}
    }));
    res.json({
        beId: req.params.beId,
        sexo: ultimo.sexo || '',
        idade: ultimo.idade || '',
        etapas
    });
});

// ----------------------------------------------------------------------------
//  ROTA: lista dos BEs recentes (só número + sexo + idade — sem dado clínico).
//  Usada para montar os "chips" na tela, sincronizados entre aparelhos.
// ----------------------------------------------------------------------------
app.get('/api/recentes', async (req, res) => {
    if (!redis) return res.json({ recentes: [] });
    try {
        // Pega os BEs mais recentes do sorted set, já com o score (timestamp).
        // Buscamos um pouco mais que 8 porque alguns podem já ter expirado.
        const pares = await redis.zrevrange(CHAVE_RECENTES, 0, 29, 'WITHSCORES');
        const lista = [];
        for (let i = 0; i < pares.length; i += 2) {
            const be = pares[i];
            const quando = Number(pares[i + 1]) || 0;
            // Só inclui se o BE ainda existe (não expirou nas 72h).
            const existe = await redis.exists('be:' + be);
            if (!existe) {
                // Limpa resíduos para não acumular lixo no sorted set.
                redis.zrem(CHAVE_RECENTES, be);
                continue;
            }
            let sexo = '', idade = '';
            try {
                const m = await redis.get('meta:' + be);
                if (m) { const o = JSON.parse(m); sexo = o.sexo || ''; idade = o.idade || ''; }
            } catch (e) { /* metadado opcional */ }
            lista.push({ be, sexo, idade, quando });
            if (lista.length >= 8) break;
        }
        res.json({ recentes: lista });
    } catch (e) {
        console.error('Erro ao ler recentes do Redis:', e.message);
        res.json({ recentes: [] });
    }
});

// ----------------------------------------------------------------------------
//  ROTAS DA PONTE DE FOTOS (celular -> computador, POR CÓDIGO DE 4 NÚMEROS)
// ----------------------------------------------------------------------------
//  Fluxo: o celular manda as fotos num pedido só e recebe um CÓDIGO de 4
//  números (uso ÚNICO, vale 30 min); o outro aparelho digita o código e
//  recebe as fotos, que são APAGADAS do servidor na entrega. Internamente,
//  cada foto fica num registro próprio no Redis (o plano gratuito do Upstash
//  limita ~1 MB por gravação) e um índice leve amarra tudo ao código.

//  1) Recebe as fotos (1 a 9) e devolve o código gerado.
app.post('/api/ponte', limitarAbuso, async (req, res) => {
    try {
        const { fotos } = req.body || {};
        if (!Array.isArray(fotos) || fotos.length === 0) {
            return res.status(400).json({ erro: 'Nenhuma foto recebida.' });
        }
        if (fotos.length > MAX_FOTOS_POR_CODIGO) {
            return res.status(400).json({ erro: 'No máximo ' + MAX_FOTOS_POR_CODIGO + ' fotos por código.' });
        }
        for (const f of fotos) {
            if (!f || !TIPOS_IMAGEM.includes(f.mimeType)) {
                return res.status(400).json({ erro: 'Formato não aceito. Envie as fotos em JPEG ou PNG.' });
            }
            if (typeof f.data !== 'string' || f.data.length === 0 || f.data.length > TAMANHO_MAX_FOTO_PONTE) {
                return res.status(400).json({ erro: 'Uma das fotos ficou grande demais mesmo após a compressão. Fotografe de novo, de mais perto ou por partes.' });
            }
        }
        if (!redis) {
            return res.status(503).json({ erro: 'A ponte de fotos usa o banco de histórico (Redis), que está indisponível agora. Você ainda pode anexar as fotos direto no aparelho em que for gerar o documento.' });
        }
        const codigo = await gerarCodigoPonte();
        if (!codigo) {
            return res.status(503).json({ erro: 'Não consegui gerar um código agora. Tente de novo em instantes.' });
        }
        // Guarda cada foto num registro próprio (limite de 1 MB por gravação).
        for (const f of fotos) {
            const r = await guardarFotoPonte(codigo, f.mimeType, f.data);
            if (r.erro) {
                // Falhou no meio: limpa o que já foi e devolve o erro.
                await apagarFotosPonte(codigo);
                return res.status(503).json({ erro: r.erro });
            }
        }
        res.json({ ok: true, codigo, fotos: fotos.length });
    } catch (e) {
        console.error('Erro ao receber fotos da ponte:', e);
        res.status(500).json({ erro: 'Falha ao receber as fotos.' });
    }
});

//  2) Entrega as fotos de um código e as APAGA (código de uso único).
app.get('/api/ponte/:codigo', async (req, res) => {
    const codigo = String(req.params.codigo || '');
    const fotos = await lerFotosPonte(codigo);
    if (fotos === null) {
        return res.status(404).json({ erro: 'Código inválido ou expirado (vale 30 minutos e funciona uma única vez). Gere um novo código no outro aparelho.' });
    }
    // Uso único: apaga na entrega (em segundo plano, sem atrasar a resposta).
    apagarFotosPonte(codigo).catch(() => {});
    res.json({ fotos });
});

app.get('/', (req, res) => res.send('Servidor do Prontuário Rápido (v4) no ar.'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Servidor rodando na porta ' + PORT));
