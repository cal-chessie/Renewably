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
    const body: ContactFormData = await request.json();

    // ------------------------------------------------------------------
    // 1. Validate required fields
    // ------------------------------------------------------------------
    const { firstName, lastName, email, message } = body;

    if (!firstName?.trim()) {
      return NextResponse.json(
        { error: "First name is required" },
        { status: 400 }
      );
    }

    if (!lastName?.trim()) {
      return NextResponse.json(
        { error: "Last name is required" },
        { status: 400 }
      );
    }

    if (!email?.trim() || !isValidEmail(email)) {
      return NextResponse.json(
        { error: "A valid email address is required" },
        { status: 400 }
      );
    }

    if (!message?.trim()) {
      return NextResponse.json(
        { error: "Please include a message" },
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
      // Create the contact record in the CRM
      await db.contact.create({
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

      savedContact = true;
    } catch (dbError) {
      console.warn(
        "[Contact API] Could not save contact to database:",
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
