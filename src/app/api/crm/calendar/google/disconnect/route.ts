import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, unauthorized } from '@/lib/crm-auth'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    await db.googleCalendarConnection.delete({
      where: { userId: user.id },
    })

    return NextResponse.json({ success: true, message: 'Google Calendar disconnected' })
  } catch (error) {
    console.error('Google Calendar disconnect error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
