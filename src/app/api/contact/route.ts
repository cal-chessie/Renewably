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
          .ilike("name", body.company.trim())
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

      // Create contact record
      const { data: contact } = await supabase
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

      // Create a deal in the pipeline (new_lead stage)
      const estimatedValue = estimateDealValue(body.jobsPerMonth?.trim());

      await supabase.from("deals").insert({
        company_id: companyId,
        product: "solarpilot",
        mrr: Math.round(estimatedValue / 12),
        setup_fee: 0,
        stage: "new_lead",
        value: estimatedValue,
        notes: `Website enquiry from ${fullName} — ${message.trim().slice(0, 300)}`,
      });

      savedContact = true;
      logger.info("Contact form saved to Supabase", { name: fullName, email: email.trim(), companyId });
    } catch (dbError) {
      logger.warn("Could not save contact to Supabase", {
        error: dbError instanceof Error ? dbError.message : String(dbError),
      });
    }

    // ── 2. Send notification email to hello@renewably.ie ──────────────────
    let emailSent = false;

    try {
      const subject = `New Enquiry from ${fullName}`;
      const htmlBody = `
<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#080808;font-family:system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <tr>
      <td style="background:#141414;border-radius:16px;padding:32px;border:1px solid rgba(255,255,255,0.05);">
        <div style="text-align:center;margin-bottom:24px;">
          <span style="font-size:22px;font-weight:800;color:#F3D840;">Renewably</span>
        </div>
        <h2 style="color:#fff;font-size:18px;margin:0 0 16px;">New Website Enquiry</h2>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="color:rgba(255,255,255,0.50);padding:8px 0;font-size:13px;">Name</td><td style="color:#fff;padding:8px 0;font-size:14px;">${fullName}</td></tr>
          <tr><td style="color:rgba(255,255,255,0.50);padding:8px 0;font-size:13px;">Email</td><td style="color:#60A5FA;padding:8px 0;font-size:14px;"><a href="mailto:${email.trim()}" style="color:#60A5FA;">${email.trim()}</a></td></tr>
          ${body.phone?.trim() ? `<tr><td style="color:rgba(255,255,255,0.50);padding:8px 0;font-size:13px;">Phone</td><td style="color:#fff;padding:8px 0;font-size:14px;">${body.phone.trim()}</td></tr>` : ""}
          ${body.company?.trim() ? `<tr><td style="color:rgba(255,255,255,0.50);padding:8px 0;font-size:13px;">Company</td><td style="color:#fff;padding:8px 0;font-size:14px;">${body.company.trim()}</td></tr>` : ""}
          ${body.jobsPerMonth?.trim() ? `<tr><td style="color:rgba(255,255,255,0.50);padding:8px 0;font-size:13px;">Installs/month</td><td style="color:#fff;padding:8px 0;font-size:14px;">${body.jobsPerMonth.trim()}</td></tr>` : ""}
        </table>
        <div style="margin-top:16px;padding:16px;background:rgba(255,255,255,0.03);border-radius:8px;">
          <p style="color:rgba(255,255,255,0.50);font-size:11px;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 8px;">Message</p>
          <p style="color:rgba(255,255,255,0.85);font-size:14px;line-height:1.6;margin:0;">${message.trim()}</p>
        </div>
      </td>
    </tr>
  </table>
</body></html>`;

      const textBody = `New Enquiry from ${fullName}\n\nEmail: ${email.trim()}\n${body.phone?.trim() ? `Phone: ${body.phone.trim()}\n` : ""}${body.company?.trim() ? `Company: ${body.company.trim()}\n` : ""}${body.jobsPerMonth?.trim() ? `Installs/month: ${body.jobsPerMonth.trim()}\n` : ""}\nMessage:\n${message.trim()}`;

      await sendEmail({
        to: "hello@renewably.ie",
        subject,
        htmlBody,
        textBody,
        tag: "contact-form-notification",
        metadata: { source: "website", contactName: fullName, contactEmail: email.trim() },
      });
      emailSent = true;
    } catch (emailError) {
      logger.warn("Could not send contact notification email", {
        error: emailError instanceof Error ? emailError.message : String(emailError),
      });
    }

    // ── 3. Send auto-reply to the submitter ───────────────────────────────
    let autoReplySent = false;

    try {
      const replySubject = "Thanks for reaching out — Renewably";
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
          Hi ${firstName.trim()},
        </p>
        <p style="color:rgba(255,255,255,0.85);font-size:15px;line-height:1.6;margin:0 0 16px;">
          Thanks for getting in touch with Renewably. We've received your message and one of our team will be in touch within 24 hours.
        </p>
        <p style="color:rgba(255,255,255,0.70);font-size:14px;line-height:1.6;margin:0;">
          If your enquiry is urgent, you can reach us directly at <a href="mailto:hello@renewably.ie" style="color:#F3D840;">hello@renewably.ie</a>.
        </p>
        <p style="color:rgba(255,255,255,0.50);font-size:13px;margin:24px 0 0;">
          Best regards,<br>The Renewably Team
        </p>
      </td>
    </tr>
    <tr>
      <td style="text-align:center;padding:20px 0 0;color:rgba(255,255,255,0.25);font-size:11px;">
        Renewably &mdash; Powering Ireland's Solar Future<br>
        <a href="https://renewably.ie" style="color:#F3D840;text-decoration:none;">renewably.ie</a>
      </td>
    </tr>
  </table>
</body></html>`;

      const replyText = `Hi ${firstName.trim()},\n\nThanks for getting in touch with Renewably. We've received your message and one of our team will be in touch within 24 hours.\n\nIf your enquiry is urgent, you can reach us directly at hello@renewably.ie.\n\nBest regards,\nThe Renewably Team`;

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
        { success: false, message: "Sorry, something went wrong. Please email hello@renewably.ie directly." },
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
      { error: "An unexpected error occurred. Please try again or email hello@renewably.ie directly." },
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
