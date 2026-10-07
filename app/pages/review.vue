<script setup lang="ts">
import AccentKeys from '../components/AccentKeys.vue'
import { computed, ref } from 'vue'
import { dictionary } from '../data'
import { speak, shuffle, check } from '../utils'
import { useProgress } from '../stores/progress'

const p = useProgress()
const byId = Object.fromEntries(dictionary.map((d) => [d.id, d]))
const boxes = computed(() => [1, 2, 3, 4, 5].map((b) => Object.values(p.words).filter((w) => w.box === b).length))

type Kind = 'produce' | 'recognise' | 'listen' | 'cloze'
const modes: { k: 'mixed' | 'produce' | 'recognise' | 'listen' | 'cloze'; label: string; hint: string }[] = [
  { k: 'mixed', label: '🔀 Misto · Mixed', hint: 'Recommended: varies the task — recognise, listen, write, complete the sentence.' },
  { k: 'produce', label: '⌨️ Escrever · Write', hint: 'See English, type the Portuguese (hardest, best for memory).' },
  { k: 'recognise', label: '🃏 Reconhecer · Recognise', hint: 'See Portuguese, recall the meaning.' },
  { k: 'listen', label: '👂 Ouvir · Listen', hint: 'Hear the word, recall the meaning.' },
  { k: 'cloze', label: '📝 Frase · Sentence', hint: 'Fill the missing word in a sentence (context helps memory).' },
]
const queue = ref<string[]>([])
const kinds = ref<Record<string, Kind>>({})
const flipped = ref(false)
const mode = ref<'mixed' | Kind>('mixed')
const typed = ref('')
const typedVerdict = ref<string | null>(null)
const reviewed = ref(0)
const started = ref(false)
const card = computed(() => byId[queue.value[0]])
const kind = computed<Kind>(() => kinds.value[queue.value[0]] ?? 'produce')
const isTyped = computed(() => kind.value === 'produce' || kind.value === 'cloze')

const esc = (t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
function blanked(w: { pt: string; ex?: { pt: string; en: string } }) {
  if (!w.ex) return null
  const re = new RegExp(`(^|[^\\p{L}])(${esc(w.pt)})(?![\\p{L}])`, 'iu')
  return re.test(w.ex.pt) ? w.ex.pt.replace(re, '$1_____') : null
}
const cloze = computed(() => (card.value ? blanked(card.value) : null))
function pickKind(id: string): Kind {
  const w = byId[id]
  if (mode.value !== 'mixed') return mode.value === 'cloze' && !blanked(w) ? 'produce' : mode.value
  // new/weak words: easier recognition first; known words: harder production
  const box = p.words[id]?.box ?? 1
  const opts: Kind[] = box <= 1 ? ['recognise', 'listen', 'produce'] : box <= 3 ? ['produce', 'listen', 'recognise', 'cloze'] : ['produce', 'cloze', 'listen']
  const k = opts[Math.floor(Math.random() * opts.length)]
  return k === 'cloze' && !blanked(w) ? 'produce' : k
}

function start(all = false) {
  const ids = all ? Object.keys(p.words) : p.dueWords
  queue.value = shuffle(ids.filter((id) => byId[id])).slice(0, 30)
  kinds.value = Object.fromEntries(queue.value.map((id) => [id, pickKind(id)]))
  reviewed.value = 0
  started.value = true
  flipped.value = false
  listenFirst()
}
function listenFirst() {
  if (queue.value.length && kinds.value[queue.value[0]] === 'listen') setTimeout(() => speak(byId[queue.value[0]].pt, p.settings.rate), 200)
  else if (queue.value.length && kinds.value[queue.value[0]] === 'recognise') setTimeout(() => speak(byId[queue.value[0]].pt, p.settings.rate), 200)
}
function flip() {
  flipped.value = true
  speak(card.value.ex && kind.value === 'cloze' ? card.value.ex.pt : card.value.pt, p.settings.rate)
}
function submitTyped() {
  typedVerdict.value = check(typed.value, [card.value.pt, card.value.pt.replace(/^(o|a|os|as) /, '')])
  flip()
}
function answer(knew: boolean) {
  p.reviewWord(queue.value[0], knew)
  if (knew) p.addXp(3)
  const id = queue.value.shift()!
  if (!knew) {
    queue.value.splice(Math.min(3, queue.value.length), 0, id) // see it again soon, not immediately
    kinds.value[id] = 'recognise' // after a miss, re-show it in the easier direction
  } else reviewed.value++
  flipped.value = false
  typed.value = ''
  typedVerdict.value = null
  listenFirst()
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
        <div class="mt-4 flex flex-wrap justify-center gap-2">
          <button v-for="m in modes" :key="m.k" class="btn-ghost" :class="mode === m.k ? '!bg-verde/15' : ''" @click="mode = m.k">{{ m.label }}</button>
        </div>
        <p class="en mt-2">{{ modes.find((m) => m.k === mode)?.hint }}</p>
        <div class="mt-4 flex flex-wrap justify-center gap-3">
          <button class="btn-primary" :disabled="!p.dueWords.length" @click="start()">▶ Começar · Start</button>
          <button class="btn-ghost" @click="start(true)">Praticar todas · Practise all</button>
        </div>
      </template>
    </div>

    <div v-else class="mt-6">
      <p class="mb-2 text-sm font-bold text-stone-500">Faltam · Remaining: {{ queue.length }}</p>
      <div class="card pop flex min-h-56 flex-col items-center justify-center p-6 text-center" :key="queue[0] + String(flipped)">
        <!-- prompt -->
        <template v-if="kind === 'produce'">
          <p class="text-xs font-bold uppercase text-stone-400">Como se diz em português? · How do you say it in Portuguese?</p>
          <p class="text-3xl font-extrabold">{{ card.en }}</p>
        </template>
        <template v-else-if="kind === 'recognise'">
          <p class="text-xs font-bold uppercase text-stone-400">O que significa? · What does it mean?</p>
          <p class="text-3xl font-extrabold">{{ card.g === 'm' ? 'o ' : card.g === 'f' ? 'a ' : '' }}{{ card.pt }}</p>
          <button class="btn-ghost mt-2" @click="speak(card.pt, p.settings.rate)">🔊 Ouvir · Listen</button>
        </template>
        <template v-else-if="kind === 'listen'">
          <p class="text-xs font-bold uppercase text-stone-400">Ouve e lembra-te do significado · Listen and recall the meaning</p>
          <button class="btn-primary mt-2 !px-8 !py-5 text-4xl" @click="speak(card.pt, p.settings.rate)">🔊</button>
        </template>
        <template v-else>
          <p class="text-xs font-bold uppercase text-stone-400">Completa a frase · Complete the sentence</p>
          <p class="text-2xl font-extrabold">{{ cloze }}</p>
          <p class="en">{{ card.ex?.en }}</p>
          <p class="text-sm text-stone-500">({{ card.en }})</p>
        </template>

        <form v-if="isTyped && !flipped" class="mt-4 w-full" @submit.prevent="submitTyped">
          <input v-model="typed" class="input text-center" placeholder="em português…" autofocus autocomplete="off" autocapitalize="off" spellcheck="false" />
          <AccentKeys />
        </form>

        <!-- answer -->
        <template v-if="flipped">
          <p v-if="typedVerdict" class="mt-3 font-bold" :class="typedVerdict === 'wrong' ? 'text-vermelho' : 'text-verde'">{{ typedVerdict === 'wrong' ? `✗ ${typed}` : typedVerdict === 'accent' ? '✓ (cuidado com os acentos · mind the accents)' : '✓' }}</p>
          <p class="mt-3 text-3xl font-extrabold text-verde">🔊 {{ card.g === 'm' ? 'o ' : card.g === 'f' ? 'a ' : '' }}{{ card.pt }}</p>
          <p v-if="kind !== 'produce'" class="en !text-lg">{{ card.en }}</p>
          <p v-if="card.ex && kind !== 'cloze'" class="mt-2">{{ card.ex.pt }}<span class="en block">{{ card.ex.en }}</span></p>
        </template>
      </div>
      <div class="mt-4 grid grid-cols-2 gap-3">
        <template v-if="flipped">
          <button class="btn-danger" @click="answer(false)">🔁 Esqueci · Forgot</button>
          <button class="btn-primary" :disabled="typedVerdict === 'wrong'" @click="answer(true)">✅ Sabia · Knew it</button>
        </template>
        <button v-else class="btn-primary col-span-2" @click="isTyped ? submitTyped() : flip()">Mostrar · Show</button>
      </div>
      <p v-if="typedVerdict === 'wrong'" class="en mt-2 text-center">Resposta errada: conta como esquecida. · Wrong answer counts as forgotten.</p>
    </div>
  </div>
</template>
