import type { SupabaseClient } from '@supabase/supabase-js'
import type { InternalJobResult, InternalJobsRepository } from '@/lib/application/jobs'

export class SupabaseInternalJobsRepository implements InternalJobsRepository {
  constructor(private readonly client: SupabaseClient) {}

  async runMaintenance(input: { eventLimit?: number; listingLimit?: number; matchLimit?: number; auctionLimit?: number; jobKey: string }): Promise<InternalJobResult> {
    const eventLimit=input.eventLimit ?? 200
    const listingLimit=input.listingLimit ?? 200
    const matchLimit=input.matchLimit ?? 500
    const auctionLimit=input.auctionLimit ?? 200
    const [events,listings,loans,ready,progress,auctions]=await Promise.all([
      this.client.rpc('service_process_domain_events',{p_limit:eventLimit,p_job_key:`${input.jobKey}:events`}),
      this.client.rpc('service_expire_stale_direct_listings',{p_limit:listingLimit}),
      this.client.rpc('service_process_overdue_loans'),
      this.client.rpc('service_ready_scheduled_matches',{p_limit:matchLimit}),
      this.client.rpc('service_progress_active_competitions'),
      this.client.rpc('service_process_expired_auctions',{p_limit:auctionLimit}),
    ])
    for(const result of [events,listings,loans,ready,progress,auctions]) if(result.error) throw result.error
    const auctionResult=(auctions.data??{}) as Record<string,unknown>
    return {
      processedEvents:Number(events.data ?? 0),
      expiredListings:Number(listings.data ?? 0),
      defaultedLoans:Number(loans.data ?? 0),
      readiedMatches:Number(ready.data ?? 0),
      progressedCompetitions:Number(progress.data ?? 0),
      settledAuctions:Number(auctionResult.settled ?? 0),
      expiredAuctions:Number(auctionResult.expired ?? 0),
      failedAuctions:Number(auctionResult.failed ?? 0),
    }
  }
}
