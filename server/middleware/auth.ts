// every /api route needs the session cookie, except the login/session endpoints themselves
export default defineEventHandler((event) => {
  const path = getRequestURL(event).pathname
  if (!path.startsWith('/api/') || path === '/api/login' || path === '/api/session') return
  if (!isLoggedIn(event)) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
})
