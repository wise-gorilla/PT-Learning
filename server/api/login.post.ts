// tiny brute-force guard: 5 wrong PINs from one IP lock it out for a minute
const fails = new Map<string, { n: number; until: number }>()

export default defineEventHandler(async (event) => {
  const ip = getRequestIP(event, { xForwardedFor: true }) ?? 'local'
  const f = fails.get(ip)
  if (f && f.until > Date.now()) throw createError({ statusCode: 429, statusMessage: 'Too many attempts' })

  const body = await readBody<{ pin?: unknown }>(event)
  if (!checkPin(body?.pin)) {
    const n = (f?.n ?? 0) + 1
    fails.set(ip, n >= 5 ? { n: 0, until: Date.now() + 60_000 } : { n, until: 0 })
    throw createError({ statusCode: 401, statusMessage: 'Wrong PIN' })
  }
  fails.delete(ip)
  startSession(event)
  return { ok: true }
})
