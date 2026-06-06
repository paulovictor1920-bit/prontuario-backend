// ============================================================================
//  TABELA DE DILUIÇÃO / RECONSTITUIÇÃO DE MEDICAMENTOS INJETÁVEIS
//  EXCLUSIVO DA UPA BARREIRO (PBH).
//
//  ORIGEM: Tabela CFT.001 v2 - EBSERH / Hospital de Clínicas da UFTM
//          (Emissão 06/08/2024). É uma REFERÊNCIA TÉCNICA.
//
//  IMPORTANTE (segurança): estes dados são uma referência de consulta.
//  As apresentações podem diferir do estoque real da UPA. O sistema NUNCA
//  inventa diluição: usa apenas o que está nesta tabela e, quando um
//  injetável não consta aqui, avisa para o médico consultar manualmente.
// ============================================================================

const diluicoesBarreiro = [
  {
    "principio": "acetilcisteína",
    "nome": "Acetilcisteína 100 mg/ mL - ampola 3 mL Mucolítico, antídoto",
    "via": "EV",
    "reconstituicao": "",
    "diluicao": "SF 0,9%, SG 5% - 100 mL",
    "concentracaoMaxima": "",
    "tempoInfusao": "Acima de 15 min ou de 4 a 16 horas",
    "observacao": "Para via IN, diluir em igual volume de SF 0,9%. Em casos de intoxicação por paracetamol, as doses e tempo de infusão deverão ser consultadas nas bulas dos fabricantes. A administração concomitante de nitroglicerina e acetilcisteína, apenas em pacientes monitorados."
  },
  {
    "principio": "adenosina",
    "nome": "Adenosina 3 mg/mL - ampola 2 mL Antiarrítmico",
    "via": "EV",
    "reconstituicao": "",
    "diluicao": "Não é necessário diluir. Quando necessário compatível com SF 0,9%; SG 5% ou Ringer Lactato.",
    "concentracaoMaxima": "",
    "tempoInfusao": "Bolus rápido",
    "observacao": "Não refrigerar devido a cristalização."
  },
  {
    "principio": "ácido",
    "nome": "Ácido Ascórbico 100 mg/mL (vitamina C) - ampola 5 mL Vitamina",
    "via": "EV",
    "reconstituicao": "",
    "diluicao": "SF0,9% ou SG5% - 100mL",
    "concentracaoMaxima": "",
    "tempoInfusao": "Taxa de infusão: 33mg/min",
    "observacao": "Evite injeção endovenosa rápida, pois pode causar desmaios e tonturas."
  },
  {
    "principio": "ácido",
    "nome": "Ácido Tranexâmico 50 mg/mL - ampola 5 mL Hemostático",
    "via": "EV",
    "reconstituicao": "",
    "diluicao": "SF 0,9% ou SG 5% - 25mL a 250 mL.",
    "concentracaoMaxima": "50 mg/mL",
    "tempoInfusao": "EV direto sem diluição: 1mL/min Infusão: 30 minutos",
    "observacao": "Necessita de ajuste para função renal."
  },
  {
    "principio": "albumina",
    "nome": "Albumina Humana 200 mg/mL (20%) - frasco 50 mL Hemoderivado, Coloide Natural",
    "via": "EV",
    "reconstituicao": "",
    "diluicao": "Não é necessário diluir. Quando necessário compatível com SF 0,9%; SG 5%.",
    "concentracaoMaxima": "",
    "tempoInfusao": "Não exceder a taxa 1 a 2 mL/min.",
    "observacao": "Deve ser administrada em até 4 horas após abertura do frasco."
  },
  {
    "principio": "alfentanila",
    "nome": "Alfentanila, cloridrato 0,544 mg/mL (equivale a 0,5 mg/mL de alfentanila) - ampola 5 mL Anestésico Opioide",
    "via": "EV",
    "reconstituicao": "",
    "diluicao": "SF 0,9%; SG 5% ou Ringer Lactato.",
    "concentracaoMaxima": "80mcg/mL",
    "tempoInfusao": "Em bolus lento: 3 a 5min ou infusão contínua lenta.",
    "observacao": "Usar com cautela em pacientes com disfunção renal e hepática."
  },
  {
    "principio": "alprostadil",
    "nome": "Alprostadil 20 mcg – frasco-ampola 1 mL pó liófilo Prostaglandina",
    "via": "EV",
    "reconstituicao": "SF 0,9% 2mL",
    "diluicao": "SF 0,9% - 50 a 250 mL",
    "concentracaoMaxima": "",
    "tempoInfusao": "Administrar EV por 2 horas",
    "observacao": ""
  },
  {
    "principio": "alprostadil",
    "nome": "Alprostadil 500 mcg/mL - frasco- ampola 1 mL Prostaglandina",
    "via": "EV",
    "reconstituicao": "",
    "diluicao": "Diluir 1 mL de alprostadil em 99 mL SF 0,9% ou SG5%, mantendo uma concentração de 5 mg/mL",
    "concentracaoMaxima": "Em neonatos: Inicial: 0,05 a 0,1mcg/kg/min Manutenção: 0,01 a 0,4mcg/kg/miN Concentração máxima: 5 mcg/mL",
    "tempoInfusao": "Velocidade de infusão: 0,03mL/ Kg/h por até 48 horas.",
    "observacao": "Uso por 2 a 3 dias antes da cirurgia. No entanto, o tratamento pode ser prolongado (até 3 semanas) em casos excepcionais."
  },
  {
    "principio": "alteplase",
    "nome": "Alteplase 20 mg pó liófilo – frasco- ampola Trombolítico",
    "via": "EV",
    "reconstituicao": "AD 20 mL (acompanha o medicamento)",
    "diluicao": "SF 0,9% até uma concentração mínina de 0,2mg/mL",
    "concentracaoMaxima": "1 mg/mL",
    "tempoInfusao": "EV Direta (bolus): 1-2 minutos. Infusão de 0,75mg/kg em 30 minutos. Infusão de 0,5mg/kg em 60 minutos.",
    "observacao": "Após preparo manter a solução reconstituída sob refrigeração (2 - 8°C) por até 24 horas, ou por até 8 horas em temperatura ambiente abaixo de 30°C. Do ponto de vista microbiológico, o produto deve ser utilizado imediatamente após a reconstituição."
  },
  {
    "principio": "alteplase",
    "nome": "Alteplase 50 mg pó liófilo – frasco- ampola Trombolítico",
    "via": "EV",
    "reconstituicao": "AD 50 mL (acompanha o medicamento)",
    "diluicao": "SF 0,9% até uma concentração mínina de 0,2mg/mL",
    "concentracaoMaxima": "1 mg/mL",
    "tempoInfusao": "EV Direta (bolus): 1-2 minutos . Infusão de 0,75mg/kg em 30 minutos. Infusão de 0,5mg/kg em 60 minutos.",
    "observacao": "Após preparo manter a solução reconstituída sob refrigeração (2 - 8°C) por até 24 horas, ou por até 8 horas em temperatura ambiente abaixo de 30°C. Do ponto de vista microbiológico, o produto deve ser utilizado imediatamente após a reconstituição."
  },
  {
    "principio": "aminofilina",
    "nome": "Aminofilina 24 mg/mL - ampola 10 mL Broncodilatador",
    "via": "EV",
    "reconstituicao": "",
    "diluicao": "SF 0,9% ou SG 5%,",
    "concentracaoMaxima": "",
    "tempoInfusao": "Não exceder 25 mg/min",
    "observacao": ""
  },
  {
    "principio": "amiodarona",
    "nome": "Amiodarona, cloridrato 50 mg/mL - ampola 3 mL Antiarrítmico",
    "via": "EV",
    "reconstituicao": "",
    "diluicao": "Diluir exclusivamente em SG 5%.",
    "concentracaoMaxima": "0,6mg/mL",
    "tempoInfusao": "Dose de 5mg/kg EV direto acima 3 minutos. Dose de ataque usal de 5 mg/kg em 250 mL de SG 5%, administrados por um período de 20 minutos a 2 horas. Dose de manutenção 10 a 20mg/Kg/dia em 250mL de SG5%.",
    "observacao": ""
  },
  {
    "principio": "atropina",
    "nome": "Atropina, sulfato 0,25 mg/mL - ampola 1 mL Anticolinérgico, Antídoto, Antiespasmódico",
    "via": "SC IM EV",
    "reconstituicao": "",
    "diluicao": "Não recomendado diluição, caso necessário SF 0,9% ou SG5%.",
    "concentracaoMaxima": "",
    "tempoInfusao": "EV rápido acima de 1 minuto.",
    "observacao": "A administração lenta pode resultar em bradicardia paradoxal."
  },
  {
    "principio": "betametasona",
    "nome": "Betametasona, fosfato dissódico 4 mg/mL - ampola 1 mL Anti-inflamatório Hormonal, Corticoide",
    "via": "EV IM Intra-articular",
    "reconstituicao": "",
    "diluicao": "SF 0,9% ou SG 10%",
    "concentracaoMaxima": "",
    "tempoInfusao": "",
    "observacao": ""
  },
  {
    "principio": "biperideno",
    "nome": "Biperideno, lactato 5 mg/mL - aapola 1 mL Antiparkinsoniano",
    "via": "IM EV",
    "reconstituicao": "",
    "diluicao": "",
    "concentracaoMaxima": "",
    "tempoInfusao": "",
    "observacao": ""
  },
  {
    "principio": "bupivacaína",
    "nome": "Bupivacaína, cloridrato + glicose - 5 mg/mL (0,5%) + 80 mg/mL (8%) - ampola 4 mL embalagem estéril Anestésico Local",
    "via": "Intratecal (raquianestesia hiperbárica)",
    "reconstituicao": "",
    "diluicao": "",
    "concentracaoMaxima": "",
    "tempoInfusao": "",
    "observacao": ""
  },
  {
    "principio": "bupivacaína",
    "nome": "Bupivacaína, cloridrato + hemitartarato de epinefrina; 5 mg/mL (0,5%) + 9,1 mcg/mL (1:200.000) - frasco-ampola 20 mL embalagem estéril Anestésico Local",
    "via": "Infiltração local e Perineural, Bloqueio nervoso Anestesia caudal e Epidural.",
    "reconstituicao": "",
    "diluicao": "",
    "concentracaoMaxima": "",
    "tempoInfusao": "",
    "observacao": "Não está indicado para raquianestesia."
  },
  {
    "principio": "bupivacaína",
    "nome": "Bupivacaína, cloridrato 5 mg/mL (0,5%) - frasco-ampola 20 mL embalagem estéril Anestésico Local",
    "via": "Infiltração local, Perineural de nervos periféricos e Epidural.",
    "reconstituicao": "",
    "diluicao": "",
    "concentracaoMaxima": "",
    "tempoInfusao": "",
    "observacao": "Não está indicado para raquianestesia."
  },
  {
    "principio": "cafeína",
    "nome": "Cafeína, citrato 20 mg/mL (equivale a 10 mg/mL de Cafeína ) - ampola 1 mL Estimulante respiratório",
    "via": "EV",
    "reconstituicao": "",
    "diluicao": "SF 0,9%, SG 5%",
    "concentracaoMaxima": "",
    "tempoInfusao": "Dose de ataque (20mg/Kg): infusão endovenosa lenta durante 30 minutos. Dose de manutenção (5mg/Kg): infusão endovenosa por 10 minutos a cada 24 horas.",
    "observacao": "As doses de manutenção podem ser administradas por via oral ou via sonda nasogástrica a cada 24 horas."
  },
  {
    "principio": "cetoprofeno",
    "nome": "Cetoprofeno 100 mg pó liófilo - frasco- ampola Anti-inflamatório não esteroidal",
    "via": "EV",
    "reconstituicao": "SF 0,9% - 5mL",
    "diluicao": "SF ou SG 5% - 100 - 150 mL",
    "concentracaoMaxima": "",
    "tempoInfusao": "Infusão lenta - mínimo 20 minutos",
    "observacao": "Após reconstituição/diluição, uso imediato."
  },
  {
    "principio": "cisatracúrio",
    "nome": "Cisatracúrio, besilato 2 mg/mL - frasco-ampola 5 mL Bloqueador neuromuscular não despolarizante",
    "via": "EV",
    "reconstituicao": "",
    "diluicao": "SF ou SG 5% - 100 mL.",
    "concentracaoMaxima": "2mg/mL",
    "tempoInfusao": "EV direto: 2mg/mL Velocidade de infusão inicial de 3mcg/kg/min (0,18mg/kg/h); Velocidade de manutenção de 1 a 2mcg/kg/min (0,06 a 0,12mg/kg/h) deve ser adequada para manter o bloqueio.",
    "observacao": ""
  },
  {
    "principio": "clonidina",
    "nome": "Clonidina, cloridrato 150 mcg/mL - ampola 1 mL Agonista Alfa-2 Adrenérgico",
    "via": "IM EV Epidural Intratecal",
    "reconstituicao": "",
    "diluicao": "EV Direto: 10mL de SF EV Infusão: 10 -500mL de SF",
    "concentracaoMaxima": "",
    "tempoInfusao": "IM profunda, EV lenta (7 a 10 minutos) ou diluída, por gotejamento intravenoso.",
    "observacao": ""
  },
  {
    "principio": "clorpromazina",
    "nome": "Clorpromazina, cloridrato 5 mg/mL - ampola 5 mL Neuroléptico",
    "via": "IM",
    "reconstituicao": "",
    "diluicao": "",
    "concentracaoMaxima": "",
    "tempoInfusao": "",
    "observacao": "Recomenda-se que o produto seja administrado apenas por via intramuscular."
  },
  {
    "principio": "complexo",
    "nome": "Complexo B: B1(Tiamina) 4mg; B2 (Riboflavina) 1mg; B6 (Piridoxina) 2mg; B3 (Nicotinamida) 20mg; B5 (Dexpantenol) 3mg - ampola 2 mL Vitaminas",
    "via": "EV IM",
    "reconstituicao": "",
    "diluicao": "SF ou SG 5% - 500 - 1000 mL.",
    "concentracaoMaxima": "",
    "tempoInfusao": "Infundir lentamente (gota a gota)",
    "observacao": "Utilizar equipo fotossensível."
  },
  {
    "principio": "complexo",
    "nome": "Complexo Protombínico humano liofilizado 500 UI pó liófilo - frasco- ampola Anti-hemorrágico",
    "via": "EV",
    "reconstituicao": "Diluente próprio (disponível na embalagem). Deixar o diluente atingir a temperatura ambiente.",
    "diluicao": "",
    "concentracaoMaxima": "",
    "tempoInfusao": "1 mL/min nos primeiros 10 minutos, não exceder 8mL/min.",
    "observacao": "Recomenda-se que o produto seja administrado imediatamente após o preparo."
  },
  {
    "principio": "dantroleno",
    "nome": "Dantroleno sódico 20 mg pó liófilo frasco-ampola Relaxante muscular esquelético - Antídoto",
    "via": "EV",
    "reconstituicao": "60mL de água para injetáveis (exclusivamente), sem conservantes, estéril e apirogênica.",
    "diluicao": "",
    "concentracaoMaxima": "",
    "tempoInfusao": "Infusão em 1 hora.",
    "observacao": "SF 0,9%, SG5% e outras soluções ácidas não são compatíveis, portanto não devem ser usadas. Estabilidade de até 6 horas após a reconstituição entre 15-25°C."
  },
  {
    "principio": "deslanosídeo",
    "nome": "Deslanosídeo 0,2 mg/mL - ampola 2 mL Glicosídeo Cardíaco",
    "via": "EV IM",
    "reconstituicao": "",
    "diluicao": "",
    "concentracaoMaxima": "",
    "tempoInfusao": "EV lentamente.",
    "observacao": "Não se deve administrar cálcio por via parenteral a pacientes que fazem uso desse fármaco."
  },
  {
    "principio": "dexametasona",
    "nome": "Dexametasona, fosfato dissódico 4 mg/mL - ampola 2,5 mL Anti-inflamatório Hormonal",
    "via": "EV IM",
    "reconstituicao": "",
    "diluicao": "SF ou SG 5% - 50 - 100 mL.",
    "concentracaoMaxima": "",
    "tempoInfusao": "EV direta lenta ou infusão contínua",
    "observacao": ""
  },
  {
    "principio": "dexmedetomidina",
    "nome": "Dexmedetomidina, cloridrato 100 mcg/mL - frasco-ampola 2 mL Sedativo, Agonista Alfa-2 Adrenérgico",
    "via": "EV",
    "reconstituicao": "",
    "diluicao": "2 mL do medicamento em 48 mL de SF 0,9% totalizando 50mL.",
    "concentracaoMaxima": "4mcg/mL",
    "tempoInfusao": "Iniciar com 1mcg/kg em 10 minutos, seguida por uma infusão de manutenção 0,2 a 0,7mcg/kg/h. (Pacientes Adultos)",
    "observacao": "Compatível com SG5% e Ringer."
  },
  {
    "principio": "dexrazoxano",
    "nome": "Dexrazoxano, cloridrato 500mg – frasco-ampola Cardioprotetor (em uso antraciclinas)",
    "via": "EV",
    "reconstituicao": "AD – 25mL",
    "diluicao": "Ringer lactato de 25 – 100mL por frasco.",
    "concentracaoMaxima": "",
    "tempoInfusao": "15 minutos",
    "observacao": ""
  },
  {
    "principio": "dextrocetamina",
    "nome": "Dextrocetamina, cloridrato (Escetamina) 50 mg/mL - ampola 2 mL Anestésico Geral",
    "via": "EV IM",
    "reconstituicao": "",
    "diluicao": "Não é necessário diluir para indução anestésica. Para manutenção diluir em SF 0,9% ou SG5% na concentração de 2mg/ml",
    "concentracaoMaxima": "2mg/mL",
    "tempoInfusao": "Bolus/Indução anestésica: durante 1 minuto ou 0,5mg/kg/min Manutenção infusão lenta: 0,1 a 0,5mg/kg/min",
    "observacao": ""
  },
  {
    "principio": "dextrocetamina",
    "nome": "Dextrocetamina, cloridrato (Escetamina) 50 mg/mL - frasco- ampola 10 mL Anestésico Geral",
    "via": "EV IM",
    "reconstituicao": "",
    "diluicao": "SF 0,9% ou SG5% - 250mL a 500mL",
    "concentracaoMaxima": "2mg/mL",
    "tempoInfusao": "Indução anestésica: 0,5mg/kg/min Manutenção infusão lenta: 0,1 a 0,5mg/kg/min",
    "observacao": ""
  },
  {
    "principio": "diazepam",
    "nome": "Diazepam 5 mg/mL - ampola 2 mL Ansiolítico, Benzodiazepínico",
    "via": "EV IM",
    "reconstituicao": "",
    "diluicao": "A diluição não é recomendada, porém é compatível com SF 0,9% ou SG5%, mínimo de 250mL.",
    "concentracaoMaxima": "5 mg/mL (puro)",
    "tempoInfusao": "0,5 - 1 mL/min",
    "observacao": "Vesicante, evitar extravasamento. Antagonista: Flumazenil."
  },
  {
    "principio": "diclofenaco",
    "nome": "Diclofenaco sódico 25 mg/mL - ampola 3 mL Anti-inflamatório não esteroidal",
    "via": "IM",
    "reconstituicao": "",
    "diluicao": "",
    "concentracaoMaxima": "",
    "tempoInfusao": "",
    "observacao": "A solução injetável não pode ser administrada por mais de 2 dias. Administrar exclusivamente no glúteo."
  },
  {
    "principio": "difenidramina",
    "nome": "Difenidramina, cloridrato 50 mg - ampola 1 mL Anti-histamínico antagonista H1 de primeira geração, Antídoto",
    "via": "IM profundo EV",
    "reconstituicao": "",
    "diluicao": "SF 0,9% ou SG 5% Volume Sugerido: 50mL",
    "concentracaoMaxima": "50 mg/mL",
    "tempoInfusao": "IM profunda, EV direto (3 a 5 min), Infusão de 15-30min.",
    "observacao": ""
  },
  {
    "principio": "dimenidrinato",
    "nome": "Dimenidrinato 50 mg/mL + piridoxina 50 mg/mL - ampola 1 mL Antiemético, Antagonista H",
    "via": "IM",
    "reconstituicao": "",
    "diluicao": "",
    "concentracaoMaxima": "",
    "tempoInfusao": "",
    "observacao": "Uso exclusivo IM (profundo) preferencialmente em região glútea."
  },
  {
    "principio": "dimenidrinato",
    "nome": "Dimenidrinato 3 mg/ mL + piridoxina 5 mg/mL + glicose 100 mg/mL + frutose 100 mg/mL - ampola 10 mL Antiemético, Antagonista H",
    "via": "EV",
    "reconstituicao": "",
    "diluicao": "SF 0,9% EV direto: diluir 10mL SF 0,9%. Infusão: diluir de 50 a 100mL SF 0,9%.",
    "concentracaoMaxima": "3mg/mL",
    "tempoInfusao": "EV direto: > 2 min. EV infusão: 30 min.",
    "observacao": ""
  },
  {
    "principio": "dipirona",
    "nome": "Dipirona 500 mg/mL - ampola 2 mL Antitérmico, Analgésico",
    "via": "IM EV",
    "reconstituicao": "",
    "diluicao": "SF 0,9% ou SG 5%",
    "concentracaoMaxima": "500 mg/mL",
    "tempoInfusao": "EV direto: 1mL/min.",
    "observacao": ""
  },
  {
    "principio": "dobutamina",
    "nome": "Dobutamina, cloridrato 12,5 mg/mL - ampola 20 mL Agonista Adrenérgico beta-1, Inotrópico",
    "via": "EV",
    "reconstituicao": "",
    "diluicao": "SF 0,9% ou SG5% - 250mL - 500 mL ou 1000mL",
    "concentracaoMaxima": "5000 mcg/mL (250 mg de dobutamina diluído para 50mL)",
    "tempoInfusao": "0,0025 mL/Kg/min a 0,06 mL/Kg/min",
    "observacao": "Diluído para 1000 mL - concentração 250 mcg/mL. Diluído para 500 mL - concentração 500 mcg/mL. Diluído para 250 mL - a concentração 1000 mcg/mL"
  },
  {
    "principio": "dopamina",
    "nome": "Dopamina, cloridrato 5 mg/mL - ampola 10 mL Agonista Adrenérgico",
    "via": "EV",
    "reconstituicao": "",
    "diluicao": "SF 0,9% ou SG 5% - 250 mL",
    "concentracaoMaxima": "3200 mcg/mL",
    "tempoInfusao": "20 mcg/kg/min.",
    "observacao": "Deve ser administrada em bomba de infusão em veia de grande calibre. Medicamento fotossensível, utilizar equipo âmbar. É inativada em soluções alcalinas."
  },
  {
    "principio": "efedrina",
    "nome": "Efedrina, sulfato 50 mg/mL - ampola 1 mL Agonista Adrenérgico",
    "via": "IM EV SC",
    "reconstituicao": "",
    "diluicao": "SF 0,9% ou SG5% - 9 mL",
    "concentracaoMaxima": "5 mg/mL",
    "tempoInfusao": "EV lento",
    "observacao": "Proteger a ampola da luz até o momento de usar."
  },
  {
    "principio": "enoxaparina",
    "nome": "Enoxaparina sódica 20 mg/0,2mL seringa preenchida - 0,2 mL Anticoagulante, Heparina de Baixo Peso Molecular",
    "via": "SC",
    "reconstituicao": "",
    "diluicao": "",
    "concentracaoMaxima": "",
    "tempoInfusao": "",
    "observacao": "Administração na região anterolateral ao abdômen, alternando a cada aplicação os lados direito e esquerdo."
  },
  {
    "principio": "enoxaparina",
    "nome": "Enoxaparina sódica 40 mg/0,4mL seringa preenchida - 0,4 mL Anticoagulante, Heparina de Baixo Peso Molecular",
    "via": "SC",
    "reconstituicao": "",
    "diluicao": "",
    "concentracaoMaxima": "",
    "tempoInfusao": "",
    "observacao": "Administração na região anterolateral ao abdômen, alternando a cada aplicação os lados direito e esquerdo."
  },
  {
    "principio": "enoxaparina",
    "nome": "Enoxaparina sódica 60 mg/0,6mL seringa preenchida - 0,6 mL Anticoagulante, Heparina de Baixo Peso Molecular",
    "via": "SC",
    "reconstituicao": "",
    "diluicao": "",
    "concentracaoMaxima": "",
    "tempoInfusao": "",
    "observacao": "Administração na região anterolateral ao abdômen, alternando a cada aplicação os lados direito e esquerdo."
  },
  {
    "principio": "enoxaparina",
    "nome": "Enoxaparina sódica 80 mg/0,8mL seringa preenchida - 0,8 mL Anticoagulante, Heparina de Baixo Peso Molecular",
    "via": "SC",
    "reconstituicao": "",
    "diluicao": "",
    "concentracaoMaxima": "",
    "tempoInfusao": "",
    "observacao": "Administração na região anterolateral ao abdômen, alternando a cada aplicação os lados direito e esquerdo."
  },
  {
    "principio": "epinefrina",
    "nome": "Epinefrina 1 mg/mL - ampola 1 mL Agonista Adrenérgico",
    "via": "EV IM SC Intracardíaca",
    "reconstituicao": "",
    "diluicao": "Diluir em SF 0,9% ou SG 5%.",
    "concentracaoMaxima": "16mcg/mL para adultos. 64mcg/mL para crianças.",
    "tempoInfusao": "Adultos: 0,1-0,5mcg/kg/min Pediatria: 0,1-01mcg/kg/min",
    "observacao": "Proteger da Luz. Sensível a luz e ao ar. Vesicante, evitar extravasamento."
  },
  {
    "principio": "escopolamina",
    "nome": "Escopolamina, butilbrometo 20 mg/mL - ampola 1 mL Antiespasmódico, Anticolinérgico",
    "via": "IM EV",
    "reconstituicao": "",
    "diluicao": "SF ou SG 5% - 50 mL - 100mL. Pode ser administrada pura.",
    "concentracaoMaxima": "20 mg/mL (puro)",
    "tempoInfusao": "1 mL/min EV direto: 30 minutos",
    "observacao": "Contraindicado uso em idosos, especialmente sensíveis aos efeitos secundários dos antimuscarínicos, como secura da boca e retenção urinária. Não exceder a dose máxima de 100 mg (5 ampolas) por dia para adultos."
  },
  {
    "principio": "escopolamina",
    "nome": "Escopolamina, butilbrometo + dipirona sódica ; 4 mg/mL + 500mg/mL - ampola 5 mL Antiespasmódico, Anticolinérgico",
    "via": "EV IM profunda",
    "reconstituicao": "",
    "diluicao": "SF ou SG 5% - 50mL",
    "concentracaoMaxima": "",
    "tempoInfusao": "EV direto: Em 5 min Mínimo de 1mL/min",
    "observacao": "Não deve ser administrado por via parenteral em pacientes com glaucoma, taquicardia, estenoses mecânicas no trato gastrintestinal, megacólon, miastenia grave ou hipertrofia prostática. Contraindicado uso em idosos, especialmente sensíveis aos efeitos secundários dos antimuscarínicos, como secura da boca e retenção urinária."
  },
  {
    "principio": "etilefrina",
    "nome": "Etilefrina, cloridrato 10 mg/mL - ampola 1 mL Vasoconstritor e hipertensor",
    "via": "EV IM SC",
    "reconstituicao": "",
    "diluicao": "SF, SG 5% ou Ringer Lactato.",
    "concentracaoMaxima": "",
    "tempoInfusao": "0,4 mg/min - adultos. 0,2 mg/min - crianças de 2-6 anos. 0,05 a 0,2mg/min –crianças menores de 2 anos.",
    "observacao": ""
  },
  {
    "principio": "etomidato",
    "nome": "Etomidato 2 mg/mL - ampola 10 mL Hipnótico",
    "via": "EV",
    "reconstituicao": "",
    "diluicao": "Não é necessário diluição.",
    "concentracaoMaxima": "",
    "tempoInfusao": "EV lento: 30 a 60 segundos.",
    "observacao": "Não apresenta ação analgésica. A solução é altamente irritante, evitar a administração em vasos de pequeno calibre."
  },
  {
    "principio": "fenitoína",
    "nome": "Fenitoína sódica 50 mg/mL - ampola 5 mL Anticonvulsivante",
    "via": "EV",
    "reconstituicao": "",
    "diluicao": "Não é recomendado a diluição. Caso necessário diluir com SF 0,9% - 50mL",
    "concentracaoMaxima": "5mg/mL",
    "tempoInfusao": "50 mg/min em adultos. EV infusão: 60 minutos",
    "observacao": "Vesicante, evitar extravasamento. Administrar em veia de grande calibre. Recomendado a infusão por curtos períodos utilizando filtro de 0,22 micras."
  },
  {
    "principio": "fenobarbital",
    "nome": "Fenobarbital sódico 100 mg/mL - ampola 2 mL Anticonvulsivante",
    "via": "IM EV",
    "reconstituicao": "",
    "diluicao": "SF ou SG 5%",
    "concentracaoMaxima": "10mg/mL",
    "tempoInfusao": "EV direto: 3 a 5 minutos. Administrar lentamente, máximo 60 mg/min em adultos.",
    "observacao": "Irritante, evitar extravasamento. IM: a injeção intramuscular deve ser aplicada em local de massa muscular larga e injetar menos de 5mL em cada lado."
  },
  {
    "principio": "fentanil",
    "nome": "Fentanil, citrato 0,0785 mg/mL (equivale a 0,05 mg/mL de Fentanil - ampola 2 mL embalagem estéril Analgésico Opioide",
    "via": "EV Espinhal",
    "reconstituicao": "",
    "diluicao": "",
    "concentracaoMaxima": "",
    "tempoInfusao": "",
    "observacao": "Antídoto: Naloxona."
  },
  {
    "principio": "fentanil",
    "nome": "Fentanil, citrato 0,0785 mg/mL (equivale a 0,05 mg/mL de Fentanil – frasco-ampola ou ampola 10 mL Analgésico Opioide",
    "via": "EV IM",
    "reconstituicao": "",
    "diluicao": "Se necessário diluir em SF 0,9% ou SG 5%.",
    "concentracaoMaxima": "SF 0,9% - 0,02mg/mL e 0,01mg/mL SG 5% - 0,01mg/ml e 0,04mg/mL",
    "tempoInfusao": "",
    "observacao": "Antídoto: Naloxona."
  },
  {
    "principio": "filgrastim",
    "nome": "Filgrastim 300 mcg 1 mL frasco ou seringa preenchida Fator Estimulador de Colônias de Granulócitos",
    "via": "SC EV",
    "reconstituicao": "",
    "diluicao": "SG5% - 50 mL (somente para administração EV)",
    "concentracaoMaxima": "",
    "tempoInfusao": "Infundir em 30 minutos.",
    "observacao": "Incompatível com SF 0,9 %"
  },
  {
    "principio": "fitomenadiona",
    "nome": "Fitomenadiona (vitamina K) 10 mg/mL - ampola 1 mL Vitaminas, Antagonista",
    "via": "SC IM",
    "reconstituicao": "",
    "diluicao": "SF 0,9% ou SG5%",
    "concentracaoMaxima": "0,05mg/mL",
    "tempoInfusao": "Infusão lenta. 1 mg/minuto ou 20 ml/minuto.",
    "observacao": "A via endovenosa deve ser restrita a situações onde outra via não é possível e o alto risco envolvido é justificável. Proteger da luz. Diluir em Sf ou SG5% 200mL."
  },
  {
    "principio": "flumazenil",
    "nome": "Flumazenil, cloridrato 0,1 mg/mL - ampola 5 mL Antídoto",
    "via": "EV",
    "reconstituicao": "",
    "diluicao": "Não é necessário diluir. Compatível com SF, SG 5% e Ringer Lactato",
    "concentracaoMaxima": "",
    "tempoInfusao": "Em 15-30 segundos em bolus. Infusão: 0,1 mg - 0,4 mg/hora.",
    "observacao": "Deve ser administrado em veia de grande calibre. Evitar extravasamento."
  },
  {
    "principio": "folinato",
    "nome": "Folinato de Cálcio (Ácido Folínico) 50mg pó liófilo frasco ampola Agente desintoxicante para tratamento antineoplásico",
    "via": "EV IM",
    "reconstituicao": "5ml de água bacteriostática ou água para injetáveis.",
    "diluicao": "SF 0,9% ou SG5% - 50mL",
    "concentracaoMaxima": "10 mg/mL",
    "tempoInfusao": "Não exceder 160mg/min.",
    "observacao": "Quando reconstituído em água bacteriostática (contendo álcool benzílico), o medicamento poderá ser utilizado em até 7 (sete) dias. Caso o produto seja reconstituído com água para injetáveis, recomenda-se utilização imediata e descarte da porção não utilizada."
  },
  {
    "principio": "folinato",
    "nome": "Folinato de Cálcio (Ácido Folínico) 10 mg/mL frasco-ampola 30 mL Agente desintoxicante para tratamento antineoplásico",
    "via": "EV IM",
    "reconstituicao": "",
    "diluicao": "SF 0,9% ou SG5% Dose até 300mg - 100mL Dose acima 300mg - 250mnL",
    "concentracaoMaxima": "10 mg/mL",
    "tempoInfusao": "Máximo 160mg/min.",
    "observacao": ""
  },
  {
    "principio": "fosfato",
    "nome": "Fosfato de potássio 2meq/mL – ampola 10mL Repositor Eletrolítico",
    "via": "EV",
    "reconstituicao": "",
    "diluicao": "SF0,9% ou SG5% - 250 - 500 mL.",
    "concentracaoMaxima": "",
    "tempoInfusao": "Tempo de infusão: 6 a 12 horas.",
    "observacao": "Não administrar na mesma bolsa ou em linha com solução de sais de cálcio."
  },
  {
    "principio": "furosemida",
    "nome": "Furosemida 10 mg/mL - ampola 2 mL Diurético de Alça",
    "via": "IM EV",
    "reconstituicao": "",
    "diluicao": "SF 0,9% ou Ringer",
    "concentracaoMaxima": "10 mg/mL",
    "tempoInfusao": "4 mg/min. Para uso em bolus, administrar cerca de 1 a 2 minutos.",
    "observacao": "Proteger da luz. Pode ser administrada sem diluição. A administração IM deve ser restrita a casos excepcionais."
  },
  {
    "principio": "gosserrelina",
    "nome": "Gosserrelina, acetato 3,6 mg seringa preenchida Antineoplásico, Hormônio",
    "via": "SC",
    "reconstituicao": "",
    "diluicao": "",
    "concentracaoMaxima": "",
    "tempoInfusao": "",
    "observacao": "Seringa preenchida pronta para uso."
  },
  {
    "principio": "haloperidol",
    "nome": "Haloperidol 5 mg/mL - ampola 1 mL Neuroléptico",
    "via": "IM recomendado EV off label",
    "reconstituicao": "",
    "diluicao": "SG 5%",
    "concentracaoMaxima": "3 mg/mL",
    "tempoInfusao": "2-25 mg/hora (quando necessário usar a via EV).",
    "observacao": "Em caso de administração EV monitoramento contínuo do eletrocardiograma, risco de prolongamento do intervalo QT e arritmias cardíacas sérias."
  },
  {
    "principio": "heparina",
    "nome": "Heparina sódica 5000 UI/0,25 mL - ampola 0,25 mL Solução anticoagulante",
    "via": "SC",
    "reconstituicao": "",
    "diluicao": "",
    "concentracaoMaxima": "",
    "tempoInfusao": "",
    "observacao": ""
  },
  {
    "principio": "heparina",
    "nome": "Heparina sódica 5000 UI/mL – frasco- ampola 5 mL Solução anticoagulante",
    "via": "EV",
    "reconstituicao": "",
    "diluicao": "SF 0,9%, SG5% e Ringer, 100 - 250 mL.",
    "concentracaoMaxima": "",
    "tempoInfusao": "",
    "observacao": "Antídoto: Protamina. Cada 1mL de protamina inativa 1.000 UI de heparina sódica. Recomenda-se o uso de bomba de infusão. A via IM não é recomendada devido à dor e hematoma."
  },
  {
    "principio": "hidralazina",
    "nome": "Hidralazina, cloridrato 20 mg/mL - ampola 1 mL Antihipertensivo",
    "via": "EV IM",
    "reconstituicao": "",
    "diluicao": "SF 0,9% - 9 mL para EV direto. 50mL para Infusão. Puro para IM.",
    "concentracaoMaxima": "200 a 400 mg/Litro",
    "tempoInfusao": "EV direto: 3 a 5 min Infusão continua: 50 - 150mcg/min",
    "observacao": "Não usar SG 5%"
  },
  {
    "principio": "hidrocortisona",
    "nome": "Hidrocortisona, succinato sódico 100 mg pó para solução injetável frasco- ampola Anti-inflamatório Hormonal, Corticoide",
    "via": "IM EV",
    "reconstituicao": "AD ou SF 0,9% - 2 mL.",
    "diluicao": "SG 5%, SF 0,9% ou SGF - 100 - 1000 mL.",
    "concentracaoMaxima": "EV direto: 50mg/mL Infusão: 1mg/mL",
    "tempoInfusao": "EV direto: 30seg Infusão: acima de 30min",
    "observacao": ""
  },
  {
    "principio": "hidrocortisona",
    "nome": "Hidrocortisona, succinato 500 mg pó para solução injetável frasco-ampola Anti-inflamatório Hormonal, Corticoide",
    "via": "IM EV",
    "reconstituicao": "AD ou SF 0,9% - 4 mL.",
    "diluicao": "SG 5%, SF 0,9% ou SGF - 500 - 1000 mL.",
    "concentracaoMaxima": "EV direto: 50mg/mL Infusão: 1mg/mL",
    "tempoInfusao": "EV direto: 10min Infusão: acima de 30min",
    "observacao": ""
  },
  {
    "principio": "imunoglobulina",
    "nome": "Imunoglobulina antitimócito 25 mg pó liófilo Imunossupressor",
    "via": "EV",
    "reconstituicao": "AD - 5 mL.",
    "diluicao": "SF 0,9%, SG 5% - 50 - 500 mL. Recomendado 50mL por frasco.",
    "concentracaoMaxima": "",
    "tempoInfusao": "4 a 6 horas.",
    "observacao": "Administrar em veia de grande calibre. Recomendado que administrar através de um filtro de linha de 0,2 μm em bomba de infusão."
  },
  {
    "principio": "imunoglobulina",
    "nome": "Imunoglobulina humana 5 g Imunoglobulina (biológico)",
    "via": "EV",
    "reconstituicao": "",
    "diluicao": "Não é necessário diluir. Quando necessário compatível com SG 5%.",
    "concentracaoMaxima": "100mg/mL",
    "tempoInfusao": "O produto deve ser infundido inicialmente a uma velocidade de 0,3 mL/kg de peso corporal/h (por 30 minutos). Se houver boa tolerabilidade, a velocidade de infusão pode ser aumentada gradativamente para 4,8 mL/kg de peso corporal/h.",
    "observacao": "Não misturar com SF 0,9%"
  },
  {
    "principio": "insulina",
    "nome": "Insulina Humana NPH 100 UI/mL – frasco-ampola 10 mL Hipoglicemiante",
    "via": "SC",
    "reconstituicao": "",
    "diluicao": "",
    "concentracaoMaxima": "",
    "tempoInfusao": "",
    "observacao": ""
  },
  {
    "principio": "insulina",
    "nome": "Insulina Humana Regular 100 UI/mL - frasco-ampola 10 mL Hipoglicemiante",
    "via": "SC IM EV",
    "reconstituicao": "",
    "diluicao": "Diluir cada 100 UI de insulina em 100 mL de SF 0,9%",
    "concentracaoMaxima": "1 unidade/mL",
    "tempoInfusao": "",
    "observacao": ""
  },
  {
    "principio": "isossorbida",
    "nome": "Isossorbida, mononitrato 10 mg/mL - ampola 1 mL Nitrato, Vasodilatador",
    "via": "EV",
    "reconstituicao": "",
    "diluicao": "SF 0,9% ou SG 5% - 100 mL",
    "concentracaoMaxima": "",
    "tempoInfusao": "EV bolus; Infusão contínua: correr em 2 a 3 horas",
    "observacao": ""
  },
  {
    "principio": "leuprorrelina",
    "nome": "Leuprorrelina, acetato 3,75 mg pó liófilo Hormônio",
    "via": "IM",
    "reconstituicao": "Reconstituído diluente próprio.",
    "diluicao": "",
    "concentracaoMaxima": "",
    "tempoInfusao": "",
    "observacao": "Aumento dos níveis séricos de testosterona no início do tratamento. Usar com cautela em pacientes com histórico de doença psiquiátrica."
  },
  {
    "principio": "levobupivacaína",
    "nome": "Levobupivacaína, cloridrato + hemitartarato de epinefrina 5 mg/mL (0,5%) + 9,1 mcg/mL (1:200.000) – frasco-ampola 20 mL Anestésico Local",
    "via": "Infiltração, Bloqueio Nervoso, Anestesia caudal Epidural.",
    "reconstituicao": "",
    "diluicao": "Quando necessária, pode ser feita diluição em SF 0,9% sem conservantes.",
    "concentracaoMaxima": "2,5mg/mL.",
    "tempoInfusao": "",
    "observacao": "Não está indicado para raquianestesia."
  },
  {
    "principio": "levobupivacaína",
    "nome": "Levobupivacaína, cloridrato 5 mg/mL (0,5%) - frasco-ampola 20 mL embalagem estéril Anestésico Local",
    "via": "Infiltração, Bloqueio Nervoso, Anestesia caudal Epidural.",
    "reconstituicao": "",
    "diluicao": "Quando necessária, pode ser feita diluição em SF 0,9% sem conservantes.",
    "concentracaoMaxima": "2,5mg/mL.",
    "tempoInfusao": "",
    "observacao": "Não está indicado para raquianestesia."
  },
  {
    "principio": "levosimendana",
    "nome": "Levosimendana 2,5 mg/mL - frasco- ampola 5 mL Agente cardiotônico, sensibilizador de cálcio",
    "via": "EV",
    "reconstituicao": "",
    "diluicao": "SG 5% - 500mL",
    "concentracaoMaxima": "0,05 mg/mL",
    "tempoInfusao": "Dose inicial de 6 a 12 mcg/kg, infundidos durante 10 minutos, seguida por uma infusão contínua de 0,1 mcg/kg/min por 24 horas.",
    "observacao": "A cor da solução pode modificar-se para laranja durante o armazenamento, não comprometendo a potência."
  },
  {
    "principio": "lidocaína",
    "nome": "Lidocaína, cloridrato + hemitartarato de epinefrina 20 mg/mL (2%) + 5mcg/mL (1:200.000) frasco-ampola 20 mL embalagem estéril Anestésico Local",
    "via": "Anestesia locorregional.",
    "reconstituicao": "",
    "diluicao": "",
    "concentracaoMaxima": "",
    "tempoInfusao": "",
    "observacao": "Não está indicado para raquianestesia."
  },
  {
    "principio": "lidocaína",
    "nome": "Lidocaína, cloridrato 20 mg/mL (2%) - ampola 5 mL Anestésico Local",
    "via": "Anestesia locorregional.",
    "reconstituicao": "",
    "diluicao": "",
    "concentracaoMaxima": "",
    "tempoInfusao": "",
    "observacao": "Não está indicado para raquianestesia."
  },
  {
    "principio": "lidocaína",
    "nome": "Lidocaína, cloridrato 20 mg/mL (2%) - frasco-ampola 20 mL Anestésico Local",
    "via": "Anestesia locorregional.",
    "reconstituicao": "",
    "diluicao": "",
    "concentracaoMaxima": "",
    "tempoInfusao": "",
    "observacao": "Não está indicado para raquianestesia."
  },
  {
    "principio": "mesna",
    "nome": "Mesna 100 mg/mL - ampola 4mL Agente desintoxicante para tratamento antineoplásico",
    "via": "EV",
    "reconstituicao": "",
    "diluicao": "SF 0,9% , SG5% e Glicofisiológico - 50 a 1000 mL.",
    "concentracaoMaxima": "20mg/ml",
    "tempoInfusao": "EV direta por 15-30min ou infusão contínua.",
    "observacao": "A diluição de mesna com Solução de Ringer é estável por 12 horas a temperatura ambiente."
  },
  {
    "principio": "metaraminol",
    "nome": "Metaraminol, bitartarato 10 mg/mL - ampola 1mL Agonista Adrenérgico",
    "via": "EV IM",
    "reconstituicao": "",
    "diluicao": "SF 0,9% ou SG5% - 500 mL",
    "concentracaoMaxima": "0,2mg/ml",
    "tempoInfusao": "",
    "observacao": "No choque grave pode ser administrado EV direto 0,5 a 5mg. Atenção: medicamento vesicante."
  },
  {
    "principio": "metilergometrina",
    "nome": "Metilergometrina, maleato 0,2 mg/mL - ampola 1 mL Estimulante uterino",
    "via": "EV IM SC",
    "reconstituicao": "",
    "diluicao": "Não necessita de diluição.",
    "concentracaoMaxima": "",
    "tempoInfusao": "EV administrar lento , acima de 60 segundos.",
    "observacao": "Injeção intramuscular (IM) é a via de administração recomendada. Endovenoso: monitoramento cauteloso da pressão sanguínea."
  },
  {
    "principio": "metilprednisolona",
    "nome": "Metilprednisolona, succinato 125 mg pó para suspensão injetável frasco- ampola Anti-inflamatório Hormonal, Corticoide",
    "via": "EV IM",
    "reconstituicao": "2mL de diluente próprio",
    "diluicao": "SF 0,9% , SG5%, - 20 - 50 mL.",
    "concentracaoMaxima": "125mg/mL",
    "tempoInfusao": "EV direto - Administrar 30 mg/kg por um período de, pelo menos, 30 minutos. Doses acima de 250mg devem ser administradas acima de 30 min.",
    "observacao": "Reconstituir o produto apenas com o diluente que acompanha a embalagem."
  },
  {
    "principio": "metilprednisolona",
    "nome": "Metilprednisolona, succinato 500 mg pó para suspensão injetável frasco- ampola Anti-inflamatório Hormonal, Corticoide",
    "via": "EV IM",
    "reconstituicao": "8 mL de diluente próprio",
    "diluicao": "SF 0,9% , SG5% - 250 - 500 mL.",
    "concentracaoMaxima": "125mg/mL",
    "tempoInfusao": "EV direto - Administrar 30 mg/kg por um período de, pelo menos, 30 minutos. Doses acima de 250mg devem ser administradas acima de 30 min.",
    "observacao": "Reconstituir o produto apenas com o diluente que acompanha a embalagem."
  },
  {
    "principio": "metoclopramida",
    "nome": "Metoclopramida, cloridrato 10 mg/2 mL ampola Antiemético, Procinético",
    "via": "EV IM",
    "reconstituicao": "",
    "diluicao": "SG 5%, SF 0,9% - 50 mL",
    "concentracaoMaxima": "",
    "tempoInfusao": "EV: no mínimo por 3 minutos. IM : administrar lento",
    "observacao": "Risco de sintomas extrapiramidais. Cautela em pacientes que apresentam fatores de risco conhecidos para prolongamento do intervalo QT."
  },
  {
    "principio": "metoprolol",
    "nome": "Metoprolol, tartarato 1 mg/mL - ampola 5 mL Beta-Bloqueador",
    "via": "EV",
    "reconstituicao": "",
    "diluicao": "Uso sem diluição. Caso necessário diluir 40mg de metoprolol em SF 0,9%, SG% ou Ringer - 1000mL",
    "concentracaoMaxima": "0,04mg/mL.",
    "tempoInfusao": "",
    "observacao": ""
  },
  {
    "principio": "midazolam",
    "nome": "Midazolam, cloridrato 1 mg/mL - ampola 5 mL Hipnótico, Sedativo",
    "via": "EV IM",
    "reconstituicao": "",
    "diluicao": "SF 0,9% , SG5% ou Ringer simples - 100mL - 1000 mL.",
    "concentracaoMaxima": "IM: 1mg/mL EV: 5mg/mL.",
    "tempoInfusao": "A administração EV deve ser feita lentamente, a uma velocidade de aproximadamente 1mg em 30 segundos.",
    "observacao": "Não misturar com soluções alcalinas. Midazolam sofre precipitação em Bicarbonato de sódio. Antídoto: Flumazenil."
  },
  {
    "principio": "midazolam",
    "nome": "Midazolam, cloridrato 5 mg/mL - ampola 3 mL Hipnótico, Sedativo",
    "via": "EV IM",
    "reconstituicao": "",
    "diluicao": "SF 0,9% , SG5% ou Ringer simples - 100mL - 1000 mL.",
    "concentracaoMaxima": "IM: 1mg/mL EV: 5 mg/mL.",
    "tempoInfusao": "A administração EV deve ser feita lentamente, a uma velocidade de aproximadamente 1mg em 30 segundos.",
    "observacao": "Não misturar com soluções alcalinas. Midazolam sofre precipitação em Bicarbonato de sódio. Antídoto: Flumazenil."
  },
  {
    "principio": "midazolam",
    "nome": "Midazolam, cloridrato 5 mg/mL - ampola 10 mL Hipnótico, Sedativo",
    "via": "EV IM",
    "reconstituicao": "",
    "diluicao": "SF 0,9% , SG5% ou Ringer simples - 100mL - 1000 mL.",
    "concentracaoMaxima": "IM: 1mg/mL EV: 5 mg/mL.",
    "tempoInfusao": "A administração EV deve ser feita lentamente, a uma velocidade de aproximadamente 1mg em 30 segundos.",
    "observacao": "Não misturar com soluções alcalinas. Midazolam sofre precipitação em Bicarbonato de sódio. Antídoto: Flumazenil."
  },
  {
    "principio": "milrinona",
    "nome": "Milrinona, lactato 1 mg/mL - ampola 10 mL Inibidor da fosfodiesterase",
    "via": "EV",
    "reconstituicao": "",
    "diluicao": "SF 0,9%, SG 5% Dose de ataque: Pode administrar sem diluição ou diluir em volume de 10 - 20mL. Infusão contínua: 20 mg para 100mL",
    "concentracaoMaxima": "200mcg/ml",
    "tempoInfusao": "Dose de ataque: 50mcg/kg em 10min Dose de manutenção: 0,375 a 0,750mcg/kg/ min em infusão contínua",
    "observacao": "Não deve ser diluído em soluções contendo Bicarbonato de Sódio."
  },
  {
    "principio": "morfina",
    "nome": "Morfina, sulfato 10 mg/mL - ampola 1 mL Analgésico Opioide",
    "via": "EV IM SC",
    "reconstituicao": "",
    "diluicao": "SF 0,9% , SG 5%",
    "concentracaoMaxima": "0,1- 1mg/mL",
    "tempoInfusao": "EV direto: de 3 a 5 minutos",
    "observacao": "Antagonista: Naloxona Quando preparadas em seringas, não armazenar, uso imediato (perda de potência)."
  },
  {
    "principio": "morfina",
    "nome": "Morfina, sulfato 0,2 mg/mL - ampola 1 mL - embalagem estéril Analgésico Opioide",
    "via": "EV IM Intratecal Epidural",
    "reconstituicao": "",
    "diluicao": "",
    "concentracaoMaxima": "",
    "tempoInfusao": "EV direto: de 3 a 5 minutos",
    "observacao": "Antagonista: Naloxona. Quando preparadas em seringas, não armazenar, uso imediato (perda de potência). A embalagem Sterile Pack é destinada para uso no Bloco Cirúrgico."
  },
  {
    "principio": "morfina",
    "nome": "Morfina, sulfato 1 mg/mL - ampola 2 mL - embalagem estéril Analgésico Opioide",
    "via": "EV IM Epidural Intratecal",
    "reconstituicao": "",
    "diluicao": "",
    "concentracaoMaxima": "",
    "tempoInfusao": "EV direto: de 3 a 5 minutos",
    "observacao": "Antagonista: Naloxona. Quando preparadas em seringas, não armazenar, uso imediato (perda de potência). A embalagem Sterile Pack é destinada para uso no Bloco Cirúrgico."
  },
  {
    "principio": "nalbufina",
    "nome": "Nalbufina, cloridrato 10 mg/mL - ampola 1 mL Analgésico Opióide",
    "via": "EV IM SC",
    "reconstituicao": "",
    "diluicao": "SF 0,9%; SG5% - 30 a 50mL",
    "concentracaoMaxima": "0,5mg/mL",
    "tempoInfusao": "EV direto lento: 30mL em 2 a 3 min Infusão: 50mL em 10-15min",
    "observacao": ""
  },
  {
    "principio": "naloxona",
    "nome": "Naloxona, cloridrato 0,4 mg/mL - ampola 1 mL Antagonista opioide",
    "via": "EV IM SC",
    "reconstituicao": "",
    "diluicao": "SF 0,9%, SG5% - 100mL – 500mL",
    "concentracaoMaxima": "Infusão contínua: 2 mg em 500 ml de diluente: 0,004mg/mL. Concentração para EV direto: 0,4mg em 9mL de diluente: 0,04mg/mL.",
    "tempoInfusao": "",
    "observacao": ""
  },
  {
    "principio": "neostigmina",
    "nome": "Neostigmina, metilssulfato 0,5 mg/mL - ampola 1 mL Inibidor da acetilcolinesterase",
    "via": "EV IM SC",
    "reconstituicao": "",
    "diluicao": "IM ou SC: pronto para uso. EV: diluir em qsp 10 mL de SF",
    "concentracaoMaxima": "",
    "tempoInfusao": "EV: lentamente; no mínimo 3 a 5 minutos.",
    "observacao": ""
  },
  {
    "principio": "nitroglicerina",
    "nome": "Nitroglicerina 5 mg/mL - ampola 5 mL Vasodilatador Coroniano",
    "via": "EV",
    "reconstituicao": "",
    "diluicao": "SF 0,9% ou SG5% - 250 - 500 mL.",
    "concentracaoMaxima": "400 mcg/mL.",
    "tempoInfusao": "",
    "observacao": "A infusão de nitroglicerina injetável não deve ser misturada com outros fármacos. Diluir antes do uso. Não fazer via intravenosa direta."
  },
  {
    "principio": "nitroprusseto",
    "nome": "Nitroprusseto de sódio 50 mg pó liófilo + diluente ou ampola pronta para uso Vasodilatador",
    "via": "EV",
    "reconstituicao": "Diluente próprio (SG 5% - 2 mL) ou solução pronta para uso.",
    "diluicao": "SG5% - 250, 500 ou 1000mL.",
    "concentracaoMaxima": "0,2mg/mL",
    "tempoInfusao": "Inicial: 0,3 - 1 mcg/Kg/min Dose máxima: 10mcg/Kg/min",
    "observacao": "Medicamento irritante, evitar extravasamento. A solução reconstituída é estável por 4 horas, e a solução diluída é estável por 24 horas. Proteger da luz."
  },
  {
    "principio": "norepinefrina",
    "nome": "Norepinefrina, hemitartarato 2 mg/mL - ampola 4 mL Agonista Adrenérgico",
    "via": "EV",
    "reconstituicao": "",
    "diluicao": "SG 5%, SGF - 250 - 1000 mL",
    "concentracaoMaxima": "0,5mg/mL.",
    "tempoInfusao": "Inicial: 2-3mL/min Manutenção: 0,5-1mL/min",
    "observacao": "Administrar em veia calibrosa (central). Vesicante, evitar extravasamento. Proteger da luz. Não é recomendada a administração apenas em solução salina, a fim de evitar perdas por oxidação."
  },
  {
    "principio": "ocitocina",
    "nome": "Ocitocina 5 UI/mL - ampola 1 mL Estimulante Uterino",
    "via": "EV IM",
    "reconstituicao": "",
    "diluicao": "SG 5% ou SF 0,9% - 500mL",
    "concentracaoMaxima": "0,01UI/mL",
    "tempoInfusao": "Inicial: 1 a 4 miliunidades/min (2 a 8 gotas/minuto). Velocidade máxima: 20 miliunidades/min (40 gotas/min).",
    "observacao": ""
  },
  {
    "principio": "octreotida",
    "nome": "Octreotida, acetato 0,1 mg/mL ampola 1 mL Análogo de Somatostatina",
    "via": "EV SC",
    "reconstituicao": "",
    "diluicao": "SF 0,9% , SG 5% - 50 - 200 mL.",
    "concentracaoMaxima": "0,1mg/mL",
    "tempoInfusao": "Infusão contínua: 50mcg/hora, equivalente a 1,2mg/dia. SC: Fístula pancreática, ascite, derrame pleural: 0,1mg (100mcg) de 8/8h",
    "observacao": "Protocolo Institucional - Necessário preenchimento de Formulário de Medicamentos - Uso Restrito. Proteger da luz. Não misturar outros medicamentos.."
  },
  {
    "principio": "octreotida",
    "nome": "Octreotida, acetato 0,5 mg/mL ampola 1 mL Análogo de Somatostatina",
    "via": "EV SC",
    "reconstituicao": "",
    "diluicao": "SF 0,9% , SG 5% - 50 - 200 mL.",
    "concentracaoMaxima": "0,1mg/mL",
    "tempoInfusao": "Infusão contínua: 50mcg/hora, equivalente a 1,2mg/dia. SC: Fístula pancreática, ascite, derrame pleural: 0,1mg (100mcg) de 8/8h",
    "observacao": "Protocolo Institucional - Necessário preenchimento de Formulário de Medicamentos - Uso Restrito. Proteger da luz. Não misturar outros medicamentos."
  },
  {
    "principio": "octreotida",
    "nome": "Octreotida, acetato 0,05 mg/mL ampola 1 mL Análogo de Somatostatina",
    "via": "EV SC",
    "reconstituicao": "",
    "diluicao": "SF 0,9% , SG 5% - 50 - 200 mL.",
    "concentracaoMaxima": "0,1mg/mL",
    "tempoInfusao": "Infusão contínua: 50mcg/hora, equivalente a 1,2mg/dia. SC: Fístula pancreática, ascite, derrame pleural: 0,1mg (100mcg) de 8/8h",
    "observacao": "Protocolo Institucional - Necessário preenchimento de Formulário de Medicamentos - Uso Restrito. Proteger da luz. Não misturar outros medicamentos."
  },
  {
    "principio": "omeprazol",
    "nome": "Omeprazol sódico 40 mg pó liofilizado frasco-ampola + diluente próprio Inibidor da Bomba de Prótons",
    "via": "EV",
    "reconstituicao": "Diluente próprio - 10mL",
    "diluicao": "EV direta: 10mL do diluente próprio. Infusão: SF 0,9% ou SG 5% - 100 mL.",
    "concentracaoMaxima": "",
    "tempoInfusao": "EV Direta: Aplicar lentamente, de 2,5mL/min até um máximo de 4mL/min. Infusão: deve ser administrada por um período não inferior a 20- 30 minutos.",
    "observacao": "Proteger da luz. Reconstituir somente com o diluente próprio (10mL). Estável por 4 horas."
  },
  {
    "principio": "ondansetrona",
    "nome": "Ondansetrona, cloridrato 2 mg/mL Antiemético, Antagonista Seletivo do Receptor Serotonina",
    "via": "EV IM",
    "reconstituicao": "",
    "diluicao": "SF 0,9% , SG 5%, Solução de Ringer - 50 mL - 100mL.",
    "concentracaoMaxima": "",
    "tempoInfusao": "Doses de 8 mg ou menos não precisam ser diluídas: podem ser administrada IM ou EV lento > 30 segundos. Doses acima de 8mg até 16mg - Infusão : acima de 15 min.",
    "observacao": ""
  },
  {
    "principio": "pamidronato",
    "nome": "Pamidronato dissódico 90 mg – frasco- ampola Inibidor da reabsorção óssea",
    "via": "EV",
    "reconstituicao": "AD - 10 mL",
    "diluicao": "SG 5%, SF 0,9% - 250 mL",
    "concentracaoMaxima": "0,36 mg/mL",
    "tempoInfusao": "Máximo de 1 mg/min. Recomendado administrar em 2 horas.",
    "observacao": "Deve ser sempre diluído e administrado por infusão intravenosa lenta."
  },
  {
    "principio": "pancurônio",
    "nome": "Pancurônio 2 mg/mL - ampola 2 mL Bloqueador neuromuscular não despolarizante",
    "via": "EV",
    "reconstituicao": "",
    "diluicao": "Compatível com SF 0,9%, SG 5%, Solução de Ringer",
    "concentracaoMaxima": "",
    "tempoInfusao": "EV direto: 1 a 2 minutos",
    "observacao": "EV Direto – sem diluição. Não existem dados para recomendar infusão contínua."
  },
  {
    "principio": "pantoprazol",
    "nome": "Pantoprazol sódico 40 mg pó para solução injetável - frasco-ampola Inibidor da Bomba de Prótons",
    "via": "EV",
    "reconstituicao": "SF 0,9% - 10 ml",
    "diluicao": "SF 0,9%, SG 5% - 100 mL",
    "concentracaoMaxima": "",
    "tempoInfusao": "EV direto (bolus): mínimo de 2 minutos Infusão rápida: 15 minutos",
    "observacao": ""
  },
  {
    "principio": "papaverina",
    "nome": "Papaverina, cloridrato 50 mg/mL - ampola 2 mL Vasodilatador",
    "via": "EV IM Intra-arterial",
    "reconstituicao": "",
    "diluicao": "Se necessário compatível com SF 0,9%, SG 5%",
    "concentracaoMaxima": "",
    "tempoInfusao": "EV ou IM lento por 1 a 2 minutos.",
    "observacao": ""
  },
  {
    "principio": "petidina",
    "nome": "Petidina, cloridrato 50 mg/mL - ampola 2 mL Analgésico Opioide",
    "via": "EV IM SC",
    "reconstituicao": "",
    "diluicao": "SF 0,9%, SG 5% - 10 mL",
    "concentracaoMaxima": "10mg/mL",
    "tempoInfusao": "EV direto: lentamente durante 1 a 2 minutos.",
    "observacao": ""
  },
  {
    "principio": "pentoxifilina",
    "nome": "Pentoxifilina 20 mg/mL - ampola 5 mL Agente Hemorreológico, Redutor da Viscosidade do Sangue",
    "via": "EV",
    "reconstituicao": "",
    "diluicao": "SF 0,9% ou Solução de Ringer - 250 a 500 mL",
    "concentracaoMaxima": "",
    "tempoInfusao": "120 a 180 minutos.",
    "observacao": ""
  },
  {
    "principio": "prometazina",
    "nome": "Prometazina 25 mg/mL - ampola 2 mL Anti-Histamínico",
    "via": "IM profunda.",
    "reconstituicao": "",
    "diluicao": "",
    "concentracaoMaxima": "25mg/mL",
    "tempoInfusao": "",
    "observacao": "Vesicante."
  },
  {
    "principio": "propofol",
    "nome": "Propofol 10 mg/ mL 1% emulsão – frasco-ampola 10 mL Anestésico Geral",
    "via": "EV",
    "reconstituicao": "",
    "diluicao": "SG 5%",
    "concentracaoMaxima": "2mg de propofol/mL",
    "tempoInfusao": "",
    "observacao": "Estabilidade de 12 horas puro (sem diluição). Estabilidade de 6 horas após diluição. Agitar antes do uso."
  },
  {
    "principio": "propofol",
    "nome": "Propofol 10 mg/ mL 1% emulsão - frasco-ampola 20 mL Anestésico Geral",
    "via": "EV",
    "reconstituicao": "",
    "diluicao": "SG 5%",
    "concentracaoMaxima": "2mg de propofol/mL",
    "tempoInfusao": "",
    "observacao": "Estabilidade de 12 horas puro (sem diluição). Estabilidade de 6 horas após diluição. Agitar antes do uso."
  },
  {
    "principio": "protamina",
    "nome": "Protamina, cloridrato 10 mg/mL (1000 UI/mL) - ampola 5 mL Antídoto",
    "via": "EV",
    "reconstituicao": "",
    "diluicao": "",
    "concentracaoMaxima": "",
    "tempoInfusao": "EV lento: Entre 1 a 3 minutos. Máximo: 50 mg em 10 minutos.",
    "observacao": "Cada 1 mL de Protamina neutraliza 1.000 UI de heparina"
  },
  {
    "principio": "remifentanila",
    "nome": "Remifentanila, cloridrato 2 mg pó liófilo - frasco-ampola Analgésico Opioide",
    "via": "EV",
    "reconstituicao": "AD - 2 mL.",
    "diluicao": "SF 0,9%, SG 5%, SGF - 10 - 100 mL.",
    "concentracaoMaxima": "250 mcg/mL.",
    "tempoInfusao": "0,25-0,4mcg/ kg/min",
    "observacao": ""
  },
  {
    "principio": "rocurônio",
    "nome": "Rocurônio, brometo 10 mg/mL – frasco-ampola 5 mL Bloqueador neuromuscular não despolarizante",
    "via": "EV",
    "reconstituicao": "",
    "diluicao": "SF 0,9%, SG 5%, SGF , Ringer Lactato - 250 - 1000 mL",
    "concentracaoMaxima": "2 mg/mL",
    "tempoInfusao": "",
    "observacao": "ANTÍDOTO: Sugamadex"
  },
  {
    "principio": "ropivacaína",
    "nome": "Ropivacaína, cloridrato 10 mg/mL (1%) – frasco-ampola 20 mL embalagem estéril Anestésico Local",
    "via": "Peridural lombar para cirurgia.",
    "reconstituicao": "",
    "diluicao": "SF 0,9%",
    "concentracaoMaxima": "",
    "tempoInfusao": "A depender da via de administração",
    "observacao": "Não usar por via Intravenosa (toxicidade do SNC)."
  },
  {
    "principio": "ropivacaína",
    "nome": "Ropivacaína, cloridrato 2 mg/mL (0,2%) - frasco-ampola 20 mL embalagem estéril Anestésico Local",
    "via": "Peridural, Bloqueio de campo e Bloqueio nervoso periférico",
    "reconstituicao": "",
    "diluicao": "SF 0,9%",
    "concentracaoMaxima": "",
    "tempoInfusao": "A depender da via de administração",
    "observacao": "Não usar por via Intravenosa (toxicidade do SNC)."
  },
  {
    "principio": "ropivacaína",
    "nome": "Ropivacaína, cloridrato 7,5 mg/mL (0,75%) - frasco-ampola 20 mL embalagem estéril Anestésico Local",
    "via": "Peridural Bloqueio nervoso, Bloqueio de campo e injeção intra-articular.",
    "reconstituicao": "",
    "diluicao": "SF 0,9%",
    "concentracaoMaxima": "",
    "tempoInfusao": "A depender da via de administração",
    "observacao": "Não usar por via Intravenosa (toxicidade do SNC)."
  },
  {
    "principio": "sufentanila",
    "nome": "Sufentanila, citrato 5 mcg/mL - ampola 2 mL - embalagem estéril Analgésico Opioide",
    "via": "Epidural",
    "reconstituicao": "",
    "diluicao": "",
    "concentracaoMaxima": "",
    "tempoInfusao": "",
    "observacao": ""
  },
  {
    "principio": "sufentanila",
    "nome": "Sufentanila 50 mcg/mL - ampola 1 mL Analgésico Opioide",
    "via": "EV Epidural",
    "reconstituicao": "",
    "diluicao": "Se necessário diluição, compatível com SF 0,9% ou SG 5%",
    "concentracaoMaxima": "",
    "tempoInfusao": "EV: Injeção em bolus por pelo menos 2 minutos ou infusão contínua",
    "observacao": "Proteger da luz."
  },
  {
    "principio": "sugamadex",
    "nome": "Sugamadex sódico 100 mg/mL – frasco-ampola 2 mL Antídoto, Agente Reversor de Bloqueio Neuromuscular",
    "via": "EV",
    "reconstituicao": "",
    "diluicao": "Não é necessária diluição. Se necessário diluir em SF 0,9%.",
    "concentracaoMaxima": "",
    "tempoInfusao": "Bolus rápido.",
    "observacao": "Proteger da luz."
  },
  {
    "principio": "suxametônio",
    "nome": "Suxametônio (Succinilcolina) 500 mg pó liofilizado - frasco- ampola Bloqueador neuromuscular despolarizante",
    "via": "EV IM",
    "reconstituicao": "SF 0,9% - 10 mL",
    "diluicao": "SF 0,9%, ou SG 5% - 500mL a 1000mL.",
    "concentracaoMaxima": "EV - 1 a 2mg/mL. IM - administrar no máximo 150 mg.",
    "tempoInfusao": "EV - infusão contínua de 0,5 – 10mL/min.",
    "observacao": ""
  },
  {
    "principio": "tenoxicam",
    "nome": "Tenoxicam 40mg pó liofilizado – frasco-ampola Antiinflamatório não-esteroidal",
    "via": "EV IM",
    "reconstituicao": "AD – 2mL",
    "diluicao": "",
    "concentracaoMaxima": "",
    "tempoInfusao": "EV direto lento",
    "observacao": "Não é recomendado a administração por infusão. Administrar lentamente."
  },
  {
    "principio": "terbutalina",
    "nome": "Terbutalina, sulfato 0,5 mg/mL - ampola 1 mL Broncodilatador (Beta-2 agonista)",
    "via": "SC EV",
    "reconstituicao": "",
    "diluicao": "SG 5% - 100mL",
    "concentracaoMaxima": "5mcg/mL",
    "tempoInfusao": "20-30 gotas/min",
    "observacao": ""
  },
  {
    "principio": "terlipressina",
    "nome": "Terlipressina, acetato 1 mg pó liófilo frasco-ampola ou solução pronta para uso (0,1 mg/mL com ampola 8,5 mL de solução). Hemostático",
    "via": "EV",
    "reconstituicao": "Apresentação com Diluente próprio (5mL) ou reconstituir com SF 0,9% - 5mL.",
    "diluicao": "SF 0,9% 10mL",
    "concentracaoMaxima": "",
    "tempoInfusao": "Deve ser administrado em bolus lento.",
    "observacao": "Vide Protocolo Institucional - Necessário preenchimento de Formulário de Medicamentos - Uso Restrito - “Solicitação de Terlipressina”."
  },
  {
    "principio": "tiamina",
    "nome": "Tiamina 100mg/mL – ampola 1mL Vitamina",
    "via": "EV IM",
    "reconstituicao": "",
    "diluicao": "SF 0,9%, SG 5% - 10 a 20mL",
    "concentracaoMaxima": "1mg/mL",
    "tempoInfusao": "IM: não menos que 10 minutos EV infusão: 30 minutos",
    "observacao": "Preferencialmente administrar IM por ter menor incidência de reações adversas."
  },
  {
    "principio": "tiopental",
    "nome": "Tiopental 1g Anestésico Geral Barbitúrico",
    "via": "EV",
    "reconstituicao": "AD ou SF 0,9%",
    "diluicao": "AD ou SF 0,9% - 40 mL",
    "concentracaoMaxima": "25 mg/mL",
    "tempoInfusao": "",
    "observacao": ""
  },
  {
    "principio": "tirofibana",
    "nome": "Tirofibana, cloridrato 0,25 mg/mL – frasco-ampola 50 mL Antiagregante Plaquetário",
    "via": "EV",
    "reconstituicao": "",
    "diluicao": "SF 0,9% ou SG 5% - 200 mL",
    "concentracaoMaxima": "50mcg/mL",
    "tempoInfusao": "Angina instável ou Infarto do Miocárdio sem elevação do segmento ST: Dose inicial: 0,4 mcg/kg/min por 30 min. Dose manutenção: 0,1 mcg/kg/min. Angioplastia/Aterectomia: Dose inicial: 10 mcg/kg, bolus, 3 minutos. Dose manutenção: 0,15 mcg/kg/min.",
    "observacao": "Necessário ajuste da dose pelo Clearance de creatinina <60ml/min."
  },
  {
    "principio": "tramadol",
    "nome": "Tramadol, cloridrato 50 mg/mL - ampola 1 mL Analgésico Opióide",
    "via": "EV IM SC",
    "reconstituicao": "",
    "diluicao": "SF 0,9%, SG 5% - 50 a 100 mL",
    "concentracaoMaxima": "",
    "tempoInfusao": "EV direto: 1mL/min Infusão: lento de 30 a 60 min",
    "observacao": ""
  },
  {
    "principio": "tramadol",
    "nome": "Tramadol, cloridrato 50 mg/ mL - ampola 2 mL Analgésico Opióide",
    "via": "EV IM SC",
    "reconstituicao": "",
    "diluicao": "SF 0,9%, SG 5% - 50 a 100 mL",
    "concentracaoMaxima": "",
    "tempoInfusao": "EV direto: 1mL/min Infusão: lento de 30 a 60 min",
    "observacao": ""
  },
  {
    "principio": "vasopressina",
    "nome": "Vasopressina 20 U/mL - ampola 1 mL Hormônio Antidiurético",
    "via": "SC IM EV",
    "reconstituicao": "",
    "diluicao": "SF 0,9% ou SG 5% EV direta: 9mL diluente Infusão contínua: 99 mL do diluente.",
    "concentracaoMaxima": "1 U/mL",
    "tempoInfusao": "0,01-0,04U/min",
    "observacao": "Seguir recomendações institucionais para Medicamentos de Uso Restrito. Administrar preferencialmente em veia central ou veia periférica profunda."
  },
  {
    "principio": "verapamil",
    "nome": "Verapamil, cloridrato 2,5 mg/mL - ampola 2 mL Anti-hipertensivo",
    "via": "EV",
    "reconstituicao": "",
    "diluicao": "SG 5% - 150 - 250 mL",
    "concentracaoMaxima": "2,5mg/mL",
    "tempoInfusao": "Inicial - EV direto por 2 a 3 min Repetição: 30 minutos",
    "observacao": "Incompatível com soluções alcalinas (ex. solução de bicarbonato."
  }
];

module.exports = { diluicoesBarreiro };
