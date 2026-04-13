"use client";

import { useState, useEffect } from "react";

/* ============================================================
   OPERATIONS DASHBOARD — Interactive ops agent laptop mockup
   ============================================================ */

const INITIAL_JOBS = [
  { id: 1, name: "Mary Walsh", county: "Cork", stage: "install" as const, progress: 68, crew: "Sean's Team" },
  { id: 2, name: "Pat Smith", county: "Dublin", stage: "permit" as const, progress: 45, crew: "Mary's Team" },
  { id: 3, name: "Anne Doyle", county: "Galway", stage: "grant" as const, progress: 80, crew: null },
  { id: 4, name: "Tom Kelly", county: "Limerick", stage: "assessment" as const, progress: 20, crew: null },
  { id: 5, name: "Siobhán Ní Fhaoláin", county: "Kerry", stage: "assessment" as const, progress: 0, crew: null },
  { id: 6, name: "Declan Finnerty", county: "Mayo", stage: "install" as const, progress: 45, crew: "Owen's Team" },
];

const INITIAL_CREWS = [
  { id: 1, name: "Sean's Team", task: "Installing Mary Walsh (Cork)", status: "active" as const, progress: 68 },
  { id: 2, name: "Mary's Team", task: "Waiting on ESB permit — Pat Smith", status: "waiting" as const, progress: 45 },
  { id: 3, name: "Owen's Team", task: "Installing Declan Finnerty (Mayo)", status: "active" as const, progress: 45 },
  { id: 4, name: "Pat's Team", task: "Awaiting SEAI grant — Anne Doyle", status: "idle" as const, progress: 80 },
];

const INITIAL_TIMELINE = [
  { time: "08:00", event: "Crews dispatched — Sean, Mary, Owen" },
  { time: "09:30", event: "Assessment completed — Tom Kelly (Limerick)" },
  { time: "11:00", event: "ESB permit filed — Pat Smith (Dublin)" },
  { time: "13:00", event: "Equipment delivered — Mary Walsh (Cork)" },
  { time: "14:00", event: "Installation started — Mary Walsh (Cork)" },
  { time: "15:30", event: "SEAI grant approved — Anne Doyle (Galway)" },
];

const NEW_NAMES = ["Eileen Collins", "Michael Ryan", "Catherine Lynch", "John Keane"];
const NEW_COUNTIES = ["Clare", "Waterford", "Wexford", "Kilkenny"];

function getStageStyle(stage: string): React.CSSProperties {
  const map: Record<string, { bg: string; color: string }> = {
    assessment: { bg: "rgba(59,130,246,0.07)", color: "#3B82F6" },
    quote: { bg: "rgba(139,92,246,0.07)", color: "#8B5CF6" },
    grant: { bg: "rgba(242,204,46,0.07)", color: "#F2CC2E" },
    permit: { bg: "rgba(249,115,22,0.07)", color: "#F97316" },
    install: { bg: "rgba(34,197,94,0.07)", color: "#22C55E" },
    complete: { bg: "rgba(34,197,94,0.07)", color: "#22C55E" },
  };
  const s = map[stage] || map.assessment;
  return { background: s.bg, color: s.color };
}

function getStageLabel(stage: string) {
  const map: Record<string, string> = {
    assessment: "📐 ASSESSMENT",
    quote: "📊 QUOTE",
    grant: "💰 GRANT",
    permit: "📜 PERMIT",
    install: "🔧 INSTALL",
    complete: "✅ COMPLETE",
  };
  return map[stage] || stage.toUpperCase();
}

function getStageHint(stage: string): { text: string; color: string } {
  const map: Record<string, { text: string; color: string }> = {
    install: { text: "", color: "" },
    assessment: { text: "📐 Site survey scheduled", color: "#3B82F6" },
    permit: { text: "⏳ ESB Networks — awaiting approval", color: "#F97316" },
    grant: { text: "⏳ SEAI — under review", color: "#F2CC2E" },
    quote: { text: "", color: "" },
    complete: { text: "", color: "" },
  };
  return map[stage] || { text: "", color: "" };
}

function getStatusStyle(status: string) {
  if (status === "active") return "⚡ ACTIVE";
  if (status === "waiting") return "⏳ WAITING";
  return "💤 IDLE";
}

function getStatusColor(status: string) {
  if (status === "active") return "#22C55E";
  if (status === "waiting") return "#F2CC2E";
  return "#555";
}

export default function OperationsDashboard() {
  const [clock, setClock] = useState("12:00:00");
  const [jobs, setJobs] = useState(INITIAL_JOBS.map((j) => ({ ...j })));
  const [crews, setCrews] = useState(INITIAL_CREWS.map((c) => ({ ...c })));
  const [timeline, setTimeline] = useState(INITIAL_TIMELINE.map((t) => ({ ...t })));
  const [stats, setStats] = useState({ activeJobs: 12, crewsActive: 4, assessments: 3, installs: 2 });

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
      setJobs((prev) => {
        const next = prev.map((j) => ({ ...j }));
        const newEvents: { time: string; event: string }[] = [];

        next.forEach((job) => {
          if (job.stage === "install" && job.progress < 100) {
            job.progress = Math.min(100, job.progress + Math.floor(Math.random() * 6) + 2);
            if (job.progress >= 100) {
              job.stage = "complete";
              newEvents.push({ time: fmtTime(), event: `Installation completed — ${job.name} (${job.county})` });
            }
          }
          if (job.stage === "permit" && job.progress < 100) {
            job.progress = Math.min(100, job.progress + Math.floor(Math.random() * 8) + 3);
            if (job.progress >= 100) {
              job.stage = "install";
              job.progress = 0;
              newEvents.push({ time: fmtTime(), event: `ESB permit approved — ${job.name} (${job.county})` });
            }
          }
          if (job.stage === "grant" && job.progress < 100) {
            job.progress = Math.min(100, job.progress + Math.floor(Math.random() * 6) + 2);
            if (job.progress >= 100) {
              job.stage = "permit";
              job.progress = 0;
              newEvents.push({ time: fmtTime(), event: `SEAI grant approved — ${job.name} (${job.county})` });
            }
          }
        });

        // New lead occasionally
        if (Math.random() > 0.9) {
          const idx = Math.floor(Math.random() * NEW_NAMES.length);
          next.unshift({ id: Date.now(), name: NEW_NAMES[idx], county: NEW_COUNTIES[idx], stage: "assessment", progress: 0, crew: null });
          newEvents.push({ time: fmtTime(), event: `New lead — ${NEW_NAMES[idx]} (${NEW_COUNTIES[idx]})` });
        }

        // Update timeline
        if (newEvents.length > 0) {
          setTimeline((prevTl) => {
            let tl = [...prevTl, ...newEvents];
            tl.sort((a, b) => (a.time > b.time ? -1 : 1));
            return tl.slice(0, 6);
          });
        }

        // Update stats
        const activeJobs = next.filter((j) => j.stage !== "complete").length;
        setStats((s) => ({ ...s, activeJobs }));
        return next;
      });

      setCrews((prev) => {
        const next = prev.map((c) => ({ ...c }));
        next.forEach((crew) => {
          if (crew.status === "active" && crew.progress < 100) {
            crew.progress = Math.min(100, crew.progress + Math.floor(Math.random() * 6) + 2);
            if (crew.progress >= 100) {
              crew.status = "idle";
              crew.task = "Awaiting next assignment";
            }
          }
        });
        const crewsActive = next.filter((c) => c.status === "active").length;
        setStats((s) => ({ ...s, crewsActive }));
        return next;
      });
    }, 4000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="ops-dash" style={S.laptopMockup}>
      <style>{`@media(max-width:767px){.ops-dash .sr{grid-template-columns:repeat(2,1fr)!important;gap:8px!important;margin-bottom:12px!important}.ops-dash .tc{grid-template-columns:1fr!important;gap:8px!important;margin-bottom:12px!important}.ops-dash .ft{flex-direction:column!important;gap:2px!important;text-align:center}.ops-dash .screen{aspect-ratio:auto!important;min-height:500px}}`}</style>
      <div style={S.screen}>
        {/* Taskbar */}
        <div style={S.taskbar}>
          <div style={S.taskbarIcons}>
            {["📋", "⚡", "📄", "🤖"].map((icon) => (
              <div key={icon} style={S.taskbarIcon}>{icon}</div>
            ))}
          </div>
          <div style={S.clock}>{clock}</div>
        </div>

        {/* Operations Main */}
        <div style={S.opsMain}>
          {/* Stats Row */}
          <div className="sr" style={S.statsRow}>
            <div style={S.statCard}><div style={S.statNumber}>{stats.activeJobs}</div><div style={S.statLabel}>ACTIVE JOBS</div></div>
            <div style={S.statCard}><div style={S.statNumber}>{stats.crewsActive}</div><div style={S.statLabel}>CREWS ON DUTY</div></div>
            <div style={S.statCard}><div style={S.statNumber}>{stats.assessments}</div><div style={S.statLabel}>TODAY&apos;S ASSESSMENTS</div></div>
            <div style={S.statCard}><div style={S.statNumber}>{stats.installs}</div><div style={S.statLabel}>TODAY&apos;S INSTALLS</div></div>
          </div>

          {/* Two Column */}
          <div className="tc" style={S.twoCol}>
            {/* Job Pipeline */}
            <div style={S.panel}>
              <div style={S.panelHeader}>📋 JOB PIPELINE</div>
              <div style={S.panelContent}>
                {jobs.map((job) => {
                  const hint = getStageHint(job.stage);
                  return (
                    <div key={job.id} style={S.jobCard}>
                      <div style={S.jobHeader}>
                        <div>
                          <div style={S.jobName}>🏠 {job.name}</div>
                          <div style={S.jobLocation}>{job.county}</div>
                        </div>
                        <div style={{ ...S.stageBadge, ...getStageStyle(job.stage) }}>{getStageLabel(job.stage)}</div>
                      </div>
                      {job.crew && <div style={S.jobCrew}>👷 Assigned: {job.crew}</div>}
                      {job.stage === "install" && (
                        <div style={S.progressBar}><div style={{ ...S.progressFill, width: `${job.progress}%` }} /></div>
                      )}
                      {hint.text && <div style={{ fontSize: 9, color: hint.color, marginTop: 3 }}>{hint.text}</div>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Crew Status */}
            <div style={S.panel}>
              <div style={S.panelHeader}>👷 CREW STATUS</div>
              <div style={S.panelContent}>
                {crews.map((crew) => (
                  <div key={crew.id} style={S.crewCard}>
                    <div style={S.crewName}>👷 {crew.name}</div>
                    <div style={S.crewTask}>📋 {crew.task}</div>
                    <div style={{ ...S.crewStatus, color: getStatusColor(crew.status) }}>{getStatusStyle(crew.status)}</div>
                    {crew.status === "active" && (
                      <div style={S.progressBar}><div style={{ ...S.progressFill, width: `${crew.progress}%` }} /></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div style={S.panel}>
            <div style={S.panelHeader}>⏱️ TODAY&apos;S TIMELINE</div>
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
        <div className="ft" style={S.opsFooter}>
          <span>⚡ AI-coordinated · Zero manual dispatch</span>
          <span>🔄 Auto-refresh every 4 seconds</span>
        </div>
      </div>

      {/* Laptop Bottom */}
      <div style={S.laptopBottom}>
        <div style={S.trackpad} />
      </div>
    </div>
  );
}

function fmtTime() {
  return new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
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
  opsMain: {
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
    color: "#555",
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
  jobCard: {
    background: "#0F0F0F",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    borderLeft: "3px solid #F2CC2E",
  },
  jobHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  jobName: { color: "#EEE", fontSize: 14, fontWeight: 600 },
  jobLocation: { color: "#555", fontSize: 10 },
  stageBadge: {
    fontSize: 10,
    fontWeight: 600,
    padding: "3px 8px",
    borderRadius: 20,
  },
  jobCrew: { fontSize: 10, color: "#22C55E", margin: "4px 0" },
  progressBar: { height: 3, background: "#1A1A1A", borderRadius: 3, marginTop: 8, overflow: "hidden" },
  progressFill: { height: 3, background: "#22C55E", borderRadius: 3, transition: "width 0.5s ease" },
  crewCard: {
    background: "#0F0F0F",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    borderLeft: "3px solid #3B82F6",
  },
  crewName: { color: "#F2CC2E", fontSize: 13, fontWeight: 600 },
  crewTask: { color: "#AAA", fontSize: 10, margin: "4px 0" },
  crewStatus: { fontSize: 9, fontWeight: 600, marginTop: 4 },
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
  timelineEvent: { fontSize: 11, color: "#AAA" },
  opsFooter: {
    padding: "10px 16px",
    background: "#0A0A0A",
    borderTop: "1px solid #1E1E1E",
    display: "flex",
    justifyContent: "space-between",
    fontSize: 10,
    color: "#444",
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
