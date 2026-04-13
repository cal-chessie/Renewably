"use client";

import { useState, useEffect } from "react";

/* ============================================================
   PERMITTING DASHBOARD — Interactive permitting agent laptop mockup
   ============================================================ */

type PermitStatus = "submitted" | "under-review" | "approved" | "rejected" | "escalated";
type FollowupLevel = "urgent" | "warning" | "normal";

interface Permit {
  id: string;
  customer: string;
  county: string;
  type: string;
  status: PermitStatus;
  progress: number;
  submitted: string;
  approved: string | null;
  daysPending: number;
}

interface Followup {
  customer: string;
  county: string;
  daysWaiting: number;
  status: FollowupLevel;
  nextAction: string;
}

interface TimelineEvent {
  time: string;
  event: string;
}

const INITIAL_PERMITS: Permit[] = [
  { id: "ESB-NC6-1042", customer: "Mary Walsh", county: "Cork", type: "NC6 (Domestic)", status: "approved", progress: 100, submitted: "2026-03-01", approved: "2026-03-12", daysPending: 0 },
  { id: "ESB-NC6-1041", customer: "Pat Smith", county: "Dublin", type: "NC6 (Domestic)", status: "under-review", progress: 65, submitted: "2026-02-28", approved: null, daysPending: 12 },
  { id: "ESB-NC7-1040", customer: "Anne Doyle", county: "Galway", type: "NC7 (Commercial)", status: "submitted", progress: 30, submitted: "2026-03-05", approved: null, daysPending: 5 },
  { id: "ESB-NC6-1039", customer: "Tom Kelly", county: "Limerick", type: "NC6 (Domestic)", status: "escalated", progress: 45, submitted: "2026-02-20", approved: null, daysPending: 18 },
  { id: "ESB-NC7-1038", customer: "Siobh\u00e1n N\u00ed Fhaol\u00e1in", county: "Kerry", type: "NC7 (Commercial)", status: "under-review", progress: 55, submitted: "2026-03-03", approved: null, daysPending: 9 },
  { id: "ESB-NC6-1037", customer: "Declan Finnerty", county: "Mayo", type: "NC6 (Domestic)", status: "submitted", progress: 20, submitted: "2026-03-10", approved: null, daysPending: 3 },
];

const INITIAL_FOLLOWUPS: Followup[] = [
  { customer: "Anne Doyle", county: "Galway", daysWaiting: 5, status: "warning", nextAction: "Day 5 follow-up sent" },
  { customer: "Pat Smith", county: "Dublin", daysWaiting: 12, status: "warning", nextAction: "Day 10 follow-up sent" },
  { customer: "Tom Kelly", county: "Limerick", daysWaiting: 18, status: "urgent", nextAction: "ESCALATED" },
  { customer: "Declan Finnerty", county: "Mayo", daysWaiting: 3, status: "normal", nextAction: "Day 5 follow-up scheduled" },
];

const INITIAL_TIMELINE: TimelineEvent[] = [
  { time: "09:30", event: "ESB permit approved \u2014 Mary Walsh (NC6, Cork)" },
  { time: "10:15", event: "Application submitted \u2014 Anne Doyle (NC7, Galway)" },
  { time: "11:00", event: "Day 5 follow-up sent \u2014 Anne Doyle (NC7)" },
  { time: "13:30", event: "Day 10 follow-up sent \u2014 Pat Smith (NC6)" },
  { time: "14:45", event: "Application escalated \u2014 Tom Kelly (18 days pending)" },
  { time: "15:30", event: "New application submitted \u2014 Declan Finnerty (NC6, Mayo)" },
];

const NEW_CUSTOMERS = ["Eileen Collins", "Michael Ryan", "Catherine Lynch", "John Keane"];
const NEW_COUNTIES = ["Clare", "Waterford", "Wexford", "Kilkenny"];
const PERMIT_TYPES = ["NC6 (Domestic)", "NC7 (Commercial)"];

function getPermitStatusStyle(status: PermitStatus): React.CSSProperties {
  const map: Record<PermitStatus, { bg: string; color: string }> = {
    submitted: { bg: "rgba(59,130,246,0.07)", color: "#3B82F6" },
    "under-review": { bg: "rgba(242,204,46,0.07)", color: "#F2CC2E" },
    approved: { bg: "rgba(34,197,94,0.07)", color: "#22C55E" },
    rejected: { bg: "rgba(239,68,68,0.07)", color: "#EF4444" },
    escalated: { bg: "rgba(249,115,22,0.07)", color: "#F97316" },
  };
  const s = map[status];
  return { background: s.bg, color: s.color };
}

function getPermitStatusLabel(status: PermitStatus): string {
  const map: Record<PermitStatus, string> = {
    submitted: "SUBMITTED",
    "under-review": "UNDER REVIEW",
    approved: "APPROVED",
    rejected: "REJECTED",
    escalated: "ESCALATED",
  };
  return map[status];
}

function getFollowupColor(days: number): string {
  if (days >= 15) return "#EF4444";
  if (days >= 8) return "#F2CC2E";
  return "#22C55E";
}

function getFollowupLabel(days: number): string {
  if (days >= 15) return "URGENT \u2014 ESCALATE";
  if (days >= 8) return "WARNING \u2014 FOLLOW UP";
  return "NORMAL";
}

function fmtTime() {
  return new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export default function PermittingDashboard() {
  const [clock, setClock] = useState("12:00:00");
  const [permits, setPermits] = useState<Permit[]>(INITIAL_PERMITS.map((p) => ({ ...p })));
  const [followups, setFollowups] = useState<Followup[]>(INITIAL_FOLLOWUPS.map((f) => ({ ...f })));
  const [timeline, setTimeline] = useState<TimelineEvent[]>(INITIAL_TIMELINE.map((t) => ({ ...t })));
  const [stats, setStats] = useState({ activePermits: 9, approvedToday: 2, avgProcessing: 12.5, followupsToday: 3 });

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
      setPermits((prev) => {
        const next = prev.map((p) => ({ ...p }));
        const newEvents: TimelineEvent[] = [];
        let approvedDelta = 0;
        let followupDelta = 0;

        next.forEach((permit) => {
          if (permit.status === "approved" || permit.status === "rejected") return;

          // Increment days pending
          permit.daysPending++;

          if (permit.status === "submitted") {
            permit.progress = Math.min(40, permit.progress + 2);
            if (permit.daysPending >= 5) {
              permit.status = "under-review";
              permit.progress = 45;
              newEvents.push({ time: fmtTime(), event: `Application under review \u2014 ${permit.customer} (${permit.type})` });
            }
          } else if (permit.status === "under-review") {
            permit.progress = Math.min(90, permit.progress + 3);

            // Day 5 follow-up
            if (permit.daysPending === 5) {
              followupDelta++;
              newEvents.push({ time: fmtTime(), event: `Day 5 follow-up sent \u2014 ${permit.customer} (${permit.type})` });
            }
            // Day 10 follow-up
            if (permit.daysPending === 10) {
              followupDelta++;
              newEvents.push({ time: fmtTime(), event: `Day 10 follow-up sent \u2014 ${permit.customer} (${permit.type})` });
            }
            // Day 15 escalation
            if (permit.daysPending === 15) {
              permit.status = "escalated";
              newEvents.push({ time: fmtTime(), event: `Application escalated \u2014 ${permit.customer} (${permit.type}) \u2014 manager notified` });
            }
            // Random approval
            if (Math.random() > 0.92) {
              permit.status = "approved";
              permit.progress = 100;
              permit.approved = new Date().toISOString().slice(0, 10);
              approvedDelta++;
              newEvents.push({ time: fmtTime(), event: `ESB permit approved \u2014 ${permit.customer} (${permit.type})` });
            }
          } else if (permit.status === "escalated" && Math.random() > 0.8) {
            permit.status = "approved";
            permit.progress = 100;
            permit.approved = new Date().toISOString().slice(0, 10);
            approvedDelta++;
            newEvents.push({ time: fmtTime(), event: `ESB permit approved (escalated) \u2014 ${permit.customer} (${permit.type})` });
          }
        });

        // Update followups based on current permits
        const updatedFollowups: Followup[] = [];
        next.forEach((permit) => {
          if (permit.status !== "approved" && permit.status !== "rejected") {
            let status: FollowupLevel = "normal";
            if (permit.daysPending >= 15) status = "urgent";
            else if (permit.daysPending >= 8) status = "warning";
            updatedFollowups.push({
              customer: permit.customer,
              county: permit.county,
              daysWaiting: permit.daysPending,
              status,
              nextAction: status === "urgent" ? "ESCALATED" : status === "warning" ? "Follow-up sent" : "Monitoring",
            });
          }
        });
        setFollowups(updatedFollowups);

        // New permit occasionally
        if (Math.random() > 0.85 && next.length < 12) {
          const idx = Math.floor(Math.random() * NEW_CUSTOMERS.length);
          const type = PERMIT_TYPES[Math.floor(Math.random() * PERMIT_TYPES.length)];
          const prefix = type === "NC6 (Domestic)" ? "NC6" : "NC7";
          next.unshift({
            id: `ESB-${prefix}-${1100 + next.length}`,
            customer: NEW_CUSTOMERS[idx],
            county: NEW_COUNTIES[idx],
            type,
            status: "submitted",
            progress: 5,
            submitted: new Date().toISOString().slice(0, 10),
            approved: null,
            daysPending: 0,
          });
          newEvents.push({ time: fmtTime(), event: `New permit application \u2014 ${NEW_CUSTOMERS[idx]} (${type}, ${NEW_COUNTIES[idx]})` });
        }

        // Update timeline
        if (newEvents.length > 0) {
          setTimeline((prevTl) => [...newEvents, ...prevTl].slice(0, 6));
        }

        // Update stats
        const activePermits = next.filter((p) => p.status !== "approved").length;
        setStats((s) => ({
          ...s,
          activePermits,
          approvedToday: s.approvedToday + approvedDelta,
          followupsToday: s.followupsToday + followupDelta,
        }));

        return next;
      });

      // Avg processing days random walk with 2 decimal precision
      setStats((s) => {
        let change = (Math.random() - 0.5) * 0.4;
        let newValue = s.avgProcessing + change;
        if (newValue < 7.0) newValue = 7.0;
        if (newValue > 21.0) newValue = 21.0;
        return { ...s, avgProcessing: parseFloat(newValue.toFixed(2)) };
      });
    }, 4000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="prmt-dash" style={S.laptopMockup}><style>{`@media(max-width:767px){.prmt-dash .sr{grid-template-columns:repeat(2,1fr)!important;gap:8px!important;margin-bottom:12px!important}.prmt-dash .tc{grid-template-columns:1fr!important;gap:8px!important;margin-bottom:12px!important}.prmt-dash .ft{flex-direction:column!important;gap:2px!important;text-align:center}.prmt-dash .screen{aspect-ratio:auto!important;min-height:500px}}`}</style>
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

        {/* Permitting Main */}
        <div style={S.permittingMain}>
          {/* Stats Row */}
          <div className="sr" style={S.statsRow}>
            <div style={S.statCard}><div style={S.statNumber}>{stats.activePermits}</div><div style={S.statLabel}>ACTIVE PERMITS</div></div>
            <div style={S.statCard}><div style={S.statNumber}>{stats.approvedToday}</div><div style={S.statLabel}>APPROVED TODAY</div></div>
            <div style={S.statCard}><div style={S.statNumber}>{stats.avgProcessing.toFixed(2)}</div><div style={S.statLabel}>AVG PROCESSING (days)</div></div>
            <div style={S.statCard}><div style={S.statNumber}>{stats.followupsToday}</div><div style={S.statLabel}>FOLLOW-UPS TODAY</div></div>
          </div>

          {/* Two Column: Permits + Follow-ups */}
          <div className="tc" style={S.twoCol}>
            {/* Active Permits */}
            <div style={S.panel}>
              <div style={S.panelHeader}>ACTIVE PERMITS</div>
              <div style={S.panelContent}>
                {permits.map((permit) => (
                  <div key={permit.id} style={S.permitCard}>
                    <div style={S.permitHeader}>
                      <span style={S.permitId}>#{permit.id}</span>
                      <span style={{ ...S.permitStatusBadge, ...getPermitStatusStyle(permit.status) }}>
                        {getPermitStatusLabel(permit.status)}
                      </span>
                    </div>
                    <div style={S.permitCustomer}>{permit.customer} &middot; {permit.county}</div>
                    <div style={S.permitType}>{permit.type}</div>
                    <div style={S.permitDate}>Submitted: {permit.submitted}</div>
                    {permit.status !== "approved" && (
                      <div style={S.progressBar}><div style={{ ...S.progressFill, width: `${permit.progress}%` }} /></div>
                    )}
                    {permit.approved && (
                      <div style={{ ...S.permitDate, color: "#22C55E" }}>Approved: {permit.approved}</div>
                    )}
                    {permit.status !== "approved" && permit.status !== "rejected" && permit.daysPending > 0 && (
                      <div style={S.followupBadge}>Pending: {permit.daysPending} days</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Follow-up Tracking */}
            <div style={S.panel}>
              <div style={S.panelHeader}>FOLLOW-UP TRACKING</div>
              <div style={S.panelContent}>
                {followups.map((fu, i) => (
                  <div key={i} style={S.followupItem}>
                    <span style={S.followupCustomer}>{fu.customer} &middot; {fu.county}</span>
                    <span style={{ ...S.followupDays, color: getFollowupColor(fu.daysWaiting) }}>
                      {fu.daysWaiting} days &middot; {getFollowupLabel(fu.daysWaiting)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Permit Timeline */}
          <div style={S.panel}>
            <div style={S.panelHeader}>PERMIT TIMELINE</div>
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
        <div className="ft" style={S.permittingFooter}>
          <span>AI-powered permitting &middot; ESB Networks &middot; NC6/NC7 &middot; Auto-follow-up</span>
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
  permittingMain: {
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
  permitCard: {
    background: "#0F0F0F",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    borderLeft: "3px solid #F2CC2E",
  },
  permitHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  permitId: {
    color: "#F2CC2E",
    fontSize: 11,
    fontFamily: "monospace",
    fontWeight: 600,
  },
  permitStatusBadge: {
    fontSize: 9,
    fontWeight: 600,
    padding: "3px 8px",
    borderRadius: 20,
  },
  permitCustomer: {
    color: "#EEE",
    fontSize: 12,
    fontWeight: 500,
    margin: "4px 0",
  },
  permitType: {
    color: "#22C55E",
    fontSize: 10,
    fontWeight: 600,
  },
  permitDate: {
    color: "#888",
    fontSize: 8,
    marginTop: 4,
  },
  followupBadge: {
    fontSize: 8,
    fontWeight: 600,
    padding: "3px 6px",
    borderRadius: 12,
    background: "rgba(239,68,68,0.07)",
    color: "#EF4444",
    marginTop: 6,
    display: "inline-block",
  },
  progressBar: { height: 3, background: "#1A1A1A", borderRadius: 3, marginTop: 6, overflow: "hidden" },
  progressFill: { height: 3, background: "#22C55E", borderRadius: 3, transition: "width 0.5s ease" },
  followupItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 0",
    borderBottom: "1px solid #1E1E1E",
  },
  followupCustomer: {
    color: "#CCC",
    fontSize: 10,
  },
  followupDays: {
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
  permittingFooter: {
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
