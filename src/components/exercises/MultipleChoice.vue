<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Exercise } from '../../types'
import { shuffle } from '../../utils'
import SpeakButton from '../SpeakButton.vue'

const props = defineProps<{ ex: Extract<Exercise, { type: 'mc' }> }>()
const emit = defineEmits<{ answer: [correct: boolean, solution?: string] }>()
const order = shuffle(props.ex.options.map((_, i) => i))
const picked = ref<number | null>(null)
const done = computed(() => picked.value !== null)

function pick(i: number) {
  if (done.value) return
  picked.value = i
  emit('answer', i === props.ex.answer, props.ex.options[props.ex.answer])
}
</script>

<template>
  <div>
    <p class="text-sm font-bold uppercase tracking-wide text-stone-400">Escolhe a resposta certa · Choose the right answer</p>
    <div class="mt-2 flex items-start gap-2">
      <SpeakButton :text="ex.q.pt.replace(/_+/g, '…')" class="mt-1" />
      <div>
        <p class="text-xl font-bold">{{ ex.q.pt }}</p>
        <p class="en">{{ ex.q.en }}</p>
      </div>
    </div>
    <div class="mt-5 grid gap-3 sm:grid-cols-2">
      <button
        v-for="(i, k) in order"
        :key="i"
        class="chip flex items-center gap-3 text-left text-lg"
        :class="done && i === ex.answer ? '!border-verde !bg-verde/10' : done && i === picked ? '!border-vermelho !bg-vermelho/10 shake' : ''"
        @click="pick(i)"
      >
        <kbd class="rounded-md border border-stone-300 px-1.5 text-xs text-stone-400">{{ k + 1 }}</kbd>
        {{ ex.options[i] }}
      </button>
    </div>
    <div v-if="done && ex.explain" class="mt-4 rounded-xl bg-sky-50 px-4 py-2 dark:bg-sky-950/40">
      <p>{{ ex.explain.pt }}</p>
      <p class="en">{{ ex.explain.en }}</p>
    </div>
  </div>
</template>
