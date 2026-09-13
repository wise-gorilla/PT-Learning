<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { Exercise } from '../../types'
import { shuffle, speak } from '../../utils'
import { useProgress } from '../../stores/progress'

const props = defineProps<{ ex: Extract<Exercise, { type: 'listenmc' }> }>()
const emit = defineEmits<{ answer: [correct: boolean, solution?: string] }>()
const p = useProgress()
const order = shuffle(props.ex.options.map((_, i) => i))
const picked = ref<number | null>(null)
onMounted(() => setTimeout(() => speak(props.ex.pt, p.settings.rate), 300))

function pick(i: number) {
  if (picked.value !== null) return
  picked.value = i
  emit('answer', i === props.ex.answer, `${props.ex.pt} = ${props.ex.options[props.ex.answer]}`)
}
</script>

<template>
  <div>
    <p class="text-sm font-bold uppercase tracking-wide text-stone-400">Ouve e escolhe · Listen and choose 🎧</p>
    <div class="mt-4 flex items-center justify-center gap-4">
      <button class="flex h-24 w-24 items-center justify-center rounded-full bg-sky-500 text-5xl text-white shadow-[0_6px_0_#0369a1] transition active:translate-y-1.5 active:shadow-none" @click="speak(ex.pt, p.settings.rate)">🔊</button>
      <button class="flex h-14 w-14 items-center justify-center rounded-full bg-sky-100 text-2xl dark:bg-sky-900" title="Devagar / Slow" @click="speak(ex.pt, 0.55)">🐢</button>
    </div>
    <p class="mt-3 h-7 text-center text-lg font-bold text-verde">{{ picked !== null ? ex.pt : '' }}</p>
    <div class="mt-3 grid gap-3 sm:grid-cols-2">
      <button v-for="i in order" :key="i" class="chip text-lg"
        :class="picked !== null && i === ex.answer ? '!border-verde !bg-verde/10' : picked === i ? '!border-vermelho !bg-vermelho/10 shake' : ''"
        @click="pick(i)">{{ ex.options[i] }}</button>
    </div>
  </div>
</template>
