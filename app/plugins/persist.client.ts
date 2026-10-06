import { persistProgress, useProgress } from '~/stores/progress'

export default defineNuxtPlugin(() => {
  persistProgress(useProgress())
})
