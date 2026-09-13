<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import type { Exercise, DialogueTurn } from '../../types'
import { shuffle, speak, beep } from '../../utils'
import { useProgress } from '../../stores/progress'

const props = defineProps<{ ex: Extract<Exercise, { type: 'dialogue' }> }>()
const emit = defineEmits<{ answer: [correct: boolean, solution?: string] }>()
const p = useProgress()
const shown = ref<{ who: string; pt: string; en: string; me: boolean }[]>([])
const pos = ref(0)
const wrongPicks = ref(new Set<number>())
const mistakes = ref(0)
const box = ref<HTMLElement>()
const turn = computed<DialogueTurn | undefined>(() => props.ex.turns[pos.value])
const choice = computed(() => (turn.value && 'choose' in turn.value ? turn.value : null))
const order = computed(() => (choice.value ? shuffle(choice.value.choose.map((_, i) => i)) : []))

async function scroll() {
  await nextTick()
  box.value?.scrollTo({ top: box.value.scrollHeight, behavior: 'smooth' })
}
function advance() {
  while (turn.value && !('choose' in turn.value)) {
    const t = turn.value
    shown.value.push({ ...t, me: false })
    pos.value++
    if (!turn.value || 'choose' in turn.value) {
      speak(t.pt, p.settings.rate)
      break
    }
  }
  scroll()
  if (!turn.value) emit('answer', mistakes.value === 0)
}
function pick(i: number) {
  const c = choice.value
  if (!c) return
  if (i !== c.answer) {
    if (!wrongPicks.value.has(i)) mistakes.value++
    wrongPicks.value.add(i)
    if (p.settings.sound) beep('bad')
    return
  }
  shown.value.push({ who: 'Tu', pt: c.choose[i], en: c.en, me: true })
  speak(c.choose[i], p.settings.rate)
  wrongPicks.value = new Set()
  pos.value++
  setTimeout(advance, 900)
  scroll()
}
onMounted(advance)
</script>

<template>
  <div>
    <p class="text-sm font-bold uppercase tracking-wide text-stone-400">Conversa · Conversation — responde! · reply!</p>
    <p class="mt-1 text-xl font-bold">💬 {{ ex.title.pt }} <span class="en">{{ ex.title.en }}</span></p>
    <div ref="box" class="mt-3 max-h-80 space-y-2 overflow-y-auto rounded-2xl bg-stone-100 p-3 dark:bg-stone-800/50">
      <div v-for="(l, i) in shown" :key="i" class="pop flex" :class="l.me ? 'justify-end' : ''">
        <div class="max-w-[85%] rounded-2xl px-3 py-2" :class="l.me ? 'rounded-br-sm bg-verde text-white' : 'rounded-bl-sm bg-white dark:bg-stone-900'">
          <p class="text-xs font-bold opacity-60">{{ l.who }}</p>
          <p class="font-semibold">{{ l.pt }}</p>
          <p class="text-sm italic opacity-70" :class="l.me ? '' : 'en'">{{ l.en }}</p>
        </div>
      </div>
      <div v-if="choice" class="flex justify-end"><span class="animate-pulse rounded-2xl bg-verde/20 px-4 py-2 font-bold text-verde">…</span></div>
    </div>
    <div v-if="choice" class="mt-4 grid gap-2">
      <p class="text-sm font-semibold text-stone-500">A tua vez! Escolhe a resposta · Your turn! Choose the reply ({{ choice.en }})</p>
      <button v-for="i in order" :key="i" class="chip text-left" :class="wrongPicks.has(i) ? '!border-vermelho !bg-vermelho/10 shake line-through opacity-60' : ''" @click="pick(i)">
        {{ choice.choose[i] }}
      </button>
    </div>
  </div>
</template>
