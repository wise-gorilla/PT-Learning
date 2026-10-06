<script setup lang="ts">
import { computed, ref } from 'vue'
import { lessons, units } from '../data'
import type { Block } from '../types'
import { stripAccents } from '../utils'
import Blocks from '../components/Blocks.vue'

const q = ref('')
const level = ref<'' | 'A1' | 'A2'>('')
const showTips = ref(true)
const open = ref<Set<string>>(new Set())

const text = (b: Block) =>
  b.kind === 'table' ? [b.title?.pt, b.title?.en, ...b.head, ...b.rows.flat()].join(' ') : b.kind === 'tip' ? b.pt + ' ' + b.en : ''

const entries = computed(() => {
  const needle = stripAccents(q.value.toLowerCase())
  return lessons
    .filter((l) => !level.value || l.level === level.value)
    .map((l) => {
      const blocks = l.sections.flatMap((s) => s.blocks).filter((b) => b.kind === 'table' || (showTips.value && b.kind === 'tip'))
      const match = (b: Block) => !needle || stripAccents(text(b).toLowerCase()).includes(needle)
      const titleHit = !needle || stripAccents((l.title.pt + ' ' + l.title.en).toLowerCase()).includes(needle)
      return { l, blocks: titleHit ? blocks : blocks.filter(match) }
    })
    .filter((e) => e.blocks.length)
})
const toggle = (id: string) => (open.value.has(id) ? open.value.delete(id) : open.value.add(id))
const unitOf = (n: number) => units.find((u) => u.n === n)
</script>

<template>
  <div>
    <h1 class="text-3xl font-extrabold">📐 Gramática <span class="en !text-lg">Grammar reference — every table &amp; tip in one place</span></h1>

    <div class="card sticky top-[53px] z-10 mt-4 flex flex-wrap items-center gap-2 p-3">
      <input v-model="q" class="input flex-1 !text-base" placeholder="🔍 Procurar (ex.: possessivos, imperfeito, por/para) · Search" />
      <select v-model="level" class="input !w-auto !text-base">
        <option value="">A1 + A2</option>
        <option value="A1">A1</option>
        <option value="A2">A2</option>
      </select>
      <label class="flex items-center gap-2 px-2 text-sm font-semibold"><input v-model="showTips" type="checkbox" class="h-4 w-4 accent-verde" /> 💡 Dicas · Tips</label>
      <button class="btn-ghost text-sm" @click="open = new Set(open.size ? [] : entries.map((e) => e.l.id))">{{ open.size ? 'Fechar tudo · Collapse' : 'Abrir tudo · Expand' }}</button>
    </div>

    <div class="mt-4 space-y-3">
      <section v-for="e in entries" :key="e.l.id" class="card overflow-hidden">
        <button class="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-stone-50 dark:hover:bg-stone-800/50" @click="toggle(e.l.id)">
          <span class="text-2xl">{{ e.l.emoji }}</span>
          <div class="flex-1">
            <p class="text-xs font-bold uppercase text-stone-400">{{ e.l.level }} · U{{ e.l.unit }} {{ unitOf(e.l.unit)?.title.pt }}</p>
            <p class="font-bold">{{ e.l.title.pt }} <span class="en">{{ e.l.title.en }}</span></p>
          </div>
          <span class="rounded-full bg-stone-100 px-2 text-sm dark:bg-stone-800">{{ e.blocks.length }}</span>
          <span class="transition" :class="open.has(e.l.id) || q ? 'rotate-90' : ''">›</span>
        </button>
        <div v-if="open.has(e.l.id) || q" class="border-t border-stone-100 p-4 dark:border-stone-800">
          <Blocks :blocks="e.blocks" />
          <RouterLink :to="`/lesson/${e.l.id}`" class="mt-3 inline-block text-sm font-bold text-verde hover:underline">Ir para a lição · Go to lesson ›</RouterLink>
        </div>
      </section>
      <p v-if="!entries.length" class="card p-6 text-center text-stone-400">Nada encontrado · Nothing found</p>
    </div>
  </div>
</template>
