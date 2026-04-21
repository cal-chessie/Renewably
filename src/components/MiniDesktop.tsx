"use client";

import { useState, useEffect, useCallback } from "react";

/* ============================================================
   MINI DESKTOP — Interactive laptop mockup dashboard
   ============================================================ */

const AGENTS_DATA = [
  { name: "CEO", icon: "🎯", progress: 78 },
  { name: "Operations", icon: "📋", progress: 62 },
  { name: "Support", icon: "💬", progress: 100 },
  { name: "Grants", icon: "💰", progress: 45 },
  { name: "Logistics", icon: "🚚", progress: 88 },
  { name: "Permitting", icon: "📜", progress: 32 },
  { name: "QA", icon: "🔍", progress: 100 },
  { name: "Reporting", icon: "📊", progress: 55 },
];

const RT_AGENTS = [
  { name: "CEO", task: "Reviewing", progress: 65, icon: "🎯" },
  { name: "Ops", task: "Tracking", progress: 42, icon: "📋" },
  { name: "Support", task: "Answered", progress: 100, icon: "💬" },
  { name: "Grants", task: "Submitted", progress: 38, icon: "💰" },
  { name: "Logistics", task: "Ordered", progress: 88, icon: "🚚" },
  { name: "Permitting", task: "Follow up", progress: 52, icon: "📜" },
  { name: "QA", task: "Reviewed", progress: 100, icon: "🔍" },
  { name: "Reporting", task: "Summary", progress: 45, icon: "📊" },
];

const NAMES = ["Mary Walsh", "Pat Smith", "Anne Doyle", "Tom Kelly"];
const MPRNS = ["10023441892", "10016311002", "10016311003", "10016311005"];
const KWS = ["4.2 kWp", "5.1 kWp", "3.8 kWp", "6.0 kWp"];

export default function MiniDesktop() {
  // Clock
  const [clock, setClock] = useState("");
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setClock(now.toLocaleTimeString("en-GB"));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Command Centre KPIs
  const [tasks, setTasks] = useState(847);
  const [completion, setCompletion] = useState(68);
  const [energy, setEnergy] = useState(18750);

  // Paperwork
  const [forms, setForms] = useState(12);
  const [grants, setGrants] = useState(8);
  const [permits, setPermits] = useState(7);
  const [hoursSaved, setHoursSaved] = useState(47);
  const [seaiName, setSeaiName] = useState("_________");
  const [seaiMprn, setSeaiMprn] = useState("_________");
  const [seaiKw, setSeaiKw] = useState("_________");
  const [fillIdx, setFillIdx] = useState(0);

  // Real-time agents
  const [rtAgents, setRtAgents] = useState(RT_AGENTS.map((a) => ({ ...a })));

  // Installs
  type InstallItem = { name: string; status: string; progress: number; logistics: string; crew: string };
  const [installs, setInstalls] = useState<InstallItem[]>([
    { name: "Mary Walsh", status: "in_progress", progress: 68, logistics: "12 panels arrived", crew: "Sean's team" },
    { name: "Pat Smith", status: "scheduled", progress: 0, logistics: "Delivery 14:00", crew: "Mary's team" },
    { name: "Anne Doyle", status: "completed", progress: 100, logistics: "Install complete", crew: "Pat's team" },
    { name: "Tom Kelly", status: "in_progress", progress: 32, logistics: "14 panels", crew: "Owen's team" },
  ]);

  const fillForm = useCallback(() => {
    const idx = fillIdx % NAMES.length;
    setSeaiName(NAMES[idx]);
    setSeaiMprn(MPRNS[idx]);
    setSeaiKw(KWS[idx]);
    setForms((f) => f + 1);
    setHoursSaved((h) => h + 2);
    setFillIdx((i) => i + 1);
    setTimeout(() => setGrants((g) => g + 1), 5000);
  }, [fillIdx]);

  // Global tick
  useEffect(() => {
    const id = setInterval(() => {
      setTasks((t) => t + Math.floor(Math.random() * 4) + 1);
      setCompletion((c) => Math.min(99, c + (Math.random() > 0.7 ? 1 : 0)));
      setEnergy((e) => e + Math.floor(Math.random() * 20) + 10);

      setRtAgents((prev) =>
        prev.map((a) => {
          if (a.progress < 100 && a.name !== "Support" && a.name !== "QA") {
            const newProg = Math.min(100, a.progress + Math.floor(Math.random() * 8) + 2);
            const resetMap: Record<string, number> = { Grants: 3000, CEO: 4000, Logistics: 3500, Permitting: 5000, Reporting: 4000 };
            if (newProg >= 100) {
              setTimeout(() => {
                setRtAgents((inner) =>
                  inner.map((ia) => (ia.name === a.name ? { ...ia, progress: 0, task: a.task } : ia))
                );
              }, resetMap[a.name] || 4000);
            }
            return { ...a, progress: newProg };
          }
          if ((a.name === "Support" || a.name === "QA") && a.progress >= 100) {
            setTimeout(() => {
              setRtAgents((inner) =>
                inner.map((ia) => (ia.name === a.name ? { ...ia, progress: 0 } : ia))
              );
            }, 2000);
          }
          return a;
        })
      );

      setInstalls((prev) =>
        prev.map((inst) => {
          if (inst.status === "in_progress") {
            const np = Math.min(100, inst.progress + Math.floor(Math.random() * 6) + 2);
            return np >= 100 ? { ...inst, progress: 100, status: "completed" } : { ...inst, progress: np };
          }
          if (inst.status === "scheduled" && Math.random() > 0.7) {
            return { ...inst, status: "in_progress", progress: 5 };
          }
          return inst;
        })
      );
    }, 4000);
    return () => clearInterval(id);
  }, []);

  const activityItems = [
    { icon: "🎯", text: "CEO Agent approved budget", time: "now" },
    { icon: "💬", text: "Support answered 8 queries", time: "2m ago" },
    { icon: "💰", text: "Grants Agent submitted SEAI", time: "5m ago" },
  ];

  const grantStatuses = [
    { name: "Mary Walsh (Cork)", status: "✅ Approved" },
    { name: "Pat Smith (Dublin)", status: "🟡 Under review" },
    { name: "Anne Doyle (Galway)", status: "📋 Submitted" },
  ];

  return (
    <div className="md-dash" style={styles.laptopMockup}>
      <style>{`@media (max-width:767px){.md-dash .wg{grid-template-columns:1fr!important;height:auto!important}.md-dash .screen{aspect-ratio:auto!important;min-height:600px}}`}</style>
      {/* Screen */}
      <div style={styles.screen}>
        {/* Taskbar — NO LOGO */}
        <div style={styles.taskbar}>
          <div style={styles.taskbarIcons}>
            {["⚡", "📄", "🤖", "🔧"].map((icon) => (
              <div key={icon} style={styles.taskbarIcon}>{icon}</div>
            ))}
          </div>
          <div style={styles.clock}>{clock}</div>
        </div>

        {/* 2x2 Window Grid */}
        <div className="wg" style={styles.windowGrid}>
          {/* Window 1: Command Centre */}
          <div style={styles.window}>
            <div style={styles.windowHeader}>
              <div style={styles.windowTitle}><span>⚡</span> COMMAND CENTRE</div>
              <div style={styles.windowControls}>
                <div style={{ ...styles.windowControl, background: "#EF4444" }} />
                <div style={{ ...styles.windowControl, background: "#F2CC2E" }} />
                <div style={{ ...styles.windowControl, background: "#22C55E" }} />
              </div>
            </div>
            <div style={styles.windowContent}>
              {/* KPIs */}
              <div style={styles.kpiRow}>
                <div style={styles.kpiCard}><div style={styles.kpiValue}>{tasks}</div><div style={styles.kpiLabel}>TASKS TODAY</div></div>
                <div style={styles.kpiCard}><div style={styles.kpiValue}>{completion}%</div><div style={styles.kpiLabel}>COMPLETION</div></div>
                <div style={styles.kpiCard}><div style={styles.kpiValue}>{(energy / 1000).toFixed(1)}k</div><div style={styles.kpiLabel}>ENERGY (kWh)</div></div>
                <div style={styles.kpiCard}><div style={styles.kpiValue}>8+1</div><div style={styles.kpiLabel}>AGENTS (9TH SOON)</div></div>
              </div>
              <div style={styles.sectionTitle}>📋 RECENT ACTIVITY</div>
              {activityItems.map((item, i) => (
                <div key={i} style={styles.activityItem}>
                  <div style={styles.activityIcon}>{item.icon}</div>
                  <div style={styles.activityText}>{item.text}</div>
                  <div style={styles.activityTime}>{item.time}</div>
                </div>
              ))}
              <div style={styles.sectionTitle}>🤖 AGENT STATUS</div>
              {AGENTS_DATA.map((a, i) => (
                <div key={i} style={styles.agentItem}>
                  <div style={styles.agentName}><span>{a.icon}</span> {a.name}</div>
                  <div style={styles.agentProgress}><div style={{ ...styles.agentProgressFill, width: `${a.progress}%` }} /></div>
                </div>
              ))}
            </div>
          </div>

          {/* Window 2: Paperwork Engine */}
          <div style={styles.window}>
            <div style={styles.windowHeader}>
              <div style={styles.windowTitle}><span>📄</span> PAPERWORK ENGINE</div>
              <div style={styles.windowControls}>
                <div style={{ ...styles.windowControl, background: "#EF4444" }} />
                <div style={{ ...styles.windowControl, background: "#F2CC2E" }} />
                <div style={{ ...styles.windowControl, background: "#22C55E" }} />
              </div>
            </div>
            <div style={styles.windowContent}>
              <div style={styles.kpiRow}>
                <div style={styles.kpiCard}><div style={styles.kpiValue}>{forms}</div><div style={styles.kpiLabel}>FORMS DONE</div></div>
                <div style={styles.kpiCard}><div style={styles.kpiValue}>{grants}</div><div style={styles.kpiLabel}>GRANTS</div></div>
                <div style={styles.kpiCard}><div style={styles.kpiValue}>{permits}</div><div style={styles.kpiLabel}>PERMITS</div></div>
                <div style={styles.kpiCard}><div style={styles.kpiValue}>{hoursSaved}</div><div style={styles.kpiLabel}>HOURS SAVED</div></div>
              </div>
              <div style={styles.mockForm}>
                <div style={styles.formRow}><span>🏠 Applicant</span><span style={styles.formValue}>{seaiName}</span></div>
                <div style={styles.formRow}><span>🔢 MPRN</span><span style={styles.formValue}>{seaiMprn}</span></div>
                <div style={styles.formRow}><span>⚡ System kW</span><span style={styles.formValue}>{seaiKw}</span></div>
                <button style={styles.aiBtn} onClick={fillForm}>🤖 AI AUTO-FILL GRANT</button>
              </div>
              <div style={styles.sectionTitle}>📊 GRANT TRACKING</div>
              {grantStatuses.map((g, i) => (
                <div key={i} style={styles.grantStatus}>
                  <span>{g.name}</span>
                  <span style={{ color: "#22C55E" }}>{g.status}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Window 3: Real-Time Engine */}
          <div style={styles.window}>
            <div style={styles.windowHeader}>
              <div style={styles.windowTitle}><span>🤖</span> REAL-TIME ENGINE</div>
              <div style={styles.windowControls}>
                <div style={{ ...styles.windowControl, background: "#EF4444" }} />
                <div style={{ ...styles.windowControl, background: "#F2CC2E" }} />
                <div style={{ ...styles.windowControl, background: "#22C55E" }} />
              </div>
            </div>
            <div style={styles.windowContent}>
              <div style={styles.sectionTitle}>⚡ HEARTBEAT STATUS</div>
              {rtAgents.map((a, i) => (
                <div key={i} style={styles.agentItem}>
                  <div style={styles.agentName}><span>{a.icon}</span> {a.name}</div>
                  <div style={{ ...styles.agentProgress, flex: 1, margin: "0 6px" }}><div style={{ ...styles.agentProgressFill, width: `${a.progress}%` }} /></div>
                  <span style={{ fontSize: 9, color: "#555" }}>{a.task}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Window 4: Install Orchestrator */}
          <div style={styles.window}>
            <div style={styles.windowHeader}>
              <div style={styles.windowTitle}><span>🔧</span> INSTALL ORCHESTRATOR</div>
              <div style={styles.windowControls}>
                <div style={{ ...styles.windowControl, background: "#EF4444" }} />
                <div style={{ ...styles.windowControl, background: "#F2CC2E" }} />
                <div style={{ ...styles.windowControl, background: "#22C55E" }} />
              </div>
            </div>
            <div style={styles.windowContent}>
              <div style={styles.sectionTitle}>🚧 ACTIVE INSTALLS</div>
              {installs.map((inst, i) => (
                <div key={i} style={styles.installCard}>
                  <div style={styles.installHeader}>
                    <span style={styles.installName}>🏠 {inst.name}</span>
                    <span style={styles.installStatus}>
                      {inst.status === "in_progress" ? "⚡ IN PROG" : inst.status === "scheduled" ? "📅 SCHED" : "✅ DONE"}
                    </span>
                  </div>
                  <div style={styles.installDetail}><span>📦</span><span>{inst.logistics}</span></div>
                  <div style={styles.installDetail}><span>👷</span><span>{inst.crew}</span></div>
                  {inst.status === "in_progress" ? (
                    <div style={styles.progressSmall}><div style={{ ...styles.progressSmallFill, width: `${inst.progress}%` }} /></div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Laptop Bottom */}
      <div style={styles.laptopBottom}>
        <div style={styles.trackpad} />
      </div>
    </div>
  );
}

/* ============================================================
   INLINE STYLES — all styles via inline objects (Tailwind HMR safe)
   ============================================================ */
const styles: Record<string, React.CSSProperties> = {
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
  },
  taskbar: {
    background: "#0F0F0F",
    padding: "0.4rem 1rem",
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    borderBottom: "1px solid #2A2A2A",
  },
  taskbarIcons: { display: "flex", gap: 6, marginRight: "auto" },
  taskbarIcon: {
    width: 26,
    height: 26,
    background: "#1A1A1A",
    borderRadius: 6,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 13,
    cursor: "default",
  },
  clock: {
    fontSize: 11,
    fontWeight: 500,
    color: "#AAA",
    background: "#0A0A0A",
    padding: "4px 12px",
    borderRadius: 6,
    letterSpacing: 0.5,
  },
  windowGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: 1,
    background: "#1A1A1A",
    height: "calc(100% - 42px)",
  },
  window: {
    background: "#0F0F0F",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  windowHeader: {
    background: "#0A0A0A",
    padding: "0.5rem 0.7rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #2A2A2A",
  },
  windowTitle: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 10,
    fontWeight: 600,
    color: "#DDD",
    letterSpacing: -0.2,
  },
  windowControls: { display: "flex", gap: 5 },
  windowControl: { width: 10, height: 10, borderRadius: "50%", cursor: "default" },
  windowContent: {
    padding: "0.7rem",
    flex: 1,
    overflowY: "auto",
    fontSize: 10,
    scrollbarWidth: "thin",
    scrollbarColor: "#2A2A2A transparent",
  },
  kpiRow: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: 8,
    marginBottom: 12,
  },
  kpiCard: {
    background: "#0A0A0A",
    borderRadius: 8,
    padding: "8px 4px",
    textAlign: "center",
  },
  kpiValue: {
    color: "#F2CC2E",
    fontSize: 16,
    fontWeight: 700,
    letterSpacing: -0.3,
  },
  kpiLabel: {
    color: "#555",
    fontSize: 8,
    fontWeight: 500,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: 600,
    color: "#555",
    textTransform: "uppercase" as const,
    letterSpacing: 0.8,
    margin: "8px 0 4px",
  },
  activityItem: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "5px 0",
    borderBottom: "1px solid #1A1A1A",
  },
  activityIcon: {
    width: 22,
    height: 22,
    background: "#1A1A1A",
    borderRadius: 5,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 10,
  },
  activityText: { flex: 1, fontSize: 9, fontWeight: 500, color: "#AAA" },
  activityTime: { fontSize: 7, fontWeight: 400, color: "#444" },
  agentItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "4px 0",
    borderBottom: "1px solid #1A1A1A",
  },
  agentName: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    fontSize: 9,
    fontWeight: 500,
    color: "#CCC",
  },
  agentProgress: {
    width: 60,
    height: 3,
    background: "#1A1A1A",
    borderRadius: 3,
    overflow: "hidden",
  },
  agentProgressFill: {
    height: 3,
    background: "#F2CC2E",
    borderRadius: 3,
    transition: "width 0.5s ease",
  },
  mockForm: {
    background: "#0A0A0A",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  formRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "4px 0",
    fontSize: 8,
    fontWeight: 500,
    borderBottom: "1px solid #1A1A1A",
  },
  formValue: {
    color: "#F2CC2E",
    fontFamily: "monospace",
  },
  aiBtn: {
    background: "rgba(242,204,46,0.07)",
    border: "1px solid rgba(242,204,46,0.19)",
    color: "#F2CC2E",
    padding: "5px 8px",
    borderRadius: 16,
    fontSize: 8,
    fontWeight: 600,
    cursor: "pointer",
    width: "100%",
    fontFamily: "inherit",
    marginTop: 6,
    transition: "all 0.15s",
  },
  grantStatus: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "4px 0",
    fontSize: 8,
    fontWeight: 500,
    borderBottom: "1px solid #1A1A1A",
  },
  installCard: {
    borderBottom: "1px solid #1A1A1A",
    padding: "6px 0",
  },
  installHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 3,
  },
  installName: { color: "#F2CC2E", fontSize: 10, fontWeight: 600 },
  installStatus: { fontSize: 7, fontWeight: 500, color: "#22C55E" },
  installDetail: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 7,
    fontWeight: 400,
    color: "#777",
    padding: "2px 0",
  },
  progressSmall: {
    height: 3,
    background: "#1A1A1A",
    borderRadius: 3,
    margin: "3px 0",
  },
  progressSmallFill: {
    height: 3,
    background: "#22C55E",
    borderRadius: 3,
    transition: "width 0.5s ease",
  },
  laptopBottom: {
    background: "#111",
    width: "97%",
    marginTop: -1,
    borderRadius: "0 0 12px 12px",
    padding: "8px",
    display: "flex",
    justifyContent: "center",
  },
  trackpad: {
    width: 150,
    height: 6,
    background: "#1A1A1A",
    borderRadius: 3,
  },
};
