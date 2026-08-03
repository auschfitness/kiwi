import type { Deck } from '../../types'

/**
 * The Spanish that catches a Brazilian specifically.
 *
 * Not a grammar course — a set of the choices Portuguese makes differently,
 * drilled as production. Each target is the word that has to come out right;
 * the sentence around it is what makes the choice visible.
 */

export const ES_FALSE_FRIENDS_DECK: Deck = {
  id: 'es_false',
  name: 'Falsos amigos',
  emoji: '🎭',
  desc: 'Parece português e não é — os que derrubam brasileiro',
  level: 2,
  cards: [
    { id: 'es_false_0', deckId: 'es_false', en: 'embarazada', pt: 'grávida (NÃO envergonhada)', exampleHtml: 'Mi hermana está <b>embarazada</b>.', examplePt: 'Minha irmã está grávida.', pos: 'adj' },
    { id: 'es_false_1', deckId: 'es_false', en: 'exquisito', pt: 'delicioso (NÃO esquisito)', exampleHtml: 'El postre estaba <b>exquisito</b>.', examplePt: 'A sobremesa estava deliciosa.', pos: 'adj' },
    { id: 'es_false_2', deckId: 'es_false', en: 'largo', pt: 'comprido (NÃO largo)', exampleHtml: 'El pasillo es muy <b>largo</b>.', examplePt: 'O corredor é muito comprido.', pos: 'adj' },
    { id: 'es_false_3', deckId: 'es_false', en: 'ancho', pt: 'largo / amplo', exampleHtml: 'La calle es bastante <b>ancha</b>.', examplePt: 'A rua é bastante larga.', pos: 'adj' },
    { id: 'es_false_4', deckId: 'es_false', en: 'ratos', pt: 'momentos (NÃO ratos)', exampleHtml: 'Pasamos buenos <b>ratos</b> juntos.', examplePt: 'Passamos bons momentos juntos.', pos: 'noun' },
    { id: 'es_false_5', deckId: 'es_false', en: 'pelado', pt: 'careca (NÃO pelado)', exampleHtml: 'Mi tío está <b>pelado</b> ya.', examplePt: 'Meu tio já está careca.', pos: 'adj' },
    { id: 'es_false_6', deckId: 'es_false', en: 'desnudo', pt: 'pelado / nu', exampleHtml: 'El niño salió <b>desnudo</b> corriendo.', examplePt: 'O menino saiu pelado correndo.', pos: 'adj' },
    { id: 'es_false_7', deckId: 'es_false', en: 'oficina', pt: 'escritório (NÃO oficina)', exampleHtml: 'Trabajo en una <b>oficina</b> pequeña.', examplePt: 'Trabalho num escritório pequeno.', pos: 'noun' },
    { id: 'es_false_8', deckId: 'es_false', en: 'taller', pt: 'oficina / workshop', exampleHtml: 'Llevé el carro al <b>taller</b>.', examplePt: 'Levei o carro na oficina.', pos: 'noun' },
    { id: 'es_false_9', deckId: 'es_false', en: 'vaso', pt: 'copo (NÃO vaso)', exampleHtml: 'Dame un <b>vaso</b> de agua.', examplePt: 'Me dá um copo de água.', pos: 'noun' },
    { id: 'es_false_10', deckId: 'es_false', en: 'apellido', pt: 'sobrenome (NÃO apelido)', exampleHtml: '¿Cuál es tu <b>apellido</b> completo?', examplePt: 'Qual é o seu sobrenome completo?', pos: 'noun' },
    { id: 'es_false_11', deckId: 'es_false', en: 'apodo', pt: 'apelido', exampleHtml: 'Su <b>apodo</b> es "el flaco".', examplePt: 'O apelido dele é "o magro".', pos: 'noun' },
    { id: 'es_false_12', deckId: 'es_false', en: 'borrar', pt: 'apagar (NÃO borrar)', exampleHtml: 'Voy a <b>borrar</b> ese archivo.', examplePt: 'Vou apagar esse arquivo.', pos: 'verb' },
    { id: 'es_false_13', deckId: 'es_false', en: 'brincar', pt: 'pular (NÃO brincar)', exampleHtml: 'El perro <b>brincó</b> la cerca.', examplePt: 'O cachorro pulou a cerca.', pos: 'verb' },
    { id: 'es_false_14', deckId: 'es_false', en: 'jugar', pt: 'brincar / jogar', exampleHtml: 'Los niños <b>juegan</b> en el parque.', examplePt: 'As crianças brincam no parque.', pos: 'verb' },
    { id: 'es_false_15', deckId: 'es_false', en: 'salsa', pt: 'molho (NÃO salsa)', exampleHtml: 'Esta <b>salsa</b> está muy picante.', examplePt: 'Este molho está muito picante.', pos: 'noun' },
    { id: 'es_false_16', deckId: 'es_false', en: 'perejil', pt: 'salsa (a erva)', exampleHtml: 'Le falta un poco de <b>perejil</b>.', examplePt: 'Está faltando um pouco de salsa.', pos: 'noun' },
    { id: 'es_false_17', deckId: 'es_false', en: 'rojo', pt: 'vermelho (NÃO roxo)', exampleHtml: 'Se puso <b>rojo</b> de vergüenza.', examplePt: 'Ficou vermelho de vergonha.', pos: 'adj' },
    { id: 'es_false_18', deckId: 'es_false', en: 'morado', pt: 'roxo', exampleHtml: 'Tiene un moretón <b>morado</b>.', examplePt: 'Tem um hematoma roxo.', pos: 'adj' },
    { id: 'es_false_19', deckId: 'es_false', en: 'cena', pt: 'jantar (NÃO cena)', exampleHtml: 'La <b>cena</b> es a las ocho.', examplePt: 'O jantar é às oito.', pos: 'noun' },
    { id: 'es_false_20', deckId: 'es_false', en: 'escena', pt: 'cena', exampleHtml: 'Esa <b>escena</b> me hizo llorar.', examplePt: 'Essa cena me fez chorar.', pos: 'noun' },
    { id: 'es_false_21', deckId: 'es_false', en: 'sobrenombre', pt: 'apelido / alcunha', exampleHtml: 'Le pusieron un <b>sobrenombre</b> cruel.', examplePt: 'Deram um apelido cruel a ele.', pos: 'noun' },
    { id: 'es_false_22', deckId: 'es_false', en: 'presunto', pt: 'suposto (NÃO presunto)', exampleHtml: 'El <b>presunto</b> autor fue detenido.', examplePt: 'O suposto autor foi detido.', pos: 'adj' },
    { id: 'es_false_23', deckId: 'es_false', en: 'jamón', pt: 'presunto', exampleHtml: 'Quiero un sándwich de <b>jamón</b>.', examplePt: 'Quero um sanduíche de presunto.', pos: 'noun' },
    { id: 'es_false_24', deckId: 'es_false', en: 'aula', pt: 'sala de aula', exampleHtml: 'El <b>aula</b> está en el segundo piso.', examplePt: 'A sala de aula fica no segundo andar.', pos: 'noun' },
    { id: 'es_false_25', deckId: 'es_false', en: 'clase', pt: 'aula', exampleHtml: 'La <b>clase</b> empieza a las nueve.', examplePt: 'A aula começa às nove.', pos: 'noun' },
  ],
}

export const ES_SER_ESTAR_DECK: Deck = {
  id: 'es_ser_estar',
  name: 'Ser e estar',
  emoji: '⚖️',
  desc: 'Parecido com o português — até a hora que não é',
  level: 2,
  cards: [
    { id: 'es_ser_estar_0', deckId: 'es_ser_estar', en: 'soy', pt: 'eu sou', exampleHtml: '<b>Soy</b> de São Paulo, Brasil.', examplePt: 'Eu sou de São Paulo, Brasil.', pos: 'verb' },
    { id: 'es_ser_estar_1', deckId: 'es_ser_estar', en: 'estoy', pt: 'eu estou', exampleHtml: '<b>Estoy</b> cansado del viaje.', examplePt: 'Estou cansado da viagem.', pos: 'verb' },
    { id: 'es_ser_estar_2', deckId: 'es_ser_estar', en: 'eres', pt: 'você é (tu)', exampleHtml: '<b>Eres</b> muy amable conmigo.', examplePt: 'Você é muito gentil comigo.', pos: 'verb' },
    { id: 'es_ser_estar_3', deckId: 'es_ser_estar', en: 'estás', pt: 'você está', exampleHtml: '¿Dónde <b>estás</b> ahora mismo?', examplePt: 'Onde você está agora?', pos: 'verb' },
    { id: 'es_ser_estar_4', deckId: 'es_ser_estar', en: 'es', pt: 'ele/ela é', exampleHtml: 'Ella <b>es</b> ingeniera civil.', examplePt: 'Ela é engenheira civil.', pos: 'verb' },
    { id: 'es_ser_estar_5', deckId: 'es_ser_estar', en: 'está', pt: 'ele/ela está', exampleHtml: 'El café <b>está</b> muy caliente.', examplePt: 'O café está muito quente.', pos: 'verb' },
    { id: 'es_ser_estar_6', deckId: 'es_ser_estar', en: 'somos', pt: 'nós somos', exampleHtml: '<b>Somos</b> cinco en la familia.', examplePt: 'Somos cinco na família.', pos: 'verb' },
    { id: 'es_ser_estar_7', deckId: 'es_ser_estar', en: 'estamos', pt: 'nós estamos', exampleHtml: '<b>Estamos</b> listos para salir.', examplePt: 'Estamos prontos para sair.', pos: 'verb' },
    { id: 'es_ser_estar_8', deckId: 'es_ser_estar', en: 'son', pt: 'eles são', exampleHtml: 'Ellos <b>son</b> mis compañeros.', examplePt: 'Eles são meus colegas.', pos: 'verb' },
    { id: 'es_ser_estar_9', deckId: 'es_ser_estar', en: 'están', pt: 'eles estão', exampleHtml: 'Los niños <b>están</b> durmiendo.', examplePt: 'As crianças estão dormindo.', pos: 'verb' },
    { id: 'es_ser_estar_10', deckId: 'es_ser_estar', en: 'es aburrido', pt: 'é chato (a pessoa)', exampleHtml: 'Ese programa <b>es aburrido</b>.', examplePt: 'Esse programa é chato.', pos: 'phrase' },
    { id: 'es_ser_estar_11', deckId: 'es_ser_estar', en: 'está aburrido', pt: 'está entediado', exampleHtml: 'El niño <b>está aburrido</b> aquí.', examplePt: 'O menino está entediado aqui.', pos: 'phrase' },
    { id: 'es_ser_estar_12', deckId: 'es_ser_estar', en: 'es listo', pt: 'é esperto', exampleHtml: 'Tu hijo <b>es listo</b>, ¿no?', examplePt: 'Seu filho é esperto, né?', pos: 'phrase' },
    { id: 'es_ser_estar_13', deckId: 'es_ser_estar', en: 'está listo', pt: 'está pronto', exampleHtml: 'Todo <b>está listo</b> para mañana.', examplePt: 'Tudo está pronto para amanhã.', pos: 'phrase' },
    { id: 'es_ser_estar_14', deckId: 'es_ser_estar', en: 'es rico', pt: 'é rico (dinheiro)', exampleHtml: 'Su familia <b>es rica</b> allá.', examplePt: 'A família dele é rica lá.', pos: 'phrase' },
    { id: 'es_ser_estar_15', deckId: 'es_ser_estar', en: 'está rico', pt: 'está gostoso', exampleHtml: 'Este guiso <b>está rico</b>.', examplePt: 'Este ensopado está gostoso.', pos: 'phrase' },
  ],
}

export const ES_POR_PARA_DECK: Deck = {
  id: 'es_por_para',
  name: 'Por e para',
  emoji: '🔀',
  desc: 'Onde o português usa "por" e o espanhol discorda',
  level: 2,
  cards: [
    { id: 'es_por_para_0', deckId: 'es_por_para', en: 'por la mañana', pt: 'de manhã', exampleHtml: 'Salgo <b>por la mañana</b> temprano.', examplePt: 'Saio de manhã cedo.', pos: 'phrase' },
    { id: 'es_por_para_1', deckId: 'es_por_para', en: 'para mañana', pt: 'para amanhã (prazo)', exampleHtml: 'Lo necesito <b>para mañana</b>.', examplePt: 'Preciso disso para amanhã.', pos: 'phrase' },
    { id: 'es_por_para_2', deckId: 'es_por_para', en: 'por eso', pt: 'por isso (causa)', exampleHtml: '<b>Por eso</b> te llamé ayer.', examplePt: 'Por isso eu te liguei ontem.', pos: 'phrase' },
    { id: 'es_por_para_3', deckId: 'es_por_para', en: 'para eso', pt: 'para isso (fim)', exampleHtml: '<b>Para eso</b> sirve el botón.', examplePt: 'Para isso serve o botão.', pos: 'phrase' },
    { id: 'es_por_para_4', deckId: 'es_por_para', en: 'gracias por', pt: 'obrigado por', exampleHtml: '<b>Gracias por</b> tu ayuda ayer.', examplePt: 'Obrigado pela sua ajuda ontem.', pos: 'phrase' },
    { id: 'es_por_para_5', deckId: 'es_por_para', en: 'por favor', pt: 'por favor', exampleHtml: 'Un café, <b>por favor</b>.', examplePt: 'Um café, por favor.', pos: 'phrase' },
    { id: 'es_por_para_6', deckId: 'es_por_para', en: 'para mí', pt: 'para mim / na minha opinião', exampleHtml: '<b>Para mí</b> está bien así.', examplePt: 'Para mim está bem assim.', pos: 'phrase' },
    { id: 'es_por_para_7', deckId: 'es_por_para', en: 'por teléfono', pt: 'por telefone', exampleHtml: 'Hablamos <b>por teléfono</b> anoche.', examplePt: 'Falamos por telefone ontem à noite.', pos: 'phrase' },
    { id: 'es_por_para_8', deckId: 'es_por_para', en: 'por ahora', pt: 'por enquanto', exampleHtml: '<b>Por ahora</b> está funcionando.', examplePt: 'Por enquanto está funcionando.', pos: 'phrase' },
    { id: 'es_por_para_9', deckId: 'es_por_para', en: 'para siempre', pt: 'para sempre', exampleHtml: 'Se fue <b>para siempre</b> de aquí.', examplePt: 'Foi embora para sempre daqui.', pos: 'phrase' },
    { id: 'es_por_para_10', deckId: 'es_por_para', en: 'por lo menos', pt: 'pelo menos', exampleHtml: 'Dame <b>por lo menos</b> una hora.', examplePt: 'Me dá pelo menos uma hora.', pos: 'phrase' },
    { id: 'es_por_para_11', deckId: 'es_por_para', en: 'para qué', pt: 'para quê', exampleHtml: '¿<b>Para qué</b> sirve esto?', examplePt: 'Para que serve isso?', pos: 'phrase' },
    { id: 'es_por_para_12', deckId: 'es_por_para', en: 'por qué', pt: 'por que', exampleHtml: '¿<b>Por qué</b> no me avisaste?', examplePt: 'Por que você não me avisou?', pos: 'phrase' },
  ],
}

export const ES_SUBJUNCTIVE_DECK: Deck = {
  id: 'es_subj',
  name: 'Subjuntivo',
  emoji: '🌀',
  desc: 'O tempo que o brasileiro entende e não produz',
  level: 3,
  cards: [
    { id: 'es_subj_0', deckId: 'es_subj', en: 'que venga', pt: 'que ele venha', exampleHtml: 'Espero <b>que venga</b> temprano.', examplePt: 'Espero que ele venha cedo.', pos: 'phrase' },
    { id: 'es_subj_1', deckId: 'es_subj', en: 'que sea', pt: 'que seja', exampleHtml: 'Ojalá <b>que sea</b> verdad.', examplePt: 'Tomara que seja verdade.', pos: 'phrase' },
    { id: 'es_subj_2', deckId: 'es_subj', en: 'que tenga', pt: 'que tenha', exampleHtml: 'Quiero <b>que tenga</b> éxito.', examplePt: 'Quero que ele tenha sucesso.', pos: 'phrase' },
    { id: 'es_subj_3', deckId: 'es_subj', en: 'que puedas', pt: 'que você possa', exampleHtml: 'Espero <b>que puedas</b> venir.', examplePt: 'Espero que você possa vir.', pos: 'phrase' },
    { id: 'es_subj_4', deckId: 'es_subj', en: 'cuando llegue', pt: 'quando eu chegar', exampleHtml: 'Te aviso <b>cuando llegue</b>.', examplePt: 'Te aviso quando eu chegar.', pos: 'phrase' },
    { id: 'es_subj_5', deckId: 'es_subj', en: 'si tuviera', pt: 'se eu tivesse', exampleHtml: '<b>Si tuviera</b> tiempo, iría.', examplePt: 'Se eu tivesse tempo, iria.', pos: 'phrase' },
    { id: 'es_subj_6', deckId: 'es_subj', en: 'si fuera', pt: 'se fosse', exampleHtml: '<b>Si fuera</b> más barato, lo compro.', examplePt: 'Se fosse mais barato, eu compro.', pos: 'phrase' },
    { id: 'es_subj_7', deckId: 'es_subj', en: 'aunque sea', pt: 'nem que seja', exampleHtml: 'Llámame, <b>aunque sea</b> tarde.', examplePt: 'Me liga, nem que seja tarde.', pos: 'phrase' },
    { id: 'es_subj_8', deckId: 'es_subj', en: 'para que', pt: 'para que', exampleHtml: 'Te lo digo <b>para que</b> sepas.', examplePt: 'Te digo para que você saiba.', pos: 'phrase' },
    { id: 'es_subj_9', deckId: 'es_subj', en: 'antes de que', pt: 'antes que', exampleHtml: 'Vámonos <b>antes de que</b> llueva.', examplePt: 'Vamos embora antes que chova.', pos: 'phrase' },
    { id: 'es_subj_10', deckId: 'es_subj', en: 'no creo que', pt: 'não acho que', exampleHtml: '<b>No creo que</b> sea posible.', examplePt: 'Não acho que seja possível.', pos: 'phrase' },
    { id: 'es_subj_11', deckId: 'es_subj', en: 'es mejor que', pt: 'é melhor que', exampleHtml: '<b>Es mejor que</b> lo hagas hoy.', examplePt: 'É melhor que você faça hoje.', pos: 'phrase' },
    { id: 'es_subj_12', deckId: 'es_subj', en: 'ojalá pudiera', pt: 'quem dera eu pudesse', exampleHtml: '<b>Ojalá pudiera</b> ayudarte más.', examplePt: 'Quem dera eu pudesse te ajudar mais.', pos: 'phrase' },
    { id: 'es_subj_13', deckId: 'es_subj', en: 'que hagas', pt: 'que você faça', exampleHtml: 'Necesito <b>que hagas</b> esto.', examplePt: 'Preciso que você faça isso.', pos: 'phrase' },
    { id: 'es_subj_14', deckId: 'es_subj', en: 'hasta que', pt: 'até que', exampleHtml: 'Espera <b>hasta que</b> termine.', examplePt: 'Espera até que eu termine.', pos: 'phrase' },
  ],
}

export const ES_PAST_DECK: Deck = {
  id: 'es_past',
  name: 'Passado: qual usar',
  emoji: '⏳',
  desc: 'Pretérito e imperfeito, onde o português não ajuda',
  level: 3,
  cards: [
    { id: 'es_past_0', deckId: 'es_past', en: 'fui', pt: 'eu fui (uma vez)', exampleHtml: 'Ayer <b>fui</b> al mercado.', examplePt: 'Ontem eu fui ao mercado.', pos: 'verb' },
    { id: 'es_past_1', deckId: 'es_past', en: 'iba', pt: 'eu ia (costumava)', exampleHtml: 'Antes <b>iba</b> todos los días.', examplePt: 'Antes eu ia todos os dias.', pos: 'verb' },
    { id: 'es_past_2', deckId: 'es_past', en: 'tuve', pt: 'eu tive', exampleHtml: '<b>Tuve</b> un problema anoche.', examplePt: 'Tive um problema ontem à noite.', pos: 'verb' },
    { id: 'es_past_3', deckId: 'es_past', en: 'tenía', pt: 'eu tinha', exampleHtml: 'Cuando era niño <b>tenía</b> miedo.', examplePt: 'Quando era criança eu tinha medo.', pos: 'verb' },
    { id: 'es_past_4', deckId: 'es_past', en: 'hice', pt: 'eu fiz', exampleHtml: '<b>Hice</b> la tarea anoche.', examplePt: 'Fiz a tarefa ontem à noite.', pos: 'verb' },
    { id: 'es_past_5', deckId: 'es_past', en: 'hacía', pt: 'eu fazia', exampleHtml: 'Antes <b>hacía</b> ejercicio diario.', examplePt: 'Antes eu fazia exercício diário.', pos: 'verb' },
    { id: 'es_past_6', deckId: 'es_past', en: 'estuve', pt: 'eu estive', exampleHtml: '<b>Estuve</b> allí dos horas.', examplePt: 'Estive lá duas horas.', pos: 'verb' },
    { id: 'es_past_7', deckId: 'es_past', en: 'estaba', pt: 'eu estava', exampleHtml: '<b>Estaba</b> lloviendo cuando salí.', examplePt: 'Estava chovendo quando saí.', pos: 'verb' },
    { id: 'es_past_8', deckId: 'es_past', en: 'supe', pt: 'eu fiquei sabendo', exampleHtml: 'Lo <b>supe</b> esta mañana.', examplePt: 'Fiquei sabendo hoje de manhã.', pos: 'verb' },
    { id: 'es_past_9', deckId: 'es_past', en: 'sabía', pt: 'eu sabia', exampleHtml: 'No <b>sabía</b> que venías hoy.', examplePt: 'Não sabia que você vinha hoje.', pos: 'verb' },
    { id: 'es_past_10', deckId: 'es_past', en: 'quise', pt: 'eu quis (tentei)', exampleHtml: '<b>Quise</b> avisarte pero no pude.', examplePt: 'Quis te avisar mas não consegui.', pos: 'verb' },
    { id: 'es_past_11', deckId: 'es_past', en: 'quería', pt: 'eu queria', exampleHtml: '<b>Quería</b> preguntarte algo.', examplePt: 'Queria te perguntar uma coisa.', pos: 'verb' },
    { id: 'es_past_12', deckId: 'es_past', en: 'conocí', pt: 'eu conheci', exampleHtml: 'La <b>conocí</b> en la fiesta.', examplePt: 'Eu a conheci na festa.', pos: 'verb' },
    { id: 'es_past_13', deckId: 'es_past', en: 'conocía', pt: 'eu conhecia', exampleHtml: 'Ya <b>conocía</b> ese lugar.', examplePt: 'Eu já conhecia esse lugar.', pos: 'verb' },
  ],
}

export const ES_GRAMMAR_DECKS: Deck[] = [
  ES_FALSE_FRIENDS_DECK,
  ES_SER_ESTAR_DECK,
  ES_POR_PARA_DECK,
  ES_SUBJUNCTIVE_DECK,
  ES_PAST_DECK,
]
