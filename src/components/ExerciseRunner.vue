<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import confetti from 'canvas-confetti'
import type { Exercise } from '../types'
import { beep } from '../utils'
import { useProgress } from '../stores/progress'
import MultipleChoice from './exercises/MultipleChoice.vue'
import FillBlank from './exercises/FillBlank.vue'
import MatchPairs from './exercises/MatchPairs.vue'
import WordOrder from './exercises/WordOrder.vue'
import TrueFalse from './exercises/TrueFalse.vue'
import Conjugate from './exercises/Conjugate.vue'
import Translate from './exercises/Translate.vue'
import Listen from './exercises/Listen.vue'
import Flashcards from './exercises/Flashcards.vue'
import Memory from './exercises/Memory.vue'
import SortBuckets from './exercises/SortBuckets.vue'
import Dialogue from './exercises/Dialogue.vue'
import SpotError from './exercises/SpotError.vue'
import Cloze from './exercises/Cloze.vue'
import ListenChoice from './exercises/ListenChoice.vue'
import Speak from './exercises/Speak.vue'
import Scramble from './exercises/Scramble.vue'

const props = defineProps<{ exercises: Exercise[]; title?: string }>()
const emit = defineEmits<{ finish: [score: number] }>()
const p = useProgress()

const comps = { mc: MultipleChoice, fill: FillBlank, match: MatchPairs, order: WordOrder, tf: TrueFalse, conj: Conjugate, translate: Translate, listen: Listen, flash: Flashcards, memory: Memory, sort: SortBuckets, dialogue: Dialogue, spot: SpotError, cloze: Cloze, listenmc: ListenChoice, speak: Speak, scramble: Scramble }
// flashcards are warm-up: they don't count towards the score
const scored = (e: Exercise) => e.type !== 'flash'

const list = ref<Exercise[]>([...props.exercises])
const idx = ref(0)
const runKey = ref(0)
const feedback = ref<{ ok: boolean; solution?: string } | null>(null)
const results = ref<boolean[]>([])
const wrong = ref<Exercise[]>([])
const combo = ref(0)
const finished = ref(false)
const current = computed(() => list.value[idx.value])
const score = computed(() => {
  const r = results.value
  return r.length ? Math.round((r.filter(Boolean).length / r.length) * 100) : 100
})
const stars = computed(() => (score.value >= 90 ? 3 : score.value >= 70 ? 2 : score.value >= 50 ? 1 : 0))

function onAnswer(ok: boolean, solution?: string) {
  const e = current.value
  if (e.type === 'flash' || e.type === 'memory' || e.type === 'match') {
    if (scored(e)) results.value.push(ok)
    if (ok) p.addXp(e.type === 'flash' ? 2 : 5)
    feedback.value = { ok: true }
    if (p.settings.sound) beep('good')
    return
  }
  results.value.push(ok)
  if (ok) {
    combo.value++
    p.addXp(combo.value >= 3 ? 15 : 10)
  } else {
    combo.value = 0
    wrong.value.push(e)
  }
  feedback.value = { ok, solution }
  if (p.settings.sound) beep(ok ? 'good' : 'bad')
}

function next() {
  if (!feedback.value) return
  feedback.value = null
  if (idx.value < list.value.length - 1) {
    idx.value++
    runKey.value++
  } else {
    finished.value = true
    emit('finish', score.value)
    if (score.value >= 60) {
      if (p.settings.sound) beep('win')
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ['#046a38', '#da291c', '#ffcd00'] })
    }
  }
}

function restart(onlyWrong: boolean) {
  list.value = onlyWrong && wrong.value.length ? [...wrong.value] : [...props.exercises]
  wrong.value = []
  results.value = []
  idx.value = 0
  combo.value = 0
  runKey.value++
  finished.value = false
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Enter' && feedback.value) {
    e.preventDefault()
    next()
  }
}
onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="mx-auto max-w-2xl">
    <div v-if="!finished && current">
      <div class="mb-4 flex items-center gap-3">
        <div class="h-4 flex-1 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800">
          <div class="h-full rounded-full bg-gradient-to-r from-verde to-lime-500 transition-all duration-500" :style="{ width: (idx / list.length) * 100 + '%' }" />
        </div>
        <span class="text-sm font-bold text-stone-500">{{ idx + 1 }}/{{ list.length }}</span>
        <span v-if="combo >= 3" class="pop rounded-full bg-orange-500 px-2 py-0.5 text-sm font-bold text-white">🔥 x{{ combo }}</span>
      </div>

      <div class="card p-5 sm:p-7">
        <component :is="comps[current.type]" :key="runKey" :ex="current as any" @answer="onAnswer" />
      </div>

      <Transition name="slide">
        <div v-if="feedback" class="fixed inset-x-0 bottom-16 z-40 border-t-4 px-4 py-4 md:bottom-0"
          :class="feedback.ok ? 'border-verde bg-green-50 dark:bg-green-950' : 'border-vermelho bg-red-50 dark:bg-red-950'">
          <div class="mx-auto flex max-w-2xl flex-wrap items-center gap-4">
            <div class="flex-1">
              <p class="text-xl font-extrabold" :class="feedback.ok ? 'text-verde' : 'text-vermelho'">
                {{ feedback.ok ? ['Muito bem! 🎉', 'Excelente! ⭐', 'Fixe! 😎', 'Isso mesmo! 👏'][idx % 4] : 'Ups! Não faz mal 💪' }}
              </p>
              <p v-if="!feedback.ok && feedback.solution" class="font-semibold">Resposta certa · Correct answer: <b>{{ feedback.solution }}</b></p>
            </div>
            <button class="btn-primary px-8" :class="feedback.ok ? '' : '!bg-vermelho !shadow-[0_4px_0_#9b1d13]'" @click="next">Continuar · Continue ⏎</button>
          </div>
        </div>
      </Transition>
    </div>

    <div v-else-if="finished" class="card pop p-8 text-center">
      <p class="text-6xl">{{ stars === 3 ? '🏆' : stars === 2 ? '🥳' : stars === 1 ? '🙂' : '📚' }}</p>
      <p class="mt-2 text-3xl">
        <span v-for="s in 3" :key="s" :class="s <= stars ? '' : 'opacity-20 grayscale'">⭐</span>
      </p>
      <h3 class="mt-3 text-3xl font-extrabold">{{ score }}%</h3>
      <p class="font-bold">{{ score >= 60 ? 'Lição concluída! Parabéns!' : 'Continua a praticar!' }}</p>
      <p class="en">{{ score >= 60 ? 'Lesson complete! Congratulations!' : 'Keep practising! (60% needed to complete)' }}</p>
      <div class="mt-6 flex flex-wrap justify-center gap-3">
        <button v-if="wrong.length" class="btn-danger" @click="restart(true)">🔁 Rever erros ({{ wrong.length }}) · Retry mistakes</button>
        <button class="btn-ghost" @click="restart(false)">↺ Repetir tudo · Restart</button>
        <slot name="after" />
      </div>
    </div>

    <p v-else class="text-center text-stone-500">Sem exercícios · No exercises</p>
  </div>
</template>

<style scoped>
.slide-enter-active { transition: transform .2s ease-out; }
.slide-enter-from { transform: translateY(100%); }
</style>
