import { NextResponse } from 'next/server'
import { getAdminIdentity } from '@/lib/server/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST() {
  const identity = await getAdminIdentity()
  if (!identity) return NextResponse.json({ error: 'admin_access_required' }, { status: 403 })

  const serviceClient = createAdminClient()
  const factors = await serviceClient.auth.admin.mfa.listFactors({ userId: identity.user.id })
  if (factors.error) {
    console.error('admin_mfa_factor_lookup_failed', { message: factors.error.message })
    return NextResponse.json({ error: 'admin_mfa_factor_lookup_failed' }, { status: 502 })
  }

  const hasVerifiedTotp = factors.data.factors.some(
    factor => factor.factor_type === 'totp' && factor.status === 'verified',
  )
  if (hasVerifiedTotp) return NextResponse.json({ mode: 'challenge' })

  // Supabase requires AAL2 for client-side unenrollment. An interrupted first
  // enrollment only has AAL1, so remove stale *unverified* TOTP factors through
  // the Admin API. Verified factors are never touched by this recovery path.
  const staleFactors = factors.data.factors.filter(
    factor => factor.factor_type === 'totp' && factor.status === 'unverified',
  )
  for (const factor of staleFactors) {
    const removed = await serviceClient.auth.admin.mfa.deleteFactor({
      userId: identity.user.id,
      id: factor.id,
    })
    if (removed.error) {
      console.error('admin_mfa_stale_factor_cleanup_failed', {
        factorId: factor.id,
        message: removed.error.message,
      })
      return NextResponse.json({ error: 'admin_mfa_stale_factor_cleanup_failed' }, { status: 502 })
    }
  }

  return NextResponse.json({ mode: 'enroll', removedStaleFactors: staleFactors.length })
}
