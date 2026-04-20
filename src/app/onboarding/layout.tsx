import { Geist } from 'next/font/google';

const geist = Geist({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-geist',
  display: 'swap',
});

export const metadata = {
  title: 'SolarPilot Onboarding — Renewably',
  robots: { index: false, follow: false },
};

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`onboarding-root ${geist.variable}`} style={{ fontFamily: "'Geist', sans-serif" }}>
      {children}
    </div>
  );
}
