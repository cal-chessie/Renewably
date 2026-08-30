# Renewably Relay — private setup gate

## Purpose

This is the second gate, used only after Cal has spoken with an installer and agreed the commercial scope. It replaces the retired public SolarPilot signup.

It starts every client with the same controlled scope:

- Personal Assistant
- Chief of Staff

Other agent capabilities may be recorded as future priorities, but are not enabled by this intake.

## Client journey

1. An installer requests a conversation from the public website.
2. Cal qualifies the fit and agrees scope.
3. A Renewably CRM administrator creates a time-limited setup invitation.
4. The client completes `/setup/<invite-token>` and can upload approved RAW materials.
5. Submission creates a versioned Builder Handover in `submitted_for_review` state.
6. A human reviews the handover, then the builder configures staging.
7. Training, acceptance evidence and separate production approval happen later.

The setup form cannot create a CRM login, subscription, customer messages or production deployment.

## Website and DNS delivery pack

The `WEB-*` and `ACC-*` field groups collect the operational facts needed to run Relay. The private UI makes the website-build material explicit:

- domain, registrar, DNS host and approval owner;
- current website platform, host, developer or repository owner;
- every form, chat, lead magnet and its current destination;
- Search Console, Analytics, Tag Manager, consent and advertising ownership;
- Google Business Profile and social ownership;
- approved content, claims, proof, photography, legal pages and launch approver.

The client supplies links, contacts and invitation routes. They must never paste passwords, provider tokens, API keys, billing details or raw customer exports into this intake.

## Deployment prerequisites

Before enabling a real invite:

1. Apply `supabase/migrations/20260830_relay_setup_gate.sql` in Supabase.
2. Confirm `relay-setup-assets` is private and its 25 MB/MIME policy is present.
3. Verify `SUPABASE_SERVICE_ROLE_KEY` is an environment secret only—never in `.env.example` or Git history. Rotate any key that was committed.
4. Set `RELAY_SETUP_PREVIEW=false` in production. It is only for a local/staging visual walkthrough at `/setup/preview`.
5. Create an invite through the authenticated staff route. Delivery remains manual until the Postmark invite template is configured.
6. Run synthetic staging tests: invalid token, expired token, rejected SVG/executable upload, resume, handover creation and no production activation.

## Postmark sequence to add before client use

1. Relay setup invitation (contains the private link and expiry).
2. Gentle reminder before expiry.
3. Submission received: confirms human review, not go-live.
4. Missing-information request: lists only approved, specific gaps.
5. Staging ready / training invitation.

No email may claim that Relay is live until the separate production approval has been recorded.
