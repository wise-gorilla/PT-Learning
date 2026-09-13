<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Exercise } from '../types'
import { vocabGames } from '../data/generate'
import { dictionary } from '../data'
import { useRouter } from 'vue-router'
import { lessonMap, neighbours, units } from '../data'
import { useProgress } from '../stores/progress'
import Blocks from '../components/Blocks.vue'
import VerbTable from '../components/VerbTable.vue'
import SpeakButton from '../components/SpeakButton.vue'
import ExerciseRunner from '../components/ExerciseRunner.vue'

const props = defineProps<{ id: string; tab?: string }>()
const router = useRouter()
const p = useProgress()
const lesson = computed(() => lessonMap[props.id])
const unit = computed(() => units.find((u) => u.n === lesson.value?.unit))
const nav = computed(() => neighbours(props.id))
const prog = computed(() => p.lessons[props.id])

const tabs = computed(() => {
  const l = lesson.value
  if (!l) return []
  return [
    ...(l.sections.length ? [{ key: 'learn', icon: '📘', pt: 'Aprender', en: 'Learn' }] : []),
    ...(l.vocab.length ? [{ key: 'vocab', icon: '🗂️', pt: 'Vocabulário', en: 'Vocabulary' }] : []),
    ...(l.verbs.length ? [{ key: 'verbs', icon: '🔤', pt: 'Verbos', en: 'Verbs' }] : []),
    { key: 'practice', icon: '🎯', pt: 'Praticar', en: 'Practice' },
  ]
})
const active = computed(() => tabs.value.find((t) => t.key === props.tab)?.key ?? tabs.value[0]?.key)
const go = (tab: string) => router.replace(`/lesson/${props.id}/${tab}`)

watch(
  () => props.id,
  (id) => lessonMap[id] && p.visit(id),
  { immediate: true },
)

const practiceMode = ref<'lesson' | 'games'>('lesson')
const games = ref<Exercise[]>([])
const gamesKey = ref(0)
function startGames() {
  games.value = vocabGames(lesson.value.vocab, dictionary)
  gamesKey.value++
  practiceMode.value = 'games'
}
watch(() => props.id, () => (practiceMode.value = 'lesson'))

function onFinish(score: number) {
  p.finishLesson(props.id, score)
  if (score >= 60) p.learnWords(lesson.value.vocab.map((v) => v.pt.toLowerCase()))
}
const gender = (g?: string) => (g === 'm' ? 'o' : g === 'f' ? 'a' : g === 'mf' ? 'o/a' : '')
</script>

<template>
  <div v-if="lesson">
    <div class="flex flex-wrap items-center gap-2 text-sm font-semibold text-stone-500">
      <RouterLink to="/" class="hover:text-verde">🗺️ Curso</RouterLink> ›
      <span>{{ unit?.emoji }} Unidade {{ lesson.unit }}: {{ unit?.title.pt }}</span>
      <span class="rounded-md px-1.5 text-xs text-white" :class="lesson.level === 'A1' ? 'bg-verde' : 'bg-vermelho'">{{ lesson.level }}</span>
    </div>

    <header class="mt-3 flex flex-wrap items-center gap-4">
      <span class="text-6xl">{{ lesson.emoji }}</span>
      <div class="flex-1">
        <h1 class="text-3xl font-extrabold">{{ lesson.title.pt }}</h1>
        <p class="en !text-base">{{ lesson.title.en }}</p>
        <p class="mt-1">{{ lesson.summary.pt }}</p>
        <p class="en">{{ lesson.summary.en }}</p>
      </div>
      <button class="btn-ghost text-sm" @click="p.toggleComplete(id)">
        {{ prog?.completed ? '✅ Concluída · Done' : '☐ Marcar como concluída · Mark done' }}
      </button>
    </header>

    <div v-if="lesson.objectives" class="mt-4 rounded-2xl bg-sky-50 px-4 py-3 dark:bg-sky-950/40">
      <p class="text-xs font-bold uppercase tracking-wide text-sky-700 dark:text-sky-300">🎯 Objetivos · What you will be able to do</p>
      <p class="mt-1 leading-relaxed">{{ lesson.objectives.pt }}</p>
      <p class="en mt-1 leading-relaxed">{{ lesson.objectives.en }}</p>
    </div>

    <nav class="sticky top-[53px] z-20 -mx-4 mt-5 flex gap-2 overflow-x-auto bg-stone-50/90 px-4 py-2 backdrop-blur dark:bg-stone-950/90">
      <button v-for="t in tabs" :key="t.key" class="btn shrink-0 border-2" :class="active === t.key ? 'border-verde bg-verde text-white' : 'border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-900'" @click="go(t.key)">
        {{ t.icon }} {{ t.pt }} <span class="hidden text-xs opacity-70 sm:inline">· {{ t.en }}</span>
      </button>
    </nav>

    <div class="mt-5">
      <div v-if="active === 'learn'" class="space-y-10">
        <section v-for="(s, i) in lesson.sections" :key="s.id" :id="s.id">
          <h2 class="mb-3 flex items-baseline gap-3 border-b-2 border-verde/20 pb-2 text-2xl font-extrabold">
            <span class="flex h-8 w-8 items-center justify-center rounded-full bg-verde text-base text-white">{{ i + 1 }}</span>
            {{ s.title.pt }} <span class="en !text-base">{{ s.title.en }}</span>
          </h2>
          <Blocks :blocks="s.blocks" />
        </section>
        <div class="flex justify-center"><button class="btn-primary px-8 text-lg" @click="go(tabs[1]?.key ?? 'practice')">Seguinte · Next ›</button></div>
      </div>

      <div v-else-if="active === 'vocab'">
        <div class="grid gap-3 sm:grid-cols-2">
          <div v-for="v in lesson.vocab" :key="v.pt" class="card flex gap-3 p-3">
            <SpeakButton :text="(gender(v.g) && v.g !== 'mf' ? gender(v.g) + ' ' : '') + v.pt" />
            <div class="flex-1">
              <p class="text-lg font-bold">
                <span v-if="v.g" class="mr-1 text-sm font-semibold" :class="v.g === 'f' ? 'text-pink-500' : 'text-sky-600'">{{ gender(v.g) }}</span>{{ v.pt }}
                <span v-if="v.plural" class="text-sm font-normal text-stone-400">(pl. {{ v.plural }})</span>
              </p>
              <p class="en !not-italic !text-base">{{ v.en }}</p>
              <p v-if="v.ex" class="mt-1 text-sm">“{{ v.ex.pt }}” <span class="en block">{{ v.ex.en }}</span></p>
            </div>
          </div>
        </div>
        <div class="mt-6 flex justify-center gap-3">
          <button class="btn-ghost" @click="p.learnWords(lesson.vocab.map((v) => v.pt.toLowerCase()))">🧠 Adicionar à revisão · Add to review</button>
          <button class="btn-primary" @click="go('practice')">🎯 Praticar · Practise</button>
        </div>
      </div>

      <div v-else-if="active === 'verbs'" class="space-y-4">
        <VerbTable v-for="v in lesson.verbs" :key="v" :verb="v" />
      </div>

      <div v-else-if="active === 'practice'">
        <div class="mb-4 flex flex-wrap items-center justify-center gap-2">
          <button class="btn border-2" :class="practiceMode === 'lesson' ? 'border-verde bg-verde/10 text-verde' : 'border-stone-200 dark:border-stone-700'" @click="practiceMode = 'lesson'">
            🎯 Exercícios da lição · Lesson exercises ({{ lesson.exercises.length }})
          </button>
          <button v-if="lesson.vocab.length >= 3" class="btn border-2" :class="practiceMode === 'games' ? 'border-verde bg-verde/10 text-verde' : 'border-stone-200 dark:border-stone-700'" @click="startGames">
            🎲 Jogos de vocabulário · Word games
          </button>
        </div>
        <p v-if="prog?.bestScore && practiceMode === 'lesson'" class="mb-3 text-center text-sm text-stone-500">Melhor resultado · Best score: <b>{{ prog.bestScore }}%</b></p>
        <ExerciseRunner v-if="practiceMode === 'games'" :key="'g' + gamesKey" :exercises="games" @finish="(s) => s >= 60 && p.addXp(15)">
          <template #after><button class="btn-primary" @click="startGames">🎲 Novos jogos · New games</button></template>
        </ExerciseRunner>
        <ExerciseRunner v-else :key="id" :exercises="lesson.exercises" @finish="onFinish">
          <template #after>
            <RouterLink v-if="nav.next" :to="`/lesson/${nav.next.id}`" class="btn-primary">Próxima lição · Next lesson ›</RouterLink>
          </template>
        </ExerciseRunner>
      </div>
    </div>

    <footer class="mt-12 grid grid-cols-2 gap-3 border-t border-stone-200 pt-5 dark:border-stone-800">
      <RouterLink v-if="nav.prev" :to="`/lesson/${nav.prev.id}`" class="card p-3 hover:ring-verde">
        <span class="text-xs text-stone-400">‹ Anterior · Previous</span>
        <p class="font-bold">{{ nav.prev.emoji }} {{ nav.prev.title.pt }}</p>
      </RouterLink>
      <span v-else />
      <RouterLink v-if="nav.next" :to="`/lesson/${nav.next.id}`" class="card p-3 text-right hover:ring-verde">
        <span class="text-xs text-stone-400">Seguinte · Next ›</span>
        <p class="font-bold">{{ nav.next.emoji }} {{ nav.next.title.pt }}</p>
      </RouterLink>
    </footer>
  </div>
  <div v-else class="card p-8 text-center">
    <p class="text-4xl">🤷</p>
    <p class="font-bold">Lição não encontrada · Lesson not found</p>
    <RouterLink to="/" class="btn-primary mt-4">Voltar · Back</RouterLink>
  </div>
</template>
