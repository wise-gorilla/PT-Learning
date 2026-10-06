<script setup lang="ts">
import SpeakButton from './SpeakButton.vue'
defineProps<{ pt: string; en: string; speak?: boolean; tag?: string }>()
</script>

<template>
  <div>
    <div class="flex items-start gap-2">
      <SpeakButton v-if="speak" :text="pt" class="mt-0.5" />
      <component :is="tag ?? 'p'" class="font-medium">{{ pt }}</component>
    </div>
    <p class="en" :class="speak ? 'pl-9' : ''">{{ en }}</p>
  </div>
</template>
