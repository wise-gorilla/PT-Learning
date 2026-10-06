<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watchEffect } from 'vue'
import { useProgress } from '~/stores/progress'
import { voiceStatus } from '~/utils'

const p = useProgress()
watchEffect(() => document.documentElement.classList.toggle('dark', p.settings.dark))
// warn when audio would not be European Portuguese (voices load asynchronously)
const voice = ref<ReturnType<typeof voiceStatus>>('pt-pt')
const voiceDismissed = ref(false)
function refreshVoice() {
  voice.value = voiceStatus()
}
onMounted(() => {
  try {
    voiceDismissed.value = localStorage.getItem('pt-voice-warn-dismissed') === '1'
  } catch {}
  refreshVoice()
  window.speechSynthesis?.addEventListener?.('voiceschanged', refreshVoice)
  setTimeout(refreshVoice, 1500)
})
onUnmounted(() => window.speechSynthesis?.removeEventListener?.('voiceschanged', refreshVoice))
function dismissVoice() {
  voiceDismissed.value = true
  try {
    localStorage.setItem('pt-voice-warn-dismissed', '1')
  } catch {}
}
const showVoiceWarn = computed(() => !voiceDismissed.value && voice.value !== 'pt-pt')
const enClass = computed(() => (p.settings.enMode === 'tap' ? 'en-tap' : p.settings.enMode === 'hide' ? 'en-hide' : ''))

async function logout() {
  await $fetch('/api/logout', { method: 'POST' })
  p.loaded = false
  useState('authed').value = false
  await navigateTo('/login')
}

const nav = [
  { to: '/', icon: '🗺️', pt: 'Curso', en: 'Course' },
  { to: '/today', icon: '🎯', pt: 'Treino', en: 'Practice' },
  { to: '/dictionary', icon: '📖', pt: 'Dicionário', en: 'Dictionary' },
  { to: '/grammar', icon: '📐', pt: 'Gramática', en: 'Grammar' },
  { to: '/verbs', icon: '🔤', pt: 'Verbos', en: 'Verbs' },
  { to: '/review', icon: '🧠', pt: 'Revisão', en: 'Review' },
  { to: '/settings', icon: '⚙️', pt: 'Definições', en: 'Settings' },
]
</script>

<template>
  <div :class="enClass" class="min-h-screen pb-20 md:pb-0">
    <header class="sticky top-0 z-30 border-b border-stone-200 bg-white/85 backdrop-blur dark:border-stone-800 dark:bg-stone-950/85">
      <div class="mx-auto flex max-w-[1200px] items-center gap-4 px-4 py-2">
        <RouterLink to="/" class="flex items-center gap-2 text-lg font-extrabold">
          <span class="text-2xl">🇵🇹</span>
          <span class="hidden sm:inline">Português <span class="text-verde">Europeu</span></span>
        </RouterLink>
        <nav class="ml-4 hidden gap-1 md:flex">
          <RouterLink v-for="n in nav" :key="n.to" :to="n.to" class="rounded-lg px-3 py-1.5 font-semibold hover:bg-stone-100 dark:hover:bg-stone-800" active-class="!bg-verde/10 text-verde" :exact="n.to === '/'">
            {{ n.icon }} {{ n.pt }}
          </RouterLink>
        </nav>
        <div class="ml-auto flex items-center gap-3 font-bold">
          <span title="Streak / Sequência de dias">🔥 {{ p.streak.count }}</span>
          <span title="XP" class="text-ouro drop-shadow-[0_1px_0_#a37f00]">⭐ {{ p.xp }}</span>
          <button class="text-sm text-stone-400 hover:text-vermelho" title="Sair · Log out" @click="logout">⎋</button>
        </div>
      </div>
    </header>

    <div v-if="showVoiceWarn" class="border-b border-ouro/40 bg-ouro/15 px-4 py-2 text-sm">
      <div class="mx-auto flex max-w-[1200px] items-start gap-3">
        <p class="flex-1">
          <template v-if="voice === 'other'">
            ⚠️ Só há uma voz portuguesa do <b>Brasil</b> neste dispositivo — o áudio não soa a português europeu.
            <span class="en">Only a Brazilian Portuguese voice is installed, so audio will not sound like European Portuguese.</span>
          </template>
          <template v-else-if="voice === 'none'">
            ⚠️ Não há voz portuguesa neste dispositivo — o áudio não vai funcionar bem.
            <span class="en">No Portuguese voice is installed, so audio will not work properly.</span>
          </template>
          <template v-else>
            ⚠️ Este navegador não suporta áudio.
            <span class="en">This browser does not support speech audio.</span>
          </template>
          <span class="block text-xs opacity-80">
            Instala a voz «Português (Portugal)» (Windows: Definições › Hora e idioma › Voz; Chrome/Edge no Windows já traz «Helia»). ·
            Install the "Portuguese (Portugal)" voice in your OS language/speech settings.
          </span>
        </p>
        <button class="font-bold" title="Fechar · Dismiss" @click="dismissVoice">✕</button>
      </div>
    </div>

    <main class="mx-auto max-w-[1200px] px-4 py-6">
      <slot />
    </main>

    <nav class="fixed inset-x-0 bottom-0 z-30 flex justify-around border-t border-stone-200 bg-white py-1 md:hidden dark:border-stone-800 dark:bg-stone-950">
      <RouterLink v-for="n in nav" :key="n.to" :to="n.to" class="flex flex-col items-center px-1 py-1 text-[11px] font-semibold" active-class="text-verde">
        <span class="text-xl">{{ n.icon }}</span>{{ n.pt }}
      </RouterLink>
    </nav>
  </div>
</template>
