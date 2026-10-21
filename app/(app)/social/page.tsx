import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { EmptyState } from '@/components/ui/async-state'
import { SocialConnectionsClient } from '@/components/social/social-connections-client'

export const dynamic = 'force-dynamic'

type FriendshipRow = { user_a: string; user_b: string; status: string; created_at: string }
type FollowRow = { follower_id: string; followed_id: string; created_at: string }
type ProfileRow = { id: string; username: string; avatar_url: string | null }

export default async function SocialPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.is_anonymous) redirect('/auth/login')

  const [friendshipsResult, followingResult, followersResult] = await Promise.all([
    supabase.from('friendship').select('user_a,user_b,status,created_at').or(`user_a.eq.${user.id},user_b.eq.${user.id}`),
    supabase.from('follow').select('follower_id,followed_id,created_at').eq('follower_id', user.id),
    supabase.from('follow').select('follower_id,followed_id,created_at').eq('followed_id', user.id),
  ])
  if (friendshipsResult.error) throw friendshipsResult.error
  if (followingResult.error) throw followingResult.error
  if (followersResult.error) throw followersResult.error

  const friendships = (friendshipsResult.data ?? []) as FriendshipRow[]
  const following = (followingResult.data ?? []) as FollowRow[]
  const followers = (followersResult.data ?? []) as FollowRow[]
  const profileIds = [...new Set([
    ...friendships.map(row => row.user_a === user.id ? row.user_b : row.user_a),
    ...following.map(row => row.followed_id),
    ...followers.map(row => row.follower_id),
  ])]
  const profileResult = profileIds.length
    ? await supabase.from('user_profile').select('id,username,avatar_url').in('id', profileIds)
    : { data: [], error: null }
  if (profileResult.error) throw profileResult.error
  const profiles = new Map(((profileResult.data ?? []) as ProfileRow[]).map(profile => [profile.id, profile]))
  const profileFor = (id: string) => {
    const profile = profiles.get(id)
    return profile ? { id: profile.id, username: profile.username, avatarUrl: profile.avatar_url } : null
  }

  const friends = friendships.filter(row => row.status === 'ACCEPTED').map(row => profileFor(row.user_a === user.id ? row.user_b : row.user_a)).filter((profile): profile is NonNullable<typeof profile> => Boolean(profile))
  const incoming = friendships.filter(row => row.status === 'PENDING' && row.user_b === user.id).map(row => profileFor(row.user_a)).filter((profile): profile is NonNullable<typeof profile> => Boolean(profile))
  const outgoing = friendships.filter(row => row.status === 'PENDING' && row.user_a === user.id).map(row => profileFor(row.user_b)).filter((profile): profile is NonNullable<typeof profile> => Boolean(profile))
  const followingProfiles = following.map(row => profileFor(row.followed_id)).filter((profile): profile is NonNullable<typeof profile> => Boolean(profile))
  const followerProfiles = followers.map(row => profileFor(row.follower_id)).filter((profile): profile is NonNullable<typeof profile> => Boolean(profile))

  return <div className="space-y-6">
    <header className="brand-watermark rounded-2xl border border-white/[0.07] bg-[#0b0b0b] px-5 py-6 sm:px-7">
      <p className="clan-kicker">Identidade global</p>
      <div className="mt-2 flex items-center gap-3"><Users className="size-6 text-primary" aria-hidden="true"/><h1 className="text-3xl font-black tracking-[-0.04em] sm:text-4xl">Relações</h1></div>
      <p className="mt-3 text-sm text-muted-foreground">Gere amizades e acompanha managers. Abre um perfil para enviar um pedido ou seguir.</p>
    </header>
    <div className="grid gap-5 xl:grid-cols-2">
      <RelationGroup title="Pedidos recebidos" empty="Não tens pedidos pendentes." profiles={incoming} action="incoming" />
      <RelationGroup title="Amigos" empty="Ainda não tens amigos adicionados." profiles={friends} action="friend" />
      <RelationGroup title="A seguir" empty="Ainda não segues managers." profiles={followingProfiles} action="following" />
      <RelationGroup title="Seguidores" empty="Ainda não tens seguidores." profiles={followerProfiles} action="profile" />
      <RelationGroup title="Pedidos enviados" empty="Não tens pedidos enviados pendentes." profiles={outgoing} action="outgoing" />
    </div>
  </div>
}

function RelationGroup({title,empty,profiles,action}:{title:string;empty:string;profiles:Array<{id:string;username:string;avatarUrl:string|null}>;action:'incoming'|'friend'|'following'|'profile'|'outgoing'}) {
  return <section className="clan-panel-neutral rounded-2xl p-4 sm:p-5"><div className="flex items-center justify-between gap-3"><h2 className="text-lg font-bold">{title}</h2><span className="text-xs tabular-nums text-muted-foreground">{profiles.length}</span></div>{profiles.length===0?<EmptyState title={empty} className="mt-3 min-h-28 rounded-xl border-white/[.06] px-3"/>:<ul className="mt-3 divide-y divide-white/[.06]">{profiles.map(profile=><li key={profile.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><Link href={`/profile/${profile.id}`} className="font-semibold hover:text-primary">{profile.username}</Link><SocialConnectionsClient targetUserId={profile.id} action={action}/></li>)}</ul>}</section>
}
