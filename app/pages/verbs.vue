<script setup lang="ts">
import { computed, ref } from 'vue'
import { verbs } from '../data/verbs'
import type { Exercise, TenseKey } from '../types'
import { stripAccents, sample, TENSE_LABELS } from '../utils'
import { useProgress } from '../stores/progress'
import VerbTable from '../components/VerbTable.vue'
import ExerciseRunner from '../components/ExerciseRunner.vue'

const p = useProgress()
const q = ref('')
const kind = ref<'all' | 'regular' | 'irregular' | 'ar' | 'er' | 'ir'>('all')
const tenses = ref<TenseKey[]>(['presente'])
const selected = ref<string | null>(null)
const drill = ref<Exercise[] | null>(null)
const allTenses = Object.keys(TENSE_LABELS) as TenseKey[]

const filtered = computed(() =>
  verbs.filter((v) => {
    const base = v.inf.replace(/-se$/, '')
    if (q.value && !stripAccents(v.inf + ' ' + v.en).toLowerCase().includes(stripAccents(q.value.toLowerCase()))) return false
    if (kind.value === 'regular') return !v.irregular
    if (kind.value === 'irregular') return !!v.irregular
    if (kind.value === 'ar') return base.endsWith('ar')
    if (kind.value === 'er') return base.endsWith('er')
    if (kind.value === 'ir') return base.endsWith('ir') || base.endsWith('ôr')
    return true
  }),
)
function toggleTense(t: TenseKey) {
  tenses.value = tenses.value.includes(t) ? tenses.value.filter((x) => x !== t) : [...tenses.value, t]
  if (!tenses.value.length) tenses.value = [t]
}
function startDrill() {
  const pool = filtered.value.length ? filtered.value : verbs
  const ex: Exercise[] = sample(pool, Math.min(8, pool.length)).map((v) => {
    const t = sample(tenses.value, 1)[0]
    const n = t === 'imperativo' ? 4 : 5
    return { type: 'conj', verb: v.inf, tense: t, persons: sample([...Array(n).keys()], 3).sort() }
  })
  // add some multiple-choice form recognition
  for (const v of sample(pool, Math.min(4, pool.length))) {
    const t = sample(tenses.value, 1)[0]
    const forms = v.forms[t]
    if (!forms || t === 'imperativo') continue
    const i = Math.floor(Math.random() * 5)
    const wrong = sample(allTenses.filter((x) => x !== t && x !== 'imperativo').map((x) => v.forms[x]?.[i]).filter((f): f is string => !!f && f !== forms[i]), 3)
    const opts = sample([...new Set([forms[i], ...wrong])], 4)
    ex.push({ type: 'mc', q: { pt: `${['eu', 'tu', 'ele/ela', 'nós', 'eles/elas'][i]} ___ (${v.inf}, ${TENSE_LABELS[t].pt})`, en: `${['I', 'you', 'he/she', 'we', 'they'][i]} … (${v.en}, ${TENSE_LABELS[t].en})` }, options: opts, answer: opts.indexOf(forms[i]) })
  }
  drill.value = sample(ex, ex.length)
}
</script>

<template>
  <div>
    <div v-if="drill">
      <button class="btn-ghost mb-4" @click="drill = null">‹ Voltar aos verbos · Back</button>
      <ExerciseRunner :exercises="drill" @finish="(s) => s >= 60 && p.addXp(20)">
        <template #after><button class="btn-primary" @click="startDrill">🎲 Novo treino · New drill</button></template>
      </ExerciseRunner>
    </div>
    <template v-else>
      <h1 class="text-3xl font-extrabold">🔤 Verbos <span class="en !text-lg">Verb conjugation tables</span></h1>
      <p class="text-stone-500">{{ verbs.length }} verbos · Clica numa forma para ouvir · Click a form to hear it</p>

      <div class="card mt-4 space-y-3 p-3">
        <div class="flex flex-wrap gap-2">
          <input v-model="q" class="input flex-1 !text-base" placeholder="🔍 Procurar verbo · Search verb" />
          <select v-model="kind" class="input !w-auto !text-base">
            <option value="all">Todos · All</option>
            <option value="regular">Regulares · Regular</option>
            <option value="irregular">Irregulares · Irregular</option>
            <option value="ar">-ar</option>
            <option value="er">-er</option>
            <option value="ir">-ir</option>
          </select>
        </div>
        <div class="flex flex-wrap gap-2">
          <button v-for="t in allTenses" :key="t" class="rounded-full border-2 px-3 py-1 text-sm font-semibold" :class="tenses.includes(t) ? 'border-verde bg-verde text-white' : 'border-stone-200 dark:border-stone-700'" @click="toggleTense(t)">
            {{ TENSE_LABELS[t].pt }}
          </button>
          <button class="btn-primary ml-auto" @click="startDrill">🏋️ Treinar · Drill</button>
        </div>
      </div>

      <div class="mt-4 flex flex-wrap gap-2">
        <button v-for="v in filtered" :key="v.inf" class="chip !py-1" :class="selected === v.inf ? '!border-verde !bg-verde/10' : ''" @click="selected = selected === v.inf ? null : v.inf">
          {{ v.inf }}<span v-if="v.irregular" class="text-vermelho">*</span>
        </button>
      </div>

      <div class="mt-5 space-y-4">
        <VerbTable v-if="selected" :verb="selected" :tenses="tenses" />
        <template v-else>
          <VerbTable v-for="v in filtered.slice(0, 12)" :key="v.inf" :verb="v.inf" :tenses="tenses" />
          <p v-if="filtered.length > 12" class="text-center text-sm text-stone-500">Escolhe um verbo acima para ver os outros · Pick a verb above to see the rest</p>
        </template>
      </div>
    </template>
  </div>
</template>
