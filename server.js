// ============================================================================
//  PRONTUÁRIO RÁPIDO - SERVIDOR (BACKEND) - v7.6
//
//  Novidades da v7.6 (05/set/2026) — MODO INTERNAÇÃO (fatia C do roteiro v7):
//    - Toggle novo 'internacao' em opcoes. DESLIGADO por padrão. Vale tanto em
//      PRONTUÁRIO quanto em EVOLUÇÃO.
//    - Com ele LIGADO, cinco campos novos no JSON: aih_sinais_sintomas (campo
//      20 do laudo de AIH), aih_condicoes (21), aih_exames (22),
//      relatorio_internacao e prescricao_internacao.
//    - INJEÇÃO CONDICIONAL: com o toggle desligado, as cinco chaves NEM APARECEM
//      no esquema JSON e o bloco de instruções de internação NÃO entra no
//      prompt. Prompt saturado rouba profundidade da discussão; o modelo não
//      precisa nem saber que esses campos existem quando não são pedidos.
//    - TRAVA DUPLA: o servidor zera os cinco campos à força quando o toggle vier
//      desligado, mesmo que a IA tente preenchê-los.
//    - Com internação LIGADA o histórico vai para o prompt COMPLETO (sem o
//      resumo do meio da pilha): o relatório de internação precisa do caso todo.
//    - A prescrição de internação é presa à padronização DESTA unidade — quem a
//      executa enquanto a vaga não sai é a equipe da própria UPA. Por isso ela
//      ENTRA na conferência de medicamentos e GANHA diluições (bloco separado no
//      Barreiro, inline no Acrízio).
//    - Profilaxia de TEV pelo ESCORE DE PÁDUA, com a conta mostrada na discussão
//      e nunca dentro da prescrição. Regra determinística: soma >= 4 com o que
//      já se sabe -> prescreve (nenhum item do Pádua subtrai ponto, então o que
//      falta não derruba soma já fechada); soma < 4 -> não prescreve e lista o
//      que faltou para o médico completar o relato.
//    - Marcador novo [[ATENCAO]] (caixa laranja na tela) para medicação de uso
//      contínuo que NÃO pode ser substituída (anticoagulante, antiarrítmico,
//      imunossupressor, antirretroviral, anticonvulsivante). É separado do
//      [[VERMELHO]] do Manchester de propósito: a tela só destaca UM bloco por
//      marcador, e os dois podem cair no mesmo paciente.
//
//  Novidades da v7.5 (05/set/2026):
//    - BUSCA DE BE POR PREFIXO: rota GET /api/buscar?termo=... devolve os BEs
//      das últimas 72h que COMEÇAM com os números digitados. Serve para o caso
//      em que o médico lembra só o começo do número.
//    - APAGAR UMA ETAPA: rota POST /api/apagar-etapa remove UMA etapa de dentro
//      de um BE (ex.: uma evolução escrita errado). Apagar o BE INTEIRO NÃO
//      existe neste sistema, por decisão do médico. Três travas protegem a
//      operação: (1) recusa apagar quando só há uma etapa, porque isso
//      equivaleria a apagar o BE; (2) recusa índice fora da pilha; (3) exige
//      que o CARIMBO DE TEMPO enviado pela tela bata com o da etapa guardada
//      naquele índice — se a linha do tempo mudou, nada é apagado. O tempo de
//      vida que restava das 72h é PRESERVADO (apagar não renova o prazo).
//    - CULTURAS: removida do prompt a regra que mandava citar cultura pendente.
//      As unidades não coletam culturas, então cultura não entra na conduta nem
//      em exames_complementares. Comentário sobre cultura só na discussão. A
//      única exceção é resultado JÁ PRONTO trazido de fora e relatado.
//    - "MONITORIZAR": regra nova de vocabulário. A palavra só vale quando o
//      paciente está de fato ligado a um monitor (sala vermelha, CTI). No resto
//      é "vigilância"/"vigiar". Regra de PROMPT, sem função no servidor: decidir
//      se o paciente está num monitor é juízo clínico, e uma troca cega de
//      palavra estragaria justamente o prontuário do paciente mais grave.
//
//  CORREÇÃO CRÍTICA da v7.4 (31/ago/2026). A v7.1 detectava o cancelamento
//  com req.on('close'). ERRADO: 'req' é o fluxo do PEDIDO QUE CHEGA, e no
//  Node ele emite 'close' assim que o corpo termina de ser lido — o que
//  acontece logo no início, com o cliente PERFEITAMENTE conectado. Resultado:
//  o servidor marcava "o médico cancelou" em TODA geração, poucos
//  milissegundos depois de começar. A IA respondia normalmente (o log do
//  Render mostrou "Geração concluída em 18.5s") e o servidor DESCARTAVA a
//  resposta e não devolvia nada — a tela do médico girava para sempre.
//  Isso quebrava TUDO, não só o PDF: qualquer prontuário ou evolução.
//  A guarda 'if (!res.writableEnded)' não protegia, porque nesse momento a
//  resposta de fato ainda não tinha sido enviada.
//  CERTO: escutar res.on('close') — o fluxo da RESPOSTA, que só fecha quando
//  a resposta termina ou quando a conexão cai de verdade.
//  Também foi acrescentado um log no instante em que a desconexão é
//  detectada, para que uma regressão deste tipo apareça no log na hora.
//
//  Novidades da v7.3 (31/ago/2026) — a v7.2 subiu e funcionou (o log do Render
//  confirmou "PDF #1 recebido: 5 KB em base64, assinatura OK"), mas com PDF a
//  geração ficou PENDURADA por minutos, sem resposta e sem erro, tanto no
//  Gemini quanto no Claude. Ficar pendurado é o pior comportamento possível
//  num plantão: o médico espera sem saber se vem ou não vem. Duas frentes:
//   1) TEMPO LIMITE DE 2 MINUTOS por geração. Passou disso, a chamada é
//      abortada e a tela recebe um erro CLARO ("a IA não respondeu a tempo"),
//      em vez de girar para sempre. O tempo limite NÃO aciona o fallback para
//      o Claude de propósito: se o Gemini travou por causa do anexo, o Claude
//      travaria igual e o médico esperaria 4 minutos em vez de 2.
//   2) INSTRUMENTAÇÃO no log do Render: registra qual motor foi chamado, com
//      quantas imagens e quantos PDFs, quanto tempo levou e — se falhar — a
//      mensagem de erro COMPLETA. É isto que vai dizer, na próxima tentativa,
//      se o travamento é do lado do Gemini/Claude ou do nosso.
//      Nenhum dado clínico vai para o log: só contagem, motor e tempo.
//
//  Novidades da v7.2 (31/ago/2026) — correções do campo de exames após teste
//  em bancada. O anexo em FOTO passou a ser lido corretamente, mas a saída
//  vinha longa e fatiada em várias linhas. Quatro frentes:
//   1) REGRAS FECHADAS DE CONTEÚDO (prompt). Listas TAXATIVAS, não exemplos:
//      - HEMOGRAMA: só Hb, Ht, leucócitos (com "desvio à esquerda" em palavras,
//        sem percentuais) e plaquetas. PROIBIDO hemácias, VCM, HCM, RDW,
//        linfócitos, monócitos, eosinófilos, bastonetes/segmentados numéricos.
//      - EAS/URINA: só o que estiver POSITIVO/ALTERADO entre proteína, nitrito,
//        leucócitos, hemácias/hemoglobinúria e bactérias. PROIBIDO aspecto,
//        cor, densidade, pH, cilindros. Item negativo ou irrelevante não entra.
//      - UMA data para TODO o laboratório; proibido repetir a data por exame.
//   2) UNIFICAÇÃO NO SERVIDOR (trava dupla): unificarLinhasLaboratorio junta
//      numa linha só as linhas laboratoriais que a IA tenha fatiado
//      ("Hemograma:...", "Bioquímica:...", "EAS:..."), com UMA data. É
//      LOSSLESS: não apaga resultado nenhum, só junta e tira data repetida e
//      rótulo redundante. A SELEÇÃO do que entra fica no prompt de propósito —
//      apagar valor de exame por regex é risco clínico (ex.: um "pH" apagado
//      seria fatal numa gasometria).
//   3) TRAVA DE REMISSÃO: "resultado conforme documento anexado", "vide anexo"
//      e afins NÃO são resultado. O campo é zerado e a discussão recebe um
//      AVISO EM DESTAQUE de que o anexo não foi lido. Antes isso passava e
//      virava uma linha bonita e vazia — pior que campo vazio.
//   4) CHECAGEM DE PDF: valida a assinatura "%PDF-" do arquivo recebido
//      (base64 começando por "JVBERi"). PDF corrompido agora dá erro claro em
//      vez de chegar ilegível na IA.
//
//  Novidades da v7.1 (31/ago/2026) — fatias 2 e 3 do roteiro v7:
//   1) CANCELAR A GERAÇÃO EM ANDAMENTO. A tela agora pode abortar o pedido.
//      Do lado do servidor isso NÃO bastava: abortar o navegador não cancela
//      a chamada que o Render já fez ao Gemini/Claude. Agora a rota
//      /api/atendimento escuta o fechamento da conexão e, se o cliente sumir antes da
//      resposta, (a) aborta a chamada de SAÍDA às IAs (AbortController
//      repassado a chamarGemini/chamarClaude) e (b) NÃO grava nada no Redis.
//      Nunca existe "etapa fantasma" no histórico do BE.
//      OBS de segurança: um aborto NUNCA aciona o fallback para o Claude
//      (ehAborto), senão cancelar dispararia uma segunda chamada paga.
//   2) ANEXO DE PDF (antes só imagem). O PDF era DESCARTADO EM SILÊNCIO pelo
//      filtro de tipos — o pior dos mundos. Agora:
//      - application/pdf é aceito, com teto próprio de tamanho (~4 MB), pois
//        PDF não passa pela compressão do navegador;
//      - anexo de tipo não suportado agora dá ERRO CLARO, não some calado;
//      - o Gemini lê PDF pelo mesmo inlineData; o CLAUDE exige um bloco
//        DIFERENTE do de imagem ("document"), montado conforme o mimeType;
//      - a PONTE por código continua SÓ para fotos (limite de ~1 MB por
//        gravação do Upstash), agora com mensagem explicando isso.
//      Nada muda nas regras clínicas de leitura de anexo: transcrição fiel,
//      proibido chutar valor ilegível, omitir identificadores.
//
//  Novidades da v7 (31/ago/2026) — duas frentes (fatia 1 do roteiro v7):
//   1) CAMPO NOVO "exames_complementares" (Exames Prévios Realizados): lugar
//      FIXO e previsível para o RESULTADO de exame complementar (ECG, labora-
//      tório, imagem, glicemia, gasometria, teste rápido). Antes não existia
//      campo nenhum para RESULTADO — só exame_unidade/exame_externo, que são
//      PEDIDOS — e por isso a IA jogava o resultado ora no exame físico, ora
//      na discussão, ora no meio da evolução.
//      - NÃO depende de toggle: existe quando o médico mencionar um exame
//        (no relato ou em anexo) e não existe quando não mencionar.
//      - PRONTUÁRIO: caixa "Exames Complementares", entre o Exame Físico e a Hipótese.
//      - EVOLUÇÃO: o SERVIDOR cola o conteúdo no FIM do texto da evolução,
//        separado por linha em branco (posição determinística; a IA não
//        escolhe onde). Sem rótulo, direto o conteúdo.
//      - Trava dupla: instrução no prompt + limparExamesComplementares no
//        servidor, que ZERA o campo quando vier vazio, só com rótulo, ou com
//        placeholder negativo ("não realizados", "sem exames", "nenhum").
//      - FORMATO ENXUTO: TODO exame laboratorial numa ÚNICA linha (separados
//        por " | "), ECG em linha própria e cada exame de imagem em linha
//        própria. Sem valores de referência. Só os resultados PRINCIPAIS de
//        cada exame (ex.: do hemograma, Hb/leucócitos/plaquetas) mais o que
//        estiver muito alterado — nunca o laudo inteiro.
//      - NUNCA inventa resultado (regra inegociável nº 11) e sempre traz a
//        DATA/momento do exame; se o médico não informou data nenhuma, o
//        servidor acrescenta um lembrete curto na discussão (avisarSemData).
//      - SOBREVIVÊNCIA NO HISTÓRICO: o campo é salvo na etapa e também entra
//        no RESUMO das etapas do meio (resumirEtapaHistorico), para o valor
//        transcrito de uma foto continuar disponível nas etapas seguintes —
//        as fotos continuam NÃO sendo gravadas (LGPD/limite do Redis).
//   2) EVOLUÇÃO SEM CONDUTA REPETIDA E CONDUTA MAIS ENXUTA: o texto da
//      evolução vinha terminando com uma linha que já repetia o campo
//      Conduta, e a conduta vinha com 6-7 itens. Corrigido NO PROMPT (proibida
//      a conduta dentro do texto da evolução; conduta com 3 a 4 itens, nunca
//      mais que 4). DE PROPÓSITO não há corte automático no servidor: apagar
//      item de conduta por regex é risco clínico (poderia cortar justo o
//      "Encaminho ao hospital"). Se escapar, o médico apaga a linha.
//
//  Novidades da v6 (24/jul/2026) — três ajustes:
//   1) RECEITA COM FREQUÊNCIA EM HORAS: a posologia domiciliar sai SEMPRE em
//      intervalo de horas ("de 8/8 horas"), NUNCA "até 3x ao dia" / "4 vezes
//      ao dia". Corrigido o próprio MODELO do prompt (que ensinava o erro),
//      criada regra explícita e a função preferirIntervaloHoras no servidor
//      (2x->12/12h, 3x->8/8h, 4x->6/6h, 6x->4/4h; "1x ao dia" fica; "5x ao
//      dia" não tem intervalo redondo e não é tocado).
//   2) DILUIÇÃO INLINE NA PRESCRIÇÃO DO ACRÍZIO: a UPA Acrízio passou a exigir
//      diluição nas medicações feitas na unidade. Diferente do Barreiro (bloco
//      separado), no Acrízio a diluição vai NA MESMA LINHA da medicação
//      (função anexarDiluicaoInline). Usa a MESMA tabela diluicoes.js (nunca
//      inventa); se o médico já ditou a diluição na linha, o servidor NÃO
//      anexa por cima; injetável sem diluição na tabela gera o mesmo aviso do
//      Barreiro na discussão. O Barreiro segue EXATAMENTE como estava.
//   3) CONDUTA EM PRIMEIRA PESSOA: o tempo verbal da conduta muda do
//      infinitivo para a primeira pessoa do presente ("faço, prescrevo,
//      solicito, oriento"). Prompt reescrito + função
//      preferirPrimeiraPessoaConduta no servidor (substitui a antiga
//      preferirInfinitivoConduta). A conversão forçada age SÓ no verbo que
//      ABRE cada item, para não corromper frases no meio da linha
//      (ex.: "orientação de retornar se piora" fica intacta).
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
//  FLASH atualizado (24/jul/2026): gemini-3.6-flash (lançado 21/jul/2026) —
//  mais barato na saída, ~17% menos tokens e melhor em benchmarks que o 3.5.
//  PRO: mantido no 2.5-pro de propósito. O 3.1 Pro ainda está em "preview" e o
//  nome exato do modelo não foi confirmado — nome errado = erro em TODA chamada
//  do botão Pro (e erro de modelo inexistente NÃO aciona o fallback pro Claude,
//  que só pega sobrecarga 503/429/500). Trocar por 'gemini-3.1-pro' SÓ quando o
//  Google publicar a versão estável com esse nome. Com a cobrança ativada no
//  projeto, o 2.5-pro deixou de ter o limite de pedidos do nível gratuito.
const MODELO_RAPIDO = 'gemini-3.6-flash';
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
//  v7.1: PDF passou a ser aceito COMO ANEXO DIRETO (não pela ponte). Fica numa
//  lista separada porque o caminho dele é diferente em três pontos: não é
//  comprimido pela tela, tem teto próprio de tamanho e, no Claude, vira um
//  bloco "document" em vez de "image".
const TIPOS_PDF = ['application/pdf'];
const TIPOS_ACEITOS = TIPOS_IMAGEM.concat(TIPOS_PDF);
const TAMANHO_MAX_FOTO_PONTE = 1000 * 1024; // ~1 MB em base64 por foto (a tela comprime para <=950 KB; cabe na gravação de 1 MB do Upstash)
const TAMANHO_MAX_FOTO = 2 * 1024 * 1024;   // limite por foto anexada num atendimento
//  PDF não é comprimido: teto de ~4 MB de arquivo real. Em base64 o texto fica
//  ~1,37x maior, por isso o número aqui é maior que 4 MB.
const TAMANHO_MAX_PDF = 5.6 * 1024 * 1024;
//  v7.3 — teto de espera por uma geração. Acima disso o pedido é abortado e o
//  médico recebe um erro claro. 2 minutos é folgado para o Pro com anexo e
//  curto o bastante para não estragar um plantão.
const TEMPO_LIMITE_IA = 120000;

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
    const candidatos = [];
    diluicoesBarreiro.forEach(item => {
        // v8: além do princípio, casa também pelos APELIDOS do registro. Isso
        // resolve o caso em que a farmácia escreve "Fentanila" e a tabela
        // guarda "fentanil" — antes o remédio parecia ausente.
        const chaves = [item.principio].concat(item.apelidos || []);
        chaves.forEach(chave => {
            const pa = semAcento(chave).trim();
            if (pa.length <= 3) return;
            // Palavra inteira: a chave precisa estar cercada por início/fim de
            // linha ou por caracteres que não sejam letras.
            const paEscapado = pa.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp('(^|[^a-z])' + paEscapado + '($|[^a-z])');
            if (regex.test(alvo)) candidatos.push({ item, tam: pa.length });
        });
    });
    if (!candidatos.length) return null;

    // Preferência 1: chave mais longa (mais específica).
    const maior = Math.max(...candidatos.map(c => c.tam));
    const finais = [];
    candidatos.filter(c => c.tam === maior).forEach(c => {
        if (finais.indexOf(c.item) === -1) finais.push(c.item);
    });
    if (finais.length === 1) return finais[0];

    // Preferência 2 (v8): dois registros dividem o princípio (ex.: hidrocortisona
    // 100 mg e 500 mg, que têm reconstituições diferentes). Desempata pela DOSE
    // escrita na própria linha prescrita.
    const doses = (alvo.match(/\d+[\d.,]*\s*(mg|mcg|ui|g)\b/g) || [])
        .map(d => d.replace(/\s+/g, ''));
    const batem = finais.filter(reg => {
        const n = semAcento(reg.nome).replace(/\s+/g, '');
        return doses.some(d => n.indexOf(d) !== -1);
    });
    if (batem.length === 1) return batem[0];

    // Se os registros empatados dizem exatamente a mesma coisa, tanto faz.
    const conteudo = reg => JSON.stringify([reg.reconstituicao, reg.evDireto,
        reg.infusao, reg.semRotulo, reg.naoDilui]);
    const distintos = {};
    finais.forEach(reg => { distintos[conteudo(reg)] = true; });
    if (Object.keys(distintos).length === 1) return finais[0];

    // Divergem e não deu para desempatar: NÃO escolhe no escuro, avisa.
    return { ambiguo: true, opcoes: finais };
}

// A linha prescrita é intramuscular PURA? (v8) Se for, não recebe diluição de
// infusão — em IM, de modo geral, não se dilui; no máximo se reconstitui o pó.
// Só vale quando a linha fala IM e NÃO fala EV: "IM/EV" continua recebendo.
function linhaEhIntramuscular(linha) {
    const t = semAcento(linha);
    const temIM = /(^|[^a-z])(im|intramuscular)($|[^a-z])/.test(t);
    const temEV = /(^|[^a-z])(ev|iv|endovenos\w*|intravenos\w*)($|[^a-z])/.test(t);
    return temIM && !temEV;
}

// Monta as partes do texto de diluição a partir do registro (v8).
// Formato enxuto, decidido pelo médico: SÓ reconstituição e diluição.
// Tempo de infusão, concentração máxima e observações continuam guardados no
// diluicoes.js (campos com "_"), mas NÃO são impressos.
function partesDiluicao(reg, ehIM) {
    const partes = [];
    if (reg.reconstituicao) partes.push(`reconstituir: ${reg.reconstituicao}`);
    if (ehIM || reg.naoDilui) return partes;
    const mostra = (m, rotulo) => {
        if (!m) return;
        const vol = m.volume ? ' ' + m.volume : '';
        partes.push(`diluir${rotulo}: ${m.diluente}${vol}`.replace(/:\s+$/, ':'));
    };
    // A fonte separou os dois modos? Então mostra os dois, identificados.
    mostra(reg.evDireto, ' (EV direto)');
    mostra(reg.infusao, ' (infusão)');
    mostra(reg.semRotulo, ' em');
    if (!reg.completo) {
        partes.push('ATENÇÃO: registro incompleto na tabela — conferir volume manualmente');
    }
    return partes;
}

// Monta um texto de diluição legível a partir do registro da tabela.
function textoDiluicao(reg, ehIM) {
    return partesDiluicao(reg, ehIM).join(' · ');
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

// TEMPO VERBAL DA CONDUTA — PRIMEIRA PESSOA (v6): a conduta usa o estilo
// consagrado de nota médica em primeira pessoa do presente ("faço, prescrevo,
// solicito, oriento"). A IA às vezes escorrega para o infinitivo ("fazer") ou
// o particípio ("feito"); esta função converte à força o verbo que ABRE cada
// item da conduta. Cinto e suspensório, além da instrução no prompt.
//
// CUIDADO (por que só no INÍCIO da linha): converter o verbo em qualquer
// posição corromperia frases legítimas no meio do item — ex.: "alta com
// orientação de RETORNAR se piora" (ação do PACIENTE, não do médico) ou
// "paciente orientado quanto aos riscos". Restringir ao verbo de abertura do
// item (após "-", "•" ou "1.") pega exatamente onde o verbo de conduta mora,
// sem efeito colateral. Preserva a maiúscula/minúscula original.
function preferirPrimeiraPessoaConduta(txt) {
    if (!txt || typeof txt !== 'string') return txt;
    // pares: [infinitivo OU particípio] -> primeira pessoa do presente
    const trocas = [
        ['administrar|administrad[ao]s?', 'administro'],
        ['fazer|feit[ao]s?', 'faço'],
        ['realizar|realizad[ao]s?', 'realizo'],
        ['prescrever|prescrit[ao]s?', 'prescrevo'],
        ['solicitar|solicitad[ao]s?', 'solicito'],
        ['encaminhar|encaminhad[ao]s?', 'encaminho'],
        ['iniciar|iniciad[ao]s?', 'inicio'],
        ['aplicar|aplicad[ao]s?', 'aplico'],
        ['puncionar|puncionad[ao]s?', 'punciono'],
        ['monitorizar|monitorizad[ao]s?', 'monitorizo'],
        ['orientar|orientad[ao]s?', 'oriento'],
        ['reavaliar|reavaliad[ao]s?', 'reavalio'],
        ['manter|mantid[ao]s?', 'mantenho'],
        ['suspender|suspens[ao]s?', 'suspendo'],
        ['associar|associad[ao]s?', 'associo'],
        ['liberar|liberad[ao]s?', 'libero'],
        ['avaliar|avaliad[ao]s?', 'avalio'],
        ['coletar|coletad[ao]s?', 'coleto'],
        ['transferir|transferid[ao]s?', 'transfiro'],
    ];
    return txt.split('\n').map(linha => {
        for (const [padrao, pp] of trocas) {
            // O verbo precisa ABRIR o item: início da linha, opcionalmente
            // precedido de marcador ("-", "•", "*", "1.", "2)").
            const re = new RegExp('^(\\s*(?:[-•*]\\s*|\\d+[.)]\\s*)?)(' + padrao + ')\\b', 'i');
            const m = linha.match(re);
            if (m) {
                const original = m[2];
                const sub = (original.charAt(0) === original.charAt(0).toUpperCase())
                    ? pp.charAt(0).toUpperCase() + pp.slice(1)
                    : pp;
                return linha.replace(re, (_t, prefixo) => prefixo + sub);
            }
        }
        return linha;
    }).join('\n');
}

// FREQUÊNCIA EM HORAS (v6): a posologia deve sair em INTERVALO DE HORAS
// ("de 8/8 horas"), nunca "até 3x ao dia" / "4 vezes ao dia" — formato que a
// IA aprendia do próprio exemplo antigo do prompt. Esta função converte à
// força os casos com intervalo redondo. Cinto e suspensório, além da regra
// nova no prompt.
//
// CUIDADO: só converte 2, 3, 4 e 6 vezes ao dia (12/12h, 8/8h, 6/6h, 4/4h).
// "1x ao dia" é formato normal e FICA; "5x ao dia" (ex.: aciclovir) não tem
// intervalo redondo e NÃO é tocado. O texto ao redor (ex.: "se náusea") é
// preservado. "12 vezes ao dia" não casa (não há fronteira entre 1 e 2).
function preferirIntervaloHoras(txt) {
    if (!txt || typeof txt !== 'string') return txt;
    const mapa = { '2': 'de 12/12 horas', '3': 'de 8/8 horas', '4': 'de 6/6 horas', '6': 'de 4/4 horas' };
    const re = /(?:at[eé]\s+)?\b([2346])\s*(?:x|vezes)\s*(?:\/\s*|\s+(?:ao|por)\s+)dia\b/gi;
    return txt.replace(re, (m, n) => mapa[n] || m);
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

// ---------------------------------------------------------------------------
//  EXAMES COMPLEMENTARES (v7) — três funções pequenas e determinísticas.
// ---------------------------------------------------------------------------

// (1) TRAVA: o campo só pode existir se tiver CONTEÚDO DE VERDADE. Zera quando
// vier vazio, só com o rótulo, ou com um placeholder negativo ("não foram
// realizados exames", "sem exames complementares", "nenhum", "não informado").
// Motivo: a regra inegociável nº 4 vale aqui igual aos sinais vitais — nada de
// caixa vazia nem rótulo em branco na tela. Conservador: se sobrar QUALQUER
// conteúdo clínico além do placeholder, o campo é preservado inteiro.
function limparExamesComplementares(txt) {
    if (!txt || typeof txt !== 'string') return '';
    let s = txt.trim();
    if (!s) return '';
    // Tira um rótulo que a IA tenha colocado na frente ("Exames complementares:")
    s = s.replace(/^\s*exames?\s+(complementar(es)?|pr[ée]vios?( realizados?)?)\s*:?\s*/i, '').trim();
    if (!s) return '';
    // Só pontuação/traços ("-", "--", "—", ".") não é conteúdo clínico.
    if (/^[-–—._\s]+$/.test(s)) return '';
    // Placeholders negativos: só zera se a resposta INTEIRA for o placeholder
    // (curta e sem números), para nunca apagar um resultado de verdade.
    const semAcentoTxt = semAcento(s.toLowerCase());
    const ehNegativa = /^(nao|sem|nenhum|n\/a|na|-{1,3}|nada)\b/.test(semAcentoTxt)
        || /^(exames?\s+)?(nao\s+realizados?|nao\s+informados?|nao\s+se\s+aplica)\b/.test(semAcentoTxt);
    if (ehNegativa && s.length <= 120 && !/\d/.test(s)) return '';
    return s;
}

// (1b) REMISSÃO AO ANEXO (v7.2): detecta o campo que só APONTA para o anexo
// em vez de trazer o resultado ("resultado conforme documento anexado", "vide
// anexo"). Isso não é resultado — e é pior que campo vazio, porque parece que
// o exame foi conferido. Conservador: só acusa se for texto CURTO e SEM
// nenhuma unidade de medida; assim "Laboratório (hoje, em anexo): Hb 11,2 g/dL"
// (que TEM resultado de verdade) nunca é confundido com remissão.
function ehRemissaoAnexo(txt) {
    if (!txt || typeof txt !== 'string') return false;
    const s = semAcento(txt.toLowerCase());
    const remete = /(conforme|segundo|ver|vide|consta|disponivel|descrito|registrado)[^.]{0,30}\b(anexo|anexado|anexada|documento|laudo|arquivo|imagem|foto|pdf)\b/.test(s)
        || /\b(exames?|resultados?)\s+(em|no|na)\s+anexo\b/.test(s)
        || /\bem anexo\s*[:.]/.test(s);
    if (!remete) return false;
    // Se houver QUALQUER unidade de medida, há resultado de verdade: preserva.
    const temUnidade = /\b(g\/dl|mg\/dl|mg\/l|meq\/l|mmol|mcg|ng\/ml|u\/l|ui\/l|mm3|mm³|\/mm|p\/campo|bpm|mmhg|%|milhoes)\b/.test(s);
    if (temUnidade) return false;
    return s.length <= 200;
}

// (1c) UNIFICAÇÃO DO LABORATÓRIO (v7.2) — TRAVA DUPLA do formato. A IA às vezes
// fatia o laboratório em várias linhas ("Hemograma (hoje): ...", "Bioquímica
// (hoje): ...", "EAS (hoje): ...") e repete a data em cada uma. Esta função
// junta TUDO numa linha só, com UMA data.
//
// É DE PROPÓSITO LOSSLESS: não apaga NENHUM resultado. Só (a) junta linhas,
// (b) remove a data repetida e (c) remove rótulos redundantes de painel
// (Hemograma/Bioquímica/Laboratório), cujos valores já se identificam sozinhos.
// A SELEÇÃO do que entra continua no prompt: apagar valor de exame por regex é
// risco clínico direto (um "pH" apagado numa gasometria seria grave).
//
// ECG e exames de imagem NÃO são tocados: continuam em linha própria.
const ROTULOS_LAB = /^\s*(laborat[óo]rio|labs?|exames? laboratoriais?|hemograma( completo)?|h[ée]mograma|bioqu[íi]mica|eletr[óo]litos|fun[çc][ãa]o renal|marcadores( card[íi]acos)?|coagulograma|gasometria( arterial| venosa)?|glicemia( capilar)?|eas|urina( rotina| tipo i+)?|sum[áa]rio de urina|parcial de urina|teste r[áa]pido)\b\s*/i;
// Rótulos que NÃO acrescentam informação (os valores falam por si) e podem sair
// ao juntar. Os demais (EAS, gasometria, teste rápido) são PRESERVADOS.
const ROTULOS_LAB_REDUNDANTES = /^\s*(laborat[óo]rio|labs?|exames? laboratoriais?|hemograma( completo)?|h[ée]mograma|bioqu[íi]mica|eletr[óo]litos|fun[çc][ãa]o renal)\b\s*/i;

function unificarLinhasLaboratorio(txt) {
    if (!txt || typeof txt !== 'string') return txt;
    const linhas = txt.split('\n').map(l => l.trim()).filter(Boolean);
    if (linhas.length <= 1) return txt;

    const laboratoriais = [];
    const outras = [];
    let posicaoPrimeiroLab = -1;
    let dataComum = '';

    linhas.forEach(linha => {
        if (!ROTULOS_LAB.test(linha)) { outras.push(linha); return; }
        if (posicaoPrimeiroLab === -1) posicaoPrimeiroLab = outras.length;
        let corpo = linha;
        // Guarda a PRIMEIRA data encontrada; remove as demais (repetidas).
        const comData = corpo.match(/^([^(]*)\(([^)]*)\)\s*:?\s*(.*)$/);
        if (comData) {
            if (!dataComum) dataComum = comData[2].trim();
            const rotulo = comData[1].replace(/[\s:_-]+$/, '').trim();
            corpo = (rotulo ? rotulo + ': ' : '') + comData[3].trim();
            corpo = corpo.replace(/\s+/g, ' ').trim();
        }
        corpo = corpo.replace(/^\s*:\s*/, '');
        // Rótulo redundante sai; rótulo informativo (EAS, gasometria...) fica.
        if (ROTULOS_LAB_REDUNDANTES.test(corpo)) {
            corpo = corpo.replace(ROTULOS_LAB_REDUNDANTES, '').replace(/^\s*:\s*/, '').trim();
        } else {
            corpo = corpo.replace(/^([^:]{1,28}):\s*/, (m, rot) => rot.trim() + ': ');
        }
        corpo = corpo.replace(/[.;]\s*$/, '').trim();
        if (corpo) laboratoriais.push(corpo);
    });

    if (laboratoriais.length === 0) return txt;
    let linhaLab = 'Laboratório' + (dataComum ? ' (' + dataComum + ')' : '') + ': '
        + laboratoriais.join(' | ') + '.';
    linhaLab = linhaLab.replace(/\s*\|\s*/g, ' | ').replace(/(?: \| ){2,}/g, ' | ');

    const saida = outras.slice();
    saida.splice(posicaoPrimeiroLab === -1 ? saida.length : posicaoPrimeiroLab, 0, linhaLab);
    return saida.join('\n');
}

// (2) LEMBRETE DE DATA: o Paulo pediu que TODO exame venha com a data (ou o
// momento: "na admissão", "hoje 14h"). Esta função NÃO inventa nem altera nada
// — só detecta a AUSÊNCIA total de referência temporal para o servidor
// acrescentar um lembrete curto na discussão. Devolve true = está sem data.
function examesSemReferenciaDeData(txt) {
    if (!txt || typeof txt !== 'string') return false;
    const s = semAcento(txt.toLowerCase());
    if (/\d{1,2}\s*\/\s*\d{1,2}/.test(s)) return false; // achou dd/mm -> tem data
    const temHora = /\b\d{1,2}\s*[:h]\s*\d{0,2}\b/.test(s);
    const temPalavra = /\b(admissao|chegada|entrada|hoje|ontem|agora|previo|previa|anterior|reavaliacao|na upa|coletado|realizado em|data)\b/.test(s);
    return !(temHora || temPalavra);
}

// (3) POSIÇÃO NA EVOLUÇÃO: na evolução o resultado NÃO vai numa caixa solta —
// vai no FIM do texto corrido, separado por uma linha em branco (decisão do
// médico em 31/ago). Quem posiciona é o servidor, não a IA: assim o lugar é
// sempre o mesmo. Sem rótulo — entra direto o conteúdo ("ECG (admissão): ...").
// Idempotente: se o texto já termina com exatamente esse conteúdo, não duplica.
function anexarExamesNaEvolucao(evolucao, exames) {
    const ex = (exames || '').trim();
    if (!ex) return evolucao || '';
    const base = (evolucao || '').trim();
    if (!base) return ex;
    if (base.endsWith(ex)) return base;   // já está lá (não duplica)
    return base + '\n\n' + ex;
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
        const saida = {
            _resumo: true,
            tipo: (etapa && etapa.tipo) ? etapa.tipo : 'prontuario',
            quando: data,
            resumo: trecho || '(sem conduta/evolução registrada)'
        };
        // v7: RESULTADO DE EXAME NUNCA É RESUMIDO FORA. Se aquela etapa teve
        // exame complementar (inclusive valor transcrito de uma foto, que não
        // é guardada), ele vai INTEIRO no resumo — é dado numérico que não pode
        // se perder, sob pena de a IA "preencher a lacuna" numa etapa seguinte.
        const ex = (r.exames_complementares || '').trim();
        if (ex) saida.exames_complementares = ex;
        return saida;
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
        if (reg && reg.ambiguo) {
            // Mais de uma apresentação na tabela e a linha não diz qual é.
            const t = linha.trim();
            if (t) resultado.naoEncontrados.push(t + ' (mais de uma apresentação na tabela)');
        } else if (reg) {
            const ehIM = linhaEhIntramuscular(linha);
            const corpo = textoDiluicao(reg, ehIM);
            // Em linha IM sem pó para reconstituir não sobra nada a mostrar.
            if (corpo && !vistos.has(reg.nome)) {
                vistos.add(reg.nome);
                blocos.push(`• ${reg.nome}\n   ${corpo}`);
            }
        } else {
            const t = linha.trim();
            if (t) resultado.naoEncontrados.push(t);
        }
    });

    if (blocos.length > 0) {
        resultado.blocoSeparado =
            'DILUIÇÕES (referência técnica — CONFERIR antes de administrar):\n\n'
            + blocos.join('\n\n');
    }
    return resultado;
}

// Versão COMPACTA da diluição para caber NA MESMA LINHA da prescrição
// (modo Acrízio). Traz só o essencial do preparo: reconstituição, diluição e
// tempo/velocidade. A via fica de fora (já está na própria linha prescrita);
// concentração máxima e observações longas ficam de fora por espaço — a
// referência completa continua na tabela.
function textoDiluicaoInline(reg, ehIM) {
    return partesDiluicao(reg, ehIM).join(' · ');
}

// DILUIÇÃO INLINE (SÓ Acrízio, v6): a UPA Acrízio passou a exigir diluição
// nas medicações administradas na unidade — e lá o formato pedido é TUDO NA
// MESMA LINHA (medicação + como fazer + diluição), diferente do Barreiro
// (bloco separado). Esta função varre a prescrição interna e, em cada linha
// injetável, anexa a diluição da tabela ao FIM da própria linha.
// Regras de segurança:
//   - usa APENAS a tabela diluicoes.js (regra inegociável nº 1: nunca chuta);
//   - se o MÉDICO já ditou a diluição na linha (contém "dilu"/"reconstitu"),
//     o servidor NÃO anexa por cima — o que o médico escreveu prevalece;
//   - injetável SEM diluição na tabela entra em naoEncontrados (vira o mesmo
//     aviso do Barreiro na discussão).
function anexarDiluicaoInline(textoPrescricao) {
    const resultado = { texto: textoPrescricao || '', naoEncontrados: [] };
    if (!textoPrescricao) return resultado;

    resultado.texto = textoPrescricao.split('\n').map(linha => {
        const minus = semAcento(linha);
        const ehInjetavel = /(ampola|frasco|injet|endoven|\bev\b|\bim\b|intramuscular|intravenos)/i.test(minus);
        if (!pareceMedicacao(linha) || !ehInjetavel) return linha;

        // O médico já ditou a diluição nesta linha? Então respeita e não mexe.
        if (/dilu|reconstitu/.test(minus)) return linha;

        const reg = buscarDiluicao(linha);
        if (!reg) {
            const t = linha.trim();
            if (t) resultado.naoEncontrados.push(t);
            return linha;
        }
        if (reg.ambiguo) {
            const t = linha.trim();
            if (t) resultado.naoEncontrados.push(t + ' (mais de uma apresentação na tabela)');
            return linha;
        }
        const info = textoDiluicaoInline(reg, linhaEhIntramuscular(linha));
        if (!info) return linha;
        // Tira ponto final/espaços sobrando antes de emendar, para não sair
        // "agora. — diluir em...".
        const base = linha.replace(/[\s.]+$/, '');
        return `${base} — ${info}`;
    }).join('\n');

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
async function chamarGemini(promptFinal, modeloId, usarBusca, imagens, sinal) {
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
    // O Gemini lê imagem E PDF pelo mesmo "inlineData" — basta o mimeType certo.
    const parts = [{ text: promptFinal }];
    (imagens || []).forEach(img => {
        parts.push({ inlineData: { mimeType: img.mimeType, data: img.data } });
    });
    // v7.1: 'sinal' permite cortar a chamada quando o médico cancela.
    const opcoesPedido = sinal ? { signal: sinal } : undefined;
    const result = await model.generateContent({
        contents: [{ role: 'user', parts }],
        generationConfig
    }, opcoesPedido);
    return result.response.text();
}

//  v7.1: detecta se o erro veio de um CANCELAMENTO (o médico clicou em
//  "Cancelar geração" e o navegador fechou a conexão). Precisa ser tratado
//  ANTES do fallback: sem isso, cancelar o Gemini dispararia uma chamada nova
//  (e paga) ao Claude — exatamente o oposto do que se quer.
function ehAborto(error, sinal) {
    if (sinal && sinal.aborted) return true;
    if (!error) return false;
    const nome = error.name || '';
    const msg = error.message || String(error);
    return nome === 'AbortError' || /abort/i.test(msg);
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
async function chamarClaude(promptFinal, imagens, sinal) {
    if (!process.env.ANTHROPIC_API_KEY) {
        throw new Error('ANTHROPIC_API_KEY não configurada no Render.');
    }
    let conteudo = promptFinal;
    if (imagens && imagens.length > 0) {
        // v7.1: o Claude NÃO usa o mesmo bloco para os dois formatos. Imagem vai
        // como "image"; PDF vai como "document". Mandar PDF dentro de um bloco
        // de imagem faz a chamada inteira falhar.
        conteudo = imagens.map(img => (
            TIPOS_PDF.includes(img.mimeType)
                ? {
                    type: 'document',
                    source: { type: 'base64', media_type: 'application/pdf', data: img.data }
                }
                : {
                    type: 'image',
                    source: { type: 'base64', media_type: img.mimeType, data: img.data }
                }
        ));
        conteudo.push({ type: 'text', text: promptFinal });
    }
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        signal: sinal,
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
async function gerarComFallback(promptFinal, modeloId, usarBusca, imagens, sinal) {
    if (modeloId === 'claude') {
        const txt = await chamarClaude(promptFinal, imagens, sinal);
        return { dados: extrairJson(txt), motorUsado: 'claude', caiuParaClaude: false };
    }
    try {
        const txt = await chamarGemini(promptFinal, modeloId, usarBusca, imagens, sinal);
        return { dados: extrairJson(txt), motorUsado: 'gemini', caiuParaClaude: false };
    } catch (error) {
        // v7.1: CANCELAMENTO vem antes de tudo. Se o médico cancelou, o erro do
        // Gemini é um aborto — e aborto NÃO é sobrecarga. Sem esta guarda, o
        // cancelamento dispararia uma chamada nova (e paga) ao Claude.
        if (ehAborto(error, sinal)) throw error;
        // Só cai pro Claude se: (a) for falha temporária do Gemini E (b) houver
        // chave da Anthropic configurada. Senão, repassa o erro original.
        if (ehFalhaTemporariaGemini(error) && process.env.ANTHROPIC_API_KEY) {
            console.error('Gemini falhou (sobrecarga); tentando Claude. Detalhe:', error.message);
            const txt = await chamarClaude(promptFinal, imagens, sinal);
            return { dados: extrairJson(txt), motorUsado: 'claude', caiuParaClaude: true };
        }
        throw error;
    }
}

// ----------------------------------------------------------------------------
//  ROTA PRINCIPAL
// ----------------------------------------------------------------------------
app.post('/api/atendimento', limitarAbuso, async (req, res) => {
    // ------------------------------------------------------------------
    //  v7.1 — CANCELAMENTO. Se o médico clicar em "Cancelar geração", o
    //  navegador fecha a conexão. Isso, sozinho, NÃO cancela a chamada que o
    //  Render já fez ao Gemini/Claude — por isso guardamos um AbortController
    //  e o repassamos às IAs. E, principalmente: com 'clienteSaiu' ligado,
    //  NADA é gravado no Redis (nunca uma etapa fantasma no BE).
    // ------------------------------------------------------------------
    const abortador = new AbortController();
    let clienteSaiu = false;
    const nasceuEm = Date.now();
    // v7.4 — TEM QUE SER res.on('close'), NUNCA req.on('close').
    // 'req' fecha quando o CORPO DO PEDIDO acaba de ser lido (logo no começo,
    // com o cliente conectado) — usar 'req' aqui marcava cancelamento em toda
    // geração e fazia o servidor descartar respostas boas em silêncio.
    // 'res' fecha quando a RESPOSTA termina ou quando a conexão cai de fato.
    res.on('close', () => {
        if (!res.writableEnded) {
            clienteSaiu = true;
            try { abortador.abort(); } catch (e) {}
            // Se esta linha aparecer no log logo após o início do pedido, é
            // sinal de que a detecção voltou a disparar cedo demais.
            console.log('Cliente desconectou após '
                + ((Date.now() - nasceuEm) / 1000).toFixed(1)
                + 's — a geração será descartada.');
        }
    });

    try {
        const { beId, mensagem, unidade, opcoes, modeloId, sexo, idade, tipoDocumento, imagens } = req.body;

        if (!beId || !mensagem) {
            return res.status(400).json({ erro: 'Número do BE e relato são obrigatórios.' });
        }

        // ANEXOS DE DOCUMENTOS enviados pela tela (exames, prontuários antigos,
        // evoluções): fotos e — desde a v7.1 — PDFs. Máximo de 9. As fotos já
        // chegam comprimidas pela tela; o PDF vem inteiro e tem teto próprio.
        // NADA disso é gravado no histórico — só o texto gerado a partir dele.
        let fotos = Array.isArray(imagens) ? imagens : [];
        fotos = fotos.filter(f => f && typeof f.data === 'string' && f.data.length > 0);
        // v7.1: tipo não suportado agora dá ERRO CLARO. Antes era descartado em
        // silêncio — o médico achava que a IA tinha lido o anexo, e não tinha.
        const naoSuportado = fotos.find(f => !TIPOS_ACEITOS.includes(f.mimeType));
        if (naoSuportado) {
            return res.status(400).json({ erro: 'Anexo em formato não suportado (' + (naoSuportado.mimeType || 'desconhecido') + '). Aceito: foto JPEG/PNG/WEBP ou arquivo PDF.' });
        }
        fotos = fotos.slice(0, MAX_FOTOS_POR_CODIGO);
        if (fotos.some(f => TIPOS_IMAGEM.includes(f.mimeType) && f.data.length > TAMANHO_MAX_FOTO)) {
            return res.status(400).json({ erro: 'Uma das fotos ficou grande demais mesmo após a compressão. Fotografe de novo, de mais perto ou por partes.' });
        }
        if (fotos.some(f => TIPOS_PDF.includes(f.mimeType) && f.data.length > TAMANHO_MAX_PDF)) {
            return res.status(400).json({ erro: 'Um dos PDFs passa de ~4 MB. PDF não pode ser comprimido pelo navegador: envie só as páginas necessárias, ou fotografe a página que interessa.' });
        }
        // v7.2 — CHECAGEM DE ASSINATURA. Todo PDF começa com os bytes "%PDF-",
        // que em base64 viram "JVBERi". Se não começar assim, o que chegou não
        // é um PDF íntegro — e mandar isso para a IA gera exatamente o pior
        // resultado possível: ela responde sem ter lido nada.
        const pdfQuebrado = fotos.find(f => TIPOS_PDF.includes(f.mimeType)
            && f.data.slice(0, 6) !== 'JVBERi');
        if (pdfQuebrado) {
            console.error('PDF com assinatura inválida. Início do base64:', String(pdfQuebrado.data).slice(0, 24));
            return res.status(400).json({ erro: 'O PDF chegou corrompido (não tem a assinatura de um PDF válido). Tente anexar de novo, ou tire um print da página e anexe como foto.' });
        }
        // Diagnóstico no log do Render (não expõe conteúdo clínico).
        fotos.filter(f => TIPOS_PDF.includes(f.mimeType)).forEach((f, i) => {
            console.log('PDF #' + (i + 1) + ' recebido: ' + Math.round(f.data.length / 1024) + ' KB em base64, assinatura OK.');
        });
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

        // v7.6 — MODO INTERNAÇÃO. Desligado por padrão. Quando ligado, cinco
        // campos novos entram no esquema JSON e um bloco de instruções entra no
        // prompt. Quando desligado, NADA disso é mandado à IA (prompt enxuto) e
        // o servidor ainda zera os campos à força no pós-processamento.
        const internacao = op.internacao === true;

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
        if (internacao) {
            instrucoesAcao += '- DOCUMENTOS DE INTERNAÇÃO (campos 20/21/22 do laudo de AIH, relatório de internação e prescrição de internação), conforme o bloco MODO INTERNAÇÃO mais abaixo.\n';
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

        // Bloco de instruções sobre os ANEXOS (só entra no prompt se houver anexo).
        // v7.1: o texto passa a citar PDF quando houver, para a IA não tratar o
        // arquivo como se fosse uma foto solta.
        // v7.6 — BLOCO DO MODO INTERNAÇÃO. Só existe quando o toggle está
        // ligado; com ele desligado esta variável fica vazia e nenhuma instrução
        // de internação chega ao modelo.
        let blocoInternacao = '';
        let chavesInternacao = '';
        if (internacao) {
            chavesInternacao = `
  "aih_sinais_sintomas": "",
  "aih_condicoes": "",
  "aih_exames": "",
  "relatorio_internacao": "",
  "prescricao_internacao": "",`;
            blocoInternacao = `
════════════════ MODO INTERNAÇÃO (ligado pelo médico) ════════════════
O paciente VAI SER INTERNADO, mas a vaga demora horas e ele CONTINUA na UPA
sendo medicado nesse meio-tempo. Existem, portanto, DUAS prescrições ao mesmo
tempo, que NUNCA podem se misturar nem repetir itens uma da outra:
  • "prescricao_interna"    = o que se faz AGORA, na UPA;
  • "prescricao_internacao" = a prescrição da INTERNAÇÃO.

A) "aih_sinais_sintomas" (campo 20 do laudo de AIH): quadro clínico OBJETIVO —
   queixa, tempo de evolução, sinais, sintomas e os sinais vitais relevantes.
   Texto corrido, descritivo e assertivo, sem hipótese e sem conduta.

B) "aih_condicoes" (campo 21): POR QUE este paciente NÃO pode ser tratado
   ambulatorialmente — gravidade, necessidade de medicação endovenosa, de
   vigilância contínua, falha do tratamento na UPA, risco de deterioração.

C) "aih_exames" (campo 22): SOMENTE exames REALMENTE realizados e relatados,
   com valores e unidades exatos.
   ⚠️ RISCO MÁXIMO DESTE CAMPO: o laudo de AIH é DOCUMENTO OFICIAL DO SUS.
   É PROIBIDO inventar, estimar ou completar qualquer resultado. Se nenhum exame
   foi realizado, escreva EXATAMENTE: "Não foram realizados exames
   complementares nesta unidade." e nada mais. Nunca escreva hemograma, PCR,
   raio-X ou qualquer valor que não esteja no relato do médico ou já registrado
   em "exames_complementares".

D) "relatorio_internacao": o caso INTEIRO em formato de PRONTUÁRIO (não de
   evolução): história, antecedentes, exame físico, exames, o que houve na UPA,
   diagnóstico e o que já foi feito. É o documento que segue com o paciente.

E) "prescricao_internacao": prescrição da internação, nesta ordem de blocos
   (omita o bloco que não se aplicar ao caso):
   1. DIETA (zero, líquida, branda, geral, para diabético, jejum).
   2. HIDRATAÇÃO / SORO — tipo, volume e velocidade.
   3. MEDICAÇÕES DE HORÁRIO — dose, via e intervalo EM HORAS.
   4. SE NECESSÁRIO — cada item com o GATILHO explícito (ex.: "Dipirona 1 g EV
      se dor ou temperatura ≥ 37,8 °C"). Monte o conjunto habitual que couber ao
      caso, sem exagerar no número de itens.
   5. ANTIBIÓTICO, em bloco destacado — dose, via e intervalo. ESCOLHA o
      antibiótico adequado ao caso; se o médico já disse qual quer, use o dele.
      NÃO numere dia de tratamento (D1, D2): o sistema não tem como saber quando
      começou.
   6. PROFILAXIAS — ver as duas regras abaixo.
   7. MEDICAÇÕES DE USO CONTÍNUO — ver a regra da substituição abaixo.
   8. CUIDADOS E VIGILÂNCIA (sinais vitais, diurese, cabeceira, oxigênio,
      acesso venoso).

   TODAS as medicações desta prescrição têm de existir na PADRONIZAÇÃO DESTA
   UNIDADE listada acima: quem executa esta prescrição enquanto a vaga não sai é
   a equipe da própria UPA.

──── PROFILAXIA DE TEV — ESCORE DE PÁDUA (obrigatório) ────
Pontue com os dados do relato: câncer ativo 3 · TEV prévio 3 · mobilidade
reduzida 3 · trombofilia conhecida 3 · trauma ou cirurgia há ≤ 1 mês 2 · idade
≥ 70 anos 1 · insuficiência cardíaca e/ou respiratória 1 · infarto agudo do
miocárdio ou AVC isquêmico 1 · infecção aguda ou doença reumatológica 1 ·
obesidade (IMC ≥ 30) 1 · tratamento hormonal em curso 1.

MOSTRE A CONTA na "discussao" — itens que pontuaram, soma e o que ficou sem
avaliar. NUNCA coloque a conta dentro da prescrição.
  • Soma ≥ 4 com o que JÁ SE SABE: PRESCREVA a profilaxia farmacológica no bloco
    6, salvo contraindicação (sangramento ativo, plaquetopenia, anticoagulação
    plena em curso). Nenhum item do Pádua subtrai ponto, então informação que
    falta NÃO pode derrubar uma soma que já fechou.
  • Soma < 4 com o que já se sabe: NÃO prescreva. Escreva na "discussao" a soma
    parcial e LISTE quais itens não puderam ser avaliados por falta de
    informação, para o médico completar o relato e gerar de novo.
  • Havendo contraindicação, diga isso e sugira medida mecânica.
O Pádua vale para paciente CLÍNICO de enfermaria e NÃO avalia risco de
sangramento — a decisão final é sempre do médico.

──── PROTETOR GÁSTRICO ────
Só prescreva se o relato trouxer critério EXPLÍCITO (coagulopatia, sangramento
digestivo prévio, corticoide associado a anti-inflamatório, ventilação
mecânica). Não existe escore validado para isso em enfermaria e protetor
gástrico de rotina é prescrição excessiva. Na dúvida, NÃO prescreva.

──── MEDICAÇÕES DE USO CONTÍNUO ────
  • Existe na padronização desta unidade: MANTENHA.
  • Não existe: SUBSTITUA por equivalente terapêutico da lista e explique na
    "discussao" o que trocou e por quê.
  • EXCEÇÃO ABSOLUTA — NÃO SUBSTITUA por conta própria anticoagulante,
    antiarrítmico, imunossupressor, antirretroviral ou anticonvulsivante. Nesses
    casos abra na "discussao" um bloco começando EXATAMENTE com "[[ATENCAO]]"
    (o sistema usa esse marcador para destacar em laranja), escrito EM CAIXA
    ALTA, dizendo qual medicação falta na unidade, qual seria a sugestão de
    substituição e que a troca PRECISA SER CONFIRMADA PELO MÉDICO. Termine o
    bloco com uma linha em branco.
  • Se o médico disse que o paciente TROUXE o medicamento de casa: mantenha o
    original e não substitua.
══════════════════════════════════════════════════════════════════════
`;
        }

        let blocoFotos = '';
        if (fotos.length > 0) {
            const qtdPdf = fotos.filter(f => TIPOS_PDF.includes(f.mimeType)).length;
            const qtdImg = fotos.length - qtdPdf;
            const descricaoAnexos = [
                qtdImg > 0 ? (qtdImg + ' imagem(ns)') : '',
                qtdPdf > 0 ? (qtdPdf + ' PDF(s)') : ''
            ].filter(Boolean).join(' e ');
            blocoFotos = `
DOCUMENTOS ANEXADOS (${descricaoAnexos}):
- Os anexos são DOCUMENTOS DE REFERÊNCIA (exames, prontuários antigos,
  evoluções, receitas), fotografados ou em PDF.
- Use o conteúdo deles SOMENTE conforme a instrução do médico na mensagem
  (ex.: transcrever resultados de exame, aproveitar a história clínica,
  mesclar com a evolução atual).
- O anexo NUNCA é, por si só, um novo atendimento: o documento a gerar é o que
  o médico pediu na mensagem, no tipo de atendimento indicado acima.
- PRIVACIDADE: IGNORE e OMITA qualquer identificador do paciente que apareça
  no anexo (nome, nome da mãe, CPF, endereço, telefone, convênio). Aproveite
  APENAS os dados clínicos.
- TRANSCRIÇÃO FIEL: copie números, unidades e valores de exames EXATAMENTE
  como estão no anexo. Se um trecho estiver ilegível, cortado ou borrado,
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
- TERMINOLOGIA — "MONITORIZAR": use "monitorizar"/"monitorização" APENAS quando
  o paciente estiver de fato ligado a um MONITOR multiparamétrico (sala
  vermelha, sala de emergência, CTI). Em TODO o resto — observação, enfermaria,
  alta com retorno — escreva "vigilância", "vigiar", "observar", "acompanhar" ou
  "reavaliar". Ex.: escreva "Mantenho em observação com vigilância dos sinais
  vitais", NÃO "monitorização dos sinais vitais". Vale para TODOS os campos.
- CULTURAS: estas unidades NÃO coletam culturas (urocultura, hemocultura,
  coprocultura, cultura de secreção). NUNCA proponha, prescreva ou peça coleta
  de cultura na CONDUTA, e NUNCA cite cultura pendente, coletada ou a coletar em
  "exames_complementares". Se for clinicamente relevante registrar que uma
  cultura seria desejável, isso vai APENAS na "discussao". ÚNICA EXCEÇÃO:
  resultado de cultura JÁ PRONTO, feito fora e relatado pelo médico no texto —
  esse pode ser transcrito em "exames_complementares", em linha própria.
- Não invente comorbidades, alergias ou achados de exame não relatados. Quando
  um dado não foi informado, registre como "não informado" ou deixe em branco.

${contextoFarmacologico}
${blocoFontes}${blocoFotos}${blocoInternacao}
REGRAS DE SAÍDA (responda em JSON puro com EXATAMENTE estas chaves):
{
  "discussao": "",
  "cid": "",
  "evolucao": "",
  "exames_complementares": "",
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
  "exame_externo": "",${chavesInternacao}
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
   PROIBIDO TERMINAR A EVOLUÇÃO COM A CONDUTA (regra importante): o texto da
   evolução descreve APENAS o ESTADO do paciente na reavaliação. Ele NÃO pode
   terminar — nem conter — frases de plano/conduta do tipo "mantenho a
   medicação", "prescrevo...", "solicito...", "oriento...", "aguardo vaga",
   "alta com orientações", "encaminho para...". Tudo isso pertence
   EXCLUSIVAMENTE ao campo "conduta", que aparece logo abaixo na tela e seria
   lido duas vezes. Encerre a evolução na descrição clínica (ex.: "...mantém-se
   afebril, eupneico, aceitando dieta."), e PARE ali.
   NÃO escreva os resultados de exame dentro deste texto: eles vão no campo
   "exames_complementares" (item 2c) e o sistema os posiciona sozinho no lugar
   certo, no fim da evolução.

2c. "exames_complementares": o RESULTADO de exames complementares — ou seja,
   tudo que NÃO é exame físico: ECG, laboratório (hemograma, PCR, troponina,
   eletrólitos, função renal), imagem (raio-X, USG, TC), glicemia capilar,
   gasometria, teste rápido, etc. Vale tanto para PRONTUÁRIO quanto para
   EVOLUÇÃO. Atenção: NÃO confundir com "exame_unidade"/"exame_externo", que
   são PEDIDOS de exame — aqui é o RESULTADO.
   QUANDO PREENCHER: somente quando o médico informar um resultado no relato
   OU quando houver um resultado legível num anexo (foto/documento). Se não
   houver NENHUM exame complementar, deixe o campo TOTALMENTE VAZIO ("") — não
   escreva "não realizados", "sem exames" nem qualquer rótulo em branco; o
   campo simplesmente não deve existir.
   PROIBIDO INVENTAR (regra inegociável): NUNCA crie, estime, complete ou
   "arredonde" um resultado, valor, unidade ou laudo que o médico não informou
   e que não esteja legível no anexo. Valor ilegível vira "[ilegível]" e você
   avisa na "discussao". Transcreva números e unidades EXATAMENTE como estão.
   PROIBIDO REMETER AO ANEXO: é TERMINANTEMENTE PROIBIDO preencher este campo
   com frases como "resultado conforme documento anexado", "vide anexo",
   "exame em anexo", "ver laudo". Só existem DUAS saídas legítimas: ou você
   transcreve os valores que conseguiu ler, ou deixa o campo VAZIO ("") e
   escreve na "discussao" que NÃO conseguiu ler o anexo. Uma linha que apenas
   aponta para o anexo é pior que campo vazio: dá a impressão de que o exame
   foi conferido quando não foi.
   DATA OBRIGATÓRIA: todo exame vem com a DATA ou o momento em que foi feito,
   entre parênteses, logo após o nome do exame — usando a referência que o
   médico deu ("na admissão", "hoje 14h", "31/08"). Se ele não informou data
   nem momento algum, NÃO invente: escreva o exame sem data e sinalize na
   "discussao" que a data do exame não foi informada.
   FORMATO — REGRA CENTRAL: SEJA CURTO. Este campo é um resumo objetivo, não a
   transcrição do laudo.
   (a) TODO O LABORATÓRIO VAI NUMA ÚNICA LINHA, com UMA ÚNICA DATA no começo:
       "Laboratório (data/momento): ...", itens separados por " | ".
       É PROIBIDO criar uma linha para hemograma, outra para bioquímica, outra
       para EAS, outra para eletrólitos. É PROIBIDO repetir a data em cada
       exame — a data aparece UMA vez, no começo da linha. Entram nessa mesma
       linha: hemograma, bioquímica, eletrólitos, função renal, marcadores,
       coagulograma, EAS/urina, gasometria, glicemia capilar e testes rápidos.
       Mantenha juntos os valores do MESMO exame.
   (b) ECG vai em LINHA PRÓPRIA.
   (c) Cada exame de IMAGEM ou gráfico (raio-X, USG, TC, ecocardiograma) vai em
       LINHA PRÓPRIA, com a conclusão em uma frase.

   SELEÇÃO DO QUE ENTRA — AS LISTAS ABAIXO SÃO TAXATIVAS, NÃO SÃO EXEMPLOS.
   O que não estiver na lista NÃO ENTRA, mesmo que esteja no laudo, mesmo que
   esteja alterado, mesmo que pareça relevante. Este campo é um resumo de
   trabalho, não a transcrição do laudo.

   • HEMOGRAMA — entram SOMENTE: hemoglobina (Hb), hematócrito (Ht),
     leucócitos totais e plaquetas. Se houver desvio à esquerda, acrescente as
     PALAVRAS "com desvio à esquerda" logo após o número de leucócitos, SEM
     percentuais e SEM valores absolutos.
     PROIBIDO escrever: hemácias, VCM, HCM, CHCM, RDW, linfócitos, monócitos,
     eosinófilos, basófilos, e os números de bastonetes ou segmentados.
     Certo:  "Hb 11,2 | Ht 34% | leucócitos 17.400 com desvio à esquerda | plaquetas 212.000"
     ERRADO: "Hb 11,2, Ht 34,1%, hemácias 3,88 milhões, VCM 87,9, HCM 28,9, RDW 13,8%,
              leucócitos 17.400 (bastonetes 9%/1.566, segmentados 78%/13.572), linfócitos 10%..."

   • EAS / URINA ROTINA — entram SOMENTE se estiverem POSITIVOS ou ALTERADOS:
     proteína, nitrito, leucócitos, hemácias (ou hemoglobinúria) e bactérias.
     Item NEGATIVO, ausente ou de alteração mínima NÃO ENTRA — nem para dizer
     que é negativo. Se nada estiver alterado, o EAS inteiro não aparece.
     PROIBIDO escrever, em qualquer circunstância: aspecto, cor, densidade,
     pH, cilindros, corpos cetônicos, urobilinogênio, células epiteliais,
     cristais, muco.
     Certo:  "EAS: nitrito positivo | leucócitos 85/campo | hemácias 12/campo | bactérias aumentadas"
     ERRADO: "EAS: aspecto turvo, densidade 1.022, pH 6,5, proteínas traços, nitrito
              POSITIVO, esterase +++, leucócitos 85/campo, cilindros presentes..."

   • DEMAIS EXAMES (bioquímica, eletrólitos, marcadores, gasometria): só os
     valores que importam para ESTE caso. Nunca um painel inteiro por hábito.

   • CULTURAS — PROIBIDAS NESTE CAMPO. Não escreva urocultura, hemocultura,
     coprocultura ou cultura de secreção como pendente, coletada ou a coletar:
     estas unidades não coletam culturas. ÚNICA EXCEÇÃO: resultado JÁ PRONTO,
     feito fora e relatado pelo médico — esse vai em LINHA PRÓPRIA.
   • DEMAIS EXAMES PENDENTES (sorologia, exame enviado a outro serviço) não são
     resultado. No máximo uma menção CURTA no fim da linha do laboratório,
     nunca uma linha para cada, nunca com prazo de liberação.

   NUNCA escreva VALORES DE REFERÊNCIA (nada de "(VR: 12–16)"). Unidades só
   quando forem necessárias para não gerar ambiguidade — dispense-as nos itens
   em que a unidade é óbvia.
   MODELO (repare: UMA linha de laboratório, UMA data, itens enxutos):
   "ECG (admissão, 31/08 09:20): ritmo sinusal, FC 78 bpm, sem alterações isquêmicas agudas.
Laboratório (31/08 09:40): Hb 11,2 | Ht 34% | leucócitos 17.400 com desvio à esquerda | plaquetas 212.000 | PCR 148,6 | ureia 48 | creatinina 1,32 | Na 136 | K 3,9 | EAS: nitrito positivo, leucócitos 85/campo, hemácias 12/campo, bactérias aumentadas.
Raio-X de tórax (31/08): sem consolidações ou derrame pleural."
   Linguagem DESCRITIVA E ASSERTIVA, como os demais campos do prontuário: se
   houver dúvida de interpretação, ela vai na "discussao", nunca aqui.

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
     \\n). Escreva de 3 a 4 itens curtos e objetivos — NUNCA
     mais que 4. Se o caso parecer pedir 5, 6 ou 7 itens, é sinal de que você
     está fatiando demais: AGRUPE ações relacionadas no mesmo item (todas as
     medicações da UPA numa linha, toda a receita domiciliar em outra, alta +
     sinais de alerta + encaminhamento juntos).
     TEMPO VERBAL OBRIGATÓRIO: use SEMPRE a PRIMEIRA PESSOA DO SINGULAR no
     presente — "faço", "prescrevo", "solicito", "oriento", "encaminho",
     "administro", "reavalio", "mantenho". É o estilo consagrado de conduta
     médica: quem assina fala na própria voz. NUNCA use o infinitivo
     ("fazer", "prescrever", "solicitar") nem o particípio ("feito",
     "prescrito", "solicitado").
     AGRUPAR MEDICAÇÃO DA UNIDADE EM UMA LINHA: todas as medicações feitas NA UPA
     devem caber em UM ÚNICO item (uma linha), separadas por " + ", em vez de uma
     linha para cada fármaco — isso encurta a conduta. CITE-AS NOMINALMENTE com
     dose, via e frequência (tanto as da UPA quanto as da receita domiciliar; não
     escreva apenas "medicação sintomática" ou "receita entregue" sem nomear).
     MODELO:
     "- Faço na UPA: Tenoxicam 20 mg IM + Dipirona 1 g (2 mL) EV, agora.
- Reavalio após o efeito; se melhora, alta com sinais de alerta (piora súbita, febre, déficit).
- Prescrevo para casa: Naproxeno 500 mg de 12/12 horas por 5 dias e Metoclopramida 10 mg de 8/8 horas se náusea.
- Encaminho para acompanhamento na APS."
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
   FREQUÊNCIA EM INTERVALO DE HORAS OBRIGATÓRIA: escreva a frequência como
   intervalo ("de 12/12 horas", "de 8/8 horas", "de 6/6 horas"), NUNCA como
   "até 3x ao dia", "4 vezes ao dia" ou "3x/dia". Para uso condicional,
   combine o intervalo com a condição (ex.: "de 8/8 horas se náusea").
   Exceção: "1x ao dia" é permitido (é o formato natural de dose única diária).
   AO FINAL DA RECEITA, acrescente SEMPRE um bloco curto de ORIENTAÇÕES NÃO
   MEDICAMENTOSAS, com no MÁXIMO 3 a 4 itens objetivos e pertinentes ao quadro
   (ex.: hidratação, repouso, sinais de alerta para retornar, cuidados locais,
   dieta). Encabece esse bloco com a linha "ORIENTAÇÕES:" e use itens com hífen.
   MODELO:
   "USO ORAL
1. Naproxeno 500 mg ............................. 10 comprimidos
   Tomar 1 comprimido de 12/12 horas por 5 dias.

2. Metoclopramida 10 mg ......................... 1 caixa
   Tomar 1 comprimido de 8/8 horas se náusea.

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
${JSON.stringify(internacao ? historicoPaciente : prepararHistoricoPrompt(historicoPaciente))}

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

            // --- Tempo verbal: PRIMEIRA PESSOA na conduta (v6: "faço,
            //     prescrevo, solicito, oriento") ---
            if (dados.prontuario) {
                dados.prontuario.conduta = preferirPrimeiraPessoaConduta(dados.prontuario.conduta);
            }

            // --- Receita: fecha doses flexíveis ("1 a 2 comp" -> "1 comp") ---
            dados.receita = fecharDoseFlexivel(dados.receita);

            // --- Frequência em horas (v6): "até 3x ao dia" -> "de 8/8 horas"
            //     na receita, prescrição interna, conduta e evolução ---
            dados.receita = preferirIntervaloHoras(dados.receita);
            dados.prescricao_interna = preferirIntervaloHoras(dados.prescricao_interna);
            dados.evolucao = preferirIntervaloHoras(dados.evolucao);
            if (dados.prontuario) {
                dados.prontuario.conduta = preferirIntervaloHoras(dados.prontuario.conduta);
            }

            // --- Movimento 1: formatação estrutural garantida pelo servidor ---
            // (transformações mecânicas; não dependem de juízo clínico)
            if (dados.prontuario) {
                dados.prontuario.conduta = limparCabecalhoConduta(dados.prontuario.conduta);
                dados.prontuario.conduta = removerCidVazado(dados.prontuario.conduta);
                dados.prontuario.exame_fisico_texto = removerCidVazado(dados.prontuario.exame_fisico_texto);
                dados.prontuario.sinais_vitais = normalizarSeparadorVitais(dados.prontuario.sinais_vitais);
            }

            // --- EXAMES COMPLEMENTARES (v7) ---
            // Trava: só existe se tiver conteúdo real (nada de rótulo vazio nem
            // de "não foram realizados"). NÃO depende de toggle nenhum.
            // v7.2 — TRAVA DE REMISSÃO: campo que só aponta para o anexo não é
            // resultado. Zera e AVISA que o anexo não foi lido (silêncio aqui é
            // pior: parece que o exame foi conferido quando não foi).
            if (ehRemissaoAnexo(dados.exames_complementares)) {
                dados.exames_complementares = '';
                dados.discussao = (dados.discussao || '')
                    + '\n\n🚫 O ANEXO NÃO FOI LIDO. A IA não conseguiu extrair o conteúdo do arquivo e devolveu apenas uma remissão ("conforme anexo"), que foi descartada. NENHUM resultado de exame foi transcrito — confira o anexo você mesmo e, se precisar, digite os valores no relato.';
            }
            dados.exames_complementares = limparExamesComplementares(dados.exames_complementares);
            // v7.2 — TRAVA DUPLA DE FORMATO: junta o laboratório fatiado numa
            // linha só, com uma data. Lossless (não apaga resultado nenhum).
            dados.exames_complementares = unificarLinhasLaboratorio(dados.exames_complementares);
            if (dados.exames_complementares) {
                // Lembrete de data (não altera o conteúdo; só avisa na discussão).
                if (examesSemReferenciaDeData(dados.exames_complementares)) {
                    dados.discussao = (dados.discussao || '')
                        + '\n\n🗓️ A DATA/momento do exame complementar não foi informada — complete antes de registrar no prontuário.';
                }
                // Na EVOLUÇÃO, o resultado NÃO vira caixa solta: entra no fim do
                // texto corrido, separado por linha em branco. Quem posiciona é
                // o servidor (determinístico), não a IA.
                if (ehEvolucao) {
                    dados.evolucao = anexarExamesNaEvolucao(dados.evolucao, dados.exames_complementares);
                }
            }

            // v7.2 — havia anexo e NENHUM resultado saiu? Pode ser que o anexo
            // não fosse um exame (prontuário antigo, receita) — por isso a
            // redação é condicional. Mas o médico precisa saber, para não achar
            // que o sistema conferiu o arquivo.
            if (fotos.length > 0 && !dados.exames_complementares
                && !/ANEXO NÃO FOI LIDO/.test(dados.discussao || '')) {
                dados.discussao = (dados.discussao || '')
                    + '\n\n📎 Havia ' + fotos.length + ' anexo(s) e nenhum resultado de exame foi transcrito. Se o anexo era um exame, ele NÃO foi lido — confira você mesmo antes de registrar.';
            }

            // --- v7.6: MODO INTERNAÇÃO — trava dupla e formatação ---
            // Os cinco campos existem SEMPRE na resposta (a tela conta com
            // isso), mas só sobrevivem com o toggle ligado.
            const CAMPOS_INTERNACAO = ['aih_sinais_sintomas', 'aih_condicoes',
                'aih_exames', 'relatorio_internacao', 'prescricao_internacao'];
            CAMPOS_INTERNACAO.forEach(k => {
                if (typeof dados[k] !== 'string') dados[k] = '';
            });
            if (!internacao) {
                // TRAVA: toggle desligado zera tudo, mesmo que a IA tenha
                // preenchido por iniciativa própria.
                CAMPOS_INTERNACAO.forEach(k => { dados[k] = ''; });
            } else {
                // Mesmas preferências de escrita da prescrição da UPA.
                dados.prescricao_internacao = preferirInalacao(dados.prescricao_internacao);
                dados.prescricao_internacao = preferirIntervaloHoras(dados.prescricao_internacao);
                dados.prescricao_internacao = fecharDoseFlexivel(dados.prescricao_internacao);
                dados.relatorio_internacao = preferirInalacao(dados.relatorio_internacao);
            }

            // --- TRAVAS DE SEGURANÇA (servidor manda, não a IA) ---
            if (!op.relatorio) dados.relatorio = '';
            if (!exameUnidade) dados.exame_unidade = '';
            if (!exameExterno) dados.exame_externo = '';
            if (typeof dados.exame_unidade !== 'string') dados.exame_unidade = '';
            if (typeof dados.exame_externo !== 'string') dados.exame_externo = '';

            // --- Rede de segurança farmacológica ---
            // v7.6: a prescrição de internação ENTRA na conferência — quem a
            // executa enquanto a vaga não sai é a equipe desta mesma UPA.
            const textoConferir = [dados.prescricao_interna, dados.receita,
                dados.prescricao_internacao].filter(Boolean).join('\n');
            const alertas = conferirMedicamentos(textoConferir, listaUnidade);
            if (alertas.length > 0) {
                const aviso = '\n\n⚠️ LEMBRETE (verificação grosseira — NÃO confiável; confira você mesmo na padronização): possíveis itens fora da lista desta unidade:\n- '
                    + alertas.join('\n- ');
                dados.discussao = (dados.discussao || '') + aviso;
            }

            // --- Diluições ---
            // BARREIRO: bloco separado (como sempre foi).
            // ACRÍZIO (v6): diluição NA MESMA LINHA da prescrição interna
            //   (exigência nova da unidade); o campo diluicoes fica vazio.
            dados.diluicoes = '';
            if (unidade === 'BARREIRO') {
                // v7.6: o bloco de diluição do Barreiro cobre as DUAS prescrições
                // (UPA e internação). É tabela de referência, não prescrição —
                // um bloco só evita duas caixas quase idênticas na tela.
                const dil = montarDiluicoes([dados.prescricao_interna,
                    dados.prescricao_internacao].filter(Boolean).join('\n'));
                dados.diluicoes = dil.blocoSeparado;
                if (dil.naoEncontrados.length > 0) {
                    const aviso = '\n\n💧 DILUIÇÃO NÃO ENCONTRADA na tabela de referência (consultar manualmente):\n- '
                        + dil.naoEncontrados.join('\n- ');
                    dados.discussao = (dados.discussao || '') + aviso;
                }
            } else if (unidade === 'ACRIZIO') {
                const dil = anexarDiluicaoInline(dados.prescricao_interna);
                dados.prescricao_interna = dil.texto;
                // v7.6: a prescrição de internação recebe a diluição inline do
                // mesmo jeito, no próprio campo.
                if (dados.prescricao_internacao) {
                    const dilInt = anexarDiluicaoInline(dados.prescricao_internacao);
                    dados.prescricao_internacao = dilInt.texto;
                    dil.naoEncontrados = dil.naoEncontrados.concat(dilInt.naoEncontrados);
                }
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
            // v7.3 — o mesmo relógio de 2 minutos vale para a comparação.
            const relogioCmp = setTimeout(() => { try { abortador.abort(); } catch (e) {} }, TEMPO_LIMITE_IA);
            try {
                // Gera as duas em paralelo para não somar os tempos de espera.
                [textoGemini, textoClaude] = await Promise.all([
                    chamarGemini(promptFinal, 'pro', usarBusca, fotos, abortador.signal),
                    chamarClaude(promptFinal, fotos, abortador.signal)
                ]);
            } catch (e) {
                // v7.1: se foi o médico que cancelou, sai calado — não há para
                // quem responder e nada foi salvo (a comparação nunca salva).
                if (clienteSaiu || ehAborto(e, abortador.signal)) {
                    console.log('Comparação cancelada pelo médico (BE ' + beId + ').');
                    return;
                }
                console.error('Erro na geração comparativa: ' + (e && e.message ? e.message : String(e)));
                return res.status(502).json({ erro: 'Não foi possível gerar as duas versões para comparar. Tente novamente.' });
            }
            if (clienteSaiu) {
                console.log('Comparação descartada: o médico cancelou antes do fim (BE ' + beId + ').');
                return;
            }
            clearTimeout(relogioCmp);
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
        // v7.3 — RELÓGIO: dispara o aborto se a IA passar do tempo limite.
        let houveTempoLimite = false;
        const relogio = setTimeout(() => {
            houveTempoLimite = true;
            try { abortador.abort(); } catch (e) {}
        }, TEMPO_LIMITE_IA);
        const inicio = Date.now();
        const nPdf = fotos.filter(f => TIPOS_PDF.includes(f.mimeType)).length;
        console.log('Gerando: motor=' + (modeloId || 'pro')
            + ' anexos=' + (fotos.length - nPdf) + ' imagem(ns) + ' + nPdf + ' PDF(s)'
            + ' busca=' + (usarBusca ? 'sim' : 'nao'));
        try {
            saida = await gerarComFallback(promptFinal, modeloId, usarBusca, fotos, abortador.signal);
            console.log('Geração concluída em ' + ((Date.now() - inicio) / 1000).toFixed(1) + 's.');
        } catch (error) {
            const gastou = ((Date.now() - inicio) / 1000).toFixed(1);
            // Cancelamento pelo médico: sai calado, sem gravar nada.
            if (clienteSaiu) {
                console.log('Geração cancelada pelo médico após ' + gastou + 's (BE ' + beId + ') — nada gravado.');
                return;
            }
            // v7.3 — TEMPO LIMITE: erro claro em vez de tela girando para sempre.
            if (houveTempoLimite) {
                console.error('TEMPO LIMITE: a IA não respondeu em ' + gastou + 's. motor=' + (modeloId || 'pro')
                    + ' pdfs=' + nPdf + ' imagens=' + (fotos.length - nPdf));
                return res.status(504).json({ erro: 'A IA não respondeu dentro de 2 minutos e o pedido foi cancelado. Se havia PDF anexado, tente enviar a mesma página como FOTO (print) — hoje é o caminho que responde mais rápido.' });
            }
            if (ehAborto(error, abortador.signal)) {
                console.log('Geração abortada após ' + gastou + 's (BE ' + beId + ') — nada gravado.');
                return;
            }
            // Log COMPLETO do erro: é o que permite descobrir a causa depois.
            console.error('ERRO na geração após ' + gastou + 's. motor=' + (modeloId || 'pro')
                + ' pdfs=' + nPdf + ' | mensagem: ' + (error && error.message ? error.message : String(error)));
            if (error && error.stack) console.error(error.stack.split('\n').slice(0, 4).join('\n'));
            return res.status(502).json({ erro: 'A IA está indisponível no momento. Tente novamente em instantes ou troque o modelo (Flash / Pro / Claude).' });
        } finally {
            clearTimeout(relogio);
        }

        // v7.1: TRAVA DO CANCELAMENTO. Mesmo que a IA tenha terminado a tempo,
        // se o médico já cancelou, o resultado é DESCARTADO e NADA é gravado —
        // é isto que impede uma "etapa fantasma" no BE.
        if (clienteSaiu) {
            console.log('Resposta descartada: o médico cancelou antes do fim (BE ' + beId + ') — nada gravado no histórico.');
            return;
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
//  ROTA (v7.5): BUSCA DE BE POR PREFIXO.
//  A tela manda ?termo=2509 e recebe os BEs das últimas 72h que COMEÇAM com
//  esses números. Só prefixo, de propósito: o médico reaproveita os primeiros
//  dígitos do BE, e busca "em qualquer posição" traria BE de outro paciente.
//  Devolve os MESMOS campos leves dos chips (BE, sexo, idade, quando) — nenhum
//  dado clínico e nenhum nome (LGPD).
// ----------------------------------------------------------------------------
app.get('/api/buscar', async (req, res) => {
    const termo = String(req.query.termo || '').trim();
    if (!redis) return res.json({ resultados: [], aviso: 'Banco de histórico indisponível agora.' });
    // Menos de 2 caracteres devolveria quase tudo — não vale a varredura.
    if (termo.length < 2) return res.json({ resultados: [] });
    try {
        const pares = await redis.zrevrange(CHAVE_RECENTES, 0, 199, 'WITHSCORES');
        const lista = [];
        for (let i = 0; i < pares.length; i += 2) {
            const be = String(pares[i]);
            if (be.indexOf(termo) !== 0) continue;  // PREFIXO, não "contém"
            const quando = Number(pares[i + 1]) || 0;
            const existe = await redis.exists('be:' + be);
            if (!existe) { redis.zrem(CHAVE_RECENTES, be); continue; }
            let sexo = '', idade = '';
            try {
                const m = await redis.get('meta:' + be);
                if (m) { const o = JSON.parse(m); sexo = o.sexo || ''; idade = o.idade || ''; }
            } catch (e) { /* metadado opcional */ }
            lista.push({ be, sexo, idade, quando });
            if (lista.length >= 12) break;
        }
        res.json({ resultados: lista });
    } catch (e) {
        console.error('Erro na busca de BE:', e.message);
        res.status(500).json({ erro: 'Não foi possível buscar agora. Tente de novo.' });
    }
});

// ----------------------------------------------------------------------------
//  ROTA (v7.5): APAGAR UMA ETAPA DE UM BE.
//  ATENÇÃO MÉDICO-LEGAL: isto apaga apenas o RASCUNHO guardado neste sistema.
//  O prontuário oficial (SIGRAH / papel da UPA) NÃO é tocado por esta rota.
//  Apagar o BE INTEIRO não existe aqui, por decisão do médico.
//
//  A tela manda { beId, indice, quando }. O 'quando' é o carimbo de tempo da
//  etapa como a tela a viu. O servidor só apaga se ele bater com o que está
//  guardado naquele índice — assim, se a linha do tempo mudou entre abrir a
//  tela e clicar, nada é apagado (em vez de apagar a etapa errada).
// ----------------------------------------------------------------------------
app.post('/api/apagar-etapa', limitarAbuso, async (req, res) => {
    if (!redis) {
        return res.status(503).json({ erro: 'O banco de histórico está indisponível agora. Nada foi apagado.' });
    }
    const corpo = req.body || {};
    const be = String(corpo.beId || '').trim();
    const idx = Number(corpo.indice);
    const carimbo = Number(corpo.quando);

    if (!be) return res.status(400).json({ erro: 'BE não informado.' });
    if (!Number.isInteger(idx) || idx < 0) {
        return res.status(400).json({ erro: 'Etapa inválida.' });
    }

    const pilha = await lerHistorico(be);
    if (!pilha || pilha.length === 0) {
        return res.status(404).json({ erro: 'Sem histórico para este BE (pode ter expirado em 72h).' });
    }
    // TRAVA 1 — a única etapa não pode ser apagada: isso seria apagar o BE.
    if (pilha.length === 1) {
        return res.status(409).json({ erro: 'Esta é a única etapa deste BE. Apagá-la equivaleria a apagar o BE inteiro, o que este sistema não faz. Gere uma etapa nova corrigida em vez de apagar.' });
    }
    // TRAVA 2 — índice fora da pilha (a tela está desatualizada).
    if (idx >= pilha.length) {
        return res.status(409).json({ erro: 'A linha do tempo mudou desde que esta tela foi aberta. Reabra o BE e tente de novo. Nada foi apagado.' });
    }
    // TRAVA 3 — o carimbo de tempo tem que bater com o da etapa guardada.
    const alvo = pilha[idx] || {};
    const carimboAlvo = Number(alvo.quando) || 0;
    if (!Number.isFinite(carimbo) || carimbo !== carimboAlvo) {
        return res.status(409).json({ erro: 'A etapa apontada não confere com a que está guardada. Reabra o BE e tente de novo. Nada foi apagado.' });
    }

    const restante = pilha.slice(0, idx).concat(pilha.slice(idx + 1));
    try {
        // Apagar NÃO renova as 72h: preserva o tempo de vida que ainda restava.
        let ttl = await redis.ttl('be:' + be);
        if (!(ttl > 0)) ttl = TEMPO_HISTORICO;
        await redis.set('be:' + be, JSON.stringify(restante), 'EX', ttl);
        console.log('Etapa apagada — BE ' + be + ', indice ' + idx
            + ', tipo ' + (alvo.tipo || 'prontuario')
            + ', restam ' + restante.length + ' etapa(s).');
        res.json({ ok: true, restantes: restante.length });
    } catch (e) {
        console.error('Erro ao apagar etapa:', e.message);
        res.status(500).json({ erro: 'Não foi possível apagar a etapa. Nada foi alterado.' });
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
                // v7.1: a ponte continua SÓ para fotos. Cada gravação do Upstash
                // gratuito aceita ~1 MB, e PDF não pode ser comprimido — não
                // caberia. PDF deve ser anexado direto no aparelho que vai gerar.
                return res.status(400).json({ erro: 'A ponte por código funciona só com FOTOS (JPEG/PNG). Para PDF, anexe o arquivo direto no aparelho em que for gerar o documento.' });
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

//  v7.1: quando a soma dos anexos passa do limite do express (20 MB), o erro
//  chegava cru na tela. Agora vira uma mensagem que o médico entende.
app.use((err, req, res, next) => {
    if (err && (err.type === 'entity.too.large' || err.status === 413)) {
        return res.status(413).json({ erro: 'Os anexos somados ficaram grandes demais para um envio só. Tire alguns anexos (ou envie menos páginas de PDF) e tente de novo.' });
    }
    return next(err);
});

// ROTA DE CONFERÊNCIA DE VERSÃO. Abrir esta URL no navegador diz, em uma linha,
// QUAL versão está de fato rodando no Render. Serve para pegar o caso em que o
// deploy falhou e o Render continuou servindo a versão anterior (o servidor
// segue no ar, então nada parece errado — mas o código novo não está valendo).
const VERSAO_SERVIDOR = 'v7.7';
app.get('/', (req, res) => res.send(
    'Servidor do Prontuario Rapido ' + VERSAO_SERVIDOR + ' no ar. '
    + 'Linhas esperadas no server.js: 2649.'
));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Servidor rodando na porta ' + PORT));
