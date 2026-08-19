import type {SupabaseClient} from '@supabase/supabase-js'
import type {InternalJobResult,InternalJobsRepository} from '@/lib/application/jobs'

export class SupabaseInternalJobsRepository implements InternalJobsRepository{
  constructor(private readonly client:SupabaseClient){}

  async runMaintenance(input:{eventLimit?:number;listingLimit?:number;matchLimit?:number;auctionLimit?:number;competitionLimit?:number;confirmationLimit?:number;jobKey:string}):Promise<InternalJobResult>{
    const eventLimit=input.eventLimit??200
    const listingLimit=input.listingLimit??200
    const matchLimit=input.matchLimit??500
    const auctionLimit=input.auctionLimit??200
    const competitionLimit=input.competitionLimit??50
    const confirmationLimit=input.confirmationLimit??200

    const[events,listings,loans,autoStart,ready,autoConfirm,auctions,sponsors,cycles]=await Promise.all([
      this.client.rpc('service_process_domain_events',{p_limit:eventLimit,p_job_key:`${input.jobKey}:events`}),
      this.client.rpc('service_expire_stale_direct_listings',{p_limit:listingLimit}),
      this.client.rpc('service_process_overdue_loans'),
      this.client.rpc('service_auto_start_competitions',{p_limit:competitionLimit}),
      this.client.rpc('service_ready_scheduled_matches',{p_limit:matchLimit}),
      this.client.rpc('service_process_result_confirmation_timeouts',{p_limit:confirmationLimit}),
      this.client.rpc('service_process_expired_auctions',{p_limit:auctionLimit}),
      this.client.rpc('service_refresh_sponsorship_offers'),
      this.client.rpc('service_process_due_financial_cycles'),
    ])

    for(const result of[events,listings,loans,autoStart,ready,autoConfirm,auctions,sponsors,cycles]){
      if(result.error)throw result.error
    }

    // Settlement timeout processing can complete matches, so competition progression runs
    // afterwards instead of racing the same competition in the parallel phase above.
    const progress=await this.client.rpc('service_progress_active_competitions')
    if(progress.error)throw progress.error

    const a=(auctions.data??{}) as Record<string,unknown>
    const ac=(autoConfirm.data??{}) as Record<string,unknown>
    return{
      processedEvents:Number(events.data??0),
      expiredListings:Number(listings.data??0),
      defaultedLoans:Number(loans.data??0),
      autoStartedCompetitions:Number(autoStart.data??0),
      readiedMatches:Number(ready.data??0),
      autoConfirmedMatches:Number(ac.confirmed??0),
      deferredAutoConfirmations:Number(ac.deferred_evidence??0),
      failedAutoConfirmations:Number(ac.failed??0),
      progressedCompetitions:Number(progress.data??0),
      settledAuctions:Number(a.settled??0),
      expiredAuctions:Number(a.expired??0),
      failedAuctions:Number(a.failed??0),
      sponsorshipOffers:Number(sponsors.data??0),
      settledFinancialCycles:Number(cycles.data??0),
    }
  }
}
