export function stripAccents(s: string) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '')
}

export function normalize(s: string) {
  return s
    .toLowerCase()
    .replace(/[’`]/g, "'")
    .replace(/[.,!?¿¡;:"«»()]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export type Verdict = 'correct' | 'accent' | 'wrong'

/** Compare user input with accepted answers. Missing accents counts as "almost". */
export function check(input: string, answers: string[]): Verdict {
  const n = normalize(input)
  if (!n) return 'wrong'
  if (answers.some((a) => normalize(a) === n)) return 'correct'
  if (answers.some((a) => stripAccents(normalize(a)) === stripAccents(n))) return 'accent'
  return 'wrong'
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function sample<T>(arr: T[], n: number): T[] {
  return shuffle(arr).slice(0, n)
}

let ptVoice: SpeechSynthesisVoice | null | undefined
function pickVoice() {
  if (ptVoice !== undefined && ptVoice !== null) return ptVoice
  const voices = window.speechSynthesis?.getVoices() ?? []
  ptVoice =
    voices.find((v) => v.lang === 'pt-PT') ??
    voices.find((v) => v.lang.replace('_', '-').toLowerCase() === 'pt-pt') ??
    voices.find((v) => v.lang.toLowerCase().startsWith('pt')) ??
    null
  return ptVoice
}
if (typeof window !== 'undefined' && window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = () => {
    ptVoice = undefined
    pickVoice()
  }
}

export function speak(text: string, rate = 0.9) {
  if (!window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'pt-PT'
  u.rate = rate
  const v = pickVoice()
  if (v) u.voice = v
  window.speechSynthesis.speak(u)
}

export function hasPtVoice() {
  return !!pickVoice()
}

/** 0..1 similarity based on Levenshtein distance of normalized, accent-free strings */
export function similarity(a: string, b: string) {
  const x = stripAccents(normalize(a))
  const y = stripAccents(normalize(b))
  if (!x.length && !y.length) return 1
  const d: number[] = Array.from({ length: y.length + 1 }, (_, j) => j)
  for (let i = 1; i <= x.length; i++) {
    let prev = d[0]
    d[0] = i
    for (let j = 1; j <= y.length; j++) {
      const tmp = d[j]
      d[j] = Math.min(d[j] + 1, d[j - 1] + 1, prev + (x[i - 1] === y[j - 1] ? 0 : 1))
      prev = tmp
    }
  }
  return 1 - d[y.length] / Math.max(x.length, y.length)
}

type Recognizer = { lang: string; interimResults: boolean; maxAlternatives: number; start(): void; abort(): void; onresult: ((e: any) => void) | null; onerror: ((e: any) => void) | null; onend: (() => void) | null }
export function createRecognizer(): Recognizer | null {
  const R = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition
  if (!R) return null
  const r: Recognizer = new R()
  r.lang = 'pt-PT'
  r.interimResults = false
  r.maxAlternatives = 5
  return r
}

let ctx: AudioContext | null = null
export function beep(kind: 'good' | 'bad' | 'win') {
  try {
    ctx ??= new AudioContext()
    const notes = kind === 'good' ? [660, 880] : kind === 'bad' ? [220, 170] : [523, 659, 784, 1046]
    notes.forEach((f, i) => {
      const o = ctx!.createOscillator()
      const g = ctx!.createGain()
      o.type = kind === 'bad' ? 'sawtooth' : 'triangle'
      o.frequency.value = f
      const t = ctx!.currentTime + i * 0.09
      g.gain.setValueAtTime(0.12, t)
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.18)
      o.connect(g).connect(ctx!.destination)
      o.start(t)
      o.stop(t + 0.2)
    })
  } catch {
    /* audio unavailable */
  }
}

export const PERSONS = ['eu', 'tu', 'ele/ela/você', 'nós', 'eles/elas/vocês']
export const IMP_PERSONS = ['(tu)', '(você)', '(nós)', '(vocês)']

export const TENSE_LABELS: Record<string, { pt: string; en: string }> = {
  presente: { pt: 'Presente', en: 'Present' },
  perfeito: { pt: 'Pretérito perfeito', en: 'Simple past' },
  imperfeito: { pt: 'Pretérito imperfeito', en: 'Imperfect (used to / was -ing)' },
  futuro: { pt: 'Futuro', en: 'Future' },
  condicional: { pt: 'Condicional', en: 'Conditional (would)' },
  imperativo: { pt: 'Imperativo', en: 'Imperative (commands)' },
}
