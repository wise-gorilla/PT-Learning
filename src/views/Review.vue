<script setup lang="ts">
import { computed, ref } from 'vue'
import { dictionary } from '../data'
import { speak, shuffle, check } from '../utils'
import { useProgress } from '../stores/progress'

const p = useProgress()
const byId = Object.fromEntries(dictionary.map((d) => [d.id, d]))
const boxes = computed(() => [1, 2, 3, 4, 5].map((b) => Object.values(p.words).filter((w) => w.box === b).length))

const queue = ref<string[]>([])
const flipped = ref(false)
const mode = ref<'flip' | 'type'>('flip')
const typed = ref('')
const typedVerdict = ref<string | null>(null)
const reviewed = ref(0)
const started = ref(false)
const card = computed(() => byId[queue.value[0]])

function start(all = false) {
  const ids = all ? Object.keys(p.words) : p.dueWords
  queue.value = shuffle(ids.filter((id) => byId[id])).slice(0, 30)
  reviewed.value = 0
  started.value = true
  flipped.value = false
}
function flip() {
  flipped.value = true
  speak(card.value.pt, p.settings.rate)
}
function submitTyped() {
  typedVerdict.value = check(typed.value, [card.value.pt])
  flip()
}
function answer(knew: boolean) {
  p.reviewWord(queue.value[0], knew)
  if (knew) p.addXp(3)
  const id = queue.value.shift()!
  if (!knew) queue.value.push(id)
  else reviewed.value++
  flipped.value = false
  typed.value = ''
  typedVerdict.value = null
}
</script>

<template>
  <div class="mx-auto max-w-2xl">
    <h1 class="text-3xl font-extrabold">🧠 Revisão <span class="en !text-lg">Spaced repetition review</span></h1>
    <p class="text-stone-500">As palavras voltam quando estás quase a esquecê-las. · Words come back right before you forget them.</p>

    <div class="card mt-4 p-4">
      <div class="grid grid-cols-5 gap-2 text-center">
        <div v-for="(n, i) in boxes" :key="i" class="rounded-xl p-2" :class="['bg-red-100 dark:bg-red-950', 'bg-orange-100 dark:bg-orange-950', 'bg-yellow-100 dark:bg-yellow-950', 'bg-lime-100 dark:bg-lime-950', 'bg-green-100 dark:bg-green-950'][i]">
          <p class="text-2xl font-extrabold">{{ n }}</p>
          <p class="text-xs">Caixa {{ i + 1 }}</p>
        </div>
      </div>
      <p class="en mt-2 text-center">Box 1 = new/forgotten · Box 5 = mastered</p>
    </div>

    <div v-if="!started || !card" class="card mt-6 p-8 text-center">
      <p v-if="started" class="text-5xl">🎉</p>
      <p v-if="started" class="text-xl font-bold">Revisão concluída! {{ reviewed }} palavras. <span class="en block">Review done!</span></p>
      <template v-if="!Object.keys(p.words).length">
        <p class="text-lg font-bold">Ainda não tens palavras para rever.</p>
        <p class="en">No words yet — finish a lesson or add words from the dictionary.</p>
        <RouterLink to="/dictionary" class="btn-primary mt-4">📖 Dicionário</RouterLink>
      </template>
      <template v-else>
        <p class="mt-2 text-lg"><b>{{ p.dueWords.length }}</b> palavras para hoje · words due today</p>
        <div class="mt-4 flex justify-center gap-2">
          <button class="btn-ghost" :class="mode === 'flip' ? '!bg-verde/15' : ''" @click="mode = 'flip'">🃏 Virar · Flip</button>
          <button class="btn-ghost" :class="mode === 'type' ? '!bg-verde/15' : ''" @click="mode = 'type'">⌨️ Escrever · Type</button>
        </div>
        <div class="mt-4 flex flex-wrap justify-center gap-3">
          <button class="btn-primary" :disabled="!p.dueWords.length" @click="start()">▶ Começar · Start</button>
          <button class="btn-ghost" @click="start(true)">Praticar todas · Practise all</button>
        </div>
      </template>
    </div>

    <div v-else class="mt-6">
      <p class="mb-2 text-sm font-bold text-stone-500">Faltam · Remaining: {{ queue.length }}</p>
      <div class="card pop flex min-h-56 flex-col items-center justify-center p-6 text-center" :key="queue[0] + String(flipped)">
        <p class="text-xs font-bold uppercase text-stone-400">English</p>
        <p class="text-3xl font-extrabold">{{ card.en }}</p>
        <form v-if="mode === 'type' && !flipped" class="mt-4 w-full" @submit.prevent="submitTyped">
          <input v-model="typed" class="input text-center" placeholder="em português…" autofocus autocomplete="off" />
        </form>
        <template v-if="flipped">
          <p v-if="typedVerdict" class="mt-3 font-bold" :class="typedVerdict === 'wrong' ? 'text-vermelho' : 'text-verde'">{{ typedVerdict === 'wrong' ? `✗ ${typed}` : '✓' }}</p>
          <p class="mt-3 text-3xl font-extrabold text-verde">🔊 {{ card.pt }}</p>
          <p v-if="card.ex" class="mt-2">{{ card.ex.pt }}<span class="en block">{{ card.ex.en }}</span></p>
        </template>
      </div>
      <div class="mt-4 grid grid-cols-2 gap-3">
        <template v-if="flipped">
          <button class="btn-danger" @click="answer(false)">🔁 Esqueci · Forgot</button>
          <button class="btn-primary" @click="answer(true)">✅ Sabia · Knew it</button>
        </template>
        <button v-else class="btn-primary col-span-2" @click="mode === 'type' ? submitTyped() : flip()">Mostrar · Show</button>
      </div>
    </div>
  </div>
</template>
