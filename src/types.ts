export interface Bi {
  pt: string
  en: string
}

export interface VocabItem {
  pt: string
  en: string
  /** m / f / mf / pl — for nouns */
  g?: 'm' | 'f' | 'mf'
  plural?: string
  ex?: Bi
  tag?: string
}

/** A block of lesson content (Learn / Grammar tab). */
export type Block =
  | { kind: 'text'; pt: string; en: string }
  | { kind: 'heading'; pt: string; en: string }
  | { kind: 'examples'; items: Bi[] }
  | { kind: 'table'; title?: Bi; head: string[]; rows: string[][] }
  | { kind: 'tip'; pt: string; en: string }
  | { kind: 'dialogue'; title?: Bi; lines: { who: string; pt: string; en: string }[] }
  | { kind: 'verb'; verb: string; tenses?: TenseKey[] }

export interface Section {
  id: string
  title: Bi
  blocks: Block[]
}

export type TenseKey =
  | 'presente'
  | 'perfeito'
  | 'imperfeito'
  | 'futuro'
  | 'condicional'
  | 'imperativo'

export interface Verb {
  inf: string
  en: string
  irregular?: boolean
  /** each tense: [eu, tu, ele/ela/você, nós, eles/elas/vocês]; imperativo: [tu, você, nós, vocês] */
  forms: Partial<Record<TenseKey, string[]>>
  ex?: Bi
}

export type Exercise =
  | { type: 'mc'; q: Bi; options: string[]; answer: number; explain?: Bi }
  | { type: 'fill'; q: Bi; /* use ___ for the gap */ answers: string[]; hint?: string; explain?: Bi }
  | { type: 'match'; q?: Bi; pairs: [string, string][] }
  | { type: 'order'; q?: Bi; words: string[]; en: string; /* words in correct order; extra accepted variants */ alt?: string[][] }
  | { type: 'tf'; statement: Bi; answer: boolean; explain?: Bi }
  | { type: 'conj'; verb: string; tense: TenseKey; persons: number[] }
  | { type: 'translate'; en: string; answers: string[] }
  | { type: 'listen'; pt: string; en: string }
  | { type: 'flash'; cards: [string, string][] }
  | { type: 'memory'; pairs: [string, string][] }
  /** drag/tap items into buckets; items: [text, bucketIndex] */
  | { type: 'sort'; q: Bi; buckets: string[]; items: [string, number][] }
  /** interactive conversation: pick the right reply at your turns */
  | { type: 'dialogue'; title: Bi; turns: DialogueTurn[] }
  /** tap the wrong word in the sentence */
  | { type: 'spot'; words: string[]; wrong: number; fix: string; en: string; explain?: Bi }
  /** multi-gap text with a word bank; one ___ per answer, in order; bank = answers + distractors */
  | { type: 'cloze'; q?: Bi; text: string; answers: string[]; bank: string[]; en: string }
  /** hear Portuguese (text hidden), choose the meaning */
  | { type: 'listenmc'; pt: string; options: string[]; answer: number }
  /** say the sentence out loud (speech recognition) */
  | { type: 'speak'; pt: string; en: string }
  /** rebuild the word from shuffled letters */
  | { type: 'scramble'; pt: string; en: string }

export type DialogueTurn =
  | { who: string; pt: string; en: string }
  | { choose: string[]; answer: number; en: string }

export interface Lesson {
  id: string
  unit: number
  level: 'A1' | 'A2'
  emoji: string
  title: Bi
  summary: Bi
  sections: Section[]
  vocab: VocabItem[]
  verbs: string[]
  exercises: Exercise[]
}

export interface Unit {
  n: number
  level: 'A1' | 'A2'
  emoji: string
  title: Bi
}
