import { describe, it, expect } from 'vitest'
import { check, normalize, similarity } from './utils'
import { verbs, verbMap } from './data/verbs'
import { vocabGames } from './data/generate'
import { lessons, dictionary } from './data'

describe('similarity', () => {
  it('scores speech transcripts', () => {
    expect(similarity('Muito prazer', 'Muito prazer.')).toBe(1)
    expect(similarity('muito praser', 'Muito prazer.')).toBeGreaterThan(0.8)
    expect(similarity('bom dia', 'Muito prazer.')).toBeLessThan(0.5)
  })
})

describe('vocabGames', () => {
  it('generates valid exercises for every lesson', () => {
    for (const l of lessons.filter((x) => x.vocab.length >= 3)) {
      const ex = vocabGames(l.vocab, dictionary)
      expect(ex.length, l.id).toBeGreaterThan(3)
      for (const e of ex) {
        if (e.type === 'mc' || e.type === 'listenmc') expect(e.options[e.answer], l.id).toBeDefined()
        if (e.type === 'sort') expect(e.items.every(([, b]) => b < e.buckets.length)).toBe(true)
      }
    }
  })
})

describe('check', () => {
  it('accepts case/punctuation differences', () => {
    expect(check('bom dia', ['Bom dia!'])).toBe('correct')
    expect(normalize('  Olá,   João! ')).toBe('olá joão')
  })
  it('flags missing accents as almost', () => {
    expect(check('ola', ['Olá'])).toBe('accent')
  })
  it('rejects wrong answers', () => {
    expect(check('boa noite', ['Bom dia'])).toBe('wrong')
    expect(check('', ['x'])).toBe('wrong')
  })
})

describe('verbs data', () => {
  it('has full tense arrays', () => {
    for (const v of verbs) {
      for (const [t, f] of Object.entries(v.forms)) {
        expect(f!.length, `${v.inf} ${t}`).toBe(t === 'imperativo' ? 4 : 5)
      }
    }
  })
  it('key pt-PT forms are right', () => {
    expect(verbMap['falar'].forms.perfeito![3]).toBe('falámos')
    expect(verbMap['ser'].forms.presente).toEqual(['sou', 'és', 'é', 'somos', 'são'])
    expect(verbMap['levantar-se'].forms.presente![0]).toBe('levanto-me')
  })
})
