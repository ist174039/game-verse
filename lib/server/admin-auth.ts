import 'server-only'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { InternalRole } from '@/lib/domain/governance'

export type AdminAction = 'TICKET' | 'MODERATION' | 'FREEZE' | 'CONFIG' | 'REFUND' | 'REVERSAL' | 'COMPETITION' | 'PLAYERS' | 'ADMIN_USERS'

export const ADMIN_ROLES = new Set<InternalRole>(['super_admin','platform_admin','economy_admin','competition_admin','moderator','support_agent','finance_operator','read_only_analyst'])

const permissions: Record<AdminAction, Set<InternalRole>> = {
  TICKET: new Set(['super_admin','platform_admin','economy_admin','competition_admin','moderator','support_agent','finance_operator']),
  MODERATION: new Set(['super_admin','platform_admin','competition_admin','moderator']),
  FREEZE: new Set(['super_admin','platform_admin','economy_admin','moderator','finance_operator']),
  CONFIG: new Set(['super_admin','platform_admin']),
  REFUND: new Set(['super_admin','platform_admin','economy_admin','finance_operator']),
  REVERSAL: new Set(['super_admin','platform_admin','economy_admin','competition_admin','finance_operator']),
  COMPETITION: new Set(['super_admin','platform_admin','competition_admin']),
  PLAYERS: new Set(['super_admin','platform_admin']),
  ADMIN_USERS: new Set(['super_admin','platform_admin']),
}

export interface AdminSession {
  user: User
  role: InternalRole
  userClient: Awaited<ReturnType<typeof createClient>>
  serviceClient: ReturnType<typeof createAdminClient>
}

function legacyRole(user: User): InternalRole | null {
  const rawRole = typeof user.app_metadata?.role === 'string' ? user.app_metadata.role : null
  return rawRole && ADMIN_ROLES.has(rawRole as InternalRole) ? rawRole as InternalRole : null
}

function adminTableUnavailable(error: { code?: string | null; message?: string | null }) {
  return error.code === '42P01' || error.code === 'PGRST205' || Boolean(error.message?.includes('admin_user') && error.message?.includes('schema cache'))
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const userClient = await createClient()
  const { data:{ user } } = await userClient.auth.getUser()
  if (!user || user.is_anonymous) return null

  const serviceClient = createAdminClient()
  const { data, error } = await serviceClient
    .from('admin_user')
    .select('role,active')
    .eq('user_id', user.id)
    .maybeSingle()

  // Transitional fallback only while migration 00440 is not yet applied.
  if (error) {
    if (adminTableUnavailable(error)) {
      const role = legacyRole(user)
      return role ? { user, role, userClient, serviceClient } : null
    }
    console.error('admin_session_lookup_failed', { code: error.code, message: error.message })
    return null
  }

  const role = typeof data?.role === 'string' ? data.role as InternalRole : null
  if (!data?.active || !role || !ADMIN_ROLES.has(role)) return null
  return { user, role, userClient, serviceClient }
}

export function canAdmin(role: InternalRole, action: AdminAction) {
  return permissions[action].has(role)
}
