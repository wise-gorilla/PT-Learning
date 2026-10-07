<script setup lang="ts">
/** Shared input for fill / translate / listen exercises. */
import { ref, onMounted } from 'vue'
import { check, speak, type Verdict } from '../../utils'
import AccentKeys from '../AccentKeys.vue'
import { useProgress } from '../../stores/progress'

const props = defineProps<{ answers: string[]; placeholder?: string }>()
const emit = defineEmits<{ answer: [correct: boolean, solution?: string] }>()
const p = useProgress()
const value = ref('')
const verdict = ref<Verdict | null>(null)
const el = ref<HTMLInputElement>()
onMounted(() => el.value?.focus())

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
    <AccentKeys :disabled="!!verdict" />
    <p v-if="verdict === 'accent'" class="mt-2 font-semibold text-amber-600">⚠️ Quase! Atenção aos acentos · Almost! Watch the accents: <b>{{ answers[0] }}</b></p>
    <button type="submit" class="btn-primary mt-4 w-full" :disabled="!!verdict || !value.trim()">Verificar · Check</button>
  </form>
</template>
