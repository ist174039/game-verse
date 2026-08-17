import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  // Handle OAuth errors (e.g., user denied permission)
  const oauthError = searchParams.get('error')
  if (oauthError) {
    const errorDescription = searchParams.get('error_description') ?? oauthError
    return NextResponse.redirect(
      `${origin}/auth/error?message=${encodeURIComponent(errorDescription)}`,
    )
  }

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Check if there's a provider token (for OAuth)
      const {
        data: { session },
      } = await supabase.auth.getSession()

      // Redirect to the intended page or dashboard
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // If no code and no error, something went wrong
  return NextResponse.redirect(`${origin}/auth/error?message=No%20authorization%20code%20received`)
}
