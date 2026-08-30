// Generated from the Relay one-pass intake. Do not renumber IDs by hand.
export const INTAKE_VERSION = 'renewably-relay-v1' as const
export type IntakeControl = 'input' | 'textarea' | 'confirm'
export interface IntakeField { id: string; group: string; prompt: string; control: IntakeControl }
export interface IntakeStage { key: string; label: string; title: string; description: string; groups: string[] }

export const GROUP_TITLES: Record<string, string> = {
  "OWN": "Submission owner and authority",
  "BUS": "Company identity",
  "AREA": "Service area and capacity",
  "PROD": "Products, warranties and boundaries",
  "PRICE": "Prices, grants and offers",
  "OPS": "Operations and handoffs",
  "VOICE": "Questions, objections and voice",
  "RULE": "Contact and approval rules",
  "PHONE": "Phone, SMS and missed calls",
  "WEB": "Email, website, domain and reviews",
  "CAL": "Booking calendar",
  "ACC": "Client-owned access",
  "BRAND": "Brand Kit and proof",
  "DATA": "Privacy and record handling",
  "TEST": "Staging and acceptance",
  "TRAIN": "Training and support",
  "SIGN": "Final declaration"
}
export const INTAKE_STAGES: IntakeStage[] = [
  {
    "key": "identity",
    "label": "Identity",
    "title": "People and company",
    "description": "Who owns the submission, the assistant and the final launch.",
    "groups": [
      "OWN",
      "BUS"
    ]
  },
  {
    "key": "offer",
    "label": "Offer",
    "title": "Your offer and service area",
    "description": "What you sell, where you work, current capacity and the numbers we may use.",
    "groups": [
      "AREA",
      "PROD",
      "PRICE"
    ]
  },
  {
    "key": "operations",
    "label": "Operations",
    "title": "How the business really works",
    "description": "Handoffs, qualification, customer questions and your natural voice.",
    "groups": [
      "OPS",
      "VOICE"
    ]
  },
  {
    "key": "channels",
    "label": "Channels",
    "title": "Rules and customer channels",
    "description": "Sending authority, missed calls, phone routing, email, website and reviews.",
    "groups": [
      "RULE",
      "PHONE",
      "WEB"
    ]
  },
  {
    "key": "calendar",
    "label": "Access",
    "title": "Calendar and access",
    "description": "Booking authority and safe client-owned account handoffs—never passwords.",
    "groups": [
      "CAL",
      "ACC"
    ]
  },
  {
    "key": "brand",
    "label": "Brand",
    "title": "Brand, proof and approved assets",
    "description": "Exact claims, usage rights and files for the governed Brand Kit.",
    "groups": [
      "BRAND"
    ]
  },
  {
    "key": "safety",
    "label": "Safety",
    "title": "Privacy, staging and acceptance",
    "description": "Retention, suppression lists, synthetic tests and launch authority.",
    "groups": [
      "DATA",
      "TEST"
    ]
  },
  {
    "key": "signoff",
    "label": "Sign-off",
    "title": "Training and final approval",
    "description": "Who needs training, what success means and the signed submission declaration.",
    "groups": [
      "TRAIN",
      "SIGN"
    ]
  }
]
export const INTAKE_FIELDS: IntakeField[] = [
  {
    "id": "OWN-01",
    "group": "OWN",
    "prompt": "Person completing this intake: name, role, email and mobile",
    "control": "input"
  },
  {
    "id": "OWN-02",
    "group": "OWN",
    "prompt": "Business owner / contract authority: name, role, email and mobile",
    "control": "input"
  },
  {
    "id": "OWN-03",
    "group": "OWN",
    "prompt": "Final operational approver: who may approve the business facts, message wording and production launch? Name, role, email and mobile",
    "control": "textarea"
  },
  {
    "id": "OWN-04",
    "group": "OWN",
    "prompt": "Day-to-day assistant owner: whose Telegram receives approvals, alerts and the evening summary? Name and mobile",
    "control": "textarea"
  },
  {
    "id": "OWN-05",
    "group": "OWN",
    "prompt": "Backup contact: who acts if the day-to-day owner is unavailable? Name, role, email and mobile",
    "control": "textarea"
  },
  {
    "id": "OWN-06",
    "group": "OWN",
    "prompt": "Urgent incident contact: who may authorise an emergency pause or provider-account action? Name and 24-hour mobile",
    "control": "textarea"
  },
  {
    "id": "OWN-07",
    "group": "OWN",
    "prompt": "Desired launch window: preferred week, dates to avoid and any absolute deadline",
    "control": "textarea"
  },
  {
    "id": "BUS-01",
    "group": "BUS",
    "prompt": "Exact trading name and capitalisation",
    "control": "input"
  },
  {
    "id": "BUS-02",
    "group": "BUS",
    "prompt": "Legal entity name, if different",
    "control": "input"
  },
  {
    "id": "BUS-03",
    "group": "BUS",
    "prompt": "Registered business address",
    "control": "input"
  },
  {
    "id": "BUS-04",
    "group": "BUS",
    "prompt": "Company/CRO number or sole-trader status",
    "control": "input"
  },
  {
    "id": "BUS-05",
    "group": "BUS",
    "prompt": "VAT number, or NOT VAT REGISTERED",
    "control": "input"
  },
  {
    "id": "BUS-06",
    "group": "BUS",
    "prompt": "Main website",
    "control": "input"
  },
  {
    "id": "BUS-07",
    "group": "BUS",
    "prompt": "Main public phone number",
    "control": "input"
  },
  {
    "id": "BUS-08",
    "group": "BUS",
    "prompt": "Main public email address",
    "control": "input"
  },
  {
    "id": "BUS-09",
    "group": "BUS",
    "prompt": "Owner/face of the business and preferred first name for customer messages",
    "control": "input"
  },
  {
    "id": "BUS-10",
    "group": "BUS",
    "prompt": "Years installing solar",
    "control": "input"
  },
  {
    "id": "BUS-11",
    "group": "BUS",
    "prompt": "SEAI registration status and number",
    "control": "input"
  },
  {
    "id": "BUS-12",
    "group": "BUS",
    "prompt": "Safe Electric/RECI number",
    "control": "input"
  },
  {
    "id": "BUS-13",
    "group": "BUS",
    "prompt": "Other accreditations the assistant may mention: list the exact name, number, expiry/review date and matching evidence filename",
    "control": "textarea"
  },
  {
    "id": "BUS-14",
    "group": "BUS",
    "prompt": "Why customers choose you: two or three factual sentences you would genuinely say across a counter: If Twilio or another provider requests identity/business verification, the authorised person completes it directly in that provider's secure screen. Do not attach passports, bank statements or unredacted IDs here.",
    "control": "textarea"
  },
  {
    "id": "AREA-01",
    "group": "AREA",
    "prompt": "Areas served: counties plus any radius, town or Eircode rules that make the boundary precise",
    "control": "textarea"
  },
  {
    "id": "AREA-02",
    "group": "AREA",
    "prompt": "Areas not served",
    "control": "textarea"
  },
  {
    "id": "AREA-03",
    "group": "AREA",
    "prompt": "Property/job types accepted: domestic, commercial, new build, retrofit and any limits",
    "control": "textarea"
  },
  {
    "id": "AREA-04",
    "group": "AREA",
    "prompt": "Work never accepted: for example thatch, flat commercial roofs, ground mount or jobs below a minimum size",
    "control": "textarea"
  },
  {
    "id": "AREA-05",
    "group": "AREA",
    "prompt": "Current indicative lead time: include the date this was checked; this is not treated as a guarantee",
    "control": "textarea"
  },
  {
    "id": "AREA-06",
    "group": "AREA",
    "prompt": "Current capacity limits: jobs/surveys per week, areas temporarily paused and who confirms capacity changes",
    "control": "textarea"
  },
  {
    "id": "AREA-07",
    "group": "AREA",
    "prompt": "Closures and blackout dates: holidays, shutdowns or local days when customers must not be contacted",
    "control": "textarea"
  },
  {
    "id": "PROD-01",
    "group": "PROD",
    "prompt": "Solar services actually sold today",
    "control": "textarea"
  },
  {
    "id": "PROD-02",
    "group": "PROD",
    "prompt": "Panel brands/models commonly offered",
    "control": "textarea"
  },
  {
    "id": "PROD-03",
    "group": "PROD",
    "prompt": "Inverter brands/models commonly offered",
    "control": "textarea"
  },
  {
    "id": "PROD-04",
    "group": "PROD",
    "prompt": "Battery brands/models commonly offered",
    "control": "textarea"
  },
  {
    "id": "PROD-05",
    "group": "PROD",
    "prompt": "EV charger, diverter, monitoring and other options",
    "control": "textarea"
  },
  {
    "id": "PROD-06",
    "group": "PROD",
    "prompt": "When alternatives/substitutions may be offered",
    "control": "textarea"
  },
  {
    "id": "PROD-07",
    "group": "PROD",
    "prompt": "Products, configurations or services never offered",
    "control": "textarea"
  },
  {
    "id": "PROD-08",
    "group": "PROD",
    "prompt": "Exact approved workmanship-warranty wording: include evidence filename/link, evidence owner and next review/expiry date",
    "control": "textarea"
  },
  {
    "id": "PROD-09",
    "group": "PROD",
    "prompt": "Exact approved product-warranty wording: include evidence filename/link, evidence owner and next review/expiry date",
    "control": "textarea"
  },
  {
    "id": "PROD-10",
    "group": "PROD",
    "prompt": "What maintenance, monitoring and aftercare are included",
    "control": "textarea"
  },
  {
    "id": "PROD-11",
    "group": "PROD",
    "prompt": "What is explicitly not included",
    "control": "textarea"
  },
  {
    "id": "PROD-12",
    "group": "PROD",
    "prompt": "Technical topics that must always go to a qualified surveyor/designer rather than the assistant: The assistant never designs a system, promises suitability or turns indicative information into a final quote.",
    "control": "textarea"
  },
  {
    "id": "PRICE-01",
    "group": "PRICE",
    "prompt": "Normal system price bands before grant: for each, provide system size/kWp, approximate panels, low EUR, high EUR, VAT status, inclusions, exclusions and the date last reviewed",
    "control": "textarea"
  },
  {
    "id": "PRICE-02",
    "group": "PRICE",
    "prompt": "Battery options and price bands",
    "control": "textarea"
  },
  {
    "id": "PRICE-03",
    "group": "PRICE",
    "prompt": "EV charger, diverter and other add-on price bands",
    "control": "textarea"
  },
  {
    "id": "PRICE-04",
    "group": "PRICE",
    "prompt": "Survey fee and duration: state FREE if free and describe any cancellation/no-show policy",
    "control": "textarea"
  },
  {
    "id": "PRICE-05",
    "group": "PRICE",
    "prompt": "Deposit and payment stages the assistant may explain",
    "control": "textarea"
  },
  {
    "id": "PRICE-06",
    "group": "PRICE",
    "prompt": "Finance options: exact approved wording and link, or NOT OFFERED",
    "control": "textarea"
  },
  {
    "id": "PRICE-07",
    "group": "PRICE",
    "prompt": "Current promotions: exact offer, eligibility, start/end dates, stock/capacity limits and approver; or NONE",
    "control": "textarea"
  },
  {
    "id": "PRICE-08",
    "group": "PRICE",
    "prompt": "Grant wording: what you currently say, with the source and date checked. Renewably will verify live SEAI information before use",
    "control": "textarea"
  },
  {
    "id": "PRICE-09",
    "group": "PRICE",
    "prompt": "Savings/payback boundary: exact statements allowed, and anything that must never be promised",
    "control": "textarea"
  },
  {
    "id": "PRICE-10",
    "group": "PRICE",
    "prompt": "Other forbidden price or offer wording",
    "control": "textarea"
  },
  {
    "id": "OPS-01",
    "group": "OPS",
    "prompt": "New enquiry owner and target response time",
    "control": "textarea"
  },
  {
    "id": "OPS-02",
    "group": "OPS",
    "prompt": "Lead sources: website forms, missed calls, email, referrals, paid ads and any others. Name the owner of each source",
    "control": "textarea"
  },
  {
    "id": "OPS-03",
    "group": "OPS",
    "prompt": "Qualification-call owner: name, mobile, email and role",
    "control": "textarea"
  },
  {
    "id": "OPS-04",
    "group": "OPS",
    "prompt": "What makes a lead qualified/warm: precise rules",
    "control": "textarea"
  },
  {
    "id": "OPS-05",
    "group": "OPS",
    "prompt": "What disqualifies a lead or requires a human decision",
    "control": "textarea"
  },
  {
    "id": "OPS-06",
    "group": "OPS",
    "prompt": "Survey-ready decision owner",
    "control": "textarea"
  },
  {
    "id": "OPS-07",
    "group": "OPS",
    "prompt": "Surveyors: names, emails, mobiles, service areas and where their availability is maintained",
    "control": "textarea"
  },
  {
    "id": "OPS-08",
    "group": "OPS",
    "prompt": "Formal quotation owner and normal turnaround",
    "control": "textarea"
  },
  {
    "id": "OPS-09",
    "group": "OPS",
    "prompt": "Technical/design question owner",
    "control": "textarea"
  },
  {
    "id": "OPS-10",
    "group": "OPS",
    "prompt": "Installation-day contact",
    "control": "textarea"
  },
  {
    "id": "OPS-11",
    "group": "OPS",
    "prompt": "Fault/aftercare contact and staffed hours",
    "control": "textarea"
  },
  {
    "id": "OPS-12",
    "group": "OPS",
    "prompt": "Complaint escalation owner",
    "control": "textarea"
  },
  {
    "id": "OPS-13",
    "group": "OPS",
    "prompt": "Safety/emergency wording: exact client-approved line the assistant should use before immediately handing to a human",
    "control": "textarea"
  },
  {
    "id": "OPS-14",
    "group": "OPS",
    "prompt": "Other topics requiring immediate human handoff",
    "control": "textarea"
  },
  {
    "id": "OPS-15",
    "group": "OPS",
    "prompt": "Existing CRM: name, internal owner, stage at which a warm lead is handed over, required fields and who performs any manual update. Write NO CRM if none: Direct CRM automation is not assumed in this wedge. The approved handover must work safely even when CRM entry remains manual.",
    "control": "textarea"
  },
  {
    "id": "VOICE-01",
    "group": "VOICE",
    "prompt": "Five to ten real customer questions: write the exact question and your approved answer to each",
    "control": "textarea"
  },
  {
    "id": "VOICE-02",
    "group": "VOICE",
    "prompt": "Three to five common objections: write the exact objection and what you genuinely say back",
    "control": "textarea"
  },
  {
    "id": "VOICE-03",
    "group": "VOICE",
    "prompt": "Three anonymised messages that sound like you: paste them into 07 BRAND KIT/03_EXAMPLES_AND_TONE.md",
    "control": "textarea"
  },
  {
    "id": "VOICE-04",
    "group": "VOICE",
    "prompt": "Three examples that do not sound like you: explain why",
    "control": "textarea"
  },
  {
    "id": "VOICE-05",
    "group": "VOICE",
    "prompt": "Words/phrases you use naturally",
    "control": "textarea"
  },
  {
    "id": "VOICE-06",
    "group": "VOICE",
    "prompt": "Words/phrases the assistant must never use",
    "control": "textarea"
  },
  {
    "id": "VOICE-07",
    "group": "VOICE",
    "prompt": "SMS sign-off",
    "control": "textarea"
  },
  {
    "id": "VOICE-08",
    "group": "VOICE",
    "prompt": "Email signature/sign-off",
    "control": "textarea"
  },
  {
    "id": "VOICE-09",
    "group": "VOICE",
    "prompt": "Emoji, exclamation mark and Irish/local-language policy",
    "control": "textarea"
  },
  {
    "id": "VOICE-10",
    "group": "VOICE",
    "prompt": "Tone when a person is upset, vulnerable or confused: All examples must be anonymised: remove customer names, addresses, phone numbers, email addresses, account numbers and identifiable property details.",
    "control": "textarea"
  },
  {
    "id": "RULE-01",
    "group": "RULE",
    "prompt": "Timezone: normally Europe/Dublin",
    "control": "textarea"
  },
  {
    "id": "RULE-02",
    "group": "RULE",
    "prompt": "Monday–Friday sending window: start and finish",
    "control": "textarea"
  },
  {
    "id": "RULE-03",
    "group": "RULE",
    "prompt": "Saturday sending window: or CLOSED",
    "control": "textarea"
  },
  {
    "id": "RULE-04",
    "group": "RULE",
    "prompt": "Sunday sending window: default is CLOSED",
    "control": "textarea"
  },
  {
    "id": "RULE-05",
    "group": "RULE",
    "prompt": "Other no-contact dates/rules",
    "control": "textarea"
  },
  {
    "id": "RULE-06",
    "group": "RULE",
    "prompt": "Follow-up cap: default and hard maximum is three. Confirm THREE or request a lower number",
    "control": "textarea"
  },
  {
    "id": "RULE-07",
    "group": "RULE",
    "prompt": "Review-request delay after completed installation: default is 14 days",
    "control": "textarea"
  },
  {
    "id": "RULE-08",
    "group": "RULE",
    "prompt": "Evening Telegram summary time",
    "control": "textarea"
  },
  {
    "id": "RULE-09",
    "group": "RULE",
    "prompt": "Weekly summary day/time",
    "control": "textarea"
  },
  {
    "id": "RULE-10",
    "group": "RULE",
    "prompt": "Week-one approvals: confirm that every ordinary outbound message waits for the named owner's Telegram approval",
    "control": "textarea"
  },
  {
    "id": "RULE-11",
    "group": "RULE",
    "prompt": "Missed-call acknowledgement: confirm that this one acknowledgement may send without manual approval because the person called your business first. It still obeys hours, STOP/DNC, logging and the pause switch",
    "control": "textarea"
  },
  {
    "id": "RULE-12",
    "group": "RULE",
    "prompt": "Exact missed-call wording: provide approved wording, or write DRAFT IN OUR APPROVED VOICE FOR TRAINING REVIEW",
    "control": "textarea"
  },
  {
    "id": "RULE-13",
    "group": "RULE",
    "prompt": "Emergency pause phrase owner: name the people permitted to use stop everything",
    "control": "textarea"
  },
  {
    "id": "PHONE-01",
    "group": "PHONE",
    "prompt": "Public number customers currently call: include country code",
    "control": "textarea"
  },
  {
    "id": "PHONE-02",
    "group": "PHONE",
    "prompt": "Network/carrier and account owner",
    "control": "textarea"
  },
  {
    "id": "PHONE-03",
    "group": "PHONE",
    "prompt": "Current call path: who/what rings, for how long, then voicemail/forwarding behaviour",
    "control": "textarea"
  },
  {
    "id": "PHONE-04",
    "group": "PHONE",
    "prompt": "Missed-call definition: no answer, busy, declined, after-hours and any cases that must not trigger a text",
    "control": "textarea"
  },
  {
    "id": "PHONE-05",
    "group": "PHONE",
    "prompt": "Call-forwarding administrator: name, email and mobile of the person who can add/test no-answer forwarding",
    "control": "textarea"
  },
  {
    "id": "PHONE-06",
    "group": "PHONE",
    "prompt": "Number presentation: confirm the approved number customers should see for assistant SMS replies",
    "control": "textarea"
  },
  {
    "id": "PHONE-07",
    "group": "PHONE",
    "prompt": "Existing opt-out/DNC records: confirm whether any exist and name the owner who will transfer them by the approved secure method. Do not paste or upload the list here",
    "control": "textarea"
  },
  {
    "id": "PHONE-08",
    "group": "PHONE",
    "prompt": "Team test mobile: E.164 format; must not belong to a customer",
    "control": "textarea"
  },
  {
    "id": "PHONE-09",
    "group": "PHONE",
    "prompt": "Backup test mobile: E.164 format; must not belong to a customer",
    "control": "textarea"
  },
  {
    "id": "WEB-01",
    "group": "WEB",
    "prompt": "Approved sender name: what customers see in their inbox",
    "control": "textarea"
  },
  {
    "id": "WEB-02",
    "group": "WEB",
    "prompt": "Approved sender email on your own domain",
    "control": "textarea"
  },
  {
    "id": "WEB-03",
    "group": "WEB",
    "prompt": "Replies go to: inbox and named inbox owner",
    "control": "textarea"
  },
  {
    "id": "WEB-04",
    "group": "WEB",
    "prompt": "Domain name",
    "control": "textarea"
  },
  {
    "id": "WEB-05",
    "group": "WEB",
    "prompt": "Domain/DNS host: for example Cloudflare or registrar",
    "control": "textarea"
  },
  {
    "id": "WEB-06",
    "group": "WEB",
    "prompt": "DNS decision-maker: name, company, email and mobile; they must be able to approve Postmark DKIM and assistant-subdomain records",
    "control": "textarea"
  },
  {
    "id": "WEB-07",
    "group": "WEB",
    "prompt": "Website manager: name/company, email and mobile",
    "control": "textarea"
  },
  {
    "id": "WEB-08",
    "group": "WEB",
    "prompt": "Existing enquiry-form URLs: list every form that should feed the assistant and where submissions currently go",
    "control": "textarea"
  },
  {
    "id": "WEB-09",
    "group": "WEB",
    "prompt": "Existing business inboxes: list any that should feed the assistant and name their owner",
    "control": "textarea"
  },
  {
    "id": "WEB-10",
    "group": "WEB",
    "prompt": "Google Business Profile URL",
    "control": "textarea"
  },
  {
    "id": "WEB-11",
    "group": "WEB",
    "prompt": "Direct Google review link",
    "control": "textarea"
  },
  {
    "id": "WEB-12",
    "group": "WEB",
    "prompt": "Google Business Profile administrator: name and email",
    "control": "textarea"
  },
  {
    "id": "WEB-13",
    "group": "WEB",
    "prompt": "Team test email: must not belong to a customer",
    "control": "textarea"
  },
  {
    "id": "WEB-14",
    "group": "WEB",
    "prompt": "Preferred assistant subdomain: for example assistant.yourdomain.ie, subject to DNS availability: Renewably supplies the exact DNS records. The domain owner adds or approves them. Never send a domain password.",
    "control": "textarea"
  },
  {
    "id": "CAL-01",
    "group": "CAL",
    "prompt": "Client-owned Cal.com account email",
    "control": "textarea"
  },
  {
    "id": "CAL-02",
    "group": "CAL",
    "prompt": "15-minute qualification-call host",
    "control": "textarea"
  },
  {
    "id": "CAL-03",
    "group": "CAL",
    "prompt": "Qualification-call availability: days/times, timezone, minimum notice, booking horizon, buffers and maximum bookings per day",
    "control": "textarea"
  },
  {
    "id": "CAL-04",
    "group": "CAL",
    "prompt": "Qualification-call location: phone, video or other",
    "control": "textarea"
  },
  {
    "id": "CAL-05",
    "group": "CAL",
    "prompt": "Questions shown on the qualification booking form",
    "control": "textarea"
  },
  {
    "id": "CAL-06",
    "group": "CAL",
    "prompt": "Survey event host(s)",
    "control": "textarea"
  },
  {
    "id": "CAL-07",
    "group": "CAL",
    "prompt": "Survey duration, availability, service-area rules, minimum notice, buffers and maximum surveys per day",
    "control": "textarea"
  },
  {
    "id": "CAL-08",
    "group": "CAL",
    "prompt": "Survey booking-form questions",
    "control": "textarea"
  },
  {
    "id": "CAL-09",
    "group": "CAL",
    "prompt": "Reschedule/cancellation policy the assistant may explain",
    "control": "textarea"
  },
  {
    "id": "CAL-10",
    "group": "CAL",
    "prompt": "Calendar administrator: name, email and mobile",
    "control": "textarea"
  },
  {
    "id": "CAL-11",
    "group": "CAL",
    "prompt": "Test event approval: confirm Renewably may create, reschedule and cancel synthetic bookings using only the named test identities: The assistant never invents a booking. Cal.com is the only booking authority.",
    "control": "textarea"
  },
  {
    "id": "ACC-01",
    "group": "ACC",
    "prompt": "Google account that will own the Drive folder and Master Sheet: account email and owner name",
    "control": "textarea"
  },
  {
    "id": "ACC-02",
    "group": "ACC",
    "prompt": "Google access invitation sent to: Renewably email supplied in your secure welcome message; record SENT and date",
    "control": "textarea"
  },
  {
    "id": "ACC-03",
    "group": "ACC",
    "prompt": "Cal.com access: client-owned account created and Renewably invitation sent; record SENT and date",
    "control": "textarea"
  },
  {
    "id": "ACC-04",
    "group": "ACC",
    "prompt": "DNS access route: Renewably limited-access invitation sent, or DNS manager confirms they will apply supplied records; state which",
    "control": "textarea"
  },
  {
    "id": "ACC-05",
    "group": "ACC",
    "prompt": "Phone routing access route: limited invitation sent, or carrier administrator confirms they will apply/test supplied forwarding",
    "control": "textarea"
  },
  {
    "id": "ACC-06",
    "group": "ACC",
    "prompt": "Google Business access: invitation sent, or feature explicitly limited to the supplied public review link",
    "control": "textarea"
  },
  {
    "id": "ACC-07",
    "group": "ACC",
    "prompt": "AI model account owner/email: client pays the model provider directly. Confirm the account is ready; never place its key here",
    "control": "textarea"
  },
  {
    "id": "ACC-08",
    "group": "ACC",
    "prompt": "Secure credential handoff owner: name of the person who will use the protected one-time link or provider screen if an invitation cannot be used. No secret is entered in this intake: Renewably creates and manages the isolated VPS, Telegram bot, Twilio subaccount, Postmark server and private deployment resources for this offer. Their secret values do not belong in the client homework.",
    "control": "textarea"
  },
  {
    "id": "BRAND-01",
    "group": "BRAND",
    "prompt": "Exact Brand Kit approver: name and role",
    "control": "textarea"
  },
  {
    "id": "BRAND-02",
    "group": "BRAND",
    "prompt": "Primary logo: filename; include transparent PNG and a sanitised-source SVG if available",
    "control": "textarea"
  },
  {
    "id": "BRAND-03",
    "group": "BRAND",
    "prompt": "Brand colours and fonts: complete Brand Profile, including font licence/source",
    "control": "textarea"
  },
  {
    "id": "BRAND-04",
    "group": "BRAND",
    "prompt": "Approved photos: filenames, owner, consent/usage rights and approved channels entered in the asset register; NONE is allowed",
    "control": "textarea"
  },
  {
    "id": "BRAND-05",
    "group": "BRAND",
    "prompt": "Claims/accreditations/warranties: each has exact approved wording, evidence, owner, channels and review/expiry date",
    "control": "textarea"
  },
  {
    "id": "BRAND-06",
    "group": "BRAND",
    "prompt": "Current brochure, email signature and useful website copy: list filenames/URLs, or NONE",
    "control": "textarea"
  },
  {
    "id": "BRAND-07",
    "group": "BRAND",
    "prompt": "Things the brand must never say or show",
    "control": "textarea"
  },
  {
    "id": "BRAND-08",
    "group": "BRAND",
    "prompt": "Asset rights register: confirm every uploaded file has one exact row and status APPROVED or REJECTED: No logo, photo or claim is published merely because it was uploaded. Renewably validates the files and the first use is previewed during training.",
    "control": "textarea"
  },
  {
    "id": "DATA-01",
    "group": "DATA",
    "prompt": "Privacy/data-protection contact: name, role, email and mobile",
    "control": "textarea"
  },
  {
    "id": "DATA-02",
    "group": "DATA",
    "prompt": "Customer privacy notice URL",
    "control": "textarea"
  },
  {
    "id": "DATA-03",
    "group": "DATA",
    "prompt": "Approved privacy wording/link for web forms and booking forms",
    "control": "textarea"
  },
  {
    "id": "DATA-04",
    "group": "DATA",
    "prompt": "Lead-source authority: confirm the business will send only enquiries it is permitted to handle and contact",
    "control": "textarea"
  },
  {
    "id": "DATA-05",
    "group": "DATA",
    "prompt": "Existing suppression/DNC owner: name and secure transfer method; no customer data is placed in the Brand Kit",
    "control": "textarea"
  },
  {
    "id": "DATA-06",
    "group": "DATA",
    "prompt": "Data request/deletion owner: who handles a customer access, correction or deletion request?",
    "control": "textarea"
  },
  {
    "id": "DATA-07",
    "group": "DATA",
    "prompt": "Default operational retention: confirm 30 days for raw webhook payloads and 90 days for message bodies, or record the approved shorter period requested",
    "control": "textarea"
  },
  {
    "id": "DATA-08",
    "group": "DATA",
    "prompt": "Drive/CRM retention rule: describe the client's own retention requirement and deletion owner",
    "control": "textarea"
  },
  {
    "id": "DATA-09",
    "group": "DATA",
    "prompt": "Sensitive information: list categories the assistant must refuse to collect or immediately hand to a human",
    "control": "textarea"
  },
  {
    "id": "DATA-10",
    "group": "DATA",
    "prompt": "Recording: confirm the assistant does not record calls under this offer. State any separate recording system the business uses",
    "control": "textarea"
  },
  {
    "id": "TEST-01",
    "group": "TEST",
    "prompt": "Primary test identity: name, team-owned mobile and email",
    "control": "textarea"
  },
  {
    "id": "TEST-02",
    "group": "TEST",
    "prompt": "Secondary test identity: name, team-owned mobile and email",
    "control": "textarea"
  },
  {
    "id": "TEST-03",
    "group": "TEST",
    "prompt": "Synthetic test property: invented address/Eircode, property facts and a clearly marked fake bill; never use a real customer's data",
    "control": "textarea"
  },
  {
    "id": "TEST-04",
    "group": "TEST",
    "prompt": "Test lead journey: who will place the missed call, reply, upload the fake bill and make/cancel the test booking?",
    "control": "textarea"
  },
  {
    "id": "TEST-05",
    "group": "TEST",
    "prompt": "Staging review authority: name of person who may approve the captured test evidence",
    "control": "textarea"
  },
  {
    "id": "TEST-06",
    "group": "TEST",
    "prompt": "Production launch authority: name of person who may give the separate final go-live approval after training",
    "control": "textarea"
  },
  {
    "id": "TEST-07",
    "group": "TEST",
    "prompt": "Launch exclusions: dates, campaigns or operational conditions during which production must stay paused: Real customers and production customer exports are never used in staging.",
    "control": "textarea"
  },
  {
    "id": "TRAIN-01",
    "group": "TRAIN",
    "prompt": "Owner/operator training attendees: names, roles, emails, mobiles and confidence with Telegram/online tools",
    "control": "textarea"
  },
  {
    "id": "TRAIN-02",
    "group": "TRAIN",
    "prompt": "Consultant training attendees: names, roles, emails, mobiles and responsibilities; write NONE YET if not hired",
    "control": "textarea"
  },
  {
    "id": "TRAIN-03",
    "group": "TRAIN",
    "prompt": "Preferred training windows: give at least three",
    "control": "textarea"
  },
  {
    "id": "TRAIN-04",
    "group": "TRAIN",
    "prompt": "Accessibility or learning preferences",
    "control": "textarea"
  },
  {
    "id": "TRAIN-05",
    "group": "TRAIN",
    "prompt": "Daily decision owner after launch",
    "control": "textarea"
  },
  {
    "id": "TRAIN-06",
    "group": "TRAIN",
    "prompt": "Who covers holidays/absence",
    "control": "textarea"
  },
  {
    "id": "TRAIN-07",
    "group": "TRAIN",
    "prompt": "Support contact: who may raise normal support requests?",
    "control": "textarea"
  },
  {
    "id": "TRAIN-08",
    "group": "TRAIN",
    "prompt": "Success after 30 days: three measurable outcomes that would make the assistant worthwhile: Training will cover daily Telegram use, approvals, the pause switch, debriefs, lead handover and safe agent/side-quest scheduling. It will not be used to fill missing onboarding fields.",
    "control": "textarea"
  },
  {
    "id": "SIGN-01",
    "group": "SIGN",
    "prompt": ": Required answers are complete, current and approved.",
    "control": "confirm"
  },
  {
    "id": "SIGN-02",
    "group": "SIGN",
    "prompt": ": Uploaded assets are owned/licensed for the recorded uses and any depicted people have the necessary consent.",
    "control": "confirm"
  },
  {
    "id": "SIGN-03",
    "group": "SIGN",
    "prompt": ": Claims, prices, warranties and accreditations have evidence and may be used only within the recorded wording/channels/dates.",
    "control": "confirm"
  },
  {
    "id": "SIGN-04",
    "group": "SIGN",
    "prompt": ": No password, secret, payment data, customer export or unredacted identity document has been included.",
    "control": "confirm"
  },
  {
    "id": "SIGN-05",
    "group": "SIGN",
    "prompt": ": The named test identities belong to the team and may receive staging messages and bookings.",
    "control": "confirm"
  },
  {
    "id": "SIGN-06",
    "group": "SIGN",
    "prompt": ": Week-one ordinary outbound messages require human approval; the tightly controlled missed-call acknowledgement is the sole agreed exception.",
    "control": "confirm"
  },
  {
    "id": "SIGN-07",
    "group": "SIGN",
    "prompt": ": Renewably may create and configure the isolated resources described in this intake and run synthetic acceptance tests.",
    "control": "confirm"
  },
  {
    "id": "SIGN-08",
    "group": "SIGN",
    "prompt": ": Production remains paused until the named launch authority gives separate approval after training and acceptance evidence. **Authorised name:** **Role:** **Date:** **Approval method/reference:**",
    "control": "confirm"
  }
]
export const REQUIRED_FIELD_IDS = INTAKE_FIELDS.map((field) => field.id)
