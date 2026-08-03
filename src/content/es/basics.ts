import type { Deck } from '../../types'

/**
 * The floor of the course.
 *
 * These decks exist because the first version did not have them. It opened at
 * "o sea" and "ni modo" — B1 discourse markers — on the assumption that a
 * Portuguese speaker who understands Spanish can start in the middle. He tried
 * it and said plainly that he could not, and he was right: understanding a
 * language passively and having its first thousand words available to produce
 * are different abilities, and only the second one is what this course trains.
 *
 * So: greetings, pronouns, numbers, the six verbs that carry half of all
 * speech, question words, and the objects in a room. Nothing here needs
 * anything else to be learned first.
 */

export const ES_HELLO_DECK: Deck = {
  id: 'es_hello',
  name: 'Primeiras palavras',
  emoji: '👋',
  desc: 'Cumprimentar, se apresentar, ser educado',
  level: 1,
  cards: [
    { id: 'es_hello_0', deckId: 'es_hello', en: 'hola', pt: 'oi / olá', exampleHtml: '<b>Hola</b>, ¿cómo estás?', examplePt: 'Oi, como você está?', pos: 'greeting' },
    { id: 'es_hello_1', deckId: 'es_hello', en: 'buenos días', pt: 'bom dia', exampleHtml: '<b>Buenos días</b>, señora.', examplePt: 'Bom dia, senhora.', pos: 'greeting' },
    { id: 'es_hello_2', deckId: 'es_hello', en: 'buenas tardes', pt: 'boa tarde', exampleHtml: '<b>Buenas tardes</b> a todos.', examplePt: 'Boa tarde a todos.', pos: 'greeting' },
    { id: 'es_hello_3', deckId: 'es_hello', en: 'buenas noches', pt: 'boa noite', exampleHtml: '<b>Buenas noches</b>, hasta mañana.', examplePt: 'Boa noite, até amanhã.', pos: 'greeting' },
    { id: 'es_hello_4', deckId: 'es_hello', en: 'adiós', pt: 'tchau / adeus', exampleHtml: '<b>Adiós</b>, nos vemos pronto.', examplePt: 'Tchau, a gente se vê logo.', pos: 'greeting' },
    { id: 'es_hello_5', deckId: 'es_hello', en: 'hasta luego', pt: 'até logo', exampleHtml: 'Me voy, <b>hasta luego</b>.', examplePt: 'Vou indo, até logo.', pos: 'greeting' },
    { id: 'es_hello_6', deckId: 'es_hello', en: 'gracias', pt: 'obrigado', exampleHtml: 'Muchas <b>gracias</b> por todo.', examplePt: 'Muito obrigado por tudo.', pos: 'greeting' },
    { id: 'es_hello_7', deckId: 'es_hello', en: 'de nada', pt: 'de nada', exampleHtml: '<b>De nada</b>, fue un placer.', examplePt: 'De nada, foi um prazer.', pos: 'greeting' },
    { id: 'es_hello_8', deckId: 'es_hello', en: 'por favor', pt: 'por favor', exampleHtml: 'Un café, <b>por favor</b>.', examplePt: 'Um café, por favor.', pos: 'greeting' },
    { id: 'es_hello_9', deckId: 'es_hello', en: 'perdón', pt: 'desculpa', exampleHtml: '<b>Perdón</b>, no te escuché.', examplePt: 'Desculpa, não te ouvi.', pos: 'greeting' },
    { id: 'es_hello_10', deckId: 'es_hello', en: 'disculpe', pt: 'com licença', exampleHtml: '<b>Disculpe</b>, ¿tiene un momento?', examplePt: 'Com licença, tem um momento?', pos: 'greeting' },
    { id: 'es_hello_11', deckId: 'es_hello', en: 'lo siento', pt: 'sinto muito', exampleHtml: '<b>Lo siento</b> mucho, de verdad.', examplePt: 'Sinto muito mesmo, de verdade.', pos: 'greeting' },
    { id: 'es_hello_12', deckId: 'es_hello', en: 'mucho gusto', pt: 'prazer', exampleHtml: '<b>Mucho gusto</b>, soy Ana.', examplePt: 'Prazer, sou a Ana.', pos: 'greeting' },
    { id: 'es_hello_13', deckId: 'es_hello', en: 'me llamo', pt: 'meu nome é', exampleHtml: '<b>Me llamo</b> Lucas, ¿y tú?', examplePt: 'Meu nome é Lucas, e o seu?', pos: 'phrase' },
    { id: 'es_hello_14', deckId: 'es_hello', en: '¿cómo estás?', pt: 'como você está?', exampleHtml: 'Hola, <b>¿cómo estás?</b>', examplePt: 'Oi, como você está?', pos: 'phrase' },
    { id: 'es_hello_15', deckId: 'es_hello', en: 'muy bien', pt: 'muito bem', exampleHtml: 'Estoy <b>muy bien</b>, gracias.', examplePt: 'Estou muito bem, obrigado.', pos: 'phrase' },
    { id: 'es_hello_16', deckId: 'es_hello', en: 'más o menos', pt: 'mais ou menos', exampleHtml: 'Hoy estoy <b>más o menos</b>.', examplePt: 'Hoje estou mais ou menos.', pos: 'phrase' },
    { id: 'es_hello_17', deckId: 'es_hello', en: 'sí', pt: 'sim', exampleHtml: '<b>Sí</b>, claro que puedo.', examplePt: 'Sim, claro que posso.', pos: 'word' },
    { id: 'es_hello_18', deckId: 'es_hello', en: 'no', pt: 'não', exampleHtml: '<b>No</b>, gracias.', examplePt: 'Não, obrigado.', pos: 'word' },
    { id: 'es_hello_19', deckId: 'es_hello', en: 'tal vez', pt: 'talvez', exampleHtml: '<b>Tal vez</b> mañana pueda.', examplePt: 'Talvez amanhã eu possa.', pos: 'phrase' },
  ],
}

export const ES_CORE_VERBS_DECK: Deck = {
  id: 'es_core_verbs',
  name: 'Os seis verbos',
  emoji: '🔑',
  desc: 'Ser, estar, ter, ir, fazer, querer — metade de tudo que se fala',
  level: 1,
  cards: [
    { id: 'es_core_verbs_0', deckId: 'es_core_verbs', en: 'ser', pt: 'ser', exampleHtml: 'Quiero <b>ser</b> más claro.', examplePt: 'Quero ser mais claro.', pos: 'verb' },
    { id: 'es_core_verbs_1', deckId: 'es_core_verbs', en: 'estar', pt: 'estar', exampleHtml: 'Voy a <b>estar</b> en casa.', examplePt: 'Vou estar em casa.', pos: 'verb' },
    { id: 'es_core_verbs_2', deckId: 'es_core_verbs', en: 'tener', pt: 'ter', exampleHtml: 'Quiero <b>tener</b> más tiempo.', examplePt: 'Quero ter mais tempo.', pos: 'verb' },
    { id: 'es_core_verbs_3', deckId: 'es_core_verbs', en: 'tengo', pt: 'eu tenho', exampleHtml: '<b>Tengo</b> dos hermanos.', examplePt: 'Eu tenho dois irmãos.', pos: 'verb' },
    { id: 'es_core_verbs_4', deckId: 'es_core_verbs', en: 'tienes', pt: 'você tem', exampleHtml: '¿<b>Tienes</b> un minuto?', examplePt: 'Você tem um minuto?', pos: 'verb' },
    { id: 'es_core_verbs_5', deckId: 'es_core_verbs', en: 'tiene', pt: 'ele/ela tem', exampleHtml: 'Ella <b>tiene</b> mucha suerte.', examplePt: 'Ela tem muita sorte.', pos: 'verb' },
    { id: 'es_core_verbs_6', deckId: 'es_core_verbs', en: 'ir', pt: 'ir', exampleHtml: 'Quiero <b>ir</b> contigo.', examplePt: 'Quero ir com você.', pos: 'verb' },
    { id: 'es_core_verbs_7', deckId: 'es_core_verbs', en: 'voy', pt: 'eu vou', exampleHtml: '<b>Voy</b> al mercado ahora.', examplePt: 'Vou ao mercado agora.', pos: 'verb' },
    { id: 'es_core_verbs_8', deckId: 'es_core_verbs', en: 'vas', pt: 'você vai', exampleHtml: '¿A dónde <b>vas</b>?', examplePt: 'Aonde você vai?', pos: 'verb' },
    { id: 'es_core_verbs_9', deckId: 'es_core_verbs', en: 'va', pt: 'ele/ela vai', exampleHtml: 'Él <b>va</b> todos los días.', examplePt: 'Ele vai todos os dias.', pos: 'verb' },
    { id: 'es_core_verbs_10', deckId: 'es_core_verbs', en: 'hacer', pt: 'fazer', exampleHtml: '¿Qué vas a <b>hacer</b> hoy?', examplePt: 'O que você vai fazer hoje?', pos: 'verb' },
    { id: 'es_core_verbs_11', deckId: 'es_core_verbs', en: 'hago', pt: 'eu faço', exampleHtml: '<b>Hago</b> ejercicio por la mañana.', examplePt: 'Faço exercício de manhã.', pos: 'verb' },
    { id: 'es_core_verbs_12', deckId: 'es_core_verbs', en: 'haces', pt: 'você faz', exampleHtml: '¿Qué <b>haces</b> aquí?', examplePt: 'O que você faz aqui?', pos: 'verb' },
    { id: 'es_core_verbs_13', deckId: 'es_core_verbs', en: 'hace', pt: 'ele/ela faz', exampleHtml: 'Ella <b>hace</b> todo sola.', examplePt: 'Ela faz tudo sozinha.', pos: 'verb' },
    { id: 'es_core_verbs_14', deckId: 'es_core_verbs', en: 'querer', pt: 'querer', exampleHtml: 'Es normal <b>querer</b> más.', examplePt: 'É normal querer mais.', pos: 'verb' },
    { id: 'es_core_verbs_15', deckId: 'es_core_verbs', en: 'quiero', pt: 'eu quero', exampleHtml: '<b>Quiero</b> un poco de agua.', examplePt: 'Quero um pouco de água.', pos: 'verb' },
    { id: 'es_core_verbs_16', deckId: 'es_core_verbs', en: 'quieres', pt: 'você quer', exampleHtml: '¿<b>Quieres</b> venir conmigo?', examplePt: 'Você quer vir comigo?', pos: 'verb' },
    { id: 'es_core_verbs_17', deckId: 'es_core_verbs', en: 'quiere', pt: 'ele/ela quer', exampleHtml: 'Él <b>quiere</b> hablar contigo.', examplePt: 'Ele quer falar com você.', pos: 'verb' },
    { id: 'es_core_verbs_18', deckId: 'es_core_verbs', en: 'poder', pt: 'poder', exampleHtml: 'Quiero <b>poder</b> ayudarte.', examplePt: 'Quero poder te ajudar.', pos: 'verb' },
    { id: 'es_core_verbs_19', deckId: 'es_core_verbs', en: 'puedo', pt: 'eu posso', exampleHtml: 'No <b>puedo</b> ir hoy.', examplePt: 'Não posso ir hoje.', pos: 'verb' },
    { id: 'es_core_verbs_20', deckId: 'es_core_verbs', en: 'puedes', pt: 'você pode', exampleHtml: '¿Me <b>puedes</b> ayudar?', examplePt: 'Você pode me ajudar?', pos: 'verb' },
    { id: 'es_core_verbs_21', deckId: 'es_core_verbs', en: 'puede', pt: 'ele/ela pode', exampleHtml: 'Ella no <b>puede</b> venir.', examplePt: 'Ela não pode vir.', pos: 'verb' },
    { id: 'es_core_verbs_22', deckId: 'es_core_verbs', en: 'saber', pt: 'saber', exampleHtml: 'Quiero <b>saber</b> la verdad.', examplePt: 'Quero saber a verdade.', pos: 'verb' },
    { id: 'es_core_verbs_23', deckId: 'es_core_verbs', en: 'sé', pt: 'eu sei', exampleHtml: 'No <b>sé</b> qué decir.', examplePt: 'Não sei o que dizer.', pos: 'verb' },
    { id: 'es_core_verbs_24', deckId: 'es_core_verbs', en: 'sabes', pt: 'você sabe', exampleHtml: '¿<b>Sabes</b> dónde está?', examplePt: 'Você sabe onde está?', pos: 'verb' },
  ],
}

export const ES_QUESTIONS_DECK: Deck = {
  id: 'es_questions',
  name: 'Perguntar',
  emoji: '❓',
  desc: 'Quem, o que, onde, quando, como, quanto',
  level: 1,
  cards: [
    { id: 'es_questions_0', deckId: 'es_questions', en: 'qué', pt: 'o que', exampleHtml: '¿<b>Qué</b> quieres comer?', examplePt: 'O que você quer comer?', pos: 'word' },
    { id: 'es_questions_1', deckId: 'es_questions', en: 'quién', pt: 'quem', exampleHtml: '¿<b>Quién</b> te lo dijo?', examplePt: 'Quem te disse isso?', pos: 'word' },
    { id: 'es_questions_2', deckId: 'es_questions', en: 'dónde', pt: 'onde', exampleHtml: '¿<b>Dónde</b> está el baño?', examplePt: 'Onde fica o banheiro?', pos: 'word' },
    { id: 'es_questions_3', deckId: 'es_questions', en: 'cuándo', pt: 'quando', exampleHtml: '¿<b>Cuándo</b> llegas a casa?', examplePt: 'Quando você chega em casa?', pos: 'word' },
    { id: 'es_questions_4', deckId: 'es_questions', en: 'cómo', pt: 'como', exampleHtml: '¿<b>Cómo</b> se dice esto?', examplePt: 'Como se diz isso?', pos: 'word' },
    { id: 'es_questions_5', deckId: 'es_questions', en: 'cuánto', pt: 'quanto', exampleHtml: '¿<b>Cuánto</b> cuesta esto?', examplePt: 'Quanto custa isso?', pos: 'word' },
    { id: 'es_questions_6', deckId: 'es_questions', en: 'cuál', pt: 'qual', exampleHtml: '¿<b>Cuál</b> prefieres tú?', examplePt: 'Qual você prefere?', pos: 'word' },
    { id: 'es_questions_7', deckId: 'es_questions', en: 'a dónde', pt: 'aonde', exampleHtml: '¿<b>A dónde</b> vamos ahora?', examplePt: 'Aonde vamos agora?', pos: 'phrase' },
    { id: 'es_questions_8', deckId: 'es_questions', en: 'de dónde', pt: 'de onde', exampleHtml: '¿<b>De dónde</b> eres tú?', examplePt: 'De onde você é?', pos: 'phrase' },
    { id: 'es_questions_9', deckId: 'es_questions', en: 'qué tal', pt: 'que tal / como vai', exampleHtml: '¿<b>Qué tal</b> el trabajo nuevo?', examplePt: 'Que tal o trabalho novo?', pos: 'phrase' },
    { id: 'es_questions_10', deckId: 'es_questions', en: 'qué hora es', pt: 'que horas são', exampleHtml: 'Disculpe, ¿<b>qué hora es</b>?', examplePt: 'Com licença, que horas são?', pos: 'phrase' },
    { id: 'es_questions_11', deckId: 'es_questions', en: 'cuántos años', pt: 'quantos anos', exampleHtml: '¿<b>Cuántos años</b> tienes?', examplePt: 'Quantos anos você tem?', pos: 'phrase' },
    { id: 'es_questions_12', deckId: 'es_questions', en: 'no entiendo', pt: 'não entendo', exampleHtml: 'Perdón, <b>no entiendo</b> nada.', examplePt: 'Desculpa, não entendo nada.', pos: 'phrase' },
    { id: 'es_questions_13', deckId: 'es_questions', en: 'más despacio', pt: 'mais devagar', exampleHtml: 'Habla <b>más despacio</b>, por favor.', examplePt: 'Fala mais devagar, por favor.', pos: 'phrase' },
    { id: 'es_questions_14', deckId: 'es_questions', en: 'otra vez', pt: 'de novo', exampleHtml: '¿Puedes decirlo <b>otra vez</b>?', examplePt: 'Pode dizer de novo?', pos: 'phrase' },
  ],
}

export const ES_NUMBERS_DECK: Deck = {
  id: 'es_numbers',
  name: 'Números e tempo',
  emoji: '🔢',
  desc: 'Contar, dizer as horas, os dias da semana',
  level: 1,
  cards: [
    { id: 'es_numbers_0', deckId: 'es_numbers', en: 'uno', pt: 'um', exampleHtml: 'Solo queda <b>uno</b>.', examplePt: 'Só resta um.', pos: 'number' },
    { id: 'es_numbers_1', deckId: 'es_numbers', en: 'dos', pt: 'dois', exampleHtml: 'Tengo <b>dos</b> hermanas.', examplePt: 'Tenho duas irmãs.', pos: 'number' },
    { id: 'es_numbers_2', deckId: 'es_numbers', en: 'tres', pt: 'três', exampleHtml: 'Son <b>tres</b> semanas más.', examplePt: 'São mais três semanas.', pos: 'number' },
    { id: 'es_numbers_3', deckId: 'es_numbers', en: 'cuatro', pt: 'quatro', exampleHtml: 'Llegamos a las <b>cuatro</b>.', examplePt: 'Chegamos às quatro.', pos: 'number' },
    { id: 'es_numbers_4', deckId: 'es_numbers', en: 'cinco', pt: 'cinco', exampleHtml: 'Faltan <b>cinco</b> minutos.', examplePt: 'Faltam cinco minutos.', pos: 'number' },
    { id: 'es_numbers_5', deckId: 'es_numbers', en: 'seis', pt: 'seis', exampleHtml: 'Me levanto a las <b>seis</b>.', examplePt: 'Acordo às seis.', pos: 'number' },
    { id: 'es_numbers_6', deckId: 'es_numbers', en: 'siete', pt: 'sete', exampleHtml: 'Trabajo <b>siete</b> horas.', examplePt: 'Trabalho sete horas.', pos: 'number' },
    { id: 'es_numbers_7', deckId: 'es_numbers', en: 'ocho', pt: 'oito', exampleHtml: 'La cena es a las <b>ocho</b>.', examplePt: 'O jantar é às oito.', pos: 'number' },
    { id: 'es_numbers_8', deckId: 'es_numbers', en: 'nueve', pt: 'nove', exampleHtml: 'Abren a las <b>nueve</b>.', examplePt: 'Abrem às nove.', pos: 'number' },
    { id: 'es_numbers_9', deckId: 'es_numbers', en: 'diez', pt: 'dez', exampleHtml: 'Dame <b>diez</b> minutos.', examplePt: 'Me dá dez minutos.', pos: 'number' },
    { id: 'es_numbers_10', deckId: 'es_numbers', en: 'veinte', pt: 'vinte', exampleHtml: 'Cuesta <b>veinte</b> pesos.', examplePt: 'Custa vinte pesos.', pos: 'number' },
    { id: 'es_numbers_11', deckId: 'es_numbers', en: 'cien', pt: 'cem', exampleHtml: 'Son <b>cien</b> pesos exactos.', examplePt: 'São cem pesos exatos.', pos: 'number' },
    { id: 'es_numbers_12', deckId: 'es_numbers', en: 'mil', pt: 'mil', exampleHtml: 'Costó <b>mil</b> pesos.', examplePt: 'Custou mil pesos.', pos: 'number' },
    { id: 'es_numbers_13', deckId: 'es_numbers', en: 'lunes', pt: 'segunda-feira', exampleHtml: 'Nos vemos el <b>lunes</b>.', examplePt: 'A gente se vê na segunda.', pos: 'noun' },
    { id: 'es_numbers_14', deckId: 'es_numbers', en: 'martes', pt: 'terça-feira', exampleHtml: 'El <b>martes</b> tengo reunión.', examplePt: 'Na terça tenho reunião.', pos: 'noun' },
    { id: 'es_numbers_15', deckId: 'es_numbers', en: 'miércoles', pt: 'quarta-feira', exampleHtml: 'Llega el <b>miércoles</b> temprano.', examplePt: 'Chega na quarta cedo.', pos: 'noun' },
    { id: 'es_numbers_16', deckId: 'es_numbers', en: 'jueves', pt: 'quinta-feira', exampleHtml: 'El <b>jueves</b> estoy libre.', examplePt: 'Na quinta estou livre.', pos: 'noun' },
    { id: 'es_numbers_17', deckId: 'es_numbers', en: 'viernes', pt: 'sexta-feira', exampleHtml: 'Salimos el <b>viernes</b> por la noche.', examplePt: 'Saímos na sexta à noite.', pos: 'noun' },
    { id: 'es_numbers_18', deckId: 'es_numbers', en: 'sábado', pt: 'sábado', exampleHtml: 'El <b>sábado</b> voy al mercado.', examplePt: 'No sábado vou ao mercado.', pos: 'noun' },
    { id: 'es_numbers_19', deckId: 'es_numbers', en: 'domingo', pt: 'domingo', exampleHtml: 'Los <b>domingos</b> descanso.', examplePt: 'Aos domingos eu descanso.', pos: 'noun' },
    { id: 'es_numbers_20', deckId: 'es_numbers', en: 'hoy', pt: 'hoje', exampleHtml: '<b>Hoy</b> no tengo tiempo.', examplePt: 'Hoje não tenho tempo.', pos: 'word' },
    { id: 'es_numbers_21', deckId: 'es_numbers', en: 'mañana', pt: 'amanhã / manhã', exampleHtml: '<b>Mañana</b> te llamo temprano.', examplePt: 'Amanhã te ligo cedo.', pos: 'word' },
    { id: 'es_numbers_22', deckId: 'es_numbers', en: 'ayer', pt: 'ontem', exampleHtml: '<b>Ayer</b> llovió todo el día.', examplePt: 'Ontem choveu o dia todo.', pos: 'word' },
    { id: 'es_numbers_23', deckId: 'es_numbers', en: 'ahora', pt: 'agora', exampleHtml: 'No puedo hablar <b>ahora</b>.', examplePt: 'Não posso falar agora.', pos: 'word' },
    { id: 'es_numbers_24', deckId: 'es_numbers', en: 'siempre', pt: 'sempre', exampleHtml: '<b>Siempre</b> llega tarde.', examplePt: 'Sempre chega tarde.', pos: 'word' },
    { id: 'es_numbers_25', deckId: 'es_numbers', en: 'nunca', pt: 'nunca', exampleHtml: '<b>Nunca</b> he estado allí.', examplePt: 'Nunca estive lá.', pos: 'word' },
  ],
}

export const ES_THINGS_DECK: Deck = {
  id: 'es_things',
  name: 'Coisas e gente',
  emoji: '🧺',
  desc: 'As palavras do mundo em volta: casa, comida, família',
  level: 1,
  cards: [
    { id: 'es_things_0', deckId: 'es_things', en: 'el agua', pt: 'a água', exampleHtml: '¿Me das un poco de <b>agua</b>?', examplePt: 'Me dá um pouco de água?', pos: 'noun' },
    { id: 'es_things_1', deckId: 'es_things', en: 'la comida', pt: 'a comida', exampleHtml: 'La <b>comida</b> está deliciosa.', examplePt: 'A comida está deliciosa.', pos: 'noun' },
    { id: 'es_things_2', deckId: 'es_things', en: 'el pan', pt: 'o pão', exampleHtml: 'Compré <b>pan</b> esta mañana.', examplePt: 'Comprei pão hoje de manhã.', pos: 'noun' },
    { id: 'es_things_3', deckId: 'es_things', en: 'la carne', pt: 'a carne', exampleHtml: 'No como <b>carne</b> roja.', examplePt: 'Não como carne vermelha.', pos: 'noun' },
    { id: 'es_things_4', deckId: 'es_things', en: 'la fruta', pt: 'a fruta', exampleHtml: 'Prefiero <b>fruta</b> en la mañana.', examplePt: 'Prefiro fruta de manhã.', pos: 'noun' },
    { id: 'es_things_5', deckId: 'es_things', en: 'el café', pt: 'o café', exampleHtml: 'Tomo <b>café</b> sin azúcar.', examplePt: 'Tomo café sem açúcar.', pos: 'noun' },
    { id: 'es_things_6', deckId: 'es_things', en: 'la casa', pt: 'a casa', exampleHtml: 'Mi <b>casa</b> está cerca.', examplePt: 'Minha casa é perto.', pos: 'noun' },
    { id: 'es_things_7', deckId: 'es_things', en: 'la calle', pt: 'a rua', exampleHtml: 'Vivo en esta <b>calle</b>.', examplePt: 'Moro nesta rua.', pos: 'noun' },
    { id: 'es_things_8', deckId: 'es_things', en: 'el trabajo', pt: 'o trabalho', exampleHtml: 'Salgo del <b>trabajo</b> a las seis.', examplePt: 'Saio do trabalho às seis.', pos: 'noun' },
    { id: 'es_things_9', deckId: 'es_things', en: 'el dinero', pt: 'o dinheiro', exampleHtml: 'No traigo <b>dinero</b> encima.', examplePt: 'Não trago dinheiro comigo.', pos: 'noun' },
    { id: 'es_things_10', deckId: 'es_things', en: 'el tiempo', pt: 'o tempo', exampleHtml: 'No tengo <b>tiempo</b> hoy.', examplePt: 'Não tenho tempo hoje.', pos: 'noun' },
    { id: 'es_things_11', deckId: 'es_things', en: 'la gente', pt: 'as pessoas', exampleHtml: 'La <b>gente</b> aquí es amable.', examplePt: 'As pessoas aqui são gentis.', pos: 'noun' },
    { id: 'es_things_12', deckId: 'es_things', en: 'el amigo', pt: 'o amigo', exampleHtml: 'Es un <b>amigo</b> de la infancia.', examplePt: 'É um amigo de infância.', pos: 'noun' },
    { id: 'es_things_13', deckId: 'es_things', en: 'la familia', pt: 'a família', exampleHtml: 'Mi <b>familia</b> vive lejos.', examplePt: 'Minha família mora longe.', pos: 'noun' },
    { id: 'es_things_14', deckId: 'es_things', en: 'el hijo', pt: 'o filho', exampleHtml: 'Su <b>hijo</b> ya tiene diez.', examplePt: 'O filho dele já tem dez.', pos: 'noun' },
    { id: 'es_things_15', deckId: 'es_things', en: 'el hermano', pt: 'o irmão', exampleHtml: 'Mi <b>hermano</b> vive conmigo.', examplePt: 'Meu irmão mora comigo.', pos: 'noun' },
    { id: 'es_things_16', deckId: 'es_things', en: 'la mujer', pt: 'a mulher', exampleHtml: 'Esa <b>mujer</b> me ayudó mucho.', examplePt: 'Aquela mulher me ajudou muito.', pos: 'noun' },
    { id: 'es_things_17', deckId: 'es_things', en: 'el hombre', pt: 'o homem', exampleHtml: 'El <b>hombre</b> preguntó por ti.', examplePt: 'O homem perguntou por você.', pos: 'noun' },
    { id: 'es_things_18', deckId: 'es_things', en: 'grande', pt: 'grande', exampleHtml: 'La casa es muy <b>grande</b>.', examplePt: 'A casa é muito grande.', pos: 'adj' },
    { id: 'es_things_19', deckId: 'es_things', en: 'pequeño', pt: 'pequeno', exampleHtml: 'Es un cuarto <b>pequeño</b>.', examplePt: 'É um quarto pequeno.', pos: 'adj' },
    { id: 'es_things_20', deckId: 'es_things', en: 'bueno', pt: 'bom', exampleHtml: 'Fue un día muy <b>bueno</b>.', examplePt: 'Foi um dia muito bom.', pos: 'adj' },
    { id: 'es_things_21', deckId: 'es_things', en: 'malo', pt: 'ruim', exampleHtml: 'El clima está <b>malo</b> hoy.', examplePt: 'O tempo está ruim hoje.', pos: 'adj' },
    { id: 'es_things_22', deckId: 'es_things', en: 'caro', pt: 'caro', exampleHtml: 'Ese restaurante es <b>caro</b>.', examplePt: 'Aquele restaurante é caro.', pos: 'adj' },
    { id: 'es_things_23', deckId: 'es_things', en: 'barato', pt: 'barato', exampleHtml: 'Encontré uno más <b>barato</b>.', examplePt: 'Encontrei um mais barato.', pos: 'adj' },
    { id: 'es_things_24', deckId: 'es_things', en: 'cerca', pt: 'perto', exampleHtml: 'El mercado está <b>cerca</b>.', examplePt: 'O mercado é perto.', pos: 'adj' },
    { id: 'es_things_25', deckId: 'es_things', en: 'lejos', pt: 'longe', exampleHtml: 'Queda muy <b>lejos</b> de aquí.', examplePt: 'Fica muito longe daqui.', pos: 'adj' },
  ],
}

export const ES_BASIC_DECKS: Deck[] = [
  ES_HELLO_DECK,
  ES_CORE_VERBS_DECK,
  ES_QUESTIONS_DECK,
  ES_NUMBERS_DECK,
  ES_THINGS_DECK,
]
