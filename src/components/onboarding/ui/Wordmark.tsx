'use client';

import React from 'react';
import Image from 'next/image';

// ─── Wordmark / Sun mark ────────────────────────────────────────────────
export function SunMark({ size = 18 }: { size?: number }) {
  return (
    <div style={{
      width: size, height: size,
      borderRadius: Math.max(4, size * 0.18),
      background: 'var(--solar)',
      display: 'grid', placeItems: 'center',
      overflow: 'hidden',
      flexShrink: 0,
    }}>
      <Image src="/onboarding/renewably-logo.png" alt="Renewably" width={size} height={size} style={{ width: '100%', height: '100%', objectFit: 'cover' as const }} />
    </div>
  );
}

export function Wordmark({ small }: { small?: boolean }) {
  const s = small ? 24 : 30;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{
        width: s, height: s, borderRadius: 6,
        background: 'var(--solar)',
        display: 'grid', placeItems: 'center',
        overflow: 'hidden',
      }}>
        <Image src="/onboarding/renewably-logo.png" alt="Renewably" width={s} height={s} style={{ width: '100%', height: '100%', objectFit: 'cover' as const }} />
      </div>
      <div>
        <div style={{ fontSize: small ? 14 : 16, fontWeight: 600, letterSpacing: '-0.02em' }}>
          SolarPilot
        </div>
        {!small && (
          <div className="mono" style={{ fontSize: 9, color: 'var(--ink-4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 1 }}>
            by Renewably
          </div>
        )}
      </div>
    </div>
  );
}
