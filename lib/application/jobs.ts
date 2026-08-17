export interface InternalJobResult {
  processedEvents:number
  expiredListings:number
  defaultedLoans:number
  readiedMatches:number
  progressedCompetitions:number
  settledAuctions:number
  expiredAuctions:number
  failedAuctions:number
  sponsorshipOffers:number
  settledFinancialCycles:number
}
export interface InternalJobsRepository { runMaintenance(input:{eventLimit?:number;listingLimit?:number;matchLimit?:number;auctionLimit?:number;jobKey:string}):Promise<InternalJobResult> }
