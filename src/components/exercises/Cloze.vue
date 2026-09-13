<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Exercise } from '../../types'
import { shuffle, normalize, speak } from '../../utils'
import { useProgress } from '../../stores/progress'

const props = defineProps<{ ex: Extract<Exercise, { type: 'cloze' }> }>()
const emit = defineEmits<{ answer: [correct: boolean, solution?: string] }>()
const p = useProgress()
const parts = computed(() => props.ex.text.split(/_{2,}/))
// one tile per answer (duplicates allowed) + bank words not already covered by an answer
const extra = [...props.ex.bank]
for (const a of props.ex.answers) {
  const i = extra.indexOf(a)
  if (i >= 0) extra.splice(i, 1)
}
const bank = shuffle([...props.ex.answers, ...extra]).map((w, id) => ({ w, id }))
const gaps = ref<(number | null)[]>(props.ex.answers.map(() => null))
const checked = ref(false)
const used = computed(() => new Set(gaps.value.filter((g): g is number => g !== null)))
const full = (i: number) => bank.find((b) => b.id === gaps.value[i])?.w ?? ''

function place(id: number) {
  if (checked.value) return
  const i = gaps.value.indexOf(null)
  if (i >= 0) gaps.value[i] = id
}
function clear(i: number) {
  if (!checked.value) gaps.value[i] = null
}
const right = (i: number) => normalize(full(i)) === normalize(props.ex.answers[i])
function submit() {
  checked.value = true
  const ok = props.ex.answers.every((_, i) => right(i))
  speak(parts.value.map((pt, i) => pt + (props.ex.answers[i] ?? '')).join(''), p.settings.rate)
  emit('answer', ok, props.ex.answers.join(', '))
}
</script>

<template>
  <div>
    <p class="text-sm font-bold uppercase tracking-wide text-stone-400">Completa o texto · Complete the text 📝</p>
    <p v-if="ex.q" class="mt-1 font-bold">{{ ex.q.pt }} <span class="en">{{ ex.q.en }}</span></p>
    <p class="mt-3 text-lg leading-[2.6]">
      <template v-for="(pt, i) in parts" :key="i">
        <span class="whitespace-pre-line">{{ pt }}</span>
        <button v-if="i < parts.length - 1" class="mx-1 inline-block min-w-20 rounded-lg border-b-4 px-2 py-0.5 text-center font-bold align-baseline"
          :class="checked ? (right(i) ? 'border-verde bg-verde/10 text-verde' : 'border-vermelho bg-vermelho/10 text-vermelho') : gaps[i] !== null ? 'border-sky-500 bg-sky-50 dark:bg-sky-950' : 'border-stone-300 bg-stone-100 dark:border-stone-600 dark:bg-stone-800'"
          @click="clear(i)">
          {{ full(i) || (i + 1) }}<span v-if="checked && !right(i)" class="ml-1 text-verde">→ {{ ex.answers[i] }}</span>
        </button>
      </template>
    </p>
    <p v-if="checked" class="en mt-2">{{ ex.en }}</p>
    <div class="mt-4 flex flex-wrap gap-2">
      <button v-for="b in bank" :key="b.id" class="chip" :class="used.has(b.id) ? 'invisible' : ''" @click="place(b.id)">{{ b.w }}</button>
    </div>
    <button class="btn-primary mt-5 w-full" :disabled="checked || gaps.includes(null)" @click="submit">Verificar · Check</button>
  </div>
</template>
