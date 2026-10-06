<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { Exercise } from '../../types'
import { speak } from '../../utils'
import { useProgress } from '../../stores/progress'
import TextAnswer from './TextAnswer.vue'

const props = defineProps<{ ex: Extract<Exercise, { type: 'listen' }> }>()
const emit = defineEmits<{ answer: [correct: boolean, solution?: string] }>()
const p = useProgress()
const done = ref(false)
onMounted(() => setTimeout(() => speak(props.ex.pt, p.settings.rate), 300))
</script>

<template>
  <div>
    <p class="text-sm font-bold uppercase tracking-wide text-stone-400">Ouve e escreve · Listen and type</p>
    <div class="mt-3 flex items-center gap-3">
      <button class="flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-500 text-3xl text-white shadow-[0_4px_0_#0369a1] active:translate-y-1 active:shadow-none" @click="speak(ex.pt, p.settings.rate)">🔊</button>
      <button class="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-xl dark:bg-sky-900" title="Devagar / Slow" @click="speak(ex.pt, 0.55)">🐢</button>
      <p v-if="done" class="en !text-base">{{ ex.en }}</p>
    </div>
    <div class="mt-4"><TextAnswer :answers="[ex.pt]" @answer="(ok, s) => { done = true; emit('answer', ok, s) }" /></div>
  </div>
</template>
