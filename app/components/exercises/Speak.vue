<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import type { Exercise } from '../../types'
import { speak, similarity, createRecognizer } from '../../utils'
import { useProgress } from '../../stores/progress'

const props = defineProps<{ ex: Extract<Exercise, { type: 'speak' }> }>()
const emit = defineEmits<{ answer: [correct: boolean, solution?: string] }>()
const p = useProgress()
const rec = createRecognizer()
const listening = ref(false)
const heard = ref('')
const score = ref<number | null>(null)
const tries = ref(0)
const done = ref(false)
const error = ref('')

function finish(ok: boolean) {
  if (done.value) return
  done.value = true
  emit('answer', ok, props.ex.pt)
}
function listen() {
  if (!rec || listening.value || done.value) return
  error.value = ''
  heard.value = ''
  listening.value = true
  rec.onresult = (e: any) => {
    const alts: string[] = Array.from(e.results[0] as ArrayLike<{ transcript: string }>).map((a) => a.transcript)
    const best = alts.reduce((b, a) => (similarity(a, props.ex.pt) > similarity(b, props.ex.pt) ? a : b), alts[0] ?? '')
    heard.value = best
    score.value = Math.round(similarity(best, props.ex.pt) * 100)
    tries.value++
    if (score.value >= 75) finish(true)
  }
  rec.onerror = (e: any) => (error.value = e.error === 'not-allowed' ? 'Microfone bloqueado · Microphone blocked' : 'Não ouvi nada · Didn’t catch that')
  rec.onend = () => (listening.value = false)
  rec.start()
}
onUnmounted(() => rec?.abort())
</script>

<template>
  <div>
    <p class="text-sm font-bold uppercase tracking-wide text-stone-400">Diz em voz alta · Say it out loud 🎤</p>
    <div class="mt-3 flex items-start gap-3">
      <button class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-sky-100 text-xl dark:bg-sky-900" @click="speak(ex.pt, p.settings.rate)">🔊</button>
      <div>
        <p class="text-2xl font-extrabold">{{ ex.pt }}</p>
        <p class="en">{{ ex.en }}</p>
      </div>
    </div>

    <template v-if="rec">
      <div class="mt-6 flex flex-col items-center">
        <button class="flex h-24 w-24 items-center justify-center rounded-full text-5xl text-white transition"
          :class="listening ? 'animate-pulse bg-vermelho shadow-[0_0_0_12px_rgba(218,41,28,.2)]' : 'bg-verde shadow-[0_6px_0_#034d28] active:translate-y-1.5 active:shadow-none'"
          :disabled="done" @click="listen">🎤</button>
        <p class="mt-2 text-sm font-semibold text-stone-500">{{ listening ? 'A ouvir… · Listening…' : 'Toca e fala · Tap and speak' }}</p>
        <p v-if="error" class="mt-2 text-sm text-vermelho">{{ error }}</p>
        <div v-if="score !== null" class="mt-3 w-full rounded-xl bg-stone-100 p-3 text-center dark:bg-stone-800">
          <p class="text-sm text-stone-500">Ouvi · I heard:</p>
          <p class="text-lg font-bold">“{{ heard }}”</p>
          <p class="text-2xl font-extrabold" :class="score >= 75 ? 'text-verde' : score >= 50 ? 'text-amber-500' : 'text-vermelho'">{{ score }}%</p>
        </div>
      </div>
      <button v-if="!done && tries >= 1" class="btn-ghost mt-4 w-full" @click="finish(tries >= 3 ? false : true)">
        {{ tries >= 3 ? 'Saltar · Skip' : 'Aceitar e continuar · Accept and continue' }}
      </button>
    </template>
    <div v-else class="mt-5 rounded-xl bg-amber-50 p-4 text-center dark:bg-amber-950/40">
      <p class="font-semibold">Diz a frase em voz alta e compara com o áudio. · Say it aloud and compare with the audio.</p>
      <p class="en">(Speech recognition works in Chrome / Edge.)</p>
      <div class="mt-3 grid grid-cols-2 gap-3">
        <button class="btn-ghost" :disabled="done" @click="finish(false)">😕 Difícil · Hard</button>
        <button class="btn-primary" :disabled="done" @click="finish(true)">😃 Consegui! · Nailed it</button>
      </div>
    </div>
  </div>
</template>
