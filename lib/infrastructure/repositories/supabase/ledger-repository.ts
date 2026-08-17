import type { SupabaseClient } from '@supabase/supabase-js'
import type { LedgerRepository } from '@/lib/application/contracts'
import type { LedgerTransaction } from '@/lib/domain/economy'

export class SupabaseLedgerRepository implements LedgerRepository {
  constructor(private readonly client: SupabaseClient) {}

  async getTransactionByIdempotencyKey(key: string): Promise<LedgerTransaction | null> {
    const { data, error } = await this.client.from('ledger_transaction').select('*').eq('idempotency_key',key).maybeSingle()
    if (error) throw error
    if (!data) return null
    return {
      id:data.id,
      transactionType:data.transaction_type,
      idempotencyKey:data.idempotency_key ?? null,
      referenceType:data.reference_type ?? null,
      referenceId:data.reference_id ?? null,
      reason:data.reason ?? null,
      metadata:data.metadata ?? {},
      createdBy:data.created_by ?? null,
      createdAt:data.created_at,
    }
  }
}
