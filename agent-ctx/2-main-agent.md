---
Task ID: 2
Agent: Main Agent
Task: Step 2 — Enhance company detail page (activities API, dialogs, billing summary)

Work Log:
- Read existing codebase: company detail page, deals route, email route, CRM schemas, validation utilities, auth helpers
- Rewrote `src/app/api/crm/activities/route.ts` — migrated from Prisma to Supabase:
  - GET: Lists deal_activities from Supabase with pagination, optional dealId/companyId filtering
  - POST: Creates activity with type, title, content, optional dealId/companyId using createServiceClient + requireAuth + zod validation
  - Rate limiting, proper error handling, structured logging
- Enhanced `src/app/crm/companies/[id]/page.tsx`:
  - Added `Send` and `CreditCard` and `Receipt` icons to lucide-react import
  - Created `SendEmailDialog` component: readonly To field, subject input, body textarea, calls POST /api/crm/email, follows DialogOverlay + DS design system pattern
  - Created `LogNoteDialog` component: type selector (Note/Call/Email/Meeting) with colored toggle buttons, content textarea, optional deal dropdown, calls POST /api/crm/activities, follows DialogOverlay + DS pattern
  - Updated `ContactRow` component: added `onLogCall` and `onSendEmail` optional callbacks, renders phone+email action icon buttons on the right side of each contact row with hover effects matching DS design system
  - Added billing summary: 4 StatCards above Deals Pipeline section showing Total MRR, Pipeline Value, Active Subscriptions, Total Setup Fees — all derived from company.deals data
  - Added state variables: emailContact, logNoteOpen, logNoteDefault, logNoteContactName
  - Wired ContactRow callbacks: phone button → opens LogNoteDialog with type="call" + contact name, email button → opens SendEmailDialog with contact
  - Rendered SendEmailDialog and LogNoteDialog at the bottom with other dialogs

Stage Summary:
- Activities API fully migrated to Supabase with proper auth, validation, rate limiting
- Company detail page enhanced with interactive contact actions (call/email buttons)
- Two new dialogs: SendEmailDialog (email composing) and LogNoteDialog (activity logging)
- Billing summary cards added for financial overview at a glance
- All changes follow existing design system patterns (DS constants, inline styles, DialogOverlay, StatCard)
- TypeScript compiles successfully (only pre-existing test file error)
- Lint clean (only pre-existing react-hooks/set-state-in-effect warnings)
