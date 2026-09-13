<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import { useProgress } from './stores/progress'

const p = useProgress()
watchEffect(() => document.documentElement.classList.toggle('dark', p.settings.dark))
const enClass = computed(() => (p.settings.enMode === 'tap' ? 'en-tap' : p.settings.enMode === 'hide' ? 'en-hide' : ''))

const nav = [
  { to: '/', icon: '🗺️', pt: 'Curso', en: 'Course' },
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
      <div class="mx-auto flex max-w-5xl items-center gap-4 px-4 py-2">
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
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-5xl px-4 py-6">
      <RouterView v-slot="{ Component, route }">
        <component :is="Component" :key="route.path" />
      </RouterView>
    </main>

    <nav class="fixed inset-x-0 bottom-0 z-30 flex justify-around border-t border-stone-200 bg-white py-1 md:hidden dark:border-stone-800 dark:bg-stone-950">
      <RouterLink v-for="n in nav" :key="n.to" :to="n.to" class="flex flex-col items-center px-1 py-1 text-[11px] font-semibold" active-class="text-verde">
        <span class="text-xl">{{ n.icon }}</span>{{ n.pt }}
      </RouterLink>
    </nav>
  </div>
</template>
