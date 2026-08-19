import 'server-only'

import { headers } from 'next/headers'

function normalizeOrigin(value: string | undefined) {
  const candidate = value?.trim()
  if (!candidate) return null

  try {
    return new URL(/^https?:\/\//i.test(candidate) ? candidate : `https://${candidate}`).origin
  } catch {
    return null
  }
}

export async function getTrustedApplicationOrigin() {
  const production = normalizeOrigin(process.env.VERCEL_PROJECT_PRODUCTION_URL)
  if (process.env.VERCEL_ENV === 'production' && production) return production

  const deployment = normalizeOrigin(process.env.VERCEL_URL)
  if (deployment) return deployment

  // Local development has no Vercel system URL. In production we fail closed
  // instead of trusting a caller-controlled Host header for Stripe redirects.
  if (process.env.NODE_ENV !== 'production') {
    const requestHeaders = await headers()
    const forwardedHost = requestHeaders.get('x-forwarded-host')?.split(',')[0]?.trim()
    const host = forwardedHost || requestHeaders.get('host')?.trim()
    const forwardedProto = requestHeaders.get('x-forwarded-proto')?.split(',')[0]?.trim()
    const protocol = forwardedProto || (host?.startsWith('localhost') || host?.startsWith('127.0.0.1') ? 'http' : 'https')
    const requestOrigin = host ? normalizeOrigin(`${protocol}://${host}`) : null
    if (requestOrigin) return requestOrigin
    return 'http://localhost:3000'
  }

  throw new Error('Não foi possível determinar a origem segura da aplicação.')
}
