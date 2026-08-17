import type { SupabaseClient } from '@supabase/supabase-js'
import type { SocialRepository } from '@/lib/application/contracts'
import type { ChatMessage, Community, CommunityConversation, CommunityMembership, CommunityPost, CommunityVisibility, DirectConversation } from '@/lib/domain/social'
import type { UUID } from '@/lib/domain/core'

const mapCommunity=(r:any):Community=>({id:r.id,ownerUserId:r.owner_user_id,name:r.name,slug:r.slug,description:r.description??null,visibility:r.visibility,createdAt:r.created_at})
const mapPost=(r:any):CommunityPost=>({id:r.id,communityId:r.community_id,authorUserId:r.author_user_id,body:r.body,createdAt:r.created_at,updatedAt:r.edited_at??r.created_at})
const mapMessage=(r:any):ChatMessage=>({id:r.id,conversationId:r.conversation_id,senderUserId:r.sender_user_id,body:r.body,createdAt:r.created_at})

export class SupabaseSocialRepository implements SocialRepository {
  constructor(private readonly client: SupabaseClient) {}

  async listCommunities(userId: UUID): Promise<Community[]> {
    const {data:memberships,error:membershipError}=await this.client.from('community_membership').select('community_id').eq('user_id',userId)
    if(membershipError)throw membershipError
    const memberIds=(memberships??[]).map((m:any)=>m.community_id)
    let query=this.client.from('community').select('id,owner_user_id,name,slug,description,visibility,created_at').order('created_at',{ascending:false})
    if(memberIds.length>0) query=query.or(`visibility.eq.PUBLIC,id.in.(${memberIds.join(',')})`)
    else query=query.eq('visibility','PUBLIC')
    const {data,error}=await query
    if(error)throw error
    return (data??[]).map(mapCommunity)
  }

  async listCommunityPosts(communityId: UUID, limit = 30): Promise<CommunityPost[]> {
    const { data, error } = await this.client.from('community_post').select('*').eq('community_id',communityId).order('created_at',{ascending:false}).limit(limit)
    if (error) throw error
    return (data ?? []).map(mapPost)
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

  async listCommunityConversations(userId:UUID):Promise<CommunityConversation[]>{
    const {data:memberships,error}=await this.client.from('conversation_member').select('conversation_id').eq('user_id',userId)
    if(error)throw error
    const ids=(memberships??[]).map((m:any)=>m.conversation_id)
    if(ids.length===0)return []
    const {data,error:e2}=await this.client.from('conversation').select('*').in('id',ids).eq('kind','COMMUNITY').order('created_at',{ascending:false})
    if(e2)throw e2
    return (data??[]).filter((r:any)=>r.community_id).map((r:any)=>({id:r.id,communityId:r.community_id,title:r.title??null,createdAt:r.created_at}))
  }

  async listMessages(conversationId: UUID, limit = 100): Promise<ChatMessage[]> {
    const { data, error } = await this.client.from('message').select('*').eq('conversation_id',conversationId).is('deleted_at',null).order('created_at',{ascending:false}).limit(limit)
    if (error) throw error
    return (data ?? []).reverse().map(mapMessage)
  }

  async createCommunity(input:{name:string;slug:string;description?:string|null;visibility:CommunityVisibility}):Promise<Community>{
    const {data,error}=await this.client.rpc('create_community_with_owner',{p_name:input.name,p_slug:input.slug,p_description:input.description??null,p_visibility:input.visibility})
    if(error)throw error
    return mapCommunity(data)
  }

  async joinCommunity(communityId:UUID):Promise<CommunityMembership>{
    const {data,error}=await this.client.rpc('join_public_community',{p_community_id:communityId})
    if(error)throw error
    return {communityId:data.community_id,userId:data.user_id,role:data.role,joinedAt:data.joined_at}
  }

  async createPost(input:{communityId:UUID;body:string}):Promise<CommunityPost>{
    const {data,error}=await this.client.rpc('create_community_post',{p_community_id:input.communityId,p_body:input.body})
    if(error)throw error
    return mapPost(data)
  }

  async startDirectConversation(otherUserId:UUID):Promise<{id:UUID;createdAt:string}>{
    const {data,error}=await this.client.rpc('start_direct_conversation',{p_other_user_id:otherUserId})
    if(error)throw error
    return {id:data.id,createdAt:data.created_at}
  }

  async sendMessage(input:{conversationId:UUID;body:string}):Promise<ChatMessage>{
    const {data,error}=await this.client.rpc('send_social_message',{p_conversation_id:input.conversationId,p_body:input.body})
    if(error)throw error
    return mapMessage(data)
  }
}
