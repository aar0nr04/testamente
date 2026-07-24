import type { LocalizedInstrumentContent } from '../types';

const options = {
  es: ['Nunca', 'Varios días', 'Más de la mitad de los días', 'Casi todos los días'],
  en: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'],
  it: ['Mai', 'Alcuni giorni', 'Più della metà dei giorni', 'Quasi ogni giorno'],
  fr: ['Jamais', 'Plusieurs jours', 'Plus de la moitié des jours', 'Presque tous les jours'],
  de: ['Überhaupt nicht', 'An mehreren Tagen', 'An mehr als der Hälfte der Tage', 'Beinahe jeden Tag'],
  zh: ['完全没有', '有几天', '超过一半天数', '几乎每天'],
  pt: ['Nunca', 'Vários dias', 'Mais da metade dos dias', 'Quase todos os dias'],
} as const;

const questions = {
  es: ['Sentirse nervioso/a, ansioso/a o con los nervios de punta.', 'No poder dejar de preocuparse o controlar la preocupación.', 'Preocuparse demasiado por diferentes cosas.', 'Tener dificultad para relajarse.', 'Estar tan inquieto/a que es difícil quedarse quieto/a.', 'Molestarse o irritarse con facilidad.', 'Sentir miedo como si algo terrible pudiera pasar.'],
  en: ['Feeling nervous, anxious, or on edge.', 'Not being able to stop or control worrying.', 'Worrying too much about different things.', 'Trouble relaxing.', 'Being so restless that it is hard to sit still.', 'Becoming easily annoyed or irritable.', 'Feeling afraid as if something awful might happen.'],
  it: ['Sentirsi nervoso/a, ansioso/a o sul filo del rasoio.', 'Non riuscire a smettere o a controllare le preoccupazioni.', 'Preoccuparsi troppo di cose diverse.', 'Avere difficoltà a rilassarsi.', 'Essere così irrequieto/a da rendere difficile stare fermi.', 'Irritarsi o infastidirsi facilmente.', 'Avere paura come se potesse accadere qualcosa di terribile.'],
  fr: ['Vous sentir nerveux/se, anxieux/se ou à bout de nerfs.', 'Ne pas pouvoir arrêter ou contrôler vos inquiétudes.', 'Trop vous inquiéter de choses différentes.', 'Avoir du mal à vous détendre.', 'Être si agité/e qu’il est difficile de rester assis/e.', 'Vous énerver ou vous irriter facilement.', 'Avoir peur comme si quelque chose de terrible allait arriver.'],
  de: ['Sich nervös, ängstlich oder angespannt fühlen.', 'Sorgen nicht stoppen oder kontrollieren können.', 'Sich zu viele Sorgen über verschiedene Dinge machen.', 'Schwierigkeiten haben, sich zu entspannen.', 'So unruhig sein, dass stilles Sitzen schwerfällt.', 'Leicht verärgert oder gereizt werden.', 'Angst haben, als könnte etwas Schreckliches passieren.'],
  zh: ['感到紧张、焦虑或坐立不安。', '无法停止或控制担忧。', '对许多不同的事情过度担忧。', '难以放松。', '如此烦躁，以至于难以静坐。', '很容易感到烦恼或易怒。', '感到害怕，仿佛可怕的事情可能发生。'],
  pt: ['Sentir-se nervoso/a, ansioso/a ou no limite.', 'Não conseguir parar ou controlar as preocupações.', 'Preocupar-se demais com coisas diferentes.', 'Ter dificuldade para relaxar.', 'Ficar tão inquieto/a que é difícil permanecer sentado/a.', 'Irritar-se ou aborrecer-se com facilidade.', 'Sentir medo como se algo terrível pudesse acontecer.'],
} as const;

export const gad7Content: Record<keyof typeof questions, LocalizedInstrumentContent> = Object.fromEntries(Object.entries(questions).map(([locale, texts]) => [locale, {
  instrumentId: 'gad-7', contentVersion: '2026.07.1', locale, title: 'GAD-7',
  instructions: locale === 'es' ? 'Durante las últimas dos semanas, ¿con qué frecuencia le han molestado los siguientes problemas?' : locale === 'en' ? 'Over the last two weeks, how often have you been bothered by the following problems?' : 'Draft translation for professional review.',
  optionLabels: Object.fromEntries(options[locale as keyof typeof options].map((label, index) => [`${index}`, label])),
  questions: texts.map((text, index) => ({ id: `gad${index + 1}`, text })),
}])) as Record<keyof typeof questions, LocalizedInstrumentContent>;
