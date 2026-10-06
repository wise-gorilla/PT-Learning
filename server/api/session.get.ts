export default defineEventHandler((event) => ({ ok: isLoggedIn(event) }))
