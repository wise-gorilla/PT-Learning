<script setup lang="ts">
import { ref } from 'vue'
import type { Exercise } from '../../types'
import { shuffle, speak, beep } from '../../utils'
import { useProgress } from '../../stores/progress'

const props = defineProps<{ ex: Extract<Exercise, { type: 'memory' }> }>()
const emit = defineEmits<{ answer: [correct: boolean, solution?: string] }>()
const p = useProgress()
const cards = ref(
  shuffle(props.ex.pairs.flatMap((pr, i) => [{ t: pr[0], pair: i, pt: true }, { t: pr[1], pair: i, pt: false }])).map((c, k) => ({ ...c, k })),
)
const open = ref<number[]>([])
const found = ref(new Set<number>())
const moves = ref(0)
let busy = false

function flip(k: number) {
  const c = cards.value[k]
  if (busy || found.value.has(c.pair) || open.value.includes(k)) return
  if (c.pt) speak(c.t, p.settings.rate)
  open.value.push(k)
  if (open.value.length < 2) return
  moves.value++
  const [a, b] = open.value.map((i) => cards.value[i])
  if (a.pair === b.pair) {
    found.value.add(a.pair)
    open.value = []
    if (p.settings.sound) beep('good')
    if (found.value.size === props.ex.pairs.length) emit('answer', moves.value <= props.ex.pairs.length * 2)
  } else {
    busy = true
    setTimeout(() => {
      open.value = []
      busy = false
    }, 900)
  }
}
</script>

<template>
  <div>
    <p class="text-sm font-bold uppercase tracking-wide text-stone-400">Jogo da memória · Memory game — 🎯 {{ moves }}</p>
    <p class="en">Encontra os pares português–inglês. · Find the Portuguese–English pairs.</p>
    <div class="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
      <button v-for="c in cards" :key="c.k" class="flex h-20 items-center justify-center rounded-xl p-2 text-center text-sm font-bold transition sm:text-base"
        :class="found.has(c.pair) ? 'bg-verde/15 text-verde' : open.includes(c.k) ? (c.pt ? 'bg-verde text-white' : 'bg-sky-500 text-white') : 'bg-gradient-to-br from-vermelho to-orange-400 text-transparent hover:scale-105'"
        @click="flip(c.k)">
        <span v-if="found.has(c.pair) || open.includes(c.k)">{{ c.t }}</span>
        <span v-else class="text-2xl text-white">🇵🇹</span>
      </button>
    </div>
  </div>
</template>
