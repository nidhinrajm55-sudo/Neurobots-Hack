# Sentinel-X — Predictive Crash Detection & Auto-Remediation
### Product Requirements Document + Build Plan

**Status:** Draft v1
**Author:** (your team)
**Context:** Hackathon project. Inspired by / improving on the "Sentinal" reference repo (TEAM-KORE-HFC), which detects but does not remediate, and uses scripted metric injection instead of a real attacked target.

---

## 1. Problem Statement

Production systems fail in ways that are usually *visible in metrics before the outage happens* — CPU creep, latency drift, error-rate acceleration, memory leaks. Most monitoring tools show you this after the fact (dashboards, alerts) but don't (a) predict the crash before it fully happens, (b) identify which *other* connected services will be dragged down with it, or (c) act automatically to prevent it.

**Sentinel-X** is a monitoring layer that sits in front of a real (small, deliberately fragile) web application, ingests live system + application metrics, and uses two complementary ML models to:

1. **Predict** that the system is heading toward a crash/anomalous state (Random Forest — supervised classifier).
2. **Localize** which node(s)/services are the actual source of the abnormal behavior (Isolation Forest — unsupervised outlier detector, run per-node).
3. **Propagate** that risk across a known service-dependency graph to predict which connected nodes are likely to be affected next (blast radius).
4. **Remediate** automatically — this is the part the reference repo skipped, and the part that will make your demo stand out (rate-limit, restart, scale, or circuit-break the affected node) before full failure.

The demo story: *we attack our own dummy site live, the dashboard shows the anomaly being detected, the affected node being isolated, the blast radius being predicted, and the system self-healing — all within seconds.*

---

## 2. Goals

- G1: Real, live-attacked target system (not scripted fake metrics).
- G2: Real-time metric collection pipeline (2–5s resolution).
- G3: Random Forest predicts "heading toward crash" with a confidence score, from a rolling feature window.
- G4: Isolation Forest run **per node** to pinpoint which node(s) are anomalous, not just "system is anomalous."
- G5: A small, explicit dependency graph (3–6 services) used to propagate predicted risk to connected nodes ("blast radius").
- G6: An automated remediation action fires when confidence crosses a threshold (even a simple one: rate-limit, restart container, spin a replica, drop non-critical traffic).
- G7: A live dashboard showing: metrics, anomaly flags, affected-node highlighting, blast radius graph, and "action taken" log.
- G8: A reproducible attack script the judges can watch run live.

## 3. Non-Goals (explicitly out of scope for hackathon)

- NG1: Multi-tenant auth, production-grade security hardening of Sentinel-X itself.
- NG2: Learned/discovered dependency graph (hardcoded graph is acceptable and expected).
- NG3: Distributed tracing (OpenTelemetry-grade). Metrics-only is sufficient.
- NG4: Model retraining pipeline / MLOps. Train once offline, ship the `.pkl`.
- NG5: Handling multiple simultaneous unrelated incidents.

---

## 4. Users / Demo Audience

- **Primary:** Hackathon judges — need to *see* cause → effect → prediction → action within a 3–5 minute live demo.
- **Secondary:** Your own team, who need the system to be debuggable fast under time pressure.

Design implication: prioritize **visible, legible signal** (dashboard clarity, obvious before/after) over model sophistication. A simple model that visibly works beats a complex one that's a black box during Q&A.

---

## 5. System Architecture

```
�┌─────────────────�┐      � ┌──────────────────�┐      � ┌─────────────────────�┐
│  Attack Script    │ --> │  Dummy Target Site │ --> │  Metrics Exporter     │
│  (locust/custom)  │      │  (Flask/FastAPI)   │      │  (psutil + custom)    │
�└─────────────────�┘      │  3-5 fake services  │      └──────────�┬───────────�┘
                          │  behind one gateway  │                 │
                          └──────────────────────�┘                 v
                                                              � ┌──────────────�┐
                                                              │  Prometheus    │
                                                              │  (scrape 2-5s) │
                                                              └───────�┬────────�┘
                                                                      v
�┌──────────────────────────────────────────────────────────────────────────�┐
│                          Sentinel-X Backend (FastAPI)                     │
│  - Metric ingestion / feature extraction (rolling window per node)       │
│  - Random Forest: predict CRASH_RISK per node (0-1 confidence)           │
│  - Isolation Forest: per-node outlier score -> flags WHICH node(s)       │
│  - Dependency graph walk: propagate risk to connected nodes              │
│  - Remediation engine: threshold -> action (restart/rate-limit/scale)    │
│  - Persist: MongoDB or SQLite (events, predictions, actions)             │
�└───────────────────────────────�┬────────────────────────────────────────�┘
                                  v
                          � ┌───────────────�┐
                          │  Dashboard      │
                          │  (React/Next)   │
                          │  live graph +   │
                          │  action log     │
                          └───────────────�┘
```

### Why this shape
- Keeping Prometheus in the loop (like the reference repo) gives you free time-series storage/query without building your own — worth the setup cost even under time pressure.
- Running Isolation Forest **per node** (not once globally) is the key upgrade over the reference repo — that's what actually answers "which node is affected," rather than a single system-wide anomaly flag.
- The remediation engine is a small rules layer, not another ML model — keep it deterministic and demo-safe (no unpredictable autonomous behavior on stage).

---

## 6. Functional Requirements

### 6.1 Dummy Target System
- FR1: 3–5 Flask/FastAPI microservices behind a lightweight gateway, e.g.: `api-gateway → auth-service → user-service`, `api-gateway → order-service → payment-service`.
- FR2: Each service exposes `/health` and does *real* work proportional to load (e.g., a deliberately inefficient endpoint — nested loops, unindexed DB query, or a synthetic sleep that scales with concurrent requests) so it can genuinely degrade under attack.
- FR3: One service should have an intentionally injectable failure mode (e.g., an in-memory list that grows on each request and is never cleared — a real memory leak, not simulated).

### 6.2 Attack / Load Generator
- FR4: A script capable of at least two attack modes:
  - **Load flood**: concurrent request storm against one endpoint (e.g., `locust`, or a simple asyncio/threaded requester).
  - **Resource exhaustion**: hit the memory-leak endpoint repeatedly, or a CPU-heavy endpoint.
- FR5: Attack script logs start time + target service — used later to validate prediction lead time ("we predicted crash 8 seconds before p95 latency crossed 2s").

### 6.3 Metrics Collection
- FR6: Per-service metrics scraped every 2–5s: CPU%, memory MB, request rate, error rate, p95 latency.
- FR7: Metrics exposed via `prometheus_client` gauges per service label (same pattern as the reference repo — reuse it, it works).

### 6.4 Feature Extraction
- FR8: Rolling window (last N=20–50 samples) per service, computing: mean/std/min/max CPU, delta CPU, CPU trend (slope), mean/std memory, memory trend, mean requests, request spike count, error rate delta, latency trend.
- FR9: Feature extraction must run per-node independently (this is what enables per-node Isolation Forest scoring).

### 6.5 ML Layer
- FR10: **Random Forest** — binary/multiclass classifier trained on labeled windows (`healthy` / `degrading` / `critical`), output confidence per node.
- FR11: **Isolation Forest** — trained per-node (or trained once, scored per-node) on the same feature vector, output anomaly score + `is_anomaly` boolean per node.
- FR12: Combine both signals: a node is flagged "AT RISK" if RF confidence(degrading/critical) > threshold **AND/OR** Isolation Forest flags it as an outlier. (Using both catches different failure shapes — RF catches known patterns, IF catches novel ones.)

### 6.6 Blast Radius / Propagation
- FR13: Static dependency graph (service → list of dependents, like `blast_radius.py` in the reference repo — that pattern is good, keep it).
- FR14: When a node is flagged AT RISK, walk the graph to compute affected downstream services, with confidence decaying by depth.
- FR15: Output: `total_services_at_risk`, `predicted_propagation[]`, `estimated_time_to_impact`.

### 6.7 Remediation Engine
- FR16: Define explicit, demo-safe actions per risk level, e.g.:
  - **Degrading** → log + dashboard alert + start rate-limiting new requests to the flagged service (simple in-memory token bucket at the gateway).
  - **Critical** → restart the affected service's Docker container (`docker restart <container>` via subprocess, or a container orchestration API call) and/or reroute traffic to a healthy replica if you have one running.
- FR17: Every remediation action is logged with timestamp, trigger reason, and model confidence — this becomes your "proof it worked" evidence for judges.
- FR18: Remediation must be idempotent / rate-limited itself (don't restart the same container every 2 seconds if it stays flagged).

### 6.8 Dashboard
- FR19: Live per-service metric charts.
- FR20: Node graph visualization — color nodes by state (healthy/degrading/critical), and highlight the propagated blast radius.
- FR21: Action log panel — "chronological story" view: attack started → anomaly detected → node isolated → blast radius predicted → action taken → recovery.
- FR22: A manual "Trigger Attack" button in the UI is a strong demo nicety (removes reliance on a terminal window during judging).

---

## 7. Data & Model Spec

### 7.1 Feature vector (per node, per scoring window)
```
mean_cpu, std_cpu, min_cpu, max_cpu, delta_cpu, cpu_trend,
mean_memory, std_memory, memory_trend,
mean_requests, request_spike_count, throughput_delta,
mean_latency, latency_trend, error_rate, error_rate_trend
```
(16 features — extend the reference repo's 15-feature set with `error_rate_trend`, since error rate is one of the strongest real crash predictors and the reference repo under-weighted it.)

### 7.2 Random Forest
- Input: feature vector above.
- Output: class label (`healthy` / `degrading` / `critical`) + `predict_proba` confidence.
- Training data: generate synthetic labeled windows from your own attack runs — run each scenario (normal traffic, load flood, memory leak, bad deploy) multiple times, label windows by ground truth (you know when the attack script was active and how severe), extract features, save as CSV, train offline (`sklearn.ensemble.RandomForestClassifier`).
- Target: ~200–500 labeled windows is enough for a hackathon-credible model. Quality of labels matters more than volume.

### 7.3 Isolation Forest
- Input: same feature vector, scored **per node independently** at inference time.
- Output: `decision_function` score + `predict` (-1 = anomaly, 1 = normal).
- Training data: fit on "mostly normal" windows (Isolation Forest doesn't need labels — this is its advantage). Include a *few* attack windows in training so it has some exposure to what real deviation looks like, but keep majority-normal per Isolation Forest's design assumption.
- Contamination parameter: start at `0.05–0.1` and tune by eye against your demo scenarios.

### 7.4 Dependency graph (example, adjust to your services)
```python
DEPENDENCY_MAP = {
    "auth-service":  [{"service": "api-gateway", "type": "sync", "depth": 1}],
    "api-gateway":   [{"service": "order-service", "type": "sync", "depth": 2}],
    "order-service": [{"service": "payment-service", "type": "sync", "depth": 3}],
}
```

---

## 8. API Surface (backend)

| Endpoint | Method | Purpose |
|---|---|---|
| `/ingest/metrics` | POST | receive metric sample (or scrape via Prometheus instead) |
| `/scan` | GET | run RF + IF over current window for all nodes |
| `/scan/{service}` | GET | run scan for one node |
| `/blast-radius/{service}` | GET | propagate risk from a flagged node |
| `/actions` | GET | list remediation actions taken |
| `/actions/trigger` | POST | manually trigger a remediation (demo override) |
| `/attack/start` | POST | kick off an attack scenario (for the UI button) |
| `/health` | GET | Sentinel-X's own health |

---

## 9. Tech Stack (recommended, matches reference repo where sensible)

- **Dummy target + gateway:** FastAPI (fast to write, easy to make deliberately slow/leaky)
- **Attack generator:** Python + `asyncio`/`httpx`, or `locust` if you want a nicer load-shape UI
- **Metrics:** `prometheus_client` (exporter) + Prometheus (scrape/store) — reuse reference repo's pattern
- **Backend/ML:** FastAPI + `scikit-learn` + `joblib` + `numpy`/`pandas`
- **Storage:** SQLite for hackathon simplicity (skip MongoDB unless your team already knows it well — one less moving part to debug live) — **do not hardcode credentials in the repo**, use `.env` + `python-dotenv`, gitignored
- **Dashboard:** Next.js/React (reuse component shapes from reference repo: Dashboard, node graph, correlation panel) or, if time is very tight, a single-page vanilla HTML + Chart.js dashboard is a legitimate fallback
- **Container control for remediation:** Docker Compose + `docker` Python SDK (`docker restart <name>`) — simplest real remediation action available

---

## 10. Non-Functional Requirements

- NFR1: End-to-end detection latency (attack start → dashboard shows AT RISK) under ~10 seconds — needs to *feel* live on stage.
- NFR2: System must run fully locally with one command (`docker-compose up` or a `run_locally.sh`) — no dependency on external cloud services during judging (avoid what happened in the reference repo with a hardcoded external Mongo Atlas URI).
- NFR3: Dashboard must not require a page refresh — poll every 2–3s or use WebSockets if you have time.
- NFR4: Remediation actions must be visibly safe/reversible in the demo (don't actually take down your own demo mid-presentation).

---

## 11. Success Metrics for the Demo

- SM1: Live attack → dashboard flags the correct node within target latency window.
- SM2: Isolation Forest correctly identifies the *attacked* node specifically (not a false positive on an unrelated healthy node).
- SM3: Blast radius correctly predicts the dependent service(s) before they visibly degrade.
- SM4: Remediation action fires automatically and metrics visibly recover afterward on the dashboard.
- SM5: You can articulate, in Q&A, the actual precision/recall or a confusion matrix from your offline model evaluation (judges will ask — have real numbers, not "95% accuracy" claimed without evidence, which is a genuine weakness of the reference repo's approach).

---

## 12. Build Plan

Scale this to whatever time you actually have. Phases are ordered by dependency, and each phase has a "minimum viable" cut line marked **[MVP CUT]** — if you're short on time, stop there and demo with what you have.

### Phase 0 — Setup (30–45 min)
- Repo skeleton: `target-app/`, `attack/`, `backend/`, `dashboard/`, `models/`, `data/`
- Docker Compose skeleton with placeholder services
- Agree on the 4–5 service names and dependency graph up front so nobody builds against mismatched names

### Phase 1 — Dummy Target + Real Failure Modes (2–3 hrs)
- Build 3–5 FastAPI services behind a gateway
- Add one genuinely slow endpoint (CPU-bound) and one genuinely leaky endpoint (memory)
- **[MVP CUT: 3 services minimum — gateway, one "leaky" service, one downstream dependent]**

### Phase 2 — Metrics Pipeline (1.5–2 hrs)
- `prometheus_client` exporter per service (reuse reference repo's gauge pattern)
- Prometheus scrape config
- Verify metrics show up at `localhost:9090` before moving on — don't skip this checkpoint

### Phase 3 — Attack Scripts (1–1.5 hrs)
- Load flood script (async requester hammering one endpoint)
- Memory-leak trigger script (repeated calls to the leaky endpoint)
- Log attack start/stop timestamps to a file — you'll need this for both training labels and demo narration
- **[MVP CUT: one attack mode is enough — pick load flood, it's the more visually convincing one live]**

### Phase 4 — Feature Extraction + Data Collection (1.5–2 hrs)
- Rolling window feature function (per node)
- Run several attack sessions + several "normal" sessions, capture windows to CSV with labels
- **[MVP CUT: even 150–200 windows across 2–3 runs is workable]**

### Phase 5 — Train Models (1–1.5 hrs)
- Train Random Forest (labeled) — check confusion matrix, not just accuracy
- Train Isolation Forest (mostly-normal) — sanity check: does it flag your attack windows?
- Save both as `.pkl` via `joblib`
- **[MVP CUT: if RF training data is too thin, ship IF-only and be honest about it in the pitch — an honest single-model system beats a fake two-model story]**

### Phase 6 — Backend Integration (2–3 hrs)
- `/scan` endpoint: pull recent metrics → extract features → run both models per node
- `/blast-radius`: graph walk from any AT RISK node
- Remediation engine: threshold logic + `docker restart` action + action log persistence
- **[MVP CUT: remediation can be "rate-limit" only (in-process, no Docker calls) if container control is too fiddly under time pressure — still counts as "solving," and is much safer to demo live]**

### Phase 7 — Dashboard (2–3 hrs)
- Metric charts per service
- Node graph with color-coded risk state
- Action log timeline
- Manual "start attack" button wired to backend
- **[MVP CUT: a single scrolling event log + one live chart is enough if React time runs out — Grafana alone, pointed at Prometheus, is a legitimate fallback dashboard]**

### Phase 8 — Rehearsal + Buffer (1–2 hrs, do not skip)
- Run the full demo loop 3+ times end to end
- Time it — know exactly how long attack → detection → remediation takes
- Prepare fallback: pre-recorded screen capture in case live networking fails during judging
- Prepare your answer to "what's your model's actual accuracy" with real numbers

---

## 13. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Live attack demo fails on stage (network/wifi) | Have a pre-recorded backup video of one full successful run |
| Random Forest overfits to your specific attack script (won't generalize) | Fine for a hackathon — say so honestly if asked, and show it works on a *held-out* run of the same attack you didn't train on |
| Remediation action does something irreversible mid-demo | Keep actions reversible/idempotent; test failure of the remediation itself doesn't crash your own dashboard |
| Not enough time to build both models well | Isolation Forest alone (unsupervised, no labels needed) is a legitimate fallback story — pitch it as "phase 1 of a 2-model roadmap" |
| Credentials/secrets committed to repo | `.env` + `.gitignore` from commit #1, no exceptions |

---

## 14. Open Questions (resolve with your team before Phase 1)

1. How much time is actually left before submission? (Determines how many MVP cuts you take.)
2. Confirmed stack: Python end-to-end, or mixed with a Node/Next dashboard?
3. Which attack mode will you demo live: load flood, resource exhaustion, or both?
4. Docker available in your demo environment, or should remediation stay in-process (rate-limiting) to avoid Docker-in-demo risk?