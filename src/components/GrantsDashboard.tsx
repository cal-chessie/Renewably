"use client";

import { useState, useEffect } from "react";

/* ============================================================
   GRANTS DASHBOARD — Interactive grants agent laptop mockup
   ============================================================ */

type AppStatus = "submitted" | "under-review" | "approved" | "rejected" | "resubmitted";
type DocStatus = "verified" | "pending" | "missing";

interface GrantApp {
  id: string;
  customer: string;
  county: string;
  scheme: string;
  amount: number;
  status: AppStatus;
  progress: number;
  submitted: string;
  approved: string | null;
}

interface GrantDoc {
  name: string;
  customer: string;
  status: DocStatus;
}

interface TimelineEvent {
  time: string;
  event: string;
}

const INITIAL_APPLICATIONS: GrantApp[] = [
  { id: "SEAI-2026-0842", customer: "Mary Walsh", county: "Cork", scheme: "Solar PV", amount: 1800.00, status: "approved", progress: 100, submitted: "2026-02-15", approved: "2026-03-12" },
  { id: "SEAI-2026-0841", customer: "Pat Smith", county: "Dublin", scheme: "Solar PV + Battery", amount: 3000.00, status: "under-review", progress: 65, submitted: "2026-02-28", approved: null },
  { id: "SEAI-2026-0840", customer: "Anne Doyle", county: "Galway", scheme: "Solar PV", amount: 1800.00, status: "submitted", progress: 30, submitted: "2026-03-05", approved: null },
  { id: "SEAI-2026-0839", customer: "Tom Kelly", county: "Limerick", scheme: "Battery Storage", amount: 1200.00, status: "rejected", progress: 100, submitted: "2026-01-20", approved: null },
  { id: "SEAI-2026-0838", customer: "Siobh\u00e1n N\u00ed Fhaol\u00e1in", county: "Kerry", scheme: "Solar PV", amount: 1800.00, status: "resubmitted", progress: 80, submitted: "2026-02-10", approved: null },
];

const INITIAL_DOCUMENTS: GrantDoc[] = [
  { name: "BER Certificate", customer: "Mary Walsh", status: "verified" },
  { name: "Installer Declaration", customer: "Mary Walsh", status: "verified" },
  { name: "MPRN Confirmation", customer: "Mary Walsh", status: "verified" },
  { name: "BER Certificate", customer: "Pat Smith", status: "pending" },
  { name: "Installer Declaration", customer: "Pat Smith", status: "verified" },
  { name: "MPRN Confirmation", customer: "Pat Smith", status: "missing" },
  { name: "BER Certificate", customer: "Anne Doyle", status: "pending" },
  { name: "Installer Declaration", customer: "Anne Doyle", status: "pending" },
];

const INITIAL_TIMELINE: TimelineEvent[] = [
  { time: "09:30", event: "SEAI grant approved \u2014 Mary Walsh (\u20ac1,800.00)" },
  { time: "10:15", event: "Application submitted \u2014 Anne Doyle (Solar PV)" },
  { time: "11:00", event: "Document request sent \u2014 Pat Smith (MPRN missing)" },
  { time: "13:30", event: "Resubmission received \u2014 Tom Kelly (Battery Storage)" },
  { time: "14:45", event: "BER certificate verified \u2014 Mary Walsh" },
];

const NEW_CUSTOMERS = ["Eileen Collins", "Michael Ryan", "Catherine Lynch", "John Keane"];
const NEW_COUNTIES = ["Clare", "Waterford", "Wexford", "Kilkenny"];
const SCHEMES = ["Solar PV", "Solar PV + Battery", "Battery Storage"];

function getGrantStatusStyle(status: AppStatus): React.CSSProperties {
  const map: Record<AppStatus, { bg: string; color: string }> = {
    submitted: { bg: "rgba(59,130,246,0.07)", color: "#3B82F6" },
    "under-review": { bg: "rgba(242,204,46,0.07)", color: "#F2CC2E" },
    approved: { bg: "rgba(34,197,94,0.07)", color: "#22C55E" },
    rejected: { bg: "rgba(239,68,68,0.07)", color: "#EF4444" },
    resubmitted: { bg: "rgba(249,115,22,0.07)", color: "#F97316" },
  };
  const s = map[status];
  return { background: s.bg, color: s.color };
}

function getGrantStatusLabel(status: AppStatus): string {
  const map: Record<AppStatus, string> = {
    submitted: "\ud83d\udce5 SUBMITTED",
    "under-review": "\ud83d\udd04 UNDER REVIEW",
    approved: "\u2705 APPROVED",
    rejected: "\u274c REJECTED",
    resubmitted: "\ud83d\udcce RESUBMITTED",
  };
  return map[status];
}

function getDocStatusColor(status: DocStatus): string {
  if (status === "verified") return "#22C55E";
  if (status === "pending") return "#F2CC2E";
  return "#EF4444";
}

function getDocStatusLabel(status: DocStatus): string {
  if (status === "verified") return "\u2705 VERIFIED";
  if (status === "pending") return "\u23f3 PENDING";
  return "\u274c MISSING";
}

function fmtTime() {
  return new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export default function GrantsDashboard() {
  const [clock, setClock] = useState("12:00:00");
  const [applications, setApplications] = useState<GrantApp[]>(INITIAL_APPLICATIONS.map((a) => ({ ...a })));
  const [documents, setDocuments] = useState<GrantDoc[]>(INITIAL_DOCUMENTS.map((d) => ({ ...d })));
  const [timeline, setTimeline] = useState<TimelineEvent[]>(INITIAL_TIMELINE.map((t) => ({ ...t })));
  const [stats, setStats] = useState({ activeApps: 12, approvedToday: 3, avgProcessing: 14.00, totalGrantValue: 187.50 });

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
      setApplications((prev) => {
        const next = prev.map((app) => ({ ...app }));
        const newEvents: TimelineEvent[] = [];
        let approvedDelta = 0;
        let grantValueDelta = 0;

        next.forEach((app) => {
          if (app.status === "submitted" && Math.random() > 0.8) {
            app.status = "under-review";
            app.progress = 50;
            newEvents.push({ time: fmtTime(), event: `Application under review \u2014 ${app.customer} (${app.scheme})` });
          } else if (app.status === "under-review" && Math.random() > 0.85) {
            app.status = "approved";
            app.progress = 100;
            app.approved = new Date().toISOString().slice(0, 10);
            approvedDelta++;
            grantValueDelta += app.amount / 1000;
            newEvents.push({ time: fmtTime(), event: `SEAI grant approved \u2014 ${app.customer} (\u20ac${app.amount.toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})` });
          } else if (app.status === "under-review" && Math.random() > 0.95) {
            app.status = "rejected";
            app.progress = 100;
            newEvents.push({ time: fmtTime(), event: `Application rejected \u2014 ${app.customer} \u2014 resubmission required` });
          } else if (app.status === "rejected" && Math.random() > 0.9) {
            app.status = "resubmitted";
            app.progress = 80;
            newEvents.push({ time: fmtTime(), event: `Application resubmitted \u2014 ${app.customer}` });
          } else if (app.status === "resubmitted" && Math.random() > 0.8) {
            app.status = "under-review";
            app.progress = 65;
          }
        });

        // New application occasionally
        if (Math.random() > 0.85 && next.length < 15) {
          const idx = Math.floor(Math.random() * NEW_CUSTOMERS.length);
          const scheme = SCHEMES[Math.floor(Math.random() * SCHEMES.length)];
          const amount = scheme === "Solar PV" ? 1800.00 : scheme === "Battery Storage" ? 1200.00 : 3000.00;
          next.unshift({
            id: `SEAI-2026-${900 + next.length}`,
            customer: NEW_CUSTOMERS[idx],
            county: NEW_COUNTIES[idx],
            scheme,
            amount,
            status: "submitted",
            progress: 10,
            submitted: new Date().toISOString().slice(0, 10),
            approved: null,
          });
          newEvents.push({ time: fmtTime(), event: `New application submitted \u2014 ${NEW_CUSTOMERS[idx]} (${scheme})` });
        }

        // Update timeline
        if (newEvents.length > 0) {
          setTimeline((prevTl) => {
            let tl = [...newEvents, ...prevTl];
            return tl.slice(0, 6);
          });
        }

        // Update stats
        const activeApps = next.filter((a) => a.status !== "approved" && a.status !== "rejected").length;
        if (approvedDelta > 0) {
          setStats((s) => ({
            ...s,
            activeApps,
            approvedToday: s.approvedToday + approvedDelta,
            totalGrantValue: s.totalGrantValue + grantValueDelta,
          }));
        } else {
          setStats((s) => ({ ...s, activeApps }));
        }

        return next;
      });

      setDocuments((prev) => {
        const next = prev.map((doc) => ({ ...doc }));
        const newEvents: TimelineEvent[] = [];

        next.forEach((doc) => {
          if (doc.status === "pending" && Math.random() > 0.85) {
            doc.status = "verified";
            newEvents.push({ time: fmtTime(), event: `Document verified \u2014 ${doc.name} (${doc.customer})` });
          } else if (doc.status === "missing" && Math.random() > 0.9) {
            doc.status = "pending";
            newEvents.push({ time: fmtTime(), event: `Document uploaded \u2014 ${doc.name} (${doc.customer})` });
          }
        });

        if (newEvents.length > 0) {
          setTimeline((prevTl) => {
            let tl = [...newEvents, ...prevTl];
            return tl.slice(0, 6);
          });
        }

        return next;
      });

      // Avg processing days random walk
      setStats((s) => {
        let change = (Math.random() - 0.5) * 0.5;
        let newValue = s.avgProcessing + change;
        if (newValue < 7.00) newValue = 7.00;
        if (newValue > 21.00) newValue = 21.00;
        return { ...s, avgProcessing: parseFloat(newValue.toFixed(2)) };
      });
    }, 4000);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={S.laptopMockup}>
      <div style={S.screen}>
        {/* Taskbar */}
        <div style={S.taskbar}>
          <div style={S.taskbarIcons}>
            {["\ud83d\udcb0", "\u26a1", "\ud83d\udcc4", "\ud83e\udd16"].map((icon) => (
              <div key={icon} style={S.taskbarIcon}>{icon}</div>
            ))}
          </div>
          <div style={S.clock}>{clock}</div>
        </div>

        {/* Grants Main */}
        <div style={S.grantsMain}>
          {/* Stats Row */}
          <div style={S.statsRow}>
            <div style={S.statCard}><div style={S.statNumber}>{stats.activeApps}</div><div style={S.statLabel}>ACTIVE APPLICATIONS</div></div>
            <div style={S.statCard}><div style={S.statNumber}>{stats.approvedToday}</div><div style={S.statLabel}>APPROVED TODAY</div></div>
            <div style={S.statCard}><div style={S.statNumber}>{stats.avgProcessing.toFixed(2)}</div><div style={S.statLabel}>AVG PROCESSING (days)</div></div>
            <div style={S.statCard}><div style={S.statNumber}>{stats.totalGrantValue.toFixed(2)}</div><div style={S.statLabel}>TOTAL GRANT VALUE (\u20ack)</div></div>
          </div>

          {/* Two Column: Applications + Documents */}
          <div style={S.twoCol}>
            {/* Active Applications */}
            <div style={S.panel}>
              <div style={S.panelHeader}>\ud83d\udccb ACTIVE APPLICATIONS</div>
              <div style={S.panelContent}>
                {applications.map((app) => (
                  <div key={app.id} style={S.grantCard}>
                    <div style={S.grantHeader}>
                      <span style={S.grantId}>#{app.id}</span>
                      <span style={{ ...S.grantStatusBadge, ...getGrantStatusStyle(app.status) }}>
                        {getGrantStatusLabel(app.status)}
                      </span>
                    </div>
                    <div style={S.grantCustomer}>\ud83d\udc64 {app.customer} &middot; {app.county}</div>
                    <div style={S.grantAmount}>\ud83d\udcb0 {app.scheme} &middot; \u20ac{app.amount.toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <div style={S.grantDate}>\ud83d\udcc5 Submitted: {app.submitted}</div>
                    {app.status !== "approved" && app.status !== "rejected" && (
                      <div style={S.progressBar}><div style={{ ...S.progressFill, width: `${app.progress}%` }} /></div>
                    )}
                    {app.approved && (
                      <div style={{ ...S.grantDate, color: "#22C55E" }}>\u2705 Approved: {app.approved}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Document Status */}
            <div style={S.panel}>
              <div style={S.panelHeader}>\ud83d\udcc4 DOCUMENT STATUS</div>
              <div style={S.panelContent}>
                {documents.map((doc, i) => (
                  <div key={i} style={S.docItem}>
                    <span style={S.docName}>\ud83d\udcc4 {doc.name} &middot; {doc.customer}</span>
                    <span style={{ ...S.docStatusLabel, color: getDocStatusColor(doc.status) }}>
                      {getDocStatusLabel(doc.status)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Application Timeline */}
          <div style={S.panel}>
            <div style={S.panelHeader}>\u23f1\ufe0f APPLICATION TIMELINE</div>
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
        <div style={S.grantsFooter}>
          <span>\ud83d\udcb0 AI-powered grant management &middot; SEAI &middot; Auto-submit &middot; 92% approval rate</span>
          <span>\ud83d\udd04 Auto-refresh every 4 seconds</span>
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
  grantsMain: {
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
  grantCard: {
    background: "#0F0F0F",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    borderLeft: "3px solid #F2CC2E",
  },
  grantHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  grantId: {
    color: "#F2CC2E",
    fontSize: 11,
    fontFamily: "monospace",
    fontWeight: 600,
  },
  grantStatusBadge: {
    fontSize: 9,
    fontWeight: 600,
    padding: "3px 8px",
    borderRadius: 20,
  },
  grantCustomer: {
    color: "#EEE",
    fontSize: 12,
    fontWeight: 500,
    margin: "4px 0",
  },
  grantAmount: {
    color: "#22C55E",
    fontSize: 10,
    fontWeight: 600,
  },
  grantDate: {
    color: "#888",
    fontSize: 8,
    marginTop: 4,
  },
  progressBar: { height: 3, background: "#1A1A1A", borderRadius: 3, marginTop: 6, overflow: "hidden" },
  progressFill: { height: 3, background: "#22C55E", borderRadius: 3, transition: "width 0.5s ease" },
  docItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 0",
    borderBottom: "1px solid #1E1E1E",
  },
  docName: {
    color: "#CCC",
    fontSize: 10,
  },
  docStatusLabel: {
    fontSize: 9,
    fontWeight: 600,
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
  grantsFooter: {
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
