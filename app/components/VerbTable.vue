<script setup lang="ts">
import { computed } from 'vue'
import { verbMap } from '../data/verbs'
import type { TenseKey } from '../types'
import { PERSONS, IMP_PERSONS, TENSE_LABELS, speak } from '../utils'
import { useProgress } from '../stores/progress'
import SpeakButton from './SpeakButton.vue'

const p = useProgress()

const props = defineProps<{ verb: string; tenses?: TenseKey[] }>()
const v = computed(() => verbMap[props.verb])
const shown = computed(() => {
  const all = Object.keys(v.value?.forms ?? {}) as TenseKey[]
  return props.tenses?.length ? props.tenses.filter((t) => all.includes(t)) : all
})
</script>

<template>
  <div v-if="v" class="card overflow-hidden">
    <div class="flex flex-wrap items-center gap-2 bg-verde/10 px-4 py-2">
      <SpeakButton :text="v.inf" />
      <h4 class="text-lg font-extrabold text-verde">{{ v.inf }}</h4>
      <span class="en">{{ v.en }}</span>
      <span v-if="v.irregular" class="ml-auto rounded-full bg-vermelho/10 px-2 py-0.5 text-xs font-bold text-vermelho">irregular</span>
    </div>
    <div class="overflow-x-auto">
      <div class="grid gap-px bg-stone-200 dark:bg-stone-800" :style="{ gridTemplateColumns: `repeat(${shown.length}, minmax(10rem, 1fr))` }">
        <div v-for="t in shown" :key="t" class="bg-white p-3 dark:bg-stone-900">
          <p class="font-bold">{{ TENSE_LABELS[t].pt }}</p>
          <p class="en mb-2">{{ TENSE_LABELS[t].en }}</p>
          <table class="w-full text-sm">
            <tr v-for="(f, i) in v.forms[t]" :key="i">
              <td class="py-0.5 pr-2 text-stone-400">{{ (t === 'imperativo' ? IMP_PERSONS : PERSONS)[i] }}</td>
              <td class="py-0.5 font-semibold">
                <button class="text-left hover:text-sky-600" title="Ouvir / Listen" @click="speak(f, p.settings.rate)">{{ f }}</button>
              </td>
            </tr>
          </table>
        </div>
      </div>
    </div>
    <div v-if="v.ex" class="border-t border-stone-100 px-4 py-2 dark:border-stone-800">
      <p class="flex items-center gap-2"><SpeakButton :text="v.ex.pt" /> {{ v.ex.pt }}</p>
      <p class="en pl-9">{{ v.ex.en }}</p>
    </div>
  </div>
  <p v-else class="text-sm text-stone-400">({{ verb }})</p>
</template>
