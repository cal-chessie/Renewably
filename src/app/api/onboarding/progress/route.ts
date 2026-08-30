import { NextResponse } from 'next/server'

/** Retired with the public SolarPilot flow. Relay setup progress is token-gated. */
export async function GET() {
  return NextResponse.json({ error: 'This onboarding route is no longer available.' }, { status: 410 })
}

export async function PUT() {
  return NextResponse.json({ error: 'This onboarding route is no longer available.' }, { status: 410 })
}
