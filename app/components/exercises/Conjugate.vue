<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { Exercise } from '../../types'
import { verbMap } from '../../data/verbs'
import { check, PERSONS, IMP_PERSONS, TENSE_LABELS, type Verdict } from '../../utils'
import AccentKeys from '../AccentKeys.vue'
import { useProgress } from '../../stores/progress'

const props = defineProps<{ ex: Extract<Exercise, { type: 'conj' }> }>()
const emit = defineEmits<{ answer: [correct: boolean, solution?: string] }>()
const p = useProgress()
const v = computed(() => verbMap[props.ex.verb])
const forms = computed(() => v.value?.forms[props.ex.tense] ?? [])
const labels = computed(() => (props.ex.tense === 'imperativo' ? IMP_PERSONS : PERSONS))
const persons = computed(() => props.ex.persons.filter((i) => i < forms.value.length))
const values = ref<Record<number, string>>({})
const verdicts = ref<Record<number, Verdict> | null>(null)
const first = ref<HTMLInputElement[]>([])
onMounted(() => first.value[0]?.focus())

function submit() {
  const out: Record<number, Verdict> = {}
  let ok = true
  for (const i of persons.value) {
    const answers = forms.value[i].split('/').map((s) => s.trim())
    // accept with or without the pronoun
    const withPron = answers.map((a) => labels.value[i].split('/')[0].replace(/[()]/g, '') + ' ' + a)
    out[i] = check(values.value[i] ?? '', [...answers, ...withPron])
    if (out[i] === 'wrong' || (out[i] === 'accent' && p.settings.accentStrict)) ok = false
  }
  verdicts.value = out
  emit('answer', ok, persons.value.map((i) => `${labels.value[i]} ${forms.value[i]}`).join(' · '))
}
</script>

<template>
  <div v-if="v">
    <p class="text-sm font-bold uppercase tracking-wide text-stone-400">Conjuga o verbo · Conjugate the verb</p>
    <p class="mt-2 text-2xl font-extrabold text-verde">{{ v.inf }} <span class="en !text-base">{{ v.en }}</span></p>
    <p class="font-bold">{{ TENSE_LABELS[ex.tense].pt }} <span class="en">{{ TENSE_LABELS[ex.tense].en }}</span></p>
    <form class="mt-4 space-y-2" @submit.prevent="submit">
      <div v-for="i in persons" :key="i" class="flex items-center gap-3">
        <label class="w-36 shrink-0 text-right font-semibold text-stone-500">{{ labels[i] }}</label>
        <input ref="first" v-model="values[i]" class="input !py-1.5" :disabled="!!verdicts" autocomplete="off" autocapitalize="off" spellcheck="false"
          :class="verdicts ? (verdicts[i] === 'correct' ? '!border-verde' : verdicts[i] === 'accent' ? '!border-ouro' : '!border-vermelho') : ''" />
        <span v-if="verdicts && verdicts[i] !== 'correct'" class="w-32 shrink-0 font-bold text-verde">{{ forms[i] }}</span>
      </div>
      <AccentKeys :disabled="!!verdicts" />
      <button type="submit" class="btn-primary mt-3 w-full" :disabled="!!verdicts">Verificar · Check</button>
    </form>
  </div>
  <div v-else>
    <p>Verb “{{ ex.verb }}” not found.</p>
    <button class="btn-ghost mt-2" @click="emit('answer', true)">Skip</button>
  </div>
</template>
