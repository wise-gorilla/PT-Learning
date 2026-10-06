<script setup lang="ts">
import { ref } from 'vue'
import type { Exercise } from '../../types'
import { shuffle, speak, beep } from '../../utils'
import { useProgress } from '../../stores/progress'

const props = defineProps<{ ex: Extract<Exercise, { type: 'match' }> }>()
const emit = defineEmits<{ answer: [correct: boolean, solution?: string] }>()
const p = useProgress()
const left = shuffle(props.ex.pairs.map((pr, i) => ({ t: pr[0], i })))
const right = shuffle(props.ex.pairs.map((pr, i) => ({ t: pr[1], i })))
const selL = ref<number | null>(null)
const selR = ref<number | null>(null)
const matched = ref(new Set<number>())
const wrong = ref<string | null>(null)
let mistakes = 0

function tryMatch() {
  if (selL.value === null || selR.value === null) return
  if (selL.value === selR.value) {
    matched.value.add(selL.value)
    if (p.settings.sound) beep('good')
    if (matched.value.size === props.ex.pairs.length) emit('answer', mistakes <= 1)
  } else {
    mistakes++
    wrong.value = `${selL.value}-${selR.value}`
    if (p.settings.sound) beep('bad')
    setTimeout(() => (wrong.value = null), 400)
  }
  selL.value = selR.value = null
}
function clickL(i: number, t: string) {
  if (matched.value.has(i)) return
  selL.value = i
  speak(t, p.settings.rate)
  tryMatch()
}
function clickR(i: number) {
  if (matched.value.has(i)) return
  selR.value = i
  tryMatch()
}
</script>

<template>
  <div>
    <p class="text-sm font-bold uppercase tracking-wide text-stone-400">Liga os pares · Match the pairs</p>
    <p v-if="ex.q" class="mt-1 font-bold">{{ ex.q.pt }} <span class="en">{{ ex.q.en }}</span></p>
    <div class="mt-4 grid grid-cols-2 gap-3">
      <div class="space-y-2">
        <button v-for="x in left" :key="'l' + x.i" class="chip block w-full text-left"
          :class="[matched.has(x.i) ? 'opacity-30 !border-verde' : '', selL === x.i ? '!border-sky-500 !bg-sky-50 dark:!bg-sky-950' : '', wrong?.startsWith(x.i + '-') ? 'shake !border-vermelho' : '']"
          @click="clickL(x.i, x.t)">{{ x.t }}</button>
      </div>
      <div class="space-y-2">
        <button v-for="x in right" :key="'r' + x.i" class="chip block w-full text-left"
          :class="[matched.has(x.i) ? 'opacity-30 !border-verde' : '', selR === x.i ? '!border-sky-500 !bg-sky-50 dark:!bg-sky-950' : '', wrong?.endsWith('-' + x.i) ? 'shake !border-vermelho' : '']"
          @click="clickR(x.i)">{{ x.t }}</button>
      </div>
    </div>
  </div>
</template>
