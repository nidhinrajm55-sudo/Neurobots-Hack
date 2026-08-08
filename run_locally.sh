#!/bin/bash

# Sentinel-X Local Launcher
# Predictive Crash Detection & Auto-Remediation

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}=====================================================${NC}"
echo -e "${BLUE} 🛡️  Sentinel-X — Predictive Crash & Auto-Remediation ${NC}"
echo -e "${BLUE}=====================================================${NC}"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

cleanup() {
    echo ""
    echo -e "${RED}Stopping all Sentinel-X services...${NC}"
    kill $TARGET_PID 2>/dev/null
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    kill $PROM_PID 2>/dev/null
    exit
}

trap cleanup SIGINT SIGTERM

# 0. Clean up any existing processes running on Sentinel-X ports
echo -e "${RED}[0/4] Cleaning up previous background processes on ports 8000, 8001, 8002, 3000, 9090...${NC}"
lsof -ti:8000,8001,8002,3000,9090 | xargs kill -9 2>/dev/null || true
sleep 1

# 1. Setup & Start Target App Microservices
echo -e "${GREEN}[1/4] Starting Microservice Target App & Prometheus Exporter...${NC}"
cd "$ROOT_DIR/backend"
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate
pip install -r requirements.txt > /dev/null 2>&1

cd "$ROOT_DIR"
python3 target_app/app.py &
TARGET_PID=$!
echo -e "  └── Target App running on http://localhost:8002 & Exporter on port 8001 (PID: $TARGET_PID)"

# 2. Setup & Start Backend
echo -e "${GREEN}[2/4] Starting Sentinel-X ML & Remediation Backend...${NC}"
cd "$ROOT_DIR/backend"
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
echo -e "  └── Backend API running on http://localhost:8000 (PID: $BACKEND_PID)"

# 3. Start Prometheus (if installed)
if command -v prometheus &> /dev/null; then
    echo -e "${GREEN}[3/4] Starting Prometheus Telemetry Collector...${NC}"
    prometheus --config.file="$ROOT_DIR/prometheus.yml" --web.listen-address=":9090" > /dev/null 2>&1 &
    PROM_PID=$!
    echo -e "  └── Prometheus running on http://localhost:9090 (PID: $PROM_PID)"
else
    echo -e "${RED}[3/4] Prometheus binary not found in PATH; backend will use synthetic metric window fallback.${NC}"
fi

# 4. Setup & Start Frontend
echo -e "${GREEN}[4/4] Starting Sentinel-X Live React Dashboard...${NC}"
cd "$ROOT_DIR/frontend"
if [ ! -d "node_modules" ]; then
    npm install > /dev/null 2>&1
fi
PORT=3000 npm run dev -- -p 3000 &
FRONTEND_PID=$!
echo -e "  └── Dashboard running on http://localhost:3000 (PID: $FRONTEND_PID)"

echo -e "${BLUE}=====================================================${NC}"
echo -e "${GREEN} ✅ Sentinel-X Predictive System is LIVE! ${NC}"
echo -e "  📊 Live Dashboard:    http://localhost:3000"
echo -e "  🎯 Target App Web:    http://localhost:8002"
echo -e "  ⚙️ Backend API:       http://localhost:8000/docs"
echo -e "${BLUE} Press Ctrl+C to stop all services.${NC}"
echo -e "${BLUE}=====================================================${NC}"

wait
