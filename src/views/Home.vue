<script setup lang="ts">
import { computed } from 'vue'
import { units, lessons, lessonsOfUnit, lessonMap, dictionary } from '../data'
import { useProgress } from '../stores/progress'

const p = useProgress()
const pct = computed(() => (lessons.length ? Math.round((p.completedCount / lessons.length) * 100) : 0))
const cont = computed(() => {
  const last = p.lastLesson && lessonMap[p.lastLesson]
  if (last && !p.lessons[last.id]?.completed) return last
  return lessons.find((l) => !p.lessons[l.id]?.completed) ?? lessons[0]
})
function unitPct(n: number) {
  const ls = lessonsOfUnit(n)
  return ls.length ? Math.round((ls.filter((l) => p.lessons[l.id]?.completed).length / ls.length) * 100) : 0
}
function status(id: string) {
  const l = p.lessons[id]
  return l?.completed ? 'done' : l?.visited ? 'started' : 'new'
}
function starsOf(id: string) {
  const s = p.lessons[id]?.bestScore ?? 0
  return s >= 90 ? 3 : s >= 70 ? 2 : s >= 50 ? 1 : 0
}
</script>

<template>
  <div>
    <section class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-verde via-emerald-700 to-emerald-900 p-6 text-white sm:p-8">
      <div class="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-vermelho/70 blur-2xl" />
      <div class="absolute -bottom-10 right-24 h-32 w-32 rounded-full bg-ouro/50 blur-2xl" />
      <div class="relative">
        <p class="font-bold opacity-80">Olá! 👋 Bem-vindo ao teu curso</p>
        <h1 class="text-3xl font-extrabold sm:text-4xl">Português Europeu A1 → A2</h1>
        <p class="opacity-80">Hello! Welcome to your European Portuguese course</p>
        <div class="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div class="rounded-2xl bg-white/15 p-3"><p class="text-2xl font-extrabold">{{ pct }}%</p><p class="text-sm opacity-80">progresso · progress</p></div>
          <div class="rounded-2xl bg-white/15 p-3"><p class="text-2xl font-extrabold">{{ p.completedCount }}/{{ lessons.length }}</p><p class="text-sm opacity-80">lições · lessons</p></div>
          <div class="rounded-2xl bg-white/15 p-3"><p class="text-2xl font-extrabold">🔥 {{ p.streak.count }}</p><p class="text-sm opacity-80">dias seguidos · day streak</p></div>
          <div class="rounded-2xl bg-white/15 p-3"><p class="text-2xl font-extrabold">{{ Object.keys(p.words).length }}/{{ dictionary.length }}</p><p class="text-sm opacity-80">palavras · words</p></div>
        </div>
        <div class="mt-5 flex flex-wrap gap-3">
          <RouterLink v-if="cont" :to="`/lesson/${cont.id}`" class="btn bg-ouro text-stone-900 shadow-[0_4px_0_#a37f00] active:translate-y-1 active:shadow-none">
            ▶ Continuar · Continue: {{ cont.emoji }} {{ cont.title.pt }}
          </RouterLink>
          <RouterLink v-if="p.dueWords.length" to="/review" class="btn bg-white/20 hover:bg-white/30">🧠 Rever {{ p.dueWords.length }} palavras · Review</RouterLink>
        </div>
      </div>
    </section>

    <div v-if="!lessons.length" class="card mt-6 p-6 text-center">A carregar lições… · No lessons found yet.</div>

    <template v-for="lvl in ['A1', 'A2']" :key="lvl">
      <h2 class="mt-10 flex items-center gap-3 text-2xl font-extrabold">
        <span class="rounded-xl px-3 py-1 text-white" :class="lvl === 'A1' ? 'bg-verde' : 'bg-vermelho'">{{ lvl }}</span>
        {{ lvl === 'A1' ? 'Iniciante' : 'Elementar' }}
        <span class="en !text-base">{{ lvl === 'A1' ? 'Beginner' : 'Elementary' }}</span>
      </h2>
      <div class="mt-4 space-y-6">
        <section v-for="u in units.filter((x) => x.level === lvl)" :key="u.n" class="card p-4 sm:p-5">
          <div class="flex items-center gap-3">
            <span class="text-4xl">{{ u.emoji }}</span>
            <div class="flex-1">
              <p class="text-xs font-bold uppercase tracking-wider text-stone-400">Unidade · Unit {{ u.n }}</p>
              <h3 class="text-xl font-extrabold">{{ u.title.pt }} <span class="en">{{ u.title.en }}</span></h3>
            </div>
            <div class="relative h-12 w-12">
              <svg viewBox="0 0 36 36" class="h-12 w-12 -rotate-90"><circle cx="18" cy="18" r="15" fill="none" stroke-width="4" class="stroke-stone-200 dark:stroke-stone-800" /><circle cx="18" cy="18" r="15" fill="none" stroke-width="4" stroke-linecap="round" class="stroke-verde transition-all" :stroke-dasharray="`${unitPct(u.n) * 0.9425} 94.25`" /></svg>
              <span class="absolute inset-0 flex items-center justify-center text-xs font-bold">{{ unitPct(u.n) }}%</span>
            </div>
          </div>
          <div class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <RouterLink v-for="l in lessonsOfUnit(u.n)" :key="l.id" :to="`/lesson/${l.id}`"
              class="group relative rounded-2xl border-2 border-b-4 p-3 transition hover:-translate-y-0.5"
              :class="status(l.id) === 'done' ? 'border-verde bg-verde/5' : status(l.id) === 'started' ? 'border-ouro bg-ouro/5' : 'border-stone-200 dark:border-stone-700'">
              <div class="flex items-start justify-between">
                <span class="text-3xl transition group-hover:scale-110">{{ l.emoji }}</span>
                <span v-if="status(l.id) === 'done'" class="text-sm">{{ '⭐'.repeat(starsOf(l.id)) || '✅' }}</span>
                <span v-else-if="status(l.id) === 'started'" class="text-xs font-bold text-amber-600">em curso</span>
              </div>
              <p class="mt-1 font-bold leading-tight">{{ l.title.pt }}</p>
              <p class="en leading-tight">{{ l.title.en }}</p>
            </RouterLink>
          </div>
        </section>
      </div>
    </template>
  </div>
</template>
