import 'server-only'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { InternalRole } from '@/lib/domain/governance'

export type AdminAction = 'TICKET' | 'MODERATION' | 'FREEZE' | 'CONFIG' | 'REFUND' | 'REVERSAL'

export const ADMIN_ROLES = new Set<InternalRole>(['super_admin','platform_admin','economy_admin','competition_admin','moderator','support_agent','finance_operator','read_only_analyst'])

const permissions: Record<AdminAction, Set<InternalRole>> = {
  TICKET: new Set(['super_admin','platform_admin','economy_admin','competition_admin','moderator','support_agent','finance_operator']),
  MODERATION: new Set(['super_admin','platform_admin','competition_admin','moderator']),
  FREEZE: new Set(['super_admin','platform_admin','economy_admin','moderator','finance_operator']),
  CONFIG: new Set(['super_admin','platform_admin']),
  REFUND: new Set(['super_admin','platform_admin','economy_admin','finance_operator']),
  REVERSAL: new Set(['super_admin','platform_admin','economy_admin','competition_admin','finance_operator']),
}

export interface AdminSession {
  user: User
  role: InternalRole
  userClient: Awaited<ReturnType<typeof createClient>>
  serviceClient: ReturnType<typeof createAdminClient>
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const userClient = await createClient()
  const { data:{ user } } = await userClient.auth.getUser()
  if (!user || user.is_anonymous) return null
  const rawRole = typeof user.app_metadata?.role === 'string' ? user.app_metadata.role : null
  if (!rawRole || !ADMIN_ROLES.has(rawRole as InternalRole)) return null
  return { user, role: rawRole as InternalRole, userClient, serviceClient: createAdminClient() }
}

export function canAdmin(role: InternalRole, action: AdminAction) {
  return permissions[action].has(role)
}
