import type { Level } from '../../types'

/**
 * Spoken role-play scripts — the step from knowing words to holding a
 * conversation.
 *
 * Rules this table keeps to, all of them learned the hard way:
 *
 *  - **Her lines are short.** A ten-word expected answer fails her constantly
 *    and teaches nothing. Every `you` line is something she can say in one
 *    breath, on a first try, with a stranger watching.
 *  - **Every `you` line carries `accept` variants** — the other ways a real
 *    person answers that question. `matchesExpected` also allows contractions,
 *    containment and a fuzzy near-miss, so these only have to cover genuinely
 *    *different* phrasings, not spelling.
 *  - **`pt` on a `you` line is the hint, not a translation.** The English is
 *    hidden by default: the point is production, not reading. So the
 *    Portuguese says what to convey ("peça um flat white"), never the exact
 *    words.
 *  - **It sounds like New Zealand.** "Kia ora", "sweet as", "no worries",
 *    "have here or takeaway", rent per week, bond of four weeks, chemist not
 *    pharmacy, Onecard at the checkout. A textbook would get her through a
 *    textbook.
 *  - **No line asks her for her own name or details.** She is playing a part,
 *    and a turn she can only fail (because the script expects "Ana Silva" and
 *    she is not Ana) is a wall, not practice.
 */

export interface RoleplayTurn {
  speaker: 'them' | 'you'
  /** The line. Spoken by TTS for `them`; the expected answer for `you`. */
  en: string
  /** Translation on a `them` line; the hint on a `you` line. */
  pt: string
  /** `you` lines only: other phrasings that should count as right. */
  accept?: string[]
}

export interface Roleplay {
  id: string
  title: string
  emoji: string
  level: Level
  /** One line of simple English setting the scene. */
  context: string
  turns: RoleplayTurn[]
}

export const ROLEPLAYS: Roleplay[] = [
  {
    id: 'cafe',
    title: 'Ordering at a café',
    emoji: '☕',
    level: 1,
    context: 'You are at a café. The barista looks up and smiles.',
    turns: [
      { speaker: 'them', en: "Kia ora! How's it going?", pt: 'Olá! Tudo bem?' },
      {
        speaker: 'you',
        en: 'Good thanks, and you?',
        pt: 'Diga que está bem e devolva a pergunta.',
        accept: ['good thanks', 'yeah good thanks and you', 'not bad thanks', "I'm good thanks"],
      },
      { speaker: 'them', en: 'Sweet as. What can I get you?', pt: 'Que bom. O que você vai querer?' },
      {
        speaker: 'you',
        en: 'Can I have a flat white, please?',
        pt: 'Peça um flat white.',
        accept: ['a flat white please', "I'd like a flat white", 'flat white thanks'],
      },
      { speaker: 'them', en: 'No worries. Have here or takeaway?', pt: 'Sem problema. Vai tomar aqui ou levar?' },
      {
        speaker: 'you',
        en: 'Takeaway, please.',
        pt: 'Diga que é para levar.',
        accept: ['takeaway', 'take away please', 'takeaway thanks'],
      },
      { speaker: 'them', en: "That's five fifty. Card or cash?", pt: 'São cinco e cinquenta. Cartão ou dinheiro?' },
      {
        speaker: 'you',
        en: 'Card, please.',
        pt: 'Diga que vai pagar no cartão.',
        accept: ['card', 'card thanks', 'by card please', 'eftpos please'],
      },
      { speaker: 'them', en: 'Sweet as. Just tap there. Have a good one!', pt: 'Beleza. É só aproximar aí. Tenha um bom dia!' },
      {
        speaker: 'you',
        en: 'Thanks, you too!',
        pt: 'Agradeça e deseje o mesmo.',
        accept: ['thank you', 'thanks you too', 'cheers you too', 'thanks so much'],
      },
    ],
  },

  {
    id: 'flat',
    title: 'Viewing a flat',
    emoji: '🏠',
    level: 3,
    context: 'You are looking at a flat to rent. The landlord shows you the lounge.',
    turns: [
      { speaker: 'them', en: 'Kia ora, come on in. This is the lounge.', pt: 'Olá, pode entrar. Esta é a sala.' },
      {
        speaker: 'you',
        en: 'How much is the rent?',
        pt: 'Pergunte quanto é o aluguel. (Na Nova Zelândia se fala por semana.)',
        accept: ["what's the rent", 'how much is it per week', 'how much is the rent a week'],
      },
      { speaker: 'them', en: "It's five hundred and eighty a week.", pt: 'São quinhentos e oitenta por semana.' },
      {
        speaker: 'you',
        en: 'How much is the bond?',
        pt: 'Pergunte o valor do depósito — o "bond".',
        accept: ["what's the bond", 'is there a bond', 'is the bond four weeks'],
      },
      { speaker: 'them', en: 'Bond is four weeks, plus two weeks in advance.', pt: 'O bond é quatro semanas, mais duas semanas adiantadas.' },
      {
        speaker: 'you',
        en: 'When can I move in?',
        pt: 'Pergunte a partir de quando pode se mudar.',
        accept: ['when is it available', 'when could I move in', "what's the move in date"],
      },
      { speaker: 'them', en: "It's free from the first of next month.", pt: 'Está livre a partir do dia primeiro do mês que vem.' },
      {
        speaker: 'you',
        en: 'That works for me.',
        pt: 'Diga que essa data serve para você.',
        accept: ['that works', "that's perfect", 'that suits me', 'yeah that works for me'],
      },
      { speaker: 'them', en: "Choice. I'll email you the application form.", pt: 'Ótimo. Vou te mandar o formulário por e-mail.' },
      {
        speaker: 'you',
        en: "Thanks, I'll fill it in tonight.",
        pt: 'Agradeça e diga que preenche hoje à noite.',
        accept: ["I'll fill it in tonight", "thanks I'll do it tonight", 'great thanks'],
      },
    ],
  },

  {
    id: 'gp',
    title: 'At the GP',
    emoji: '🩺',
    level: 3,
    context: 'You are at the doctor — the GP. She calls you in.',
    turns: [
      { speaker: 'them', en: "Kia ora, take a seat. What's brought you in today?", pt: 'Olá, pode sentar. O que te traz aqui hoje?' },
      {
        speaker: 'you',
        en: "I've had a sore throat for three days.",
        pt: 'Diga que está com dor de garganta há três dias.',
        accept: ['I have a sore throat', 'my throat is sore', 'sore throat for three days'],
      },
      { speaker: 'them', en: 'Any fever or a cough?', pt: 'Tem febre ou tosse?' },
      {
        speaker: 'you',
        en: 'A bit of a fever, no cough.',
        pt: 'Diga que tem um pouco de febre, mas não tem tosse.',
        accept: ['a little fever no cough', 'yes a bit of fever', 'no cough just a fever'],
      },
      { speaker: 'them', en: "Righto, let's have a look. Yep, that's a throat infection.", pt: 'Certo, deixa eu ver. Sim, é uma infecção de garganta.' },
      {
        speaker: 'you',
        en: 'Do I need antibiotics?',
        pt: 'Pergunte se precisa de antibiótico.',
        accept: ['do I need medicine', 'will I need antibiotics', 'do I need a prescription'],
      },
      { speaker: 'them', en: "Yep. I'll send a prescription to the chemist.", pt: 'Sim. Vou mandar a receita para a farmácia.' },
      {
        speaker: 'you',
        en: 'Which chemist is it?',
        pt: 'Pergunte qual é a farmácia.',
        accept: ['which pharmacy', 'where is the chemist', 'what chemist is it'],
      },
      { speaker: 'them', en: "The one on the corner. It'll be ready in an hour.", pt: 'A da esquina. Fica pronta em uma hora.' },
      {
        speaker: 'you',
        en: 'Thanks so much.',
        pt: 'Agradeça e se despeça.',
        accept: ['thank you', 'thanks', 'cheers thanks', 'thank you doctor'],
      },
    ],
  },

  {
    id: 'supermarket',
    title: 'At the supermarket',
    emoji: '🛒',
    level: 2,
    context: "You are at the supermarket and you can't find the milk.",
    turns: [
      { speaker: 'them', en: 'You right there? Need a hand?', pt: 'Tudo bem aí? Precisa de ajuda?' },
      {
        speaker: 'you',
        en: 'Where is the milk, please?',
        pt: 'Pergunte onde fica o leite.',
        accept: ['where is the milk', "I'm looking for the milk", 'can you tell me where the milk is'],
      },
      { speaker: 'them', en: "Milk's down the back, aisle nine. Oat milk's on the top shelf.", pt: 'O leite fica lá no fundo, corredor nove. O de aveia é na prateleira de cima.' },
      {
        speaker: 'you',
        en: 'Sweet, thanks.',
        pt: 'Agradeça de um jeito bem kiwi.',
        accept: ['sweet as thanks', 'thanks', 'cheers thanks', 'thank you'],
      },
      { speaker: 'them', en: 'No worries. Gidday! Do you have a Onecard?', pt: 'De nada. (No caixa) Oi! Você tem um Onecard?' },
      {
        speaker: 'you',
        en: "No, I don't.",
        pt: 'Diga que não tem.',
        accept: ['no', 'not yet', "no I haven't got one", 'no sorry'],
      },
      { speaker: 'them', en: "All good. That's twenty two dollars. Need a bag?", pt: 'Tudo bem. São vinte e dois dólares. Precisa de sacola?' },
      {
        speaker: 'you',
        en: "No thanks, I've got one.",
        pt: 'Recuse a sacola — você já tem uma.',
        accept: ['no thanks', "I'm alright thanks", 'no I have a bag'],
      },
    ],
  },

  {
    id: 'neighbour',
    title: 'Meeting a neighbour',
    emoji: '👋',
    level: 2,
    context: 'You are putting the bins out. Your neighbour calls over the fence.',
    turns: [
      { speaker: 'them', en: "Gidday! You've just moved in, eh?", pt: 'Oi! Você acabou de se mudar, né?' },
      {
        speaker: 'you',
        en: 'Yes, last week.',
        pt: 'Confirme: você chegou semana passada.',
        accept: ['yes last week', 'yeah we moved in last week', "that's right last week"],
      },
      { speaker: 'them', en: 'Choice. Where are you from?', pt: 'Legal. De onde você é?' },
      {
        speaker: 'you',
        en: "I'm from Brazil.",
        pt: 'Diga de que país você é.',
        accept: ['from brazil', "I'm brazilian", 'brazil'],
      },
      { speaker: 'them', en: 'Oh, lovely. How are you finding the weather?', pt: 'Que legal. E o que você está achando do clima?' },
      {
        speaker: 'you',
        en: 'A bit cold, but I like it.',
        pt: 'Diga que é um pouco frio, mas você gosta.',
        accept: ["it's a bit cold", 'a bit cold but nice', 'cold but I like it'],
      },
      { speaker: 'them', en: "Ha! Four seasons in one day here. I'm Dave, by the way.", pt: 'Ha! Aqui tem quatro estações num dia só. Aliás, eu sou o Dave.' },
      {
        speaker: 'you',
        en: 'Nice to meet you, Dave.',
        pt: 'Diga que é um prazer conhecê-lo (pode dizer seu nome também).',
        accept: ['nice to meet you', 'lovely to meet you', 'hi dave nice to meet you'],
      },
    ],
  },

  {
    id: 'phone',
    title: 'Booking on the phone',
    emoji: '📞',
    level: 3,
    context: 'You are on the phone to a clinic. You cannot see her face — only listen.',
    turns: [
      { speaker: 'them', en: 'Good morning, Riverside Medical, this is Kate speaking.', pt: 'Bom dia, Riverside Medical, aqui é a Kate.' },
      {
        speaker: 'you',
        en: "Hi, I'd like to book an appointment.",
        pt: 'Diga que quer marcar uma consulta.',
        accept: ["I'd like to make an appointment", 'can I book an appointment', 'I want to book an appointment'],
      },
      { speaker: 'them', en: 'Sure thing. Are you enrolled with us?', pt: 'Claro. Você já é cadastrada aqui?' },
      {
        speaker: 'you',
        en: "No, I'm new here.",
        pt: 'Diga que não — você é nova aqui.',
        accept: ["no I'm new", 'no not yet', 'no this is my first time'],
      },
      { speaker: 'them', en: "No worries. What's the appointment for?", pt: 'Sem problema. A consulta é para quê?' },
      {
        speaker: 'you',
        en: 'I need a repeat prescription.',
        pt: 'Explique que precisa renovar uma receita.',
        accept: ['I need a prescription', "it's for a prescription", 'I need to renew my prescription'],
      },
      { speaker: 'them', en: "Ta. We've got Thursday at ten, or Friday at two.", pt: 'Obrigada. Temos quinta às dez, ou sexta às duas.' },
      {
        speaker: 'you',
        en: 'Thursday at ten, please.',
        pt: 'Escolha a quinta-feira às dez.',
        accept: ['thursday at ten', 'thursday please', 'ten on thursday', 'thursday thanks'],
      },
      { speaker: 'them', en: "Beaut. You're booked in. Bring your passport, eh.", pt: 'Ótimo. Está agendado. Traga seu passaporte, tá?' },
      {
        speaker: 'you',
        en: 'Will do. Thanks, Kate.',
        pt: 'Diga que sim e agradeça pelo nome.',
        accept: ['will do thanks', 'thank you kate', 'yes I will thanks', 'ok thanks'],
      },
    ],
  },
]
