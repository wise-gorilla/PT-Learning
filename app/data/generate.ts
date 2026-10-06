import type { Exercise, VocabItem } from '../types'
import { sample, shuffle } from '../utils'

const article = (v: VocabItem) => (v.g === 'm' ? 'o ' : v.g === 'f' ? 'a ' : '')

/** Build a fresh, randomised vocabulary game set from a word list (optionally mixed with a wider pool for distractors). */
export function vocabGames(vocab: VocabItem[], pool: VocabItem[] = vocab, size = 12): Exercise[] {
  if (vocab.length < 3) return []
  const distractors = pool.length >= 4 ? pool : vocab
  const picks = sample(vocab, Math.min(size, vocab.length))
  const others = (w: VocabItem, n: number) => sample(distractors.filter((d) => d.pt !== w.pt && d.en !== w.en), n)
  const out: Exercise[] = []

  picks.forEach((w, i) => {
    const kind = i % 5
    if (kind === 0) {
      const opts = shuffle([w, ...others(w, 3)])
      out.push({ type: 'listenmc', pt: article(w) + w.pt, options: opts.map((o) => o.en), answer: opts.indexOf(w) })
    } else if (kind === 1 && w.pt.replace(/\s/g, '').length <= 14 && w.pt.split(' ').length <= 2) {
      out.push({ type: 'scramble', pt: w.pt, en: w.en })
    } else if (kind === 2) {
      const opts = shuffle([w, ...others(w, 3)])
      out.push({ type: 'mc', q: { pt: `Como se diz “${w.en}”?`, en: `How do you say “${w.en}”?` }, options: opts.map((o) => o.pt), answer: opts.indexOf(w) })
    } else if (kind === 3) {
      out.push(w.ex ? { type: 'speak', pt: w.ex.pt, en: w.ex.en } : { type: 'speak', pt: article(w) + w.pt, en: w.en })
    } else {
      out.push({ type: 'translate', en: w.en, answers: [w.pt, article(w) + w.pt].filter(Boolean) })
    }
  })

  const genders = vocab.filter((v) => v.g === 'm' || v.g === 'f')
  if (genders.length >= 6) {
    out.push({
      type: 'sort',
      q: { pt: 'Masculino ou feminino?', en: 'Masculine or feminine?' },
      buckets: ['o (masculino)', 'a (feminino)'],
      items: sample(genders, 8).map((v) => [v.pt, v.g === 'm' ? 0 : 1] as [string, number]),
    })
  }
  const pairs = sample(vocab, Math.min(6, vocab.length)).map((v) => [v.pt, v.en] as [string, string])
  out.splice(3, 0, { type: 'match', pairs: pairs.slice(0, 5) })
  out.push({ type: 'memory', pairs })
  return out
}
