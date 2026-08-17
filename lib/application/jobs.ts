export interface InternalJobResult {
  processedEvents: number
  expiredListings: number
  defaultedLoans: number
}

export interface InternalJobsRepository {
  runMaintenance(input: { eventLimit?: number; listingLimit?: number; jobKey: string }): Promise<InternalJobResult>
}
