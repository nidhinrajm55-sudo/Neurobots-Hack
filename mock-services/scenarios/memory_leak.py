import requests
import time
import os

BACKEND_URL = os.getenv("BACKEND_URL", "http://backend:8000")

def trigger_memory_leak(service="payment-service"):
    """Simulate gradual memory leak"""
    print(f"Triggering memory leak on {service}")
    
    base_cpu = 65
    
    # Run for 5 minutes (60 * 5s)
    for i in range(60):
        cpu = base_cpu + (i * 0.5)  # Gradual increase
        
        metrics = {
            "service": service,
            # "timestamp": datetime.utcnow().isoformat(), # Backend handles if missing
            "cpu_percent": cpu,
            "memory_mb": 2048 + (i * 20),  # Memory increasing
            "network_out_mbps": 8.5,
            "request_count": 1450,
            "error_count": 12 + (i // 10),  # Errors increasing slowly
            "latency_p95_ms": 240 + (i * 2)
        }
        
        try:
            requests.post(f"{BACKEND_URL}/ingest/metrics", json=metrics)
        except Exception as e:
            print(f"Error triggering leak: {e}")
            
        time.sleep(5)

if __name__ == "__main__":
    trigger_memory_leak()
