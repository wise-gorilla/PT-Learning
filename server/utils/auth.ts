import { createHmac, timingSafeEqual } from 'node:crypto'
import type { H3Event } from 'h3'

const COOKIE = 'pt-session'

const sign = (pin: string, secret: string) => createHmac('sha256', secret).update(`pt-session:${pin}`).digest('hex')

function safeEqual(a: string, b: string) {
  const x = Buffer.from(a)
  const y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}

export function checkPin(pin: unknown): boolean {
  return typeof pin === 'string' && safeEqual(pin, String(useRuntimeConfig().appPin))
}

export function startSession(event: H3Event) {
  const { appPin, sessionSecret } = useRuntimeConfig()
  setCookie(event, COOKIE, sign(String(appPin), String(sessionSecret)), {
    httpOnly: true,
    sameSite: 'lax',
    secure: getRequestProtocol(event) === 'https',
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
  })
}

export function endSession(event: H3Event) {
  deleteCookie(event, COOKIE, { path: '/' })
}

export function isLoggedIn(event: H3Event): boolean {
  const { appPin, sessionSecret } = useRuntimeConfig()
  const c = getCookie(event, COOKIE)
  return !!c && safeEqual(c, sign(String(appPin), String(sessionSecret)))
}
