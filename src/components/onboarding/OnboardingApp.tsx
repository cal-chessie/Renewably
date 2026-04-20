'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wordmark } from './ui/Wordmark';
import { Badge } from './ui/primitives';
import Stepper from './Stepper';
import Backdrop from './Backdrop';
import DevJumper from './DevJumper';
import Landing from './steps/Landing';
import BookDemo from './steps/BookDemo';
import StepAccount from './steps/StepAccount';
import StepCompany from './steps/StepCompany';
import StepTerritory from './steps/StepTerritory';
import StepIntegrations from './steps/StepIntegrations';
import StepLegal from './steps/StepLegal';
import StepFinancial from './steps/StepFinancial';
import StepTechnical from './steps/StepTechnical';
import StepWelcome from './steps/StepWelcome';
import StepComplete from './steps/StepComplete';

interface FormData {
  email?: string;
  company_name?: string;
  contact_name?: string;
  counties?: string[];
  setupTotal?: number;
  connectedIds?: string[];
  [key: string]: unknown;
}

export default function OnboardingApp() {
  const [step, setStep] = React.useState(() => {
    try {
      const s = parseInt(localStorage.getItem('sp:step') || '0');
      return isFinite(s) ? s : 0;
    } catch { return 0; }
  });
  const [formData, setFormData] = React.useState<FormData>({
    email: 'sean@powersolarltd.ie',
    company_name: 'Power Solar Ltd',
    contact_name: 'Sean Power',
    counties: ['Dublin','Kildare','Meath','Wicklow','Wexford','Louth'],
  });

  React.useEffect(() => {
    try { localStorage.setItem('sp:step', String(step)); } catch { /* ignore */ }
  }, [step]);

  const goNext = (d?: Record<string, unknown>) => {
    if (d) setFormData(prev => ({ ...prev, ...d }));
    setStep(s => s + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goBack = () => {
    setStep(s => Math.max(0, s - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const showStepper = step >= 1 && step <= 8;
  const stepperNum = step;

  const renderStep = () => {
    switch (step) {
      case 0: return <Landing onStart={() => setStep(1)} onDemo={() => setStep(-1)} />;
      case -1: return <BookDemo onBack={() => setStep(0)} onDone={() => setStep(1)} />;
      case 1: return <StepAccount onNext={goNext} />;
      case 2: return <StepCompany onNext={goNext} onBack={goBack} />;
      case 3: return <StepTerritory onNext={goNext} onBack={goBack} />;
      case 4: return <StepIntegrations onNext={goNext} onBack={goBack} />;
      case 5: return <StepLegal onNext={goNext} onBack={goBack} />;
      case 6: return <StepFinancial onNext={goNext} onBack={goBack} data={formData} />;
      case 7: return <StepTechnical onNext={goNext} onBack={goBack} />;
      case 8: return <StepWelcome onNext={goNext} onBack={goBack} />;
      case 9: return <StepComplete data={formData} />;
      default: return null;
    }
  };

  const isDev = process.env.NODE_ENV === 'development';

  return (
    <div className="app-bg" style={{ position: 'relative', minHeight: '100vh' }}>
      <Backdrop />
      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Top bar (from step 1 onward) */}
        {step > 0 && (
          <div className="ob-top-bar" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '18px 32px', borderBottom: '1px solid var(--line-soft)',
            background: 'oklch(0.16 0.005 80 / 0.72)', backdropFilter: 'blur(10px)',
            position: 'sticky', top: 0, zIndex: 20,
          }}>
            <Wordmark small />
            <div className="ob-top-bar-inner" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <Badge tone="solar">
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--solar)' }} />
                Trial · 14 days
              </Badge>
              <div className="ob-demo-badge">Demo</div>
              <div className="mono" style={{ fontSize: 11, color: 'var(--ink-4)', letterSpacing: '0.04em' }}>
                Need help? <span style={{ color: 'var(--ink-2)', textDecoration: 'underline' }}>hello@renewably.ie</span>
              </div>
            </div>
          </div>
        )}

        <div style={{ maxWidth: step === 0 ? 1160 : (step === -1 ? 1040 : 760), margin: '0 auto', padding: step === 0 ? '40px 48px 64px' : '36px 32px 80px' }} className={step === 0 ? 'ob-main-container-landing' : 'ob-main-container'}>
          {showStepper && <Stepper step={stepperNum} />}

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: [0.2, 0.7, 0.2, 1] }}
              className={step === 0 ? '' : 'ob-step-card'}
              style={{
                background: step === 0 ? 'transparent' : 'var(--bg-1)',
                border: step === 0 ? 'none' : '1px solid var(--line-soft)',
                borderRadius: 14,
                padding: step === 0 ? 0 : '32px 36px',
                boxShadow: step === 0 ? 'none' : '0 1px 0 var(--line-soft), 0 24px 48px -24px rgba(0,0,0,0.4)',
              }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>

          {/* Footer */}
          {step > 0 && (
            <div className="ob-footer" style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginTop: 28, paddingTop: 20,
            }}>
              <div className="mono" style={{ fontSize: 10, color: 'var(--ink-5)', letterSpacing: '0.08em' }}>
                © 2026 Renewably Ltd · Dublin, Ireland
              </div>
              <div className="mono" style={{ fontSize: 10, color: 'var(--ink-5)', letterSpacing: '0.08em', display: 'flex', gap: 16 }}>
                <span>Privacy</span><span>Terms</span><span>Status · <span style={{ color: 'var(--green)' }}>●</span> operational</span>
              </div>
            </div>
          )}
        </div>

        {/* Dev step-jump (only in dev mode) */}
        {isDev && !showStepper && step > 0 && (
          <DevJumper step={step} setStep={setStep} />
        )}
        {isDev && showStepper && (
          <DevJumper step={step} setStep={setStep} />
        )}
      </div>
    </div>
  );
}
