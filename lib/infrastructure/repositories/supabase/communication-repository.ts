import type { SupabaseClient } from '@supabase/supabase-js'
import type { CommunicationRepository } from '@/lib/application/contracts'
import type { JournalArticle, Notification } from '@/lib/domain/communications'
import type { UUID } from '@/lib/domain/core'

export class SupabaseCommunicationRepository implements CommunicationRepository {
  constructor(private readonly client: SupabaseClient) {}
  async listJournal(universeId: UUID, limit = 30): Promise<JournalArticle[]> {
    const { data, error } = await this.client.from('journal_article').select('*').eq('universe_id',universeId).order('published_at',{ascending:false}).limit(limit)
    if (error) throw error
    return (data ?? []).map((r:any)=>({id:r.id,universeId:r.universe_id,eventId:r.event_id,category:r.category,title:r.title,summary:r.summary,body:r.body,importance:Number(r.importance),publishedAt:r.published_at}))
  }
  async listNotifications(userId: UUID, limit = 50): Promise<Notification[]> {
    const { data, error } = await this.client.from('notification').select('*').eq('user_id',userId).order('created_at',{ascending:false}).limit(limit)
    if (error) throw error
    return (data ?? []).map((r:any)=>({id:r.id,userId:r.user_id,type:r.type,title:r.title,body:r.body,href:r.href,readAt:r.read_at,createdAt:r.created_at}))
  }
  async markNotificationRead(notificationId: UUID): Promise<void> {
    const { error } = await this.client.from('notification').update({read_at:new Date().toISOString()}).eq('id',notificationId)
    if (error) throw error
  }
}
