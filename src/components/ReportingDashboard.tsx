"use client";

import { useState, useEffect } from "react";

/* ============================================================
   REPORTING DASHBOARD — Interactive reporting agent laptop mockup
   ============================================================ */

interface Bottleneck {
  name: string;
  severity: "high" | "medium" | "low";
  count: number;
  detail: string;
}

interface AgentPerf {
  name: string;
  metric: string;
  value: string;
  status: "excellent" | "good" | "warning";
}

interface TimelineEvent {
  time: string;
  event: string;
}

const INITIAL_BOTTLENECKS: Bottleneck[] = [
  { name: "ESB Permits", severity: "high", count: 3, detail: "3.00 applications pending >10 days" },
  { name: "SEAI Grants", severity: "medium", count: 2, detail: "2.00 applications awaiting customer docs" },
  { name: "Equipment Delivery", severity: "medium", count: 1, detail: "1.00 order delayed (ETA +3 days)" },
  { name: "Customer Follow-up", severity: "low", count: 4, detail: "4.00 quotes awaiting customer response" },
];

const INITIAL_AGENT_PERF: AgentPerf[] = [
  { name: "CEO Agent", metric: "Strategy reviews", value: "4/4 completed", status: "excellent" },
  { name: "Operations Agent", metric: "Jobs coordinated", value: "47.00 jobs", status: "excellent" },
  { name: "Customer Support", metric: "Response time", value: "2.40 min avg", status: "excellent" },
  { name: "Grants Agent", metric: "Applications", value: "12.00 active / 92.00% approval", status: "good" },
  { name: "Logistics Agent", metric: "On-time delivery", value: "94.00%", status: "good" },
  { name: "Permitting Agent", metric: "Permits tracked", value: "9.00 active / 3.00 delayed", status: "warning" },
  { name: "QA Agent", metric: "Quality score", value: "98.50%", status: "excellent" },
  { name: "Reporting Agent", metric: "Reports generated", value: "Weekly summary sent", status: "excellent" },
];

const INITIAL_TIMELINE: TimelineEvent[] = [
  { time: "Week 10", event: "MRR: \u20AC44,800.00 / +8.20% / 12.00 jobs completed" },
  { time: "Week 9", event: "MRR: \u20AC41,400.00 / +6.80% / 11.00 jobs completed" },
  { time: "Week 8", event: "MRR: \u20AC38,800.00 / +5.20% / 9.00 jobs completed" },
  { time: "Week 7", event: "MRR: \u20AC36,900.00 / +4.10% / 8.00 jobs completed" },
  { time: "Week 6", event: "MRR: \u20AC35,400.00 / +3.50% / 7.00 jobs completed" },
];

const KPI_DATA = [
  { title: "Monthly Recurring Revenue", value: "\u20AC44,800.00", change: "+8.20% vs last month", positive: true },
  { title: "Homes Activated", value: "1,245", change: "+47 this month", positive: true },
  { title: "Energy Generated (MTD)", value: "149,333 kWh", change: "+7.90% vs last month", positive: true },
  { title: "Lead Conversion Rate", value: "60.00%", change: "+5.00% vs last month", positive: true },
];

function fmt2(v: number): string {
  return v.toFixed(2);
}

function getSeverityColor(severity: string): { bg: string; color: string } {
  if (severity === "high") return { bg: "rgba(239,68,68,0.07)", color: "#EF4444" };
  if (severity === "low") return { bg: "rgba(34,197,94,0.07)", color: "#22C55E" };
  return { bg: "rgba(242,204,46,0.07)", color: "#F2CC2E" };
}

function getSeverityLabel(severity: string): string {
  if (severity === "high") return "HIGH";
  if (severity === "low") return "LOW";
  return "MEDIUM";
}

function getAgentStatusColor(status: string): string {
  if (status === "excellent") return "#22C55E";
  if (status === "good") return "#888";
  return "#EF4444";
}

function getAgentStatusIcon(status: string): string {
  if (status === "excellent") return "\u2713";
  if (status === "good") return "\u2713";
  return "!";
}

export default function ReportingDashboard() {
  const [clock, setClock] = useState("12:00:00");
  const [jobsInProgress, setJobsInProgress] = useState(12.0);
  const [jobsCompleted, setJobsCompleted] = useState(47.0);
  const [revenueForecast, setRevenueForecast] = useState(124.5);
  const [costTracking, setCostTracking] = useState(32.8);
  const [bottlenecks, setBottlenecks] = useState<Bottleneck[]>(INITIAL_BOTTLENECKS.map((b) => ({ ...b })));
  const [agentPerf, setAgentPerf] = useState<AgentPerf[]>(INITIAL_AGENT_PERF.map((a) => ({ ...a })));
  const [timeline, setTimeline] = useState<TimelineEvent[]>(INITIAL_TIMELINE.map((t) => ({ ...t })));

  // Clock
  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString("en-GB"));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Simulation tick every 4 seconds
  useEffect(() => {
    const id = setInterval(() => {
      // Jobs in progress random walk
      setJobsInProgress((prev) => {
        let change = (Math.random() - 0.5) * 1.5;
        let next = prev + change;
        if (next < 8) next = 8;
        if (next > 18) next = 18;
        return parseFloat(next.toFixed(2));
      });

      // Jobs completed incremental
      setJobsCompleted((prev) => {
        let change = Math.random() > 0.7 ? Math.random() * 3 + 0.5 : 0;
        let next = prev + change;
        if (next > 99) next = 99;
        return parseFloat(next.toFixed(2));
      });

      // Revenue forecast random walk
      setRevenueForecast((prev) => {
        let change = (Math.random() - 0.5) * 3;
        let next = prev + change;
        if (next < 100) next = 100;
        if (next > 180) next = 180;
        return parseFloat(next.toFixed(2));
      });

      // Cost tracking random walk
      setCostTracking((prev) => {
        let change = (Math.random() - 0.5) * 1.5;
        let next = prev + change;
        if (next < 25) next = 25;
        if (next > 45) next = 45;
        return parseFloat(next.toFixed(2));
      });

      // Bottlenecks dynamic updates
      setBottlenecks((prev) => {
        const next = prev.map((b) => ({ ...b }));
        next.forEach((b) => {
          if (b.name === "ESB Permits" && Math.random() > 0.7) {
            let countChange = Math.random() > 0.6 ? 1 : -1;
            let newCount = b.count + countChange;
            if (newCount < 0) newCount = 0;
            if (newCount > 5) newCount = 5;
            b.count = parseFloat(newCount.toFixed(2));
            b.detail = `${fmt2(b.count)} applications pending >10 days`;
            if (b.count === 0) b.severity = "low";
            else if (b.count <= 2) b.severity = "medium";
            else b.severity = "high";
          }
          if (b.name === "SEAI Grants" && Math.random() > 0.7) {
            let countChange = Math.random() > 0.6 ? 1 : -1;
            let newCount = b.count + countChange;
            if (newCount < 0) newCount = 0;
            if (newCount > 4) newCount = 4;
            b.count = parseFloat(newCount.toFixed(2));
            b.detail = `${fmt2(b.count)} applications awaiting customer docs`;
            if (b.count === 0) b.severity = "low";
            else if (b.count === 1) b.severity = "medium";
            else b.severity = "high";
          }
          if (b.name === "Equipment Delivery" && Math.random() > 0.8) {
            let newCount = Math.random() > 0.7 ? 1 : 0;
            b.count = parseFloat(newCount.toFixed(2));
            b.detail = b.count === 1 ? "1.00 order delayed (ETA +3 days)" : "No delivery delays";
            b.severity = b.count === 1 ? "medium" : "low";
          }
        });
        return next;
      });

      // Agent performance dynamic updates
      setAgentPerf((prev) => {
        return prev.map((a) => {
          const copy = { ...a };
          if (copy.name === "Permitting Agent") {
            const permitCount = 3;
            if (permitCount > 2) {
              copy.status = "warning";
              copy.value = `${fmt2(permitCount)} active / ${fmt2(permitCount)} delayed`;
            } else {
              copy.status = "good";
              copy.value = `${fmt2(permitCount)} active / ${fmt2(permitCount)} delayed`;
            }
          }
          if (copy.name === "Logistics Agent") {
            if (Math.random() > 0.5) {
              copy.status = "warning";
              copy.value = "93.00% on-time";
            } else {
              copy.status = "excellent";
              copy.value = "96.00% on-time";
            }
          }
          return copy;
        });
      });

      // Occasionally add a weekly summary entry
      if (Math.random() > 0.92) {
        setTimeline((prev) => {
          const weekNum = 11 - prev.length;
          const mrrValue = (124.5 * 0.36).toFixed(2);
          const growthPercent = (Math.random() * 10 + 2).toFixed(2);
          const jobsThisWeek = Math.floor(Math.random() * 15) + 5;
          const newEvent: TimelineEvent = {
            time: `Week ${weekNum}`,
            event: `MRR: \u20AC${mrrValue}k / +${growthPercent}% / ${jobsThisWeek}.00 jobs completed`,
          };
          const updated = [newEvent, ...prev];
          if (updated.length > 8) updated.pop();
          return updated;
        });
      }
    }, 4000);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={S.laptopMockup}>
      <div style={S.screen}>
        {/* Taskbar */}
        <div style={S.taskbar}>
          <div style={S.taskbarIcons}>
            {["\u26A1", "\u25A0", "\u25B6"].map((icon, i) => (
              <div key={i} style={S.taskbarIcon}>{icon}</div>
            ))}
          </div>
          <div style={S.clock}>{clock}</div>
        </div>

        {/* Reporting Main */}
        <div style={S.reportingMain}>
          {/* Stats Row */}
          <div style={S.statsRow}>
            <div style={S.statCard}>
              <div style={S.statNumber}>{fmt2(jobsInProgress)}</div>
              <div style={S.statLabel}>JOBS IN PROGRESS</div>
            </div>
            <div style={S.statCard}>
              <div style={S.statNumber}>{fmt2(jobsCompleted)}</div>
              <div style={S.statLabel}>COMPLETED (MTD)</div>
            </div>
            <div style={S.statCard}>
              <div style={S.statNumber}>{revenueForecast.toFixed(2)}</div>
              <div style={S.statLabel}>REVENUE FORECAST (€ K)</div>
            </div>
            <div style={S.statCard}>
              <div style={S.statNumber}>{costTracking.toFixed(2)}</div>
              <div style={S.statLabel}>COST TRACKING (€ K)</div>
            </div>
          </div>

          {/* Two Column: Key Metrics + Bottlenecks */}
          <div style={S.twoCol}>
            {/* KEY METRICS */}
            <div style={S.panel}>
              <div style={S.panelHeader}>KEY METRICS</div>
              <div style={S.panelContent}>
                {KPI_DATA.map((kpi, i) => (
                  <div key={i} style={S.kpiInline}>
                    <div style={S.kpiTitle}>{kpi.title}</div>
                    <div style={S.kpiValue}>{kpi.value}</div>
                    <div style={{ ...S.kpiChange, color: kpi.positive ? "#22C55E" : "#EF4444" }}>
                      {kpi.positive ? "\u2191" : "\u2193"} {kpi.change}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* BOTTLENECKS IDENTIFIED */}
            <div style={S.panel}>
              <div style={S.panelHeader}>BOTTLENECKS IDENTIFIED</div>
              <div style={S.panelContent}>
                {bottlenecks.map((b, i) => {
                  const sevStyle = getSeverityColor(b.severity);
                  return (
                    <div key={i}>
                      <div style={S.bottleneckItem}>
                        <span style={S.bottleneckName}>{b.name}</span>
                        <span style={{ ...S.bottleneckSeverity, ...sevStyle }}>
                          {getSeverityLabel(b.severity)} / {fmt2(b.count)} issues
                        </span>
                      </div>
                      <div style={S.bottleneckDetail}>{b.detail}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Two Column: Agent Performance + Timeline */}
          <div style={S.twoCol}>
            {/* AGENT PERFORMANCE */}
            <div style={S.panel}>
              <div style={S.panelHeader}>AGENT PERFORMANCE</div>
              <div style={S.panelContent}>
                {agentPerf.map((agent, i) => (
                  <div key={i} style={S.agentPerfItem}>
                    <span style={S.agentPerfName}>{agent.name}</span>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ ...S.agentPerfValue, color: getAgentStatusColor(agent.status) }}>
                        {agent.metric}: {agent.value}
                      </span>
                      <span style={{ color: getAgentStatusColor(agent.status), fontSize: 9, fontWeight: 700 }}>
                        {getAgentStatusIcon(agent.status)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* WEEKLY SUMMARY TIMELINE */}
            <div style={S.panel}>
              <div style={S.panelHeader}>WEEKLY SUMMARY TIMELINE</div>
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
        </div>

        {/* Footer */}
        <div style={S.reportingFooter}>
          <span>AI-powered business intelligence / No guesswork / Just the truth</span>
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
  reportingMain: {
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
  kpiInline: {
    background: "#0F0F0F",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    borderLeft: "3px solid #F2CC2E",
  },
  kpiTitle: {
    color: "#EEE",
    fontSize: 11,
    fontWeight: 500,
  },
  kpiValue: {
    color: "#F2CC2E",
    fontSize: 18,
    fontWeight: 700,
    marginTop: 3,
  },
  kpiChange: {
    fontSize: 8,
    marginTop: 2,
  },
  bottleneckItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 0",
    borderBottom: "1px solid #1E1E1E",
  },
  bottleneckName: {
    color: "#CCC",
    fontSize: 10,
  },
  bottleneckSeverity: {
    fontSize: 9,
    fontWeight: 600,
    padding: "3px 7px",
    borderRadius: 12,
  },
  bottleneckDetail: {
    fontSize: 8,
    color: "#666",
    marginTop: 3,
    paddingLeft: 8,
  },
  agentPerfItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "7px 0",
    borderBottom: "1px solid #1E1E1E",
  },
  agentPerfName: {
    color: "#F2CC2E",
    fontSize: 10,
    fontWeight: 500,
  },
  agentPerfValue: {
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
  reportingFooter: {
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
