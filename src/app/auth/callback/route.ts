import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const type = searchParams.get('type') // 'recovery' for password reset

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // ignored when called from Server Component
            }
          },
        },
      }
    )
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'

      // Password reset: redirect to app with mode=recovery so the app shows the update-password form
      // Email verification: redirect with verified=true
      const param = type === 'recovery' ? 'mode=recovery' : 'verified=true'
      const dest = isLocalEnv
        ? `${origin}/?${param}`
        : forwardedHost
          ? `https://${forwardedHost}/?${param}`
          : `${origin}/?${param}`

      return NextResponse.redirect(dest)
    }
  }

  // Fallback: redirect to app root with an error flag (avoids 404)
  return NextResponse.redirect(`${origin}/?auth_error=1`)
}
