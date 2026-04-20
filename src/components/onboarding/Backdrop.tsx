'use client';

import React from 'react';

export default function Backdrop() {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
      backgroundImage: `
        linear-gradient(var(--line-soft) 1px, transparent 1px),
        linear-gradient(90deg, var(--line-soft) 1px, transparent 1px)
      `,
      backgroundSize: '56px 56px',
      backgroundPosition: '-1px -1px',
      opacity: 0.25,
      maskImage: 'radial-gradient(ellipse at 50% 0%, black 0%, transparent 70%)',
      WebkitMaskImage: 'radial-gradient(ellipse at 50% 0%, black 0%, transparent 70%)',
    }} />
  );
}
