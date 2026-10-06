<script setup lang="ts">
import { ref } from 'vue'
import type { Exercise } from '../../types'
import { speak } from '../../utils'
import { useProgress } from '../../stores/progress'

const props = defineProps<{ ex: Extract<Exercise, { type: 'spot' }> }>()
const emit = defineEmits<{ answer: [correct: boolean, solution?: string] }>()
const p = useProgress()
const picked = ref<number | null>(null)

function pick(i: number) {
  if (picked.value !== null) return
  picked.value = i
  const fixed = props.ex.words.map((w, k) => (k === props.ex.wrong ? props.ex.fix : w)).join(' ')
  speak(fixed, p.settings.rate)
  emit('answer', i === props.ex.wrong, `${props.ex.words[props.ex.wrong]} → ${props.ex.fix}`)
}
</script>

<template>
  <div>
    <p class="text-sm font-bold uppercase tracking-wide text-stone-400">Encontra o erro · Find the mistake 🕵️</p>
    <p class="en mt-1">Toca na palavra errada. · Tap the wrong word. — “{{ ex.en }}”</p>
    <div class="mt-5 flex flex-wrap gap-2 text-xl">
      <button v-for="(w, i) in ex.words" :key="i" class="rounded-xl border-2 border-transparent px-2 py-1 font-semibold transition hover:border-stone-300 dark:hover:border-stone-600"
        :class="picked === null ? '' : i === ex.wrong ? '!border-verde bg-verde/10' : i === picked ? '!border-vermelho bg-vermelho/10 shake' : 'opacity-60'"
        @click="pick(i)">
        <span :class="picked !== null && i === ex.wrong ? 'text-vermelho line-through' : ''">{{ w }}</span>
        <span v-if="picked !== null && i === ex.wrong" class="ml-1 text-verde">{{ ex.fix }}</span>
      </button>
    </div>
    <div v-if="picked !== null && ex.explain" class="mt-4 rounded-xl bg-sky-50 px-4 py-2 dark:bg-sky-950/40">
      <p>{{ ex.explain.pt }}</p>
      <p class="en">{{ ex.explain.en }}</p>
    </div>
  </div>
</template>
