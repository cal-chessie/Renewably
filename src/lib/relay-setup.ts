import { createHash, randomBytes } from 'node:crypto'

import { INTAKE_FIELDS, INTAKE_STAGES } from '@/lib/relay-setup-fields'
import { createServiceClient } from '@/lib/supabase'

export const RELAY_SETUP_BUCKET = 'relay-setup-assets'
export const RELAY_SETUP_MAX_UPLOAD_BYTES = 25 * 1024 * 1024
export const RELAY_SETUP_ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/webp',
  'text/csv',
])

export interface RelaySetupAsset {
  id: string
  originalName: string
  mimeType: string
  sizeBytes: number
  storagePath: string
  uploadedAt: string
}

export const WEBSITE_DELIVERY_CHECKLIST = [
  'Primary domain, registrar and DNS host',
  'Domain owner and DNS approval contact',
  'Website platform, host and current developer or repository owner',
  'Every live enquiry form, chat, lead magnet and its current destination',
  'Search Console, Analytics, Tag Manager, consent and advertising-account owners',
  'Google Business Profile and social-channel ownership',
  'Approved copy, offers, claims, proof, photography, logo files and legal pages',
  'Priority pages, redirects, conversion concerns and launch approver',
] as const

export function hashRelaySetupToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export function createRelaySetupToken(): string {
  return randomBytes(32).toString('base64url')
}

export function isRelaySetupToken(value: string): boolean {
  return /^[A-Za-z0-9_-]{43}$/.test(value)
}

export function normaliseAnswers(value: unknown): Record<string, string | boolean> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  const allowed = new Set(INTAKE_FIELDS.map((field) => field.id))
  const answers: Record<string, string | boolean> = {}
  for (const [key, answer] of Object.entries(value)) {
    if (!allowed.has(key)) continue
    if (typeof answer === 'boolean') answers[key] = answer
    if (typeof answer === 'string') answers[key] = answer.trim().slice(0, 10_000)
  }
  return answers
}

export function missingFieldIds(answers: Record<string, string | boolean>): string[] {
  return INTAKE_FIELDS
    .filter((field) => field.control === 'confirm'
      ? answers[field.id] !== true
      : typeof answers[field.id] !== 'string' || !answers[field.id].trim())
    .map((field) => field.id)
}

export function buildRelayHandover(input: {
  inviteId: string
  companyName: string
  contactName: string
  answers: Record<string, string | boolean>
  assets: RelaySetupAsset[]
}): Record<string, unknown> {
  return {
    handover_version: 'renewably-relay-v1',
    generated_at: new Date().toISOString(),
    invite_id: input.inviteId,
    company_name: input.companyName,
    contact_name: input.contactName,
    starting_scope: ['Personal Assistant', 'Chief of Staff'],
    stages: INTAKE_STAGES.map((stage) => ({ key: stage.key, title: stage.title })),
    answers: input.answers,
    assets: input.assets,
    missing_field_ids: missingFieldIds(input.answers),
    website_delivery_checklist: WEBSITE_DELIVERY_CHECKLIST,
    release_state: 'HUMAN_REVIEW_REQUIRED',
    production_authority: 'NOT_GRANTED_BY_INTAKE',
  }
}

export async function findValidRelayInvite(token: string) {
  if (!isRelaySetupToken(token)) return null
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('relay_setup_invites')
    .select('id, contact_name, company_name, email, status, expires_at')
    .eq('token_hash', hashRelaySetupToken(token))
    .maybeSingle()
  if (error || !data || new Date(data.expires_at).getTime() <= Date.now()) return null
  if (['revoked', 'expired'].includes(data.status)) return null
  return data
}
