import type { DatabaseSync } from 'node:sqlite'

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

export function readProgress(db: DatabaseSync): ProgressState {
  const meta = Object.fromEntries((db.prepare('SELECT key, value FROM meta').all() as { key: string; value: string }[]).map((r) => [r.key, r.value]))
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
  for (const r of db.prepare('SELECT * FROM lessons').all() as any[])
    s.lessons[r.id] = { completed: !!r.completed, bestScore: r.best_score, visited: r.visited, attempts: r.attempts, answered: r.answered }
  for (const r of db.prepare('SELECT * FROM words').all() as any[]) s.words[r.id] = { box: r.box, due: r.due }
  for (const r of db.prepare('SELECT * FROM mistakes').all() as any[]) s.mistakes[r.key] = { n: r.n, ok: r.ok }
  for (const r of db.prepare('SELECT * FROM activity').all() as any[]) s.activity[r.day] = { xp: r.xp, items: r.items }
  return s
}

/** Replace everything with the given state, atomically. */
export function writeProgress(db: DatabaseSync, s: ProgressState) {
  db.exec('BEGIN')
  try {
    for (const t of ['lessons', 'words', 'mistakes', 'activity', 'meta']) db.exec(`DELETE FROM ${t}`)
    const L = db.prepare('INSERT INTO lessons (id, completed, best_score, visited, attempts, answered) VALUES (?,?,?,?,?,?)')
    for (const [id, l] of Object.entries(s.lessons ?? {})) L.run(id, l.completed ? 1 : 0, num(l.bestScore), num(l.visited), num(l.attempts), num(l.answered))
    const W = db.prepare('INSERT INTO words VALUES (?,?,?)')
    for (const [id, w] of Object.entries(s.words ?? {})) W.run(id, num(w.box), num(w.due))
    const M = db.prepare('INSERT INTO mistakes VALUES (?,?,?)')
    for (const [k, m] of Object.entries(s.mistakes ?? {})) M.run(k, num(m.n), num(m.ok))
    const A = db.prepare('INSERT INTO activity VALUES (?,?,?)')
    for (const [d, a] of Object.entries(s.activity ?? {})) A.run(d, num(a.xp), num(a.items))
    const K = db.prepare('INSERT INTO meta VALUES (?,?)')
    K.run('saved', '1')
    K.run('xp', String(num(s.xp)))
    K.run('streak_count', String(num(s.streak?.count)))
    K.run('streak_last', String(s.streak?.last ?? ''))
    K.run('last_lesson', s.lastLesson ?? '')
    K.run('settings', JSON.stringify(s.settings ?? {}))
    db.exec('COMMIT')
  } catch (e) {
    db.exec('ROLLBACK')
    throw e
  }
}
