import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CardDetailClient } from '@/components/cards/card-detail-client'

export const dynamic = 'force-dynamic'

export default async function CardDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return notFound()

  return <CardDetailClient cardId={id} userId={user.id} />
}
