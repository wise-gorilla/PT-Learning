import { useProgress } from '~/stores/progress'

/** PIN gate: every page except /login needs a valid session; progress is loaded from the server once logged in */
export default defineNuxtRouteMiddleware(async (to) => {
  const authed = useState<boolean | null>('authed', () => null)
  if (authed.value === null) authed.value = (await $fetch<{ ok: boolean }>('/api/session').catch(() => ({ ok: false }))).ok

  if (to.path === '/login') return authed.value ? navigateTo('/') : undefined
  if (!authed.value) return navigateTo('/login')

  const p = useProgress()
  if (!p.loaded) await p.load()
})
