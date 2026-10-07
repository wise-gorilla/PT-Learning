<script setup lang="ts">
/** On-screen keys for letters missing from an English keyboard; types into the last focused text input. */
import { onMounted, onUnmounted } from 'vue'

defineProps<{ disabled?: boolean }>()
const KEYS = ['á', 'à', 'â', 'ã', 'é', 'ê', 'í', 'ó', 'ô', 'õ', 'ú', 'ç']
let last: HTMLInputElement | null = null
const onFocus = (e: FocusEvent) => {
  const t = e.target
  if (t instanceof HTMLInputElement && t.type === 'text' && !t.closest('[data-no-accents]')) last = t
}
onMounted(() => document.addEventListener('focusin', onFocus))
onUnmounted(() => document.removeEventListener('focusin', onFocus))

function insert(ch: string) {
  const el = last && document.contains(last) && !last.disabled ? last : null
  if (!el) return
  const s = el.selectionStart ?? el.value.length
  const e = el.selectionEnd ?? s
  el.focus()
  el.setRangeText(ch, s, e, 'end')
  el.dispatchEvent(new Event('input', { bubbles: true })) // keep v-model in sync
}
</script>

<template>
  <div class="mt-2 flex flex-wrap justify-center gap-1">
    <button v-for="k in KEYS" :key="k" type="button" tabindex="-1" class="rounded-lg bg-stone-100 px-2.5 py-1 font-semibold hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700" :disabled="disabled" @mousedown.prevent @click="insert(k)">{{ k }}</button>
  </div>
</template>
