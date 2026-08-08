import asyncio
import time
import random
import os
import psutil
import numpy as np
from fastapi import FastAPI, Request, Response, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from prometheus_client import start_http_server, Gauge

# --- Prometheus Metrics Setup ---
CPU_USAGE = Gauge('service_cpu_usage_percent', 'Current CPU usage percent', ['service'])
MEMORY_USAGE = Gauge('service_memory_usage_mb', 'Current Memory usage in MB', ['service'])
LATENCY = Gauge('service_latency_ms', 'P95 Latency in ms', ['service'])
REQUEST_RATE = Gauge('service_request_rate_ops', 'Requests per second', ['service'])
ERROR_RATE = Gauge('service_error_rate_ops', 'Errors per second', ['service'])

# Service metrics storage in memory for aggregation window
service_stats = {
    "api-gateway": {"requests": 0, "errors": 0, "latencies": [], "cpu": 5.0, "memory": 45.0},
    "auth-service": {"requests": 0, "errors": 0, "latencies": [], "cpu": 4.0, "memory": 50.0},
    "order-service": {"requests": 0, "errors": 0, "latencies": [], "cpu": 6.0, "memory": 60.0},
    "payment-service": {"requests": 0, "errors": 0, "latencies": [], "cpu": 3.0, "memory": 40.0},
}

# --- Service State ---
rate_limit_state = {
    "enabled": False,
    "max_rps": 50,
    "active_tokens": 50
}

memory_leak_buffer = []

# --- Target App Web Interface HTML ---
HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ShopX Electronics & Smart Gear — Official Store</title>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg: #090d16;
            --surface: #111827;
            --surface-hover: #1f2937;
            --border: #1f2937;
            --primary: #2563eb;
            --primary-hover: #1d4ed8;
            --accent: #10b981;
            --danger: #ef4444;
            --warning: #f59e0b;
            --text-main: #f9fafb;
            --text-muted: #9ca3af;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: 'Plus Jakarta Sans', sans-serif;
            background-color: var(--bg);
            color: var(--text-main);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            line-height: 1.5;
        }
        
        /* Top Navigation Bar */
        nav {
            background: rgba(17, 24, 39, 0.95);
            backdrop-filter: blur(16px);
            border-bottom: 1px solid var(--border);
            position: sticky;
            top: 0;
            z-index: 100;
            padding: 14px 28px;
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
            gap: 20px;
        }
        .nav-left {
            display: flex;
            align-items: center;
            gap: 24px;
        }
        .nav-brand {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 20px;
            font-weight: 800;
            color: #fff;
            text-decoration: none;
            letter-spacing: -0.02em;
        }
        .brand-logo {
            width: 38px;
            height: 38px;
            background: linear-gradient(135deg, #2563eb, #3b82f6);
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4);
        }
        .nav-menu {
            display: flex;
            align-items: center;
            gap: 20px;
            list-style: none;
        }
        .nav-menu a {
            color: var(--text-muted);
            text-decoration: none;
            font-size: 13px;
            font-weight: 600;
            transition: color 0.2s;
        }
        .nav-menu a:hover, .nav-menu a.active { color: #fff; }

        .search-box {
            position: relative;
            flex: 1;
            max-width: 380px;
        }
        .search-box input {
            width: 100%;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid var(--border);
            border-radius: 999px;
            padding: 9px 16px 9px 40px;
            color: #fff;
            font-size: 13px;
            outline: none;
            transition: all 0.2s;
        }
        .search-box input:focus {
            background: rgba(255, 255, 255, 0.08);
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
        }
        .search-icon {
            position: absolute;
            left: 14px;
            top: 50%;
            transform: translateY(-50%);
            color: var(--text-muted);
            font-size: 14px;
        }

        .nav-right {
            display: flex;
            align-items: center;
            gap: 14px;
        }
        .cart-pill {
            background: rgba(37, 99, 235, 0.15);
            border: 1px solid rgba(37, 99, 235, 0.3);
            color: #60a5fa;
            padding: 8px 16px;
            border-radius: 999px;
            font-size: 13px;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: pointer;
            transition: all 0.2s;
        }
        .cart-pill:hover { background: rgba(37, 99, 235, 0.25); }
        .user-pill {
            display: flex;
            align-items: center;
            gap: 8px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid var(--border);
            padding: 5px 12px 5px 6px;
            border-radius: 999px;
            font-size: 13px;
            font-weight: 600;
            color: #e5e7eb;
        }
        .user-avatar {
            width: 28px;
            height: 28px;
            border-radius: 50%;
            background: linear-gradient(135deg, #10b981, #059669);
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 800;
            font-size: 11px;
            color: #fff;
        }

        /* Sub-header Categories Bar */
        .categories-bar {
            background: rgba(0, 0, 0, 0.4);
            border-bottom: 1px solid var(--border);
            padding: 10px 28px;
            display: flex;
            gap: 12px;
            overflow-x: auto;
            align-items: center;
        }
        .cat-chip {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.08);
            color: var(--text-muted);
            padding: 6px 14px;
            border-radius: 8px;
            font-size: 12px;
            font-weight: 600;
            white-space: nowrap;
            cursor: pointer;
            transition: all 0.2s;
        }
        .cat-chip:hover, .cat-chip.active {
            background: rgba(37, 99, 235, 0.2);
            border-color: rgba(37, 99, 235, 0.4);
            color: #60a5fa;
        }

        .main-container {
            max-width: 1240px;
            margin: 0 auto;
            padding: 28px 24px;
            width: 100%;
            flex: 1;
        }

        /* Hero Banner */
        .hero-banner {
            background: linear-gradient(135deg, rgba(37, 99, 235, 0.25), rgba(139, 92, 246, 0.15));
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            padding: 40px;
            margin-bottom: 32px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            position: relative;
            overflow: hidden;
        }
        .hero-content { max-width: 560px; z-index: 2; }
        .hero-tag {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: rgba(37, 99, 235, 0.2);
            border: 1px solid rgba(37, 99, 235, 0.4);
            color: #60a5fa;
            padding: 4px 12px;
            border-radius: 999px;
            font-size: 12px;
            font-weight: 700;
            margin-bottom: 14px;
        }
        .hero-title {
            font-size: 34px;
            font-weight: 800;
            line-height: 1.2;
            margin-bottom: 12px;
            color: #fff;
        }
        .hero-sub {
            color: var(--text-muted);
            font-size: 15px;
            margin-bottom: 24px;
        }
        .btn-primary {
            background: linear-gradient(135deg, #2563eb, #1d4ed8);
            color: #fff;
            padding: 13px 26px;
            border-radius: 12px;
            font-size: 14px;
            font-weight: 700;
            border: none;
            cursor: pointer;
            transition: all 0.2s;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            box-shadow: 0 6px 20px rgba(37, 99, 235, 0.3);
        }
        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(37, 99, 235, 0.4);
        }

        /* Products Section */
        .section-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 20px;
        }
        .section-title-text {
            font-size: 18px;
            font-weight: 800;
            color: #fff;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .product-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
            gap: 20px;
            margin-bottom: 36px;
        }
        .product-card {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 16px;
            padding: 18px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            transition: all 0.25s ease;
            position: relative;
        }
        .product-card:hover {
            border-color: rgba(255, 255, 255, 0.15);
            transform: translateY(-3px);
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4);
        }
        .badge-tag {
            position: absolute;
            top: 14px;
            right: 14px;
            background: rgba(239, 68, 68, 0.2);
            border: 1px solid rgba(239, 68, 68, 0.3);
            color: #f87171;
            font-size: 11px;
            font-weight: 700;
            padding: 3px 8px;
            border-radius: 6px;
        }
        .product-img {
            width: 100%;
            height: 150px;
            background: rgba(255, 255, 255, 0.03);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 54px;
            margin-bottom: 14px;
        }
        .product-name {
            font-size: 15px;
            font-weight: 700;
            color: #f3f4f6;
            margin-bottom: 4px;
        }
        .product-info {
            font-size: 12px;
            color: var(--text-muted);
            margin-bottom: 16px;
        }
        .product-action {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-top: auto;
        }
        .price {
            font-size: 17px;
            font-weight: 800;
            color: #38bdf8;
        }
        .btn-buy {
            background: rgba(255, 255, 255, 0.08);
            border: 1px solid rgba(255, 255, 255, 0.12);
            color: #fff;
            padding: 8px 16px;
            border-radius: 8px;
            font-size: 12px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.2s;
        }
        .btn-buy:hover {
            background: var(--primary);
            border-color: var(--primary);
        }

        /* Order Log & Customer Profile Grid */
        .bottom-grid {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 20px;
        }
        @media (max-width: 850px) { .bottom-grid { grid-template-columns: 1fr; } }

        .card-box {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 16px;
            padding: 20px;
        }
        .card-box-title {
            font-size: 14px;
            font-weight: 700;
            color: #fff;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .log-stream {
            background: #030712;
            border: 1px solid #1f2937;
            border-radius: 10px;
            padding: 14px;
            height: 160px;
            overflow-y: auto;
            font-family: 'JetBrains Mono', monospace;
            font-size: 11px;
        }
        .log-row {
            margin-bottom: 6px;
            display: flex;
            gap: 8px;
        }
        .log-t { color: #6b7280; }
        .log-s { color: #34d399; }
        .log-e { color: #f87171; }
        .log-w { color: #fbbf24; }

        .btn-auth-session {
            width: 100%;
            background: rgba(139, 92, 246, 0.15);
            border: 1px solid rgba(139, 92, 246, 0.3);
            color: #c084fc;
            padding: 10px;
            border-radius: 8px;
            font-weight: 700;
            font-size: 12px;
            cursor: pointer;
            transition: all 0.2s;
            margin-top: 14px;
        }
        .btn-auth-session:hover { background: rgba(139, 92, 246, 0.3); }

        footer {
            background: var(--surface);
            border-top: 1px solid var(--border);
            padding: 18px 28px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            color: var(--text-muted);
            font-size: 12px;
            margin-top: auto;
        }
        .sys-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 5px 12px;
            border-radius: 999px;
            font-weight: 600;
            font-size: 11px;
            background: rgba(16, 185, 129, 0.1);
            border: 1px solid rgba(16, 185, 129, 0.2);
            color: #34d399;
        }
        .sys-badge.degraded {
            background: rgba(239, 68, 68, 0.15);
            border-color: rgba(239, 68, 68, 0.3);
            color: #f87171;
        }
    </style>
</head>
<body>
    <!-- Top Navigation Bar -->
    <nav>
        <div class="nav-left">
            <a href="/" class="nav-brand">
                <div class="brand-logo">⚡</div>
                <span>ShopX</span>
            </a>
            <ul class="nav-menu">
                <li><a href="#" class="active">Store Home</a></li>
                <li><a href="#">Laptops</a></li>
                <li><a href="#">Audio</a></li>
                <li><a href="#">Wearables</a></li>
                <li><a href="#">Accessories</a></li>
            </ul>
        </div>

        <div class="search-box">
            <span class="search-icon">🔍</span>
            <input type="text" placeholder="Search 5,000+ premium electronics...">
        </div>

        <div class="nav-right">
            <div class="cart-pill">🛒 Cart (2)</div>
            <div class="user-pill">
                <div class="user-avatar">AM</div>
                <span>Alex M.</span>
            </div>
        </div>
    </nav>

    <!-- Sub Header Categories -->
    <div class="categories-bar">
        <div class="cat-chip active">🔥 Flash Sale (-25%)</div>
        <div class="cat-chip">💻 Laptops & Desktops</div>
        <div class="cat-chip">🎧 ANC Headphones</div>
        <div class="cat-chip">⌚ Smartwatches</div>
        <div class="cat-chip">🎮 Gaming Gear</div>
        <div class="cat-chip">🔌 Thunderbolt Docks</div>
    </div>

    <div class="main-container">
        <!-- Hero Banner -->
        <div class="hero-banner">
            <div class="hero-content">
                <div class="hero-tag">✨ NEW RELEASE 2026</div>
                <div class="hero-title">NovaBook Pro 16" M3 Max</div>
                <div class="hero-sub">Unmatched computational performance for creative professionals & developers. Free express delivery nationwide.</div>
                <button class="btn-primary" onclick="buyItem('NovaBook Pro 16', 1999)">
                    💳 Buy Now ($1,999.00)
                </button>
            </div>
            <div style="font-size: 90px; filter: drop-shadow(0 12px 24px rgba(37,99,235,0.4));">💻</div>
        </div>

        <!-- Products Section -->
        <div class="section-header">
            <div class="section-title-text">🔥 Trending Tech Products</div>
            <span style="font-size: 12px; color: var(--text-muted);">Showing 4 featured items</span>
        </div>

        <div class="product-grid">
            <div class="product-card">
                <div class="badge-tag">BEST SELLER</div>
                <div class="product-img">💻</div>
                <div class="product-name">NovaBook Pro 16" M3</div>
                <div class="product-info">32GB RAM / 1TB SSD / Liquid Retina XDR</div>
                <div class="product-action">
                    <span class="price">$1,999</span>
                    <button class="btn-buy" onclick="buyItem('NovaBook Pro 16', 1999)">Buy Now</button>
                </div>
            </div>

            <div class="product-card">
                <div class="badge-tag" style="background:rgba(59,130,246,0.2); border-color:rgba(59,130,246,0.3); color:#60a5fa;">HOT</div>
                <div class="product-img">🎧</div>
                <div class="product-name">QuantumSound ANC Headphones</div>
                <div class="product-info">Active Noise Cancellation / 40h Battery</div>
                <div class="product-action">
                    <span class="price">$299</span>
                    <button class="btn-buy" onclick="buyItem('QuantumSound Headphones', 299)">Buy Now</button>
                </div>
            </div>

            <div class="product-card">
                <div class="product-img">⌚</div>
                <div class="product-name">UltraSync Smartwatch v4</div>
                <div class="product-info">Titanium Case / Dual GPS / ECG Sensor</div>
                <div class="product-action">
                    <span class="price">$349</span>
                    <button class="btn-buy" onclick="buyItem('UltraSync Smartwatch', 349)">Buy Now</button>
                </div>
            </div>

            <div class="product-card">
                <div class="product-img">⌨️</div>
                <div class="product-name">Apex Mechanical Keyboard</div>
                <div class="product-info">Hot-swappable / RGB Lighting / Wireless</div>
                <div class="product-action">
                    <span class="price">$149</span>
                    <button class="btn-buy" onclick="buyItem('Apex Keyboard', 149)">Buy Now</button>
                </div>
            </div>
        </div>

        <!-- Live Activity & Profile -->
        <div class="bottom-grid">
            <div class="card-box">
                <div class="card-box-title">
                    <span>📜 Order Checkout Stream & API Status</span>
                    <span style="font-size: 11px; color: var(--text-muted);">Gateway Port 8002</span>
                </div>
                <div class="log-stream" id="order-logs">
                    <div class="log-row"><span class="log-t">[System]</span> ShopX Store Gateway initialized & ready for orders.</div>
                </div>
            </div>

            <div class="card-box" style="display:flex; flex-direction:column; justify-content:space-between;">
                <div>
                    <div class="card-box-title">👤 Customer Session</div>
                    <div style="font-size: 12px; color: var(--text-muted); line-height: 1.6;">
                        Connected as <strong>alex.morgan@shopx.io</strong><br>
                        Status: <span style="color:#34d399; font-weight:700;">VIP Member</span>
                    </div>
                </div>
                <button class="btn-auth-session" onclick="verifySession()">
                    🔐 Refresh Auth Token Session
                </button>
            </div>
        </div>
    </div>

    <!-- Footer -->
    <footer>
        <div>© 2026 ShopX Technologies Inc. All rights reserved.</div>
        <div id="sys-badge" class="sys-badge">
            <span id="sys-dot">🟢</span> <span id="sys-text">All Systems Operational</span>
        </div>
    </footer>

    <script>
        function addLog(msg, type='success') {
            const box = document.getElementById('order-logs');
            const row = document.createElement('div');
            row.className = 'log-row';
            const time = new Date().toLocaleTimeString();
            let cls = 'log-s';
            if (type === 'error') cls = 'log-e';
            if (type === 'warn') cls = 'log-w';
            row.innerHTML = `<span class="log-t">[${time}]</span> <span class="${cls}">${msg}</span>`;
            box.prepend(row);
        }

        async function buyItem(itemName, price) {
            try {
                const res = await fetch('/api/order/create', { method: 'POST' });
                if (res.status === 429) {
                    addLog(`⚠️ HIGH TRAFFIC SURGE: Rate Limiting Enforced (HTTP 429 - Please retry in a few seconds)`, 'error');
                } else if (res.ok) {
                    const data = await res.json();
                    addLog(`✅ Order Confirmed: ${itemName} ($${price}) — Processed in ${data.latency_ms}ms`, 'success');
                } else {
                    addLog(`❌ Order Error: Service busy (${res.status})`, 'error');
                }
            } catch (e) {
                addLog(`❌ Connection Error: ${e.message}`, 'error');
            }
        }

        async function verifySession() {
            try {
                const res = await fetch('/api/auth/leak', { method: 'POST' });
                const data = await res.json();
                addLog(`🔐 Auth Token Session Validated (Memory Allocated: ${data.approx_leak_mb}MB)`, 'warn');
            } catch (e) {
                addLog(`❌ Session Refresh Failed: ${e.message}`, 'error');
            }
        }

        async function pollStatus() {
            try {
                const res = await fetch('/api/stats');
                if (res.ok) {
                    const data = await res.json();
                    const gateway = data['api-gateway'] || {};
                    const order = data['order-service'] || {};
                    const badge = document.getElementById('sys-badge');
                    const dot = document.getElementById('sys-dot');
                    const txt = document.getElementById('sys-text');

                    if (gateway.error_count > 5 || order.cpu_percent > 75) {
                        badge.className = 'sys-badge degraded';
                        dot.innerText = '⚡';
                        txt.innerText = 'High Traffic Surge: Rate Limiting Active';
                    } else {
                        badge.className = 'sys-badge';
                        dot.innerText = '🟢';
                        txt.innerText = 'All Systems Operational';
                    }
                }
            } catch (e) {}
        }

        setInterval(pollStatus, 1500);
        pollStatus();
    </script>
</body>
</html>"""

# --- API Gateway App ---
gateway_app = FastAPI(title="Sentinel-X API Gateway")
gateway_app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

@gateway_app.get("/", response_class=HTMLResponse)
def gateway_root():
    return HTML_TEMPLATE

@gateway_app.get("/app", response_class=HTMLResponse)
def gateway_app_ui():
    return HTML_TEMPLATE

@gateway_app.get("/health")
def gateway_health():
    return {"status": "healthy", "service": "api-gateway"}

@gateway_app.get("/api/stats")
def get_stats():
    update_prometheus_exporter()
    result = {}
    for svc, stats in service_stats.items():
        latencies = stats["latencies"]
        p95 = float(np.percentile(latencies, 95)) if len(latencies) >= 5 else (float(np.mean(latencies)) if latencies else 20.0)
        result[svc] = {
            "cpu_percent": round(stats["cpu"], 2),
            "memory_mb": round(stats["memory"], 2),
            "request_count": stats["requests"],
            "error_count": stats["errors"],
            "latency_p95_ms": round(p95, 2)
        }
    return result

@gateway_app.post("/remediate/rate-limit")
def set_rate_limit(enabled: bool = True, max_rps: int = 50):
    rate_limit_state["enabled"] = enabled
    rate_limit_state["max_rps"] = max_rps
    return {"status": "success", "rate_limit": rate_limit_state}

@gateway_app.post("/remediate/reset-leak")
def reset_memory_leak():
    global memory_leak_buffer
    leaked_mb = len(memory_leak_buffer) * 5
    memory_leak_buffer.clear()
    service_stats["auth-service"]["memory"] = 50.0
    return {"status": "cleared", "freed_mb": leaked_mb}

# --- Service Request Middleware for Metrics ---
@gateway_app.post("/api/auth/leak")
def trigger_memory_leak():
    chunk = bytearray(5 * 1024 * 1024)
    memory_leak_buffer.append(chunk)
    service_stats["auth-service"]["memory"] += 5.0
    service_stats["auth-service"]["requests"] += 1
    return {"status": "leaked", "total_leak_chunks": len(memory_leak_buffer), "approx_leak_mb": len(memory_leak_buffer) * 5}

@gateway_app.post("/api/order/create")
async def create_order(request: Request):
    t0 = time.time()
    service_stats["api-gateway"]["requests"] += 1
    
    # Check gateway rate limiting state
    if rate_limit_state["enabled"]:
        if random.random() < 0.75:
            service_stats["api-gateway"]["errors"] += 1
            service_stats["order-service"]["errors"] += 1
            raise HTTPException(status_code=429, detail="Rate limit exceeded by Sentinel-X Auto-Remediation")
    
    # Simulate CPU intensive cryptographic order validation
    res = 0
    loop_count = 180000 if not rate_limit_state["enabled"] else 10000
    for i in range(1, loop_count):
        res += (i * i) % 7
        
    duration = (time.time() - t0) * 1000.0
    
    # Update CPU and latency stats
    if not rate_limit_state["enabled"]:
        service_stats["order-service"]["cpu"] = min(98.0, service_stats["order-service"]["cpu"] + 2.5)
        service_stats["order-service"]["requests"] += 1
        service_stats["order-service"]["latencies"].append(duration)
    else:
        service_stats["order-service"]["cpu"] = max(12.0, service_stats["order-service"]["cpu"] - 5.0)
        service_stats["order-service"]["latencies"].append(15.0)
        
    return {"status": "order_created", "latency_ms": round(duration, 2)}

@gateway_app.post("/api/payment/process")
def process_payment():
    t0 = time.time()
    time.sleep(0.02)
    duration = (time.time() - t0) * 1000.0
    service_stats["payment-service"]["requests"] += 1
    service_stats["payment-service"]["latencies"].append(duration)
    return {"status": "payment_processed", "latency_ms": round(duration, 2)}

# --- Prometheus Exporter Update Function ---
def update_prometheus_exporter():
    for svc, stats in service_stats.items():
        reqs = stats["requests"]
        errs = stats["errors"]
        latencies = stats["latencies"]
        
        if latencies:
            p95 = float(np.percentile(latencies, 95)) if len(latencies) >= 5 else float(np.mean(latencies))
        else:
            p95 = random.uniform(15.0, 30.0)
            
        CPU_USAGE.labels(service=svc).set(max(2.0, min(99.0, stats["cpu"] + random.uniform(-0.5, 0.5))))
        MEMORY_USAGE.labels(service=svc).set(round(stats["memory"], 2))
        LATENCY.labels(service=svc).set(round(p95, 2))
        REQUEST_RATE.labels(service=svc).set(reqs)
        ERROR_RATE.labels(service=svc).set(errs)

if __name__ == "__main__":
    import uvicorn
    exporter_port = int(os.getenv("EXPORTER_PORT", 8001))
    try:
        start_http_server(exporter_port)
        print(f"🚀 Sentinel-X Prometheus Metrics Exporter running on port {exporter_port}")
    except Exception as e:
        print(f"⚠️ Could not start Prometheus Metrics Exporter on port {exporter_port}: {e}")
    uvicorn.run(gateway_app, host="0.0.0.0", port=8002)
