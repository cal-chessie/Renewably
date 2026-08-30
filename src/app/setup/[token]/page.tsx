import { notFound } from 'next/navigation'

import RelaySetupClient from '@/components/relay-setup/RelaySetupClient'
import { findValidRelayInvite } from '@/lib/relay-setup'

export const dynamic = 'force-dynamic'
export const metadata = { robots: { index: false, follow: false } }

export default async function RelaySetupPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  if (token === 'preview' && process.env.RELAY_SETUP_PREVIEW === 'true') {
    return <RelaySetupClient token={token} companyName="Preview company" contactName="Cal" preview />
  }
  const invite = await findValidRelayInvite(token)
  if (!invite) notFound()
  return <RelaySetupClient token={token} companyName={invite.company_name} contactName={invite.contact_name} />
}
