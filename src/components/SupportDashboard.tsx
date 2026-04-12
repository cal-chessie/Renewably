"use client";

import { useState, useEffect } from "react";

/* ============================================================
   SUPPORT DASHBOARD — Interactive customer support agent mockup
   ============================================================ */

const SATISFACTION = 98.47;

const INITIAL_TICKETS = [
  { id: "TKT-1042", customer: "Mary Walsh", county: "Cork", subject: "When will my installation start?", status: "in-progress" as const, time: "2 min ago" },
  { id: "TKT-1041", customer: "Pat Smith", county: "Dublin", subject: "Grant application status update", status: "open" as const, time: "15 min ago" },
  { id: "TKT-1040", customer: "Anne Doyle", county: "Galway", subject: "ESB permit delay", status: "escalated" as const, time: "45 min ago" },
  { id: "TKT-1039", customer: "Tom Kelly", county: "Limerick", subject: "Quote revision request", status: "open" as const, time: "1 hour ago" },
  { id: "TKT-1038", customer: "Siobhán Ní Fhaoláin", county: "Kerry", subject: "Battery storage compatibility", status: "in-progress" as const, time: "2 hours ago" },
];

const INITIAL_CONVERSATIONS = [
  { customer: "Mary Walsh", agent: "Sophie", message: "Your installation is scheduled for tomorrow at 8am. Crew will call 30 mins before.", time: "Just now", type: "agent" as const },
  { customer: "Pat Smith", agent: "system", message: "Your SEAI grant application has been submitted. Tracking ID: SEAI-2026-0382", time: "5 min ago", type: "system" as const },
  { customer: "Anne Doyle", agent: "David", message: "I've escalated your permit issue to ESB Networks. Will update within 24 hours.", time: "12 min ago", type: "agent" as const },
  { customer: "Tom Kelly", agent: "system", message: "Your quote has been revised. Check your email for details.", time: "25 min ago", type: "system" as const },
];

const INITIAL_RESPONSES = [
  { customer: "Mary Walsh", question: "Installation date?", responseTime: "1.2 min", delay: false },
  { customer: "Pat Smith", question: "Grant status?", responseTime: "3.5 min", delay: false },
  { customer: "Anne Doyle", question: "Permit delay?", responseTime: "12.0 min", delay: true },
  { customer: "John McCarthy", question: "Battery pricing?", responseTime: "2.1 min", delay: false },
];

const NEW_CUSTOMERS = ["Eileen Collins", "Michael Ryan", "Catherine Lynch", "John Keane"];
const NEW_COUNTIES = ["Clare", "Waterford", "Wexford", "Kilkenny"];
const NEW_SUBJECTS = ["Quote request", "Installation question", "Grant enquiry", "Permit status"];

function statusStyle(status: string): React.CSSProperties {
  const map: Record<string, { bg: string; color: string }> = {
    open: { bg: "rgba(239,68,68,0.07)", color: "#EF4444" },
    "in-progress": { bg: "rgba(242,204,46,0.07)", color: "#F2CC2E" },
    resolved: { bg: "rgba(34,197,94,0.07)", color: "#22C55E" },
    escalated: { bg: "rgba(249,115,22,0.07)", color: "#F97316" },
  };
  const s = map[status] || map.open;
  return { background: s.bg, color: s.color };
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    open: "🟡 OPEN",
    "in-progress": "⚡ IN PROGRESS",
    resolved: "✅ RESOLVED",
    escalated: "🚨 ESCALATED",
  };
  return map[status] || status.toUpperCase();
}

function convIcon(type: string) {
  if (type === "agent") return "🤖";
  if (type === "system") return "⚙️";
  return "👤";
}

function convAgentLabel(type: string) {
  if (type === "agent") return undefined; // use agent name
  if (type === "system") return "System";
  return "Customer";
}

export default function SupportDashboard() {
  const [clock, setClock] = useState("12:00:00");
  const [openTickets, setOpenTickets] = useState(8);
  const [resolvedToday, setResolvedToday] = useState(12);
  const [avgResponse, setAvgResponse] = useState(2.4);
  const [tickets, setTickets] = useState(INITIAL_TICKETS.map((t) => ({ ...t })));
  const [conversations, setConversations] = useState(INITIAL_CONVERSATIONS.map((c) => ({ ...c })));
  const [responses, setResponses] = useState(INITIAL_RESPONSES.map((r) => ({ ...r })));
  const [ticketCounter, setTicketCounter] = useState(1042 + INITIAL_TICKETS.length);

  // Clock
  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString("en-GB"));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Simulation
  useEffect(() => {
    const id = setInterval(() => {
      let resolved = 0;
      let newTicketCounter = ticketCounter;

      setTickets((prev) => {
        const next = prev.map((t) => {
          const nt = { ...t };
          if (nt.status === "in-progress" && Math.random() > 0.7) {
            nt.status = "resolved";
            resolved++;
          } else if (nt.status === "open" && Math.random() > 0.8) {
            nt.status = "in-progress";
          }
          return nt;
        });

        // New ticket
        if (Math.random() > 0.85) {
          const idx = Math.floor(Math.random() * NEW_CUSTOMERS.length);
          const subjIdx = Math.floor(Math.random() * NEW_SUBJECTS.length);
          newTicketCounter++;
          next.unshift({
            id: `TKT-${newTicketCounter}`,
            customer: NEW_CUSTOMERS[idx],
            county: NEW_COUNTIES[idx],
            subject: NEW_SUBJECTS[subjIdx],
            status: "open",
            time: "Just now",
          });

          setConversations((prevC) => {
            const nc = [
              { customer: NEW_CUSTOMERS[idx], agent: "system", message: `New ticket created: ${NEW_SUBJECTS[subjIdx]}`, time: "Just now", type: "system" as const },
              ...prevC,
            ].slice(0, 8);
            return nc;
          });
        }

        setTicketCounter(newTicketCounter);
        const open = next.filter((t) => t.status !== "resolved").length;
        setOpenTickets(open);
        return next;
      });

      if (resolved > 0) setResolvedToday((r) => r + resolved);
      setAvgResponse((a) => Math.max(0.5, Math.min(5, a + (Math.random() - 0.5) * 0.3)));
    }, 4000);
    return () => clearInterval(id);
  }, [ticketCounter]);

  return (
    <div style={S.laptopMockup}>
      <div style={S.screen}>
        {/* Taskbar */}
        <div style={S.taskbar}>
          <div style={S.taskbarIcons}>
            {["💬", "⚡", "📄", "🤖"].map((icon) => (
              <div key={icon} style={S.taskbarIcon}>{icon}</div>
            ))}
          </div>
          <div style={S.clock}>{clock}</div>
        </div>

        {/* Main */}
        <div style={S.main}>
          {/* Stats */}
          <div style={S.statsRow}>
            <div style={S.statCard}><div style={S.statNumber}>{openTickets}</div><div style={S.statLabel}>OPEN TICKETS</div></div>
            <div style={S.statCard}><div style={S.statNumber}>{resolvedToday}</div><div style={S.statLabel}>RESOLVED TODAY</div></div>
            <div style={S.statCard}><div style={S.statNumber}>{avgResponse.toFixed(1)}</div><div style={S.statLabel}>AVG RESPONSE (min)</div></div>
            <div style={S.statCard}><div style={S.statNumber}>{SATISFACTION.toFixed(2)}</div><div style={S.statLabel}>SATISFACTION (%)</div></div>
          </div>

          {/* Two Col */}
          <div style={S.twoCol}>
            {/* Tickets */}
            <div style={S.panel}>
              <div style={S.panelHeader}>🎫 OPEN TICKETS</div>
              <div style={S.panelContent}>
                {tickets.filter((t) => t.status !== "resolved").map((ticket) => (
                  <div key={ticket.id} style={S.ticketCard}>
                    <div style={S.ticketHeader}>
                      <span style={S.ticketId}>#{ticket.id}</span>
                      <span style={{ ...S.ticketStatus, ...statusStyle(ticket.status) }}>{statusLabel(ticket.status)}</span>
                    </div>
                    <div style={S.ticketSubject}>{ticket.subject}</div>
                    <div style={S.ticketCustomer}>👤 {ticket.customer} · {ticket.county}</div>
                    <div style={S.ticketTime}>⏱️ {ticket.time}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Conversations */}
            <div style={S.panel}>
              <div style={S.panelHeader}>💬 LIVE CONVERSATIONS</div>
              <div style={S.panelContent}>
                {conversations.map((conv, i) => (
                  <div key={i} style={S.convItem}>
                    <div style={S.convAvatar}>{convIcon(conv.type)}</div>
                    <div style={S.convContent}>
                      <div style={S.convName}>
                        {conv.customer} → {conv.type === "agent" ? conv.agent : convAgentLabel(conv.type)}
                      </div>
                      <div style={S.convMessage}>{conv.message}</div>
                      <div style={S.convTime}>{conv.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Response Times */}
          <div style={S.panel}>
            <div style={S.panelHeader}>⏱️ RESPONSE TIMES</div>
            <div style={S.panelContent}>
              {responses.map((item, i) => (
                <div key={i} style={S.responseCard}>
                  <div style={S.responseHeader}>
                    <span style={S.responseCustomer}>👤 {item.customer}</span>
                    <span style={{ ...S.responseTime, color: item.delay ? "#EF4444" : "#22C55E" }}>⏱️ {item.responseTime}</span>
                  </div>
                  <div style={S.responseQuestion}>❓ {item.question}</div>
                  <div style={S.progressBar}>
                    <div style={{ ...S.progressFill, width: item.delay ? "0%" : "100%", background: item.delay ? "#EF4444" : "#22C55E" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={S.footer}>
          <span>💬 AI-powered customer support · 24/7 · Zero wait</span>
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
  main: {
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
  ticketCard: {
    background: "#0F0F0F",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    borderLeft: "3px solid #F2CC2E",
  },
  ticketHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  ticketId: { color: "#F2CC2E", fontSize: 11, fontFamily: "monospace", fontWeight: 600 },
  ticketStatus: { fontSize: 9, fontWeight: 600, padding: "3px 6px", borderRadius: 20 },
  ticketSubject: { color: "#EEE", fontSize: 12, fontWeight: 500, margin: "4px 0" },
  ticketCustomer: { color: "#555", fontSize: 10 },
  ticketTime: { color: "#444", fontSize: 8, marginTop: 4 },
  convItem: {
    display: "flex",
    gap: 10,
    padding: "8px 0",
    borderBottom: "1px solid #1E1E1E",
  },
  convAvatar: {
    width: 28,
    height: 28,
    background: "#1A1A1A",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 11,
    flexShrink: 0,
  },
  convContent: { flex: 1 },
  convName: { color: "#F2CC2E", fontSize: 11, fontWeight: 600 },
  convMessage: { color: "#AAA", fontSize: 10, marginTop: 3 },
  convTime: { color: "#444", fontSize: 8 },
  responseCard: {
    background: "#0F0F0F",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  responseHeader: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  responseCustomer: { color: "#EEE", fontSize: 11, fontWeight: 500 },
  responseTime: { fontSize: 10, fontWeight: 600 },
  responseQuestion: { color: "#555", fontSize: 10 },
  progressBar: { height: 3, background: "#1A1A1A", borderRadius: 3, marginTop: 6, overflow: "hidden" },
  progressFill: { height: 3, borderRadius: 3, transition: "width 0.5s ease" },
  footer: {
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
