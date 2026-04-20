# Task 2A-2F: Design Polish — Spacing, Responsive Tweaks, UI Consistency

## Work Record

### Files Modified

#### CSS (`src/app/onboarding/onboarding.css`)
- **Responsive breakpoints**: Rewrote the responsive section with comprehensive classes:
  - Tablet (769-1024px): `.ob-hero-grid` stacks, `.ob-plans` becomes 2-col
  - Mobile (≤768px): All 2-col/3-col grids collapse to 1-col via `!important`
  - Extra small (≤480px): Counties go 1-col, smaller fonts, tighter tags
  - New classes: `ob-main-container`, `ob-main-container-landing`, `ob-hero-grid`, `ob-hero-title`, `ob-hero-desc`, `ob-value-props`, `ob-demo-grid`, `ob-booking-bar`, `ob-confirmed-grid`, `ob-confirmed-meta`, `ob-grid-billing`, `ob-grid-intsec`, `ob-territory-grid`, `ob-territory-reach`, `ob-doc-row`, `ob-doc-pp`, `ob-integ-row`, `ob-integ-fee`, `ob-integ-summary`, `ob-portal-handoff`, `ob-stepper`, `ob-stepper-label`, `ob-social-tags`
- **Focus styles**: Enhanced `input:focus-visible` with `outline` and `box-shadow` for checkboxes, radio buttons, range sliders
- **Demo badge**: New `.ob-demo-badge` class with pulsing dot indicator
- **Placeholder note**: New `.ob-placeholder-note` class for demo card indicator

#### UI Primitives (`src/components/onboarding/ui/primitives.tsx`)
- Card default padding: `16` → `18` (standardized)

#### OnboardingApp.tsx
- Added `ob-top-bar` class to sticky header
- Added `ob-top-bar-inner` class to inner flex container
- Added `ob-main-container` / `ob-main-container-landing` classes to main container
- Added `ob-step-card` class to motion.div wrapper
- Added `ob-footer` class to footer bar
- Added `.ob-demo-badge` "Demo" badge in top bar

#### Stepper.tsx
- Added `ob-stepper` class to root
- Added `ob-stepper-label` class to step labels (hidden on mobile)
- Added `aria-current="step"` on active step node

#### Landing.tsx
- Added `ob-landing`, `ob-hero-grid`, `ob-hero-title`, `ob-hero-desc`, `ob-value-props`, `ob-social-tags` classes

#### StepCompany.tsx
- Added `ob-grid-2` classes to all 2-column grid containers (4 grids)

#### StepFinancial.tsx
- Added `ob-plans` to plan cards grid
- Added `ob-grid-2` to billing cycle grid
- Added `ob-grid-2` to VAT+email grid
- Added `ob-county-grid` to City/County/Eircode grid
- Added `ob-finance-grid` to card+order summary grid
- Added `ob-grid-3` to Expiry/CVC/Country grid
- Fixed missing VAT number field in sub-step 2
- Added `ob-placeholder-note` "Demo card — no real payment" under card number
- Added `aria-label` to demo card input

#### StepTechnical.tsx
- Added `ob-team-row` class to team member rows
- Added `ob-grid-intsec` class to integrations+security grid
- Standardized card padding to 18 (removed explicit `padding: 16` from 3 cards)

#### StepWelcome.tsx
- Added `ob-resources` class to resource cards grid
- Added `ob-metrics` class to success metrics grid
- Standardized card padding (removed explicit padding overrides)

#### BookDemo.tsx
- Added `ob-demo-grid` to calendar+details grid
- Added `ob-grid-2` to company+phone, role+team, focus option grids
- Added `ob-grid-3` to time slots grid
- Added `ob-booking-bar` class to summary bar
- Added `ob-confirmed-grid`, `ob-confirmed-meta` classes
- Added `aria-label` to calendar date buttons
- Standardized card padding (removed `padding: 20`, `padding: 16` overrides)

#### StepComplete.tsx
- Added `ob-portal-handoff` class to portal handoff card
- Added `ob-stats-grid` class to stats tiles grid
- Standardized card padding (14 → 18, removed explicit 16)

#### StepTerritory.tsx
- Added `ob-territory-grid` class to provinces+reach grid
- Added `ob-territory-reach` class to reach card
- Standardized card padding (14 → 18, removed explicit 16)

#### StepIntegrations.tsx
- Added `ob-integ-row` class to integration list rows
- Added `ob-integ-fee` class to fee column
- Added `ob-integ-summary` class to summary grid

#### StepLegal.tsx
- Added `ob-doc-row` class to document list rows
- Added `ob-doc-pp` class to page count (hidden on mobile)

## Summary of Changes by Category

### 2A Responsive Design
- All multi-column grids now collapse to single column on mobile via CSS classes + `!important` overrides
- Global main container padding reduces from 32px to 16px on mobile
- Step card padding reduces on mobile
- Stepper labels hide on mobile
- Hero section stacks on mobile with smaller title
- Value props stack vertically on mobile
- Top bar inner content stacks on mobile
- Book demo 2-col layout stacks on mobile
- Legal doc rows hide page count on mobile
- Integration rows hide fee column on mobile

### 2B Spacing Consistency
- Card default padding standardized to 18px (was 16)
- Removed explicit `padding: 14`, `padding: 16`, `padding: 20` from individual cards
- Section gaps maintained at `marginBottom: 18`

### 2C Input Focus States
- Enhanced CSS focus styles for inputs, buttons, checkboxes, radio buttons, and range sliders
- Added `focus-visible` with `outline` and `box-shadow` for checkboxes and radios

### 2D Transition Polish
- `fade-up` animation already existed with proper `fadeUp` keyframes
- Step transitions already use framer-motion `AnimatePresence`

### 2E Loading/Empty States
- Added "Demo card — no real payment" note below card number field in Finance step 3
- Added "Demo" badge in the top bar with pulsing indicator

### 2F Accessibility
- Added `aria-current="step"` on active stepper node
- Added `aria-label` to calendar date buttons
- Added `aria-label` to demo card input
- Enhanced checkbox and radio focus-visible styles with visible rings
