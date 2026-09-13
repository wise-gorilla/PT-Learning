<script setup lang="ts">
import type { Exercise } from '../../types'
import TextAnswer from './TextAnswer.vue'

defineProps<{ ex: Extract<Exercise, { type: 'translate' }> }>()
const emit = defineEmits<{ answer: [correct: boolean, solution?: string] }>()
</script>

<template>
  <div>
    <p class="text-sm font-bold uppercase tracking-wide text-stone-400">Traduz para português · Translate into Portuguese</p>
    <p class="mt-2 text-xl font-bold">🇬🇧 {{ ex.en }}</p>
    <div class="mt-4"><TextAnswer :answers="ex.answers" @answer="(ok, s) => emit('answer', ok, s)" /></div>
  </div>
</template>
