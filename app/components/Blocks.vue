<script setup lang="ts">
import type { Block } from '../types'
import SpeakButton from './SpeakButton.vue'
import VerbTable from './VerbTable.vue'
defineProps<{ blocks: Block[] }>()
</script>

<template>
  <div class="space-y-4">
    <template v-for="(b, i) in blocks" :key="i">
      <div v-if="b.kind === 'heading'" class="pt-2">
        <h3 class="text-xl font-extrabold">{{ b.pt }}</h3>
        <p class="en">{{ b.en }}</p>
      </div>

      <div v-else-if="b.kind === 'text'" class="leading-relaxed">
        <p class="whitespace-pre-line">{{ b.pt }}</p>
        <p class="en mt-1 whitespace-pre-line">{{ b.en }}</p>
      </div>

      <ul v-else-if="b.kind === 'examples'" class="card divide-y divide-stone-100 dark:divide-stone-800">
        <li v-for="(e, j) in b.items" :key="j" class="flex items-start gap-3 px-4 py-2">
          <SpeakButton :text="e.pt" class="mt-0.5" />
          <div>
            <p class="font-semibold">{{ e.pt }}</p>
            <p class="en">{{ e.en }}</p>
          </div>
        </li>
      </ul>

      <div v-else-if="b.kind === 'table'" class="card overflow-hidden">
        <div v-if="b.title" class="bg-stone-100 px-4 py-2 dark:bg-stone-800">
          <p class="font-bold">{{ b.title.pt }}</p>
          <p class="en">{{ b.title.en }}</p>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left">
            <thead>
              <tr class="border-b border-stone-200 dark:border-stone-700">
                <th v-for="h in b.head" :key="h" class="px-4 py-2 text-sm font-bold text-verde">{{ h }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(r, j) in b.rows" :key="j" class="border-b border-stone-100 last:border-0 odd:bg-stone-50/60 dark:border-stone-800 dark:odd:bg-stone-800/30">
                <td v-for="(c, k) in r" :key="k" class="px-4 py-1.5" :class="k === 0 ? 'font-semibold' : ''">{{ c }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-else-if="b.kind === 'tip'" class="rounded-2xl border-l-4 border-ouro bg-ouro/10 px-4 py-3">
        <p class="font-semibold">💡 {{ b.pt }}</p>
        <p class="en mt-1">{{ b.en }}</p>
      </div>

      <div v-else-if="b.kind === 'dialogue'" class="card p-4">
        <div v-if="b.title" class="mb-3">
          <p class="font-bold">💬 {{ b.title.pt }}</p>
          <p class="en">{{ b.title.en }}</p>
        </div>
        <div class="space-y-2">
          <div v-for="(l, j) in b.lines" :key="j" class="flex gap-2" :class="j % 2 ? 'flex-row-reverse text-right' : ''">
            <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-bold text-white" :class="j % 2 ? 'bg-vermelho' : 'bg-verde'">{{ l.who.slice(0, 1) }}</div>
            <div class="max-w-[80%] rounded-2xl px-3 py-2" :class="j % 2 ? 'bg-vermelho/10' : 'bg-verde/10'">
              <p class="text-xs font-bold text-stone-500">{{ l.who }}</p>
              <p class="flex items-center gap-2" :class="j % 2 ? 'flex-row-reverse' : ''"><SpeakButton :text="l.pt" /> {{ l.pt }}</p>
              <p class="en">{{ l.en }}</p>
            </div>
          </div>
        </div>
      </div>

      <VerbTable v-else-if="b.kind === 'verb'" :verb="b.verb" :tenses="b.tenses" />
    </template>
  </div>
</template>
