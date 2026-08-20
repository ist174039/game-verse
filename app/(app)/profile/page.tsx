import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const dynamic='force-dynamic'

export default async function OwnProfilePage({searchParams}:{searchParams:Promise<{universe?:string}>}){
  const supabase=await createClient();const{data:{user}}=await supabase.auth.getUser();if(!user)redirect('/auth/login')
  const universe=(await searchParams).universe
  redirect(universe?`/profile/${user.id}?universe=${encodeURIComponent(universe)}`:`/profile/${user.id}`)
}
