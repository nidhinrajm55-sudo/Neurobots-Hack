import time
import random
import os
import signal
import sys
import psutil
from prometheus_client import start_http_server, Gauge

# Metrics definition
# specific labels for slicing: service
CPU_USAGE = Gauge('service_cpu_usage_percent', 'Current CPU usage percent', ['service'])
MEMORY_USAGE = Gauge('service_memory_usage_mb', 'Current Memory usage in MB', ['service'])
LATENCY = Gauge('service_latency_ms', 'P95 Latency in ms', ['service'])
REQUEST_RATE = Gauge('service_request_rate_ops', 'Requests per second', ['service'])
ERROR_RATE = Gauge('service_error_rate_ops', 'Errors per second', ['service'])

# Services to simulate
SERVICES = [
    'api-gateway',
    'auth-service',
    'payment-service',
    'checkout-service',
    'database'
]

def update_metrics():
    """Update gauge values with REAL system metrics where possible"""
    
    # Get Real System Metrics (once per loop to share across services, or per service?)
    # For "Host" simulation, all services sharing the same host metrics is more realistic for this demo
    real_cpu = psutil.cpu_percent(interval=None)
    real_memory = psutil.virtual_memory().used / (1024 * 1024) # MB
    
    for service in SERVICES:
        # traffic and latency are still simulated as they are application-level metrics
        request_count = random.randint(1300, 1600)
        
        latency = random.uniform(200, 280)
        # Simulate spikes randomly
        if random.random() > 0.95:
             latency += random.uniform(100, 500)
        
        # Jitter the CPU slightly per service so they aren't identical lines
        service_cpu = max(0, min(100, real_cpu + random.uniform(-1, 1)))
        
        # Set values
        CPU_USAGE.labels(service=service).set(service_cpu)
        MEMORY_USAGE.labels(service=service).set(real_memory) 
        LATENCY.labels(service=service).set(latency)
        REQUEST_RATE.labels(service=service).set(request_count)
        ERROR_RATE.labels(service=service).set(random.randint(0, 5))

def signal_handler(sig, frame):
    print("Stopping metric exporter")
    sys.exit(0)

if __name__ == "__main__":
    signal.signal(signal.SIGINT, signal_handler)
    
    # Start Prometheus HTTP server
    port = int(os.getenv("EXPORTER_PORT", 8001))
    start_http_server(port)
    print(f"🚀 Prometheus Metrics Exporter running on port {port}")
    
    # Update loop
    while True:
        update_metrics()
        time.sleep(2)
