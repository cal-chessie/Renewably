import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const stateParam = searchParams.get('state')
    const error = searchParams.get('error')

    if (error) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/crm/meetings?error=${encodeURIComponent(error)}`)
    }

    if (!code || !stateParam) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/crm/meetings?error=missing_params`)
    }

    let userId = ''
    try {
      const state = JSON.parse(Buffer.from(stateParam, 'base64').toString())
      userId = state.userId
    } catch {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/crm/meetings?error=invalid_state`)
    }

    if (!userId) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/crm/meetings?error=no_user`)
    }

    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/crm/calendar/google/callback`

    let accessToken: string
    let refreshToken: string
    let expiresIn: number
    let calendarEmail: string | null = null
    let calendarId: string | null = null

    if (!clientId || !clientSecret) {
      accessToken = `mock_access_token_${Date.now()}`
      refreshToken = `mock_refresh_token_${Date.now()}`
      expiresIn = 3600
      calendarEmail = 'user@gmail.com'
      calendarId = 'primary'
    } else {
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      })

      if (!tokenResponse.ok) {
        const errData = await tokenResponse.json()
        console.error('Google token exchange error:', errData)
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/crm/meetings?error=token_exchange_failed`)
      }

      const tokens = await tokenResponse.json()
      accessToken = tokens.access_token
      refreshToken = tokens.refresh_token
      expiresIn = tokens.expires_in

      try {
        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        if (userInfoResponse.ok) {
          const userInfo = await userInfoResponse.json()
          calendarEmail = userInfo.email
        }
      } catch {
        // Non-critical
      }

      calendarId = 'primary'
    }

    const expiresAt = new Date(Date.now() + expiresIn * 1000)

    await db.googleCalendarConnection.upsert({
      where: { userId },
      create: {
        userId,
        accessToken,
        refreshToken,
        expiresAt,
        calendarId,
        email: calendarEmail,
        isActive: true,
        lastSyncedAt: new Date(),
      },
      update: {
        accessToken,
        refreshToken,
        expiresAt,
        calendarId,
        email: calendarEmail,
        isActive: true,
        lastSyncedAt: new Date(),
      },
    })

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    return NextResponse.redirect(`${baseUrl}/crm/meetings?connected=true`)
  } catch (error) {
    console.error('Google callback error:', error)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    return NextResponse.redirect(`${baseUrl}/crm/meetings?error=internal_error`)
  }
}
