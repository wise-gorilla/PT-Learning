import type { Lesson, VocabItem } from '../types'
import { units } from './units'

const modules = import.meta.glob<{ lessons: Lesson[] }>('./lessons/u*.ts', { eager: true })

export const lessons: Lesson[] = Object.keys(modules)
  .sort()
  .flatMap((k) => modules[k].lessons)

export const lessonMap: Record<string, Lesson> = Object.fromEntries(lessons.map((l) => [l.id, l]))

export function lessonsOfUnit(n: number) {
  return lessons.filter((l) => l.unit === n)
}

export function neighbours(id: string) {
  const i = lessons.findIndex((l) => l.id === id)
  return { prev: lessons[i - 1], next: lessons[i + 1] }
}

export interface DictEntry extends VocabItem {
  id: string
  lessonId: string
  unit: number
}

export const GLOSSARY_UNIT = 99
const seen = new Set<string>()
export const dictionary: DictEntry[] = []
for (const l of lessons) {
  for (const v of l.vocab) {
    const key = v.pt.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    dictionary.push({ ...v, id: key, lessonId: l.id, unit: l.unit })
  }
}
// extra words from the book's glossary (not tied to a lesson)
const extra = import.meta.glob<{ glossary: VocabItem[] }>('./glossary.ts', { eager: true })
for (const m of Object.values(extra))
  for (const v of m.glossary) {
    const key = v.pt.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    dictionary.push({ ...v, id: key, lessonId: 'glossary', unit: GLOSSARY_UNIT })
  }
dictionary.sort((a, b) => a.pt.localeCompare(b.pt, 'pt'))

export { units }
