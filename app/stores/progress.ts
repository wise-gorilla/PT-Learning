import { defineStore } from 'pinia'
import { watch } from 'vue'

/** legacy browser-only storage, imported once into the database */
const LEGACY_KEY = 'pt-progress-v1'
const BOX_DAYS = [0, 1, 3, 7, 16, 35]

export interface LessonProgress {
  completed: boolean
  bestScore: number // 0..100
  visited: number // timestamp
  attempts: number
  /** furthest point reached in the exercises, 0..100 (shows partial progress) */
  answered?: number
}

export interface WordState {
  box: number // 1..5
  due: number // timestamp
}

export interface Settings {
  enMode: 'show' | 'tap' | 'hide'
  sound: boolean
  dark: boolean
  accentStrict: boolean
  rate: number
  dailyGoal: number // XP per day
}

interface State {
  /** true once progress has been fetched from the server (never saved) */
  loaded: boolean
  lessons: Record<string, LessonProgress>
  xp: number
  streak: { count: number; last: string }
  words: Record<string, WordState>
  /** exercises answered wrongly, keyed by exKey(lessonId, exercise); cleared after 2 correct answers in a row */
  mistakes: Record<string, { n: number; ok: number }>
  /** per-day activity */
  activity: Record<string, { xp: number; items: number }>
  lastLesson: string | null
  settings: Settings
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

function fresh(): State {
  return {
    loaded: false,
    lessons: {},
    xp: 0,
    streak: { count: 0, last: '' },
    words: {},
    mistakes: {},
    activity: {},
    lastLesson: null,
    settings: { enMode: 'show', sound: true, dark: false, accentStrict: false, rate: 0.9, dailyGoal: 100 },
  }
}

function merge(raw: Partial<State> | null | undefined): State {
  const f = fresh()
  if (!raw) return f
  return { ...f, ...raw, settings: { ...f.settings, ...(raw.settings ?? {}) } }
}

function legacy(): Partial<State> | null {
  try {
    const raw = localStorage.getItem(LEGACY_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export const useProgress = defineStore('progress', {
  state: fresh,
  getters: {
    completedCount: (s) => Object.values(s.lessons).filter((l) => l.completed).length,
    weakKeys: (s) => Object.keys(s.mistakes),
    todayXp: (s) => s.activity[today()]?.xp ?? 0,
    dueWords: (s) => Object.entries(s.words).filter(([, w]) => w.due <= Date.now()).map(([k]) => k),
  },
  actions: {
    visit(id: string) {
      const l = (this.lessons[id] ??= { completed: false, bestScore: 0, visited: 0, attempts: 0 })
      l.visited = Date.now()
      this.lastLesson = id
    },
    addXp(n: number) {
      this.xp += n
      const t = today()
      const a = (this.activity[t] ??= { xp: 0, items: 0 })
      a.xp += n
      if (this.streak.last === t) return
      const y = new Date(Date.now() - 864e5).toISOString().slice(0, 10)
      this.streak.count = this.streak.last === y ? this.streak.count + 1 : 1
      this.streak.last = t
    },
    finishLesson(id: string, score: number) {
      const l = (this.lessons[id] ??= { completed: false, bestScore: 0, visited: Date.now(), attempts: 0 })
      l.attempts++
      l.answered = 100
      l.bestScore = Math.max(l.bestScore, score)
      if (score >= 60) l.completed = true
    },
    /** wipe one lesson's progress: score, completion, wrongly-answered exercises and (optionally) its words */
    resetLesson(id: string, wordIds: string[] = []) {
      delete this.lessons[id]
      for (const k of Object.keys(this.mistakes)) if (k.startsWith(id + '#')) delete this.mistakes[k]
      for (const w of wordIds) delete this.words[w]
      if (this.lastLesson === id) this.lastLesson = null
    },
    /** fetch progress from the SQLite-backed API (importing old browser-only progress the first time) */
    async load() {
      const remote = await $fetch<State & { empty?: boolean }>('/api/progress')
      const { empty, ...data } = remote
      const old = empty ? legacy() : null
      this.$patch(merge(old ?? data))
      this.loaded = true
      if (old) await this.save()
    },
    async save() {
      const { loaded, ...state } = this.$state
      await $fetch('/api/progress', { method: 'PUT', body: state })
    },
    /** remember how far through a lesson's exercises you are (never goes backwards) */
    noteProgress(id: string, pct: number) {
      const l = (this.lessons[id] ??= { completed: false, bestScore: 0, visited: Date.now(), attempts: 0 })
      l.answered = Math.max(l.answered ?? 0, Math.min(100, Math.round(pct)))
    },
    toggleComplete(id: string) {
      const l = (this.lessons[id] ??= { completed: false, bestScore: 0, visited: Date.now(), attempts: 0 })
      l.completed = !l.completed
    },
    /** record the outcome of one lesson exercise (for weak-spot practice) */
    noteResult(key: string, ok: boolean) {
      const a = (this.activity[today()] ??= { xp: 0, items: 0 })
      a.items++
      const m = this.mistakes[key]
      if (!ok) this.mistakes[key] = { n: (m?.n ?? 0) + 1, ok: 0 }
      else if (m && ++m.ok >= 2) delete this.mistakes[key]
    },
    learnWords(ids: string[]) {
      for (const id of ids) this.words[id] ??= { box: 1, due: Date.now() }
    },
    reviewWord(id: string, knew: boolean) {
      const w = (this.words[id] ??= { box: 1, due: Date.now() })
      w.box = knew ? Math.min(5, w.box + 1) : 1
      w.due = Date.now() + BOX_DAYS[knew ? w.box : 0] * 864e5
    },
    exportJson() {
      const { loaded, ...state } = this.$state
      return JSON.stringify(state, null, 2)
    },
    importJson(json: string) {
      const s = JSON.parse(json)
      this.$patch({ ...fresh(), ...s, loaded: true })
    },
    resetAll() {
      this.$patch({ ...fresh(), loaded: true })
      this.lessons = {}
      this.words = {}
      this.mistakes = {}
      this.activity = {}
    },
  },
})

/** debounce-save every change to the server once progress has been loaded */
export function persistProgress(store: ReturnType<typeof useProgress>) {
  let timer: ReturnType<typeof setTimeout> | undefined
  watch(
    () => store.$state,
    () => {
      if (!store.loaded) return
      clearTimeout(timer)
      timer = setTimeout(() => store.save().catch(() => {}), 400)
    },
    { deep: true },
  )
  window.addEventListener('pagehide', () => {
    if (store.loaded && timer) {
      clearTimeout(timer)
      const { loaded, ...state } = store.$state
      fetch('/api/progress', { method: 'PUT', body: JSON.stringify(state), headers: { 'content-type': 'application/json' }, keepalive: true })
    }
  })
}
