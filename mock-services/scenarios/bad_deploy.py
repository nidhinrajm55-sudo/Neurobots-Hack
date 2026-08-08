import requests
import time
import os
from datetime import datetime

BACKEND_URL = os.getenv("BACKEND_URL", "http://backend:8000")

def trigger_bad_deploy(service="payment-service"):
    """Simulate a bad deployment causing CPU spike and latency increase"""
    print(f"Triggering BAD DEPLOY on {service}")
    
    # 1. Register the change first
    change_event = {
        "change_id": f"chg_{int(time.time())}",
        "service": service,
        "timestamp": datetime.utcnow().isoformat(),
        "description": "Deploying v2.4 (Bad Version)",
        "version": "v2.4"
    }
    
    try:
        requests.post(f"{BACKEND_URL}/ingest/change", json=change_event)
        print("Change registered.")
    except Exception as e:
        print(f"Failed to register change: {e}")

    # 2. Simulate metrics degradation after deploy
    # Sudden CPU spike and Latency spike
    duration_minutes = 5
    for i in range(12 * duration_minutes): # 5 second intervals
        
        metrics = {
            "service": service,
            # "timestamp": ... (backend handles)
            "cpu_percent": 85.0 + (i % 5), # High CPU
            "memory_mb": 2048,
            "network_out_mbps": 8.5,
            "request_count": 1450,
            "error_count": 50 + (i * 2), # High errors
            "latency_p95_ms": 500 + (i * 10) # High latency
        }
        
        try:
            requests.post(f"{BACKEND_URL}/ingest/metrics", json=metrics)
        except:
            pass
            
        time.sleep(5)

if __name__ == "__main__":
    trigger_bad_deploy()
