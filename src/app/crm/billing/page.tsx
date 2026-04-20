'use client'
import { useEffect } from 'react'

// Billing moved to Settings > Subscription
export default function BillingRedirect() {
  useEffect(() => { window.location.replace('/crm/settings?tab=billing') }, [])
  return null
}
