// ============================================================================
//  TABELA DE DILUIÇÃO / RECONSTITUIÇÃO DE MEDICAMENTOS INJETÁVEIS
//  UPA Acrízio Menezes e UPA Barreiro (PBH).
//
//  ESTRUTURA (v8) — cada registro tem:
//    principio, apelidos[], nome, vias[] (EV/IM/SC), viasOutras[]
//    reconstituicao : texto (diluente + volume) para pó que precisa ser reconstituído
//    evDireto       : {diluente, volume} — o que vai NA SERINGA
//    infusao        : {diluente, volume} — o que vai NA BOLSA
//    semRotulo      : {diluente, volume} — a fonte deu um volume só e não disse o modo
//    naoDilui       : true quando a fonte diz que não se dilui
//    completo       : false quando falta volume — o sistema AVISA em vez de sair pela metade
//    fonte          : de onde veio ESTE registro (um registro = uma fonte, nunca misturado)
//    _tempoInfusao / _concentracaoMaxima / _observacao : guardados, NÃO impressos
//
//  FONTES:
//   - EBSERH / HC-UFTM, Tabela CFT.001 v2 (06/08/2024)
//   - SMS Joinville/SC, Manual de Diluição de Injetáveis PA/UPA (2018)
//   - HU-UNIVASF / EBSERH, Guia de diluição e estabilidade (2018)
//   - CATS / SMS São Paulo, Diluição de Injetáveis (mar/2025)
//
//  SEGURANÇA: referência de consulta. As apresentações podem diferir do estoque
//  real da UPA. O sistema NUNCA inventa diluição: usa só o que está aqui e,
//  quando não consta ou está incompleto, AVISA para conferir manualmente.
// ============================================================================

const diluicoesBarreiro = [
  {
    "principio": "acetilcisteína",
    "apelidos": [],
    "nome": "Acetilcisteína 100 mg/ mL - ampola 3 mL",
    "vias": [
      "EV"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": null,
    "semRotulo": {
      "diluente": "SF 0,9%",
      "volume": "100 mL"
    },
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "Acima de 15 min ou de 4 a 16 horas",
    "_concentracaoMaxima": "",
    "_observacao": "Para via IN, diluir em igual volume de SF 0,9%. Em casos de intoxicação por paracetamol, as doses e tempo de infusão deverão ser consultadas nas bulas dos fabricantes. A administração concomitante de nitroglicerina e acetilcisteína, apenas em pacientes monitorados.",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "adenosina",
    "apelidos": [],
    "nome": "Adenosina 3 mg/mL - ampola 2 mL",
    "vias": [
      "EV"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": null,
    "semRotulo": null,
    "naoDilui": true,
    "completo": true,
    "_tempoInfusao": "Bolus rápido",
    "_concentracaoMaxima": "",
    "_observacao": "Não refrigerar devido a cristalização.",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "ácido ascórbico",
    "apelidos": [],
    "nome": "Ácido Ascórbico 100 mg/mL (vitamina C) - ampola 5 mL",
    "vias": [
      "EV"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": null,
    "semRotulo": {
      "diluente": "SF 0,9%",
      "volume": "100 mL"
    },
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "Taxa de infusão: 33mg/min",
    "_concentracaoMaxima": "",
    "_observacao": "Evite injeção endovenosa rápida, pois pode causar desmaios e tonturas.",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "ácido tranexâmico",
    "apelidos": [],
    "nome": "Ácido Tranexâmico 50 mg/mL - ampola 5 mL",
    "vias": [
      "EV"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": null,
    "semRotulo": {
      "diluente": "SF 0,9%",
      "volume": "250 mL"
    },
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "EV direto sem diluição: 1mL/min Infusão: 30 minutos",
    "_concentracaoMaxima": "50 mg/mL",
    "_observacao": "Necessita de ajuste para função renal.",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "albumina",
    "apelidos": [],
    "nome": "Albumina Humana 200 mg/mL (20%) - frasco 50 mL",
    "vias": [
      "EV"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": null,
    "semRotulo": null,
    "naoDilui": true,
    "completo": true,
    "_tempoInfusao": "Não exceder a taxa 1 a 2 mL/min.",
    "_concentracaoMaxima": "",
    "_observacao": "Deve ser administrada em até 4 horas após abertura do frasco.",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "alfentanila",
    "apelidos": [],
    "nome": "Alfentanila, cloridrato 0,544 mg/mL",
    "vias": [
      "EV"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": null,
    "semRotulo": null,
    "naoDilui": false,
    "completo": false,
    "_tempoInfusao": "Em bolus lento: 3 a 5min ou infusão contínua lenta.",
    "_concentracaoMaxima": "80mcg/mL",
    "_observacao": "Usar com cautela em pacientes com disfunção renal e hepática.",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "alprostadil",
    "apelidos": [],
    "nome": "Alprostadil 20 mcg – frasco-ampola 1 mL",
    "vias": [
      "EV"
    ],
    "viasOutras": [],
    "reconstituicao": "SF 0,9% 2mL",
    "evDireto": null,
    "infusao": null,
    "semRotulo": {
      "diluente": "SF 0,9%",
      "volume": "250 mL"
    },
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "Administrar EV por 2 horas",
    "_concentracaoMaxima": "",
    "_observacao": "",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "alprostadil",
    "apelidos": [],
    "nome": "Alprostadil 500 mcg/mL - frasco-ampola 1 mL",
    "vias": [
      "EV"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": null,
    "semRotulo": {
      "diluente": "SF 0,9%",
      "volume": "99 mL"
    },
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "Velocidade de infusão: 0,03mL/ Kg/h por até 48 horas.",
    "_concentracaoMaxima": "Em neonatos: Inicial: 0,05 a 0,1mcg/kg/min Manutenção: 0,01 a 0,4mcg/kg/miN Concentração máxima: 5 mcg/mL",
    "_observacao": "Uso por 2 a 3 dias antes da cirurgia. No entanto, o tratamento pode ser prolongado (até 3 semanas) em casos excepcionais.",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "alteplase",
    "apelidos": [],
    "nome": "Alteplase 20 mg pó liófilo – frasco-ampola",
    "vias": [
      "EV"
    ],
    "viasOutras": [],
    "reconstituicao": "diluente próprio 50 mL",
    "evDireto": null,
    "infusao": {
      "diluente": "SF 0,9%",
      "volume": "250 mL"
    },
    "semRotulo": null,
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "EV Direta (bolus): 1-2 minutos. Infusão de 0,75mg/kg em 30 minutos. Infusão de 0,5mg/kg em 60 minutos.",
    "_concentracaoMaxima": "1 mg/mL",
    "_observacao": "Após preparo manter a solução reconstituída sob refrigeração (2 - 8°C) por até 24 horas, ou por até 8 horas em temperatura ambiente abaixo de 30°C. Do ponto de vista microbiológico, o produto deve ser utilizado imediatamente após a reconstituição.",
    "fonte": "HU-UNIVASF/EBSERH — Guia de diluição e estabilidade (2018)"
  },
  {
    "principio": "alteplase",
    "apelidos": [],
    "nome": "Alteplase 50 mg pó liófilo – frasco-ampola",
    "vias": [
      "EV"
    ],
    "viasOutras": [],
    "reconstituicao": "diluente próprio 50 mL",
    "evDireto": null,
    "infusao": {
      "diluente": "SF 0,9%",
      "volume": "250 mL"
    },
    "semRotulo": null,
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "EV Direta (bolus): 1-2 minutos . Infusão de 0,75mg/kg em 30 minutos. Infusão de 0,5mg/kg em 60 minutos.",
    "_concentracaoMaxima": "1 mg/mL",
    "_observacao": "Após preparo manter a solução reconstituída sob refrigeração (2 - 8°C) por até 24 horas, ou por até 8 horas em temperatura ambiente abaixo de 30°C. Do ponto de vista microbiológico, o produto deve ser utilizado imediatamente após a reconstituição.",
    "fonte": "HU-UNIVASF/EBSERH — Guia de diluição e estabilidade (2018)"
  },
  {
    "principio": "aminofilina",
    "apelidos": [],
    "nome": "Aminofilina 24 mg/mL - ampola 10 mL",
    "vias": [
      "EV"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": null,
    "semRotulo": null,
    "naoDilui": false,
    "completo": false,
    "_tempoInfusao": "Não exceder 25 mg/min",
    "_concentracaoMaxima": "",
    "_observacao": "",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "amiodarona",
    "apelidos": [],
    "nome": "Amiodarona, cloridrato 50 mg/mL - ampola 3 mL",
    "vias": [
      "EV"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": {
      "diluente": "SG 5%",
      "volume": "250 mL"
    },
    "semRotulo": null,
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "Dose de 5mg/kg EV direto acima 3 minutos. Dose de ataque usal de 5 mg/kg em 250 mL de SG 5%, administrados por um período de 20 minutos a 2 horas. Dose de manutenção 10 a 20mg/Kg/dia em 250mL de SG5%.",
    "_concentracaoMaxima": "0,6mg/mL",
    "_observacao": "",
    "fonte": "SMS Joinville/SC — Manual de Diluição de Injetáveis PA/UPA (2018)"
  },
  {
    "principio": "atropina",
    "apelidos": [],
    "nome": "Atropina, sulfato 0,25 mg/mL - ampola 1 mL",
    "vias": [
      "EV",
      "IM",
      "SC"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": null,
    "semRotulo": null,
    "naoDilui": true,
    "completo": true,
    "_tempoInfusao": "EV rápido acima de 1 minuto.",
    "_concentracaoMaxima": "",
    "_observacao": "A administração lenta pode resultar em bradicardia paradoxal.",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "betametasona",
    "apelidos": [],
    "nome": "Betametasona, fosfato dissódico 4 mg/mL - ampola 1 mL",
    "vias": [
      "EV",
      "IM"
    ],
    "viasOutras": [
      "intra-articular"
    ],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": null,
    "semRotulo": null,
    "naoDilui": false,
    "completo": false,
    "_tempoInfusao": "",
    "_concentracaoMaxima": "",
    "_observacao": "",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "biperideno",
    "apelidos": [],
    "nome": "Biperideno, lactato 5 mg/mL - aapola 1 mL Antiparkinsoniano",
    "vias": [
      "EV",
      "IM"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": null,
    "semRotulo": null,
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "",
    "_concentracaoMaxima": "",
    "_observacao": "",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "bupivacaína",
    "apelidos": [],
    "nome": "Bupivacaína, cloridrato + glicose - 5 mg/mL (0,5%) + 80",
    "vias": [],
    "viasOutras": [
      "intratecal"
    ],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": null,
    "semRotulo": null,
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "",
    "_concentracaoMaxima": "",
    "_observacao": "",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "bupivacaína",
    "apelidos": [],
    "nome": "Bupivacaína, cloridrato + hemitartarato de epinefrina; 5",
    "vias": [],
    "viasOutras": [
      "epidural",
      "infiltração/bloqueio"
    ],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": null,
    "semRotulo": null,
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "",
    "_concentracaoMaxima": "",
    "_observacao": "Não está indicado para raquianestesia.",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "bupivacaína",
    "apelidos": [],
    "nome": "Bupivacaína, cloridrato 5 mg/mL (0,5%) - frasco-ampola 20 mL",
    "vias": [],
    "viasOutras": [
      "epidural",
      "infiltração/bloqueio"
    ],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": null,
    "semRotulo": null,
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "",
    "_concentracaoMaxima": "",
    "_observacao": "Não está indicado para raquianestesia.",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "cafeína",
    "apelidos": [],
    "nome": "Cafeína, citrato 20 mg/mL (equivale a 10 mg/mL de Cafeína )",
    "vias": [
      "EV"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": null,
    "semRotulo": null,
    "naoDilui": false,
    "completo": false,
    "_tempoInfusao": "Dose de ataque (20mg/Kg): infusão endovenosa lenta durante 30 minutos. Dose de manutenção (5mg/Kg): infusão endovenosa por 10 minutos a cada 24 horas.",
    "_concentracaoMaxima": "",
    "_observacao": "As doses de manutenção podem ser administradas por via oral ou via sonda nasogástrica a cada 24 horas.",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "cetoprofeno",
    "apelidos": [],
    "nome": "Cetoprofeno 100 mg pó liófilo - frasco-ampola",
    "vias": [
      "EV"
    ],
    "viasOutras": [],
    "reconstituicao": "SF 0,9% - 5mL",
    "evDireto": null,
    "infusao": null,
    "semRotulo": {
      "diluente": "SF 0,9%",
      "volume": "150 mL"
    },
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "Infusão lenta - mínimo 20 minutos",
    "_concentracaoMaxima": "",
    "_observacao": "Após reconstituição/diluição, uso imediato.",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "cisatracúrio",
    "apelidos": [],
    "nome": "Cisatracúrio, besilato 2 mg/mL - frasco-ampola 5 mL",
    "vias": [
      "EV"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": null,
    "semRotulo": {
      "diluente": "SF 0,9%",
      "volume": "100 mL"
    },
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "EV direto: 2mg/mL Velocidade de infusão inicial de 3mcg/kg/min (0,18mg/kg/h); Velocidade de manutenção de 1 a 2mcg/kg/min (0,06 a 0,12mg/kg/h) deve ser adequada para manter o bloqueio.",
    "_concentracaoMaxima": "2mg/mL",
    "_observacao": "",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "clonidina",
    "apelidos": [],
    "nome": "Clonidina, cloridrato 150 mcg/mL - ampola 1 mL",
    "vias": [
      "EV",
      "IM"
    ],
    "viasOutras": [
      "intratecal",
      "epidural"
    ],
    "reconstituicao": "",
    "evDireto": {
      "diluente": "SF 0,9%",
      "volume": "10 mL"
    },
    "infusao": {
      "diluente": "SF 0,9%",
      "volume": "500 mL"
    },
    "semRotulo": null,
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "IM profunda, EV lenta (7 a 10 minutos) ou diluída, por gotejamento intravenoso.",
    "_concentracaoMaxima": "",
    "_observacao": "",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "clorpromazina",
    "apelidos": [],
    "nome": "Clorpromazina, cloridrato 5 mg/mL - ampola 5 mL",
    "vias": [
      "IM"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": null,
    "semRotulo": null,
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "",
    "_concentracaoMaxima": "",
    "_observacao": "Recomenda-se que o produto seja administrado apenas por via intramuscular.",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "complexo b",
    "apelidos": [],
    "nome": "Complexo B: B1(Tiamina) 4mg; B2 (Riboflavina) 1mg; B6",
    "vias": [
      "EV",
      "IM"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": null,
    "semRotulo": {
      "diluente": "SF 0,9%",
      "volume": "1000 mL"
    },
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "Infundir lentamente (gota a gota)",
    "_concentracaoMaxima": "",
    "_observacao": "Utilizar equipo fotossensível.",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "complexo protrombínico",
    "apelidos": [],
    "nome": "Complexo Protombínico humano liofilizado 500 UI pó liófilo",
    "vias": [
      "EV"
    ],
    "viasOutras": [],
    "reconstituicao": "Diluente próprio (disponível na embalagem). Deixar o diluente atingir a temperatura ambiente.",
    "evDireto": null,
    "infusao": null,
    "semRotulo": null,
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "1 mL/min nos primeiros 10 minutos, não exceder 8mL/min.",
    "_concentracaoMaxima": "",
    "_observacao": "Recomenda-se que o produto seja administrado imediatamente após o preparo.",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "dantroleno",
    "apelidos": [],
    "nome": "Dantroleno sódico 20 mg pó liófilo frasco-ampola",
    "vias": [
      "EV"
    ],
    "viasOutras": [],
    "reconstituicao": "60mL de água para injetáveis (exclusivamente), sem conservantes, estéril e apirogênica.",
    "evDireto": null,
    "infusao": null,
    "semRotulo": null,
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "Infusão em 1 hora.",
    "_concentracaoMaxima": "",
    "_observacao": "SF 0,9%, SG5% e outras soluções ácidas não são compatíveis, portanto não devem ser usadas. Estabilidade de até 6 horas após a reconstituição entre 15-25°C.",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "deslanosídeo",
    "apelidos": [],
    "nome": "Deslanosídeo 0,2 mg/mL - ampola 2 mL",
    "vias": [
      "EV",
      "IM"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": null,
    "semRotulo": null,
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "EV lentamente.",
    "_concentracaoMaxima": "",
    "_observacao": "Não se deve administrar cálcio por via parenteral a pacientes que fazem uso desse fármaco.",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "dexametasona",
    "apelidos": [],
    "nome": "Dexametasona, fosfato dissódico 4 mg/mL - ampola 2,5 mL",
    "vias": [
      "EV",
      "IM"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": null,
    "semRotulo": {
      "diluente": "SF 0,9%",
      "volume": "100 mL"
    },
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "EV direta lenta ou infusão contínua",
    "_concentracaoMaxima": "",
    "_observacao": "",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "dexmedetomidina",
    "apelidos": [],
    "nome": "Dexmedetomidina, cloridrato 100 mcg/mL - frasco-ampola 2 mL",
    "vias": [
      "EV"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": null,
    "semRotulo": {
      "diluente": "SF 0,9%",
      "volume": "50 mL"
    },
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "Iniciar com 1mcg/kg em 10 minutos, seguida por uma infusão de manutenção 0,2 a 0,7mcg/kg/h. (Pacientes Adultos)",
    "_concentracaoMaxima": "4mcg/mL",
    "_observacao": "Compatível com SG5% e Ringer.",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "dexrazoxano",
    "apelidos": [],
    "nome": "Dexrazoxano, cloridrato 500mg – frasco-ampola",
    "vias": [
      "EV"
    ],
    "viasOutras": [],
    "reconstituicao": "AD – 25mL",
    "evDireto": null,
    "infusao": null,
    "semRotulo": {
      "diluente": "Ringer lactato",
      "volume": "100 mL"
    },
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "15 minutos",
    "_concentracaoMaxima": "",
    "_observacao": "",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "dextrocetamina",
    "apelidos": [],
    "nome": "Dextrocetamina, cloridrato (Escetamina) 50 mg/mL - ampola 2",
    "vias": [
      "EV",
      "IM"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": null,
    "semRotulo": null,
    "naoDilui": true,
    "completo": true,
    "_tempoInfusao": "Bolus/Indução anestésica: durante 1 minuto ou 0,5mg/kg/min Manutenção infusão lenta: 0,1 a 0,5mg/kg/min",
    "_concentracaoMaxima": "2mg/mL",
    "_observacao": "",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "dextrocetamina",
    "apelidos": [],
    "nome": "Dextrocetamina, cloridrato (Escetamina) 50 mg/mL - frasco",
    "vias": [
      "EV",
      "IM"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": null,
    "semRotulo": {
      "diluente": "SF 0,9%",
      "volume": "500 mL"
    },
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "Indução anestésica: 0,5mg/kg/min Manutenção infusão lenta: 0,1 a 0,5mg/kg/min",
    "_concentracaoMaxima": "2mg/mL",
    "_observacao": "",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "diazepam",
    "apelidos": [],
    "nome": "Diazepam 5 mg/mL - ampola 2 mL",
    "vias": [
      "EV",
      "IM"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": null,
    "semRotulo": {
      "diluente": "SF 0,9%",
      "volume": "250 mL"
    },
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "0,5 - 1 mL/min",
    "_concentracaoMaxima": "5 mg/mL (puro)",
    "_observacao": "Vesicante, evitar extravasamento. Antagonista: Flumazenil.",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "diclofenaco",
    "apelidos": [],
    "nome": "Diclofenaco sódico 25 mg/mL - ampola 3 mL",
    "vias": [
      "IM"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": null,
    "semRotulo": null,
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "",
    "_concentracaoMaxima": "",
    "_observacao": "A solução injetável não pode ser administrada por mais de 2 dias. Administrar exclusivamente no glúteo.",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "difenidramina",
    "apelidos": [],
    "nome": "Difenidramina, cloridrato 50 mg - ampola 1 mL",
    "vias": [
      "EV",
      "IM"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": null,
    "semRotulo": {
      "diluente": "SF 0,9%",
      "volume": "50 mL"
    },
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "IM profunda, EV direto (3 a 5 min), Infusão de 15-30min.",
    "_concentracaoMaxima": "50 mg/mL",
    "_observacao": "",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "dimenidrinato",
    "apelidos": [],
    "nome": "Dimenidrinato 50 mg/mL + piridoxina 50 mg/mL - ampola 1 mL",
    "vias": [
      "IM"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": null,
    "semRotulo": null,
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "",
    "_concentracaoMaxima": "",
    "_observacao": "Uso exclusivo IM (profundo) preferencialmente em região glútea.",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "dimenidrinato",
    "apelidos": [],
    "nome": "Dimenidrinato 3 mg/ mL + piridoxina 5 mg/mL + glicose 100",
    "vias": [
      "EV"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": {
      "diluente": "SF 0,9%",
      "volume": "10 mL"
    },
    "infusao": {
      "diluente": "SF 0,9%",
      "volume": "100 mL"
    },
    "semRotulo": null,
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "EV direto: > 2 min. EV infusão: 30 min.",
    "_concentracaoMaxima": "3mg/mL",
    "_observacao": "",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "dipirona",
    "apelidos": [],
    "nome": "Dipirona 500 mg/mL - ampola 2 mL",
    "vias": [
      "EV",
      "IM"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": {
      "diluente": "SF 0,9%",
      "volume": "10 mL"
    },
    "infusao": null,
    "semRotulo": null,
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "EV direto: 1mL/min.",
    "_concentracaoMaxima": "500 mg/mL",
    "_observacao": "",
    "fonte": "SMS Joinville/SC — Manual de Diluição de Injetáveis PA/UPA (2018)"
  },
  {
    "principio": "dobutamina",
    "apelidos": [],
    "nome": "Dobutamina, cloridrato 12,5 mg/mL - ampola 20 mL",
    "vias": [
      "EV"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": null,
    "semRotulo": {
      "diluente": "SF 0,9%",
      "volume": "1000 mL"
    },
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "0,0025 mL/Kg/min a 0,06 mL/Kg/min",
    "_concentracaoMaxima": "5000 mcg/mL (250 mg de dobutamina diluído para 50mL)",
    "_observacao": "Diluído para 1000 mL - concentração 250 mcg/mL. Diluído para 500 mL - concentração 500 mcg/mL. Diluído para 250 mL - a concentração 1000 mcg/mL",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "dopamina",
    "apelidos": [],
    "nome": "Dopamina, cloridrato 5 mg/mL - ampola 10 mL",
    "vias": [
      "EV"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": null,
    "semRotulo": {
      "diluente": "SF 0,9%",
      "volume": "250 mL"
    },
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "20 mcg/kg/min.",
    "_concentracaoMaxima": "3200 mcg/mL",
    "_observacao": "Deve ser administrada em bomba de infusão em veia de grande calibre. Medicamento fotossensível, utilizar equipo âmbar. É inativada em soluções alcalinas.",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "efedrina",
    "apelidos": [],
    "nome": "Efedrina, sulfato 50 mg/mL - ampola 1 mL",
    "vias": [
      "EV",
      "IM",
      "SC"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": null,
    "semRotulo": {
      "diluente": "SF 0,9%",
      "volume": "9 mL"
    },
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "EV lento",
    "_concentracaoMaxima": "5 mg/mL",
    "_observacao": "Proteger a ampola da luz até o momento de usar.",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "enoxaparina",
    "apelidos": [],
    "nome": "Enoxaparina sódica 20 mg/0,2mL seringa",
    "vias": [
      "SC"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": null,
    "semRotulo": null,
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "",
    "_concentracaoMaxima": "",
    "_observacao": "Administração na região anterolateral ao abdômen, alternando a cada aplicação os lados direito e esquerdo.",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "enoxaparina",
    "apelidos": [],
    "nome": "Enoxaparina sódica 40 mg/0,4mL seringa",
    "vias": [
      "SC"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": null,
    "semRotulo": null,
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "",
    "_concentracaoMaxima": "",
    "_observacao": "Administração na região anterolateral ao abdômen, alternando a cada aplicação os lados direito e esquerdo.",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "enoxaparina",
    "apelidos": [],
    "nome": "Enoxaparina sódica 60 mg/0,6mL seringa",
    "vias": [
      "SC"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": null,
    "semRotulo": null,
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "",
    "_concentracaoMaxima": "",
    "_observacao": "Administração na região anterolateral ao abdômen, alternando a cada aplicação os lados direito e esquerdo.",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "enoxaparina",
    "apelidos": [],
    "nome": "Enoxaparina sódica 80 mg/0,8mL seringa",
    "vias": [
      "SC"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": null,
    "semRotulo": null,
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "",
    "_concentracaoMaxima": "",
    "_observacao": "Administração na região anterolateral ao abdômen, alternando a cada aplicação os lados direito e esquerdo.",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "epinefrina",
    "apelidos": [],
    "nome": "Epinefrina 1 mg/mL - ampola 1 mL",
    "vias": [
      "EV",
      "IM",
      "SC"
    ],
    "viasOutras": [
      "intracardíaca"
    ],
    "reconstituicao": "",
    "evDireto": {
      "diluente": "SF 0,9%",
      "volume": "10 mL"
    },
    "infusao": {
      "diluente": "SF 0,9%",
      "volume": "250 mL"
    },
    "semRotulo": null,
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "Adultos: 0,1-0,5mcg/kg/min Pediatria: 0,1-01mcg/kg/min",
    "_concentracaoMaxima": "16mcg/mL para adultos. 64mcg/mL para crianças.",
    "_observacao": "Proteger da Luz. Sensível a luz e ao ar. Vesicante, evitar extravasamento.",
    "fonte": "HU-UNIVASF/EBSERH — Guia de diluição e estabilidade (2018)"
  },
  {
    "principio": "escopolamina",
    "apelidos": [],
    "nome": "Escopolamina, butilbrometo 20 mg/mL - ampola 1 mL",
    "vias": [
      "EV",
      "IM"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": null,
    "semRotulo": {
      "diluente": "SF 0,9%",
      "volume": "100 mL"
    },
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "1 mL/min EV direto: 30 minutos",
    "_concentracaoMaxima": "20 mg/mL (puro)",
    "_observacao": "Contraindicado uso em idosos, especialmente sensíveis aos efeitos secundários dos antimuscarínicos, como secura da boca e retenção urinária. Não exceder a dose máxima de 100 mg (5 ampolas) por dia para adultos.",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "escopolamina",
    "apelidos": [],
    "nome": "Escopolamina, butilbrometo + dipirona sódica ; 4 mg/mL +",
    "vias": [
      "EV",
      "IM"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": null,
    "semRotulo": {
      "diluente": "SF 0,9%",
      "volume": "50 mL"
    },
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "EV direto: Em 5 min Mínimo de 1mL/min",
    "_concentracaoMaxima": "",
    "_observacao": "Não deve ser administrado por via parenteral em pacientes com glaucoma, taquicardia, estenoses mecânicas no trato gastrintestinal, megacólon, miastenia grave ou hipertrofia prostática. Contraindicado uso em idosos, especialmente sensíveis aos efeitos secundários dos antimuscarínicos, como secura da boca e retenção urinária.",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "etilefrina",
    "apelidos": [],
    "nome": "Etilefrina, cloridrato 10 mg/mL - ampola 1 mL",
    "vias": [
      "EV",
      "IM",
      "SC"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": null,
    "semRotulo": null,
    "naoDilui": false,
    "completo": false,
    "_tempoInfusao": "0,4 mg/min - adultos. 0,2 mg/min - crianças de 2-6 anos. 0,05 a 0,2mg/min –crianças menores de 2 anos.",
    "_concentracaoMaxima": "",
    "_observacao": "",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "etomidato",
    "apelidos": [],
    "nome": "Etomidato 2 mg/mL - ampola 10 mL",
    "vias": [
      "EV"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": null,
    "semRotulo": null,
    "naoDilui": true,
    "completo": true,
    "_tempoInfusao": "EV lento: 30 a 60 segundos.",
    "_concentracaoMaxima": "",
    "_observacao": "Não apresenta ação analgésica. A solução é altamente irritante, evitar a administração em vasos de pequeno calibre.",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "fenitoína",
    "apelidos": [],
    "nome": "Fenitoína sódica 50 mg/mL - ampola 5 mL",
    "vias": [
      "EV"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": null,
    "semRotulo": {
      "diluente": "SF 0,9%",
      "volume": "50 mL"
    },
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "50 mg/min em adultos. EV infusão: 60 minutos",
    "_concentracaoMaxima": "5mg/mL",
    "_observacao": "Vesicante, evitar extravasamento. Administrar em veia de grande calibre. Recomendado a infusão por curtos períodos utilizando filtro de 0,22 micras.",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "fenobarbital",
    "apelidos": [],
    "nome": "Fenobarbital sódico 100 mg/mL - ampola 2 mL",
    "vias": [
      "EV",
      "IM"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": {
      "diluente": "SF 0,9%",
      "volume": "10 mL"
    },
    "infusao": null,
    "semRotulo": null,
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "EV direto: 3 a 5 minutos. Administrar lentamente, máximo 60 mg/min em adultos.",
    "_concentracaoMaxima": "10mg/mL",
    "_observacao": "Irritante, evitar extravasamento. IM: a injeção intramuscular deve ser aplicada em local de massa muscular larga e injetar menos de 5mL em cada lado.",
    "fonte": "SMS Joinville/SC — Manual de Diluição de Injetáveis PA/UPA (2018)"
  },
  {
    "principio": "fentanil",
    "apelidos": [
      "fentanila"
    ],
    "nome": "Fentanil, citrato 0,0785 mg/mL",
    "vias": [
      "EV",
      "IM"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": {
      "diluente": "SF 0,9%",
      "volume": "200 mL"
    },
    "semRotulo": null,
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "",
    "_concentracaoMaxima": "",
    "_observacao": "Antídoto: Naloxona.",
    "fonte": "HU-UNIVASF/EBSERH — Guia de diluição e estabilidade (2018)"
  },
  {
    "principio": "fentanil",
    "apelidos": [
      "fentanila"
    ],
    "nome": "Fentanil, citrato 0,0785 mg/mL",
    "vias": [
      "EV",
      "IM"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": {
      "diluente": "SF 0,9%",
      "volume": "200 mL"
    },
    "semRotulo": null,
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "",
    "_concentracaoMaxima": "SF 0,9% - 0,02mg/mL e 0,01mg/mL SG 5% - 0,01mg/ml e 0,04mg/mL",
    "_observacao": "Antídoto: Naloxona.",
    "fonte": "HU-UNIVASF/EBSERH — Guia de diluição e estabilidade (2018)"
  },
  {
    "principio": "filgrastim",
    "apelidos": [],
    "nome": "Filgrastim 300 mcg 1 mL frasco",
    "vias": [
      "EV",
      "SC"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": null,
    "semRotulo": {
      "diluente": "SG 5%",
      "volume": "50 mL"
    },
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "Infundir em 30 minutos.",
    "_concentracaoMaxima": "",
    "_observacao": "Incompatível com SF 0,9 %",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "fitomenadiona",
    "apelidos": [],
    "nome": "Fitomenadiona (vitamina K) 10 mg/mL - ampola 1 mL",
    "vias": [
      "IM"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": null,
    "semRotulo": null,
    "naoDilui": true,
    "completo": true,
    "_tempoInfusao": "Infusão lenta. 1 mg/minuto ou 20 ml/minuto.",
    "_concentracaoMaxima": "0,05mg/mL",
    "_observacao": "A via endovenosa deve ser restrita a situações onde outra via não é possível e o alto risco envolvido é justificável. Proteger da luz. Diluir em Sf ou SG5% 200mL.",
    "fonte": "SMS Joinville/SC — Manual de Diluição de Injetáveis PA/UPA (2018)"
  },
  {
    "principio": "flumazenil",
    "apelidos": [],
    "nome": "Flumazenil, cloridrato 0,1 mg/mL - ampola 5 mL",
    "vias": [
      "EV"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": null,
    "semRotulo": null,
    "naoDilui": true,
    "completo": true,
    "_tempoInfusao": "Em 15-30 segundos em bolus. Infusão: 0,1 mg - 0,4 mg/hora.",
    "_concentracaoMaxima": "",
    "_observacao": "Deve ser administrado em veia de grande calibre. Evitar extravasamento.",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "folinato",
    "apelidos": [],
    "nome": "Folinato de Cálcio (Ácido Folínico) 50mg pó liófilo frasco",
    "vias": [
      "EV",
      "IM"
    ],
    "viasOutras": [],
    "reconstituicao": "5ml de água bacteriostática ou água para injetáveis.",
    "evDireto": null,
    "infusao": null,
    "semRotulo": {
      "diluente": "SF 0,9%",
      "volume": "50 mL"
    },
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "Não exceder 160mg/min.",
    "_concentracaoMaxima": "10 mg/mL",
    "_observacao": "Quando reconstituído em água bacteriostática (contendo álcool benzílico), o medicamento poderá ser utilizado em até 7 (sete) dias. Caso o produto seja reconstituído com água para injetáveis, recomenda-se utilização imediata e descarte da porção não utilizada.",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "folinato",
    "apelidos": [],
    "nome": "Folinato de Cálcio (Ácido Folínico) 10 mg/mL frasco-ampola",
    "vias": [
      "EV",
      "IM"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": null,
    "semRotulo": {
      "diluente": "SF 0,9%",
      "volume": "100 mL"
    },
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "Máximo 160mg/min.",
    "_concentracaoMaxima": "10 mg/mL",
    "_observacao": "",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "fosfato de potássio",
    "apelidos": [],
    "nome": "Fosfato de potássio 2meq/mL – ampola 10mL",
    "vias": [
      "EV"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": null,
    "semRotulo": {
      "diluente": "SF 0,9%",
      "volume": "500 mL"
    },
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "Tempo de infusão: 6 a 12 horas.",
    "_concentracaoMaxima": "",
    "_observacao": "Não administrar na mesma bolsa ou em linha com solução de sais de cálcio.",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "furosemida",
    "apelidos": [],
    "nome": "Furosemida 10 mg/mL - ampola 2 mL",
    "vias": [
      "EV",
      "IM"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": {
      "diluente": "SF 0,9%",
      "volume": "18 mL"
    },
    "infusao": {
      "diluente": "SF 0,9%",
      "volume": "100 mL"
    },
    "semRotulo": null,
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "4 mg/min. Para uso em bolus, administrar cerca de 1 a 2 minutos.",
    "_concentracaoMaxima": "10 mg/mL",
    "_observacao": "Proteger da luz. Pode ser administrada sem diluição. A administração IM deve ser restrita a casos excepcionais.",
    "fonte": "HU-UNIVASF/EBSERH — Guia de diluição e estabilidade (2018)"
  },
  {
    "principio": "gosserrelina",
    "apelidos": [],
    "nome": "Gosserrelina, acetato 3,6 mg seringa",
    "vias": [
      "SC"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": null,
    "semRotulo": null,
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "",
    "_concentracaoMaxima": "",
    "_observacao": "Seringa preenchida pronta para uso.",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "haloperidol",
    "apelidos": [],
    "nome": "Haloperidol 5 mg/mL - ampola 1 mL",
    "vias": [
      "IM"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": null,
    "semRotulo": null,
    "naoDilui": true,
    "completo": true,
    "_tempoInfusao": "2-25 mg/hora (quando necessário usar a via EV).",
    "_concentracaoMaxima": "3 mg/mL",
    "_observacao": "Em caso de administração EV monitoramento contínuo do eletrocardiograma, risco de prolongamento do intervalo QT e arritmias cardíacas sérias.",
    "fonte": "HU-UNIVASF/EBSERH — Guia de diluição e estabilidade (2018)"
  },
  {
    "principio": "heparina",
    "apelidos": [],
    "nome": "Heparina sódica 5000 UI/0,25 mL - ampola 0,25 mL",
    "vias": [
      "SC"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": null,
    "semRotulo": null,
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "",
    "_concentracaoMaxima": "",
    "_observacao": "",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "heparina",
    "apelidos": [],
    "nome": "Heparina sódica 5000 UI/mL – frasco-ampola 5 mL",
    "vias": [
      "EV"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": null,
    "semRotulo": {
      "diluente": "SF 0,9%",
      "volume": "250 mL"
    },
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "",
    "_concentracaoMaxima": "",
    "_observacao": "Antídoto: Protamina. Cada 1mL de protamina inativa 1.000 UI de heparina sódica. Recomenda-se o uso de bomba de infusão. A via IM não é recomendada devido à dor e hematoma.",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "hidralazina",
    "apelidos": [],
    "nome": "Hidralazina, cloridrato 20 mg/mL - ampola 1 mL",
    "vias": [
      "EV",
      "IM"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": {
      "diluente": "SF 0,9%",
      "volume": "50 mL"
    },
    "infusao": null,
    "semRotulo": null,
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "EV direto: 3 a 5 min Infusão continua: 50 - 150mcg/min",
    "_concentracaoMaxima": "200 a 400 mg/Litro",
    "_observacao": "Não usar SG 5%",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "hidrocortisona",
    "apelidos": [],
    "nome": "Hidrocortisona, succinato sódico 100 mg",
    "vias": [
      "EV",
      "IM"
    ],
    "viasOutras": [],
    "reconstituicao": "água para injeção 2 mL",
    "evDireto": null,
    "infusao": {
      "diluente": "SF 0,9%",
      "volume": "100 mL"
    },
    "semRotulo": null,
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "EV direto: 30seg Infusão: acima de 30min",
    "_concentracaoMaxima": "EV direto: 50mg/mL Infusão: 1mg/mL",
    "_observacao": "",
    "fonte": "SMS Joinville/SC — Manual de Diluição de Injetáveis PA/UPA (2018)"
  },
  {
    "principio": "hidrocortisona",
    "apelidos": [],
    "nome": "Hidrocortisona, succinato 500 mg",
    "vias": [
      "EV",
      "IM"
    ],
    "viasOutras": [],
    "reconstituicao": "água para injeção 4 mL",
    "evDireto": null,
    "infusao": {
      "diluente": "SF 0,9%",
      "volume": "100 mL"
    },
    "semRotulo": null,
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "EV direto: 10min Infusão: acima de 30min",
    "_concentracaoMaxima": "EV direto: 50mg/mL Infusão: 1mg/mL",
    "_observacao": "",
    "fonte": "SMS Joinville/SC — Manual de Diluição de Injetáveis PA/UPA (2018)"
  },
  {
    "principio": "imunoglobulina",
    "apelidos": [],
    "nome": "Imunoglobulina antitimócito 25 mg pó liófilo Imunossupressor",
    "vias": [
      "EV"
    ],
    "viasOutras": [],
    "reconstituicao": "AD - 5 mL.",
    "evDireto": null,
    "infusao": null,
    "semRotulo": {
      "diluente": "SF 0,9%",
      "volume": "500 mL"
    },
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "4 a 6 horas.",
    "_concentracaoMaxima": "",
    "_observacao": "Administrar em veia de grande calibre. Recomendado que administrar através de um filtro de linha de 0,2 μm em bomba de infusão.",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "imunoglobulina",
    "apelidos": [],
    "nome": "Imunoglobulina humana 5 g Imunoglobulina (biológico)",
    "vias": [
      "EV"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": null,
    "semRotulo": null,
    "naoDilui": true,
    "completo": true,
    "_tempoInfusao": "O produto deve ser infundido inicialmente a uma velocidade de 0,3 mL/kg de peso corporal/h (por 30 minutos). Se houver boa tolerabilidade, a velocidade de infusão pode ser aumentada gradativamente para 4,8 mL/kg de peso corporal/h.",
    "_concentracaoMaxima": "100mg/mL",
    "_observacao": "Não misturar com SF 0,9%",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "insulina",
    "apelidos": [],
    "nome": "Insulina Humana NPH 100 UI/mL – frasco-ampola 10 mL",
    "vias": [
      "SC"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": null,
    "semRotulo": null,
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "",
    "_concentracaoMaxima": "",
    "_observacao": "",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "insulina",
    "apelidos": [],
    "nome": "Insulina Humana Regular 100 UI/mL - frasco-ampola 10 mL",
    "vias": [
      "EV",
      "IM",
      "SC"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": null,
    "semRotulo": {
      "diluente": "SF 0,9%",
      "volume": "100 mL"
    },
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "",
    "_concentracaoMaxima": "1 unidade/mL",
    "_observacao": "",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "isossorbida",
    "apelidos": [],
    "nome": "Isossorbida, mononitrato 10 mg/mL - ampola 1 mL",
    "vias": [
      "EV"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": null,
    "semRotulo": {
      "diluente": "SF 0,9%",
      "volume": "100 mL"
    },
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "EV bolus; Infusão contínua: correr em 2 a 3 horas",
    "_concentracaoMaxima": "",
    "_observacao": "",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "leuprorrelina",
    "apelidos": [],
    "nome": "Leuprorrelina, acetato 3,75 mg pó liófilo Hormônio",
    "vias": [
      "IM"
    ],
    "viasOutras": [],
    "reconstituicao": "Reconstituído diluente próprio.",
    "evDireto": null,
    "infusao": null,
    "semRotulo": null,
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "",
    "_concentracaoMaxima": "",
    "_observacao": "Aumento dos níveis séricos de testosterona no início do tratamento. Usar com cautela em pacientes com histórico de doença psiquiátrica.",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "levobupivacaína",
    "apelidos": [],
    "nome": "Levobupivacaína, cloridrato + hemitartarato de epinefrina 5",
    "vias": [],
    "viasOutras": [
      "epidural",
      "infiltração/bloqueio"
    ],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": null,
    "semRotulo": null,
    "naoDilui": false,
    "completo": false,
    "_tempoInfusao": "",
    "_concentracaoMaxima": "2,5mg/mL.",
    "_observacao": "Não está indicado para raquianestesia.",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "levobupivacaína",
    "apelidos": [],
    "nome": "Levobupivacaína, cloridrato 5 mg/mL (0,5%) - frasco-ampola",
    "vias": [],
    "viasOutras": [
      "epidural",
      "infiltração/bloqueio"
    ],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": null,
    "semRotulo": null,
    "naoDilui": false,
    "completo": false,
    "_tempoInfusao": "",
    "_concentracaoMaxima": "2,5mg/mL.",
    "_observacao": "Não está indicado para raquianestesia.",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "levosimendana",
    "apelidos": [],
    "nome": "Levosimendana 2,5 mg/mL - frasco-ampola 5 mL",
    "vias": [
      "EV"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": null,
    "semRotulo": {
      "diluente": "SG 5%",
      "volume": "500 mL"
    },
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "Dose inicial de 6 a 12 mcg/kg, infundidos durante 10 minutos, seguida por uma infusão contínua de 0,1 mcg/kg/min por 24 horas.",
    "_concentracaoMaxima": "0,05 mg/mL",
    "_observacao": "A cor da solução pode modificar-se para laranja durante o armazenamento, não comprometendo a potência.",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "lidocaína",
    "apelidos": [],
    "nome": "Lidocaína, cloridrato + hemitartarato de epinefrina 20",
    "vias": [],
    "viasOutras": [
      "infiltração/bloqueio"
    ],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": null,
    "semRotulo": null,
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "",
    "_concentracaoMaxima": "",
    "_observacao": "Não está indicado para raquianestesia.",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "lidocaína",
    "apelidos": [],
    "nome": "Lidocaína, cloridrato 20 mg/mL (2%) - ampola 5 mL",
    "vias": [],
    "viasOutras": [
      "infiltração/bloqueio"
    ],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": null,
    "semRotulo": null,
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "",
    "_concentracaoMaxima": "",
    "_observacao": "Não está indicado para raquianestesia.",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "lidocaína",
    "apelidos": [],
    "nome": "Lidocaína, cloridrato 20 mg/mL (2%) - frasco-ampola 20 mL",
    "vias": [],
    "viasOutras": [
      "infiltração/bloqueio"
    ],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": null,
    "semRotulo": null,
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "",
    "_concentracaoMaxima": "",
    "_observacao": "Não está indicado para raquianestesia.",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "mesna",
    "apelidos": [],
    "nome": "Mesna 100 mg/mL - ampola 4mL",
    "vias": [
      "EV"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": null,
    "semRotulo": {
      "diluente": "SF 0,9%",
      "volume": "1000 mL"
    },
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "EV direta por 15-30min ou infusão contínua.",
    "_concentracaoMaxima": "20mg/ml",
    "_observacao": "A diluição de mesna com Solução de Ringer é estável por 12 horas a temperatura ambiente.",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "metaraminol",
    "apelidos": [],
    "nome": "Metaraminol, bitartarato 10 mg/mL - ampola 1mL",
    "vias": [
      "EV",
      "IM"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": null,
    "semRotulo": {
      "diluente": "SF 0,9%",
      "volume": "500 mL"
    },
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "",
    "_concentracaoMaxima": "0,2mg/ml",
    "_observacao": "No choque grave pode ser administrado EV direto 0,5 a 5mg. Atenção: medicamento vesicante.",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "metilergometrina",
    "apelidos": [],
    "nome": "Metilergometrina, maleato 0,2 mg/mL - ampola 1 mL",
    "vias": [
      "EV",
      "IM",
      "SC"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": null,
    "semRotulo": null,
    "naoDilui": true,
    "completo": true,
    "_tempoInfusao": "EV administrar lento , acima de 60 segundos.",
    "_concentracaoMaxima": "",
    "_observacao": "Injeção intramuscular (IM) é a via de administração recomendada. Endovenoso: monitoramento cauteloso da pressão sanguínea.",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "metilprednisolona",
    "apelidos": [],
    "nome": "Metilprednisolona, succinato 125 mg",
    "vias": [
      "EV",
      "IM"
    ],
    "viasOutras": [],
    "reconstituicao": "2mL de diluente próprio",
    "evDireto": null,
    "infusao": null,
    "semRotulo": {
      "diluente": "SF 0,9%",
      "volume": "50 mL"
    },
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "EV direto - Administrar 30 mg/kg por um período de, pelo menos, 30 minutos. Doses acima de 250mg devem ser administradas acima de 30 min.",
    "_concentracaoMaxima": "125mg/mL",
    "_observacao": "Reconstituir o produto apenas com o diluente que acompanha a embalagem.",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "metilprednisolona",
    "apelidos": [],
    "nome": "Metilprednisolona, succinato 500 mg",
    "vias": [
      "EV",
      "IM"
    ],
    "viasOutras": [],
    "reconstituicao": "diluente próprio 8 mL",
    "evDireto": null,
    "infusao": {
      "diluente": "SF 0,9%",
      "volume": "200 mL"
    },
    "semRotulo": null,
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "EV direto - Administrar 30 mg/kg por um período de, pelo menos, 30 minutos. Doses acima de 250mg devem ser administradas acima de 30 min.",
    "_concentracaoMaxima": "125mg/mL",
    "_observacao": "Reconstituir o produto apenas com o diluente que acompanha a embalagem.",
    "fonte": "HU-UNIVASF/EBSERH — Guia de diluição e estabilidade (2018)"
  },
  {
    "principio": "metoclopramida",
    "apelidos": [],
    "nome": "Metoclopramida, cloridrato 10 mg/2 mL ampola",
    "vias": [
      "EV",
      "IM"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": null,
    "semRotulo": {
      "diluente": "SF 0,9%",
      "volume": "50 mL"
    },
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "EV: no mínimo por 3 minutos. IM : administrar lento",
    "_concentracaoMaxima": "",
    "_observacao": "Risco de sintomas extrapiramidais. Cautela em pacientes que apresentam fatores de risco conhecidos para prolongamento do intervalo QT.",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "metoprolol",
    "apelidos": [],
    "nome": "Metoprolol, tartarato 1 mg/mL - ampola 5 mL",
    "vias": [
      "EV"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": null,
    "semRotulo": {
      "diluente": "SF 0,9%",
      "volume": "1000 mL"
    },
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "",
    "_concentracaoMaxima": "0,04mg/mL.",
    "_observacao": "",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "midazolam",
    "apelidos": [],
    "nome": "Midazolam, cloridrato 1 mg/mL - ampola 5 mL",
    "vias": [
      "EV",
      "IM"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": null,
    "semRotulo": {
      "diluente": "SF 0,9%",
      "volume": "1000 mL"
    },
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "A administração EV deve ser feita lentamente, a uma velocidade de aproximadamente 1mg em 30 segundos.",
    "_concentracaoMaxima": "IM: 1mg/mL EV: 5mg/mL.",
    "_observacao": "Não misturar com soluções alcalinas. Midazolam sofre precipitação em Bicarbonato de sódio. Antídoto: Flumazenil.",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "midazolam",
    "apelidos": [],
    "nome": "Midazolam, cloridrato 5 mg/mL - ampola 3 mL",
    "vias": [
      "EV",
      "IM"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": null,
    "semRotulo": {
      "diluente": "SF 0,9%",
      "volume": "1000 mL"
    },
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "A administração EV deve ser feita lentamente, a uma velocidade de aproximadamente 1mg em 30 segundos.",
    "_concentracaoMaxima": "IM: 1mg/mL EV: 5 mg/mL.",
    "_observacao": "Não misturar com soluções alcalinas. Midazolam sofre precipitação em Bicarbonato de sódio. Antídoto: Flumazenil.",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "midazolam",
    "apelidos": [],
    "nome": "Midazolam, cloridrato 5 mg/mL - ampola 10 mL",
    "vias": [
      "EV",
      "IM"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": null,
    "semRotulo": {
      "diluente": "SF 0,9%",
      "volume": "1000 mL"
    },
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "A administração EV deve ser feita lentamente, a uma velocidade de aproximadamente 1mg em 30 segundos.",
    "_concentracaoMaxima": "IM: 1mg/mL EV: 5 mg/mL.",
    "_observacao": "Não misturar com soluções alcalinas. Midazolam sofre precipitação em Bicarbonato de sódio. Antídoto: Flumazenil.",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "milrinona",
    "apelidos": [],
    "nome": "Milrinona, lactato 1 mg/mL - ampola 10 mL",
    "vias": [
      "EV"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": {
      "diluente": "SF 0,9%",
      "volume": "100 mL"
    },
    "semRotulo": null,
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "Dose de ataque: 50mcg/kg em 10min Dose de manutenção: 0,375 a 0,750mcg/kg/ min em infusão contínua",
    "_concentracaoMaxima": "200mcg/ml",
    "_observacao": "Não deve ser diluído em soluções contendo Bicarbonato de Sódio.",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "morfina",
    "apelidos": [],
    "nome": "Morfina, sulfato 10 mg/mL - ampola 1 mL",
    "vias": [
      "EV",
      "IM",
      "SC"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": {
      "diluente": "água para injeção",
      "volume": "8 mL"
    },
    "infusao": null,
    "semRotulo": null,
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "EV direto: de 3 a 5 minutos",
    "_concentracaoMaxima": "0,1- 1mg/mL",
    "_observacao": "Antagonista: Naloxona Quando preparadas em seringas, não armazenar, uso imediato (perda de potência).",
    "fonte": "SMS Joinville/SC — Manual de Diluição de Injetáveis PA/UPA (2018)"
  },
  {
    "principio": "morfina",
    "apelidos": [],
    "nome": "Morfina, sulfato 0,2 mg/mL - ampola 1 mL",
    "vias": [
      "EV",
      "IM",
      "SC"
    ],
    "viasOutras": [
      "intratecal",
      "epidural"
    ],
    "reconstituicao": "",
    "evDireto": {
      "diluente": "água para injeção",
      "volume": "8 mL"
    },
    "infusao": null,
    "semRotulo": null,
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "EV direto: de 3 a 5 minutos",
    "_concentracaoMaxima": "",
    "_observacao": "Antagonista: Naloxona. Quando preparadas em seringas, não armazenar, uso imediato (perda de potência). A embalagem Sterile Pack é destinada para uso no Bloco Cirúrgico.",
    "fonte": "SMS Joinville/SC — Manual de Diluição de Injetáveis PA/UPA (2018)"
  },
  {
    "principio": "morfina",
    "apelidos": [],
    "nome": "Morfina, sulfato 1 mg/mL - ampola 2 mL",
    "vias": [
      "EV",
      "IM",
      "SC"
    ],
    "viasOutras": [
      "intratecal",
      "epidural"
    ],
    "reconstituicao": "",
    "evDireto": {
      "diluente": "água para injeção",
      "volume": "8 mL"
    },
    "infusao": null,
    "semRotulo": null,
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "EV direto: de 3 a 5 minutos",
    "_concentracaoMaxima": "",
    "_observacao": "Antagonista: Naloxona. Quando preparadas em seringas, não armazenar, uso imediato (perda de potência). A embalagem Sterile Pack é destinada para uso no Bloco Cirúrgico.",
    "fonte": "SMS Joinville/SC — Manual de Diluição de Injetáveis PA/UPA (2018)"
  },
  {
    "principio": "nalbufina",
    "apelidos": [],
    "nome": "Nalbufina, cloridrato 10 mg/mL - ampola 1 mL",
    "vias": [
      "EV",
      "IM",
      "SC"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": null,
    "semRotulo": {
      "diluente": "SF 0,9%",
      "volume": "50 mL"
    },
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "EV direto lento: 30mL em 2 a 3 min Infusão: 50mL em 10-15min",
    "_concentracaoMaxima": "0,5mg/mL",
    "_observacao": "",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "naloxona",
    "apelidos": [],
    "nome": "Naloxona, cloridrato 0,4 mg/mL - ampola 1 mL",
    "vias": [
      "EV",
      "IM",
      "SC"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": null,
    "semRotulo": {
      "diluente": "SF 0,9%",
      "volume": "500 mL"
    },
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "",
    "_concentracaoMaxima": "Infusão contínua: 2 mg em 500 ml de diluente: 0,004mg/mL. Concentração para EV direto: 0,4mg em 9mL de diluente: 0,04mg/mL.",
    "_observacao": "",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "neostigmina",
    "apelidos": [],
    "nome": "Neostigmina, metilssulfato 0,5 mg/mL - ampola 1 mL",
    "vias": [
      "EV",
      "IM",
      "SC"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": null,
    "semRotulo": {
      "diluente": "SF 0,9%",
      "volume": "10 mL"
    },
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "EV: lentamente; no mínimo 3 a 5 minutos.",
    "_concentracaoMaxima": "",
    "_observacao": "",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "nitroglicerina",
    "apelidos": [],
    "nome": "Nitroglicerina 5 mg/mL - ampola 5 mL",
    "vias": [
      "EV"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": null,
    "semRotulo": {
      "diluente": "SF 0,9%",
      "volume": "500 mL"
    },
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "",
    "_concentracaoMaxima": "400 mcg/mL.",
    "_observacao": "A infusão de nitroglicerina injetável não deve ser misturada com outros fármacos. Diluir antes do uso. Não fazer via intravenosa direta.",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "nitroprusseto",
    "apelidos": [
      "nitroprussiato"
    ],
    "nome": "Nitroprusseto de sódio 50 mg pó liófilo + diluente ou ampola",
    "vias": [
      "EV"
    ],
    "viasOutras": [],
    "reconstituicao": "Diluente próprio (SG 5% - 2 mL) ou solução pronta para uso.",
    "evDireto": null,
    "infusao": null,
    "semRotulo": {
      "diluente": "SG 5%",
      "volume": "1000 mL"
    },
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "Inicial: 0,3 - 1 mcg/Kg/min Dose máxima: 10mcg/Kg/min",
    "_concentracaoMaxima": "0,2mg/mL",
    "_observacao": "Medicamento irritante, evitar extravasamento. A solução reconstituída é estável por 4 horas, e a solução diluída é estável por 24 horas. Proteger da luz.",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "norepinefrina",
    "apelidos": [],
    "nome": "Norepinefrina, hemitartarato 2 mg/mL - ampola 4 mL",
    "vias": [
      "EV"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": null,
    "semRotulo": {
      "diluente": "SG 5%",
      "volume": "1000 mL"
    },
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "Inicial: 2-3mL/min Manutenção: 0,5-1mL/min",
    "_concentracaoMaxima": "0,5mg/mL.",
    "_observacao": "Administrar em veia calibrosa (central). Vesicante, evitar extravasamento. Proteger da luz. Não é recomendada a administração apenas em solução salina, a fim de evitar perdas por oxidação.",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "ocitocina",
    "apelidos": [],
    "nome": "Ocitocina 5 UI/mL - ampola 1 mL",
    "vias": [
      "EV",
      "IM"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": null,
    "semRotulo": {
      "diluente": "SF 0,9%",
      "volume": "500 mL"
    },
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "Inicial: 1 a 4 miliunidades/min (2 a 8 gotas/minuto). Velocidade máxima: 20 miliunidades/min (40 gotas/min).",
    "_concentracaoMaxima": "0,01UI/mL",
    "_observacao": "",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "octreotida",
    "apelidos": [],
    "nome": "Octreotida, acetato 0,1 mg/mL ampola 1 mL",
    "vias": [
      "EV",
      "SC"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": null,
    "semRotulo": {
      "diluente": "SF 0,9%",
      "volume": "200 mL"
    },
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "Infusão contínua: 50mcg/hora, equivalente a 1,2mg/dia. SC: Fístula pancreática, ascite, derrame pleural: 0,1mg (100mcg) de 8/8h",
    "_concentracaoMaxima": "0,1mg/mL",
    "_observacao": "Protocolo Institucional - Necessário preenchimento de Formulário de Medicamentos - Uso Restrito. Proteger da luz. Não misturar outros medicamentos..",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "octreotida",
    "apelidos": [],
    "nome": "Octreotida, acetato 0,5 mg/mL ampola 1 mL",
    "vias": [
      "EV",
      "SC"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": null,
    "semRotulo": {
      "diluente": "SF 0,9%",
      "volume": "200 mL"
    },
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "Infusão contínua: 50mcg/hora, equivalente a 1,2mg/dia. SC: Fístula pancreática, ascite, derrame pleural: 0,1mg (100mcg) de 8/8h",
    "_concentracaoMaxima": "0,1mg/mL",
    "_observacao": "Protocolo Institucional - Necessário preenchimento de Formulário de Medicamentos - Uso Restrito. Proteger da luz. Não misturar outros medicamentos.",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "octreotida",
    "apelidos": [],
    "nome": "Octreotida, acetato 0,05 mg/mL ampola 1 mL",
    "vias": [
      "EV",
      "SC"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": null,
    "semRotulo": {
      "diluente": "SF 0,9%",
      "volume": "200 mL"
    },
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "Infusão contínua: 50mcg/hora, equivalente a 1,2mg/dia. SC: Fístula pancreática, ascite, derrame pleural: 0,1mg (100mcg) de 8/8h",
    "_concentracaoMaxima": "0,1mg/mL",
    "_observacao": "Protocolo Institucional - Necessário preenchimento de Formulário de Medicamentos - Uso Restrito. Proteger da luz. Não misturar outros medicamentos.",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "omeprazol",
    "apelidos": [],
    "nome": "Omeprazol sódico 40 mg pó liofilizado frasco-ampola",
    "vias": [
      "EV"
    ],
    "viasOutras": [],
    "reconstituicao": "Diluente próprio - 10mL",
    "evDireto": {
      "diluente": "água para injeção",
      "volume": "10 mL"
    },
    "infusao": {
      "diluente": "SF 0,9%",
      "volume": "100 mL"
    },
    "semRotulo": null,
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "EV Direta: Aplicar lentamente, de 2,5mL/min até um máximo de 4mL/min. Infusão: deve ser administrada por um período não inferior a 20- 30 minutos.",
    "_concentracaoMaxima": "",
    "_observacao": "Proteger da luz. Reconstituir somente com o diluente próprio (10mL). Estável por 4 horas.",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "ondansetrona",
    "apelidos": [],
    "nome": "Ondansetrona, cloridrato 2 mg/mL Antiemético, Antagonista",
    "vias": [
      "EV",
      "IM"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": null,
    "semRotulo": {
      "diluente": "SF 0,9%",
      "volume": "100 mL"
    },
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "Doses de 8 mg ou menos não precisam ser diluídas: podem ser administrada IM ou EV lento > 30 segundos. Doses acima de 8mg até 16mg - Infusão : acima de 15 min.",
    "_concentracaoMaxima": "",
    "_observacao": "",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "pamidronato",
    "apelidos": [],
    "nome": "Pamidronato dissódico 90 mg – frasco-ampola",
    "vias": [
      "EV"
    ],
    "viasOutras": [],
    "reconstituicao": "AD - 10 mL",
    "evDireto": null,
    "infusao": null,
    "semRotulo": {
      "diluente": "SF 0,9%",
      "volume": "250 mL"
    },
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "Máximo de 1 mg/min. Recomendado administrar em 2 horas.",
    "_concentracaoMaxima": "0,36 mg/mL",
    "_observacao": "Deve ser sempre diluído e administrado por infusão intravenosa lenta.",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "pancurônio",
    "apelidos": [],
    "nome": "Pancurônio 2 mg/mL - ampola 2 mL",
    "vias": [
      "EV"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": null,
    "semRotulo": null,
    "naoDilui": false,
    "completo": false,
    "_tempoInfusao": "EV direto: 1 a 2 minutos",
    "_concentracaoMaxima": "",
    "_observacao": "EV Direto – sem diluição. Não existem dados para recomendar infusão contínua.",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "pantoprazol",
    "apelidos": [],
    "nome": "Pantoprazol sódico 40 mg",
    "vias": [
      "EV"
    ],
    "viasOutras": [],
    "reconstituicao": "SF 0,9% - 10 ml",
    "evDireto": null,
    "infusao": null,
    "semRotulo": {
      "diluente": "SF 0,9%",
      "volume": "100 mL"
    },
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "EV direto (bolus): mínimo de 2 minutos Infusão rápida: 15 minutos",
    "_concentracaoMaxima": "",
    "_observacao": "",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "papaverina",
    "apelidos": [],
    "nome": "Papaverina, cloridrato 50 mg/mL - ampola 2 mL",
    "vias": [
      "EV",
      "IM"
    ],
    "viasOutras": [
      "intra-arterial"
    ],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": null,
    "semRotulo": null,
    "naoDilui": false,
    "completo": false,
    "_tempoInfusao": "EV ou IM lento por 1 a 2 minutos.",
    "_concentracaoMaxima": "",
    "_observacao": "",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "petidina",
    "apelidos": [],
    "nome": "Petidina, cloridrato 50 mg/mL - ampola 2 mL",
    "vias": [
      "EV",
      "IM",
      "SC"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": null,
    "semRotulo": {
      "diluente": "SF 0,9%",
      "volume": "10 mL"
    },
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "EV direto: lentamente durante 1 a 2 minutos.",
    "_concentracaoMaxima": "10mg/mL",
    "_observacao": "",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "pentoxifilina",
    "apelidos": [],
    "nome": "Pentoxifilina 20 mg/mL - ampola 5 mL",
    "vias": [
      "EV"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": null,
    "semRotulo": {
      "diluente": "SF 0,9%",
      "volume": "500 mL"
    },
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "120 a 180 minutos.",
    "_concentracaoMaxima": "",
    "_observacao": "",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "prometazina",
    "apelidos": [],
    "nome": "Prometazina 25 mg/mL - ampola 2 mL",
    "vias": [
      "IM"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": null,
    "semRotulo": null,
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "",
    "_concentracaoMaxima": "25mg/mL",
    "_observacao": "Vesicante.",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "propofol",
    "apelidos": [],
    "nome": "Propofol 10 mg/ mL 1% emulsão – frasco-ampola 10 mL",
    "vias": [
      "EV"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": null,
    "semRotulo": null,
    "naoDilui": false,
    "completo": false,
    "_tempoInfusao": "",
    "_concentracaoMaxima": "2mg de propofol/mL",
    "_observacao": "Estabilidade de 12 horas puro (sem diluição). Estabilidade de 6 horas após diluição. Agitar antes do uso.",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "propofol",
    "apelidos": [],
    "nome": "Propofol 10 mg/ mL 1% emulsão - frasco-ampola 20 mL",
    "vias": [
      "EV"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": null,
    "semRotulo": null,
    "naoDilui": false,
    "completo": false,
    "_tempoInfusao": "",
    "_concentracaoMaxima": "2mg de propofol/mL",
    "_observacao": "Estabilidade de 12 horas puro (sem diluição). Estabilidade de 6 horas após diluição. Agitar antes do uso.",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "protamina",
    "apelidos": [],
    "nome": "Protamina, cloridrato 10 mg/mL (1000 UI/mL) - ampola 5 mL",
    "vias": [
      "EV"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": null,
    "semRotulo": null,
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "EV lento: Entre 1 a 3 minutos. Máximo: 50 mg em 10 minutos.",
    "_concentracaoMaxima": "",
    "_observacao": "Cada 1 mL de Protamina neutraliza 1.000 UI de heparina",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "remifentanila",
    "apelidos": [],
    "nome": "Remifentanila, cloridrato 2 mg pó liófilo - frasco-ampola",
    "vias": [
      "EV"
    ],
    "viasOutras": [],
    "reconstituicao": "AD - 2 mL.",
    "evDireto": null,
    "infusao": null,
    "semRotulo": {
      "diluente": "SF 0,9%",
      "volume": "100 mL"
    },
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "0,25-0,4mcg/ kg/min",
    "_concentracaoMaxima": "250 mcg/mL.",
    "_observacao": "",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "rocurônio",
    "apelidos": [],
    "nome": "Rocurônio, brometo 10 mg/mL – frasco-ampola 5 mL",
    "vias": [
      "EV"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": null,
    "semRotulo": {
      "diluente": "SF 0,9%",
      "volume": "1000 mL"
    },
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "",
    "_concentracaoMaxima": "2 mg/mL",
    "_observacao": "ANTÍDOTO: Sugamadex",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "ropivacaína",
    "apelidos": [],
    "nome": "Ropivacaína, cloridrato 10 mg/mL (1%) – frasco-ampola 20 mL",
    "vias": [],
    "viasOutras": [
      "epidural"
    ],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": null,
    "semRotulo": null,
    "naoDilui": false,
    "completo": false,
    "_tempoInfusao": "A depender da via de administração",
    "_concentracaoMaxima": "",
    "_observacao": "Não usar por via Intravenosa (toxicidade do SNC).",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "ropivacaína",
    "apelidos": [],
    "nome": "Ropivacaína, cloridrato 2 mg/mL (0,2%) - frasco-ampola 20 mL",
    "vias": [],
    "viasOutras": [
      "epidural",
      "infiltração/bloqueio"
    ],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": null,
    "semRotulo": null,
    "naoDilui": false,
    "completo": false,
    "_tempoInfusao": "A depender da via de administração",
    "_concentracaoMaxima": "",
    "_observacao": "Não usar por via Intravenosa (toxicidade do SNC).",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "ropivacaína",
    "apelidos": [],
    "nome": "Ropivacaína, cloridrato 7,5 mg/mL (0,75%) - frasco-ampola",
    "vias": [],
    "viasOutras": [
      "epidural",
      "infiltração/bloqueio",
      "intra-articular"
    ],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": null,
    "semRotulo": null,
    "naoDilui": false,
    "completo": false,
    "_tempoInfusao": "A depender da via de administração",
    "_concentracaoMaxima": "",
    "_observacao": "Não usar por via Intravenosa (toxicidade do SNC).",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "sufentanila",
    "apelidos": [],
    "nome": "Sufentanila, citrato 5 mcg/mL - ampola 2 mL",
    "vias": [],
    "viasOutras": [
      "epidural"
    ],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": null,
    "semRotulo": null,
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "",
    "_concentracaoMaxima": "",
    "_observacao": "",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "sufentanila",
    "apelidos": [],
    "nome": "Sufentanila 50 mcg/mL - ampola 1 mL",
    "vias": [
      "EV"
    ],
    "viasOutras": [
      "epidural"
    ],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": null,
    "semRotulo": null,
    "naoDilui": false,
    "completo": false,
    "_tempoInfusao": "EV: Injeção em bolus por pelo menos 2 minutos ou infusão contínua",
    "_concentracaoMaxima": "",
    "_observacao": "Proteger da luz.",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "sugamadex",
    "apelidos": [],
    "nome": "Sugamadex sódico 100 mg/mL – frasco-ampola 2 mL",
    "vias": [
      "EV"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": null,
    "semRotulo": null,
    "naoDilui": true,
    "completo": true,
    "_tempoInfusao": "Bolus rápido.",
    "_concentracaoMaxima": "",
    "_observacao": "Proteger da luz.",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "suxametônio",
    "apelidos": [],
    "nome": "Suxametônio (Succinilcolina) 500 mg pó liofilizado",
    "vias": [
      "EV",
      "IM"
    ],
    "viasOutras": [],
    "reconstituicao": "SF 0,9% - 10 mL",
    "evDireto": null,
    "infusao": null,
    "semRotulo": {
      "diluente": "SF 0,9%",
      "volume": "1000 mL"
    },
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "EV - infusão contínua de 0,5 – 10mL/min.",
    "_concentracaoMaxima": "EV - 1 a 2mg/mL. IM - administrar no máximo 150 mg.",
    "_observacao": "",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "tenoxicam",
    "apelidos": [],
    "nome": "Tenoxicam 40mg pó liofilizado – frasco-ampola",
    "vias": [
      "EV",
      "IM"
    ],
    "viasOutras": [],
    "reconstituicao": "AD – 2mL",
    "evDireto": null,
    "infusao": null,
    "semRotulo": null,
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "EV direto lento",
    "_concentracaoMaxima": "",
    "_observacao": "Não é recomendado a administração por infusão. Administrar lentamente.",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "terbutalina",
    "apelidos": [],
    "nome": "Terbutalina, sulfato 0,5 mg/mL - ampola 1 mL",
    "vias": [
      "EV",
      "SC"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": null,
    "semRotulo": {
      "diluente": "SG 5%",
      "volume": "100 mL"
    },
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "20-30 gotas/min",
    "_concentracaoMaxima": "5mcg/mL",
    "_observacao": "",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "terlipressina",
    "apelidos": [],
    "nome": "Terlipressina, acetato 1 mg pó liófilo frasco-ampola",
    "vias": [
      "EV"
    ],
    "viasOutras": [],
    "reconstituicao": "Apresentação com Diluente próprio (5mL) ou reconstituir com SF 0,9% - 5mL.",
    "evDireto": null,
    "infusao": null,
    "semRotulo": {
      "diluente": "SF 0,9%",
      "volume": "10 mL"
    },
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "Deve ser administrado em bolus lento.",
    "_concentracaoMaxima": "",
    "_observacao": "Vide Protocolo Institucional - Necessário preenchimento de Formulário de Medicamentos - Uso Restrito - “Solicitação de Terlipressina”.",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "tiamina",
    "apelidos": [],
    "nome": "Tiamina 100mg/mL – ampola 1mL",
    "vias": [
      "EV",
      "IM"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": null,
    "semRotulo": {
      "diluente": "SF 0,9%",
      "volume": "20 mL"
    },
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "IM: não menos que 10 minutos EV infusão: 30 minutos",
    "_concentracaoMaxima": "1mg/mL",
    "_observacao": "Preferencialmente administrar IM por ter menor incidência de reações adversas.",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "tiopental",
    "apelidos": [],
    "nome": "Tiopental 1g Anestésico Geral Barbitúrico",
    "vias": [
      "EV"
    ],
    "viasOutras": [],
    "reconstituicao": "AD ou SF 0,9%",
    "evDireto": null,
    "infusao": null,
    "semRotulo": {
      "diluente": "SF 0,9%",
      "volume": "40 mL"
    },
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "",
    "_concentracaoMaxima": "25 mg/mL",
    "_observacao": "",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "tirofibana",
    "apelidos": [],
    "nome": "Tirofibana, cloridrato 0,25 mg/mL – frasco-ampola 50 mL",
    "vias": [
      "EV"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": null,
    "semRotulo": {
      "diluente": "SF 0,9%",
      "volume": "200 mL"
    },
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "Angina instável ou Infarto do Miocárdio sem elevação do segmento ST: Dose inicial: 0,4 mcg/kg/min por 30 min. Dose manutenção: 0,1 mcg/kg/min. Angioplastia/Aterectomia: Dose inicial: 10 mcg/kg, bolus, 3 minutos. Dose manutenção: 0,15 mcg/kg/min.",
    "_concentracaoMaxima": "50mcg/mL",
    "_observacao": "Necessário ajuste da dose pelo Clearance de creatinina <60ml/min.",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "tramadol",
    "apelidos": [],
    "nome": "Tramadol, cloridrato 50 mg/mL - ampola 1 mL",
    "vias": [
      "EV",
      "IM",
      "SC"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": null,
    "semRotulo": {
      "diluente": "SF 0,9%",
      "volume": "100 mL"
    },
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "EV direto: 1mL/min Infusão: lento de 30 a 60 min",
    "_concentracaoMaxima": "",
    "_observacao": "",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "tramadol",
    "apelidos": [],
    "nome": "Tramadol, cloridrato 50 mg/ mL - ampola 2 mL",
    "vias": [
      "EV",
      "IM",
      "SC"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": null,
    "semRotulo": {
      "diluente": "SF 0,9%",
      "volume": "100 mL"
    },
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "EV direto: 1mL/min Infusão: lento de 30 a 60 min",
    "_concentracaoMaxima": "",
    "_observacao": "",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "vasopressina",
    "apelidos": [],
    "nome": "Vasopressina 20 U/mL - ampola 1 mL",
    "vias": [
      "EV",
      "IM",
      "SC"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": {
      "diluente": "SF 0,9%",
      "volume": "9 mL"
    },
    "infusao": {
      "diluente": "SF 0,9%",
      "volume": "99 mL"
    },
    "semRotulo": null,
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "0,01-0,04U/min",
    "_concentracaoMaxima": "1 U/mL",
    "_observacao": "Seguir recomendações institucionais para Medicamentos de Uso Restrito. Administrar preferencialmente em veia central ou veia periférica profunda.",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "verapamil",
    "apelidos": [],
    "nome": "Verapamil, cloridrato 2,5 mg/mL - ampola 2 mL",
    "vias": [
      "EV"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": null,
    "semRotulo": {
      "diluente": "SG 5%",
      "volume": "250 mL"
    },
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "Inicial - EV direto por 2 a 3 min Repetição: 30 minutos",
    "_concentracaoMaxima": "2,5mg/mL",
    "_observacao": "Incompatível com soluções alcalinas (ex. solução de bicarbonato.",
    "fonte": "EBSERH/HC-UFTM CFT.001 v2 (06/08/2024)"
  },
  {
    "principio": "aciclovir",
    "apelidos": [],
    "nome": "Aciclovir 250 mg - frasco-ampola",
    "vias": [
      "EV"
    ],
    "viasOutras": [],
    "reconstituicao": "água para injeção ou SF 0,9% 10 mL",
    "evDireto": null,
    "infusao": {
      "diluente": "SF 0,9%",
      "volume": "100 mL"
    },
    "semRotulo": null,
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "",
    "_concentracaoMaxima": "",
    "_observacao": "",
    "fonte": "HU-UNIVASF/EBSERH — Guia de diluição e estabilidade (2018)"
  },
  {
    "principio": "amoxicilina",
    "apelidos": [
      "amoxicilina + clavulanato",
      "clavulanato"
    ],
    "nome": "Amoxicilina 1 g + Clavulanato 200 mg - frasco-ampola",
    "vias": [
      "EV"
    ],
    "viasOutras": [],
    "reconstituicao": "diluente próprio 10 mL",
    "evDireto": null,
    "infusao": {
      "diluente": "SF 0,9%",
      "volume": "50 mL"
    },
    "semRotulo": null,
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "",
    "_concentracaoMaxima": "",
    "_observacao": "",
    "fonte": "HU-UNIVASF/EBSERH — Guia de diluição e estabilidade (2018)"
  },
  {
    "principio": "ampicilina",
    "apelidos": [],
    "nome": "Ampicilina 1 g - frasco-ampola",
    "vias": [
      "EV",
      "IM"
    ],
    "viasOutras": [],
    "reconstituicao": "água para injeção 5 mL",
    "evDireto": null,
    "infusao": {
      "diluente": "SF 0,9%",
      "volume": "100 mL"
    },
    "semRotulo": null,
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "",
    "_concentracaoMaxima": "",
    "_observacao": "",
    "fonte": "SMS Joinville/SC — Manual de Diluição de Injetáveis PA/UPA (2018)"
  },
  {
    "principio": "azitromicina",
    "apelidos": [],
    "nome": "Azitromicina 500 mg - frasco-ampola",
    "vias": [
      "EV"
    ],
    "viasOutras": [],
    "reconstituicao": "água para injeção 4,8 mL",
    "evDireto": null,
    "infusao": {
      "diluente": "SF 0,9%",
      "volume": "500 mL"
    },
    "semRotulo": null,
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "",
    "_concentracaoMaxima": "",
    "_observacao": "",
    "fonte": "HU-UNIVASF/EBSERH — Guia de diluição e estabilidade (2018)"
  },
  {
    "principio": "benzilpenicilina benzatina",
    "apelidos": [
      "benzipenicilina benzatina",
      "penicilina benzatina"
    ],
    "nome": "Benzilpenicilina benzatina 600.000 / 1.200.000 UI",
    "vias": [
      "IM"
    ],
    "viasOutras": [],
    "reconstituicao": "água para injeção 4 mL",
    "evDireto": null,
    "infusao": null,
    "semRotulo": null,
    "naoDilui": true,
    "completo": true,
    "_tempoInfusao": "",
    "_concentracaoMaxima": "",
    "_observacao": "",
    "fonte": "SMS Joinville/SC — Manual de Diluição de Injetáveis PA/UPA (2018)"
  },
  {
    "principio": "benzilpenicilina potássica",
    "apelidos": [
      "benzipenicilina potássica",
      "penicilina cristalina"
    ],
    "nome": "Benzilpenicilina potássica 5.000.000 UI - frasco-ampola",
    "vias": [
      "EV",
      "IM"
    ],
    "viasOutras": [],
    "reconstituicao": "água para injeção ou SF 0,9% 8 mL",
    "evDireto": null,
    "infusao": {
      "diluente": "SF 0,9%",
      "volume": "100 mL"
    },
    "semRotulo": null,
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "",
    "_concentracaoMaxima": "",
    "_observacao": "",
    "fonte": "SMS Joinville/SC — Manual de Diluição de Injetáveis PA/UPA (2018)"
  },
  {
    "principio": "benzilpenicilina procaína",
    "apelidos": [
      "penicilina procaína"
    ],
    "nome": "Benzilpenicilina procaína 300.000 UI + potássica 100.000 UI",
    "vias": [
      "IM"
    ],
    "viasOutras": [],
    "reconstituicao": "água para injeção 4 mL",
    "evDireto": null,
    "infusao": null,
    "semRotulo": null,
    "naoDilui": true,
    "completo": true,
    "_tempoInfusao": "",
    "_concentracaoMaxima": "",
    "_observacao": "",
    "fonte": "SMS Joinville/SC — Manual de Diluição de Injetáveis PA/UPA (2018)"
  },
  {
    "principio": "cefalotina",
    "apelidos": [],
    "nome": "Cefalotina sódica 1 g - frasco-ampola",
    "vias": [
      "EV",
      "IM"
    ],
    "viasOutras": [],
    "reconstituicao": "água para injeção 10 mL (EV) ou 5 mL (IM)",
    "evDireto": null,
    "infusao": {
      "diluente": "SF 0,9%",
      "volume": "100 mL"
    },
    "semRotulo": null,
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "",
    "_concentracaoMaxima": "",
    "_observacao": "",
    "fonte": "HU-UNIVASF/EBSERH — Guia de diluição e estabilidade (2018)"
  },
  {
    "principio": "cefepima",
    "apelidos": [],
    "nome": "Cefepima 1 g - frasco-ampola",
    "vias": [
      "EV",
      "IM"
    ],
    "viasOutras": [],
    "reconstituicao": "água para injeção 10 mL (EV) ou 3 mL (IM)",
    "evDireto": null,
    "infusao": {
      "diluente": "SF 0,9%",
      "volume": "100 mL"
    },
    "semRotulo": null,
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "",
    "_concentracaoMaxima": "",
    "_observacao": "",
    "fonte": "HU-UNIVASF/EBSERH — Guia de diluição e estabilidade (2018)"
  },
  {
    "principio": "ceftriaxona",
    "apelidos": [],
    "nome": "Ceftriaxona sódica 1 g - frasco-ampola",
    "vias": [
      "EV"
    ],
    "viasOutras": [],
    "reconstituicao": "água para injeção 10 mL",
    "evDireto": null,
    "infusao": {
      "diluente": "SF 0,9%",
      "volume": "100 mL"
    },
    "semRotulo": null,
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "",
    "_concentracaoMaxima": "",
    "_observacao": "",
    "fonte": "HU-UNIVASF/EBSERH — Guia de diluição e estabilidade (2018)"
  },
  {
    "principio": "ciprofloxacino",
    "apelidos": [],
    "nome": "Ciprofloxacino 2 mg/mL - bolsa 100 mL",
    "vias": [
      "EV"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": null,
    "semRotulo": null,
    "naoDilui": true,
    "completo": true,
    "_tempoInfusao": "",
    "_concentracaoMaxima": "",
    "_observacao": "",
    "fonte": "HU-UNIVASF/EBSERH — Guia de diluição e estabilidade (2018)"
  },
  {
    "principio": "clindamicina",
    "apelidos": [],
    "nome": "Clindamicina 600 mg/4 mL - ampola",
    "vias": [
      "EV",
      "IM"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": {
      "diluente": "SF 0,9%",
      "volume": "50 mL"
    },
    "semRotulo": null,
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "",
    "_concentracaoMaxima": "",
    "_observacao": "",
    "fonte": "HU-UNIVASF/EBSERH — Guia de diluição e estabilidade (2018)"
  },
  {
    "principio": "gentamicina",
    "apelidos": [],
    "nome": "Gentamicina 40 / 80 mg - ampola",
    "vias": [
      "EV",
      "IM"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": {
      "diluente": "SF 0,9%",
      "volume": "100 mL"
    },
    "semRotulo": null,
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "",
    "_concentracaoMaxima": "",
    "_observacao": "",
    "fonte": "SMS Joinville/SC — Manual de Diluição de Injetáveis PA/UPA (2018)"
  },
  {
    "principio": "metronidazol",
    "apelidos": [],
    "nome": "Metronidazol 5 mg/mL - bolsa 100 mL",
    "vias": [
      "EV"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": null,
    "semRotulo": null,
    "naoDilui": true,
    "completo": true,
    "_tempoInfusao": "",
    "_concentracaoMaxima": "",
    "_observacao": "",
    "fonte": "HU-UNIVASF/EBSERH — Guia de diluição e estabilidade (2018)"
  },
  {
    "principio": "oxacilina",
    "apelidos": [],
    "nome": "Oxacilina 500 mg - frasco-ampola",
    "vias": [
      "EV",
      "IM"
    ],
    "viasOutras": [],
    "reconstituicao": "água para injeção 5 mL (EV) ou 2,7 mL (IM)",
    "evDireto": null,
    "infusao": {
      "diluente": "SF 0,9%",
      "volume": "250 mL"
    },
    "semRotulo": null,
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "",
    "_concentracaoMaxima": "",
    "_observacao": "",
    "fonte": "CATS/SMS São Paulo — Diluição de Injetáveis (mar/2025), volume confirmado pelo médico"
  },
  {
    "principio": "sulfametoxazol",
    "apelidos": [
      "sulfametoxazol + trimetoprima",
      "trimetoprima"
    ],
    "nome": "Sulfametoxazol 400 mg + Trimetoprima 80 mg - ampola 5 mL",
    "vias": [
      "EV"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": {
      "diluente": "SF 0,9%",
      "volume": "125 mL"
    },
    "semRotulo": null,
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "",
    "_concentracaoMaxima": "",
    "_observacao": "",
    "fonte": "HU-UNIVASF/EBSERH — Guia de diluição e estabilidade (2018)"
  },
  {
    "principio": "meglumina",
    "apelidos": [
      "antimoniato de meglumina"
    ],
    "nome": "Meglumina antimoniato 1,5 g - ampola 5 mL",
    "vias": [
      "EV",
      "IM"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": {
      "diluente": "SF 0,9%",
      "volume": ""
    },
    "semRotulo": null,
    "naoDilui": false,
    "completo": false,
    "_tempoInfusao": "",
    "_concentracaoMaxima": "",
    "_observacao": "",
    "fonte": "SEM FONTE — conferir manualmente"
  },
  {
    "principio": "bicarbonato de sódio",
    "apelidos": [
      "bicarbonato"
    ],
    "nome": "Bicarbonato de sódio 8,4% - ampola 10 mL",
    "vias": [
      "EV"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": null,
    "semRotulo": null,
    "naoDilui": true,
    "completo": true,
    "_tempoInfusao": "",
    "_concentracaoMaxima": "",
    "_observacao": "",
    "fonte": "SMS Joinville/SC — Manual de Diluição de Injetáveis PA/UPA (2018)"
  },
  {
    "principio": "cloreto de potássio",
    "apelidos": [],
    "nome": "Cloreto de potássio 10% - ampola 10 mL",
    "vias": [
      "EV"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": {
      "diluente": "SF 0,9%",
      "volume": "1000 mL"
    },
    "semRotulo": null,
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "",
    "_concentracaoMaxima": "",
    "_observacao": "",
    "fonte": "SMS Joinville/SC — Manual de Diluição de Injetáveis PA/UPA (2018)"
  },
  {
    "principio": "cloreto de sódio 10%",
    "apelidos": [],
    "nome": "Cloreto de sódio 10% - ampola 10 mL",
    "vias": [
      "EV"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": {
      "diluente": "SF 0,9%",
      "volume": ""
    },
    "semRotulo": null,
    "naoDilui": false,
    "completo": false,
    "_tempoInfusao": "",
    "_concentracaoMaxima": "",
    "_observacao": "",
    "fonte": "SMS Joinville/SC — Manual de Diluição de Injetáveis PA/UPA (2018)"
  },
  {
    "principio": "sulfato de magnésio",
    "apelidos": [],
    "nome": "Sulfato de magnésio 50% - ampola 10 mL",
    "vias": [
      "EV",
      "IM"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": {
      "diluente": "SF 0,9%",
      "volume": "500 mL"
    },
    "semRotulo": null,
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "",
    "_concentracaoMaxima": "",
    "_observacao": "",
    "fonte": "HU-UNIVASF/EBSERH — Guia de diluição e estabilidade (2018)"
  },
  {
    "principio": "gluconato de cálcio",
    "apelidos": [
      "gliconato de cálcio"
    ],
    "nome": "Gluconato de cálcio 10% - ampola 10 mL",
    "vias": [
      "EV"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": {
      "diluente": "SF 0,9%",
      "volume": "100 mL"
    },
    "semRotulo": null,
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "",
    "_concentracaoMaxima": "",
    "_observacao": "",
    "fonte": "HU-UNIVASF/EBSERH — Guia de diluição e estabilidade (2018)"
  },
  {
    "principio": "glicose 50%",
    "apelidos": [],
    "nome": "Glicose 50% - ampola 10 mL",
    "vias": [
      "EV"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": {
      "diluente": "água para injeção",
      "volume": "10 mL"
    },
    "infusao": null,
    "semRotulo": null,
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "",
    "_concentracaoMaxima": "",
    "_observacao": "",
    "fonte": "SMS Joinville/SC — Manual de Diluição de Injetáveis PA/UPA (2018)"
  },
  {
    "principio": "manitol",
    "apelidos": [],
    "nome": "Manitol 20% - bolsa 250 mL",
    "vias": [
      "EV"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": null,
    "semRotulo": null,
    "naoDilui": true,
    "completo": true,
    "_tempoInfusao": "",
    "_concentracaoMaxima": "",
    "_observacao": "",
    "fonte": "CATS/SMS São Paulo — Diluição de Injetáveis (mar/2025)"
  },
  {
    "principio": "bromoprida",
    "apelidos": [],
    "nome": "Bromoprida 5 mg/mL - ampola 2 mL",
    "vias": [
      "EV",
      "IM"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": {
      "diluente": "SF 0,9%",
      "volume": "18 mL"
    },
    "infusao": null,
    "semRotulo": null,
    "naoDilui": false,
    "completo": true,
    "_tempoInfusao": "",
    "_concentracaoMaxima": "",
    "_observacao": "",
    "fonte": "HU-UNIVASF/EBSERH — Guia de diluição e estabilidade (2018)"
  },
  {
    "principio": "ceftriaxona intramuscular",
    "apelidos": [
      "ceftriaxona im"
    ],
    "nome": "Ceftriaxona 500 mg IM - frasco-ampola",
    "vias": [
      "IM"
    ],
    "viasOutras": [],
    "reconstituicao": "diluente próprio que acompanha o frasco",
    "evDireto": null,
    "infusao": null,
    "semRotulo": null,
    "naoDilui": true,
    "completo": true,
    "_tempoInfusao": "",
    "_concentracaoMaxima": "",
    "_observacao": "",
    "fonte": "Apresentação padronizada da própria unidade (farmacia.js)"
  },
  {
    "principio": "água para injeção",
    "apelidos": [
      "água bidestilada",
      "água destilada"
    ],
    "nome": "Água para injeção - ampola 10 mL",
    "vias": [
      "EV"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": null,
    "semRotulo": null,
    "naoDilui": true,
    "completo": true,
    "_tempoInfusao": "",
    "_concentracaoMaxima": "",
    "_observacao": "",
    "fonte": "Apresentação padronizada da própria unidade (farmacia.js)"
  },
  {
    "principio": "ringer",
    "apelidos": [
      "ringer com lactato",
      "ringer lactato"
    ],
    "nome": "Ringer com lactato - frasco 500 mL",
    "vias": [
      "EV"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": null,
    "semRotulo": null,
    "naoDilui": true,
    "completo": true,
    "_tempoInfusao": "",
    "_concentracaoMaxima": "",
    "_observacao": "",
    "fonte": "Apresentação padronizada da própria unidade (farmacia.js)"
  },
  {
    "principio": "glicose 5%",
    "apelidos": [],
    "nome": "Glicose 5% - frasco 500 mL",
    "vias": [
      "EV"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": null,
    "semRotulo": null,
    "naoDilui": true,
    "completo": true,
    "_tempoInfusao": "",
    "_concentracaoMaxima": "",
    "_observacao": "",
    "fonte": "Apresentação padronizada da própria unidade (farmacia.js)"
  },
  {
    "principio": "cloreto de sódio 0,9%",
    "apelidos": [
      "soro fisiológico"
    ],
    "nome": "Cloreto de sódio 0,9% - ampola 10 mL",
    "vias": [
      "EV"
    ],
    "viasOutras": [],
    "reconstituicao": "",
    "evDireto": null,
    "infusao": null,
    "semRotulo": null,
    "naoDilui": true,
    "completo": true,
    "_tempoInfusao": "",
    "_concentracaoMaxima": "",
    "_observacao": "",
    "fonte": "Apresentação padronizada da própria unidade (farmacia.js)"
  }
];

module.exports = { diluicoesBarreiro };
