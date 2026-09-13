<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Exercise } from '../../types'
import { speak } from '../../utils'
import { useProgress } from '../../stores/progress'

const props = defineProps<{ ex: Extract<Exercise, { type: 'flash' }> }>()
const emit = defineEmits<{ answer: [correct: boolean, solution?: string] }>()
const p = useProgress()
const queue = ref([...props.ex.cards])
const flipped = ref(false)
const total = props.ex.cards.length
const card = computed(() => queue.value[0])
const doneCount = computed(() => total - queue.value.length)

function flip() {
  flipped.value = !flipped.value
  if (flipped.value) speak(card.value[0], p.settings.rate)
}
function next(knew: boolean) {
  const c = queue.value.shift()!
  if (!knew) queue.value.push(c)
  flipped.value = false
  if (!queue.value.length) emit('answer', true)
}
</script>

<template>
  <div>
    <p class="text-sm font-bold uppercase tracking-wide text-stone-400">Cartões · Flashcards — {{ doneCount }}/{{ total }}</p>
    <p class="en">Tenta lembrar-te da palavra em português e vira o cartão. · Try to recall the Portuguese, then flip.</p>
    <div v-if="card" class="mt-4 [perspective:1000px]">
      <button class="relative h-52 w-full transition-transform duration-500 [transform-style:preserve-3d]" :class="flipped ? '[transform:rotateY(180deg)]' : ''" @click="flip">
        <div class="card absolute inset-0 flex flex-col items-center justify-center p-4 [backface-visibility:hidden]">
          <span class="text-xs font-bold uppercase text-stone-400">English</span>
          <span class="text-3xl font-extrabold">{{ card[1] }}</span>
          <span class="mt-3 text-sm text-stone-400">toca para virar · tap to flip</span>
        </div>
        <div class="card absolute inset-0 flex flex-col items-center justify-center !bg-verde p-4 text-white [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <span class="text-xs font-bold uppercase opacity-70">Português 🔊</span>
          <span class="text-3xl font-extrabold">{{ card[0] }}</span>
        </div>
      </button>
      <div class="mt-4 grid grid-cols-2 gap-3" :class="flipped ? '' : 'invisible'">
        <button class="btn-danger" @click="next(false)">🔁 Outra vez · Again</button>
        <button class="btn-primary" @click="next(true)">✅ Sabia! · Knew it</button>
      </div>
    </div>
  </div>
</template>
