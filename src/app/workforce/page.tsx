import type { Metadata } from "next";
import WorkforcePageClient from "@/components/WorkforcePageClient";
import { serviceList, breadcrumb } from "@/lib/seo-schema";

const ogTitle = "Meet Your AI Workforce for Irish Solar Installers";
const ogDescription =
  "An AI workforce for your solar business, working with your approval. Lead response, site surveys, proposals, SEAI grant tracking and follow-up.";

export const metadata: Metadata = {
  title: "AI Workforce for Solar Installers in Ireland",
  description: "Your AI workforce for Irish solar installers. From lead response and site surveys to proposals, SEAI grant tracking, install coordination and aftercare.",
  alternates: { canonical: "https://renewably.ie/workforce" },
  openGraph: {
    title: ogTitle,
    description: ogDescription,
    url: "https://renewably.ie/workforce",
    siteName: "Renewably",
    locale: "en_IE",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Renewably AI Workforce" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: ogTitle,
    description: ogDescription,
  },
};

/* The honest agent roster surfaced in this page's structured data, name +
   one-line description. The Grant Tracker tracks SEAI applications and
   deadlines; it does not fill or submit forms. */
const workforceAgents = [
  { name: "Lead Response Agent", description: "Answers enquiries. Texts back missed calls. Books calls with you." },
  { name: "Operations Agent", description: "Your chief of staff. Tracks the pipeline. Sends a weekly brief." },
  { name: "Site Survey Agent", description: "Books the site survey. Preps it so nothing gets missed." },
  { name: "Proposal Agent", description: "Drafts the proposal. You sign off before anything goes out." },
  { name: "Grant Tracker Agent", description: "Tracks SEAI applications and deadlines. You stay in control of the forms." },
  { name: "Follow-Up Agent", description: "Chases quiet leads. Nudges stalled jobs back to life." },
  { name: "Install Coordinator Agent", description: "Schedules the install. Tracks ESB Networks grid connection paperwork." },
  { name: "Aftercare Agent", description: "Handles handover and aftercare. Asks for the review." },
];

export default function WorkforcePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceList(workforceAgents)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumb([
              { name: "Home", path: "/" },
              { name: "Workforce", path: "/workforce" },
            ])
          ),
        }}
      />
      <main id="main-content">
        <WorkforcePageClient />
      </main>
    </>
  );
}
