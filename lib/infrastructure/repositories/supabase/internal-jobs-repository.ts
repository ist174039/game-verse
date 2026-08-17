import type { SupabaseClient } from '@supabase/supabase-js'
import type { InternalJobResult, InternalJobsRepository } from '@/lib/application/jobs'

export class SupabaseInternalJobsRepository implements InternalJobsRepository {
  constructor(private readonly client: SupabaseClient) {}

  async runMaintenance(input: { eventLimit?: number; listingLimit?: number; jobKey: string }): Promise<InternalJobResult> {
    const eventLimit=input.eventLimit ?? 200
    const listingLimit=input.listingLimit ?? 200
    const [events,listings,loans]=await Promise.all([
      this.client.rpc('service_process_domain_events',{p_limit:eventLimit,p_job_key:`${input.jobKey}:events`}),
      this.client.rpc('service_expire_stale_direct_listings',{p_limit:listingLimit}),
      this.client.rpc('service_process_overdue_loans'),
    ])
    if (events.error) throw events.error
    if (listings.error) throw listings.error
    if (loans.error) throw loans.error
    return { processedEvents:Number(events.data ?? 0), expiredListings:Number(listings.data ?? 0), defaultedLoans:Number(loans.data ?? 0) }
  }
}
