<script setup lang="ts">
/** Shared input for fill / translate / listen exercises. */
import { ref, onMounted } from 'vue'
import { check, speak, type Verdict } from '../../utils'
import { useProgress } from '../../stores/progress'

const props = defineProps<{ answers: string[]; placeholder?: string }>()
const emit = defineEmits<{ answer: [correct: boolean, solution?: string] }>()
const p = useProgress()
const value = ref('')
const verdict = ref<Verdict | null>(null)
const el = ref<HTMLInputElement>()
onMounted(() => el.value?.focus())

const ACCENTS = ['á', 'à', 'â', 'ã', 'é', 'ê', 'í', 'ó', 'ô', 'õ', 'ú', 'ç']
function insert(ch: string) {
  const i = el.value?.selectionStart ?? value.value.length
  value.value = value.value.slice(0, i) + ch + value.value.slice(i)
  requestAnimationFrame(() => {
    el.value?.focus()
    el.value?.setSelectionRange(i + 1, i + 1)
  })
}

function submit() {
  if (verdict.value || !value.value.trim()) return
  verdict.value = check(value.value, props.answers)
  const ok = verdict.value === 'correct' || (verdict.value === 'accent' && !p.settings.accentStrict)
  if (ok) speak(props.answers[0], p.settings.rate)
  emit('answer', ok, props.answers[0])
}
defineExpose({ submit })
</script>

<template>
  <form @submit.prevent="submit">
    <input
      ref="el"
      v-model="value"
      :disabled="!!verdict"
      class="input"
      :class="verdict === 'correct' ? '!border-verde' : verdict === 'accent' ? '!border-ouro' : verdict === 'wrong' ? '!border-vermelho shake' : ''"
      :placeholder="placeholder ?? 'Escreve aqui… / Type here…'"
      autocomplete="off"
      autocapitalize="off"
      spellcheck="false"
    />
    <div class="mt-2 flex flex-wrap gap-1">
      <button v-for="a in ACCENTS" :key="a" type="button" class="rounded-lg bg-stone-100 px-2.5 py-1 font-semibold hover:bg-stone-200 dark:bg-stone-800" :disabled="!!verdict" @click="insert(a)">{{ a }}</button>
    </div>
    <p v-if="verdict === 'accent'" class="mt-2 font-semibold text-amber-600">⚠️ Quase! Atenção aos acentos · Almost! Watch the accents: <b>{{ answers[0] }}</b></p>
    <button type="submit" class="btn-primary mt-4 w-full" :disabled="!!verdict || !value.trim()">Verificar · Check</button>
  </form>
</template>
