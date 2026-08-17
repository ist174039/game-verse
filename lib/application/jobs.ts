export interface InternalJobResult {
  processedEvents: number
  expiredListings: number
  defaultedLoans: number
  readiedMatches: number
  progressedCompetitions: number
}

export interface InternalJobsRepository {
  runMaintenance(input: { eventLimit?: number; listingLimit?: number; matchLimit?: number; jobKey: string }): Promise<InternalJobResult>
}
