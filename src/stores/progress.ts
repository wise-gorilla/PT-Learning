import { defineStore } from 'pinia'
import { watch } from 'vue'

const KEY = 'pt-progress-v1'
const BOX_DAYS = [0, 1, 3, 7, 16, 35]

export interface LessonProgress {
  completed: boolean
  bestScore: number // 0..100
  visited: number // timestamp
  attempts: number
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
}

interface State {
  lessons: Record<string, LessonProgress>
  xp: number
  streak: { count: number; last: string }
  words: Record<string, WordState>
  lastLesson: string | null
  settings: Settings
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

function fresh(): State {
  return {
    lessons: {},
    xp: 0,
    streak: { count: 0, last: '' },
    words: {},
    lastLesson: null,
    settings: { enMode: 'show', sound: true, dark: false, accentStrict: false, rate: 0.9 },
  }
}

function load(): State {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return fresh()
    const s = JSON.parse(raw)
    const f = fresh()
    return { ...f, ...s, settings: { ...f.settings, ...(s.settings ?? {}) } }
  } catch {
    return fresh()
  }
}

export const useProgress = defineStore('progress', {
  state: load,
  getters: {
    completedCount: (s) => Object.values(s.lessons).filter((l) => l.completed).length,
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
      if (this.streak.last === t) return
      const y = new Date(Date.now() - 864e5).toISOString().slice(0, 10)
      this.streak.count = this.streak.last === y ? this.streak.count + 1 : 1
      this.streak.last = t
    },
    finishLesson(id: string, score: number) {
      const l = (this.lessons[id] ??= { completed: false, bestScore: 0, visited: Date.now(), attempts: 0 })
      l.attempts++
      l.bestScore = Math.max(l.bestScore, score)
      if (score >= 60) l.completed = true
    },
    toggleComplete(id: string) {
      const l = (this.lessons[id] ??= { completed: false, bestScore: 0, visited: Date.now(), attempts: 0 })
      l.completed = !l.completed
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
      return JSON.stringify(this.$state, null, 2)
    },
    importJson(json: string) {
      const s = JSON.parse(json)
      this.$patch({ ...fresh(), ...s })
    },
    resetAll() {
      this.$patch(fresh())
      this.lessons = {}
      this.words = {}
    },
  },
})

export function persistProgress(store: ReturnType<typeof useProgress>) {
  watch(
    () => store.$state,
    (s) => localStorage.setItem(KEY, JSON.stringify(s)),
    { deep: true },
  )
}
