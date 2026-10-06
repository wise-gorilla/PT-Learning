import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2026-01-01',
  ssr: false, // personal single-page app behind a PIN; the Nitro server only serves /api
  modules: ['@pinia/nuxt'],
  css: ['~/assets/css/main.css'],
  vite: { plugins: [tailwindcss()] },
  typescript: { tsConfig: { compilerOptions: { noUncheckedIndexedAccess: false } } },
  devtools: { enabled: false },
  app: {
    head: {
      title: 'Português Europeu A1–A2',
      meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
      link: [{ rel: 'icon', href: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🇵🇹</text></svg>" }],
      htmlAttrs: { lang: 'pt-PT' },
    },
  },
  runtimeConfig: {
    // override with NUXT_APP_PIN / NUXT_SESSION_SECRET / NUXT_DB_PATH in production
    appPin: '8035',
    sessionSecret: 'pt-learning-change-me',
    dbPath: './data/progress.sqlite',
    // hosted libSQL (Turso) for serverless hosts like Vercel: NUXT_TURSO_URL / NUXT_TURSO_TOKEN (or TURSO_DATABASE_URL / TURSO_AUTH_TOKEN)
    tursoUrl: '',
    tursoToken: '',
  },
})
