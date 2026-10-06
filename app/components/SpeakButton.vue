<script setup lang="ts">
import { speak } from '../utils'
import { useProgress } from '../stores/progress'
const props = defineProps<{ text: string; size?: 'sm' | 'lg' }>()
const p = useProgress()
</script>

<template>
  <button
    type="button"
    :title="'Ouvir / Listen: ' + props.text"
    class="inline-flex shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-700 transition hover:bg-sky-200 active:scale-90 dark:bg-sky-900/50 dark:text-sky-300"
    :class="size === 'lg' ? 'h-14 w-14 text-2xl' : 'h-7 w-7 text-sm'"
    @click.stop="speak(props.text, p.settings.rate)"
  >🔊</button>
</template>
