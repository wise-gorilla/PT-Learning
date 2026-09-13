<script setup lang="ts">
import { computed, ref } from 'vue'
import { dictionary, units, lessonMap, type DictEntry } from '../data'
import type { Exercise } from '../types'
import { stripAccents, sample } from '../utils'
import { vocabGames } from '../data/generate'
import { useProgress } from '../stores/progress'
import SpeakButton from '../components/SpeakButton.vue'
import ExerciseRunner from '../components/ExerciseRunner.vue'

const p = useProgress()
const q = ref('')
const unit = ref(0)
const tag = ref('')
const onlyMine = ref(false)
const quiz = ref<Exercise[] | null>(null)

const tags = computed(() => [...new Set(dictionary.map((d) => d.tag).filter(Boolean))].sort() as string[])
const norm = (s: string) => stripAccents(s.toLowerCase())
const filtered = computed(() =>
  dictionary.filter(
    (d) =>
      (!unit.value || d.unit === unit.value) &&
      (!tag.value || d.tag === tag.value) &&
      (!onlyMine.value || p.words[d.id]) &&
      (!q.value || norm(d.pt).includes(norm(q.value)) || norm(d.en).includes(norm(q.value))),
  ),
)
const gender = (g?: string) => (g === 'm' ? 'o' : g === 'f' ? 'a' : g === 'mf' ? 'o/a' : '')

function makeQuiz(pool: DictEntry[]) {
  const src = pool.length >= 4 ? pool : dictionary
  const ex: Exercise[] = vocabGames(src, dictionary, 14)
  const w = sample(src, 1)[0]
  const opts = sample([w, ...sample(dictionary.filter((d) => d.id !== w.id), 3)], 4)
  ex.unshift({ type: 'mc', q: { pt: `O que significa “${w.pt}”?`, en: `What does “${w.pt}” mean?` }, options: opts.map((o) => o.en), answer: opts.indexOf(w) })
  const lw = sample(src, 1)[0]
  ex.push({ type: 'listen', pt: lw.pt, en: lw.en })
  quiz.value = ex
}
</script>

<template>
  <div>
    <div v-if="quiz">
      <button class="btn-ghost mb-4" @click="quiz = null">‹ Voltar ao dicionário · Back</button>
      <ExerciseRunner :exercises="quiz" @finish="(s) => s >= 60 && p.addXp(20)">
        <template #after><button class="btn-primary" @click="makeQuiz(filtered)">🎲 Novo quiz · New quiz</button></template>
      </ExerciseRunner>
    </div>
    <template v-else>
      <h1 class="text-3xl font-extrabold">📖 Dicionário <span class="en !text-lg">Mini dictionary</span></h1>
      <p class="text-stone-500">{{ dictionary.length }} palavras de todas as lições · words from all lessons</p>

      <div class="card sticky top-[53px] z-10 mt-4 flex flex-wrap gap-2 p-3">
        <input v-model="q" class="input flex-1 !text-base" placeholder="🔍 Procurar (pt ou en) · Search" />
        <select v-model.number="unit" class="input !w-auto !text-base">
          <option :value="0">Todas as unidades · All units</option>
          <option v-for="u in units" :key="u.n" :value="u.n">{{ u.n }}. {{ u.title.pt }}</option>
        </select>
        <select v-model="tag" class="input !w-auto !text-base">
          <option value="">Todos os temas · All topics</option>
          <option v-for="t in tags" :key="t" :value="t">{{ t }}</option>
        </select>
        <label class="flex items-center gap-2 px-2 text-sm font-semibold"><input v-model="onlyMine" type="checkbox" class="h-4 w-4 accent-verde" /> As minhas · Mine</label>
        <button class="btn-primary" @click="makeQuiz(filtered)">🎲 Quiz ({{ filtered.length }})</button>
      </div>

      <div class="card mt-4 divide-y divide-stone-100 dark:divide-stone-800">
        <div v-for="d in filtered" :key="d.id" class="flex items-center gap-3 px-4 py-2">
          <SpeakButton :text="d.pt" />
          <div class="min-w-0 flex-1">
            <p class="font-bold">
              <span v-if="d.g" class="mr-1 text-sm" :class="d.g === 'f' ? 'text-pink-500' : 'text-sky-600'">{{ gender(d.g) }}</span>{{ d.pt }}
              <span v-if="d.plural" class="text-sm font-normal text-stone-400">(pl. {{ d.plural }})</span>
              <span class="mx-2 text-stone-300">—</span><span class="font-normal">{{ d.en }}</span>
            </p>
            <p v-if="d.ex" class="truncate text-sm text-stone-500">{{ d.ex.pt }} <span class="en">· {{ d.ex.en }}</span></p>
          </div>
          <RouterLink :to="`/lesson/${d.lessonId}/vocab`" class="hidden shrink-0 text-xs text-stone-400 hover:text-verde sm:block">{{ lessonMap[d.lessonId]?.emoji }} U{{ d.unit }}</RouterLink>
          <button class="shrink-0 text-lg" :title="p.words[d.id] ? 'Na revisão · In review' : 'Adicionar à revisão · Add to review'" @click="p.learnWords([d.id])">{{ p.words[d.id] ? '🧠' : '➕' }}</button>
        </div>
        <p v-if="!filtered.length" class="p-6 text-center text-stone-400">Nada encontrado · Nothing found</p>
      </div>
    </template>
  </div>
</template>
