import { DatabaseSync } from 'node:sqlite'
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

let db: DatabaseSync | undefined

/** Single SQLite file (Node's built-in `node:sqlite`, no native module to compile). */
export function useDb(): DatabaseSync {
  if (db) return db
  const file = resolve(String(useRuntimeConfig().dbPath))
  mkdirSync(dirname(file), { recursive: true })
  db = new DatabaseSync(file)
  db.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS lessons  (id TEXT PRIMARY KEY, completed INTEGER NOT NULL, best_score INTEGER NOT NULL, visited INTEGER NOT NULL, attempts INTEGER NOT NULL, answered INTEGER NOT NULL DEFAULT 0);
    CREATE TABLE IF NOT EXISTS words    (id TEXT PRIMARY KEY, box INTEGER NOT NULL, due INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS mistakes (key TEXT PRIMARY KEY, n INTEGER NOT NULL, ok INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS activity (day TEXT PRIMARY KEY, xp INTEGER NOT NULL, items INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS meta     (key TEXT PRIMARY KEY, value TEXT NOT NULL);
  `)
  // databases created before the `answered` column existed
  const cols = db.prepare('PRAGMA table_info(lessons)').all() as { name: string }[]
  if (!cols.some((c) => c.name === 'answered')) db.exec('ALTER TABLE lessons ADD COLUMN answered INTEGER NOT NULL DEFAULT 0')
  return db
}
