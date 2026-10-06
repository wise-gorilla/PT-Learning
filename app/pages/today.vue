<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Exercise, TenseKey } from '../types'
import { lessons } from '../data'
import { verbMap } from '../data/verbs'
import { exKey, sample, shuffle } from '../utils'
import { useProgress } from '../stores/progress'
import ExerciseRunner from '../components/ExerciseRunner.vue'

const p = useProgress()

// every lesson exercise, addressable by its stable key
const byKey = new Map<string, Exercise>()
for (const l of lessons) for (const e of l.exercises) byKey.set(exKey(l.id, e), e)

const REVISION_TYPES = new Set(['mc', 'fill', 'cloze', 'translate', 'order', 'tf', 'spot', 'conj', 'sort', 'listenmc', 'scramble'])
const studied = computed(() => lessons.filter((l) => p.lessons[l.id]?.completed || p.lessons[l.id]?.attempts))
const weak = computed(() => p.weakKeys.filter((k) => byKey.has(k)))

const goalPct = computed(() => Math.min(100, Math.round((p.todayXp / p.settings.dailyGoal) * 100)))
const week = computed(() =>
  [...Array(7).keys()].reverse().map((i) => {
    const d = new Date(Date.now() - i * 864e5)
    const key = d.toISOString().slice(0, 10)
    return { key, label: d.toLocaleDateString('pt-PT', { weekday: 'short' }).slice(0, 3), xp: p.activity[key]?.xp ?? 0 }
  }),
)
const weekMax = computed(() => Math.max(p.settings.dailyGoal, ...week.value.map((d) => d.xp)))

const session = ref<{ title: string; list: Exercise[]; keys?: string[] } | null>(null)
const runId = ref(0)
function begin(title: string, list: Exercise[], keys?: string[]) {
  session.value = { title, list, keys }
  runId.value++
}

function startWeak() {
  const ks = shuffle(weak.value).slice(0, 12)
  begin('Pontos fracos · Weak spots', ks.map((k) => byKey.get(k)!), ks)
}

/** interleaved revision: a few exercises from many different studied lessons, weakest lessons first */
function startMix() {
  const ls = [...studied.value].sort((a, b) => (p.lessons[a.id]?.bestScore ?? 0) - (p.lessons[b.id]?.bestScore ?? 0))
  const pool = ls.flatMap((l) => shuffle(l.exercises.filter((e) => REVISION_TYPES.has(e.type)).map((e) => ({ k: exKey(l.id, e), e }))).slice(0, 4))
  const picked = shuffle(sample(pool, Math.min(14, pool.length)))
  begin('Revisão mista · Mixed revision', picked.map((x) => x.e), picked.map((x) => x.k))
}

/** conjugation workout over verbs from lessons already studied, only in tenses already taught */
function startVerbs() {
  const maxUnit = Math.max(1, ...studied.value.map((l) => l.unit))
  const tenses: TenseKey[] = ['presente']
  if (maxUnit >= 10) tenses.push('perfeito')
  if (maxUnit >= 11) tenses.push('imperfeito')
  if (maxUnit >= 13) tenses.push('imperativo')
  if (maxUnit >= 14) tenses.push('futuro', 'condicional')
  if (maxUnit >= 18) tenses.push('presConj')
  const vs = [...new Set(studied.value.flatMap((l) => l.verbs))].filter((v) => verbMap[v])
  const list: Exercise[] = sample(vs, Math.min(8, vs.length)).map((v) => {
    const t = sample(tenses, 1)[0]
    const n = t === 'imperativo' ? 4 : 5
    return { type: 'conj', verb: v, tense: t, persons: sample([...Array(n).keys()], 3).sort() }
  })
  begin('Treino de verbos · Verb workout', list)
}

const next = computed(() => lessons.find((l) => !p.lessons[l.id]?.completed))
</script>

<template>
  <div>
    <h1 class="text-3xl font-extrabold">🎯 Treino diário <span class="en !text-lg">Daily practice</span></h1>
    <p class="text-stone-500">Pouco e todos os dias funciona melhor do que muito de vez em quando. · A little every day beats a lot once in a while.</p>

    <template v-if="!session">
      <div class="card mt-5 flex flex-wrap items-center gap-6 p-5">
        <div class="relative h-24 w-24 shrink-0">
          <svg viewBox="0 0 36 36" class="h-24 w-24 -rotate-90"><circle cx="18" cy="18" r="15" fill="none" stroke-width="4" class="stroke-stone-200 dark:stroke-stone-800" /><circle cx="18" cy="18" r="15" fill="none" stroke-width="4" stroke-linecap="round" class="stroke-verde transition-all" :stroke-dasharray="`${goalPct * 0.9425} 94.25`" /></svg>
          <span class="absolute inset-0 flex flex-col items-center justify-center"><b class="text-xl">{{ p.todayXp }}</b><span class="text-[10px] text-stone-500">/ {{ p.settings.dailyGoal }} XP</span></span>
        </div>
        <div class="min-w-48 flex-1">
          <p class="text-lg font-bold">{{ goalPct >= 100 ? '🎉 Meta de hoje cumprida!' : 'Meta diária · Daily goal' }}</p>
          <p class="en">{{ goalPct >= 100 ? 'Today’s goal reached!' : 'Earn XP by answering exercises. Change the goal in Settings.' }}</p>
          <p class="mt-1 font-semibold">🔥 {{ p.streak.count }} dias seguidos · day streak</p>
        </div>
        <div class="flex h-20 items-end gap-2">
          <div v-for="d in week" :key="d.key" class="flex w-7 flex-col items-center gap-1">
            <div class="w-full rounded-t-md" :class="d.xp >= p.settings.dailyGoal ? 'bg-verde' : 'bg-verde/40'" :style="{ height: Math.max(3, (d.xp / weekMax) * 56) + 'px' }" />
            <span class="text-[10px] uppercase text-stone-500">{{ d.label }}</span>
          </div>
        </div>
      </div>

      <div class="mt-5 grid gap-4 sm:grid-cols-2">
        <RouterLink to="/review" class="card block p-4 hover:ring-verde">
          <p class="text-3xl">🧠</p>
          <p class="font-extrabold">Palavras para hoje <span class="en">Words due today</span></p>
          <p class="text-2xl font-extrabold text-verde">{{ p.dueWords.length }}</p>
          <p class="text-sm text-stone-500">Repetição espaçada: rever mesmo antes de esquecer. · Spaced repetition: review right before you forget.</p>
        </RouterLink>

        <button class="card p-4 text-left hover:ring-verde disabled:opacity-50" :disabled="!weak.length" @click="startWeak">
          <p class="text-3xl">🩹</p>
          <p class="font-extrabold">Pontos fracos <span class="en">Weak spots</span></p>
          <p class="text-2xl font-extrabold text-vermelho">{{ weak.length }}</p>
          <p class="text-sm text-stone-500">Os exercícios que erraste. Acerta 2 vezes seguidas e desaparecem. · Exercises you got wrong. Get them right twice in a row and they disappear.</p>
        </button>

        <button class="card p-4 text-left hover:ring-verde disabled:opacity-50" :disabled="studied.length < 2" @click="startMix">
          <p class="text-3xl">🔀</p>
          <p class="font-extrabold">Revisão mista <span class="en">Mixed revision</span></p>
          <p class="text-sm text-stone-500">14 perguntas de várias lições misturadas — treina escolher a regra certa, não só repetir a última. · 14 questions from different lessons mixed together — you practise choosing the right rule, not just repeating the latest one.</p>
          <p v-if="studied.length < 2" class="mt-1 text-xs text-stone-400">Faz pelo menos 2 lições. · Do at least 2 lessons first.</p>
        </button>

        <button class="card p-4 text-left hover:ring-verde disabled:opacity-50" :disabled="!studied.some((l) => l.verbs.length)" @click="startVerbs">
          <p class="text-3xl">🔤</p>
          <p class="font-extrabold">Treino de verbos <span class="en">Verb workout</span></p>
          <p class="text-sm text-stone-500">Conjuga verbos das lições que já fizeste, só nos tempos que já aprendeste. · Conjugate verbs from lessons you've done, only in tenses you've learned.</p>
        </button>
      </div>

      <div v-if="next" class="card mt-5 p-4">
        <p class="text-sm font-bold uppercase text-stone-400">Próxima lição · Next lesson</p>
        <RouterLink :to="`/lesson/${next.id}`" class="mt-1 block text-xl font-extrabold hover:text-verde">{{ next.emoji }} {{ next.title.pt }} <span class="en">{{ next.title.en }}</span></RouterLink>
      </div>

      <div class="card mt-5 p-4">
        <p class="font-extrabold">💡 Como estudar bem · How to study well</p>
        <ul class="mt-2 list-disc space-y-1 pl-5">
          <li>Diz as frases em voz alta — usa 🔊 e depois o exercício de falar. <span class="en">Say sentences out loud — use 🔊, then the speaking exercise.</span></li>
          <li>Tenta lembrar-te antes de espreitar a resposta. <span class="en">Try to recall the answer before peeking: effort is what makes it stick.</span></li>
          <li>15 minutos por dia &gt; 2 horas ao domingo. <span class="en">15 minutes a day beats 2 hours on Sunday.</span></li>
          <li>Aprende palavras em frases, não em listas. <span class="en">Learn words inside sentences, not in lists.</span></li>
        </ul>
      </div>
    </template>

    <template v-else>
      <div class="mt-4 flex items-center justify-between">
        <h2 class="text-xl font-extrabold">{{ session.title }}</h2>
        <button class="btn-ghost text-sm" @click="session = null">✕ Sair · Exit</button>
      </div>
      <div class="mt-3">
        <ExerciseRunner :key="runId" :exercises="session.list" :keys="session.keys">
          <template #after><button class="btn-primary" @click="session = null">‹ Voltar · Back</button></template>
        </ExerciseRunner>
      </div>
    </template>
  </div>
</template>
