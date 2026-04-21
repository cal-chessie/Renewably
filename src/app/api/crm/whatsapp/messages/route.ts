import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { requireAuth, unauthorized } from '@/lib/crm-auth'

// ============================================================================
// GET /api/crm/whatsapp/messages — List WhatsApp messages with filters
// ============================================================================
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const supabase = createServiceClient()

    const { searchParams } = new URL(request.url)
    const contactId = searchParams.get('contactId')
    const companyId = searchParams.get('companyId')
    const direction = searchParams.get('direction')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    // Look up installer profile
    const { data: installer, error: installerError } = await supabase
      .from('installer_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (installerError || !installer) {
      return NextResponse.json(
        { error: 'Installer profile not found.' },
        { status: 404 }
      )
    }

    // NOTE: whatsapp_messages table may not exist yet in Supabase.
    // Build query — always scope to installer
    let query = supabase
      .from('whatsapp_messages')
      .select('*, contacts!whatsapp_messages_contact_id_fkey(id, name)', { count: 'exact' })
      .eq('installer_id', installer.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (contactId) {
      query = query.eq('contact_id', contactId)
    }
    if (companyId) {
      query = query.eq('company_id', companyId)
    }
    if (direction) {
      query = query.eq('direction', direction)
    }

    const { data: messages, error: messagesError, count } = await query

    if (messagesError) {
      // Gracefully handle missing whatsapp_messages table — return empty result
      const isMissingTable = messagesError.message?.includes('does not exist')
      if (isMissingTable) {
        return NextResponse.json({ messages: [], total: 0, limit, offset })
      }
      console.error('WhatsApp messages query error:', messagesError.message)
      return NextResponse.json(
        { error: 'Failed to fetch WhatsApp messages.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      messages: messages ?? [],
      total: count ?? 0,
      limit,
      offset,
    })
  } catch (error) {
    console.error('WhatsApp messages GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch WhatsApp messages.' },
      { status: 500 }
    )
  }
}
