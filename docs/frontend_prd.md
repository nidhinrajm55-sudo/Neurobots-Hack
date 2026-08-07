# Sentinel-X AI Engine — Frontend PRD
### Dashboard · Problems · Prioritization · Blast Radius

**Status:** Draft v1
**Scope:** Complete frontend spec (IA, tabs, components, states) + the exact backend API contract each tab consumes, so frontend and backend teams can build in parallel without blocking each other.

---

## 1. Product Shell

### 1.1 Layout
```
�┌──────────────────────────────────────────────────────────────────�┐
│  Sentinel-X AI Engine        [● LIVE]      [Trigger Attack � ▾]     │  <- top bar
├──────────────────────────────────────────────────────────────────�┤
│  Dashboard | Problems | Prioritization | Blast Radius              │  <- tab nav
├──────────────────────────────────────────────────────────────────�┤
│                                                                    │
│                        (active tab content)                       │
│                                                                    │
�└──────────────────────────────────────────────────────────────────�┘
```

### 1.2 Global elements (present on every tab)
| Element | Behavior |
|---|---|
| **System status pill** | `● LIVE` (green, pulsing) / `● DEGRADED` (amber) / `● CRITICAL` (red). Reflects worst node state system-wide. Polls `/status`. |
| **Trigger Attack dropdown** | Demo control: `Load Flood`, `Memory Leak`, `Stop Attack`. Calls `/attack/start` / `/attack/stop`. Hidden behind a `?demo=true` flag if you don't want it visible to judges by default — your call. |
| **Last updated timestamp** | Small text, bottom-right. Confirms polling/WebSocket is alive — important for live-demo trust. |
| **Toast/alert stream** | Slide-in notification when a node transitions to `degrading` or `critical`, and when a remediation action fires. Auto-dismiss after 6s, but also logged permanently in Problems tab. |

### 1.3 Global data flow
- **Polling interval:** 2–3s via `setInterval` fetch, or WebSocket (`/ws/live`) if time allows — WebSocket is nicer for the demo (no visible refresh flicker) but polling is lower-risk to implement under time pressure.
- **Client state:** single source of truth (React Context or Zustand store) holding `nodes[]`, `problems[]`, `actions[]` — all four tabs read from this shared store so they never disagree with each other on stage.

---

## 2. Tab 1 — Dashboard

### 2.1 Purpose
The "at a glance, is everything OK" view. This is what's on screen most of the demo. Optimized for legibility from the back of a room, not information density.

### 2.2 Components

**A. Node Status Grid** (top section)
- One card per service (e.g., `api-gateway`, `auth-service`, `order-service`, `payment-service`, `db`).
- Each card shows: service name, status badge (Healthy/Degrading/Critical), current CPU%, current memory, current p95 latency, current error rate.
- Card border/glow color reflects status. Critical cards pulse subtly.
- Click a card → deep-links to Blast Radius tab pre-filtered to that node.

**B. Live Metric Charts**
- Time-series line charts (last 60–120s rolling window) for: CPU%, Memory, Request rate, Error rate, p95 Latency — either one multi-line chart per metric, or a tab-within-tab toggle if space is tight.
- Vertical marker line drawn at the moment an attack was triggered and at the moment a remediation action fired — this visual "before/during/after" story is one of your strongest demo assets, prioritize building it.
- Library: Recharts or Chart.js.

**C. Model Confidence Panel**
- Small panel showing, per node, the live Random Forest class + confidence (`degrading, 82%`) and Isolation Forest anomaly score.
- This is what proves to judges the ML is actually running live, not just a scripted UI state change — don't cut this even under time pressure.

**D. Recent Activity Feed** (compact, last 5 events)
- Mini version of the Problems tab — "Anomaly detected on payment-service", "Remediation: rate-limit applied to payment-service".
- "View all" links to Problems tab.

### 2.3 States
- **Empty/startup:** "Waiting for first metrics…" skeleton loaders on cards.
- **All healthy:** grid all green, charts flat/low.
- **Active incident:** affected card(s) highlighted red/amber, chart shows the spike, activity feed populates in real time.

### 2.4 Backend contract

`GET /nodes` — polled every 2–3s
```json
{
  "nodes": [
    {
      "service": "payment-service",
      "status": "critical",
      "metrics": {
        "cpu_pct": 92.4,
        "memory_mb": 812.3,
        "request_rate": 340.2,
        "error_rate": 0.18,
        "p95_latency_ms": 1840
      },
      "model": {
        "rf_class": "critical",
        "rf_confidence": 0.87,
        "if_anomaly": true,
        "if_score": -0.31
      },
      "last_updated": "2026-08-07T10:22:31Z"
    }
  ],
  "system_status": "critical"
}
```

`GET /metrics/timeseries?service=payment-service&window=120s` — polled every 2–3s, or subscribed via WebSocket
```json
{
  "service": "payment-service",
  "points": [
    { "t": "2026-08-07T10:22:00Z", "cpu_pct": 40.1, "memory_mb": 300.0, "request_rate": 80.0, "error_rate": 0.01, "p95_latency_ms": 120 }
  ],
  "markers": [
    { "t": "2026-08-07T10:22:15Z", "type": "attack_start", "label": "Load Flood triggered" },
    { "t": "2026-08-07T10:22:29Z", "type": "action_taken", "label": "Rate limit applied" }
  ]
}
```

`GET /status` — system-wide pill, polled every 2–3s (or derive client-side from `/nodes` to save a call)
```json
{ "system_status": "critical", "worst_node": "payment-service" }
```

`POST /attack/start` `{ "scenario": "load_flood", "target": "payment-service" }` → `202 Accepted`
`POST /attack/stop` → `202 Accepted`

---

## 3. Tab 2 — Problems

### 3.1 Purpose
The chronological, evidence-grade log of everything the system detected and did — this is what you point to when a judge asks "prove it actually worked."

### 3.2 Components

**A. Problem List** (main content)
- Table/list, most recent first. Each row:
  - Timestamp
  - Service affected
  - Type: `Anomaly Detected` / `Threshold Breach` / `Remediation Triggered` / `Recovered`
  - Severity badge (Low/Medium/High/Critical)
  - Short human-readable description (generated server-side, see below)
  - Expand chevron → detail panel

**B. Problem Detail Panel** (expand-in-place or side drawer)
- Full feature snapshot at detection time (the actual numbers that triggered the flag)
- Model reasoning: `"Isolation Forest flagged payment-service: memory_trend +340% above baseline, CPU delta +58%"`
- Correlation info if available: `"Coincides with deployment/change event at 10:21:58"` (reuse the reference repo's correlation-engine idea — diff features before/after a change event)
- Linked action (if remediation fired): what action, when, outcome

**C. Filter bar**
- Filter by: service, severity, type, time range
- Search box for free text over descriptions

**D. Status/outcome tag**
- `Ongoing` / `Resolved` / `Auto-remediated` — lets judges see resolution, not just detection

### 3.3 States
- **No problems yet:** friendly empty state — "No issues detected. System healthy." with the live pill visible.
- **Active problem:** top row highlighted, auto-scrolls into view when a new one arrives (with a "new" flash animation, not jarring).

### 3.4 Backend contract

`GET /problems?service=&severity=&type=&from=&to=&q=`
```json
{
  "problems": [
    {
      "id": "prob_8231",
      "timestamp": "2026-08-07T10:22:29Z",
      "service": "payment-service",
      "type": "anomaly_detected",
      "severity": "critical",
      "description": "Isolation Forest flagged payment-service as anomalous: memory usage +340% above rolling baseline, CPU delta +58%.",
      "status": "auto_remediated",
      "detail": {
        "features": {
          "mean_cpu": 92.4, "cpu_trend": 0.58,
          "mean_memory": 812.3, "memory_trend": 3.4,
          "error_rate": 0.18, "error_rate_trend": 0.12
        },
        "model": { "rf_class": "critical", "rf_confidence": 0.87, "if_score": -0.31 },
        "correlated_change": {
          "change_id": "chg_991",
          "type": "deployment",
          "time": "2026-08-07T10:21:58Z",
          "note": "CPU usage increased 58% within 30s of deployment"
        },
        "linked_action_id": "act_552"
      }
    }
  ],
  "total": 1
}
```

`GET /problems/{id}` — full detail (same shape as one item above, used if you lazy-load detail instead of inlining it)

---

## 4. Tab 3 — Prioritization

### 4.1 Purpose
When multiple things are wrong at once, this tab answers "what do we fix first" — ranked by a composite urgency score, not just chronologically. This is the tab that demonstrates judgment, not just detection.

### 4.2 Ranking logic (backend-computed, frontend just displays)
Composite score per active problem, e.g.:
```
priority_score = (severity_weight × 0.4)
               + (model_confidence × 0.3)
               + (blast_radius_size × 0.2)
               + (recency_weight × 0.1)
```
Expose the score's components to the frontend so the UI can show *why* something ranks where it does — a bare ranked list without justification will get picked apart by judges.

### 4.3 Components

**A. Ranked list (primary view)**
- Numbered 1, 2, 3… descending priority.
- Each row: service, current status, priority score (e.g., `92/100`), a mini breakdown bar (stacked bar showing how much each factor contributed), and a one-line "why" summary: `"Ranked #1: critical severity, 87% model confidence, affects 3 downstream services"`.
- Primary CTA per row: `Remediate Now` (manual override button — calls the same action endpoint the auto-remediation engine uses) and `Dismiss` (mark as acknowledged, doesn't remediate).

**B. Score breakdown drawer**
- Click a row → shows the 4 weighted factors as a small bar/radar chart, plus the raw numbers behind each.

**C. "Auto vs Manual" toggle**
- Global switch: `Auto-remediate` (system acts on its own past a threshold) vs `Suggest only` (system ranks, human clicks Remediate Now). Good demo device — show both modes.

### 4.4 States
- **Nothing to prioritize:** empty state, same tone as Problems tab.
- **Single issue:** list of 1, no ranking drama needed, still show the score breakdown (proves the scoring works even trivially).
- **Multiple concurrent issues:** the tab's real payoff — show 2–3 ranked competing problems (e.g., trigger two attack scenarios in sequence during the demo to populate this convincingly).

### 4.5 Backend contract

`GET /prioritization`
```json
{
  "ranked": [
    {
      "problem_id": "prob_8231",
      "service": "payment-service",
      "rank": 1,
      "priority_score": 92,
      "breakdown": {
        "severity_weight": 0.4,
        "model_confidence": 0.87,
        "blast_radius_size": 3,
        "recency_weight": 0.95
      },
      "summary": "Critical severity, 87% model confidence, affects 3 downstream services.",
      "status": "ongoing"
    }
  ],
  "mode": "auto_remediate"
}
```

`POST /prioritization/mode` `{ "mode": "suggest_only" }` → `200 OK`

`POST /problems/{id}/remediate` (manual override — "Remediate Now" button) → `202 Accepted`, triggers same logic as auto-remediation engine, returns the created action:
```json
{ "action_id": "act_553", "service": "payment-service", "action": "rate_limit", "triggered_by": "manual" }
```

`POST /problems/{id}/dismiss` → `200 OK`

---

## 5. Tab 4 — Blast Radius

### 5.1 Purpose
The most visually striking tab — shows the dependency graph and highlights which nodes are affected now, and which are predicted to be affected next. This is your "wow" screen for judges.

### 5.2 Components

**A. Graph visualization** (primary content)
- Node-and-edge graph, one node per service, edges = dependency direction (arrow from dependent → depended-on, or vice versa — pick one convention and label it).
- Node color: Healthy (green) / At Risk – predicted (amber, dashed border) / Critical – confirmed (red, solid, pulsing).
- Edge highlight: edges along the predicted propagation path are drawn thicker/colored, other edges dimmed.
- Library: `react-flow` (fast to get a clean interactive graph working) or a simple force-directed layout via `d3-force` if you want more customization time allowing.
- Click a node → side panel with that node's current metrics + model scores (reuse Dashboard's node-detail content, don't rebuild it).

**B. Propagation timeline (below or beside graph)**
- Horizontal timeline: `Now: payment-service critical → +5min: order-service at risk (62% confidence) → +12min: api-gateway at risk (38% confidence)`.
- This directly visualizes the "confidence decays with depth" logic from the backend.

**C. Impact summary panel**
- `3 services at risk` / `Estimated time to full impact: 12 min` / `Estimated affected requests/min: 340` — reuse whatever impact-estimation formula you land on (even a simple, clearly-labeled demo formula is fine, just don't present made-up numbers as measured — say "estimated" in the UI copy).

**D. Root cause badge**
- Clearly marks which node is the *origin* vs which are *propagated* — judges will ask "which one crashed first," make that unambiguous at a glance (e.g., a small "ROOT CAUSE" tag pinned to the origin node).

### 5.3 States
- **No active incident:** graph shown all-green, static, no propagation panel (or a collapsed placeholder).
- **Active incident:** root node highlighted, propagation animates outward along edges (a simple CSS pulse/fade traveling along the edge on state change is enough — don't over-engineer the animation).

### 5.4 Backend contract

`GET /blast-radius/{service}` (called with the current root-cause node; frontend can also call with no param to get "current active root cause if any")
```json
{
  "root_cause": "payment-service",
  "graph": {
    "nodes": [
      { "id": "payment-service", "status": "critical", "role": "root_cause" },
      { "id": "order-service", "status": "at_risk", "role": "propagated", "confidence": 0.62, "eta_minutes": 5 },
      { "id": "api-gateway", "status": "at_risk", "role": "propagated", "confidence": 0.38, "eta_minutes": 12 },
      { "id": "auth-service", "status": "healthy", "role": "unaffected" }
    ],
    "edges": [
      { "from": "payment-service", "to": "order-service", "on_path": true },
      { "from": "order-service", "to": "api-gateway", "on_path": true },
      { "from": "auth-service", "to": "api-gateway", "on_path": false }
    ]
  },
  "impact": {
    "services_at_risk": 2,
    "estimated_time_to_full_impact_minutes": 12,
    "estimated_affected_requests_per_min": 340
  }
}
```

`GET /graph` (static topology, no live status — used to render the graph shell before any incident, or as a fallback)
```json
{
  "nodes": ["api-gateway", "auth-service", "order-service", "payment-service"],
  "edges": [
    { "from": "auth-service", "to": "api-gateway" },
    { "from": "api-gateway", "to": "order-service" },
    { "from": "order-service", "to": "payment-service" }
  ]
}
```

---

## 6. Shared Frontend Data Model (client-side types)

```typescript
type NodeStatus = "healthy" | "degrading" | "critical";
type ProblemType = "anomaly_detected" | "threshold_breach" | "remediation_triggered" | "recovered";
type ProblemStatus = "ongoing" | "resolved" | "auto_remediated" | "dismissed";

interface ServiceNode {
  service: string;
  status: NodeStatus;
  metrics: { cpu_pct: number; memory_mb: number; request_rate: number; error_rate: number; p95_latency_ms: number };
  model: { rf_class: NodeStatus; rf_confidence: number; if_anomaly: boolean; if_score: number };
  last_updated: string;
}

interface Problem {
  id: string;
  timestamp: string;
  service: string;
  type: ProblemType;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  status: ProblemStatus;
  detail?: {
    features: Record<string, number>;
    model: { rf_class: string; rf_confidence: number; if_score: number };
    correlated_change?: { change_id: string; type: string; time: string; note: string };
    linked_action_id?: string;
  };
}

interface PriorityItem {
  problem_id: string;
  service: string;
  rank: number;
  priority_score: number;
  breakdown: { severity_weight: number; model_confidence: number; blast_radius_size: number; recency_weight: number };
  summary: string;
  status: ProblemStatus;
}

interface BlastRadiusGraph {
  root_cause: string;
  graph: {
    nodes: { id: string; status: NodeStatus | "at_risk" | "unaffected"; role: "root_cause" | "propagated" | "unaffected"; confidence?: number; eta_minutes?: number }[];
    edges: { from: string; to: string; on_path: boolean }[];
  };
  impact: { services_at_risk: number; estimated_time_to_full_impact_minutes: number; estimated_affected_requests_per_min: number };
}
```

---

## 7. Full Backend API Summary

| Tab | Endpoint | Method | Purpose |
|---|---|---|---|
| Dashboard | `/nodes` | GET | live status grid |
| Dashboard | `/metrics/timeseries` | GET | charts, poll or WS |
| Dashboard | `/status` | GET | system-wide pill |
| Dashboard | `/attack/start`, `/attack/stop` | POST | demo control |
| Problems | `/problems` | GET | filterable event log |
| Problems | `/problems/{id}` | GET | detail drilldown |
| Prioritization | `/prioritization` | GET | ranked active problems |
| Prioritization | `/prioritization/mode` | POST | auto vs suggest-only toggle |
| Prioritization | `/problems/{id}/remediate` | POST | manual "Remediate Now" |
| Prioritization | `/problems/{id}/dismiss` | POST | acknowledge without acting |
| Blast Radius | `/blast-radius/{service}` | GET | live propagation graph |
| Blast Radius | `/graph` | GET | static topology fallback |
| Shared | `/ws/live` | WS (optional) | push updates instead of polling |

All four tabs can be built against this contract with **mocked JSON fixtures** before the ML/backend pipeline is finished — recommend the frontend team stub these exact response shapes on day 1 so frontend and backend work in parallel rather than serially.

---

## 8. Tech Stack (frontend)

- **Framework:** Next.js (React) — matches reference repo, good component reuse across tabs
- **Styling:** Tailwind CSS — fast to get a clean, judge-legible look without custom CSS overhead
- **Charts:** Recharts (time series), `react-flow` (blast radius graph)
- **State:** Zustand (lighter than Redux, enough for 4 tabs sharing one store) or React Context if team is more comfortable with it
- **Data fetching:** simple `fetch` + `setInterval` polling for hackathon speed; upgrade to WebSocket only if time allows and polling already works end-to-end

---

## 9. Build Priority (frontend-specific slice of the overall plan)

1. **Shared shell + Dashboard tab** (node grid + one live chart) — this alone proves the pipeline end-to-end and should be built first.
2. **Problems tab** — reuses the same data the backend is already producing for Dashboard's activity feed, low incremental backend cost.
3. **Blast Radius tab** — highest visual payoff, but depends on the dependency-graph endpoint being ready; can be stubbed with the static `/graph` fixture while ML integration finishes.
4. **Prioritization tab** — build last; it's the most "nice to have" of the four for a baseline demo, but is what elevates the pitch from "we detect problems" to "we decide what matters," so don't cut it entirely if there's any time left — even a hardcoded scoring formula over 2 real active problems is a strong demo beat.

---

## 10. Open Questions

1. Do you want the "Trigger Attack" control visible in the judged demo UI, or run from a separate terminal/script kept off-screen?
2. Auto-remediate by default, or default to "Suggest only" and manually click "Remediate Now" live for a clearer demo narrative?
3. WebSocket vs polling — depends on remaining time; polling is the safer choice under pressure.