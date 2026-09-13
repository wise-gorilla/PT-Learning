<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Exercise } from '../../types'
import { shuffle, normalize, speak } from '../../utils'
import { useProgress } from '../../stores/progress'

const props = defineProps<{ ex: Extract<Exercise, { type: 'order' }> }>()
const emit = defineEmits<{ answer: [correct: boolean, solution?: string] }>()
const p = useProgress()
const tiles = shuffle(props.ex.words.map((w, id) => ({ w, id })))
const chosen = ref<number[]>([])
const verdict = ref<boolean | null>(null)
const pool = computed(() => tiles.filter((t) => !chosen.value.includes(t.id)))
const sentence = (ws: string[]) => ws.join(' ')

function add(id: number) {
  if (verdict.value === null) chosen.value.push(id)
}
function remove(id: number) {
  if (verdict.value === null) chosen.value = chosen.value.filter((c) => c !== id)
}
function submit() {
  const got = normalize(sentence(chosen.value.map((id) => props.ex.words[id])))
  const valid = [props.ex.words, ...(props.ex.alt ?? [])].map((w) => normalize(sentence(w)))
  verdict.value = valid.includes(got)
  speak(sentence(props.ex.words), p.settings.rate)
  emit('answer', verdict.value, sentence(props.ex.words))
}
</script>

<template>
  <div>
    <p class="text-sm font-bold uppercase tracking-wide text-stone-400">Ordena as palavras · Put the words in order</p>
    <p class="mt-2 text-xl font-bold">🇬🇧 {{ ex.en }}</p>
    <div class="mt-4 flex min-h-16 flex-wrap gap-2 rounded-2xl border-2 border-dashed p-3"
      :class="verdict === true ? 'border-verde bg-verde/5' : verdict === false ? 'border-vermelho bg-vermelho/5 shake' : 'border-stone-300 dark:border-stone-700'">
      <button v-for="id in chosen" :key="id" class="chip pop" @click="remove(id)">{{ ex.words[id] }}</button>
    </div>
    <div class="mt-4 flex flex-wrap gap-2">
      <button v-for="t in pool" :key="t.id" class="chip pop" @click="add(t.id)">{{ t.w }}</button>
    </div>
    <button class="btn-primary mt-5 w-full" :disabled="verdict !== null || chosen.length !== ex.words.length" @click="submit">Verificar · Check</button>
  </div>
</template>
