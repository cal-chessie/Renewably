// @ts-nocheck — pending migration to Supabase
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const [contacts, deals, proposals, invoices] = await Promise.all([
      db.contact.count(),
      db.deal.count(),
      db.proposal.count(),
      db.invoice.count(),
    ])
    return NextResponse.json({ contacts, deals, proposals, invoices })
  } catch (error) {
    console.error('Failed to fetch overview stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch overview stats' },
      { status: 500 }
    )
  }
}
