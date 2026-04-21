'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import './onboarding.css';
import { Stepper, Backdrop } from '@/components/onboarding/data';
import { Badge } from '@/components/onboarding/ui';
import { Landing } from '@/components/onboarding/steps-landing';
import { StepAccount } from '@/components/onboarding/steps-account';
import { StepCompany } from '@/components/onboarding/steps-company';
import { StepTerritory } from '@/components/onboarding/steps-territory';
import { StepIntegrations } from '@/components/onboarding/steps-tools';
import { StepLegal } from '@/components/onboarding/steps-legal';
import { StepFinancial } from '@/components/onboarding/steps-finance';
import { StepTechnical } from '@/components/onboarding/steps-tech';
import { StepWelcome } from '@/components/onboarding/steps-welcome';
import { StepComplete } from '@/components/onboarding/steps-complete';
import { BookDemo } from '@/components/onboarding/book-demo';

interface FormData {
  // Account (step 1)
  email?: string;
  password?: string;

  // Company (step 2)
  company_name?: string;
  contact_name?: string;
  phone?: string;
  vat?: string;
  address?: string;
  city?: string;
  eircode?: string;
  size?: string;
  founded?: string;

  // Territory (step 3)
  counties?: string[];

  // Tools (step 4)
  connectedIds?: string[];
  setupTotal?: number;

  // Legal (step 5)
  signedDocs?: Record<string, boolean>;

  // Finance (step 6)
  plan?: string;
  billing?: string;
  vat_number?: string;
  invoice_email?: string;
  billing_address?: string;
  billing_city?: string;
  billing_county?: string;
  billing_eircode?: string;

  // Tech (step 7)
  team?: Array<{ name: string; email: string; role: string }>;
  tech_integrations?: string[];
  security_features?: string[];
  data_retention?: number;

  // Training (step 8)
  leads_target?: number;
  installs_target?: number;
  revenue_target?: number;

  // Demo booking (step -1)
  demo_date?: string;
  demo_time?: string;
  demo_focus?: string[];
  demo_company_size?: string;
  demo_role?: string;
  demo_name?: string;
  demo_email?: string;
  demo_phone?: string;
  demo_company?: string;

  [key: string]: unknown;
}

type SubmissionStatus = 'idle' | 'loading' | 'success' | 'error';

// ─── Progress persistence helpers ────────────────────────────────────────

const PROGRESS_KEY = 'sp:email';

function getSavedEmail(): string | null {
  try {
    return localStorage.getItem(PROGRESS_KEY);
  } catch { return null; }
}

function setSavedEmail(email: string) {
  try { localStorage.setItem(PROGRESS_KEY, email); } catch { /* ignore */ }
}

function clearSavedEmail() {
  try { localStorage.removeItem(PROGRESS_KEY); } catch { /* ignore */ }
}

function loadStepFromStorage(): number {
  try {
    const s = parseInt(localStorage.getItem('sp:step') || '0');
    return isFinite(s) ? s : 0;
  } catch { return 0; }
}

// ─── Simplified nav for onboarding ───────────────────────────────────
const siteLinks = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About Us' },
  { href: '/workforce', label: 'Workforce' },
  { href: '/blog', label: 'Blog' },
  { href: '/contact', label: 'Contact Us' },
];

function OnboardingNav({ step }: { step: number }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const isActive = step > 0 && step <= 8;
  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 20,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 32px', height: 56,
      background: 'oklch(0.16 0.005 80 / 0.85)', backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--line-soft)',
    }}>
      {/* Desktop links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }} className="ob-nav-links">
        {siteLinks.map((link) => (
          <Link key={link.href} href={link.href} style={{
            padding: '6px 14px', borderRadius: 6,
            fontSize: 12.5, fontWeight: 500, color: 'var(--ink-3)',
            textDecoration: 'none', letterSpacing: '-0.005em',
            transition: 'color 140ms ease, background 140ms ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--ink)'; e.currentTarget.style.background = 'var(--bg-2)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--ink-3)'; e.currentTarget.style.background = 'transparent'; }}
          >
            {link.label}
          </Link>
        ))}
      </div>

      {/* Right side: trial badge + help (when onboarding is active) */}
      {isActive && (
        <div className="ob-top-bar-inner" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Badge tone="solar">
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--solar)' }} />
            Trial · 14 days
          </Badge>
          <div className="mono" style={{ fontSize: 11, color: 'var(--ink-4)', letterSpacing: '0.04em' }}>
            Need help? <span style={{ color: 'var(--ink-2)', textDecoration: 'underline' }}>hello@renewably.ie</span>
          </div>
        </div>
      )}

      {/* Mobile hamburger (hidden when trial badge is showing on desktop) */}
      <button type="button" onClick={() => setMobileOpen(!mobileOpen)} className="ob-nav-mobile-btn" aria-label="Menu" style={{
        display: isActive ? 'none' : 'none', background: 'none', border: '1px solid var(--line-soft)', borderRadius: 8,
        padding: '7px 10px', cursor: 'pointer', color: 'var(--ink-3)',
      }}>
        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          {mobileOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 6L6 18M6 6l12 12" />
          ) : (
            <><path strokeLinecap="round" d="M4 6h16" /><path strokeLinecap="round" d="M4 12h16" /><path strokeLinecap="round" d="M4 18h16" /></>
          )}
        </svg>
      </button>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0,
          background: 'var(--bg-1)', borderBottom: '1px solid var(--line-soft)',
          padding: '8px 16px 12px', display: 'flex', flexDirection: 'column', gap: 2,
        }}>
          {siteLinks.map((link) => (
            <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)} style={{
              padding: '10px 12px', borderRadius: 6, fontSize: 13, fontWeight: 500,
              color: 'var(--ink-3)', textDecoration: 'none',
            }}>
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}

function DevJumper({ step, setStep }: { step: number; setStep: (s: number) => void }) {
  const [open, setOpen] = useState(false);
  const labels = ['Landing', 'Account', 'Company', 'Territory', 'Tools', 'Legal', 'Finance', 'Tech', 'Training', 'Complete'];
  return (
    <div style={{ position: 'fixed', bottom: 16, right: 16, zIndex: 30 }}>
      {open && (
        <div style={{
          position: 'absolute', bottom: 44, right: 0,
          background: 'var(--bg-2)', border: '1px solid var(--line)',
          borderRadius: 10, padding: 8, minWidth: 180,
          boxShadow: '0 16px 40px -8px rgba(0,0,0,0.5)',
        }}>
          <div className="mono" style={{ fontSize: 9.5, color: 'var(--ink-4)', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '4px 8px 8px' }}>
            Jump to step
          </div>
          {labels.map((l, i) => (
            <button key={i} type="button" onClick={() => { setStep(i); setOpen(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                width: '100%', padding: '7px 8px', textAlign: 'left',
                background: step === i ? 'var(--bg-3)' : 'transparent',
                border: 'none', borderRadius: 5, cursor: 'pointer',
                color: step === i ? 'var(--solar)' : 'var(--ink-2)',
                fontSize: 12, fontFamily: 'inherit',
              }}>
              <span className="mono" style={{ fontSize: 10, color: 'var(--ink-5)', width: 16 }}>{String(i).padStart(2, '0')}</span>
              {l}
            </button>
          ))}
        </div>
      )}
      <button type="button" onClick={() => setOpen(o => !o)} style={{
        background: 'var(--bg-2)', border: '1px solid var(--line)',
        color: 'var(--ink-3)', borderRadius: 8,
        padding: '7px 12px', fontSize: 11, fontFamily: 'Geist Mono, monospace',
        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
        letterSpacing: '0.06em',
      }}>
        <span>STEP {String(step).padStart(2, '0')}</span>
        <span style={{ color: 'var(--ink-5)' }}>&#9662;</span>
      </button>
    </div>
  );
}

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<FormData>({});
  const [submissionStatus, setSubmissionStatus] = useState<SubmissionStatus>('idle');
  const [submissionError, setSubmissionError] = useState('');
  const [restoring, setRestoring] = useState(true);
  const [mounted, setMounted] = useState(false);
  const submittedRef = useRef(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Persist step to localStorage
  useEffect(() => {
    try { localStorage.setItem('sp:step', String(step)); } catch { /* ignore */ }
  }, [step]);

  // ─── Resume from saved progress on mount ──────────────────────────────
  useEffect(() => {
    const savedEmail = getSavedEmail();
    const localStep = loadStepFromStorage();

    // Restore step from localStorage (client-only, safe from hydration mismatch)
    if (localStep > 0 && localStep < 9) {
      setStep(localStep);
    }

    if (!savedEmail || localStep === 0 || localStep === 9) {
      setRestoring(false);
      setMounted(true);
      return;
    }

    // Attempt to load saved progress from server
    fetch(`/api/onboarding/progress?email=${encodeURIComponent(savedEmail)}`)
      .then(res => res.json())
      .then(data => {
        if (data.found && data.formData) {
          setFormData(prev => ({ ...prev, ...data.formData }));
          // Resume at the next available step (where they left off)
          const restoredStep = typeof data.step === 'number' && data.step > 0 ? data.step : localStep;
          if (restoredStep > 0 && restoredStep < 9) {
            setStep(restoredStep);
          }
        }
      })
      .catch(() => { /* Silent fail — start fresh */ })
      .finally(() => {
        setRestoring(false);
        setMounted(true);
      });
  }, []);  

  // ─── Save progress to server (debounced) ──────────────────────────────
  const saveProgressToServer = useCallback((currentStep: number, currentData: FormData) => {
    const email = currentData.email;
    if (!email || currentStep < 1 || currentStep >= 9) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      setSavedEmail(email);
      fetch('/api/onboarding/progress', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, step: currentStep, formData: currentData }),
      }).catch(() => { /* Silent fail */ });
    }, 300);
  }, []);

  const goBack = useCallback(() => {
    setStep(s => Math.max(0, s - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const saveProgress = useCallback(async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmissionStatus('loading');
    setSubmissionError('');

    try {
      const response = await fetch('/api/onboarding/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Account
          email: formData.email || '',
          password: formData.password || '',
          // Company
          company_name: formData.company_name || '',
          contact_name: formData.contact_name || '',
          phone: formData.phone || '',
          vat: formData.vat || '',
          address: formData.address || '',
          city: formData.city || '',
          eircode: formData.eircode || '',
          size: formData.size || '',
          founded: formData.founded || '',
          // Territory
          counties: formData.counties || [],
          // Tools
          connectedIds: formData.connectedIds || [],
          setupTotal: formData.setupTotal || 0,
          // Legal
          signedDocs: formData.signedDocs || {},
          // Finance
          plan: formData.plan || 'pro',
          billing: formData.billing || 'monthly',
          vat_number: formData.vat_number || '',
          invoice_email: formData.invoice_email || '',
          billing_address: formData.billing_address || '',
          billing_city: formData.billing_city || '',
          billing_county: formData.billing_county || '',
          billing_eircode: formData.billing_eircode || '',
          // Tech
          team: formData.team || [],
          tech_integrations: formData.tech_integrations || [],
          security_features: formData.security_features || [],
          data_retention: formData.data_retention || 24,
          // Training
          leads_target: formData.leads_target || 30,
          installs_target: formData.installs_target || 12,
          revenue_target: formData.revenue_target || 65000,
          // Demo booking
          demo_date: formData.demo_date || '',
          demo_time: formData.demo_time || '',
          demo_focus: formData.demo_focus || [],
          demo_company_size: formData.demo_company_size || '',
          demo_role: formData.demo_role || '',
          demo_name: formData.demo_name || '',
          demo_email: formData.demo_email || '',
          demo_phone: formData.demo_phone || '',
          demo_company: formData.demo_company || '',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setSubmissionStatus('error');
        setSubmissionError(data.error || 'Something went wrong. Please try again.');
        submittedRef.current = false;
        return;
      }

      setSubmissionStatus('success');
      clearSavedEmail();
      try { localStorage.removeItem('sp:step'); } catch { /* ignore */ }
    } catch (err) {
      setSubmissionStatus('error');
      setSubmissionError('Network error. Please check your connection and try again.');
      submittedRef.current = false;
    }
  }, [formData]);

  const goNext = useCallback((d?: Record<string, unknown>) => {
    if (d) setFormData(prev => ({ ...prev, ...d }));
    setStep(s => {
      const next = s + 1;
      // If advancing to step 9, trigger final submission
      if (next === 9 && !submittedRef.current) {
        setTimeout(saveProgress, 0);
      }
      return next;
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [saveProgress]);

  // After step changes, persist progress to server (skip on mount)
  useEffect(() => {
    if (restoring) return; // Don't save during restoration
    saveProgressToServer(step, formData);
  }, [step, formData, restoring, saveProgressToServer]);

  const showStepper = step >= 1 && step <= 8;

  // Hydration guard: render identical shell on server + client until mounted
  if (!mounted) {
    return (
      <div className="app-bg" style={{ position: 'relative', minHeight: '100vh' }}>
        <Backdrop />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <OnboardingNav step={0} />
          <div className="ob-main-container-landing" style={{ maxWidth: 1160, margin: '0 auto', padding: '80px 48px 64px' }} />
        </div>
      </div>
    );
  }

  // Show a loading state while restoring saved progress from server
  if (restoring) {
    return (
      <div className="app-bg" style={{ position: 'relative', minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <Backdrop />
        <OnboardingNav step={0} />
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', paddingTop: 56 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            border: '3px solid var(--line-soft)',
            borderTopColor: 'var(--solar)',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 16px',
          }} />
          <div style={{ fontSize: 13, color: 'var(--ink-2)', fontWeight: 500 }}>
            Restoring your progress...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-bg" style={{ position: 'relative', minHeight: '100vh' }}>
      <Backdrop />
      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* Nav bar with site links (all steps) */}
        <OnboardingNav step={step} />

        <div className={step === 0 ? 'ob-main-container-landing' : 'ob-main-container'} style={{ maxWidth: step === 0 ? 1160 : (step === -1 ? 1040 : 760), margin: '0 auto', padding: step === 0 ? '80px 48px 64px' : '72px 32px 80px' }}>
          {showStepper && <Stepper step={step} />}

          <div key={step} className={step === 0 ? '' : 'ob-step-card'} style={{
            background: step === 0 ? 'transparent' : 'var(--bg-1)',
            border: step === 0 ? 'none' : '1px solid var(--line-soft)',
            borderRadius: 14,
            padding: step === 0 ? 0 : '32px 36px',
            boxShadow: step === 0 ? 'none' : '0 1px 0 var(--line-soft), 0 24px 48px -24px rgba(0,0,0,0.4)',
          }}>
            {step === 0 && <Landing onStart={() => setStep(1)} onDemo={() => setStep(-1)} />}
            {step === -1 && <BookDemo onBack={() => setStep(0)} onDone={(d) => { if (d) setFormData(prev => ({ ...prev, ...d })); setStep(1); }} />}
            {step === 1 && <StepAccount onNext={goNext} initialData={formData} />}
            {step === 2 && <StepCompany onNext={goNext} onBack={goBack} initialData={formData} />}
            {step === 3 && <StepTerritory onNext={goNext} onBack={goBack} initialData={formData} />}
            {step === 4 && <StepIntegrations onNext={goNext} onBack={goBack} initialData={formData} />}
            {step === 5 && <StepLegal onNext={goNext} onBack={goBack} initialData={formData} />}
            {step === 6 && <StepFinancial onNext={goNext} onBack={goBack} data={formData} />}
            {step === 7 && <StepTechnical onNext={goNext} onBack={goBack} initialData={formData} />}
            {step === 8 && <StepWelcome onNext={goNext} onBack={goBack} initialData={formData} />}
            {step === 9 && (
              <div style={{ position: 'relative' }}>
                {submissionStatus === 'loading' && (
                  <div style={{
                    position: 'absolute', inset: 0, zIndex: 10,
                    background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)',
                    borderRadius: 14,
                    display: 'grid', placeItems: 'center',
                  }}>
                    <div style={{
                      background: 'var(--bg-1)', border: '1px solid var(--line)',
                      borderRadius: 10, padding: '24px 32px',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
                    }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        border: '3px solid var(--line-soft)',
                        borderTopColor: 'var(--solar)',
                        animation: 'spin 0.8s linear infinite',
                      }} />
                      <div style={{ fontSize: 13, color: 'var(--ink-2)', fontWeight: 500 }}>
                        Setting up your account...
                      </div>
                    </div>
                  </div>
                )}
                <StepComplete
                  data={formData}
                  submissionError={submissionStatus === 'error' ? submissionError : undefined}
                  onRetry={() => { submittedRef.current = false; setSubmissionStatus('idle'); }}
                />
              </div>
            )}
          </div>

          {/* Footer */}
          {step > 0 && (
            <div className="ob-footer" style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginTop: 28, paddingTop: 20,
            }}>
              <div className="mono" style={{ fontSize: 10, color: 'var(--ink-5)', letterSpacing: '0.08em' }}>
                &copy; 2026 Renewably Ltd &middot; Dublin, Ireland
              </div>
              <div className="mono" style={{ fontSize: 10, color: 'var(--ink-5)', letterSpacing: '0.08em', display: 'flex', gap: 16 }}>
                <span>Privacy</span><span>Terms</span><span>Status &middot; <span style={{ color: 'var(--green)' }}>&#9679;</span> operational</span>
              </div>
            </div>
          )}
        </div>

        {/* Dev step-jump (always available, subtle) */}
        {step > 0 && (
          <DevJumper step={step} setStep={setStep} />
        )}
      </div>
    </div>
  );
}
