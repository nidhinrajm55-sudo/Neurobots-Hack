import requests
import time
import os
from datetime import datetime

BACKEND_URL = os.getenv("BACKEND_URL", "http://backend:8000")

def trigger_good_spike(service="payment-service"):
    """
    Simulate a 'Good Spike' where traffic increases, causing cost increase,
    but unit economics/throughput justifies it.
    """
    print(f"Triggering GOOD SPIKE on {service}")
    
    duration_minutes = 5
    for i in range(12 * duration_minutes): 
        
        metrics = {
            "service": service,
            "cpu_percent": 75.0, # Higher CPU (due to traffic)
            "memory_mb": 2048,
            "network_out_mbps": 25.0, # High network
            "request_count": 3000 + (i * 10), # Doubled requests!
            "error_count": 12, # Stable errors (System handling it well)
            "latency_p95_ms": 260 # Latency slightly up but stable
        }
        
        try:
            requests.post(f"{BACKEND_URL}/ingest/metrics", json=metrics)
        except:
            pass
            
        time.sleep(5)

if __name__ == "__main__":
    trigger_good_spike()
