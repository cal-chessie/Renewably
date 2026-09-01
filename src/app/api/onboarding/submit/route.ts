// ============================================================================
// RENEWABLY.IE — ONBOARDING / DEMO REQUEST API  (lead capture)
// ============================================================================
// POST /api/onboarding/submit
//
// The public onboarding wizard is a LEAD CAPTURE flow. It does NOT create a
// login. Installers do not sign in to the Renewably CRM — that is Cal's agency
// CRM, and CRM logins are provisioned by the operator, never minted by a public
// request. A submission creates a company + contact + a new_lead deal (exactly
// like the public contact form), notifies the team, and confirms to the sender.
//
// It must never call supabase.auth.admin.createUser, write a role, issue a
// session cookie, or persist a password. See the contact route for the same
// lead pattern this mirrors.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { sendEmail, isPostmarkConfigured } from '@/lib/postmark'
import { sanitizeObject } from '@/lib/sanitize'
import { escapeHtml, sanitizeSearchQuery } from '@/lib/crm-validation'
import { onboardingSubmitSchema, formatZodError } from '@/lib/crm-schemas'
import { logger } from '@/lib/logger'
import { validateCsrfOrigin } from '@/lib/crm-route-helpers'

// ─── Rate limiting (in-memory, per IP) ───────────────────────────────────
const onboardingRateLimits = new Map<string, { count: number; expiresAt: number }>()

if (typeof globalThis !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of onboardingRateLimits) {
      if (entry.expiresAt <= now) onboardingRateLimits.delete(key)
    }
  }, 60_000).unref?.()
}

function checkRateLimit(ip: string): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now()
  const entry = onboardingRateLimits.get(ip)
  if (!entry || now > entry.expiresAt) {
    onboardingRateLimits.set(ip, { count: 1, expiresAt: now + 15 * 60 * 1000 })
    return { allowed: true, retryAfterMs: 0 }
  }
  entry.count++
  if (entry.count >= 5) {
    return { allowed: false, retryAfterMs: entry.expiresAt - now }
  }
  return { allowed: true, retryAfterMs: 0 }
}

function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp
  return 'unknown'
}

function planLabel(plan: string | undefined): string {
  if (plan === 'enterprise') return 'Enterprise'
  if (plan === 'starter') return 'Starter'
  return 'Pro'
}

// Indicative pipeline value for the deal, by plan interest.
function estimateDealValue(plan: string | undefined): number {
  if (plan === 'enterprise') return 24000
  if (plan === 'starter') return 12000
  return 18000
}

export async function POST(request: NextRequest) {
  try {
    if (!validateCsrfOrigin(request)) {
      return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 })
    }

    // Rate limit: max 5 submissions per 15 minutes per IP
    const clientIp = getClientIp(request)
    const { allowed, retryAfterMs } = checkRateLimit(clientIp)
    if (!allowed) {
      const retryAfterSec = Math.ceil(retryAfterMs / 1000)
      return NextResponse.json(
        { error: `Too many submissions. Please try again in ${retryAfterSec} seconds.` },
        { status: 429, headers: { 'Retry-After': String(retryAfterSec) } }
      )
    }

    // Parse + sanitize + validate
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const sanitized = sanitizeObject(body)
    const parsed = onboardingSubmitSchema.safeParse(sanitized)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: formatZodError(parsed.error) },
        { status: 400 }
      )
    }

    const data = parsed.data
    const normalizedEmail = data.email.toLowerCase().trim()
    const contactName = data.contact_name?.trim() || data.demo_name?.trim() || ''
    const companyName = data.company_name?.trim() || data.demo_company?.trim() || ''
    const phone = data.phone?.trim() || data.demo_phone?.trim() || ''
    const counties = Array.isArray(data.counties) ? data.counties.filter(Boolean) : []

    // ── Build a concise lead summary for the deal / notification ──────────
    const summaryLines = [
      companyName ? `Company: ${companyName}` : '',
      contactName ? `Contact: ${contactName}` : '',
      phone ? `Phone: ${phone}` : '',
      data.size ? `Team size: ${data.size}` : '',
      counties.length ? `Counties: ${counties.join(', ')}` : '',
      data.plan ? `Plan interest: ${planLabel(data.plan)} (${data.billing || 'monthly'})` : '',
      data.demo_date ? `Requested demo: ${data.demo_date}${data.demo_time ? ` ${data.demo_time}` : ''}` : '',
      Array.isArray(data.demo_focus) && data.demo_focus.length ? `Focus: ${data.demo_focus.join(', ')}` : '',
      data.installs_target ? `Installs target/mo: ${data.installs_target}` : '',
    ].filter(Boolean)
    const leadSummary = summaryLines.join(' · ').slice(0, 500)

    // ── 1. Write the lead to the CRM (company + contact + new_lead deal) ──
    let leadSaved = false
    let companyId: string | null = null
    let contactId: string | null = null

    try {
      const supabase = createServiceClient()

      // Reuse an existing company by name, else create one as a prospect.
      if (companyName) {
        const { data: existingCompany } = await supabase
          .from('companies')
          .select('id')
          .ilike('name', sanitizeSearchQuery(companyName))
          .limit(1)
          .single()

        if (existingCompany) {
          companyId = existingCompany.id
        } else {
          const { data: newCompany } = await supabase
            .from('companies')
            .insert({
              name: companyName,
              status: 'prospect',
              counties: counties.join(', '),
              seai_reg: data.vat?.trim() || '',
              team_size: 1,
              installs_per_year: 0,
              address: data.address?.trim() || null,
              notes: `Created from onboarding request by ${contactName || normalizedEmail}`,
            })
            .select('id')
            .single()

          if (newCompany) {
            companyId = newCompany.id
            // Best-effort setup-tracking row, mirrors the contact route.
            try {
              await supabase.from('onboarding').insert({
                company_id: companyId,
                solarpilot_progress: 0,
                ai_workforce_progress: 0,
              })
            } catch { /* non-fatal */ }
          }
        }
      }

      // Supabase returns { error } rather than throwing — a rejected insert
      // must never be treated as saved.
      const { data: contact, error: contactError } = await supabase
        .from('contacts')
        .insert({
          company_id: companyId,
          name: contactName || normalizedEmail,
          email: normalizedEmail,
          phone: phone || null,
          role: companyName ? 'Owner' : null,
          is_decision_maker: true,
          city: data.city?.trim() || null,
          address: data.address?.trim() || null,
          job_title: data.demo_role?.trim() || null,
          source: 'onboarding',
          status: 'active',
          notes: `Onboarding request. ${leadSummary}`.slice(0, 500),
        })
        .select('id')
        .single()

      if (contactError) {
        logger.error('Onboarding contact insert failed — lead not written to CRM', {
          error: contactError.message,
          email: normalizedEmail,
        })
      } else if (contact) {
        contactId = contact.id
      }

      // The new_lead deal IS the CRM-visible lead; its success is what
      // "captured" means.
      const value = estimateDealValue(data.plan)
      const { error: dealError } = await supabase.from('deals').insert({
        company_id: companyId,
        product: 'solarpilot',
        mrr: Math.round(value / 12),
        setup_fee: 0,
        stage: 'new_lead',
        value,
        notes: `Onboarding request from ${contactName || normalizedEmail}. ${leadSummary}`.slice(0, 600),
      })

      if (dealError) {
        logger.error('Onboarding deal insert failed — lead did not reach the pipeline', {
          error: dealError.message,
          email: normalizedEmail,
        })
      }

      leadSaved = !contactError && !dealError && Boolean(contact)

      // Mark any in-progress onboarding record complete WITHOUT persisting the
      // form blob (no password is collected, and we do not store the raw form).
      try {
        const { data: existing } = await supabase
          .from('onboarding_submissions')
          .select('id')
          .eq('email', normalizedEmail)
          .single()
        if (existing) {
          await supabase
            .from('onboarding_submissions')
            .update({
              form_data: { summary: leadSummary },
              status: 'completed',
              company_id: companyId,
              contact_id: contactId,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id)
        } else {
          await supabase.from('onboarding_submissions').insert({
            email: normalizedEmail,
            form_data: { summary: leadSummary },
            status: 'completed',
            company_id: companyId,
            contact_id: contactId,
          })
        }
      } catch { /* non-fatal bookkeeping */ }

      if (leadSaved) {
        logger.info('Onboarding lead saved to CRM', { email: normalizedEmail, companyId })
      }
    } catch (dbError) {
      logger.warn('Could not save onboarding lead to Supabase', {
        error: dbError instanceof Error ? dbError.message : String(dbError),
      })
    }

    // ── 2. Notify the team ────────────────────────────────────────────────
    let emailSent = false
    try {
      const rows = summaryLines
        .map(line => {
          const [k, ...rest] = line.split(': ')
          const v = rest.join(': ')
          return `<tr><td style="color:rgba(255,255,255,0.50);padding:8px 0;font-size:13px;">${escapeHtml(k)}</td><td style="color:#fff;padding:8px 0;font-size:14px;">${escapeHtml(v)}</td></tr>`
        })
        .join('')

      const htmlBody = `
<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#080808;font-family:system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <tr><td style="background:#141414;border-radius:16px;padding:32px;border:1px solid rgba(255,255,255,0.05);">
      <div style="text-align:center;margin-bottom:24px;"><span style="font-size:22px;font-weight:800;color:#F3D840;">Renewably</span></div>
      <h2 style="color:#fff;font-size:18px;margin:0 0 16px;">New Onboarding Request</h2>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="color:rgba(255,255,255,0.50);padding:8px 0;font-size:13px;">Email</td><td style="padding:8px 0;font-size:14px;"><a href="mailto:${escapeHtml(normalizedEmail)}" style="color:#60A5FA;">${escapeHtml(normalizedEmail)}</a></td></tr>
        ${rows}
      </table>
    </td></tr>
  </table>
</body></html>`

      const textBody = `New Onboarding Request\n\nEmail: ${normalizedEmail}\n${summaryLines.join('\n')}`

      const notifyResult = await sendEmail({
        to: 'hello@renewably.ie',
        subject: `New Onboarding Request${companyName ? ` — ${companyName}` : ''}`,
        htmlBody,
        textBody,
        tag: 'onboarding-request-notification',
        metadata: { source: 'onboarding', contactEmail: normalizedEmail },
      })
      emailSent = notifyResult?.success === true
      if (!emailSent) {
        logger.warn('Onboarding notification email not delivered', { error: notifyResult?.error, email: normalizedEmail })
      }
    } catch (emailError) {
      logger.warn('Could not send onboarding notification email', {
        error: emailError instanceof Error ? emailError.message : String(emailError),
      })
    }

    // ── 3. Confirm to the sender ──────────────────────────────────────────
    try {
      const firstName = (contactName || 'there').split(' ')[0]
      const replyHtml = `
<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#080808;font-family:system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <tr><td style="background:#141414;border-radius:16px;padding:32px;border:1px solid rgba(255,255,255,0.05);">
      <div style="text-align:center;margin-bottom:24px;"><span style="font-size:22px;font-weight:800;color:#F3D840;">Renewably</span></div>
      <p style="color:rgba(255,255,255,0.85);font-size:15px;line-height:1.6;margin:0 0 16px;">Hi ${escapeHtml(firstName)},</p>
      <p style="color:rgba(255,255,255,0.85);font-size:15px;line-height:1.6;margin:0 0 16px;">Thanks for your details. We've got everything we need to get started, and one of our team will be in touch to walk you through setup and answer any questions.</p>
      <p style="color:rgba(255,255,255,0.70);font-size:14px;line-height:1.6;margin:0;">If anything's urgent, reach us at <a href="mailto:hello@renewably.ie" style="color:#F3D840;">hello@renewably.ie</a>.</p>
      <p style="color:rgba(255,255,255,0.50);font-size:13px;margin:24px 0 0;">Best regards,<br>The Renewably Team</p>
    </td></tr>
  </table>
</body></html>`
      const replyText = `Hi ${firstName},\n\nThanks for your details. We've got everything we need to get started, and one of our team will be in touch to walk you through setup.\n\nIf anything's urgent, reach us at hello@renewably.ie.\n\nBest regards,\nThe Renewably Team`

      await sendEmail({
        to: normalizedEmail,
        subject: 'Thanks — we\'ll be in touch (Renewably)',
        htmlBody: replyHtml,
        textBody: replyText,
        tag: 'onboarding-request-auto-reply',
        metadata: { source: 'onboarding' },
      })
    } catch (replyError) {
      logger.warn('Could not send onboarding auto-reply', {
        error: replyError instanceof Error ? replyError.message : String(replyError),
      })
    }

    // ── 4. Honest result ──────────────────────────────────────────────────
    if (!leadSaved && !emailSent) {
      logger.error('Both CRM save and notification failed for onboarding request', { email: normalizedEmail })
      return NextResponse.json(
        { success: false, error: 'Sorry, something went wrong. Please email hello@renewably.ie directly.' },
        { status: 503 }
      )
    }

    logger.info('Onboarding request received', {
      email: normalizedEmail,
      company: companyName || 'N/A',
      savedToDb: leadSaved,
      notificationSent: emailSent,
      postmarkConfigured: isPostmarkConfigured(),
    })

    return NextResponse.json({
      success: true,
      message: 'Thanks — we\'ve got your details. The team will be in touch to get you set up.',
    })
  } catch (error) {
    logger.error('Onboarding submission error', {
      error: error instanceof Error ? error.message : String(error),
    })
    return NextResponse.json(
      { error: 'Internal server error. Please try again.' },
      { status: 500 }
    )
  }
}
