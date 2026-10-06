export default defineEventHandler(async (event) => {
  const body = await readBody<ProgressState>(event)
  if (!body || typeof body !== 'object' || typeof body.lessons !== 'object') throw createError({ statusCode: 400, statusMessage: 'Bad progress payload' })
  await writeProgress(await useDb(), body)
  return { ok: true }
})
