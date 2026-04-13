---
Task ID: 1
Agent: Main
Task: Fix workforce hero robot centering + mobile-optimize all 12 CRM pages

Work Log:
- Fixed workforce hero `objectPosition` from `60% center` to `50% 40%` on mobile, `center center` on desktop
- Added 56px mobile spacer div in CRM layout to prevent content overlap with floating sidebar toggle
- Updated mobile toggle position from `top: 8, left: 8` to `top: 12, left: 12`
- Applied consistent mobile padding pattern `px-4 pt-2 pb-6 sm:p-6 lg:p-8` to all 12 CRM pages:
  - Dashboard (crm/page.tsx)
  - Pipeline (crm/pipeline/page.tsx) 
  - Contacts (crm/contacts/page.tsx)
  - Activities (crm/activities/page.tsx)
  - Companies (crm/companies/page.tsx)
  - Tasks (crm/tasks/page.tsx)
  - Meetings (crm/meetings/page.tsx)
  - Invoices (crm/invoices/page.tsx)
  - Proposals (crm/proposals/page.tsx)
  - Reports (crm/reports/page.tsx)
  - Installers (crm/installers/page.tsx)
  - Workflows (crm/workflows/page.tsx)
- Fixed dashboard skeleton chart grid `minmax(400px, 1fr)` → `minmax(280px, 1fr)` for mobile
- Added snap scrolling to pipeline kanban board for better mobile UX
- Fixed companies table cell padding `px-6` → `px-3 sm:px-6` for mobile
- Verified login page already mobile-optimized (centered card layout)
- Verified footer already mobile-optimized (responsive grid + clamp)
- Verified homepage sections all use clamp() for fluid responsive sizing

Stage Summary:
- All 12 CRM pages now have mobile-safe padding that accounts for the floating hamburger toggle
- Workforce hero robot now centres properly on mobile viewports
- Pipeline kanban board has touch-friendly snap scrolling
- Tables collapse properly with hidden columns on smaller screens
- All changes pass ESLint with zero warnings
