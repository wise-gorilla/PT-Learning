<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Exercise } from '../../types'
import { shuffle, speak } from '../../utils'
import { useProgress } from '../../stores/progress'

const props = defineProps<{ ex: Extract<Exercise, { type: 'sort' }> }>()
const emit = defineEmits<{ answer: [correct: boolean, solution?: string] }>()
const p = useProgress()
const items = shuffle(props.ex.items.map(([t, b], id) => ({ t, b, id })))
const placed = ref<Record<number, number>>({})
const selected = ref<number | null>(null)
const checked = ref(false)
const pool = computed(() => items.filter((i) => placed.value[i.id] === undefined))

function pick(id: number, t: string) {
  if (checked.value) return
  selected.value = selected.value === id ? null : id
  speak(t, p.settings.rate)
}
function drop(bucket: number, id = selected.value) {
  if (checked.value || id === null) return
  placed.value[id] = bucket
  selected.value = null
}
function unplace(id: number) {
  if (!checked.value) delete placed.value[id]
}
function onDragStart(e: DragEvent, id: number) {
  e.dataTransfer?.setData('text/plain', String(id))
}
function onDrop(e: DragEvent, bucket: number) {
  const id = Number(e.dataTransfer?.getData('text/plain'))
  if (!Number.isNaN(id)) drop(bucket, id)
}
function submit() {
  checked.value = true
  const ok = items.every((i) => placed.value[i.id] === i.b)
  emit('answer', ok, ok ? undefined : props.ex.buckets.map((b, bi) => `${b}: ${items.filter((i) => i.b === bi).map((i) => i.t).join(', ')}`).join(' · '))
}
</script>

<template>
  <div>
    <p class="text-sm font-bold uppercase tracking-wide text-stone-400">Arruma as palavras · Sort into groups</p>
    <p class="mt-1 text-xl font-bold">{{ ex.q.pt }}</p>
    <p class="en">{{ ex.q.en }}</p>
    <p class="en mt-1">Arrasta, ou toca numa palavra e depois num grupo. · Drag, or tap a word then a group.</p>

    <div class="mt-4 flex min-h-12 flex-wrap gap-2">
      <button v-for="i in pool" :key="i.id" draggable="true" class="chip pop" :class="selected === i.id ? '!border-sky-500 !bg-sky-50 dark:!bg-sky-950' : ''"
        @dragstart="onDragStart($event, i.id)" @click="pick(i.id, i.t)">{{ i.t }}</button>
    </div>

    <div class="mt-4 grid gap-3" :class="ex.buckets.length > 2 ? 'sm:grid-cols-3' : 'grid-cols-2'">
      <div v-for="(b, bi) in ex.buckets" :key="bi" class="min-h-32 rounded-2xl border-2 border-dashed p-3 transition"
        :class="selected !== null ? 'border-sky-400 bg-sky-50/50 dark:bg-sky-950/30' : 'border-stone-300 dark:border-stone-700'"
        @click="drop(bi)" @dragover.prevent @drop.prevent="onDrop($event, bi)">
        <p class="mb-2 text-center font-extrabold text-verde">{{ b }}</p>
        <div class="flex flex-wrap gap-1.5">
          <button v-for="i in items.filter((x) => placed[x.id] === bi)" :key="i.id" class="pop rounded-lg px-2 py-1 text-sm font-semibold"
            :class="checked ? (i.b === bi ? 'bg-verde text-white' : 'bg-vermelho text-white line-through') : 'bg-stone-200 dark:bg-stone-700'"
            @click.stop="unplace(i.id)">{{ i.t }}</button>
        </div>
      </div>
    </div>
    <button class="btn-primary mt-5 w-full" :disabled="checked || pool.length > 0" @click="submit">Verificar · Check</button>
  </div>
</template>
