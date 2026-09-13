<script setup lang="ts">
import { ref } from 'vue'
import { useProgress } from '../stores/progress'
import { speak, hasPtVoice } from '../utils'

const p = useProgress()
const msg = ref('')
const voiceOk = ref(hasPtVoice())
setTimeout(() => (voiceOk.value = hasPtVoice()), 800)

function exportFile() {
  const blob = new Blob([p.exportJson()], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `pt-progress-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(a.href)
}
async function importFile(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0]
  if (!f) return
  try {
    p.importJson(await f.text())
    msg.value = '✅ Progresso importado · Progress imported'
  } catch {
    msg.value = '❌ Ficheiro inválido · Invalid file'
  }
}
function reset() {
  if (confirm('Apagar todo o progresso? · Delete all progress?')) {
    p.resetAll()
    msg.value = 'Progresso apagado · Progress reset'
  }
}
</script>

<template>
  <div class="mx-auto max-w-2xl space-y-4">
    <h1 class="text-3xl font-extrabold">⚙️ Definições <span class="en !text-lg">Settings</span></h1>

    <section class="card p-5">
      <h2 class="font-bold">Tradução inglesa <span class="en">English translation</span></h2>
      <div class="mt-3 grid grid-cols-3 gap-2">
        <button v-for="m in [{ k: 'show', pt: 'Mostrar', en: 'Show' }, { k: 'tap', pt: 'Desfocada', en: 'Blurred (hover)' }, { k: 'hide', pt: 'Esconder', en: 'Hide' }] as const" :key="m.k"
          class="chip" :class="p.settings.enMode === m.k ? '!border-verde !bg-verde/10' : ''" @click="p.settings.enMode = m.k">
          {{ m.pt }}<span class="block text-xs text-stone-500">{{ m.en }}</span>
        </button>
      </div>
      <p class="en mt-2">Exemplo · Example: this is how English looks.</p>
    </section>

    <section class="card space-y-3 p-5">
      <label class="flex items-center justify-between"><span class="font-bold">🌙 Modo escuro <span class="en">Dark mode</span></span><input v-model="p.settings.dark" type="checkbox" class="h-5 w-5 accent-verde" /></label>
      <label class="flex items-center justify-between"><span class="font-bold">🔔 Sons <span class="en">Sound effects</span></span><input v-model="p.settings.sound" type="checkbox" class="h-5 w-5 accent-verde" /></label>
      <label class="flex items-center justify-between"><span class="font-bold">✍️ Acentos obrigatórios <span class="en">Accents must be exact</span></span><input v-model="p.settings.accentStrict" type="checkbox" class="h-5 w-5 accent-verde" /></label>
      <div>
        <label class="font-bold">🗣️ Velocidade da voz <span class="en">Speech speed</span>: {{ p.settings.rate }}</label>
        <div class="flex items-center gap-3">
          <input v-model.number="p.settings.rate" type="range" min="0.5" max="1.2" step="0.05" class="flex-1 accent-verde" />
          <button class="btn-ghost" @click="speak('Olá! Bom dia. Eu estou a aprender português europeu.', p.settings.rate)">🔊 Testar</button>
        </div>
        <p v-if="!voiceOk" class="mt-2 text-sm text-amber-600">⚠️ Não foi encontrada uma voz portuguesa. Instala “Português (Portugal)” nas definições de voz do sistema (Windows: Definições › Hora e idioma › Voz). · No pt-PT voice found — install one in your OS speech settings for correct pronunciation.</p>
      </div>
    </section>

    <section class="card p-5">
      <h2 class="font-bold">💾 Progresso <span class="en">Progress (saved in this browser)</span></h2>
      <div class="mt-3 flex flex-wrap gap-2">
        <button class="btn-ghost" @click="exportFile">⬇️ Exportar · Export</button>
        <label class="btn-ghost cursor-pointer">⬆️ Importar · Import<input type="file" accept="application/json" class="hidden" @change="importFile" /></label>
        <button class="btn-danger ml-auto" @click="reset">🗑️ Apagar tudo · Reset</button>
      </div>
      <p v-if="msg" class="mt-3 font-semibold">{{ msg }}</p>
    </section>
  </div>
</template>
