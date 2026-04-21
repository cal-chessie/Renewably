import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function GET() {
  try {
    const supabase = createServiceClient()

    const [contactsRes, dealsRes, proposalsRes, invoicesRes] = await Promise.all([
      supabase.from('contacts').select('id', { count: 'exact', head: true }),
      supabase.from('deals').select('id', { count: 'exact', head: true }),
      supabase.from('proposals').select('id', { count: 'exact', head: true }),
      supabase.from('invoices').select('id', { count: 'exact', head: true }),
    ])

    return NextResponse.json({
      contacts: contactsRes.count ?? 0,
      deals: dealsRes.count ?? 0,
      proposals: proposalsRes.count ?? 0,
      invoices: invoicesRes.count ?? 0,
    })
  } catch (error) {
    console.error('Failed to fetch overview stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch overview stats' },
      { status: 500 }
    )
  }
}
