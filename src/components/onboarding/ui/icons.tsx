'use client';

import React from 'react';

// ─── Icons (minimal, line-style) ────────────────────────────────────────

interface IconProps {
  size?: number;
  className?: string;
}

export const IconArrow: React.FC<IconProps> = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
    <path d="M3 7h8m-3-3l3 3-3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const IconCheck: React.FC<IconProps> = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 12 12" fill="none">
    <path d="M2 6l3 3 5-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const IconPlus: React.FC<IconProps> = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 12 12" fill="none">
    <path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

export const IconDoc: React.FC<IconProps> = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
    <path d="M3 1h5l3 3v9H3V1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
    <path d="M8 1v3h3M5 7h4M5 10h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

export const IconLock: React.FC<IconProps> = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
    <rect x="3" y="6" width="8" height="6" rx="1" stroke="currentColor" strokeWidth="1.2" />
    <path d="M5 6V4a2 2 0 014 0v2" stroke="currentColor" strokeWidth="1.2" />
  </svg>
);

export const IconZap: React.FC<IconProps> = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
    <path d="M8 1L3 8h3l-1 5 5-7H7l1-5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
  </svg>
);

export const IconMap: React.FC<IconProps> = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
    <path d="M1 3l4-2 4 2 4-2v10l-4 2-4-2-4 2V3z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
    <path d="M5 1v10M9 3v10" stroke="currentColor" strokeWidth="1.2" />
  </svg>
);

export const IconPlug: React.FC<IconProps> = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
    <path d="M5 1v3M9 1v3M3 4h8v3a4 4 0 01-8 0V4zM7 11v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const IconEuro: React.FC<IconProps> = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
    <path d="M11 3a4 4 0 100 8M2 6h7M2 8h6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

export const IconShield: React.FC<IconProps> = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
    <path d="M7 1l5 2v4c0 3-2 5.5-5 6-3-.5-5-3-5-6V3l5-2z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
  </svg>
);

export const IconBook: React.FC<IconProps> = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
    <path d="M2 2h4a2 2 0 012 2v8a2 2 0 00-2-2H2V2zM12 2H8a2 2 0 00-2 2v8a2 2 0 012-2h4V2z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
  </svg>
);

export const IconUser: React.FC<IconProps> = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
    <circle cx="7" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.2"/>
    <path d="M2 13c0-2.5 2.2-4 5-4s5 1.5 5 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
);

export const IconOffice: React.FC<IconProps> = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
    <path d="M2 13V3h10v10M5 6h1M8 6h1M5 9h1M8 9h1M6 13v-2h2v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const IconMail: React.FC<IconProps> = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
    <rect x="1" y="3" width="12" height="8" rx="1" stroke="currentColor" strokeWidth="1.2"/>
    <path d="M1 4l6 4 6-4" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
  </svg>
);

export const IconCard: React.FC<IconProps> = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
    <rect x="1" y="3" width="12" height="8" rx="1" stroke="currentColor" strokeWidth="1.2"/>
    <path d="M1 6h12M3 9h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
);

export const IconTeam: React.FC<IconProps> = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
    <circle cx="5" cy="5" r="2" stroke="currentColor" strokeWidth="1.2"/>
    <circle cx="10" cy="5" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
    <path d="M1 12c0-2 1.8-3 4-3s4 1 4 3M9 9c1.8 0 4 1 4 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
);

export const IconSend: React.FC<IconProps> = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
    <path d="M13 1L1 6l5 2 2 5 5-12zM6 8l4-4" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round"/>
  </svg>
);

export const IconChart: React.FC<IconProps> = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
    <path d="M1 13V1M13 13H1M3 10l3-4 3 2 4-6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Icon lookup by name
export const IconByName: Record<string, React.FC<IconProps>> = {
  Arrow: IconArrow,
  Check: IconCheck,
  Plus: IconPlus,
  Doc: IconDoc,
  Lock: IconLock,
  Zap: IconZap,
  Map: IconMap,
  Plug: IconPlug,
  Euro: IconEuro,
  Shield: IconShield,
  Book: IconBook,
  User: IconUser,
  Office: IconOffice,
  Mail: IconMail,
  Card: IconCard,
  Team: IconTeam,
  Send: IconSend,
  Chart: IconChart,
};
