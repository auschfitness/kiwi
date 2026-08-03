import type { Deck } from '../../types'

/**
 * Everyday Spanish for someone who already understands it.
 *
 * The target of every card is short — sixteen characters or fewer, with a part
 * of speech the engine will let him type (see `isTypable`), because typing the
 * Spanish from the Portuguese is the exercise this course exists for. The
 * grammar lives in the example sentence rather than in the target, and every
 * example is three to nine words so it also serves the sentence-building and
 * dictation exercises.
 *
 * Latin American Spanish: `ustedes` throughout, never `vosotros`; `carro` and
 * `computadora` rather than `coche` and `ordenador`.
 */

export const ES_REACT_DECK: Deck = {
  id: 'es_react',
  name: 'Reagir e opinar',
  emoji: '💬',
  desc: 'O que dizer quando entendeu tudo e travou na resposta',
  level: 1,
  cards: [
    { id: 'es_react_0', deckId: 'es_react', en: 'o sea', pt: 'ou seja', exampleHtml: 'No vino, <b>o sea</b>, se olvidó.', examplePt: 'Não veio, ou seja, esqueceu.', pos: 'phrase' },
    { id: 'es_react_1', deckId: 'es_react', en: 'de hecho', pt: 'na verdade / aliás', exampleHtml: '<b>De hecho</b>, ya lo terminé.', examplePt: 'Na verdade, já terminei.', pos: 'phrase' },
    { id: 'es_react_2', deckId: 'es_react', en: 'la verdad', pt: 'sinceramente', exampleHtml: '<b>La verdad</b>, no me convence.', examplePt: 'Sinceramente, não me convence.', pos: 'phrase' },
    { id: 'es_react_3', deckId: 'es_react', en: 'me da igual', pt: 'tanto faz pra mim', exampleHtml: 'Elige tú, <b>me da igual</b>.', examplePt: 'Escolhe você, tanto faz pra mim.', pos: 'phrase' },
    { id: 'es_react_4', deckId: 'es_react', en: 'ni modo', pt: 'fazer o quê / paciência', exampleHtml: 'Se canceló, <b>ni modo</b>.', examplePt: 'Foi cancelado, fazer o quê.', pos: 'phrase' },
    { id: 'es_react_5', deckId: 'es_react', en: 'a lo mejor', pt: 'talvez', exampleHtml: '<b>A lo mejor</b> llego tarde hoy.', examplePt: 'Talvez eu chegue tarde hoje.', pos: 'phrase' },
    { id: 'es_react_6', deckId: 'es_react', en: 'ojalá', pt: 'tomara / oxalá', exampleHtml: '<b>Ojalá</b> no llueva mañana.', examplePt: 'Tomara que não chova amanhã.', pos: 'word' },
    { id: 'es_react_7', deckId: 'es_react', en: 'menos mal', pt: 'ainda bem', exampleHtml: '<b>Menos mal</b> que avisaste antes.', examplePt: 'Ainda bem que você avisou antes.', pos: 'phrase' },
    { id: 'es_react_8', deckId: 'es_react', en: 'qué lástima', pt: 'que pena', exampleHtml: '<b>Qué lástima</b> que no puedas venir.', examplePt: 'Que pena que você não pode vir.', pos: 'phrase' },
    { id: 'es_react_9', deckId: 'es_react', en: 'en serio', pt: 'sério? / de verdade', exampleHtml: '¿<b>En serio</b> te dijo eso?', examplePt: 'Sério que ele te disse isso?', pos: 'phrase' },
    { id: 'es_react_10', deckId: 'es_react', en: 'o sea que', pt: 'quer dizer que', exampleHtml: '<b>O sea que</b> no vas a ir.', examplePt: 'Quer dizer que você não vai.', pos: 'phrase' },
    { id: 'es_react_11', deckId: 'es_react', en: 'estoy de acuerdo', pt: 'eu concordo', exampleHtml: '<b>Estoy de acuerdo</b> contigo.', examplePt: 'Eu concordo com você.', pos: 'phrase' },
    { id: 'es_react_12', deckId: 'es_react', en: 'no estoy seguro', pt: 'não tenho certeza', exampleHtml: '<b>No estoy seguro</b> de eso.', examplePt: 'Não tenho certeza disso.', pos: 'phrase' },
    { id: 'es_react_13', deckId: 'es_react', en: 'me parece', pt: 'eu acho / me parece', exampleHtml: 'Me <b>parece</b> una buena idea.', examplePt: 'Me parece uma boa ideia.', pos: 'verb' },
    { id: 'es_react_14', deckId: 'es_react', en: 'creo que', pt: 'eu acho que', exampleHtml: '<b>Creo que</b> vale la pena.', examplePt: 'Eu acho que vale a pena.', pos: 'phrase' },
    { id: 'es_react_15', deckId: 'es_react', en: 'vale la pena', pt: 'vale a pena', exampleHtml: 'Ese curso <b>vale la pena</b>.', examplePt: 'Esse curso vale a pena.', pos: 'phrase' },
    { id: 'es_react_16', deckId: 'es_react', en: 'da lo mismo', pt: 'dá no mesmo', exampleHtml: 'Hoy o mañana, <b>da lo mismo</b>.', examplePt: 'Hoje ou amanhã, dá no mesmo.', pos: 'phrase' },
    { id: 'es_react_17', deckId: 'es_react', en: 'por supuesto', pt: 'claro / com certeza', exampleHtml: '<b>Por supuesto</b> que te ayudo.', examplePt: 'Claro que eu te ajudo.', pos: 'phrase' },
    { id: 'es_react_18', deckId: 'es_react', en: 'ya veremos', pt: 'a gente vê / veremos', exampleHtml: 'No sé todavía, <b>ya veremos</b>.', examplePt: 'Ainda não sei, a gente vê.', pos: 'phrase' },
    { id: 'es_react_19', deckId: 'es_react', en: 'qué padre', pt: 'que legal (México)', exampleHtml: '¡<b>Qué padre</b> tu departamento!', examplePt: 'Que legal o seu apartamento!', pos: 'slang' },
    { id: 'es_react_20', deckId: 'es_react', en: 'qué chévere', pt: 'que legal (Caribe/Andes)', exampleHtml: '¡<b>Qué chévere</b> que viniste!', examplePt: 'Que legal que você veio!', pos: 'slang' },
    { id: 'es_react_21', deckId: 'es_react', en: 'no manches', pt: 'não brinca / fala sério', exampleHtml: '¿<b>No manches</b>, te ganaste eso?', examplePt: 'Fala sério, você ganhou isso?', pos: 'slang' },
    { id: 'es_react_22', deckId: 'es_react', en: 'ni idea', pt: 'nem ideia', exampleHtml: '<b>Ni idea</b> de dónde está.', examplePt: 'Nem ideia de onde está.', pos: 'phrase' },
    { id: 'es_react_23', deckId: 'es_react', en: 'tiene sentido', pt: 'faz sentido', exampleHtml: 'Ahora <b>tiene sentido</b> todo.', examplePt: 'Agora tudo faz sentido.', pos: 'phrase' },
    { id: 'es_react_24', deckId: 'es_react', en: 'me late', pt: 'curti / topo (México)', exampleHtml: 'Esa idea <b>me late</b> mucho.', examplePt: 'Curti muito essa ideia.', pos: 'slang' },
  ],
}

export const ES_CONNECT_DECK: Deck = {
  id: 'es_connect',
  name: 'Conectar ideias',
  emoji: '🔗',
  desc: 'As emendas que separam quem fala de quem enrola',
  level: 2,
  cards: [
    { id: 'es_connect_0', deckId: 'es_connect', en: 'sin embargo', pt: 'no entanto', exampleHtml: 'Es caro; <b>sin embargo</b>, funciona.', examplePt: 'É caro; no entanto, funciona.', pos: 'phrase' },
    { id: 'es_connect_1', deckId: 'es_connect', en: 'aunque', pt: 'embora / mesmo que', exampleHtml: 'Voy <b>aunque</b> esté lloviendo.', examplePt: 'Eu vou embora esteja chovendo.', pos: 'word' },
    { id: 'es_connect_2', deckId: 'es_connect', en: 'ya que', pt: 'já que', exampleHtml: '<b>Ya que</b> estás aquí, ayúdame.', examplePt: 'Já que você está aqui, me ajuda.', pos: 'phrase' },
    { id: 'es_connect_3', deckId: 'es_connect', en: 'por lo tanto', pt: 'portanto', exampleHtml: 'Llovió; <b>por lo tanto</b>, cancelamos.', examplePt: 'Choveu; portanto, cancelamos.', pos: 'phrase' },
    { id: 'es_connect_4', deckId: 'es_connect', en: 'además', pt: 'além disso', exampleHtml: 'Es rápido y <b>además</b> barato.', examplePt: 'É rápido e além disso barato.', pos: 'word' },
    { id: 'es_connect_5', deckId: 'es_connect', en: 'en cambio', pt: 'em compensação / já', exampleHtml: 'Ella llegó; él, <b>en cambio</b>, no.', examplePt: 'Ela chegou; ele, já, não.', pos: 'phrase' },
    { id: 'es_connect_6', deckId: 'es_connect', en: 'mientras que', pt: 'enquanto que', exampleHtml: 'Yo trabajo <b>mientras que</b> él duerme.', examplePt: 'Eu trabalho enquanto que ele dorme.', pos: 'phrase' },
    { id: 'es_connect_7', deckId: 'es_connect', en: 'a pesar de', pt: 'apesar de', exampleHtml: 'Salió <b>a pesar de</b> la lluvia.', examplePt: 'Saiu apesar da chuva.', pos: 'phrase' },
    { id: 'es_connect_8', deckId: 'es_connect', en: 'en cuanto', pt: 'assim que', exampleHtml: 'Te llamo <b>en cuanto</b> llegue.', examplePt: 'Te ligo assim que eu chegar.', pos: 'phrase' },
    { id: 'es_connect_9', deckId: 'es_connect', en: 'mientras tanto', pt: 'enquanto isso', exampleHtml: '<b>Mientras tanto</b>, revisa el correo.', examplePt: 'Enquanto isso, revise o e-mail.', pos: 'phrase' },
    { id: 'es_connect_10', deckId: 'es_connect', en: 'de todos modos', pt: 'de qualquer forma', exampleHtml: '<b>De todos modos</b> voy a intentarlo.', examplePt: 'De qualquer forma vou tentar.', pos: 'phrase' },
    { id: 'es_connect_11', deckId: 'es_connect', en: 'por cierto', pt: 'a propósito', exampleHtml: '<b>Por cierto</b>, ¿ya hablaste con ella?', examplePt: 'A propósito, você já falou com ela?', pos: 'phrase' },
    { id: 'es_connect_12', deckId: 'es_connect', en: 'es decir', pt: 'isto é', exampleHtml: 'Mañana, <b>es decir</b>, el martes.', examplePt: 'Amanhã, isto é, na terça.', pos: 'phrase' },
    { id: 'es_connect_13', deckId: 'es_connect', en: 'siempre que', pt: 'desde que / sempre que', exampleHtml: 'Te ayudo <b>siempre que</b> pueda.', examplePt: 'Eu te ajudo sempre que puder.', pos: 'phrase' },
    { id: 'es_connect_14', deckId: 'es_connect', en: 'a menos que', pt: 'a menos que', exampleHtml: 'No iré <b>a menos que</b> me llames.', examplePt: 'Não irei a menos que me ligue.', pos: 'phrase' },
    { id: 'es_connect_15', deckId: 'es_connect', en: 'en realidad', pt: 'na realidade', exampleHtml: '<b>En realidad</b> no fue tan difícil.', examplePt: 'Na realidade não foi tão difícil.', pos: 'phrase' },
    { id: 'es_connect_16', deckId: 'es_connect', en: 'por eso', pt: 'por isso', exampleHtml: '<b>Por eso</b> no quise ir.', examplePt: 'Por isso eu não quis ir.', pos: 'phrase' },
    { id: 'es_connect_17', deckId: 'es_connect', en: 'de repente', pt: 'de repente', exampleHtml: '<b>De repente</b> se apagó la luz.', examplePt: 'De repente a luz apagou.', pos: 'phrase' },
    { id: 'es_connect_18', deckId: 'es_connect', en: 'cada vez más', pt: 'cada vez mais', exampleHtml: 'Está <b>cada vez más</b> caro.', examplePt: 'Está cada vez mais caro.', pos: 'phrase' },
    { id: 'es_connect_19', deckId: 'es_connect', en: 'sobre todo', pt: 'sobretudo / principalmente', exampleHtml: 'Me gusta, <b>sobre todo</b> el final.', examplePt: 'Eu gosto, principalmente do final.', pos: 'phrase' },
  ],
}

export const ES_VERBS_DECK: Deck = {
  id: 'es_verbs',
  name: 'Verbos do dia a dia',
  emoji: '🏃',
  desc: 'Os que você usa toda hora e conjuga no chute',
  level: 1,
  cards: [
    { id: 'es_verbs_0', deckId: 'es_verbs', en: 'conseguir', pt: 'conseguir', exampleHtml: 'No <b>conseguí</b> hablar con él.', examplePt: 'Não consegui falar com ele.', pos: 'verb' },
    { id: 'es_verbs_1', deckId: 'es_verbs', en: 'tratar de', pt: 'tentar', exampleHtml: '<b>Traté de</b> avisarte ayer.', examplePt: 'Tentei te avisar ontem.', pos: 'verb' },
    { id: 'es_verbs_2', deckId: 'es_verbs', en: 'darse cuenta', pt: 'perceber / se dar conta', exampleHtml: 'No <b>me di cuenta</b> del error.', examplePt: 'Não percebi o erro.', pos: 'verb' },
    { id: 'es_verbs_3', deckId: 'es_verbs', en: 'acabar de', pt: 'acabar de', exampleHtml: '<b>Acabo de</b> llegar a casa.', examplePt: 'Acabei de chegar em casa.', pos: 'verb' },
    { id: 'es_verbs_4', deckId: 'es_verbs', en: 'ponerse', pt: 'ficar (mudança) / vestir', exampleHtml: 'Se <b>puso</b> muy nervioso ayer.', examplePt: 'Ele ficou muito nervoso ontem.', pos: 'verb' },
    { id: 'es_verbs_5', deckId: 'es_verbs', en: 'quedarse', pt: 'ficar (permanecer)', exampleHtml: 'Me <b>quedé</b> en casa el sábado.', examplePt: 'Fiquei em casa no sábado.', pos: 'verb' },
    { id: 'es_verbs_6', deckId: 'es_verbs', en: 'volverse', pt: 'tornar-se', exampleHtml: 'Eso se <b>volvió</b> un problema.', examplePt: 'Isso se tornou um problema.', pos: 'verb' },
    { id: 'es_verbs_7', deckId: 'es_verbs', en: 'soler', pt: 'costumar', exampleHtml: '<b>Suelo</b> levantarme temprano.', examplePt: 'Costumo acordar cedo.', pos: 'verb' },
    { id: 'es_verbs_8', deckId: 'es_verbs', en: 'echar de menos', pt: 'sentir falta', exampleHtml: '<b>Echo de menos</b> a mi familia.', examplePt: 'Sinto falta da minha família.', pos: 'verb' },
    { id: 'es_verbs_9', deckId: 'es_verbs', en: 'extrañar', pt: 'sentir saudade', exampleHtml: 'Te <b>extraño</b> mucho, en serio.', examplePt: 'Sinto muita saudade de você.', pos: 'verb' },
    { id: 'es_verbs_10', deckId: 'es_verbs', en: 'apurarse', pt: 'se apressar', exampleHtml: '<b>Apúrate</b> que ya es tarde.', examplePt: 'Se apressa que já é tarde.', pos: 'verb' },
    { id: 'es_verbs_11', deckId: 'es_verbs', en: 'lograr', pt: 'conseguir / lograr', exampleHtml: '<b>Logré</b> terminar el proyecto.', examplePt: 'Consegui terminar o projeto.', pos: 'verb' },
    { id: 'es_verbs_12', deckId: 'es_verbs', en: 'atender', pt: 'atender / cuidar de', exampleHtml: 'Ella <b>atiende</b> a los clientes.', examplePt: 'Ela atende os clientes.', pos: 'verb' },
    { id: 'es_verbs_13', deckId: 'es_verbs', en: 'arreglar', pt: 'consertar / resolver', exampleHtml: 'Voy a <b>arreglar</b> la impresora.', examplePt: 'Vou consertar a impressora.', pos: 'verb' },
    { id: 'es_verbs_14', deckId: 'es_verbs', en: 'aprovechar', pt: 'aproveitar', exampleHtml: 'Hay que <b>aprovechar</b> la oferta.', examplePt: 'Tem que aproveitar a oferta.', pos: 'verb' },
    { id: 'es_verbs_15', deckId: 'es_verbs', en: 'enterarse', pt: 'ficar sabendo', exampleHtml: 'Me <b>enteré</b> por el periódico.', examplePt: 'Fiquei sabendo pelo jornal.', pos: 'verb' },
    { id: 'es_verbs_16', deckId: 'es_verbs', en: 'hacer falta', pt: 'fazer falta / precisar', exampleHtml: 'Nos <b>hace falta</b> más tiempo.', examplePt: 'Precisamos de mais tempo.', pos: 'verb' },
    { id: 'es_verbs_17', deckId: 'es_verbs', en: 'tener ganas', pt: 'estar a fim', exampleHtml: 'No <b>tengo ganas</b> de salir.', examplePt: 'Não estou a fim de sair.', pos: 'verb' },
    { id: 'es_verbs_18', deckId: 'es_verbs', en: 'dar con', pt: 'encontrar / dar com', exampleHtml: 'Por fin <b>di con</b> la respuesta.', examplePt: 'Enfim encontrei a resposta.', pos: 'verb' },
    { id: 'es_verbs_19', deckId: 'es_verbs', en: 'hacerse cargo', pt: 'assumir / se encarregar', exampleHtml: 'Ella se <b>hizo cargo</b> del equipo.', examplePt: 'Ela assumiu a equipe.', pos: 'verb' },
    { id: 'es_verbs_20', deckId: 'es_verbs', en: 'llevarse bien', pt: 'se dar bem', exampleHtml: 'Me <b>llevo bien</b> con todos.', examplePt: 'Me dou bem com todos.', pos: 'verb' },
    { id: 'es_verbs_21', deckId: 'es_verbs', en: 'meter la pata', pt: 'pisar na bola', exampleHtml: 'Perdón, <b>metí la pata</b> ayer.', examplePt: 'Desculpa, pisei na bola ontem.', pos: 'verb' },
    { id: 'es_verbs_22', deckId: 'es_verbs', en: 'valer', pt: 'valer / custar', exampleHtml: '¿Cuánto <b>vale</b> este libro?', examplePt: 'Quanto custa este livro?', pos: 'verb' },
    { id: 'es_verbs_23', deckId: 'es_verbs', en: 'pedir', pt: 'pedir', exampleHtml: 'Voy a <b>pedir</b> la cuenta.', examplePt: 'Vou pedir a conta.', pos: 'verb' },
    { id: 'es_verbs_24', deckId: 'es_verbs', en: 'preguntar', pt: 'perguntar', exampleHtml: 'Te quiero <b>preguntar</b> algo.', examplePt: 'Quero te perguntar uma coisa.', pos: 'verb' },
  ],
}

export const ES_CONVERSATION_DECKS: Deck[] = [ES_REACT_DECK, ES_CONNECT_DECK, ES_VERBS_DECK]
