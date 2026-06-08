// ============================================================================
//  PRONTUÁRIO RÁPIDO - SERVIDOR (BACKEND) - v3
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
const { GoogleGenerativeAI } = require('@google/generative-ai');

const { medicamentosAcrizioMenezes, medicamentosBarreiro } = require('./farmacia');
const { diluicoesBarreiro } = require('./diluicoes');

const app = express();
app.use(express.json());

// ----------------------------------------------------------------------------
//  CONFIGURAÇÕES (tudo num lugar só)
// ----------------------------------------------------------------------------
//  Modelos do Gemini (versões estáveis confirmadas jun/2026).
//  Para subir o Pro no futuro, troque por 'gemini-3.1-pro' quando virar estável.
const MODELO_RAPIDO = 'gemini-3.5-flash';
const MODELO_PROFUNDO = 'gemini-2.5-pro';

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

if (!process.env.GEMINI_API_KEY) {
    console.error('ATENÇÃO: GEMINI_API_KEY não configurada no Render. A IA não vai funcionar.');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const patientCache = new NodeCache({ stdTTL: TEMPO_HISTORICO, checkperiod: 3600 });

// Trava simples anti-abuso (pedidos por minuto por IP).
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
function buscarDiluicao(nomeMedicamento) {
    const alvo = semAcento(nomeMedicamento);
    // tenta achar um item cujo princípio ativo apareça no nome prescrito
    let melhor = null;
    diluicoesBarreiro.forEach(item => {
        const pa = semAcento(item.principio);
        if (pa.length > 3 && alvo.includes(pa)) {
            // se houver vários, prefere o de nome mais parecido (mais longo em comum)
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

// REDE DE SEGURANÇA: confere se remédios prescritos não estão na farmácia.
function conferirMedicamentos(texto, listaUnidade) {
    if (!texto) return [];
    const principios = new Set();
    listaUnidade.forEach(item => {
        const p = semAcento(item.nome).split(/[\s0-9]/)[0];
        if (p && p.length > 3) principios.add(p);
    });
    const alertas = [];
    texto.split('\n').forEach(linha => {
        if (!pareceMedicacao(linha)) return;
        const m = semAcento(linha);
        if (![...principios].some(p => m.includes(p))) {
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
//  ROTA PRINCIPAL
// ----------------------------------------------------------------------------
app.post('/api/atendimento', limitarAbuso, async (req, res) => {
    try {
        const { beId, mensagem, unidade, opcoes, modeloId, sexo, idade, tipoDocumento } = req.body;

        if (!beId || !mensagem) {
            return res.status(400).json({ erro: 'Número do BE e relato são obrigatórios.' });
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

        const modelToUse = modeloId === 'flash' ? MODELO_RAPIDO : MODELO_PROFUNDO;

        // Quando a busca está ligada, ativamos a ferramenta de busca do Gemini.
        // OBS técnica: busca + JSON forçado não convivem na mesma chamada, então
        // com busca ligada pedimos texto e extraímos o JSON de dentro depois.
        const configModelo = { model: modelToUse };
        if (usarBusca) {
            configModelo.tools = [{ googleSearch: {} }];
        }
        const model = genAI.getGenerativeModel(configModelo);

        let historicoPaciente = patientCache.get(beId) || [];
        // O tipo agora é decidido pelo médico (botão), não mais adivinhado pelo histórico.
        let tipoAtendimento = ehEvolucao
            ? 'EVOLUÇÃO (reavaliação — texto curto + conduta)'
            : 'PRONTUÁRIO (documento completo)';
        if (historicoPaciente.length > 0) patientCache.ttl(beId, TEMPO_HISTORICO);

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
- Não invente comorbidades, alergias ou achados de exame não relatados. Quando
  um dado não foi informado, registre como "não informado" ou deixe em branco.

${contextoFarmacologico}
${blocoFontes}
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

1. "discussao": análise de retaguarda concisa. Inclua red flags, raciocínio,
   diagnósticos "can't miss", e análise da prescrição/interações.
   ESTE é o ÚNICO campo onde você PODE e DEVE expressar INCERTEZAS: marque
   claramente o que é dúvida, o que depende de exame para confirmar/descartar,
   e onde você tem menos confiança (ex: "ATENÇÃO: dose pediátrica — confira",
   "não dá para descartar X sem ECG"). Seja transparente sobre o grau de
   certeza. No FINAL, escreva em destaque: "CID: <código e descrição>".
   REGRA ABSOLUTA: NENHUMA incerteza, dúvida ou linguagem reflexiva pode
   aparecer nos campos do "prontuario". Toda hesitação fica AQUI, na discussão.

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
   - "sinais_vitais": liste APENAS os sinais que o médico informou, separados por
     " | ", no formato "RÓTULO: valor". Use os rótulos padrão quando couber:
     SpO2, FC, FR, PA, Tax (em °C), Peso (em kg). EXEMPLO: se o médico só informou
     pressão e frequência cardíaca, o campo deve conter EXATAMENTE algo como
     "PA: 130x80 mmHg | FC: 92 bpm" — e NADA MAIS. REGRA CRÍTICA: NÃO inclua
     rótulos de itens não informados (nada de "FR:", "SpO2:" ou "Tax: °C" vazios).
     Se NENHUM sinal vital foi informado, deixe este campo TOTALMENTE VAZIO ("").
     É TERMINANTEMENTE PROIBIDO inventar, estimar ou presumir valores "normais".
     (vai num quadro separado, NÃO copiado junto)
   - "hipotese_diagnostica": a(s) hipótese(s) em texto. (campo 04)
   - "conduta": condutas e orientações. SEJA CONCISO — nada de "encher
     linguiça". FORMATO OBRIGATÓRIO: comece com "CD:" sozinho na primeira
     linha, depois ITENS COM HÍFEN, um por linha (quebra real \\n). Mire em
     3 a 5 itens curtos e objetivos; agrupe ações relacionadas no mesmo item.
     REGRA OBRIGATÓRIA: sempre que houver medicação, CITE-A NOMINALMENTE com
     dose, via e frequência — tanto a feita na UPA quanto a da receita
     domiciliar (não escreva apenas "medicação sintomática" ou "receita
     entregue" sem nomear os fármacos). MODELO:
     "CD:
- Sintomático na UPA: Tenoxicam 20 mg IM + Dipirona 1 g (2 mL) EV, agora.
- Reavaliação após o efeito; se melhora, alta com sinais de alerta (piora súbita, febre, déficit).
- Receita domiciliar: Naproxeno 500 mg 12/12h por 5 dias e Metoclopramida 10 mg se náusea.
- Encaminhamento para acompanhamento na APS."
     (campo 06)

4. "prescricao_interna": medicações usadas NA UPA. APENAS itens da lista desta
   unidade. Respeite a via indicada. FORMATO OBRIGATÓRIO: itens ENUMERADOS
   (1., 2., 3.), UM POR LINHA (quebra real \\n), cada um com dose, via e
   frequência. Para injetáveis, escreva claramente "ampola/frasco" e a via
   (EV/IM) para o sistema localizar a diluição. MODELO:
   "1. Dipirona 1 g (2 mL) EV agora.
2. Tenoxicam 20 mg IM agora.
3. SF 0,9% 500 mL EV se necessário."

5. "receita": receita de uso DOMICILIAR, agrupada por via (USO ORAL, USO
   TÓPICO, USO INALATÓRIO...). FORMATO CONSAGRADO OBRIGATÓRIO para CADA item:
   primeiro o nome + concentração, depois a QUANTIDADE TOTAL a dispensar
   (nº de comprimidos, caixa(s), frasco(s), tubo(s)), e SÓ ENTÃO a posologia
   na linha de baixo. NUNCA pule a quantidade total. MODELO:
   "USO ORAL
1. Naproxeno 500 mg ............................. 10 comprimidos
   Tomar 1 comprimido de 12/12 horas por 5 dias.

2. Metoclopramida 10 mg ......................... 1 caixa
   Tomar 1 comprimido até 3x ao dia se náusea."
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
${JSON.stringify(historicoPaciente)}

MENSAGEM DO MÉDICO:
${mensagem}`;

        // Configuração de geração. Com busca ligada NÃO usamos JSON forçado
        // (são incompatíveis no Gemini); pedimos para a IA devolver o JSON
        // dentro do texto e extraímos depois.
        const generationConfig = { maxOutputTokens: 8192, temperature: 0.4 };
        if (!usarBusca) {
            generationConfig.responseMimeType = 'application/json';
        }

        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: promptFinal }] }],
            generationConfig
        });

        let textoBruto = result.response.text();

        // Se a busca estava ligada, o texto pode vir com cercas ```json ... ```
        // ou texto em volta. Extraímos o objeto JSON de dentro com segurança.
        function extrairJson(txt) {
            if (!txt) return null;
            // tenta direto
            try { return JSON.parse(txt); } catch (e) {}
            // remove cercas de código
            let limpo = txt.replace(/```json/gi, '').replace(/```/g, '').trim();
            try { return JSON.parse(limpo); } catch (e) {}
            // pega do primeiro { até o último }
            const ini = limpo.indexOf('{');
            const fim = limpo.lastIndexOf('}');
            if (ini !== -1 && fim !== -1 && fim > ini) {
                try { return JSON.parse(limpo.slice(ini, fim + 1)); } catch (e) {}
            }
            return null;
        }

        let dados = extrairJson(textoBruto);
        if (!dados) {
            console.error('IA devolveu JSON inválido:\n', textoBruto);
            return res.status(502).json({
                erro: 'A IA devolveu resposta incompleta. Tente enviar de novo' +
                      (usarBusca ? ' (a busca em fontes às vezes alonga a resposta; tente sem ela se persistir).' : '.')
            });
        }

        // Garante que a estrutura do prontuário existe (evita quebrar o front).
        if (!dados.prontuario) dados.prontuario = {};
        if (typeof dados.evolucao !== 'string') dados.evolucao = '';

        // --- TRAVAS DE SEGURANÇA (servidor manda, não a IA) ---
        // Mesmo que a IA preencha algo por conta própria, se o toggle estava
        // desligado, o campo é ZERADO aqui antes de ir para a tela.
        if (!op.relatorio) dados.relatorio = '';
        if (!exameUnidade) dados.exame_unidade = '';
        if (!exameExterno) dados.exame_externo = '';
        if (typeof dados.exame_unidade !== 'string') dados.exame_unidade = '';
        if (typeof dados.exame_externo !== 'string') dados.exame_externo = '';

        // --- Rede de segurança farmacológica ---
        const textoConferir = [dados.prescricao_interna, dados.receita].filter(Boolean).join('\n');
        const alertas = conferirMedicamentos(textoConferir, listaUnidade);
        if (alertas.length > 0) {
            const aviso = '\n\n⚠️ CONFERÊNCIA AUTOMÁTICA (confira pessoalmente): possivelmente fora da padronização desta unidade:\n- '
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

        // --- Fontes citadas (ponto 2): anexa o link ao fim da discussão ---
        if (dados.fontes && dados.fontes.trim()) {
            dados.discussao = (dados.discussao || '')
                + '\n\n📚 FONTES CONSULTADAS:\n' + dados.fontes.trim();
        }

        // Salva no histórico (guarda também sexo/idade/tipo p/ reabrir o caso).
        historicoPaciente.push({
            medico: mensagem, comandos: op, resposta: dados,
            sexo: sexo || '', idade: (idade !== undefined ? idade : ''),
            tipo: ehEvolucao ? 'evolucao' : 'prontuario',
            quando: Date.now()
        });
        patientCache.set(beId, historicoPaciente);

        res.json(dados);

    } catch (error) {
        console.error('Erro no processamento:', error);
        res.status(500).json({ erro: 'Falha no processamento. Tente novamente.' });
    }
});

// ----------------------------------------------------------------------------
//  ROTA: reabrir um caso pelo BE (clique no chip de recentes).
//  Devolve a ÚLTIMA resposta salva no cache (72h) para aquele BE.
// ----------------------------------------------------------------------------
app.get('/api/historico/:beId', (req, res) => {
    const hist = patientCache.get(req.params.beId);
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
//  ROTA: lista dos BEs recentes (só número + sexo + idade — sem dado clínico).
//  Usada para montar os "chips" na tela, sincronizados entre aparelhos.
// ----------------------------------------------------------------------------
app.get('/api/recentes', (req, res) => {
    const lista = [];
    patientCache.keys().forEach(be => {
        const hist = patientCache.get(be);
        if (hist && hist.length > 0) {
            const u = hist[hist.length - 1];
            lista.push({ be, sexo: u.sexo || '', idade: u.idade || '', quando: u.quando || 0 });
        }
    });
    lista.sort((a, b) => (b.quando || 0) - (a.quando || 0));
    res.json({ recentes: lista.slice(0, 8) });
});

app.get('/', (req, res) => res.send('Servidor do Prontuário Rápido (v3) no ar.'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Servidor rodando na porta ' + PORT));
