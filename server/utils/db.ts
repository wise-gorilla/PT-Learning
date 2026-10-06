import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

export interface Stmt {
  sql: string
  args?: (string | number)[]
}

/** Minimal async DB surface so progress works on a local SQLite file (dev / VPS) and on hosted libSQL (Turso, for Vercel). */
export interface Db {
  all<T = any>(sql: string, args?: (string | number)[]): Promise<T[]>
  /** run all statements atomically */
  transaction(stmts: Stmt[]): Promise<void>
}

const SCHEMA = [
  'CREATE TABLE IF NOT EXISTS lessons  (id TEXT PRIMARY KEY, completed INTEGER NOT NULL, best_score INTEGER NOT NULL, visited INTEGER NOT NULL, attempts INTEGER NOT NULL, answered INTEGER NOT NULL DEFAULT 0)',
  'CREATE TABLE IF NOT EXISTS words    (id TEXT PRIMARY KEY, box INTEGER NOT NULL, due INTEGER NOT NULL)',
  'CREATE TABLE IF NOT EXISTS mistakes (key TEXT PRIMARY KEY, n INTEGER NOT NULL, ok INTEGER NOT NULL)',
  'CREATE TABLE IF NOT EXISTS activity (day TEXT PRIMARY KEY, xp INTEGER NOT NULL, items INTEGER NOT NULL)',
  'CREATE TABLE IF NOT EXISTS meta     (key TEXT PRIMARY KEY, value TEXT NOT NULL)',
]

async function open(): Promise<Db> {
  const cfg = useRuntimeConfig()
  const url = String(cfg.tursoUrl || process.env.TURSO_DATABASE_URL || '')
  const authToken = String(cfg.tursoToken || process.env.TURSO_AUTH_TOKEN || '')

  let db: Db
  if (url) {
    const { createClient } = await import('@libsql/client/web')
    const client = createClient({ url, authToken })
    db = {
      async all(sql, args = []) {
        return (await client.execute({ sql, args })).rows as any[]
      },
      async transaction(stmts) {
        await client.batch(stmts.map((s) => ({ sql: s.sql, args: s.args ?? [] })), 'write')
      },
    }
  } else {
    const { DatabaseSync } = await import('node:sqlite')
    const file = resolve(String(cfg.dbPath))
    mkdirSync(dirname(file), { recursive: true })
    const sqlite = new DatabaseSync(file)
    sqlite.exec('PRAGMA journal_mode = WAL')
    db = {
      async all(sql, args = []) {
        return sqlite.prepare(sql).all(...args) as any[]
      },
      async transaction(stmts) {
        sqlite.exec('BEGIN')
        try {
          for (const s of stmts) sqlite.prepare(s.sql).run(...(s.args ?? []))
          sqlite.exec('COMMIT')
        } catch (e) {
          sqlite.exec('ROLLBACK')
          throw e
        }
      },
    }
  }

  await db.transaction(SCHEMA.map((sql) => ({ sql })))
  // databases created before the `answered` column existed
  const cols = await db.all<{ name: string }>('PRAGMA table_info(lessons)')
  if (!cols.some((c) => c.name === 'answered')) await db.transaction([{ sql: 'ALTER TABLE lessons ADD COLUMN answered INTEGER NOT NULL DEFAULT 0' }])
  return db
}

let ready: Promise<Db> | undefined

export function useDb(): Promise<Db> {
  ready ??= open().catch((e) => {
    ready = undefined // retry on the next request instead of caching a failure
    throw e
  })
  return ready
}
