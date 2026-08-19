export interface InternalJobResult {
  processedEvents:number
  expiredListings:number
  defaultedLoans:number
  autoStartedCompetitions:number
  readiedMatches:number
  autoConfirmedMatches:number
  deferredAutoConfirmations:number
  failedAutoConfirmations:number
  progressedCompetitions:number
  settledAuctions:number
  expiredAuctions:number
  failedAuctions:number
  sponsorshipOffers:number
  settledFinancialCycles:number
}
export interface InternalJobsRepository {
  runMaintenance(input:{
    eventLimit?:number
    listingLimit?:number
    matchLimit?:number
    auctionLimit?:number
    competitionLimit?:number
    confirmationLimit?:number
    jobKey:string
  }):Promise<InternalJobResult>
}
