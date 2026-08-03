import type { Dialogue } from '../../types'

/**
 * Whole conversations to listen to and read along with — a resource, not a
 * graded mode. `en` here is the Spanish line (the field is named for the
 * English course it was written for; see the debt note in docs/STATE.md).
 *
 * These are longer and looser than the role-play scripts on purpose: nobody
 * has to answer, so the language can be as fast and as idiomatic as real
 * speech, which is exactly what a learner who understands but does not produce
 * needs to keep hearing.
 */
export const ES_DIALOGUES: Dialogue[] = [
  {
    id: 'es_dlg_0',
    title: 'Combinando de sair',
    emoji: '📅',
    lines: [
      { who: 'Ana', en: 'Oye, ¿tienes planes para el sábado?', pt: 'Ei, você tem planos para sábado?' },
      { who: 'Luis', en: 'Nada fijo todavía. ¿Por qué?', pt: 'Nada certo ainda. Por quê?' },
      { who: 'Ana', en: 'Estaba pensando en ir al mercado nuevo.', pt: 'Estava pensando em ir no mercado novo.' },
      { who: 'Luis', en: 'Me late. ¿Como a qué hora?', pt: 'Curti. Tipo que horas?' },
      { who: 'Ana', en: 'Temprano, para no agarrar tanta gente.', pt: 'Cedo, para não pegar tanta gente.' },
      { who: 'Luis', en: 'Va, pero no muy temprano, porfa.', pt: 'Beleza, mas não muito cedo, por favor.' },
      { who: 'Ana', en: 'A las diez y de ahí desayunamos.', pt: 'Às dez e daí a gente toma café.' },
      { who: 'Luis', en: 'Perfecto. Quedamos así entonces.', pt: 'Perfeito. Fica combinado assim então.' },
    ],
  },
  {
    id: 'es_dlg_1',
    title: 'Resolvendo um problema',
    emoji: '🛠️',
    lines: [
      { who: 'Cliente', en: 'Buenas, compré esto ayer y no funciona.', pt: 'Boa, comprei isso ontem e não funciona.' },
      { who: 'Vendedor', en: '¿Trae el recibo con usted?', pt: 'Está com o recibo?' },
      { who: 'Cliente', en: 'Sí, aquí lo tengo.', pt: 'Sim, está aqui.' },
      { who: 'Vendedor', en: 'Déjeme ver qué pasa. ¿Lo probó en otro enchufe?', pt: 'Deixa eu ver o que houve. Testou em outra tomada?' },
      { who: 'Cliente', en: 'Sí, y tampoco prendió.', pt: 'Sim, e também não ligou.' },
      { who: 'Vendedor', en: 'Entonces se lo cambio por uno nuevo.', pt: 'Então eu troco por um novo.' },
      { who: 'Cliente', en: 'Se lo agradezco mucho.', pt: 'Agradeço muito.' },
      { who: 'Vendedor', en: 'Para eso estamos. Ahorita se lo traigo.', pt: 'É para isso que estamos aqui. Já trago.' },
    ],
  },
  {
    id: 'es_dlg_2',
    title: 'Reunião de trabalho',
    emoji: '💼',
    lines: [
      { who: 'Jefa', en: '¿Cómo vamos con la campaña?', pt: 'Como estamos com a campanha?' },
      { who: 'Tú', en: 'Bien, aunque el presupuesto quedó corto.', pt: 'Bem, embora o orçamento tenha ficado curto.' },
      { who: 'Jefa', en: '¿Cuánto nos falta más o menos?', pt: 'Quanto falta mais ou menos?' },
      { who: 'Tú', en: 'Como un veinte por ciento.', pt: 'Uns vinte por cento.' },
      { who: 'Jefa', en: 'A ver qué se puede hacer. ¿Y el plazo?', pt: 'Vamos ver o que dá para fazer. E o prazo?' },
      { who: 'Tú', en: 'El plazo sigue en pie, no hay problema.', pt: 'O prazo continua de pé, sem problema.' },
      { who: 'Jefa', en: 'Perfecto. Mándame el informe antes del jueves.', pt: 'Perfeito. Me manda o relatório antes de quinta.' },
      { who: 'Tú', en: 'Va, te lo mando el miércoles.', pt: 'Beleza, te mando na quarta.' },
    ],
  },
  {
    id: 'es_dlg_3',
    title: 'Contando o fim de semana',
    emoji: '🗣️',
    lines: [
      { who: 'Sofía', en: '¿Qué tal estuvo tu fin de semana?', pt: 'Como foi seu fim de semana?' },
      { who: 'Diego', en: 'Tranquilo, la verdad. Casi no salí.', pt: 'Tranquilo, sinceramente. Quase não saí.' },
      { who: 'Sofía', en: '¿En serio? ¿Y eso?', pt: 'Sério? E por quê?' },
      { who: 'Diego', en: 'Estaba agotado de la semana.', pt: 'Estava exausto da semana.' },
      { who: 'Sofía', en: 'Te entiendo. A mí me pasó lo mismo.', pt: 'Te entendo. Comigo foi a mesma coisa.' },
      { who: 'Diego', en: 'Aunque el domingo sí fui a la playa.', pt: 'Embora no domingo eu tenha ido à praia.' },
      { who: 'Sofía', en: '¡Qué envidia! ¿Estuvo buena?', pt: 'Que inveja! Estava boa?' },
      { who: 'Diego', en: 'Buenísima. Deberíamos ir juntos un día.', pt: 'Ótima. A gente devia ir junto um dia.' },
    ],
  },
  {
    id: 'es_dlg_4',
    title: 'Pedindo informação na rua',
    emoji: '🧭',
    lines: [
      { who: 'Tú', en: 'Disculpe, ¿el museo está por acá?', pt: 'Com licença, o museu fica por aqui?' },
      { who: 'Señora', en: 'Sí, siga derecho unas tres cuadras.', pt: 'Sim, siga reto umas três quadras.' },
      { who: 'Tú', en: '¿Y después doy vuelta?', pt: 'E depois eu viro?' },
      { who: 'Señora', en: 'Da vuelta a la derecha en el semáforo.', pt: 'Vire à direita no semáforo.' },
      { who: 'Tú', en: '¿Se puede llegar caminando?', pt: 'Dá para chegar andando?' },
      { who: 'Señora', en: 'Claro, son diez minutos a lo mucho.', pt: 'Claro, são dez minutos no máximo.' },
      { who: 'Tú', en: 'Muy amable, muchas gracias.', pt: 'Muito gentil, muito obrigado.' },
      { who: 'Señora', en: 'De nada, que le vaya bien.', pt: 'De nada, tudo de bom.' },
    ],
  },
  {
    id: 'es_dlg_5',
    title: 'Discordando com jeito',
    emoji: '🤔',
    lines: [
      { who: 'Pablo', en: 'Yo creo que deberíamos empezar ya.', pt: 'Eu acho que a gente devia começar já.' },
      { who: 'Tú', en: 'Entiendo tu punto, pero no estoy seguro.', pt: 'Entendo seu ponto, mas não tenho certeza.' },
      { who: 'Pablo', en: '¿Por qué lo dices?', pt: 'Por que você diz isso?' },
      { who: 'Tú', en: 'Porque todavía nos falta información.', pt: 'Porque ainda falta informação para nós.' },
      { who: 'Pablo', en: 'Sí, en eso tienes razón.', pt: 'Sim, nisso você tem razão.' },
      { who: 'Tú', en: 'Yo esperaría una semana más.', pt: 'Eu esperaria mais uma semana.' },
      { who: 'Pablo', en: 'Está bien, aunque a mí me urge.', pt: 'Tudo bem, embora para mim seja urgente.' },
      { who: 'Tú', en: 'Busquemos algo intermedio entonces.', pt: 'Vamos procurar um meio-termo então.' },
    ],
  },
]
