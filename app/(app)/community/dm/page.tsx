import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createApplicationServices } from '@/lib/infrastructure/repositories/supabase/factory'
import { PrivateChatClient } from '@/components/community/private-chat-client'

export const dynamic='force-dynamic'

export default async function PrivateChatPage({searchParams}:{searchParams:Promise<{conversation?:string}>}){const params=await searchParams;const supabase=await createClient();const{data:{user}}=await supabase.auth.getUser();if(!user||user.is_anonymous)redirect('/auth/login');const services=createApplicationServices(supabase);const threads=await services.social.listConversations(user.id);const otherIds=[...new Set(threads.map(t=>t.participantA===user.id?t.participantB:t.participantA))];const names=new Map<string,string>();if(otherIds.length>0){const{data,error}=await supabase.from('user_profile').select('id,username').in('id',otherIds);if(error)throw error;for(const row of data??[])names.set(row.id,row.username)}const enriched=threads.map(t=>{const otherId=t.participantA===user.id?t.participantB:t.participantA;return{id:t.id,otherId,otherUsername:names.get(otherId)??'Manager'}});const selected=enriched.find(t=>t.id===params.conversation)??enriched[0]??null;const messages=selected?await services.social.listMessages(selected.id,200):[];return <PrivateChatClient threads={enriched} selectedConversationId={selected?.id??null} messages={messages} currentUserId={user.id}/>}
