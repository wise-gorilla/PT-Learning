<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { Exercise } from '../../types'
import { shuffle, speak, normalize } from '../../utils'
import { useProgress } from '../../stores/progress'

const props = defineProps<{ ex: Extract<Exercise, { type: 'scramble' }> }>()
const emit = defineEmits<{ answer: [correct: boolean, solution?: string] }>()
const p = useProgress()
const chars = [...props.ex.pt]
let tiles = chars.map((c, id) => ({ c, id })).filter((t) => t.c !== ' ')
for (let n = 0; n < 5 && tiles.length > 1 && tiles.map((t) => t.c).join('') === chars.filter((c) => c !== ' ').join(''); n++) tiles = shuffle(tiles)
const letters = tiles
const chosen = ref<number[]>([])
const verdict = ref<boolean | null>(null)
const pool = computed(() => letters.filter((t) => !chosen.value.includes(t.id)))
const built = computed(() => {
  // re-insert spaces at their original positions
  const out: string[] = []
  let k = 0
  for (const c of chars) {
    if (c === ' ') out.push(' ')
    else {
      const id = chosen.value[k++]
      out.push(id !== undefined ? (letters.find((l) => l.id === id)?.c ?? '_') : '_')
    }
  }
  return out
})

function add(id: number) {
  if (verdict.value !== null) return
  chosen.value.push(id)
  if (chosen.value.length === letters.length) submit()
}
function back() {
  if (verdict.value === null) chosen.value.pop()
}
function submit() {
  verdict.value = normalize(built.value.join('')) === normalize(props.ex.pt)
  speak(props.ex.pt, p.settings.rate)
  emit('answer', verdict.value, props.ex.pt)
}
function onKey(e: KeyboardEvent) {
  if (e.key === 'Backspace') return back()
  const t = pool.value.find((l) => l.c.toLowerCase() === e.key.toLowerCase())
  if (t) add(t.id)
}
onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div>
    <p class="text-sm font-bold uppercase tracking-wide text-stone-400">Soletra a palavra · Spell the word 🔠</p>
    <p class="mt-2 text-2xl font-bold">🇬🇧 {{ ex.en }}</p>
    <div class="mt-5 flex flex-wrap justify-center gap-1">
      <span v-for="(c, i) in built" :key="i" class="flex h-11 w-9 items-center justify-center rounded-lg text-2xl font-extrabold"
        :class="c === ' ' ? 'w-4' : verdict === true ? 'bg-verde text-white' : verdict === false ? 'bg-vermelho/15 text-vermelho' : c === '_' ? 'bg-stone-100 text-stone-300 dark:bg-stone-800' : 'bg-sky-100 dark:bg-sky-900'">
        {{ c === ' ' ? '' : c === '_' ? '' : c }}
      </span>
    </div>
    <div class="mt-6 flex flex-wrap justify-center gap-2">
      <button v-for="t in pool" :key="t.id" class="chip pop h-12 w-12 !p-0 text-xl" @click="add(t.id)">{{ t.c }}</button>
    </div>
    <div class="mt-4 flex justify-center">
      <button class="btn-ghost" :disabled="verdict !== null || !chosen.length" @click="back">⌫ Apagar · Delete</button>
    </div>
  </div>
</template>
