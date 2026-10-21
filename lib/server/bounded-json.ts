/** Read JSON request bodies with a hard byte limit, including chunked requests. */
export async function readBoundedJson<T = unknown>(
  request: Request,
  maxBytes = 32 * 1024,
): Promise<{ ok: true; value: T } | { ok: false; reason: 'too_large' | 'invalid_json' }> {
  const contentLength = Number(request.headers.get('content-length'))
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    return { ok: false, reason: 'too_large' }
  }

  if (!request.body) return { ok: false, reason: 'invalid_json' }

  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      total += value.byteLength
      if (total > maxBytes) {
        await reader.cancel()
        return { ok: false, reason: 'too_large' }
      }
      chunks.push(value)
    }
  } catch {
    return { ok: false, reason: 'invalid_json' }
  }

  const bytes = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }

  try {
    return { ok: true, value: JSON.parse(new TextDecoder().decode(bytes)) as T }
  } catch {
    return { ok: false, reason: 'invalid_json' }
  }
}
