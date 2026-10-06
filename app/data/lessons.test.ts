import { describe, it, expect } from 'vitest'
import { lessons } from './index'
import { verbMap } from './verbs'

describe('lesson data integrity', () => {
  it('loads all lessons with unique ids', () => {
    expect(lessons.length).toBeGreaterThanOrEqual(60)
    expect(new Set(lessons.map((l) => l.id)).size).toBe(lessons.length)
  })

  for (const l of lessons) {
    it(l.id, () => {
      const errs: string[] = []
      for (const v of l.verbs) if (!verbMap[v]) errs.push(`verbs: unknown ${v}`)
      for (const s of l.sections)
        for (const b of s.blocks) if (b.kind === 'verb' && !verbMap[b.verb]) errs.push(`block: unknown verb ${b.verb}`)
      l.exercises.forEach((e, i) => {
        const at = `ex#${i} ${e.type}`
        if (e.type === 'mc' && (e.answer < 0 || e.answer >= e.options.length)) errs.push(`${at}: answer out of range`)
        if (e.type === 'fill' && e.q.pt.split(/_{2,}/).length !== 2) errs.push(`${at}: needs exactly one ___ in "${e.q.pt}"`)
        if (e.type === 'fill' && !e.answers.length) errs.push(`${at}: no answers`)
        if (e.type === 'translate' && !e.answers.length) errs.push(`${at}: no answers`)
        if (e.type === 'order' && e.words.length < 2) errs.push(`${at}: too few words`)
        if (e.type === 'sort' && e.items.some(([, b]) => b < 0 || b >= e.buckets.length)) errs.push(`${at}: bucket out of range`)
        if (e.type === 'dialogue') {
          if (!e.turns.some((t) => 'choose' in t)) errs.push(`${at}: no choice turns`)
          for (const t of e.turns) if ('choose' in t && (t.answer < 0 || t.answer >= t.choose.length)) errs.push(`${at}: choice answer out of range`)
        }
        if (e.type === 'spot' && (e.wrong < 0 || e.wrong >= e.words.length)) errs.push(`${at}: wrong index out of range`)
        if (e.type === 'cloze') {
          const gaps = e.text.split(/_{2,}/).length - 1
          if (gaps !== e.answers.length) errs.push(`${at}: ${gaps} gaps but ${e.answers.length} answers`)
        }
        if (e.type === 'listenmc' && (e.answer < 0 || e.answer >= e.options.length)) errs.push(`${at}: answer out of range`)
        if (e.type === 'conj') {
          const forms = verbMap[e.verb]?.forms[e.tense]
          if (!forms) errs.push(`${at}: no ${e.verb} ${e.tense}`)
          else if (e.persons.some((p) => p >= forms.length)) errs.push(`${at}: person out of range`)
        }
      })
      expect(errs).toEqual([])
    })
  }
})
