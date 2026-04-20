// Polyfill: Turbopack miscompiles framer-motion's internal reducedMotion context,
// causing ReferenceError in 30+ files. This global var prevents the crash.
// Loaded via <script src="/scripts/polyfills.js"> in layout.tsx
window.reducedMotion = 'never';
