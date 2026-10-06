<script setup lang="ts">
definePageMeta({ layout: false })

const pin = ref('')
const error = ref('')
const busy = ref(false)

async function submit() {
  if (!pin.value || busy.value) return
  busy.value = true
  error.value = ''
  try {
    await $fetch('/api/login', { method: 'POST', body: { pin: pin.value } })
  } catch (e: any) {
    const code = e?.statusCode ?? e?.status
    error.value =
      code === 429
        ? 'Demasiadas tentativas. Espera um minuto. · Too many attempts, wait a minute.'
        : code === 401
          ? 'PIN errado · Wrong PIN'
          : `Erro do servidor (${code ?? 'rede'}) · Server error (${code ?? 'network'})`
    pin.value = ''
    busy.value = false
    return
  }
  useState('authed').value = true
  try {
    await navigateTo('/')
  } catch {
    error.value = 'Não foi possível carregar o progresso. · Could not load your progress.'
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-gradient-to-br from-verde via-emerald-700 to-emerald-900 p-4">
    <form class="card w-full max-w-sm space-y-4 p-8 text-center" @submit.prevent="submit">
      <p class="text-6xl">🇵🇹</p>
      <h1 class="text-2xl font-extrabold">Português <span class="text-verde">Europeu</span></h1>
      <p class="en">Introduz o PIN · Enter your PIN</p>
      <input
        v-model="pin"
        class="input text-center text-3xl tracking-[0.5em]"
        type="password"
        inputmode="numeric"
        autocomplete="current-password"
        autofocus
        maxlength="12"
        placeholder="••••"
      />
      <p v-if="error" class="font-bold text-vermelho">{{ error }}</p>
      <button class="btn-primary w-full" :disabled="!pin || busy">Entrar · Log in</button>
    </form>
  </div>
</template>
