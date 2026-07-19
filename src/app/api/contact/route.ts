// ============================================================================
// RENEWABLY.IE — PUBLIC CONTACT FORM API
// ============================================================================
// POST /api/contact
//
// Accepts form submissions from the public contact page,
// saves them to the database, and sends email notifications via Postmark.
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  sendContactNotification,
  sendWelcomeEmail,
} from "@/lib/postmark";
import { checkRateLimit, getClientIp, CONTACT_RATE_LIMIT } from "@/lib/rate-limit";

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
// POST HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: max 5 submissions per 15 minutes per IP
    const clientIp = getClientIp(request);
    const { allowed, retryAfterMs } = await checkRateLimit(clientIp, CONTACT_RATE_LIMIT);
    if (!allowed) {
      const retryAfterSec = Math.ceil(retryAfterMs / 1000);
      return NextResponse.json(
        { error: `Too many submissions. Please try again in ${retryAfterSec} seconds.` },
        {
          status: 429,
          headers: { "Retry-After": String(retryAfterSec) },
        }
      );
    }

    const body: ContactFormData = await request.json();

    // ------------------------------------------------------------------
    // 1. Validate required fields
    // ------------------------------------------------------------------
    const { firstName, lastName, email, message } = body;

    if (!firstName?.trim() || firstName.trim().length > 100) {
      return NextResponse.json(
        { error: "First name is required (max 100 characters)" },
        { status: 400 }
      );
    }

    if (!lastName?.trim() || lastName.trim().length > 100) {
      return NextResponse.json(
        { error: "Last name is required (max 100 characters)" },
        { status: 400 }
      );
    }

    if (!email?.trim() || !isValidEmail(email) || email.trim().length > 254) {
      return NextResponse.json(
        { error: "A valid email address is required" },
        { status: 400 }
      );
    }

    if (!message?.trim() || message.trim().length > 5000) {
      return NextResponse.json(
        { error: "Please include a message (max 5,000 characters)" },
        { status: 400 }
      );
    }

    // ------------------------------------------------------------------
    // 2. Save to database
    // ------------------------------------------------------------------
    const fullName = `${firstName.trim()} ${lastName.trim()}`;

    // Attempt to create a contact and contact submission.
    // If the Prisma DB is unavailable, fall back to logging.
    let savedContact = false;

    try {
      // Ensure the "Lead" pipeline stage exists
      const leadStage = await db.pipelineStage.upsert({
        where: { name: "Lead" },
        update: {},
        create: { name: "Lead", order: 1, color: "#9CA3AF", isDefault: true },
      });

      // Create the contact record in the CRM
      const contact = await db.contact.create({
        data: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          phone: body.phone?.trim() || null,
          company: body.company?.trim() || null,
          source: "website",
          status: "lead",
          description: message.trim(),
        },
      });

      // Create a Deal in the pipeline so this lead shows up in the CRM pipeline view
      // Estimate monthly value based on installs per month (avg €1,250/mo subscription)
      const estimatedMonthlyValue = estimateDealValue(body.jobsPerMonth?.trim());

      await db.deal.create({
        data: {
          title: `${fullName} — Website Enquiry`,
          description: message.trim(),
          value: estimatedMonthlyValue,
          currency: "EUR",
          probability: 30,
          stageId: leadStage.id,
          contactId: contact.id,
          closeDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        },
      });

      // Log the activity
      await db.activity.create({
        data: {
          type: "note",
          title: "New website enquiry",
          description: `Contact form submission from ${fullName} (${email.trim()}).${body.company?.trim() ? ` Company: ${body.company.trim()}.` : ""}${body.jobsPerMonth?.trim() ? ` Installs/month: ${body.jobsPerMonth.trim()}.` : ""}`,
          contactId: contact.id,
        },
      });

      savedContact = true;

      // Emit LeadCreated into the kernel (refs only — id, no PII). Queued in
      // the local outbox; delivered by the flush cron. Never blocks the user.
      if (contact?.id) {
        const { queueKernelEvent } = await import('@/lib/kernel-bridge');
        await queueKernelEvent('LeadCreated', {
          contact_id: contact.id,
          brand: 'renewably',
          source: 'website_contact',
          has_company: !!body.company?.trim(),
        });
      }
    } catch (dbError) {
      // ERROR, not warn — a lead that reaches the inbox but not the CRM is a
      // lead the pipeline can't see. Audit finding #2 (2026-07-15).
      console.error(
        "[Contact API] DB SAVE FAILED — lead exists only in email:",
        dbError instanceof Error ? dbError.message : dbError
      );
    }

    // ------------------------------------------------------------------
    // 3. Send notification email to hello@renewably.ie
    // ------------------------------------------------------------------
    let emailSent = false;

    try {
      await sendContactNotification({
        name: fullName,
        email: email.trim(),
        phone: body.phone?.trim() || undefined,
        company: body.company?.trim() || undefined,
        message: message.trim(),
        source: "website",
        jobsPerMonth: body.jobsPerMonth?.trim() || undefined,
      });
      emailSent = true;
    } catch (emailError) {
      console.warn(
        "[Contact API] Could not send notification email:",
        emailError instanceof Error ? emailError.message : emailError
      );
    }

    // ------------------------------------------------------------------
    // 4. Send auto-reply to the submitter
    // ------------------------------------------------------------------
    let autoReplySent = false;

    try {
      await sendWelcomeEmail(fullName, email.trim());
      autoReplySent = true;
    } catch (replyError) {
      console.warn(
        "[Contact API] Could not send auto-reply email:",
        replyError instanceof Error ? replyError.message : replyError
      );
    }

    // ------------------------------------------------------------------
    // 5. Return success response
    // ------------------------------------------------------------------
    // Even if DB or email fails, we still return 200 to the user.
    // The form submission was received — we just log any failures.

    if (!savedContact && !emailSent) {
      console.error(
        "[Contact API] Both database save and email notification failed."
      );
      return NextResponse.json(
        {
          success: false,
          message:
            "Sorry, something went wrong on our end. Please email hello@renewably.ie directly.",
        },
        { status: 503 }
      );
    }

    console.log("[Contact API] Form submission received:", {
      name: fullName,
      email: email.trim(),
      company: body.company?.trim() || "N/A",
      savedToDb: savedContact,
      notificationSent: emailSent,
      autoReplySent: autoReplySent,
    });

    return NextResponse.json({
      success: true,
      message: "Thank you! We'll be in touch within 24 hours.",
    });
  } catch (error) {
    console.error("[Contact API] Unhandled error:", error);
    return NextResponse.json(
      {
        error:
          "An unexpected error occurred. Please try again or email hello@renewably.ie directly.",
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/** Basic email format validation */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Estimate annual deal value based on installs per month.
 * Uses the Renewably pricing model: €1,000-€1,500/mo subscription.
 * We estimate annual contract value for pipeline tracking.
 */
function estimateDealValue(jobsPerMonth?: string): number {
  if (!jobsPerMonth) return 15000; // Default €15k annual estimate

  const range = jobsPerMonth.toLowerCase();
  // Estimate based on volume — larger installers may go for higher plans
  if (range.includes("50+")) return 24000; // Enterprise: €2,000/mo x 12
  if (range.includes("20-50")) return 18000; // Pro: €1,500/mo x 12
  if (range.includes("10-20")) return 15000; // Standard: €1,250/mo x 12
  if (range.includes("5-10")) return 12000; // Starter: €1,000/mo x 12
  return 12000; // Default to starter
}
