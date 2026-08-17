export interface InternalJobResult {
  processedEvents: number
  expiredListings: number
}

export interface InternalJobsRepository {
  runMaintenance(input: { eventLimit?: number; listingLimit?: number; jobKey: string }): Promise<InternalJobResult>
}
