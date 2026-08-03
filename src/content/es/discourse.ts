import type { Deck } from '../../types'

/**
 * The difference between getting by and holding forth.
 *
 * Everything before this deck serves transactions: order, ask, resolve,
 * react. This is the machinery of an *argument* — introducing a position,
 * qualifying it, conceding a point, giving an example, changing tack,
 * summing up. Without it a fluent-sounding speaker still runs out of road
 * after two sentences on any topic that matters.
 */
export const ES_ARGUE_DECK: Deck = {
  id: 'es_argue',
  name: 'Argumentar e discorrer',
  emoji: '🗨️',
  desc: 'Sustentar uma ideia por mais de duas frases',
  level: 3,
  cards: [
    { id: 'es_argue_0', deckId: 'es_argue', en: 'por un lado', pt: 'por um lado', exampleHtml: '<b>Por un lado</b> es más barato.', examplePt: 'Por um lado é mais barato.', pos: 'phrase' },
    { id: 'es_argue_1', deckId: 'es_argue', en: 'por otro lado', pt: 'por outro lado', exampleHtml: '<b>Por otro lado</b> lleva más tiempo.', examplePt: 'Por outro lado leva mais tempo.', pos: 'phrase' },
    { id: 'es_argue_2', deckId: 'es_argue', en: 'en primer lugar', pt: 'em primeiro lugar', exampleHtml: '<b>En primer lugar</b>, no hay presupuesto.', examplePt: 'Em primeiro lugar, não há orçamento.', pos: 'phrase' },
    { id: 'es_argue_3', deckId: 'es_argue', en: 'por último', pt: 'por último', exampleHtml: 'Y <b>por último</b>, falta tiempo.', examplePt: 'E por último, falta tempo.', pos: 'phrase' },
    { id: 'es_argue_4', deckId: 'es_argue', en: 'en resumen', pt: 'resumindo', exampleHtml: '<b>En resumen</b>, no conviene ahora.', examplePt: 'Resumindo, não convém agora.', pos: 'phrase' },
    { id: 'es_argue_5', deckId: 'es_argue', en: 'a fin de cuentas', pt: 'no fim das contas', exampleHtml: '<b>A fin de cuentas</b>, salió bien.', examplePt: 'No fim das contas, deu certo.', pos: 'phrase' },
    { id: 'es_argue_6', deckId: 'es_argue', en: 'cabe destacar', pt: 'vale destacar', exampleHtml: '<b>Cabe destacar</b> que fue rápido.', examplePt: 'Vale destacar que foi rápido.', pos: 'phrase' },
    { id: 'es_argue_7', deckId: 'es_argue', en: 'por ejemplo', pt: 'por exemplo', exampleHtml: 'Piensa en algo simple, <b>por ejemplo</b> esto.', examplePt: 'Pensa em algo simples, por exemplo isto.', pos: 'phrase' },
    { id: 'es_argue_8', deckId: 'es_argue', en: 'tal como', pt: 'assim como', exampleHtml: 'Ocurrió <b>tal como</b> lo dijiste.', examplePt: 'Aconteceu assim como você disse.', pos: 'phrase' },
    { id: 'es_argue_9', deckId: 'es_argue', en: 'es decir que', pt: 'ou seja que', exampleHtml: '<b>Es decir que</b> perdimos el plazo.', examplePt: 'Ou seja que perdemos o prazo.', pos: 'phrase' },
    { id: 'es_argue_10', deckId: 'es_argue', en: 'dicho esto', pt: 'dito isso', exampleHtml: '<b>Dicho esto</b>, vale intentarlo.', examplePt: 'Dito isso, vale tentar.', pos: 'phrase' },
    { id: 'es_argue_11', deckId: 'es_argue', en: 'aun así', pt: 'ainda assim', exampleHtml: 'Es caro; <b>aun así</b> lo compré.', examplePt: 'É caro; ainda assim comprei.', pos: 'phrase' },
    { id: 'es_argue_12', deckId: 'es_argue', en: 'de hecho que', pt: 'tanto que', exampleHtml: 'Le gustó, <b>de hecho que</b> volvió.', examplePt: 'Ele gostou, tanto que voltou.', pos: 'phrase' },
    { id: 'es_argue_13', deckId: 'es_argue', en: 'según', pt: 'segundo / conforme', exampleHtml: '<b>Según</b> el informe, subió mucho.', examplePt: 'Segundo o relatório, subiu muito.', pos: 'word' },
    { id: 'es_argue_14', deckId: 'es_argue', en: 'a mi parecer', pt: 'a meu ver', exampleHtml: '<b>A mi parecer</b> falta claridad.', examplePt: 'A meu ver falta clareza.', pos: 'phrase' },
    { id: 'es_argue_15', deckId: 'es_argue', en: 'desde mi punto', pt: 'do meu ponto de vista', exampleHtml: '<b>Desde mi punto</b> de vista funciona.', examplePt: 'Do meu ponto de vista funciona.', pos: 'phrase' },
    { id: 'es_argue_16', deckId: 'es_argue', en: 'estoy en contra', pt: 'sou contra', exampleHtml: '<b>Estoy en contra</b> de esa idea.', examplePt: 'Sou contra essa ideia.', pos: 'phrase' },
    { id: 'es_argue_17', deckId: 'es_argue', en: 'estoy a favor', pt: 'sou a favor', exampleHtml: '<b>Estoy a favor</b> del cambio.', examplePt: 'Sou a favor da mudança.', pos: 'phrase' },
    { id: 'es_argue_18', deckId: 'es_argue', en: 'hasta cierto punto', pt: 'até certo ponto', exampleHtml: 'Tienes razón <b>hasta cierto punto</b>.', examplePt: 'Você tem razão até certo ponto.', pos: 'phrase' },
    { id: 'es_argue_19', deckId: 'es_argue', en: 'no necesariamente', pt: 'não necessariamente', exampleHtml: 'Eso <b>no necesariamente</b> es cierto.', examplePt: 'Isso não necessariamente é verdade.', pos: 'phrase' },
    { id: 'es_argue_20', deckId: 'es_argue', en: 'todo depende', pt: 'tudo depende', exampleHtml: '<b>Todo depende</b> del contexto.', examplePt: 'Tudo depende do contexto.', pos: 'phrase' },
    { id: 'es_argue_21', deckId: 'es_argue', en: 'en el fondo', pt: 'no fundo', exampleHtml: '<b>En el fondo</b> pensamos igual.', examplePt: 'No fundo a gente pensa igual.', pos: 'phrase' },
    { id: 'es_argue_22', deckId: 'es_argue', en: 'suele pasar', pt: 'costuma acontecer', exampleHtml: 'Eso <b>suele pasar</b> al principio.', examplePt: 'Isso costuma acontecer no começo.', pos: 'phrase' },
    { id: 'es_argue_23', deckId: 'es_argue', en: 'vale la pena que', pt: 'vale a pena que', exampleHtml: '<b>Vale la pena que</b> lo intentes.', examplePt: 'Vale a pena que você tente.', pos: 'phrase' },
    { id: 'es_argue_24', deckId: 'es_argue', en: 'lo cierto es', pt: 'a verdade é', exampleHtml: '<b>Lo cierto es</b> que nadie sabe.', examplePt: 'A verdade é que ninguém sabe.', pos: 'phrase' },
    { id: 'es_argue_25', deckId: 'es_argue', en: 'sin ir más lejos', pt: 'sem ir longe', exampleHtml: '<b>Sin ir más lejos</b>, mira ayer.', examplePt: 'Sem ir longe, olha ontem.', pos: 'phrase' },
    { id: 'es_argue_26', deckId: 'es_argue', en: 'en pocas palabras', pt: 'em poucas palavras', exampleHtml: '<b>En pocas palabras</b>, no funcionó.', examplePt: 'Em poucas palavras, não funcionou.', pos: 'phrase' },
    { id: 'es_argue_27', deckId: 'es_argue', en: 'a diferencia de', pt: 'diferente de', exampleHtml: '<b>A diferencia de</b> antes, hoy sirve.', examplePt: 'Diferente de antes, hoje serve.', pos: 'phrase' },
    { id: 'es_argue_28', deckId: 'es_argue', en: 'al contrario', pt: 'pelo contrário', exampleHtml: 'No me molestó, <b>al contrario</b>.', examplePt: 'Não me incomodou, pelo contrário.', pos: 'phrase' },
    { id: 'es_argue_29', deckId: 'es_argue', en: 'me atrevería a', pt: 'eu arriscaria a', exampleHtml: '<b>Me atrevería a</b> decir que sí.', examplePt: 'Eu arriscaria dizer que sim.', pos: 'phrase' },
    { id: 'es_argue_30', deckId: 'es_argue', en: 'planteo', pt: 'proposta / colocação', exampleHtml: 'Su <b>planteo</b> tiene sentido.', examplePt: 'A colocação dele faz sentido.', pos: 'noun' },
    { id: 'es_argue_31', deckId: 'es_argue', en: 'el argumento', pt: 'o argumento', exampleHtml: 'Ese <b>argumento</b> no me convence.', examplePt: 'Esse argumento não me convence.', pos: 'noun' },
    { id: 'es_argue_32', deckId: 'es_argue', en: 'el enfoque', pt: 'a abordagem', exampleHtml: 'Prefiero otro <b>enfoque</b> aquí.', examplePt: 'Prefiro outra abordagem aqui.', pos: 'noun' },
    { id: 'es_argue_33', deckId: 'es_argue', en: 'la ventaja', pt: 'a vantagem', exampleHtml: 'La gran <b>ventaja</b> es el precio.', examplePt: 'A grande vantagem é o preço.', pos: 'noun' },
    { id: 'es_argue_34', deckId: 'es_argue', en: 'la desventaja', pt: 'a desvantagem', exampleHtml: 'La <b>desventaja</b> es la distancia.', examplePt: 'A desvantagem é a distância.', pos: 'noun' },
    { id: 'es_argue_35', deckId: 'es_argue', en: 'plantear', pt: 'propor / colocar', exampleHtml: 'Quiero <b>plantear</b> otra opción.', examplePt: 'Quero propor outra opção.', pos: 'verb' },
    { id: 'es_argue_36', deckId: 'es_argue', en: 'destacar', pt: 'destacar', exampleHtml: 'Quiero <b>destacar</b> un detalle.', examplePt: 'Quero destacar um detalhe.', pos: 'verb' },
    { id: 'es_argue_37', deckId: 'es_argue', en: 'señalar', pt: 'apontar', exampleHtml: 'Vale <b>señalar</b> ese riesgo.', examplePt: 'Vale apontar esse risco.', pos: 'verb' },
    { id: 'es_argue_38', deckId: 'es_argue', en: 'reconocer', pt: 'reconhecer', exampleHtml: 'Hay que <b>reconocer</b> el error.', examplePt: 'Tem que reconhecer o erro.', pos: 'verb' },
    { id: 'es_argue_39', deckId: 'es_argue', en: 'matizar', pt: 'ponderar / nuançar', exampleHtml: 'Déjame <b>matizar</b> lo que dije.', examplePt: 'Deixa eu ponderar o que eu disse.', pos: 'verb' },
  ],
}

/**
 * Something to hold forth *about*.
 *
 * "Discorrer sobre tópicos diversos" is a vocabulary problem before it is a
 * grammar one: a speaker with only concrete nouns can describe a room and not
 * an opinion about housing. These are the abstract nouns that carry an adult
 * conversation about anything in the news.
 */
export const ES_TOPICS_DECK: Deck = {
  id: 'es_topics',
  name: 'Assuntos do mundo',
  emoji: '🌐',
  desc: 'Política, economia, tecnologia, saúde — ter o que dizer',
  level: 3,
  cards: [
    { id: 'es_topics_0', deckId: 'es_topics', en: 'el gobierno', pt: 'o governo', exampleHtml: 'El <b>gobierno</b> anunció el plan.', examplePt: 'O governo anunciou o plano.', pos: 'noun' },
    { id: 'es_topics_1', deckId: 'es_topics', en: 'la ley', pt: 'a lei', exampleHtml: 'La nueva <b>ley</b> entra en vigor.', examplePt: 'A nova lei entra em vigor.', pos: 'noun' },
    { id: 'es_topics_2', deckId: 'es_topics', en: 'el derecho', pt: 'o direito', exampleHtml: 'Es un <b>derecho</b> de todos.', examplePt: 'É um direito de todos.', pos: 'noun' },
    { id: 'es_topics_3', deckId: 'es_topics', en: 'la desigualdad', pt: 'a desigualdade', exampleHtml: 'La <b>desigualdad</b> sigue creciendo.', examplePt: 'A desigualdade continua crescendo.', pos: 'noun' },
    { id: 'es_topics_4', deckId: 'es_topics', en: 'el impuesto', pt: 'o imposto', exampleHtml: 'Subieron el <b>impuesto</b> otra vez.', examplePt: 'Aumentaram o imposto de novo.', pos: 'noun' },
    { id: 'es_topics_5', deckId: 'es_topics', en: 'la inflación', pt: 'a inflação', exampleHtml: 'La <b>inflación</b> golpeó fuerte.', examplePt: 'A inflação bateu forte.', pos: 'noun' },
    { id: 'es_topics_6', deckId: 'es_topics', en: 'el desempleo', pt: 'o desemprego', exampleHtml: 'El <b>desempleo</b> bajó este año.', examplePt: 'O desemprego caiu este ano.', pos: 'noun' },
    { id: 'es_topics_7', deckId: 'es_topics', en: 'la inversión', pt: 'o investimento', exampleHtml: 'Es una <b>inversión</b> a largo plazo.', examplePt: 'É um investimento a longo prazo.', pos: 'noun' },
    { id: 'es_topics_8', deckId: 'es_topics', en: 'la deuda', pt: 'a dívida', exampleHtml: 'Terminé de pagar la <b>deuda</b>.', examplePt: 'Terminei de pagar a dívida.', pos: 'noun' },
    { id: 'es_topics_9', deckId: 'es_topics', en: 'el ahorro', pt: 'a economia (poupança)', exampleHtml: 'El <b>ahorro</b> se fue en el viaje.', examplePt: 'A poupança foi embora na viagem.', pos: 'noun' },
    { id: 'es_topics_10', deckId: 'es_topics', en: 'la empresa', pt: 'a empresa', exampleHtml: 'La <b>empresa</b> cambió de dueño.', examplePt: 'A empresa mudou de dono.', pos: 'noun' },
    { id: 'es_topics_11', deckId: 'es_topics', en: 'el mercado', pt: 'o mercado', exampleHtml: 'El <b>mercado</b> reaccionó mal.', examplePt: 'O mercado reagiu mal.', pos: 'noun' },
    { id: 'es_topics_12', deckId: 'es_topics', en: 'el riesgo', pt: 'o risco', exampleHtml: 'Vale la pena correr el <b>riesgo</b>.', examplePt: 'Vale a pena correr o risco.', pos: 'noun' },
    { id: 'es_topics_13', deckId: 'es_topics', en: 'el avance', pt: 'o avanço', exampleHtml: 'Fue un <b>avance</b> importante.', examplePt: 'Foi um avanço importante.', pos: 'noun' },
    { id: 'es_topics_14', deckId: 'es_topics', en: 'la herramienta', pt: 'a ferramenta', exampleHtml: 'Esa <b>herramienta</b> me salvó.', examplePt: 'Essa ferramenta me salvou.', pos: 'noun' },
    { id: 'es_topics_15', deckId: 'es_topics', en: 'el dispositivo', pt: 'o dispositivo', exampleHtml: 'El <b>dispositivo</b> se calienta mucho.', examplePt: 'O dispositivo esquenta muito.', pos: 'noun' },
    { id: 'es_topics_16', deckId: 'es_topics', en: 'la red', pt: 'a rede', exampleHtml: 'La <b>red</b> está muy lenta hoy.', examplePt: 'A rede está muito lenta hoje.', pos: 'noun' },
    { id: 'es_topics_17', deckId: 'es_topics', en: 'los datos', pt: 'os dados', exampleHtml: 'Los <b>datos</b> dicen otra cosa.', examplePt: 'Os dados dizem outra coisa.', pos: 'noun' },
    { id: 'es_topics_18', deckId: 'es_topics', en: 'la privacidad', pt: 'a privacidade', exampleHtml: 'Me preocupa la <b>privacidad</b>.', examplePt: 'Me preocupa a privacidade.', pos: 'noun' },
    { id: 'es_topics_19', deckId: 'es_topics', en: 'el ambiente', pt: 'o ambiente / clima', exampleHtml: 'Cuidar el medio <b>ambiente</b> urge.', examplePt: 'Cuidar do meio ambiente é urgente.', pos: 'noun' },
    { id: 'es_topics_20', deckId: 'es_topics', en: 'climático', pt: 'climático', exampleHtml: 'Hablaron del cambio <b>climático</b>.', examplePt: 'Falaram da mudança climática.', pos: 'adj' },
    { id: 'es_topics_21', deckId: 'es_topics', en: 'la contaminación', pt: 'a poluição', exampleHtml: 'La <b>contaminación</b> empeoró mucho.', examplePt: 'A poluição piorou muito.', pos: 'noun' },
    { id: 'es_topics_22', deckId: 'es_topics', en: 'el reciclaje', pt: 'a reciclagem', exampleHtml: 'El <b>reciclaje</b> ayuda bastante.', examplePt: 'A reciclagem ajuda bastante.', pos: 'noun' },
    { id: 'es_topics_23', deckId: 'es_topics', en: 'la salud', pt: 'a saúde', exampleHtml: 'La <b>salud</b> viene primero.', examplePt: 'A saúde vem em primeiro lugar.', pos: 'noun' },
    { id: 'es_topics_24', deckId: 'es_topics', en: 'el tratamiento', pt: 'o tratamento', exampleHtml: 'El <b>tratamiento</b> dura un mes.', examplePt: 'O tratamento dura um mês.', pos: 'noun' },
    { id: 'es_topics_25', deckId: 'es_topics', en: 'la enfermedad', pt: 'a doença', exampleHtml: 'Es una <b>enfermedad</b> común.', examplePt: 'É uma doença comum.', pos: 'noun' },
    { id: 'es_topics_26', deckId: 'es_topics', en: 'la educación', pt: 'a educação', exampleHtml: 'La <b>educación</b> cambia todo.', examplePt: 'A educação muda tudo.', pos: 'noun' },
    { id: 'es_topics_27', deckId: 'es_topics', en: 'la carrera', pt: 'a carreira / o curso', exampleHtml: 'Cambió de <b>carrera</b> a los treinta.', examplePt: 'Mudou de carreira aos trinta.', pos: 'noun' },
    { id: 'es_topics_28', deckId: 'es_topics', en: 'la investigación', pt: 'a pesquisa científica', exampleHtml: 'La <b>investigación</b> tardó años.', examplePt: 'A pesquisa demorou anos.', pos: 'noun' },
    { id: 'es_topics_29', deckId: 'es_topics', en: 'la cultura', pt: 'a cultura', exampleHtml: 'La <b>cultura</b> local me encanta.', examplePt: 'A cultura local me encanta.', pos: 'noun' },
    { id: 'es_topics_30', deckId: 'es_topics', en: 'la costumbre', pt: 'o costume', exampleHtml: 'Es una <b>costumbre</b> de aquí.', examplePt: 'É um costume daqui.', pos: 'noun' },
    { id: 'es_topics_31', deckId: 'es_topics', en: 'la sociedad', pt: 'a sociedade', exampleHtml: 'La <b>sociedad</b> cambió mucho.', examplePt: 'A sociedade mudou muito.', pos: 'noun' },
    { id: 'es_topics_32', deckId: 'es_topics', en: 'la ciudadanía', pt: 'a cidadania', exampleHtml: 'Pidió la <b>ciudadanía</b> el año pasado.', examplePt: 'Pediu a cidadania no ano passado.', pos: 'noun' },
    { id: 'es_topics_33', deckId: 'es_topics', en: 'el vínculo', pt: 'o vínculo', exampleHtml: 'Hay un <b>vínculo</b> muy fuerte.', examplePt: 'Existe um vínculo muito forte.', pos: 'noun' },
    { id: 'es_topics_34', deckId: 'es_topics', en: 'el reto', pt: 'o desafio', exampleHtml: 'Fue un <b>reto</b> enorme para todos.', examplePt: 'Foi um desafio enorme para todos.', pos: 'noun' },
    { id: 'es_topics_35', deckId: 'es_topics', en: 'la brecha', pt: 'o abismo / a lacuna', exampleHtml: 'La <b>brecha</b> se hizo más grande.', examplePt: 'O abismo ficou maior.', pos: 'noun' },
    { id: 'es_topics_36', deckId: 'es_topics', en: 'el aporte', pt: 'a contribuição', exampleHtml: 'Su <b>aporte</b> fue decisivo.', examplePt: 'A contribuição dele foi decisiva.', pos: 'noun' },
    { id: 'es_topics_37', deckId: 'es_topics', en: 'la tendencia', pt: 'a tendência', exampleHtml: 'Es una <b>tendencia</b> mundial.', examplePt: 'É uma tendência mundial.', pos: 'noun' },
    { id: 'es_topics_38', deckId: 'es_topics', en: 'el impacto', pt: 'o impacto', exampleHtml: 'El <b>impacto</b> fue inmediato.', examplePt: 'O impacto foi imediato.', pos: 'noun' },
    { id: 'es_topics_39', deckId: 'es_topics', en: 'la medida', pt: 'a medida', exampleHtml: 'La <b>medida</b> no gustó a nadie.', examplePt: 'A medida não agradou ninguém.', pos: 'noun' },
  ],
}

export const ES_DISCOURSE_DECKS: Deck[] = [ES_ARGUE_DECK, ES_TOPICS_DECK]
