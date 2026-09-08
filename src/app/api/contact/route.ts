// ============================================================================
// RENEWABLY.IE — PUBLIC CONTACT FORM API
// ============================================================================
// POST /api/contact
//
// Accepts form submissions from the public contact page,
// saves them to Supabase, and sends email notifications via Postmark.
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { sendEmail, isPostmarkConfigured, getFromEmail } from "@/lib/postmark";
import { logger } from "@/lib/logger";
import { sanitizeSearchQuery, escapeHtml } from "@/lib/crm-validation";
import { validateCsrfOrigin } from "@/lib/crm-route-helpers";

// ============================================================================
// TYPES
// ============================================================================

interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  jobsPerMonth?: string;
  message: string;
  source?: string;
  qualification?: Record<string, string>;
}

// ============================================================================
// RATE LIMITING (in-memory)
// ============================================================================

const contactRateLimits = new Map<string, { count: number; expiresAt: number }>();

if (typeof globalThis !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of contactRateLimits) {
      if (entry.expiresAt <= now) contactRateLimits.delete(key);
    }
  }, 60_000).unref();
}

function checkContactRateLimit(ip: string): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const entry = contactRateLimits.get(ip);
  if (!entry || now > entry.expiresAt) {
    contactRateLimits.set(ip, { count: 1, expiresAt: now + 15 * 60 * 1000 }); // 15 min window
    return { allowed: true, retryAfterMs: 0 };
  }
  entry.count++;
  if (entry.count >= 5) {
    return { allowed: false, retryAfterMs: entry.expiresAt - now };
  }
  return { allowed: true, retryAfterMs: 0 };
}

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}

// ============================================================================
// POST HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    if (!validateCsrfOrigin(request)) {
      return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
    }

    // Rate limiting: max 5 submissions per 15 minutes per IP
    const clientIp = getClientIp(request);
    const { allowed, retryAfterMs } = checkContactRateLimit(clientIp);
    if (!allowed) {
      const retryAfterSec = Math.ceil(retryAfterMs / 1000);
      return NextResponse.json(
        { error: `Too many submissions. Please try again in ${retryAfterSec} seconds.` },
        { status: 429, headers: { "Retry-After": String(retryAfterSec) } }
      );
    }

    const body: ContactFormData = await request.json();

    // Validate required fields
    const { firstName, lastName, email, message } = body;

    if (!firstName?.trim() || firstName.trim().length > 100) {
      return NextResponse.json({ error: "First name is required (max 100 characters)" }, { status: 400 });
    }
    if (!lastName?.trim() || lastName.trim().length > 100) {
      return NextResponse.json({ error: "Last name is required (max 100 characters)" }, { status: 400 });
    }
    if (!email?.trim() || !isValidEmail(email) || email.trim().length > 254) {
      return NextResponse.json({ error: "A valid email address is required" }, { status: 400 });
    }
    if (!message?.trim() || message.trim().length > 5000) {
      return NextResponse.json({ error: "Please include a message (max 5,000 characters)" }, { status: 400 });
    }

    const fullName = `${firstName.trim()} ${lastName.trim()}`;

    // Optional lead source + qualification answers (sent by the website popup).
    const source = typeof body.source === "string" ? body.source.trim().slice(0, 60) : "";
    const qualEntries: [string, string][] =
      body.qualification && typeof body.qualification === "object"
        ? Object.entries(body.qualification)
            .filter(([k, v]) => k && typeof v === "string" && v.trim())
            .slice(0, 8)
            .map(([k, v]) => [String(k).slice(0, 60), String(v).trim().slice(0, 200)])
        : [];
    const qualText = qualEntries.map(([k, v]) => `${k}: ${v}`).join("\n");

    // ── 1. Save to Supabase ───────────────────────────────────────────────
    let savedContact = false;
    let companyId: string | null = null;

    try {
      const supabase = createServiceClient();

      // Check if a company with this name already exists
      if (body.company?.trim()) {
        const { data: existingCompany } = await supabase
          .from("companies")
          .select("id")
          .ilike("name", sanitizeSearchQuery(body.company.trim()))
          .limit(1)
          .single();

        if (existingCompany) {
          companyId = existingCompany.id;
        } else {
          // Create a new company as prospect
          const { data: newCompany } = await supabase
            .from("companies")
            .insert({
              name: body.company.trim(),
              status: "prospect",
              counties: "",
              seai_reg: "",
              team_size: 1,
              installs_per_year: 0,
              notes: `Created from website contact form by ${fullName}`,
            })
            .select("id")
            .single();

          if (newCompany) {
            companyId = newCompany.id;
            // Create onboarding record
            try {
              await supabase.from("onboarding").insert({
                company_id: companyId,
                solarpilot_progress: 0,
                ai_workforce_progress: 0,
              });
            } catch {}
          }
        }
      }

      // Create contact record — Supabase returns { error } instead of throwing,
      // so we MUST inspect it; a rejected insert must never look saved.
      const { data: contact, error: contactError } = await supabase
        .from("contacts")
        .insert({
          company_id: companyId,
          name: fullName,
          email: email.trim(),
          phone: body.phone?.trim() || null,
          role: body.company?.trim() ? "Prospect" : null,
          is_decision_maker: true,
          notes: `Website enquiry: ${message.trim().slice(0, 200)}`,
        })
        .select("id")
        .single();

      if (contactError) {
        logger.error("Contact insert failed — lead not written to CRM", {
          error: contactError.message,
          name: fullName,
          email: email.trim(),
        });
      }

      // Create a deal in the pipeline (new_lead stage). This deal IS the
      // CRM-visible lead, so its success is what "captured" really means.
      const estimatedValue = estimateDealValue(body.jobsPerMonth?.trim());

      const { error: dealError } = await supabase.from("deals").insert({
        company_id: companyId,
        product: "solarpilot",
        mrr: Math.round(estimatedValue / 12),
        setup_fee: 0,
        stage: "new_lead",
        value: estimatedValue,
        notes: [
          `${source || "Website"} enquiry from ${fullName}`,
          qualText,
          message.trim() ? `Message: ${message.trim().slice(0, 300)}` : "",
        ]
          .filter(Boolean)
          .join("\n"),
      });

      if (dealError) {
        logger.error("Deal insert failed — lead did not reach the CRM pipeline", {
          error: dealError.message,
          name: fullName,
          email: email.trim(),
        });
      }

      // The lead is genuinely captured only if it landed in the CRM.
      savedContact = !contactError && !dealError && Boolean(contact);
      if (savedContact) {
        logger.info("Contact form saved to CRM", { name: fullName, email: email.trim(), companyId });
      }
    } catch (dbError) {
      logger.warn("Could not save contact to Supabase", {
        error: dbError instanceof Error ? dbError.message : String(dbError),
      });
    }

    // ── 2. Send notification email to cal@renewably.ie ──────────────────
    let emailSent = false;

    try {
      const subject = `New lead: ${fullName}${source ? ` (${source})` : ""}`;
      const row = (label: string, value: string) =>
        `<tr><td style="color:rgba(255,255,255,0.5);padding:8px 0;font-size:13px;width:32%;vertical-align:top;">${label}</td><td style="color:#fff;padding:8px 0;font-size:14px;">${value}</td></tr>`;
      const qualBlock = qualEntries.length
        ? `<tr><td style="padding:4px 28px 4px;">
             <p style="margin:14px 0 10px;color:rgba(255,255,255,0.45);font-size:11px;text-transform:uppercase;letter-spacing:0.06em;">What they need</p>
             <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:rgba(243,216,64,0.08);border:1px solid rgba(243,216,64,0.18);border-radius:12px;">
               <tr><td style="padding:8px 16px;">
                 <table width="100%" style="border-collapse:collapse;">
                   ${qualEntries
                     .map(
                       ([k, v]) =>
                         `<tr><td style="color:rgba(255,255,255,0.55);padding:7px 0;font-size:13px;width:44%;vertical-align:top;">${escapeHtml(k)}</td><td style="color:#fff;padding:7px 0;font-size:14px;font-weight:600;">${escapeHtml(v)}</td></tr>`
                     )
                     .join("")}
                 </table>
               </td></tr>
             </table>
           </td></tr>`
        : "";
      const htmlBody = `
<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0A0A0A;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0A0A0A;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#141414;border-radius:18px;overflow:hidden;border:1px solid rgba(255,255,255,0.06);">
        <tr><td style="background:#F3D840;padding:18px 28px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
            <td style="font-size:18px;font-weight:800;color:#0A0A0A;">Renewably</td>
            <td align="right" style="font-size:11px;font-weight:700;color:#0A0A0A;opacity:0.65;text-transform:uppercase;letter-spacing:0.06em;">New lead</td>
          </tr></table>
        </td></tr>
        <tr><td style="padding:26px 28px 6px;">
          <h1 style="margin:0;color:#fff;font-size:22px;font-weight:800;">${escapeHtml(fullName)}</h1>
          ${source ? `<p style="margin:6px 0 0;color:#F3D840;font-size:13px;font-weight:600;">via ${escapeHtml(source)}</p>` : ""}
        </td></tr>
        <tr><td style="padding:10px 28px 4px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
            ${row("Email", `<a href="mailto:${escapeHtml(email.trim())}" style="color:#F3D840;text-decoration:none;">${escapeHtml(email.trim())}</a>`)}
            ${body.phone?.trim() ? row("Phone", `<a href="tel:${escapeHtml(body.phone.trim())}" style="color:#fff;text-decoration:none;">${escapeHtml(body.phone.trim())}</a>`) : ""}
            ${body.company?.trim() ? row("Company", escapeHtml(body.company.trim())) : ""}
          </table>
        </td></tr>
        ${qualBlock}
        ${message.trim() ? `<tr><td style="padding:16px 28px 4px;">
          <p style="margin:0 0 8px;color:rgba(255,255,255,0.45);font-size:11px;text-transform:uppercase;letter-spacing:0.06em;">Message</p>
          <p style="margin:0;color:rgba(255,255,255,0.85);font-size:14px;line-height:1.6;">${escapeHtml(message.trim())}</p>
        </td></tr>` : ""}
        <tr><td style="padding:22px 28px 28px;">
          <a href="mailto:${escapeHtml(email.trim())}" style="display:inline-block;background:#F3D840;color:#0A0A0A;font-weight:700;font-size:14px;text-decoration:none;padding:12px 26px;border-radius:9999px;">Reply to ${escapeHtml(firstName.trim())}</a>
        </td></tr>
      </table>
      <p style="max-width:560px;margin:14px auto 0;color:rgba(255,255,255,0.25);font-size:11px;text-align:center;">Renewably lead notification &bull; renewably.ie</p>
    </td></tr>
  </table>
</body></html>`;

      const textBody = [
        `New lead: ${fullName}`,
        source ? `Via: ${source}` : "",
        `Email: ${email.trim()}`,
        body.phone?.trim() ? `Phone: ${body.phone.trim()}` : "",
        body.company?.trim() ? `Company: ${body.company.trim()}` : "",
        qualText ? `\nWhat they need:\n${qualText}` : "",
        message.trim() ? `\nMessage:\n${message.trim()}` : "",
      ]
        .filter(Boolean)
        .join("\n");

      // sendEmail resolves on failure (returns { success:false }) instead of
      // throwing, so read the result — do not assume the send worked.
      const notifyResult = await sendEmail({
        to: "cal@renewably.ie",
        subject,
        htmlBody,
        textBody,
        tag: "contact-form-notification",
        metadata: { source: "website", contactName: fullName, contactEmail: email.trim() },
      });
      emailSent = notifyResult?.success === true;
      if (!emailSent) {
        logger.warn("Contact notification email not delivered", {
          error: notifyResult?.error,
          email: email.trim(),
        });
      }
    } catch (emailError) {
      logger.warn("Could not send contact notification email", {
        error: emailError instanceof Error ? emailError.message : String(emailError),
      });
    }

    // ── 3. Send auto-reply to the submitter ───────────────────────────────
    let autoReplySent = false;

    try {
      const replySubject = "Thanks for reaching out to Renewably";
      const replyHtml = `
<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#080808;font-family:system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <tr>
      <td style="background:#141414;border-radius:16px;padding:32px;border:1px solid rgba(255,255,255,0.05);">
        <div style="text-align:center;margin-bottom:24px;">
          <span style="font-size:22px;font-weight:800;color:#F3D840;">Renewably</span>
        </div>
        <p style="color:rgba(255,255,255,0.85);font-size:15px;line-height:1.6;margin:0 0 16px;">
          Hi ${escapeHtml(firstName.trim())},
        </p>
        <p style="color:rgba(255,255,255,0.85);font-size:15px;line-height:1.6;margin:0 0 16px;">
          Thanks for getting in touch with Renewably. We've received your message and one of our team will be in touch within 24 hours.
        </p>
        <p style="color:rgba(255,255,255,0.70);font-size:14px;line-height:1.6;margin:0;">
          If your enquiry is urgent, you can reach us directly at <a href="mailto:cal@renewably.ie" style="color:#F3D840;">cal@renewably.ie</a>.
        </p>
        <p style="color:rgba(255,255,255,0.50);font-size:13px;margin:24px 0 0;">
          Best regards,<br>The Renewably Team
        </p>
      </td>
    </tr>
    <tr>
      <td style="text-align:center;padding:20px 0 0;color:rgba(255,255,255,0.25);font-size:11px;">
        Renewably &bull; Powering Ireland's Solar Future<br>
        <a href="https://renewably.ie" style="color:#F3D840;text-decoration:none;">renewably.ie</a>
      </td>
    </tr>
  </table>
</body></html>`;

      const replyText = `Hi ${firstName.trim()},\n\nThanks for getting in touch with Renewably. We've received your message and one of our team will be in touch within 24 hours.\n\nIf your enquiry is urgent, you can reach us directly at cal@renewably.ie.\n\nBest regards,\nThe Renewably Team`;

      await sendEmail({
        to: email.trim(),
        subject: replySubject,
        htmlBody: replyHtml,
        textBody: replyText,
        tag: "contact-form-auto-reply",
        metadata: { source: "website" },
      });
      autoReplySent = true;
    } catch (replyError) {
      logger.warn("Could not send auto-reply email", {
        error: replyError instanceof Error ? replyError.message : String(replyError),
      });
    }

    // ── 4. Return success ─────────────────────────────────────────────────
    if (!savedContact && !emailSent) {
      logger.error("Both database save and email notification failed for contact form");
      return NextResponse.json(
        { success: false, message: "Sorry, something went wrong. Please email cal@renewably.ie directly." },
        { status: 503 }
      );
    }

    logger.info("Contact form submission received", {
      name: fullName,
      email: email.trim(),
      company: body.company?.trim() || "N/A",
      savedToDb: savedContact,
      notificationSent: emailSent,
      autoReplySent,
      postmarkConfigured: isPostmarkConfigured(),
    });

    return NextResponse.json({
      success: true,
      message: "Thank you! We'll be in touch within 24 hours.",
    });
  } catch (error) {
    logger.error("Contact form unhandled error", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again or email cal@renewably.ie directly." },
      { status: 500 }
    );
  }
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

function estimateDealValue(jobsPerMonth?: string): number {
  if (!jobsPerMonth) return 15000;
  const range = jobsPerMonth.toLowerCase();
  if (range.includes("50+")) return 24000;
  if (range.includes("20-50")) return 18000;
  if (range.includes("10-20")) return 15000;
  if (range.includes("5-10")) return 12000;
  return 12000;
}
