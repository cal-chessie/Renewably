---
Task ID: 1
Agent: Main Agent
Task: Fix mobile issues across entire renewably.ie site — footer, workforce dashboards, heroes, CRM

Work Log:
- Audited all public pages and CRM pages for mobile issues
- Created `/home/z/my-project/src/components/Footer.tsx` — dark branded footer with 4-column responsive grid (brand, quick links, services, contact), bottom bar with copyright
- Updated `SiteShell.tsx` to include Footer between children and ChatWidget
- Fixed `WorkforcePageClient.tsx` — added `maxWidth: 640, margin: '0 auto'` to all 8 dashboard wrapper divs to constrain size on mobile
- Fixed `AboutPageClient.tsx` — hero section now uses `minHeight: '100dvh'` with flex centering, responsive padding via clamp()
- Fixed `ServicesPageClient.tsx` — hero section now uses `minHeight: '100dvh'` with flex centering, responsive padding
- Fixed `PricingPageClient.tsx` — hero top padding reduced on mobile via clamp()
- Fixed `ContactPageClient.tsx` — hero section now uses `minHeight: '100dvh'` with flex centering
- Fixed `WorkforcePageClient.tsx` — hero changed from `100vh` to `100dvh`
- Fixed `HomePageClient.tsx` — already had `100dvh`, no changes needed
- CRM dashboard header: added flexWrap for date badge on small screens
- CRM skeleton: reduced horizontal padding from 32px to 16px on mobile
- CRM contacts & pipeline proposal dialogs: added overflow-x scroll for line item grids
- CRM pipeline kanban: changed from CSS Grid to Flexbox for proper horizontal scrolling
- All changes pass `bun run lint` with zero errors

Stage Summary:
- Footer created and deployed site-wide — fixes "missing footer on mobile"
- Workforce dashboards constrained to 640px max — fixes "huge visuals on mobile"
- All heroes now use 100dvh + flex centering — fixes "heroes don't fit screen"
- CRM mobile usability improved — header wrapping, padding, scrollable grids
