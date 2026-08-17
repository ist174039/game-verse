import type { SupabaseClient } from '@supabase/supabase-js'
import type { SocialRepository } from '@/lib/application/contracts'
import type { ChatMessage, Community, CommunityPost, DirectConversation } from '@/lib/domain/social'
import type { UUID } from '@/lib/domain/core'

export class SupabaseSocialRepository implements SocialRepository {
  constructor(private readonly client: SupabaseClient) {}

  async listCommunities(userId: UUID): Promise<Community[]> {
    const { data, error } = await this.client
      .from('community')
      .select('id,owner_user_id,name,slug,description,visibility,created_at')
      .or(`visibility.eq.PUBLIC,owner_user_id.eq.${userId}`)
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data ?? []).map((r: any) => ({ id:r.id, ownerUserId:r.owner_user_id, name:r.name, slug:r.slug, description:r.description ?? null, visibility:r.visibility, createdAt:r.created_at }))
  }

  async listCommunityPosts(communityId: UUID, limit = 30): Promise<CommunityPost[]> {
    const { data, error } = await this.client.from('community_post').select('*').eq('community_id',communityId).order('created_at',{ascending:false}).limit(limit)
    if (error) throw error
    return (data ?? []).map((r:any)=>({id:r.id,communityId:r.community_id,authorUserId:r.author_user_id,body:r.body,createdAt:r.created_at,updatedAt:r.edited_at ?? r.created_at}))
  }

  async listConversations(userId: UUID): Promise<DirectConversation[]> {
    const { data: memberships, error } = await this.client.from('conversation_member').select('conversation_id').eq('user_id',userId)
    if (error) throw error
    const ids=(memberships ?? []).map((m:any)=>m.conversation_id)
    if (ids.length===0) return []
    const { data, error: e2 } = await this.client.from('conversation').select('*').in('id',ids).eq('kind','DIRECT').order('created_at',{ascending:false})
    if (e2) throw e2
    const result: DirectConversation[]=[]
    for (const row of data ?? []) {
      const { data: members, error: e3 } = await this.client.from('conversation_member').select('user_id').eq('conversation_id',row.id)
      if (e3) throw e3
      const users=(members ?? []).map((m:any)=>m.user_id)
      if (users.length===2) result.push({id:row.id,participantA:users[0],participantB:users[1],createdAt:row.created_at})
    }
    return result
  }

  async listMessages(conversationId: UUID, limit = 100): Promise<ChatMessage[]> {
    const { data, error } = await this.client.from('message').select('*').eq('conversation_id',conversationId).is('deleted_at',null).order('created_at',{ascending:false}).limit(limit)
    if (error) throw error
    return (data ?? []).reverse().map((r:any)=>({id:r.id,conversationId:r.conversation_id,senderUserId:r.sender_user_id,body:r.body,createdAt:r.created_at}))
  }
}
