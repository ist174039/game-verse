import type { SupabaseClient } from '@supabase/supabase-js'
import type { InternalJobResult, InternalJobsRepository } from '@/lib/application/jobs'

export class SupabaseInternalJobsRepository implements InternalJobsRepository {
  constructor(private readonly client: SupabaseClient) {}

  async runMaintenance(input: { eventLimit?: number; listingLimit?: number; matchLimit?: number; jobKey: string }): Promise<InternalJobResult> {
    const eventLimit=input.eventLimit ?? 200
    const listingLimit=input.listingLimit ?? 200
    const matchLimit=input.matchLimit ?? 500
    const [events,listings,loans,ready,progress]=await Promise.all([
      this.client.rpc('service_process_domain_events',{p_limit:eventLimit,p_job_key:`${input.jobKey}:events`}),
      this.client.rpc('service_expire_stale_direct_listings',{p_limit:listingLimit}),
      this.client.rpc('service_process_overdue_loans'),
      this.client.rpc('service_ready_scheduled_matches',{p_limit:matchLimit}),
      this.client.rpc('service_progress_active_competitions'),
    ])
    for(const result of [events,listings,loans,ready,progress]) if(result.error) throw result.error
    return { processedEvents:Number(events.data ?? 0), expiredListings:Number(listings.data ?? 0), defaultedLoans:Number(loans.data ?? 0), readiedMatches:Number(ready.data ?? 0), progressedCompetitions:Number(progress.data ?? 0) }
  }
}
