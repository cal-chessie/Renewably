import { NextResponse } from 'next/server'
import { requireAuth, unauthorized } from '@/lib/crm-auth'
import { db } from '@/lib/db'
import { signOAuthState } from '@/lib/oauth-state'

export async function GET(request: Request) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const clientId = process.env.GOOGLE_CLIENT_ID
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/crm/calendar/google/callback`

    if (!clientId) {
      const mockUrl = `${redirectUri}?code=mock_code_${Date.now()}&state=${signOAuthState(user.id)}`
      return NextResponse.json({ url: mockUrl, mock: true })
    }

    const scopes = [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar.events',
    ].join(' ')

    const state = signOAuthState(user.id)

    const url = new URL('https://accounts.google.com/o/oauth2/v2/auth')
    url.searchParams.set('client_id', clientId)
    url.searchParams.set('redirect_uri', redirectUri)
    url.searchParams.set('response_type', 'code')
    url.searchParams.set('scope', scopes)
    url.searchParams.set('access_type', 'offline')
    url.searchParams.set('prompt', 'consent')
    url.searchParams.set('state', state)

    return NextResponse.json({ url: url.toString(), mock: false })
  } catch (error) {
    console.error('Google auth URL error:', error)
    return NextResponse.json({ error: 'Failed to generate auth URL' }, { status: 500 })
  }
}
