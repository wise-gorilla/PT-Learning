<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Exercise } from '../../types'
import TextAnswer from './TextAnswer.vue'

const props = defineProps<{ ex: Extract<Exercise, { type: 'fill' }> }>()
const emit = defineEmits<{ answer: [correct: boolean, solution?: string] }>()
const parts = computed(() => props.ex.q.pt.split(/_{2,}/))
const done = ref(false)
function onAnswer(ok: boolean, sol?: string) {
  done.value = true
  emit('answer', ok, sol)
}
</script>

<template>
  <div>
    <p class="text-sm font-bold uppercase tracking-wide text-stone-400">Completa a frase · Fill in the blank</p>
    <p class="mt-2 text-xl font-bold leading-loose">
      {{ parts[0] }}<span class="mx-1 inline-block min-w-16 border-b-2 border-dashed border-verde text-center text-verde">{{ done ? ex.answers[0] : '?' }}</span>{{ parts[1] }}
    </p>
    <p class="en">{{ ex.q.en }}</p>
    <p v-if="ex.hint" class="mt-1 text-sm text-stone-500">💡 {{ ex.hint }}</p>
    <div class="mt-4"><TextAnswer :answers="ex.answers" @answer="onAnswer" /></div>
    <div v-if="done && ex.explain" class="mt-4 rounded-xl bg-sky-50 px-4 py-2 dark:bg-sky-950/40">
      <p>{{ ex.explain.pt }}</p>
      <p class="en">{{ ex.explain.en }}</p>
    </div>
  </div>
</template>
