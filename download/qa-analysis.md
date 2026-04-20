# CRM QA Screenshot Analysis Report

**Generated**: April 2026  
**Screenshots Analyzed**: 19  
**Source**: `/home/z/my-project/download/`

---

## 1. Dashboard (`qa-dashboard.png`)

### Page Name
Dashboard — Main business overview

### Layout Structure
- **Left Sidebar** (~200px): Navigation menu with icons
- **Top Header**: Logo + Analytics button + date display
- **Main Content Area**: Metric cards, funnel, revenue chart, AI insights, activity breakdown, quick actions

### Color Scheme
- Background: Black (#121212)
- Panels: Dark gray (#1E1E1E)
- Primary accent: Vibrant yellow (#FFD700)
- Text: White (#FFFFFF) primary, gray (#888888) secondary
- Success: Green arrows for positive trends

### UI Components & Data
**Header**: "Solar CRM" logo, "Analytics" button, date "Mon, Apr 13, 2026" with green dot

**Sidebar Navigation** (vertical):
- Dashboard (active, yellow highlight with dot)
- Installers, Pipeline, People, Tasks, Calendar, Settings
- User profile: "Sarah O'Brien" / "admin"

**Top Metrics Row (4 cards)**:
1. Active Installers: **3** — "3 new this month" — ↑12% vs last month
2. Monthly Recurring: **€3,750** — "67% onboarding complete"
3. Pipeline Value: **€78,980** — "6 active deals" — ↑65% vs last month
4. Win Rate: **75%** — "3 won this month"

**Middle Row**:
- Pipeline Funnel card: Lead (1 deals, €21,000), Qualified (2 deals, €30,000), Proposal (2 deals, €21,490), Negotiation (1 deals, €6,490). Red warning: "1 overdue task need attention"
- Monthly Revenue chart (empty/placeholder)

**Bottom Row (3 cards)**:
- AI Insights: "You have 6 deals worth €78,980 in the..."
- Activity Breakdown: "0 this week" badge, partial pie chart (yellow/blue segments)
- Quick Actions: Two yellow action icons

**Floating Elements**: Yellow star FAB (bottom-right), Yellow "N" button (bottom-left)

### Interactive Elements
- Sidebar navigation links
- "Analytics" header button
- Metric cards (likely clickable)
- Floating action buttons

---

## 2. Pipeline (`qa-pipeline.png`)

### Page Name
Pipeline — Sales deal tracking and management

### Layout Structure
- **Left Sidebar** (~200px): Standard navigation, Pipeline highlighted in yellow
- **Top Header**: "Pipeline" title + subtitle + "New Deal" yellow button
- **Metric Cards Row** (5 cards)
- **Pipeline Forecast** bar chart
- **Deal Search/Filter Bar**
- **Kanban Columns**: Deal cards organized by stage

### Color Scheme
- Background: Black (#121212)
- Sidebar: Dark gray (#2A2A2A)
- Accent: Yellow (#FCD34D)
- Chart colors: Gray (Lead), Blue (Qualified), Yellow (Proposal), Orange (Negotiation), Green (Won), Red (Lost)

### UI Components & Data
**Metrics (5 cards)**:
1. Total Pipeline Value: **€136,470** — ↑12.5%
2. Weighted Value: **€80,254** — ↑8.3%
3. Active Deals: **10** — ↓2.1%
4. Avg Deal Size: **€13,647** — ↑5.7%
5. Win Rate: **75%** — ↑3.2%

**Pipeline Forecast**: Horizontal bar chart with legend showing stage values. Total: €136,470

**Search & Filters**: Search bar, "Value (High to Low)" dropdown, grid/list view toggles, "10 deals" count

**Kanban Columns**:
- Lead (1 deal): NorthWest Renewables — Enterprise, €21,000, 30%, Eoin Ryan
- Qualified (2 deals): Midland Solar — Pro Plan €15,000 50%; Tom Henderson — Starter Plan €6,490 55%
- Proposal (2 deals): Galway Green Energy — Starter Plan €6,490 60%; Photon Electrical — Pro Plan €15,000 40%
- Negotiation (1 deal): Cork Solar Solutions — Pro Plan €15,000 70%
- Won (3 deals): Additional cards visible

**Deal Cards**: Company name, deal type, value in €, progress %, primary/secondary contact, days left indicator

### Interactive Elements
- "New Deal" yellow button
- Search bar with filters
- Grid/list view toggle
- Kanban column scrolling
- Deal cards (clickable to detail)
- FAB star button (bottom-right)

---

## 3. Tasks (`qa-tasks.png`)

### Page Name
Tasks — Task management and tracking

### Layout Structure
- **Left Sidebar** (~220px): Navigation, Tasks highlighted in yellow
- **Top Header**: "Website Analytics" + "Analytics"/"Backend" tabs
- **Left Panel** (~320px): Analytics dashboard (live metrics, heatmap, visitor chart, traffic sources)
- **Right Panel** (~950px): Tasks section with stats, filters, and task cards

### Color Scheme
- Background: Black (#121212) / Dark gray (#1E1E1E)
- Accent: Yellow (#FFC107)
- Status colors: Red (overdue/urgent), Orange (due soon), Green (completed), Yellow (in progress)

### UI Components & Data
**Analytics Panel (left)**:
- Live Metrics: Visitors Now (16), Page Views (1,843), Conversions (7)
- Traffic Heatmap: 7x7 grid with Low/High labels
- Visitors (30D): Line chart with dates
- Traffic Sources: Organic Search 42%, Direct 22%, Social Media 14%, Referral 10%, Email 7%, Paid Ads 5%

**Tasks Section (right)**:
- Title: "Tasks" with "Create Task" yellow button
- Stats (5+1 cards): Total Tasks (9), Overdue (1 — "Needs attention"), Due Today (0 — "All clear"), Completed This Week (0), In Progress (3), Avg Completion (0 days)

**Task Status Tabs**: To Do (6), In Progress (3), Completed (0), Cancelled (0)

**View Toggles**: Board (active/yellow), List, Timeline

**Task Cards** (7 visible):
1. "Follow-up: Patrick quarterly review" — High, 1d overdue — Patrick O'Sullivan
2. "Prepare partnership deck for Rachel" — Urgent, Apr 15 — Rachel McCarthy (In Progress)
3. "Follow up with Aoife on kickoff date" — High, Tomorrow — Aoife Kelly
4. "Send EcoWind proposal by Friday" — High, May 1 — Michael Fitzgerald (In Progress)
5. "Prepare Sustainable Homes SEO audit" — High, Apr 27 — Aoife Kelly
6. "Research EV charging market trends" — Medium — Eoin Ryan (In Progress)
7. "Update BioGreen campaign report" — Medium, Apr 27

### Interactive Elements
- Create Task button
- Search bar, Filters button
- Board/List/Timeline view toggles
- Task status tabs
- Task cards (clickable)
- FAB star button

---

## 4. Contacts / People (`qa-contacts.png`)

### Page Name
People — Contact, lead, and customer management

### Layout Structure
- **Left Sidebar** (~200px): Standard navigation, People highlighted with yellow dot
- **Main Content**: Header + stats + filter bar + contact card grid

### Color Scheme
- Background: Black (#121212)
- Sidebar: Dark gray (#1E1E1E)
- Accent: Yellow for actions and highlights
- Status colors: Green (Customer), Blue (Lead), Purple (Prospect), Teal (Website), Orange (Referral), Red (Cold)

### UI Components & Data
**Header**: "People" title with yellow "12 contacts" badge, "Add Contact" yellow button

**Stats (6 cards)**:
1. Total Contacts: **12** — +12%
2. New This Month: **12** — +12%
3. Leads: **4** — Steady
4. Prospects: **4** — +12%
5. Customers: **4** — Steady
6. Avg Days Since Contact: **6d** — +12%

**Filters**: Search bar, "All Statuses" / "All Sources" / "Newest First" dropdowns, grid/list view toggle

**Contact Cards (12 contacts)**:
1. Niamh O'Connor — CEO at BrightSpark Energy — Customer/Website — niamh@brightspark.ie — 4d ago
2. Grainne Ni Riain — Operations Lead — Lead/Event — grainne@greenbuild.ie — Never
3. Tom Henderson — Owner — Prospect/Referral — tom@hendersonsolar.ie — Never
4. Eoin Ryan — MD at NorthWest Renewables — Lead/Website — eoin@nwenewables.ie — Apr 2, 2026
5. Aoife Kelly — Owner at Galway Green Energy — Lead/Event — aoife@galwaygreen.ie — 2d ago
6. Lisa Chen — Homeowner — Lead/Website — lisa.chen@gmail.com — Never
7. Declan Murphy — Founder at Midland Solar — Prospect/Cold — declan@midlandsolar.ie — Apr 3, 2026
8. Rachel McCarthy — Director at Photon Electrical — Prospect/LinkedIn — rachel@photonelectrical.ie — Apr 6, 2026
9. Ciara Byrne — Operations Manager at SunPower Ireland — Customer/Referral
10. Patrick O'Sullivan — MD at SunPower Ireland — Customer/LinkedIn
11. Sean Doyle — Sales Director at SouthEast Solar — Customer/Referral
12. Michael Fitzgerald — Tech Director at Cork Solar Solutions — Prospect/Website

**Each card**: Avatar (initials), name, title/company, colored status tags, email, phone, last activity, action icons (email, call, note)

### Interactive Elements
- "Add Contact" button
- Search bar with filters
- Grid/list view toggle
- Contact card actions (email, call, note)
- FAB star button

---

## 5. Installers (`qa-installers.png`)

### Page Name
Installers — Solar installation partner network management

### Layout Structure
- **Left Sidebar** (~240px): Standard navigation, Installers highlighted
- **Main Content**: Header + stats grid + search/filters + installer cards

### Color Scheme
- Background: Deep charcoal (#121212)
- Cards: Dark gray (#1F2937)
- Accent: Yellow (#FFD700), Teal (#10B981) for success
- Plan colors: Yellow (Starter), Purple (Pro), Blue (Enterprise)

### UI Components & Data
**Stats Row 1 (6 cards)**:
1. Total Installers: **3**
2. Active Subscriptions: **3**
3. Monthly Recurring Revenue: **€1,229**
4. Onboarding Rate: **67%**
5. Trials Expiring: **0**
6. Avg Project Value: **€19,500**

**Stats Row 2 (7 items)**:
- Plan Breakdown: Donut chart (Starter 1, Pro 1, Enterprise 1)
- Counties Covered: **10**
- SEAI Registered: **3** (100%)
- RECI Registered: **3** (100%)
- Avg Team Size: **13**
- New (30 days): **3**
- Monthly Installs: **0**

**Search & Filters**: Search bar, "All Plans" / "Onboarding" / "All Counties" filter buttons, Advanced Filters dropdown

**View Toggle**: Grid (active/yellow), Table, Map

**Installer Cards (3)**:
1. SouthEast Solar — 100% progress — Enterprise (purple badge)
2. BrightSpark Energy — 91% progress — Starter (gray badge)
3. SunPower Ireland — 100% progress — Pro (yellow badge)

### Interactive Elements
- "Add Installer" button
- Search, filters, view toggle (Grid/Table/Map)
- Installer cards (clickable)
- Export CSV, Bulk Actions buttons
- Pagination ("Showing 3 of 3")
- FAB star button

---

## 6. Meetings / Calendar (`qa-meetings.png`)

### Page Name
Calendar — Meeting scheduling and management

### Layout Structure
- **Left Sidebar** (~200px): Standard navigation, Calendar highlighted in yellow
- **Center**: Calendar grid (month view)
- **Right Sidebar** (~300px): Upcoming meetings list

### Color Scheme
- Background: Deep charcoal (#1a1a1a)
- Text: White / light gray
- Accent: Yellow for active/selected
- Event colors: Blue (review), Green (site visit), Purple (workshop/discussion)

### UI Components & Data
**Stats (5 cards)**:
1. Total Meetings: **10**
2. This Week: **6**
3. Today's Meetings: **3**
4. Avg Duration: **75m**
5. Completion Rate: **30%**

**Calendar Controls**: "New Meeting" yellow button, Month/Week/Day/Agenda tabs, Today button, navigation arrows, filters (All Statuses, All Types, All Contacts)

**Calendar Grid**: April 2026, MON-SUN headers
- Apr 13: Yellow circle, multiple events
- Apr 10: "Quarterly Business Review" (blue)
- Apr 11: "Sustainable Homes Site Visit" (green) + "EcoWind Strategy Workshop" (purple)
- Apr 14: "Lisa Chen - Solar Quote Discussion" (purple) + "EV Charge Network Kickoff" (green)
- Apr 16: "Atlantic Energy Audit Follow-up" (purple)
- Apr 20: "BioGreen Marketing Review" (blue)

**Right Sidebar — Upcoming Meetings (4)**:
1. Lisa Chen - Solar Quote Discussion — 10:00, Tue 14 Apr (purple border)
2. EV Charge Network Kickoff — 15:00, Tue 14 Apr (green border)
3. Atlantic Energy Audit Follow-up — 11:00, Thu 16 Apr (purple border)
4. BioGreen Marketing Review — 09:30, Mon 20 Apr (blue border)

### Interactive Elements
- "New Meeting" button
- Month/Week/Day/Agenda view tabs
- Today button, navigation arrows
- Calendar date cells (clickable)
- Filter dropdowns
- Upcoming meeting entries

---

## 7. Settings (`qa-settings.png`)

### Page Name
Settings (Original) — Integration management overview

### Layout Structure
- **Left Sidebar** (~200px): Standard navigation, Settings highlighted in yellow
- **Main Content**: Header + status cards + Stripe integration panel

### Color Scheme
- Background: Black (#121212)
- Panels: Dark gray (#1E1E1E / #2A2A2A)
- Accent: Yellow (#FCD34D), Blue (#6366F1) for Stripe, Purple (#8B5CF6) for Stripe branding
- Status: Green (connected), Orange (needs attention), Gray (disconnected)

### UI Components & Data
**Header**: "Settings" with "1/5 configured" green dot + refresh icon

**Status Cards (3)**:
1. Connected: **1** (green checkmark)
2. Needs Attention: **0** (orange warning)
3. Disconnected: **4** (gray X)

**Stripe Integration Card**:
- Purple Stripe logo, "Stripe" title, "Disconnected" badge
- Description: "Process subscription payments, manage customer billing, and handle invoices through Stripe Connect..."
- Warning: "Secret key not configured"
- Form fields: Secret Key (sk_live_...), Webhook Secret (whsec_...) — with eye/copy icons
- Credentials Configuration collapsible section
- Buttons: "Connect Stripe" (blue) + "Docs" (gray)

### Interactive Elements
- Refresh icon
- Stripe card expand/collapse
- Secret key show/hide toggles
- Copy buttons
- "Connect Stripe" / "Docs" buttons
- FAB star button

---

## 8. Settings — Team (`qa-settings-team.png`)

### Page Name
Settings → Team — Team member management and invitations

### Layout Structure
- **Left Sidebar** (~240px): Standard navigation
- **Settings Submenu**: Search + 9 categories (Team active in yellow)
- **Right Panel**: Team members table + invite form + role permissions

### Color Scheme
- Background: Black (#121212)
- Panels: Dark gray (#1E1E1E)
- Accent: Yellow (#FFD700)
- Role badges: Yellow (Admin), Blue (Manager), Green (Sales Rep), Orange (Installer)
- Status: Green (Active), Orange (Invited)

### UI Components & Data
**Settings Submenu**: Overview, Integrations, Analytics, Social Media, API & Webhooks, General, Notifications, **Team** (active), Data & Privacy, Help section

**Team Members Table (5 members)**:
1. Sarah O'Brien — Admin — Active — Just now
2. Eoin Ryan — Manager — Active — 10 minutes ago
3. Ciara Byrne — Sales Rep — Active — 1 hour ago
4. Patrick O'Sullivan — Installer — Invited — Never
5. Niamh O'Connor — Sales Rep — Active — 3 hours ago

**Invite Team Member Form**: Email input, Role dropdown (Sales Rep), "Send Invite" yellow button

**Role Permissions**: Dropdown selectors for Admin and Manager roles

### Interactive Elements
- Settings search bar
- Settings submenu navigation
- Team member rows (manage/edit)
- Invite form (email + role + submit)
- Role permission dropdowns
- "View Docs" help button
- FAB star button

---

## 9. Settings — Overview (`qa-settings-overview.png`)

### Page Name
Settings → Overview — System health and configuration summary

### Layout Structure
- **Left Sidebar** (~220px): Standard navigation
- **Tab Navigation**: Overview (active), Integrations, Analytics, Social Media, Account, Security
- **Main Content**: Health dashboard cards grid

### Color Scheme
- Background: Deep charcoal (#1a1a1a)
- Accent: Yellow (#ffd700)
- Health: Red (#ff3333) for 11%, Green for connected
- Badge: Red "11% healthy"

### UI Components & Data
**Header**: "Settings" with red "11% healthy" badge, "1/14 configured" green dot + refresh

**Tab Navigation**: Overview, Integrations, Analytics, Social Media, Account, Security

**Dashboard Grid (7 cards)**:
1. System Health: Red ring 11% — "1 of 14 services connected"
2. Connected: **1** (green checkmark)
3. Configured: **0** (orange warning)
4. Not Set Up: **13** (gray X)
5. Billing: **0** (purple wallet)
6. Analytics: **0** (orange chart)
7. Social Media: **0** (blue megaphone)

### Interactive Elements
- Settings tabs
- Refresh icon
- FAB star button

---

## 10. Settings — Account (`qa-settings-account.png`)

### Page Name
Settings → Account — Profile and personal information management

### Layout Structure
- **Left Sidebar** (~200px): Standard navigation
- **Tab Navigation**: Overview, Integrations, Analytics, Social Media, **Account** (active), Security
- **Main Content**: Profile form

### Color Scheme
- Background: Charcoal (#121212)
- Panels: Dark gray (#1A1A1A / #2A2A2A)
- Accent: Yellow (#FFD700), Red (#DC2626) for health badge
- Input fields: Dark gray (#2A2A2A) background

### UI Components & Data
**Header**: "Settings" with red "11% healthy" badge, "1/14 configured" green dot + refresh

**Profile Form** (2x2 grid):
- Full Name: "Sarah O'Brien"
- Email Address: "admin@renewably.ie"
- Phone Number: "+353 1 234 5678"
- Company Name: "Renewably"
- Timezone: (empty)
- Language: (empty)

### Interactive Elements
- Settings tabs
- Form input fields (editable)
- FAB star button

---

## 11. Settings — Analytics (`qa-settings-analytics.png`)

### Page Name
Settings → Analytics — Google Analytics GA4 configuration

### Layout Structure
- **Left Sidebar** (~180px): Standard navigation
- **Settings Submenu**: 9 categories + Help section, Analytics active in yellow
- **Right Panel**: Google Analytics GA4 card with connection config + tracking toggles

### Color Scheme
- Background: Black (#121212)
- Panels: Dark gray (#1E1E1E)
- Accent: Yellow (#FFD700)
- Status: Green (Connected)

### UI Components & Data
**Google Analytics GA4 Card**:
- Blue chart icon, "Google Analytics GA4" title
- Status: Green dot + "Connected" — "Last event received: 2 minutes ago"

**Connection Configuration** (5 fields):
1. Measurement ID: G-8X7K2M9PIR
2. Google Analytics API Key: AlzaSy... (truncated)
3. Google Analytics Client Email: analytics@renewably-iam.iam.gserviceaccount.com
4. Property ID: 321456789
5. Google Analytics Private Key: -----BEGIN PRIVATE KEY----- (truncated)

**Tracking Behaviour** (4 toggles):
1. Enable page view tracking — ON (yellow)
2. Enable event tracking — ON (yellow)
3. Enable conversion tracking — OFF (gray)
4. Enable user behaviour tracking — OFF (gray)

**Custom Events** section (partially visible)

### Interactive Elements
- Settings submenu navigation
- Eye icons (show/hide secrets)
- Toggle switches for tracking features
- FAB star button

---

## 12. Settings — Integrations (`qa-settings-integrations.png`)

### Page Name
Settings → Integrations — Third-party integration management

### Layout Structure
- **Left Sidebar** (~220px): Standard navigation
- **Tab Navigation**: Overview, **Integrations** (active), Analytics, Social Media, Account, Security
- **Main Content**: Core Integrations section with Stripe card

### Color Scheme
- Background: Black (#121212)
- Panels: Dark gray (#1E1E1E)
- Accent: Yellow, Purple for Stripe branding
- Tab active: White text, purple icon

### UI Components & Data
**Header**: "Settings" with red "11% healthy" badge, "1/14 configured" green dot + refresh

**Core Integrations Section**: "Connect your essential business tools and services" with search bar

**Stripe Integration Card**:
- Purple Stripe logo (32x32px), "Stripe" title
- "Not Set Up" badge
- "Billing & Payments" subtitle
- Description text
- Chevron expand/collapse

### Interactive Elements
- Settings tabs
- Integration search bar
- Stripe card (expandable)
- FAB star button

---

## 13. Settings — Security (`qa-settings-security.png`)

### Page Name
Settings → Security — Account security and session management

### Layout Structure
- **Left Sidebar** (~200px): Standard navigation
- **Tab Navigation**: Overview, Integrations, Analytics, Social Media, Account, **Security** (active)
- **Main Content**: Security settings + active sessions

### Color Scheme
- Background: Deep charcoal (#1a1a1a / #151515)
- Accent: Green (#00d084) for primary actions, Red (#e53e3e) for alerts, Yellow (#ffd700) for highlights
- Panels: Dark gray (#222222)

### UI Components & Data
**Two-Factor Authentication Card**:
- Red shield icon
- Title: "Two-Factor Authentication"
- Description: "Add an extra layer of security to your account with an authenticator app."
- Button: "Enable 2FA" (bright green)

**Active Sessions Section**:
- Title: "Active Sessions"
- Subtitle: "Devices currently signed in to your account"
- Content area (partially visible)

### Interactive Elements
- Settings tabs
- "Enable 2FA" button
- Active sessions management
- FAB star button

---

## 14. Settings — Social Media (`qa-settings-social.png`)

### Page Name
Settings → Social Media — Social platform integrations

### Layout Structure
- **Left Sidebar** (~220px): Standard navigation
- **Settings Submenu**: 9 categories + Help, Social Media active in yellow
- **Right Panel**: Social media integrations grid (2x2 + TikTok)

### Color Scheme
- Background: Black (#121212)
- Panels: Dark gray (#1E1E1E / #2A2A2A)
- Accent: Yellow (#FFD700)
- Status: Green (Connected), Gray (Disconnected)
- Platform colors: Blue (Facebook, Twitter/X, LinkedIn), Red (Instagram), Black (TikTok)

### UI Components & Data
**Social Media Integration Cards (5)**:
1. Facebook — **Disconnected** (gray dot)
2. Instagram — **Connected** (green dot) — @renewably_solar — "Last post sync: 5 minutes ago"
3. Twitter / X — **Disconnected** (gray dot)
4. LinkedIn — **Disconnected** (gray dot)
5. TikTok — **Disconnected** (gray dot)

**Each card**: Platform logo + name + status + dropdown arrow

### Interactive Elements
- Settings submenu navigation
- Platform card dropdowns
- Connect/disconnect actions
- "View Docs" help button
- FAB star button

---

## 15. Settings — Rebuilt (`qa-settings-rebuilt.png`)

### Page Name
Settings → Overview (Rebuilt) — Comprehensive integration dashboard

### Layout Structure
- **Left Sidebar** (~200px): Standard navigation
- **Settings Submenu**: 9 categories + Help, Overview active in yellow
- **Main Content**: Stats cards + integration health grid + recent activity + quick actions

### Color Scheme
- Background: Charcoal (#121212)
- Panels: Dark gray (#1F2937)
- Accent: Yellow (#FCD34D)
- Status: Green (active), Orange (warning), Gray (not configured)

### UI Components & Data
**Dashboard Overview Cards (4)**:
1. **3** Connected (green checkmark)
2. **1** Needs Attention (orange warning)
3. **6** Disconnected (gray X)
4. **1,247** API Calls Today (blue chart)

**Integration Health Grid (10 integrations)**:
- Stripe: Active — 2 minutes ago
- Postmark: Active — 5 minutes ago
- Claude/Anthropic: Active — 1 minute ago
- Google Workspace: Warning — 1 hour ago
- AI Assistant: Active — Just now
- Slack: Not configured
- HubSpot: Not configured
- Zapier: Not configured
- Calendly: Not configured
- Twilio: Not configured

**Recent Activity** (5 items):
1. Connected Stripe payment processing — 2 minutes ago (green)
2. Updated Google Analytics GA4 config — 15 minutes ago (blue)
3. Claude AI assistant rate limit increased — 1 hour ago (blue)
4. Google Workspace calendar sync paused — 2 hours ago (orange)
5. New API key created: Mobile App (green)

**Quick Actions**:
- Test All Connections (yellow refresh icon)
- Export Config (yellow download icon)
- View API Logs (yellow document icon)

### Interactive Elements
- Settings submenu navigation
- Integration cards (expandable)
- Quick action buttons
- FAB star button

---

## 16. Proposals (`qa-proposals.png`)

### Page Name
Proposals — Proposal creation, tracking, and management

### Layout Structure
- **Left Sidebar** (~200px): Standard navigation
- **Main Content**: Header + stats + search/filter + proposal cards grid

### Color Scheme
- Background: Black (#000000)
- Sidebar: Dark gray (#1E1E1E)
- Accent: Yellow (#FFD700)
- Status bar colors: Gray (Draft), Blue (Sent), Orange (Viewed), Green (Accepted), Red (Rejected)

### UI Components & Data
**Header**: "Proposals" + "Create, send, and track your proposals" + "New Proposal" yellow button

**Stats (4 cards)**:
1. Total Proposals: **5**
2. Total Value: **€122,000**
3. Accepted: **1**
4. Acceptance Rate: **50%**

**Search & Filter**: "Search proposals..." bar, "All Statuses" dropdown

**Proposal Cards (5)**:
1. **Draft** (gray bar): "CleanHeat Digital Strategy Proposal" — €22,000 — Declan Murphy / Midland Solar / Pro Plan — 13 Apr 2026 — 4 items
2. **Sent** (blue bar): "Sustainable Homes SEO Campaign" — €18,000 — Aoife Kelly / Galway Green Energy / Starter Plan — 13 Apr 2026 — 4 items
3. **Viewed** (orange bar): "SolarStream Partnership Marketing" — €50,000 — Rachel McCarthy / Photon Electrical / Pro Plan — 13 Apr 2026 — 4 items
4. **Accepted** (green bar): "EcoWind Website Redesign" — €23,500 — Michael Fitzgerald / Cork Solar Solutions / Pro Plan — 13 Apr 2026 — 5 items
5. **Rejected** (red bar): "Lisa Chen - Residential Solar Lead Gen" — €8,500 — Lisa Chen / Starter Plan — 13 Apr 2026 — 4 items

### Interactive Elements
- "New Proposal" button
- Search bar
- Status filter dropdown
- Proposal cards (clickable)
- FAB star button

---

## 17. Invoices (`qa-invoices.png`)

### Page Name
Invoices — Invoice creation and payment tracking

### Layout Structure
- **Left Sidebar** (~200px): Standard navigation
- **Main Content**: Header + stats + search/filter + empty state

### Color Scheme
- Background: Black (#121212)
- Panels: Dark gray (#1E1E1E)
- Accent: Yellow (#FFD700)
- Status colors: Orange (Outstanding), Red (Overdue), Green (Paid)

### UI Components & Data
**Header**: "Invoices" + "Manage invoices and track payments"

**Stats (4 cards)**:
1. Total Invoiced: **£0**
2. Outstanding: **£0** (orange)
3. Overdue: **£0** (red)
4. Paid This Month: **£0** (green)

**Action Bar**: Search bar "Search invoices...", "All Statuses" dropdown, "Create Invoice" yellow button

**Empty State**: Faded invoice icon, "No invoices found", "Create your first invoice to get started"

### Interactive Elements
- "Create Invoice" button
- Search bar
- Status filter dropdown
- FAB star button

---

## 18. Reports & Analytics (`qa-reports.png`)

### Page Name
Reports & Analytics — Advanced reporting and revenue forecasting

### Layout Structure
- **Left Sidebar** (~15% width): Standard navigation
- **Main Content**: Header + metrics + revenue forecast chart + monthly comparison + pipeline by stage + conversion funnel

### Color Scheme
- Background: Deep charcoal (#1a1a1a)
- Accent: Yellow (buttons, key metrics)
- Chart colors: Yellow (actual), Blue (projected), Green (confidence band)
- Funnel: Light blue → Blue → Yellow → Orange → Green → Red

### UI Components & Data
**Header**: "Reports & Analytics" + controls: "This Month" dropdown, "Export" button, "Save Report" yellow button

**Key Metrics (4 cards)**:
1. Total Revenue: **€42,490** — +100% vs last month
2. Pipeline Value: **€78,980**
3. Win Rate: **75%** — +100% vs last month
4. Avg Deal Size: **€13,647**

**Revenue Forecast**: "Expected this quarter: €80,254"
- Chart: May 25–Apr 26 x-axis, €0k–€20k y-axis
- Lines: Actual Revenue (yellow), Projected (blue), Confidence Band (green area)

**Monthly Comparison (4 rows)**:
1. Revenue: €42,490 vs €0 — +100%
2. Deals Won: 3 vs 0 — +100%
3. New Deals: 3 vs 0 — +100%
4. Activities: 10 vs 0 — +100%

**Pipeline by Stage** (horizontal bars):
- Lead: €21,000
- Qualified: €30,000
- Proposal: €21,490
- Negotiation: €6,490

**Conversion Funnel** (6 stages):
1. Lead: 1 deal, €21,000
2. Qualified: 2 deals, €30,000 (+100% growth)
3. Proposal: 2 deals, €21,490
4. Negotiation: 1 deal, €6,490 (-50% drop-off)
5. Won: 3 deals, €42,490 (+200% growth)
6. Lost: 1 deal, €15,000

### Interactive Elements
- "This Month" dropdown
- "Export" button
- "Save Report" button
- Charts (interactive tooltips)
- FAB star button

---

## 19. Workflows / Automations (`qa-workflows.png`)

### Page Name
Automations — Workflow rules and automation management

### Layout Structure
- **Left Sidebar** (~180px): Standard navigation
- **Main Content**: Header + stats + module coverage + automation rules list

### Color Scheme
- Background: Black (#121212) / Dark gray (#1E1E1E / #1F1F1F)
- Accent: Yellow (#FFD700)
- Stat backgrounds: Dark green (#0F4C3A), Dark blue (#1E3A5F), Dark gray (#2A2A2A)
- Toggle: Yellow when ON

### UI Components & Data
**Header**: "Automations" — "8 active rules · 60 total executions" — "History" + "New Rule" buttons

**Stats (4 cards)**:
1. Active Rules: **8** (dark green bg)
2. Inactive Rules: **0** (dark gray bg)
3. Total Runs: **60** (dark green bg)
4. Trigger Types: **13** (dark blue bg)

**Module Coverage**: "6 / 7 modules automated"
- Deals (automated), Contacts (automated), Tasks (automated), Proposals (automated), **Meetings** (NOT automated — dark gray), Invoices (automated), Payments (automated)

**Automation Rules (8 rules, all active)**:
1. Payment received log — "When a payment is received" — ON
2. Auto-meeting for new deals — "When a new deal is created" — ON
3. Invoice overdue follow-up — "When invoice is 7+ days past due date" — ON
4. Won deal cleanup — "When deal moves to 'Won' stage" — ON
5. Escalate overdue tasks — "When task is overdue by 2+ days" — ON
6. Proposal follow up — "When proposal status changes to 'sent'" — ON
7. Welcome new contacts — "When a new contact is created" — ON
8. Auto-follow up cold deals — "When deal moves to 'Proposal' stage" — ON

**Each rule**: Colored dot (green/red), module icon, trigger tag, description, toggle switch, settings/play/delete icons

### Interactive Elements
- "History" button
- "New Rule" button (dark blue)
- Toggle switches (enable/disable rules)
- Settings, play, delete icons per rule
- FAB star button

---

## Summary

### Pages Analyzed: 19
### CRM Platform: Solar CRM / SolarFlow / Renewably / Installably (brand name varies across screenshots)
### Theme: Dark mode (black #121212 background)
### Primary Accent: Yellow (#FFD700 / #FFC107 / #FCD34D)
### User: Sarah O'Brien (admin)

### Page Inventory
| # | Page | Screenshot | Status |
|---|------|-----------|--------|
| 1 | Dashboard | qa-dashboard.png | ✅ Detailed |
| 2 | Pipeline | qa-pipeline.png | ✅ Detailed |
| 3 | Tasks | qa-tasks.png | ✅ Detailed |
| 4 | People/Contacts | qa-contacts.png | ✅ Detailed |
| 5 | Installers | qa-installers.png | ✅ Detailed |
| 6 | Calendar/Meetings | qa-meetings.png | ✅ Detailed |
| 7 | Settings (Original) | qa-settings.png | ✅ Detailed |
| 8 | Settings → Team | qa-settings-team.png | ✅ Detailed |
| 9 | Settings → Overview | qa-settings-overview.png | ✅ Detailed |
| 10 | Settings → Account | qa-settings-account.png | ✅ Detailed |
| 11 | Settings → Analytics | qa-settings-analytics.png | ✅ Detailed |
| 12 | Settings → Integrations | qa-settings-integrations.png | ✅ Detailed |
| 13 | Settings → Security | qa-settings-security.png | ✅ Detailed |
| 14 | Settings → Social Media | qa-settings-social.png | ✅ Detailed |
| 15 | Settings → Overview (Rebuilt) | qa-settings-rebuilt.png | ✅ Detailed |
| 16 | Proposals | qa-proposals.png | ✅ Detailed |
| 17 | Invoices | qa-invoices.png | ✅ Detailed |
| 18 | Reports & Analytics | qa-reports.png | ✅ Detailed |
| 19 | Automations/Workflows | qa-workflows.png | ✅ Detailed |
