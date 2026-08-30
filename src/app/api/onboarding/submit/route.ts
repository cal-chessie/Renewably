import { NextResponse } from 'next/server'

/** Retired: public onboarding must never create CRM users or subscriptions. */
export async function POST() {
  return NextResponse.json({ error: 'This onboarding route is no longer available.' }, { status: 410 })
}
