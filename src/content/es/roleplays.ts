import type { Roleplay } from '../authored/roleplays'

/**
 * Spoken scenes in Spanish, for a learner who understands everything and
 * produces nothing.
 *
 * Same rules as the English table: every `you` line is sayable in one breath,
 * carries `accept` variants for genuinely different phrasings, and its `pt` is
 * a hint about what to convey rather than a translation to read off. No line
 * asks for his own name, so no turn can only be failed.
 *
 * Latin American throughout: `ustedes`, `carro`, `¿mande?`, `ahorita`.
 */
export const ES_ROLEPLAYS: Roleplay[] = [
  {
    id: 'es_cafe',
    title: 'No café',
    emoji: '☕',
    level: 1,
    context: 'Você chega num café. O atendente olha para você.',
    turns: [
      { speaker: 'them', en: '¡Buenos días! ¿Qué le sirvo?', pt: 'Bom dia! O que vai querer?' },
      { speaker: 'you', en: 'Un café con leche, por favor', pt: 'Peça um café com leite', accept: ['un café con leche', 'quiero un café con leche', 'me da un café con leche'] },
      { speaker: 'them', en: '¿Para tomar aquí o para llevar?', pt: 'Para comer aqui ou para viagem?' },
      { speaker: 'you', en: 'Para llevar', pt: 'Diga que é para viagem', accept: ['para llevar por favor', 'es para llevar'] },
      { speaker: 'them', en: '¿Algo más? Tenemos pan dulce recién hecho.', pt: 'Mais alguma coisa? Temos pão doce fresquinho.' },
      { speaker: 'you', en: 'No, así está bien', pt: 'Recuse educadamente', accept: ['no gracias', 'no, gracias', 'así está bien'] },
      { speaker: 'them', en: 'Son cincuenta pesos, por favor.', pt: 'São cinquenta pesos, por favor.' },
      { speaker: 'you', en: '¿Puedo pagar con tarjeta?', pt: 'Pergunte se pode pagar no cartão', accept: ['con tarjeta', 'puedo pagar con tarjeta', 'acepta tarjeta'] },
      { speaker: 'them', en: 'Claro que sí. Aquí tiene, que le vaya bien.', pt: 'Claro que sim. Aqui está, tudo de bom.' },
    ],
  },
  {
    id: 'es_restaurant',
    title: 'No restaurante',
    emoji: '🍽️',
    level: 1,
    context: 'Você senta numa mesa. O garçom traz o cardápio.',
    turns: [
      { speaker: 'them', en: 'Buenas tardes. ¿Ya sabe qué va a pedir?', pt: 'Boa tarde. Já sabe o que vai pedir?' },
      { speaker: 'you', en: 'Todavía no, un momento', pt: 'Peça um minutinho', accept: ['un momento por favor', 'todavía no', 'deme un minuto'] },
      { speaker: 'them', en: 'Con confianza. ¿Le traigo algo de tomar?', pt: 'Fique à vontade. Trago algo para beber?' },
      { speaker: 'you', en: 'Agua sin gas, por favor', pt: 'Peça água sem gás', accept: ['un agua sin gas', 'agua natural', 'agua sin gas'] },
      { speaker: 'them', en: '¿Y para comer? El pescado está muy bueno hoy.', pt: 'E para comer? O peixe está ótimo hoje.' },
      { speaker: 'you', en: 'Entonces el pescado', pt: 'Aceite a sugestão', accept: ['quiero el pescado', 'el pescado por favor', 'voy a pedir el pescado'] },
      { speaker: 'them', en: 'Excelente elección. ¿Algún ingrediente que no coma?', pt: 'Ótima escolha. Algum ingrediente que não come?' },
      { speaker: 'you', en: 'No como cebolla', pt: 'Diga que não come cebola', accept: ['sin cebolla', 'no como cebolla', 'soy alérgico a la cebolla'] },
      { speaker: 'them', en: 'Perfecto, sin cebolla. Enseguida se lo traigo.', pt: 'Perfeito, sem cebola. Já trago.' },
      { speaker: 'you', en: 'La cuenta, por favor', pt: 'Peça a conta no final', accept: ['me trae la cuenta', 'la cuenta por favor', 'nos trae la cuenta'] },
    ],
  },
  {
    id: 'es_hotel',
    title: 'No hotel',
    emoji: '🏨',
    level: 1,
    context: 'Você chega na recepção do hotel com a mala.',
    turns: [
      { speaker: 'them', en: 'Bienvenido. ¿Tiene reservación?', pt: 'Bem-vindo. Tem reserva?' },
      { speaker: 'you', en: 'Sí, a mi nombre', pt: 'Confirme que sim', accept: ['sí tengo reservación', 'sí, tengo una reservación', 'sí a mi nombre'] },
      { speaker: 'them', en: 'Muy bien. ¿Cuántas noches se queda?', pt: 'Muito bem. Quantas noites vai ficar?' },
      { speaker: 'you', en: 'Tres noches', pt: 'Diga que são três noites', accept: ['son tres noches', 'me quedo tres noches', 'tres'] },
      { speaker: 'them', en: 'Le doy la habitación doscientos cuatro, segundo piso.', pt: 'Vou te dar o quarto duzentos e quatro, segundo andar.' },
      { speaker: 'you', en: '¿A qué hora es el desayuno?', pt: 'Pergunte a que horas é o café da manhã', accept: ['a qué hora el desayuno', 'cuándo es el desayuno', 'a qué hora sirven el desayuno'] },
      { speaker: 'them', en: 'De siete a diez, en el comedor de abajo.', pt: 'Das sete às dez, no salão de baixo.' },
      { speaker: 'you', en: '¿Hay wifi en el cuarto?', pt: 'Pergunte se tem wi-fi no quarto', accept: ['tienen wifi', 'hay wifi', 'el cuarto tiene wifi'] },
      { speaker: 'them', en: 'Sí, la clave está en la tarjeta. Que descanse.', pt: 'Sim, a senha está no cartão. Bom descanso.' },
    ],
  },
  {
    id: 'es_pharmacy',
    title: 'Na farmácia',
    emoji: '💊',
    level: 2,
    context: 'Você entra numa farmácia sem se sentir bem.',
    turns: [
      { speaker: 'them', en: 'Buenas. ¿En qué le puedo ayudar?', pt: 'Boa. Em que posso ajudar?' },
      { speaker: 'you', en: 'Me duele la garganta', pt: 'Diga que sua garganta dói', accept: ['tengo dolor de garganta', 'me duele mucho la garganta', 'me duele la garganta'] },
      { speaker: 'them', en: '¿Desde cuándo se siente así?', pt: 'Desde quando está se sentindo assim?' },
      { speaker: 'you', en: 'Desde hace dos días', pt: 'Diga que faz dois dias', accept: ['hace dos días', 'desde ayer', 'desde hace dos días'] },
      { speaker: 'them', en: '¿Tiene fiebre o solo el dolor?', pt: 'Tem febre ou só a dor?' },
      { speaker: 'you', en: 'Solo el dolor', pt: 'Diga que é só a dor', accept: ['no tengo fiebre', 'solo dolor', 'nada más el dolor'] },
      { speaker: 'them', en: 'Le doy unas pastillas. ¿Es alérgico a algo?', pt: 'Vou te dar uns comprimidos. É alérgico a algo?' },
      { speaker: 'you', en: 'No que yo sepa', pt: 'Diga que não sabe de nada', accept: ['no soy alérgico', 'no, a nada', 'que yo sepa no'] },
      { speaker: 'them', en: 'Una cada ocho horas, después de comer.', pt: 'Um a cada oito horas, depois de comer.' },
      { speaker: 'you', en: '¿Necesito receta?', pt: 'Pergunte se precisa de receita', accept: ['hace falta receta', 'necesito receta', 'lleva receta'] },
    ],
  },
  {
    id: 'es_work_call',
    title: 'Ligação de trabalho',
    emoji: '📞',
    level: 2,
    context: 'Um cliente liga perguntando de uma entrega atrasada.',
    turns: [
      { speaker: 'them', en: 'Hola, te llamo por la entrega. ¿Cómo vamos?', pt: 'Oi, te ligo por causa da entrega. Como estamos?' },
      { speaker: 'you', en: 'Se atrasó un poco', pt: 'Admita que atrasou um pouco', accept: ['hubo un retraso', 'se atrasó', 'tuvimos un retraso'] },
      { speaker: 'them', en: 'Entiendo. ¿Y para cuándo la tendríamos?', pt: 'Entendo. E para quando teríamos?' },
      { speaker: 'you', en: 'Para el viernes', pt: 'Diga que fica pronto sexta', accept: ['el viernes', 'para el viernes', 'estaría el viernes'] },
      { speaker: 'them', en: 'Necesito estar seguro. ¿Es una fecha firme?', pt: 'Preciso ter certeza. É uma data firme?' },
      { speaker: 'you', en: 'Sí, se lo confirmo hoy', pt: 'Confirme e prometa retorno hoje', accept: ['se lo confirmo hoy', 'le confirmo hoy', 'sí, hoy le confirmo'] },
      { speaker: 'them', en: 'Perfecto. ¿Me puedes mandar el avance por correo?', pt: 'Perfeito. Pode me mandar o andamento por e-mail?' },
      { speaker: 'you', en: 'Claro, te lo mando ahorita', pt: 'Aceite e diga que manda já', accept: ['te lo mando hoy', 'claro te lo envío', 'se lo mando ahorita'] },
      { speaker: 'them', en: 'Gracias, quedo atento entonces.', pt: 'Obrigado, fico no aguardo então.' },
    ],
  },
  {
    id: 'es_neighbour',
    title: 'Conversa com o vizinho',
    emoji: '🏘️',
    level: 2,
    context: 'Você encontra o vizinho no elevador.',
    turns: [
      { speaker: 'them', en: '¡Buenas! ¿Cómo va todo por acá?', pt: 'Oi! Como vão as coisas por aqui?' },
      { speaker: 'you', en: 'Todo bien, gracias', pt: 'Responda que está tudo bem', accept: ['bien gracias', 'todo bien', 'muy bien gracias'] },
      { speaker: 'them', en: '¿Ya se acostumbró al edificio?', pt: 'Já se acostumou com o prédio?' },
      { speaker: 'you', en: 'Poco a poco', pt: 'Diga que aos poucos', accept: ['más o menos', 'poco a poco', 'ahí voy'] },
      { speaker: 'them', en: 'Oiga, ¿el agua caliente le falla a usted también?', pt: 'Escuta, a água quente falha para você também?' },
      { speaker: 'you', en: 'Sí, a veces', pt: 'Confirme que às vezes sim', accept: ['sí a veces', 'a mí también', 'sí, de vez en cuando'] },
      { speaker: 'them', en: 'Voy a hablar con el administrador. ¿Le aviso?', pt: 'Vou falar com o síndico. Te aviso?' },
      { speaker: 'you', en: 'Te lo agradecería', pt: 'Agradeça e aceite', accept: ['sí por favor', 'se lo agradecería', 'gracias, sí'] },
      { speaker: 'them', en: 'Con gusto. Cualquier cosa, toque mi puerta.', pt: 'Com prazer. Qualquer coisa, bate na minha porta.' },
    ],
  },
]
