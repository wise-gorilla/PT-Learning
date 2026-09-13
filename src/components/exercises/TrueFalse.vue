<script setup lang="ts">
import { ref } from 'vue'
import type { Exercise } from '../../types'
import SpeakButton from '../SpeakButton.vue'

const props = defineProps<{ ex: Extract<Exercise, { type: 'tf' }> }>()
const emit = defineEmits<{ answer: [correct: boolean, solution?: string] }>()
const picked = ref<boolean | null>(null)
function pick(v: boolean) {
  if (picked.value !== null) return
  picked.value = v
  emit('answer', v === props.ex.answer, props.ex.answer ? 'Verdadeiro · True' : 'Falso · False')
}
</script>

<template>
  <div>
    <p class="text-sm font-bold uppercase tracking-wide text-stone-400">Verdadeiro ou falso? · True or false?</p>
    <div class="mt-2 flex items-start gap-2">
      <SpeakButton :text="ex.statement.pt" class="mt-1" />
      <div>
        <p class="text-xl font-bold">{{ ex.statement.pt }}</p>
        <p class="en">{{ ex.statement.en }}</p>
      </div>
    </div>
    <div class="mt-5 grid grid-cols-2 gap-3">
      <button v-for="v in [true, false]" :key="String(v)" class="chip py-5 text-xl"
        :class="picked !== null && v === ex.answer ? '!border-verde !bg-verde/10' : picked === v ? '!border-vermelho !bg-vermelho/10 shake' : ''"
        @click="pick(v)">
        {{ v ? '✅ Verdadeiro' : '❌ Falso' }}<span class="en block">{{ v ? 'True' : 'False' }}</span>
      </button>
    </div>
    <div v-if="picked !== null && ex.explain" class="mt-4 rounded-xl bg-sky-50 px-4 py-2 dark:bg-sky-950/40">
      <p>{{ ex.explain.pt }}</p>
      <p class="en">{{ ex.explain.en }}</p>
    </div>
  </div>
</template>
