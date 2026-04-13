"use client";

import { useState, useEffect } from "react";

/* ============================================================
   QA DASHBOARD — Interactive QA agent laptop mockup
   ============================================================ */

type QAStatus = "pending" | "in-review" | "approved" | "rejected";

interface Checklist {
  paperwork: boolean;
  photos: boolean;
  permit: boolean;
  grant: boolean;
  satisfaction: boolean;
}

interface QAReview {
  id: string;
  customer: string;
  county: string;
  status: QAStatus;
  progress: number;
  checklist: Checklist;
}

interface FlaggedError {
  customer: string;
  issue: string;
  severity: "critical" | "warning";
  detected: string;
}

interface TimelineEvent {
  time: string;
  event: string;
}

const INITIAL_REVIEWS: QAReview[] = [
  { id: "JOB-1042", customer: "Mary Walsh", county: "Cork", status: "in-review", progress: 75, checklist: { paperwork: true, photos: true, permit: true, grant: true, satisfaction: false } },
  { id: "JOB-1041", customer: "Pat Smith", county: "Dublin", status: "pending", progress: 30, checklist: { paperwork: false, photos: false, permit: true, grant: true, satisfaction: false } },
  { id: "JOB-1040", customer: "Anne Doyle", county: "Galway", status: "in-review", progress: 60, checklist: { paperwork: true, photos: true, permit: false, grant: true, satisfaction: false } },
  { id: "JOB-1039", customer: "Tom Kelly", county: "Limerick", status: "pending", progress: 15, checklist: { paperwork: false, photos: false, permit: false, grant: false, satisfaction: false } },
];

const INITIAL_TIMELINE: TimelineEvent[] = [
  { time: "09:30", event: "QA review started \u2014 Mary Walsh (JOB-1042)" },
  { time: "10:15", event: "Missing paperwork flagged \u2014 Pat Smith (JOB-1041)" },
  { time: "11:00", event: "ESB permit pending \u2014 Anne Doyle (JOB-1040)" },
  { time: "13:30", event: "Customer notified of missing paperwork \u2014 Pat Smith" },
  { time: "14:45", event: "QA approved \u2014 Mary Walsh \u2014 ready for handover" },
];

const NEW_CUSTOMERS = ["Eileen Collins", "Michael Ryan", "Catherine Lynch", "John Keane"];
const NEW_COUNTIES = ["Clare", "Waterford", "Wexford", "Kilkenny"];

function getQAStatusStyle(status: QAStatus): React.CSSProperties {
  const map: Record<QAStatus, { bg: string; color: string }> = {
    pending: { bg: "rgba(242,204,46,0.07)", color: "#F2CC2E" },
    "in-review": { bg: "rgba(59,130,246,0.07)", color: "#3B82F6" },
    approved: { bg: "rgba(34,197,94,0.07)", color: "#22C55E" },
    rejected: { bg: "rgba(239,68,68,0.07)", color: "#EF4444" },
  };
  const s = map[status];
  return { background: s.bg, color: s.color };
}

function getQAStatusLabel(status: QAStatus): string {
  const map: Record<QAStatus, string> = {
    pending: "PENDING",
    "in-review": "IN REVIEW",
    approved: "APPROVED",
    rejected: "REJECTED",
  };
  return map[status];
}

function getSeverityColor(severity: "critical" | "warning"): { bg: string; color: string } {
  return severity === "critical"
    ? { bg: "rgba(239,68,68,0.07)", color: "#EF4444" }
    : { bg: "rgba(242,204,46,0.07)", color: "#F2CC2E" };
}

function getSeverityLabel(severity: "critical" | "warning"): string {
  return severity === "critical" ? "CRITICAL" : "WARNING";
}

function fmtTime() {
  return new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function renderCheckIcon(passed: boolean): { icon: string; color: string } {
  if (passed) return { icon: "\u2713", color: "#22C55E" };
  return { icon: "\u2717", color: "#EF4444" };
}

function renderCheckText(passed: boolean, label: string): { text: string; color: string } {
  if (passed) return { text: label, color: "#CCC" };
  return { text: `${label} \u2014 MISSING`, color: "#EF4444" };
}

export default function QADashboard() {
  const [clock, setClock] = useState("12:00:00");
  const [reviews, setReviews] = useState<QAReview[]>(INITIAL_REVIEWS.map((r) => ({ ...r, checklist: { ...r.checklist } })));
  const [errors, setErrors] = useState<FlaggedError[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>(INITIAL_TIMELINE.map((t) => ({ ...t })));
  const [stats, setStats] = useState({ pendingReviews: 8, approvedToday: 3, errorsCaught: 12, qualityScore: 98.5 });

  // Clock
  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString("en-GB"));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Simulation tick
  useEffect(() => {
    const id = setInterval(() => {
      setReviews((prev) => {
        const next = prev.map((r) => ({ ...r, checklist: { ...r.checklist } }));
        const newEvents: TimelineEvent[] = [];
        let approvedDelta = 0;

        next.forEach((review) => {
          if (review.status === "pending" && Math.random() > 0.7) {
            review.status = "in-review";
            review.progress = 40;
            newEvents.push({ time: fmtTime(), event: `QA review started \u2014 ${review.customer} (${review.id})` });
          } else if (review.status === "in-review" && review.progress < 100) {
            review.progress = Math.min(100, review.progress + Math.floor(Math.random() * 15) + 5);

            const checks: { key: keyof Checklist; label: string; eventMsg: string; probability: number }[] = [
              { key: "paperwork", label: "Signed Paperwork", eventMsg: `Paperwork received \u2014 ${review.customer}`, probability: 0.6 },
              { key: "photos", label: "Installation Photos", eventMsg: `Photos uploaded \u2014 ${review.customer}`, probability: 0.6 },
              { key: "permit", label: "ESB Permit", eventMsg: `ESB permit approved \u2014 ${review.customer}`, probability: 0.5 },
              { key: "grant", label: "SEAI Grant", eventMsg: `SEAI grant confirmed \u2014 ${review.customer}`, probability: 0.5 },
              { key: "satisfaction", label: "Customer Satisfaction", eventMsg: `Customer satisfaction survey completed \u2014 ${review.customer}`, probability: 0.7 },
            ];

            checks.forEach((c) => {
              if (!review.checklist[c.key] && Math.random() > c.probability) {
                review.checklist[c.key] = true;
                newEvents.push({ time: fmtTime(), event: c.eventMsg });
              }
            });

            const allComplete = Object.values(review.checklist).every(Boolean);
            if (allComplete && review.progress >= 100) {
              review.status = "approved";
              review.progress = 100;
              approvedDelta++;
              newEvents.push({ time: fmtTime(), event: `QA approved \u2014 ${review.customer} \u2014 ready for handover` });
            }
          }
        });

        // Build flagged errors from missing checklist items
        const flaggedErrors: FlaggedError[] = [];
        next.forEach((review) => {
          if (review.status === "approved") return;
          if (!review.checklist.paperwork) flaggedErrors.push({ customer: review.customer, issue: "Missing signed installation paperwork", severity: "critical", detected: "Active" });
          if (!review.checklist.photos) flaggedErrors.push({ customer: review.customer, issue: "No installation photos uploaded", severity: "critical", detected: "Active" });
          if (!review.checklist.permit) flaggedErrors.push({ customer: review.customer, issue: "ESB permit not approved", severity: "critical", detected: "Active" });
          if (!review.checklist.grant) flaggedErrors.push({ customer: review.customer, issue: "SEAI grant not confirmed", severity: "warning", detected: "Active" });
          if (!review.checklist.satisfaction) flaggedErrors.push({ customer: review.customer, issue: "Customer satisfaction survey pending", severity: "warning", detected: "Active" });
        });
        setErrors(flaggedErrors);

        // New job for QA occasionally
        if (Math.random() > 0.85 && next.length < 12) {
          const idx = Math.floor(Math.random() * NEW_CUSTOMERS.length);
          next.unshift({
            id: `JOB-${1100 + next.length}`,
            customer: NEW_CUSTOMERS[idx],
            county: NEW_COUNTIES[idx],
            status: "pending",
            progress: 5,
            checklist: { paperwork: false, photos: false, permit: false, grant: false, satisfaction: false },
          });
          newEvents.push({ time: fmtTime(), event: `New job ready for QA \u2014 ${NEW_CUSTOMERS[idx]} (${NEW_COUNTIES[idx]})` });
        }

        // Update timeline
        if (newEvents.length > 0) {
          setTimeline((prevTl) => [...newEvents, ...prevTl].slice(0, 6));
        }

        // Update stats
        const pendingReviews = next.filter((r) => r.status !== "approved").length;
        setStats((s) => ({
          ...s,
          pendingReviews,
          approvedToday: s.approvedToday + approvedDelta,
          errorsCaught: flaggedErrors.length,
          qualityScore: parseFloat(Math.min(100, Math.max(95, s.qualityScore + (approvedDelta > 0 ? 0.25 : 0) + (Math.random() - 0.5) * 0.3)).toFixed(2)),
        }));

        return next;
      });
    }, 4000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="qa-dash" style={S.laptopMockup}><style>{`@media(max-width:767px){.qa-dash .sr{grid-template-columns:repeat(2,1fr)!important;gap:8px!important;margin-bottom:12px!important}.qa-dash .tc{grid-template-columns:1fr!important;gap:8px!important;margin-bottom:12px!important}.qa-dash .ft{flex-direction:column!important;gap:2px!important;text-align:center}.qa-dash .screen{aspect-ratio:auto!important;min-height:500px}}`}</style>
      <div style={S.screen}>
        {/* Taskbar */}
        <div style={S.taskbar}>
          <div style={S.taskbarIcons}>
            {["\u26a1"].map((icon) => (
              <div key={icon} style={S.taskbarIcon}>{icon}</div>
            ))}
          </div>
          <div style={S.clock}>{clock}</div>
        </div>

        {/* QA Main */}
        <div style={S.qaMain}>
          {/* Stats Row */}
          <div className="sr" style={S.statsRow}>
            <div style={S.statCard}><div style={S.statNumber}>{stats.pendingReviews}</div><div style={S.statLabel}>PENDING REVIEWS</div></div>
            <div style={S.statCard}><div style={S.statNumber}>{stats.approvedToday}</div><div style={S.statLabel}>APPROVED TODAY</div></div>
            <div style={S.statCard}><div style={S.statNumber}>{stats.errorsCaught}</div><div style={S.statLabel}>ERRORS CAUGHT</div></div>
            <div style={S.statCard}><div style={S.statNumber}>{stats.qualityScore.toFixed(2)}</div><div style={S.statLabel}>QUALITY SCORE (%)</div></div>
          </div>

          {/* Two Column: Reviews + Issues */}
          <div className="tc" style={S.twoCol}>
            {/* Pending QA Reviews */}
            <div style={S.panel}>
              <div style={S.panelHeader}>PENDING QA REVIEWS</div>
              <div style={S.panelContent}>
                {reviews.map((review) => (
                  <div key={review.id} style={S.qaCard}>
                    <div style={S.qaHeader}>
                      <span style={S.qaId}>#{review.id}</span>
                      <span style={{ ...S.qaStatusBadge, ...getQAStatusStyle(review.status) }}>
                        {getQAStatusLabel(review.status)}
                      </span>
                    </div>
                    <div style={S.qaCustomer}>{review.customer} &middot; {review.county}</div>
                    <div style={S.checklist}>
                      {([
                        ["paperwork", "Signed Paperwork"] as const,
                        ["photos", "Installation Photos"] as const,
                        ["permit", "ESB Permit"] as const,
                        ["grant", "SEAI Grant"] as const,
                        ["satisfaction", "Customer Satisfaction"] as const,
                      ]).map(([key, label]) => {
                        const ci = renderCheckIcon(review.checklist[key]);
                        const ct = renderCheckText(review.checklist[key], label);
                        return (
                          <div key={key} style={S.checklistItem}>
                            <span style={{ color: ci.color, fontSize: 10 }}>{ci.icon}</span>
                            <span style={{ color: ct.color, fontSize: 9 }}>{ct.text}</span>
                          </div>
                        );
                      })}
                    </div>
                    {review.status !== "approved" && (
                      <div style={S.progressBar}><div style={{ ...S.progressFill, width: `${review.progress}%` }} /></div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Flagged Issues */}
            <div style={S.panel}>
              <div style={S.panelHeader}>FLAGGED ISSUES</div>
              <div style={S.panelContent}>
                {errors.map((error, i) => {
                  const sev = getSeverityColor(error.severity);
                  return (
                    <div key={i}>
                      <div style={S.errorItem}>
                        <span style={S.errorCustomer}>{error.customer}</span>
                        <span style={{ ...S.errorTypeBadge, background: sev.bg, color: sev.color }}>
                          {getSeverityLabel(error.severity)}
                        </span>
                      </div>
                      <div style={S.errorDetail}>{error.issue} &middot; {error.detected}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* QA Timeline */}
          <div style={S.panel}>
            <div style={S.panelHeader}>QA TIMELINE</div>
            <div style={S.panelContent}>
              {timeline.map((item, i) => (
                <div key={i} style={S.timelineItem}>
                  <div style={S.timelineTime}>{item.time}</div>
                  <div style={S.timelineEvent}>{item.event}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="ft" style={S.qaFooter}>
          <span>AI-powered quality assurance &middot; Zero customer-facing mistakes &middot; Pre-handover audit</span>
          <span>Auto-refresh every 4 seconds</span>
        </div>
      </div>

      {/* Laptop Bottom */}
      <div style={S.laptopBottom}>
        <div style={S.trackpad} />
      </div>
    </div>
  );
}

/* ============================================================
   INLINE STYLES
   ============================================================ */
const S: Record<string, React.CSSProperties> = {
  laptopMockup: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    maxWidth: 1000,
    width: "100%",
    margin: "0 auto",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  screen: {
    background: "#0A0A0A",
    borderRadius: "12px 12px 6px 6px",
    overflow: "hidden",
    border: "1px solid #2A2A2A",
    width: "100%",
    aspectRatio: "16 / 10",
    display: "flex",
    flexDirection: "column",
  },
  taskbar: {
    background: "#0F0F0F",
    padding: "8px 16px",
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    borderBottom: "1px solid #2A2A2A",
    flexShrink: 0,
  },
  taskbarIcons: { display: "flex", gap: 8, marginRight: "auto" },
  taskbarIcon: {
    width: 28,
    height: 28,
    background: "#1A1A1A",
    borderRadius: 6,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14,
    color: "#FFF",
    cursor: "default",
  },
  clock: {
    fontFamily: "monospace",
    fontSize: 12,
    color: "#AAA",
    background: "#0A0A0A",
    padding: "4px 12px",
    borderRadius: 6,
  },
  qaMain: {
    padding: 20,
    flex: 1,
    overflowY: "auto",
    scrollbarWidth: "thin",
    scrollbarColor: "#2A2A2A transparent",
  },
  statsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    background: "#0A0A0A",
    borderRadius: 10,
    padding: 12,
    textAlign: "center",
    border: "1px solid #1E1E1E",
  },
  statNumber: { color: "#F2CC2E", fontSize: 26, fontWeight: 700 },
  statLabel: {
    color: "#AAA",
    fontSize: 10,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
    marginTop: 4,
  },
  twoCol: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 16,
    marginBottom: 24,
  },
  panel: {
    background: "#0A0A0A",
    borderRadius: 12,
    border: "1px solid #1E1E1E",
    overflow: "hidden",
  },
  panelHeader: {
    background: "#0F0F0F",
    padding: "12px 16px",
    borderBottom: "1px solid #1E1E1E",
    fontWeight: 600,
    color: "#F2CC2E",
    fontSize: 13,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  panelContent: {
    padding: 12,
    maxHeight: 280,
    overflowY: "auto",
    scrollbarWidth: "thin",
    scrollbarColor: "#2A2A2A transparent",
  },
  qaCard: {
    background: "#0F0F0F",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    borderLeft: "3px solid #F2CC2E",
  },
  qaHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  qaId: {
    color: "#F2CC2E",
    fontSize: 11,
    fontFamily: "monospace",
    fontWeight: 600,
  },
  qaStatusBadge: {
    fontSize: 9,
    fontWeight: 600,
    padding: "3px 8px",
    borderRadius: 20,
  },
  qaCustomer: {
    color: "#EEE",
    fontSize: 12,
    fontWeight: 500,
    margin: "4px 0",
  },
  checklist: {
    marginTop: 6,
  },
  checklistItem: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "2px 0",
  },
  progressBar: { height: 3, background: "#1A1A1A", borderRadius: 3, marginTop: 6, overflow: "hidden" },
  progressFill: { height: 3, background: "#22C55E", borderRadius: 3, transition: "width 0.5s ease" },
  errorItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 0",
    borderBottom: "1px solid #1E1E1E",
  },
  errorCustomer: {
    color: "#CCC",
    fontSize: 10,
  },
  errorTypeBadge: {
    fontSize: 9,
    fontWeight: 600,
    padding: "3px 6px",
    borderRadius: 12,
  },
  errorDetail: {
    fontSize: 8,
    color: "#888",
    marginTop: -4,
    marginBottom: 6,
    paddingLeft: 8,
  },
  timelineItem: {
    display: "flex",
    gap: 12,
    padding: "8px 0",
    borderBottom: "1px solid #1E1E1E",
  },
  timelineTime: {
    fontFamily: "monospace",
    fontSize: 11,
    color: "#F2CC2E",
    minWidth: 55,
    fontWeight: 600,
  },
  timelineEvent: { fontSize: 11, color: "#CCC" },
  qaFooter: {
    padding: "10px 16px",
    background: "#0A0A0A",
    borderTop: "1px solid #1E1E1E",
    display: "flex",
    justifyContent: "space-between",
    fontSize: 10,
    color: "#666",
    flexShrink: 0,
  },
  laptopBottom: {
    background: "#111",
    width: "97%",
    marginTop: -1,
    borderRadius: "0 0 12px 12px",
    padding: 8,
    display: "flex",
    justifyContent: "center",
  },
  trackpad: { width: 150, height: 6, background: "#1A1A1A", borderRadius: 3 },
};
