import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { requireAuth, unauthorized } from '@/lib/crm-auth'
import { checkApiRateLimit, getClientIp, isValidUuid } from '@/lib/crm-validation'
import { sendEmail, isPostmarkConfigured } from '@/lib/postmark'
import { logger } from '@/lib/logger'

// GET: List email logs for a company or contact
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')
    const contactId = searchParams.get('contactId')
    const dealId = searchParams.get('dealId')
    const limit = parseInt(searchParams.get('limit') || '20')

    const supabase = createServiceClient()

    let query = supabase
      .from('email_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(Math.min(limit, 100))

    if (companyId && isValidUuid(companyId)) {
      query = query.eq('company_id', companyId)
    } else if (contactId && isValidUuid(contactId)) {
      query = query.eq('contact_id', contactId)
    } else if (dealId && isValidUuid(dealId)) {
      query = query.eq('deal_id', dealId)
    }

    const { data: logs, error } = await query

    if (error) {
      logger.error('Email logs query failed', { error: error.message })
      return NextResponse.json({ error: 'Failed to fetch email logs' }, { status: 500 })
    }

    return NextResponse.json({ emailLogs: logs ?? [] })
  } catch (error) {
    logger.error('Email logs error', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: Send email (logs to Supabase always, sends via Postmark if configured)
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    if (!user) return unauthorized()

    const ip = getClientIp(request)
    const rateCheck = checkApiRateLimit(`email:${ip}`, { maxAttempts: 10, windowMs: 60_000 })
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Try again later.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rateCheck.retryAfterMs / 1000)) } }
      )
    }

    const body = await request.json()
    const { to, subject, body: emailBody, contactId, companyId, dealId, tag } = body

    if (contactId && !isValidUuid(contactId)) {
      return NextResponse.json({ error: 'Invalid contactId format' }, { status: 400 })
    }

    if (!to || !subject || !emailBody) {
      return NextResponse.json(
        { error: 'To, subject, and body are required' },
        { status: 400 }
      )
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(to)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    // Send via Postmark (or log-only if not configured)
    const result = await sendEmail({
      to,
      subject,
      htmlBody: emailBody,
      textBody: emailBody.replace(/<[^>]*>/g, ''), // Strip HTML for text version
      tag: tag || 'manual-email',
      contactId: contactId || undefined,
      companyId: companyId || undefined,
      dealId: dealId || undefined,
      userId: user.id,
    })

    // Log activity in deal_activities if dealId provided
    if (dealId && isValidUuid(dealId)) {
      const supabase = createServiceClient()
      await supabase.from('deal_activities').insert({
        deal_id: dealId,
        user_id: user.id,
        type: 'email',
        title: `${subject} → ${to}`,
        content: emailBody.substring(0, 500),
      }).catch(() => {
        // Non-fatal: email was already sent/logged
      })
    }

    return NextResponse.json({
      success: result.success || result.logged,
      messageId: result.messageId,
      logged: result.logged,
      postmarkConfigured: isPostmarkConfigured(),
      status: result.success ? 'sent' : result.logged ? 'logged_only' : 'failed',
      error: result.error,
    })
  } catch (error) {
    logger.error('Email send error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
