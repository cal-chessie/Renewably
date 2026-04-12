// ============================================================================
// RENEWABLY.IE — POSTMARK EMAIL INTEGRATION
// ============================================================================
// Send transactional emails via the Postmark API.
// All emails use hello@renewably.ie as the sender.
// Uses the native fetch API (no third-party SDK required).
// ============================================================================

/** Postmark API base URL */
const POSTMARK_API_URL = "https://api.postmarkapp.com/email";

// ============================================================================
// TYPES
// ============================================================================

/** Recipient with optional name */
export interface EmailRecipient {
  email: string;
  name?: string;
}

/** Core email message payload */
export interface EmailMessage {
  From: string;
  To: string;
  Cc?: string;
  Bcc?: string;
  ReplyTo?: string;
  Subject: string;
  HtmlBody?: string;
  TextBody?: string;
  Tag?: string;
  TrackOpens?: boolean;
  TrackLinks?: "None" | "HtmlOnly" | "All";
  Headers?: Array<{ Name: string; Value: string }>;
  Attachments?: Array<{
    Name: string;
    Content: string;
    ContentType: string;
    ContentId?: string;
  }>;
}

/** Postmark template email payload */
export interface TemplateMessage {
  From: string;
  To: string;
  TemplateId: number;
  TemplateModel: Record<string, unknown>;
  Cc?: string;
  Bcc?: string;
  ReplyTo?: string;
  Tag?: string;
  TrackOpens?: boolean;
  TrackLinks?: "None" | "HtmlOnly" | "All";
  Headers?: Array<{ Name: string; Value: string }>;
}

/** Response from Postmark API */
export interface PostmarkResponse {
  ErrorCode: number;
  Message: string;
  MessageID: string;
  SubmittedAt: string;
  To: string;
}

/** Options for sendEmail */
export interface SendEmailOptions {
  to: string | EmailRecipient;
  cc?: string | EmailRecipient;
  bcc?: string | EmailRecipient;
  replyTo?: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
  tag?: string;
  trackOpens?: boolean;
  trackLinks?: "None" | "HtmlOnly" | "All";
}

/** Options for sendTemplate */
export interface SendTemplateOptions {
  to: string | EmailRecipient;
  cc?: string | EmailRecipient;
  bcc?: string | EmailRecipient;
  replyTo?: string;
  templateId: number;
  templateModel: Record<string, unknown>;
  tag?: string;
  trackOpens?: boolean;
}

/** Contact notification data */
export interface ContactNotificationData {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  message: string;
  source?: string;
  jobsPerMonth?: string;
}

/** Proposal email data */
export interface ProposalEmailData {
  proposalTitle: string;
  contactName: string;
  contactEmail: string;
  companyName?: string;
  totalAmount: number;
  validUntil?: string;
  proposalLink?: string;
}

/** Invoice email data */
export interface InvoiceEmailData {
  invoiceNumber: string;
  contactName: string;
  contactEmail: string;
  companyName?: string;
  totalAmount: number;
  dueDate?: string;
  invoiceLink?: string;
}

// ============================================================================
// HELPERS
// ============================================================================

/** Format a recipient into "Name <email>" or just "email" string */
function formatRecipient(recipient: string | EmailRecipient): string {
  if (typeof recipient === "string") return recipient;
  if (recipient.name) return `${recipient.name} <${recipient.email}>`;
  return recipient.email;
}

/** Format a monetary value in EUR (€) */
function formatEur(amount: number): string {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Get the Postmark server token from environment */
function getServerToken(): string {
  const token = process.env.POSTMARK_SERVER_TOKEN;
  if (!token) {
    console.warn("[Postmark] POSTMARK_SERVER_TOKEN is not set. Emails will not be sent.");
  }
  return token || "";
}

/** Get the from email address */
function getFromEmail(): string {
  return process.env.FROM_EMAIL || "hello@renewably.ie";
}

/** Make a request to the Postmark API */
async function postmarkRequest(
  endpoint: string,
  body: Record<string, unknown>
): Promise<PostmarkResponse> {
  const token = getServerToken();

  if (!token) {
    console.warn("[Postmark] Skipping request — no server token configured.");
    return {
      ErrorCode: 0,
      Message: "Skipped — POSTMARK_SERVER_TOKEN not configured",
      MessageID: "skipped-" + Date.now(),
      SubmittedAt: new Date().toISOString(),
      To: String(body.To || ""),
    };
  }

  try {
    const response = await fetch(`${POSTMARK_API_URL}${endpoint}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Postmark-Server-Token": token,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("[Postmark] API error:", {
        status: response.status,
        errorCode: data.ErrorCode,
        message: data.Message,
      });
      throw new Error(`Postmark API error: ${data.Message} (code: ${data.ErrorCode})`);
    }

    console.log("[Postmark] Email sent successfully:", {
      messageId: data.MessageID,
      to: body.To,
      tag: body.Tag,
    });

    return data as PostmarkResponse;
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Postmark API error")) {
      throw error;
    }
    console.error("[Postmark] Request failed:", error);
    throw new Error(`Failed to send email via Postmark: ${(error as Error).message}`);
  }
}

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/**
 * Send a raw email via Postmark.
 *
 * @example
 * ```ts
 * await sendEmail({
 *   to: "john@example.com",
 *   subject: "Welcome to Renewably",
 *   htmlBody: "<h1>Welcome!</h1><p>Thanks for signing up.</p>",
 *   tag: "welcome",
 * });
 * ```
 */
export async function sendEmail(options: SendEmailOptions): Promise<PostmarkResponse> {
  const message: EmailMessage = {
    From: getFromEmail(),
    To: formatRecipient(options.to),
    Subject: options.subject,
    HtmlBody: options.htmlBody,
    TextBody: options.textBody,
    Cc: options.cc ? formatRecipient(options.cc) : undefined,
    Bcc: options.bcc ? formatRecipient(options.bcc) : undefined,
    ReplyTo: options.replyTo,
    Tag: options.tag,
    TrackOpens: options.trackOpens ?? true,
    TrackLinks: options.trackLinks ?? "HtmlOnly",
  };

  return postmarkRequest("/withTemplate", message as unknown as Record<string, unknown>);
}

/**
 * Send a Postmark template email.
 * Requires a template created in the Postmark UI.
 *
 * @example
 * ```ts
 * await sendTemplate({
 *   to: "john@example.com",
 *   templateId: 1234567,
 *   templateModel: { name: "John", action_url: "https://..." },
 *   tag: "onboarding",
 * });
 * ```
 */
export async function sendTemplate(
  options: SendTemplateOptions
): Promise<PostmarkResponse> {
  const message: TemplateMessage = {
    From: getFromEmail(),
    To: formatRecipient(options.to),
    TemplateId: options.templateId,
    TemplateModel: options.templateModel,
    Cc: options.cc ? formatRecipient(options.cc) : undefined,
    Bcc: options.bcc ? formatRecipient(options.bcc) : undefined,
    ReplyTo: options.replyTo,
    Tag: options.tag,
    TrackOpens: options.trackOpens ?? true,
  };

  return postmarkRequest("/send", message as unknown as Record<string, unknown>);
}

// ============================================================================
// SPECIALISED FUNCTIONS
// ============================================================================

/**
 * Send a notification email to hello@renewably.ie when someone submits
 * the contact form on the website.
 */
export async function sendContactNotification(
  data: ContactNotificationData
): Promise<PostmarkResponse> {
  const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1A1A1A; background: #f9fafb; padding: 40px 20px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <!-- Header -->
    <tr>
      <td style="background: #0A0A0A; padding: 32px 40px;">
        <h1 style="margin: 0; color: #F3D840; font-size: 24px; font-weight: 800;">Renewably</h1>
      </td>
    </tr>
    <!-- Content -->
    <tr>
      <td style="padding: 40px;">
        <h2 style="margin: 0 0 8px; font-size: 20px; font-weight: 700; color: #1A1A1A;">New Contact Enquiry</h2>
        <p style="margin: 0 0 24px; color: #6b7280; font-size: 14px;">Someone has submitted the contact form on renewably.ie</p>

        <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
          <tr>
            <td style="padding: 14px 20px; background: #f9fafb; font-weight: 600; font-size: 13px; color: #374151; border-bottom: 1px solid #e5e7eb; width: 140px;">Name</td>
            <td style="padding: 14px 20px; font-size: 14px; color: #1A1A1A; border-bottom: 1px solid #e5e7eb;">${escapeHtml(data.name)}</td>
          </tr>
          <tr>
            <td style="padding: 14px 20px; background: #f9fafb; font-weight: 600; font-size: 13px; color: #374151; border-bottom: 1px solid #e5e7eb;">Email</td>
            <td style="padding: 14px 20px; font-size: 14px; color: #1A1A1A; border-bottom: 1px solid #e5e7eb;"><a href="mailto:${escapeHtml(data.email)}" style="color: #F3D840; text-decoration: none; font-weight: 600;">${escapeHtml(data.email)}</a></td>
          </tr>
          ${data.phone ? `
          <tr>
            <td style="padding: 14px 20px; background: #f9fafb; font-weight: 600; font-size: 13px; color: #374151; border-bottom: 1px solid #e5e7eb;">Phone</td>
            <td style="padding: 14px 20px; font-size: 14px; color: #1A1A1A; border-bottom: 1px solid #e5e7eb;">${escapeHtml(data.phone)}</td>
          </tr>` : ""}
          ${data.company ? `
          <tr>
            <td style="padding: 14px 20px; background: #f9fafb; font-weight: 600; font-size: 13px; color: #374151; border-bottom: 1px solid #e5e7eb;">Company</td>
            <td style="padding: 14px 20px; font-size: 14px; color: #1A1A1A; border-bottom: 1px solid #e5e7eb;">${escapeHtml(data.company)}</td>
          </tr>` : ""}
          ${data.jobsPerMonth ? `
          <tr>
            <td style="padding: 14px 20px; background: #f9fafb; font-weight: 600; font-size: 13px; color: #374151; border-bottom: 1px solid #e5e7eb;">Installs/Month</td>
            <td style="padding: 14px 20px; font-size: 14px; color: #1A1A1A; border-bottom: 1px solid #e5e7eb;">${escapeHtml(data.jobsPerMonth)}</td>
          </tr>` : ""}
          <tr>
            <td style="padding: 14px 20px; background: #f9fafb; font-weight: 600; font-size: 13px; color: #374151;">Message</td>
            <td style="padding: 14px 20px; font-size: 14px; color: #1A1A1A; white-space: pre-wrap;">${escapeHtml(data.message)}</td>
          </tr>
        </table>
      </td>
    </tr>
    <!-- Footer -->
    <tr>
      <td style="padding: 20px 40px; background: #f9fafb; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0; font-size: 12px; color: #9ca3af; text-align: center;">
          This notification was sent from the Renewably contact form. Reply directly to get in touch with the enquirer.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return sendEmail({
    to: "hello@renewably.ie",
    replyTo: data.email,
    subject: `New enquiry from ${data.name}${data.company ? ` (${data.company})` : ""}`,
    htmlBody,
    tag: "contact-form",
  });
}

/**
 * Send a welcome/confirmation email to a new contact form submitter.
 */
export async function sendWelcomeEmail(
  name: string,
  email: string
): Promise<PostmarkResponse> {
  const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1A1A1A; background: #f9fafb; padding: 40px 20px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <!-- Header -->
    <tr>
      <td style="background: #0A0A0A; padding: 32px 40px;">
        <h1 style="margin: 0; color: #F3D840; font-size: 24px; font-weight: 800;">Renewably</h1>
      </td>
    </tr>
    <!-- Content -->
    <tr>
      <td style="padding: 40px;">
        <h2 style="margin: 0 0 16px; font-size: 22px; font-weight: 700; color: #1A1A1A;">Thanks for reaching out, ${escapeHtml(name)}!</h2>
        <p style="margin: 0 0 20px; color: #4b5563; font-size: 15px; line-height: 1.6;">
          We've received your message and one of the team will be in touch within 24 hours.
        </p>
        <p style="margin: 0 0 20px; color: #4b5563; font-size: 15px; line-height: 1.6;">
          In the meantime, here's what you can expect:
        </p>
        <ol style="margin: 0 0 24px; padding-left: 24px; color: #4b5563; font-size: 15px; line-height: 1.8;">
          <li>We'll reply with a suggested call time.</li>
          <li>We'll jump on a 60-minute discovery call.</li>
          <li>We'll build your AI team and deploy it.</li>
          <li>You approve everything before it goes live.</li>
        </ol>
        <p style="margin: 0 0 24px; color: #4b5563; font-size: 15px; line-height: 1.6;">
          Need to reach us sooner? Call us at <a href="tel:+353873958424" style="color: #F3D840; text-decoration: none; font-weight: 600;">+353 873958424</a> or email <a href="mailto:hello@renewably.ie" style="color: #F3D840; text-decoration: none; font-weight: 600;">hello@renewably.ie</a>.
        </p>
      </td>
    </tr>
    <!-- Footer -->
    <tr>
      <td style="padding: 20px 40px; background: #f9fafb; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0 0 4px; font-size: 13px; color: #374151; font-weight: 600; text-align: center;">Renewably &mdash; AI-as-a-Service for Irish Solar PV Installers</p>
        <p style="margin: 0; font-size: 12px; color: #9ca3af; text-align: center;">Ireland &bull; <a href="mailto:hello@renewably.ie" style="color: #9ca3af;">hello@renewably.ie</a> &bull; <a href="tel:+353873958424" style="color: #9ca3af;">+353 873958424</a></p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return sendEmail({
    to: { email, name },
    subject: "Thanks for contacting Renewably \u2014 we'll be in touch soon!",
    htmlBody,
    tag: "welcome-auto-reply",
  });
}

/**
 * Send a proposal email to a customer.
 */
export async function sendProposalEmail(
  data: ProposalEmailData
): Promise<PostmarkResponse> {
  const amount = formatEur(data.totalAmount);
  const validUntil = data.validUntil
    ? new Date(data.validUntil).toLocaleDateString("en-IE", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "30 days from today";

  const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1A1A1A; background: #f9fafb; padding: 40px 20px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <tr>
      <td style="background: #0A0A0A; padding: 32px 40px;">
        <h1 style="margin: 0; color: #F3D840; font-size: 24px; font-weight: 800;">Renewably</h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px;">
        <h2 style="margin: 0 0 8px; font-size: 22px; font-weight: 700;">${escapeHtml(data.proposalTitle)}</h2>
        <p style="margin: 0 0 24px; color: #6b7280; font-size: 15px;">Dear ${escapeHtml(data.contactName)},</p>
        <p style="margin: 0 0 20px; color: #4b5563; font-size: 15px; line-height: 1.6;">
          Please find your solar PV proposal attached below. We'd love to discuss this with you and answer any questions you might have.
        </p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background: #FFFDF5; border: 1px solid #F3D840/30; border-radius: 8px; margin: 0 0 24px; overflow: hidden;">
          <tr>
            <td style="padding: 20px 24px; border-bottom: 1px solid #F3D840/30;">
              <span style="font-size: 13px; color: #6b7280; font-weight: 600;">Total Investment</span><br>
              <span style="font-size: 28px; font-weight: 800; color: #1A1A1A;">${amount}</span>
            </td>
            <td style="padding: 20px 24px; border-bottom: 1px solid #F3D840/30;">
              <span style="font-size: 13px; color: #6b7280; font-weight: 600;">Valid Until</span><br>
              <span style="font-size: 16px; font-weight: 600; color: #1A1A1A;">${validUntil}</span>
            </td>
          </tr>
        </table>
        ${data.proposalLink ? `
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
          <tr>
            <td align="center" style="padding: 16px 0;">
              <a href="${escapeHtml(data.proposalLink)}" style="display: inline-block; padding: 14px 32px; background: #F3D840; color: #1A1A1A; font-weight: 700; font-size: 15px; border-radius: 9999px; text-decoration: none;">
                View Full Proposal
              </a>
            </td>
          </tr>
        </table>` : ""}
        <p style="margin: 0 0 8px; color: #4b5563; font-size: 15px; line-height: 1.6;">
          If you have any questions or would like to schedule a call, don't hesitate to reach out.
        </p>
        <p style="margin: 0 0 24px; color: #4b5563; font-size: 15px; line-height: 1.6;">
          Kind regards,<br>The Renewably Team
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding: 20px 40px; background: #f9fafb; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0; font-size: 12px; color: #9ca3af; text-align: center;">Renewably &mdash; AI-as-a-Service for Irish Solar PV Installers</p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return sendEmail({
    to: { email: data.contactEmail, name: data.contactName },
    subject: `Your solar PV proposal: ${data.proposalTitle}`,
    htmlBody,
    tag: "proposal-sent",
  });
}

/**
 * Send an invoice email to a customer.
 */
export async function sendInvoiceEmail(
  data: InvoiceEmailData
): Promise<PostmarkResponse> {
  const amount = formatEur(data.totalAmount);
  const dueDate = data.dueDate
    ? new Date(data.dueDate).toLocaleDateString("en-IE", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "Upon receipt";

  const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1A1A1A; background: #f9fafb; padding: 40px 20px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <tr>
      <td style="background: #0A0A0A; padding: 32px 40px;">
        <h1 style="margin: 0; color: #F3D840; font-size: 24px; font-weight: 800;">Renewably</h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px;">
        <h2 style="margin: 0 0 8px; font-size: 22px; font-weight: 700;">Invoice ${escapeHtml(data.invoiceNumber)}</h2>
        <p style="margin: 0 0 24px; color: #6b7280; font-size: 15px;">Dear ${escapeHtml(data.contactName)},</p>
        <p style="margin: 0 0 20px; color: #4b5563; font-size: 15px; line-height: 1.6;">
          Please find your invoice details below. Payment is due ${dueDate}.
        </p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background: #FFFDF5; border: 1px solid #F3D840/30; border-radius: 8px; margin: 0 0 24px; overflow: hidden;">
          <tr>
            <td style="padding: 20px 24px; border-bottom: 1px solid #F3D840/30;">
              <span style="font-size: 13px; color: #6b7280; font-weight: 600;">Amount Due</span><br>
              <span style="font-size: 28px; font-weight: 800; color: #1A1A1A;">${amount}</span>
            </td>
            <td style="padding: 20px 24px; border-bottom: 1px solid #F3D840/30;">
              <span style="font-size: 13px; color: #6b7280; font-weight: 600;">Due Date</span><br>
              <span style="font-size: 16px; font-weight: 600; color: #1A1A1A;">${dueDate}</span>
            </td>
          </tr>
        </table>
        ${data.invoiceLink ? `
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
          <tr>
            <td align="center" style="padding: 16px 0;">
              <a href="${escapeHtml(data.invoiceLink)}" style="display: inline-block; padding: 14px 32px; background: #F3D840; color: #1A1A1A; font-weight: 700; font-size: 15px; border-radius: 9999px; text-decoration: none;">
                View Invoice
              </a>
            </td>
          </tr>
        </table>` : ""}
        <p style="margin: 0 0 24px; color: #4b5563; font-size: 15px; line-height: 1.6;">
          If you have any questions about this invoice, please don't hesitate to get in touch.
        </p>
        <p style="margin: 0 0 24px; color: #4b5563; font-size: 15px; line-height: 1.6;">
          Kind regards,<br>The Renewably Team
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding: 20px 40px; background: #f9fafb; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0; font-size: 12px; color: #9ca3af; text-align: center;">Renewably &mdash; AI-as-a-Service for Irish Solar PV Installers</p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return sendEmail({
    to: { email: data.contactEmail, name: data.contactName },
    subject: `Invoice ${data.invoiceNumber} \u2014 ${amount} due`,
    htmlBody,
    tag: "invoice-sent",
  });
}

// ============================================================================
// INTERNAL UTILITIES
// ============================================================================

/**
 * Escape HTML special characters to prevent XSS in email content.
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
