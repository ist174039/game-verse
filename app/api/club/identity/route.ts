import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { clearPublicImage, isHexColor, readOptionalImage, replacePublicImage } from '@/lib/server/media-storage'

const KIT_TYPES = ['HOME','AWAY','THIRD'] as const
type KitType = typeof KIT_TYPES[number]

function dbError(error: unknown) {
  const message = error instanceof Error ? error.message : 'club_identity_update_failed'
  if (message.includes('duplicate key') || message.includes('23505')) return 'club_name_taken'
  return message
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.is_anonymous) return NextResponse.json({ error: 'authentication_required' }, { status: 401 })

  let formData: FormData
  try { formData = await request.formData() } catch { return NextResponse.json({ error: 'invalid_form_data' }, { status: 400 }) }

  const clubId = String(formData.get('clubId') ?? '')
  const action = String(formData.get('action') ?? '')
  if (!clubId || !['identity','kit'].includes(action)) return NextResponse.json({ error: 'invalid_request' }, { status: 400 })

  const clubQ = await supabase.from('club').select('id,user_id,universe_id,name,motto,logo_url').eq('id', clubId).maybeSingle()
  if (clubQ.error) return NextResponse.json({ error: clubQ.error.message }, { status: 409 })
  if (!clubQ.data || clubQ.data.user_id !== user.id) return NextResponse.json({ error: 'club_not_owned' }, { status: 403 })

  try {
    if (action === 'identity') {
      const name = String(formData.get('name') ?? '').trim().replace(/\s+/g, ' ')
      const motto = String(formData.get('motto') ?? '').trim().replace(/\s+/g, ' ')
      if (name.length < 3 || name.length > 60) return NextResponse.json({ error: 'invalid_club_name' }, { status: 400 })
      if (motto.length > 120) return NextResponse.json({ error: 'invalid_club_motto' }, { status: 400 })

      const duplicateQ = await supabase.from('club').select('id').eq('universe_id', clubQ.data.universe_id).eq('name', name).neq('id', clubId).limit(1)
      if (duplicateQ.error) throw duplicateQ.error
      if ((duplicateQ.data ?? []).length > 0) return NextResponse.json({ error: 'club_name_taken' }, { status: 409 })

      const logo = await readOptionalImage(formData, 'logo')
      const removeLogo = String(formData.get('removeLogo') ?? '') === 'true'
      if (logo && removeLogo) return NextResponse.json({ error: 'conflicting_logo_action' }, { status: 400 })

      let logoUrl: string | null = clubQ.data.logo_url ?? null
      if (removeLogo) {
        await clearPublicImage(supabase, { bucket: 'club-logos', folder: clubId, basename: 'logo', extraExtensions: ['svg'] })
        logoUrl = null
      } else if (logo) {
        logoUrl = await replacePublicImage(supabase, { bucket: 'club-logos', folder: clubId, basename: 'logo', image: logo, extraExtensions: ['svg'] })
      }

      const { error } = await supabase.rpc('update_club_identity', {
        p_club_id: clubId,
        p_name: name,
        p_motto: motto || null,
        p_logo_url: logoUrl,
      })
      if (error) throw error
      return NextResponse.json({ clubId, name, motto: motto || null, logoUrl })
    }

    const kitTypeRaw = String(formData.get('kitType') ?? '').toUpperCase()
    if (!KIT_TYPES.includes(kitTypeRaw as KitType)) return NextResponse.json({ error: 'invalid_kit_type' }, { status: 400 })
    const kitType = kitTypeRaw as KitType
    const primaryColor = String(formData.get('primaryColor') ?? '').trim()
    const secondaryColor = String(formData.get('secondaryColor') ?? '').trim()
    if (!isHexColor(primaryColor) || !isHexColor(secondaryColor)) return NextResponse.json({ error: 'invalid_kit_color' }, { status: 400 })

    const currentQ = await supabase.from('club_kit').select('image_url').eq('club_id', clubId).eq('kit_type', kitType).maybeSingle()
    if (currentQ.error) throw currentQ.error
    const image = await readOptionalImage(formData, 'kitImage')
    const removeImage = String(formData.get('removeKitImage') ?? '') === 'true'
    if (image && removeImage) return NextResponse.json({ error: 'conflicting_kit_image_action' }, { status: 400 })

    const basename = kitType.toLowerCase()
    let imageUrl: string | null = currentQ.data?.image_url ?? null
    if (removeImage) {
      await clearPublicImage(supabase, { bucket: 'club-kits', folder: clubId, basename })
      imageUrl = null
    } else if (image) {
      imageUrl = await replacePublicImage(supabase, { bucket: 'club-kits', folder: clubId, basename, image })
    }

    const { error } = await supabase.from('club_kit').upsert({
      club_id: clubId,
      kit_type: kitType,
      image_url: imageUrl,
      primary_color: primaryColor,
      secondary_color: secondaryColor,
    }, { onConflict: 'club_id,kit_type' })
    if (error) throw error

    return NextResponse.json({ clubId, kitType, imageUrl, primaryColor, secondaryColor })
  } catch (error) {
    return NextResponse.json({ error: dbError(error) }, { status: 409 })
  }
}
