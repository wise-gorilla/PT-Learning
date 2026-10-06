import type { Db, Stmt } from './db'

export interface ProgressState {
  lessons: Record<string, { completed: boolean; bestScore: number; visited: number; attempts: number; answered?: number }>
  xp: number
  streak: { count: number; last: string }
  words: Record<string, { box: number; due: number }>
  mistakes: Record<string, { n: number; ok: number }>
  activity: Record<string, { xp: number; items: number }>
  lastLesson: string | null
  settings: Record<string, unknown>
  /** true when nothing has ever been saved (lets the client import its old localStorage progress) */
  empty?: boolean
}

const num = (v: unknown) => (Number.isFinite(Number(v)) ? Math.round(Number(v)) : 0)

export async function readProgress(db: Db): Promise<ProgressState> {
  const meta = Object.fromEntries((await db.all<{ key: string; value: string }>('SELECT key, value FROM meta')).map((r) => [r.key, r.value]))
  const s: ProgressState = {
    lessons: {},
    xp: num(meta.xp),
    streak: { count: num(meta.streak_count), last: meta.streak_last ?? '' },
    words: {},
    mistakes: {},
    activity: {},
    lastLesson: meta.last_lesson || null,
    settings: meta.settings ? JSON.parse(meta.settings) : {},
    empty: !meta.saved,
  }
  const [lessons, words, mistakes, activity] = await Promise.all([
    db.all('SELECT * FROM lessons'),
    db.all('SELECT * FROM words'),
    db.all('SELECT * FROM mistakes'),
    db.all('SELECT * FROM activity'),
  ])
  for (const r of lessons) s.lessons[r.id] = { completed: !!r.completed, bestScore: num(r.best_score), visited: num(r.visited), attempts: num(r.attempts), answered: num(r.answered) }
  for (const r of words) s.words[r.id] = { box: num(r.box), due: num(r.due) }
  for (const r of mistakes) s.mistakes[r.key] = { n: num(r.n), ok: num(r.ok) }
  for (const r of activity) s.activity[r.day] = { xp: num(r.xp), items: num(r.items) }
  return s
}

/** Replace everything with the given state, atomically. */
export async function writeProgress(db: Db, s: ProgressState) {
  const q: Stmt[] = ['lessons', 'words', 'mistakes', 'activity', 'meta'].map((t) => ({ sql: `DELETE FROM ${t}` }))
  for (const [id, l] of Object.entries(s.lessons ?? {}))
    q.push({ sql: 'INSERT INTO lessons (id, completed, best_score, visited, attempts, answered) VALUES (?,?,?,?,?,?)', args: [id, l.completed ? 1 : 0, num(l.bestScore), num(l.visited), num(l.attempts), num(l.answered)] })
  for (const [id, w] of Object.entries(s.words ?? {})) q.push({ sql: 'INSERT INTO words VALUES (?,?,?)', args: [id, num(w.box), num(w.due)] })
  for (const [k, m] of Object.entries(s.mistakes ?? {})) q.push({ sql: 'INSERT INTO mistakes VALUES (?,?,?)', args: [k, num(m.n), num(m.ok)] })
  for (const [d, a] of Object.entries(s.activity ?? {})) q.push({ sql: 'INSERT INTO activity VALUES (?,?,?)', args: [d, num(a.xp), num(a.items)] })
  const meta: [string, string][] = [
    ['saved', '1'],
    ['xp', String(num(s.xp))],
    ['streak_count', String(num(s.streak?.count))],
    ['streak_last', String(s.streak?.last ?? '')],
    ['last_lesson', s.lastLesson ?? ''],
    ['settings', JSON.stringify(s.settings ?? {})],
  ]
  for (const [k, v] of meta) q.push({ sql: 'INSERT INTO meta VALUES (?,?)', args: [k, v] })
  await db.transaction(q)
}
