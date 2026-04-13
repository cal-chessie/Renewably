"use client";

import { useState, useEffect } from "react";

/* ============================================================
   LOGISTICS DASHBOARD — Interactive logistics agent laptop mockup
   ============================================================ */

type OrderStatus = "ordered" | "dispatched" | "delivered" | "delayed";
type StockLevel = "high" | "medium" | "low";

interface LogisticsOrder {
  id: string;
  customer: string;
  county: string;
  items: string;
  status: OrderStatus;
  progress: number;
  ordered: string;
  delivered: string | null;
  eta: string | null;
}

interface InventoryItem {
  name: string;
  stock: number;
  reorderPoint: number;
  status: StockLevel;
  unitValue: number;
}

interface TimelineEvent {
  time: string;
  event: string;
}

const INITIAL_ORDERS: LogisticsOrder[] = [
  { id: "ORD-2026-1042", customer: "Mary Walsh", county: "Cork", items: "12 panels, 1 inverter, 1 battery", status: "delivered", progress: 100, ordered: "2026-03-10", delivered: "2026-03-12", eta: null },
  { id: "ORD-2026-1041", customer: "Pat Smith", county: "Dublin", items: "8 panels, 1 inverter", status: "dispatched", progress: 75, ordered: "2026-03-11", delivered: null, eta: "2026-03-13" },
  { id: "ORD-2026-1040", customer: "Anne Doyle", county: "Galway", items: "10 panels, 1 inverter", status: "ordered", progress: 30, ordered: "2026-03-12", delivered: null, eta: "2026-03-15" },
  { id: "ORD-2026-1039", customer: "Tom Kelly", county: "Limerick", items: "14 panels, 1 inverter", status: "delayed", progress: 20, ordered: "2026-03-08", delivered: null, eta: "2026-03-14" },
  { id: "ORD-2026-1038", customer: "Siobh\u00e1n N\u00ed Fhaol\u00e1in", county: "Kerry", items: "6 panels, 1 battery", status: "dispatched", progress: 60, ordered: "2026-03-10", delivered: null, eta: "2026-03-13" },
];

const INITIAL_INVENTORY: InventoryItem[] = [
  { name: "Solar Panels (400W)", stock: 847, reorderPoint: 200, status: "high", unitValue: 0.12 },
  { name: "Inverters (5kW)", stock: 56, reorderPoint: 30, status: "high", unitValue: 0.45 },
  { name: "Batteries (5kWh)", stock: 23, reorderPoint: 25, status: "low", unitValue: 0.85 },
  { name: "Mounting Rails", stock: 1450, reorderPoint: 500, status: "high", unitValue: 0.02 },
  { name: "Cabling (per metre)", stock: 4200, reorderPoint: 1000, status: "high", unitValue: 0.008 },
  { name: "Isolators", stock: 18, reorderPoint: 20, status: "low", unitValue: 0.035 },
];

const INITIAL_TIMELINE: TimelineEvent[] = [
  { time: "08:30", event: "Order ORD-2026-1042 delivered \u2014 Mary Walsh (Cork)" },
  { time: "09:45", event: "Order ORD-2026-1041 dispatched \u2014 Pat Smith (Dublin)" },
  { time: "10:15", event: "Inventory alert: Batteries below reorder point (23/25)" },
  { time: "11:30", event: "New order created \u2014 Anne Doyle (10 panels, 1 inverter)" },
  { time: "13:00", event: "Supplier order placed \u2014 50 batteries (ETA 3 days)" },
  { time: "14:20", event: "Order ORD-2026-1039 delayed \u2014 Tom Kelly (weather)" },
];

const NEW_CUSTOMERS = ["Eileen Collins", "Michael Ryan", "Catherine Lynch", "John Keane"];
const NEW_COUNTIES = ["Clare", "Waterford", "Wexford", "Kilkenny"];
const ITEMS_LIST = ["8 panels, 1 inverter", "10 panels, 1 inverter, 1 battery", "12 panels, 1 inverter", "6 panels, 1 battery"];

function getOrderStatusStyle(status: OrderStatus): React.CSSProperties {
  const map: Record<OrderStatus, { bg: string; color: string }> = {
    ordered: { bg: "rgba(59,130,246,0.07)", color: "#3B82F6" },
    dispatched: { bg: "rgba(242,204,46,0.07)", color: "#F2CC2E" },
    delivered: { bg: "rgba(34,197,94,0.07)", color: "#22C55E" },
    delayed: { bg: "rgba(239,68,68,0.07)", color: "#EF4444" },
  };
  const s = map[status];
  return { background: s.bg, color: s.color };
}

function getOrderStatusLabel(status: OrderStatus): string {
  const map: Record<OrderStatus, string> = {
    ordered: "ORDERED",
    dispatched: "DISPATCHED",
    delivered: "DELIVERED",
    delayed: "DELAYED",
  };
  return map[status];
}

function getStockColor(stock: number, reorderPoint: number): string {
  if (stock > reorderPoint * 2) return "#22C55E";
  if (stock > reorderPoint) return "#F2CC2E";
  return "#EF4444";
}

function getStockLabel(stock: number, reorderPoint: number): string {
  if (stock > reorderPoint * 2) return "HIGH";
  if (stock > reorderPoint) return "MEDIUM";
  return "LOW";
}

function fmtTime() {
  return new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export default function LogisticsDashboard() {
  const [clock, setClock] = useState("12:00:00");
  const [orders, setOrders] = useState<LogisticsOrder[]>(INITIAL_ORDERS.map((o) => ({ ...o })));
  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY.map((i) => ({ ...i })));
  const [timeline, setTimeline] = useState<TimelineEvent[]>(INITIAL_TIMELINE.map((t) => ({ ...t })));
  const [stats, setStats] = useState({ activeOrders: 8, deliveredToday: 4, onTimeRate: 94.0, inventoryValue: 124.8 });

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
      setOrders((prev) => {
        const next = prev.map((order) => ({ ...order }));
        const newEvents: TimelineEvent[] = [];
        let deliveredDelta = 0;

        next.forEach((order) => {
          if (order.status === "ordered" && Math.random() > 0.75) {
            order.status = "dispatched";
            order.progress = 60;
            newEvents.push({ time: fmtTime(), event: `Order ${order.id} dispatched \u2014 ${order.customer}` });
          } else if (order.status === "dispatched" && Math.random() > 0.8) {
            order.status = "delivered";
            order.progress = 100;
            order.delivered = new Date().toISOString().slice(0, 10);
            deliveredDelta++;
            newEvents.push({ time: fmtTime(), event: `Order ${order.id} delivered \u2014 ${order.customer}` });
          } else if (order.status === "delayed" && Math.random() > 0.7) {
            order.status = "dispatched";
            order.progress = 50;
            newEvents.push({ time: fmtTime(), event: `Order ${order.id} resolved \u2014 now dispatched` });
          }
        });

        // New order occasionally
        if (Math.random() > 0.85 && next.length < 12) {
          const idx = Math.floor(Math.random() * NEW_CUSTOMERS.length);
          const items = ITEMS_LIST[Math.floor(Math.random() * ITEMS_LIST.length)];
          const etaDate = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
          next.unshift({
            id: `ORD-2026-${1100 + next.length}`,
            customer: NEW_CUSTOMERS[idx],
            county: NEW_COUNTIES[idx],
            items,
            status: "ordered",
            progress: 5,
            ordered: new Date().toISOString().slice(0, 10),
            delivered: null,
            eta: etaDate,
          });
          newEvents.push({ time: fmtTime(), event: `New order created \u2014 ${NEW_CUSTOMERS[idx]} (${items})` });
        }

        // Update timeline
        if (newEvents.length > 0) {
          setTimeline((prevTl) => {
            let tl = [...newEvents, ...prevTl];
            return tl.slice(0, 6);
          });
        }

        // Update stats
        const activeOrders = next.filter((o) => o.status !== "delivered").length;
        if (deliveredDelta > 0) {
          setStats((s) => ({ ...s, activeOrders, deliveredToday: s.deliveredToday + deliveredDelta }));
        } else {
          setStats((s) => ({ ...s, activeOrders }));
        }

        return next;
      });

      setInventory((prev) => {
        const next = prev.map((item) => ({ ...item }));
        const newEvents: TimelineEvent[] = [];
        let valueDelta = 0;

        next.forEach((item) => {
          // Auto-reorder low stock
          if (item.status === "low" && Math.random() > 0.8) {
            const restockAmount = item.reorderPoint * 2;
            item.stock += restockAmount;
            item.status = "high";
            valueDelta += restockAmount * item.unitValue;
            newEvents.push({ time: fmtTime(), event: `Auto-reorder triggered \u2014 ${item.name} (+${restockAmount} units)` });
          }
          // Random consumption
          if (Math.random() > 0.6 && item.stock > 0) {
            const consumed = Math.floor(Math.random() * 5) + 1;
            item.stock = Math.max(0, item.stock - consumed);
            if (item.stock < item.reorderPoint && item.status !== "low") {
              item.status = "low";
              newEvents.push({ time: fmtTime(), event: `Low stock alert \u2014 ${item.name} (${item.stock} units remaining)` });
            } else if (item.stock > item.reorderPoint * 2) {
              item.status = "high";
            } else if (item.stock > item.reorderPoint) {
              item.status = "medium";
            }
          }
        });

        if (newEvents.length > 0) {
          setTimeline((prevTl) => {
            let tl = [...newEvents, ...prevTl];
            return tl.slice(0, 6);
          });
        }

        if (valueDelta > 0) {
          setStats((s) => ({ ...s, inventoryValue: s.inventoryValue + valueDelta }));
        }

        return next;
      });

      // On-time rate random walk
      setStats((s) => ({
        ...s,
        onTimeRate: Math.min(100, Math.max(85, s.onTimeRate + (Math.random() - 0.5) * 1.5)),
      }));
    }, 4000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="log-dash" style={S.laptopMockup}><style>{`@media(max-width:767px){.log-dash .sr{grid-template-columns:repeat(2,1fr)!important;gap:8px!important;margin-bottom:12px!important}.log-dash .tc{grid-template-columns:1fr!important;gap:8px!important;margin-bottom:12px!important}.log-dash .ft{flex-direction:column!important;gap:2px!important;text-align:center}.log-dash .screen{aspect-ratio:auto!important;min-height:500px}}`}</style>
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

        {/* Logistics Main */}
        <div style={S.logisticsMain}>
          {/* Stats Row */}
          <div className="sr" style={S.statsRow}>
            <div style={S.statCard}><div style={S.statNumber}>{stats.activeOrders}</div><div style={S.statLabel}>ACTIVE ORDERS</div></div>
            <div style={S.statCard}><div style={S.statNumber}>{stats.deliveredToday}</div><div style={S.statLabel}>DELIVERED TODAY</div></div>
            <div style={S.statCard}><div style={S.statNumber}>{stats.onTimeRate.toFixed(2)}</div><div style={S.statLabel}>ON-TIME RATE (%)</div></div>
            <div style={S.statCard}><div style={S.statNumber}>{stats.inventoryValue.toFixed(2)}</div><div style={S.statLabel}>INVENTORY VALUE (€ K)</div></div>
          </div>

          {/* Two Column: Orders + Inventory */}
          <div className="tc" style={S.twoCol}>
            {/* Active Orders */}
            <div style={S.panel}>
              <div style={S.panelHeader}>ACTIVE ORDERS</div>
              <div style={S.panelContent}>
                {orders.map((order) => (
                  <div key={order.id} style={S.orderCard}>
                    <div style={S.orderHeader}>
                      <span style={S.orderId}>#{order.id}</span>
                      <span style={{ ...S.orderStatusBadge, ...getOrderStatusStyle(order.status) }}>
                        {getOrderStatusLabel(order.status)}
                      </span>
                    </div>
                    <div style={S.orderCustomer}>{order.customer} &middot; {order.county}</div>
                    <div style={S.orderItems}>{order.items}</div>
                    <div style={S.orderDate}>Ordered: {order.ordered}</div>
                    {order.status !== "delivered" && (
                      <div style={S.progressBar}><div style={{ ...S.progressFill, width: `${order.progress}%` }} /></div>
                    )}
                    {order.eta && (
                      <div style={{ ...S.orderDate, color: "#F2CC2E" }}>ETA: {order.eta}</div>
                    )}
                    {order.delivered && (
                      <div style={{ ...S.orderDate, color: "#22C55E" }}>Delivered: {order.delivered}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Inventory Status */}
            <div style={S.panel}>
              <div style={S.panelHeader}>INVENTORY STATUS</div>
              <div style={S.panelContent}>
                {inventory.map((item, i) => (
                  <div key={i} style={S.inventoryItem}>
                    <span style={S.itemName}>{item.name}</span>
                    <span style={{ ...S.itemStock, color: getStockColor(item.stock, item.reorderPoint) }}>
                      {item.stock} units &middot; {getStockLabel(item.stock, item.reorderPoint)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Delivery Timeline */}
          <div style={S.panel}>
            <div style={S.panelHeader}>\u23f1\ufe0f DELIVERY TIMELINE</div>
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
        <div className="ft" style={S.logisticsFooter}>
          <span>AI-powered logistics &middot; Automated ordering &middot; Real-time tracking</span>
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
  logisticsMain: {
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
  orderCard: {
    background: "#0F0F0F",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    borderLeft: "3px solid #F2CC2E",
  },
  orderHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  orderId: {
    color: "#F2CC2E",
    fontSize: 11,
    fontFamily: "monospace",
    fontWeight: 600,
  },
  orderStatusBadge: {
    fontSize: 9,
    fontWeight: 600,
    padding: "3px 8px",
    borderRadius: 20,
  },
  orderCustomer: {
    color: "#EEE",
    fontSize: 12,
    fontWeight: 500,
    margin: "4px 0",
  },
  orderItems: {
    color: "#555",
    fontSize: 10,
  },
  orderDate: {
    color: "#444",
    fontSize: 8,
    marginTop: 4,
  },
  progressBar: { height: 3, background: "#1A1A1A", borderRadius: 3, marginTop: 6, overflow: "hidden" },
  progressFill: { height: 3, background: "#22C55E", borderRadius: 3, transition: "width 0.5s ease" },
  inventoryItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 0",
    borderBottom: "1px solid #1E1E1E",
  },
  itemName: {
    color: "#AAA",
    fontSize: 10,
  },
  itemStock: {
    fontSize: 10,
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
  timelineEvent: { fontSize: 11, color: "#AAA" },
  logisticsFooter: {
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
