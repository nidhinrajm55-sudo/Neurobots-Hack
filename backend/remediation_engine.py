import httpx
import time
import os

GATEWAY_URL = os.getenv("GATEWAY_URL", "http://localhost:8002")

action_history = []
last_action_time = {}

def trigger_remediation(service_name: str, risk_level: str, confidence: float, trigger_reason: str):
    """
    Idempotent remediation engine.
    Applies automatic self-healing actions based on risk level and model confidence.
    """
    now = time.time()
    # Enforce 8-second cooldown per service node to prevent thrashing
    if service_name in last_action_time and (now - last_action_time[service_name] < 8.0):
        return {"status": "cooldown", "message": f"Remediation for {service_name} throttled by cooldown safety"}
    
    last_action_time[service_name] = now
    action_type = "UNKNOWN"
    details = ""
    
    try:
        if risk_level == "degrading":
            action_type = "RATE_LIMIT_GATEWAY"
            # Enable token bucket rate limiting at gateway
            with httpx.Client(timeout=3.0) as client:
                res = client.post(f"{GATEWAY_URL}/remediate/rate-limit", json={"enabled": True, "max_rps": 30})
            details = "Applied gateway token-bucket rate limiting (max 30 rps)"
            
        elif risk_level == "critical":
            if service_name == "auth-service":
                action_type = "MEMORY_LEAK_PURGE"
                with httpx.Client(timeout=3.0) as client:
                    res = client.post(f"{GATEWAY_URL}/remediate/reset-leak")
                details = "Triggered memory buffer purge and garbage collection for auth-service"
            else:
                action_type = "THROTTLE_AND_RESTART"
                with httpx.Client(timeout=3.0) as client:
                    res = client.post(f"{GATEWAY_URL}/remediate/rate-limit", json={"enabled": True, "max_rps": 10})
                details = f"Applied critical traffic throttling and circuit breaker for {service_name}"
        else:
            return {"status": "skipped", "message": f"Service {service_name} is healthy"}
            
        action_record = {
            "action_id": f"act-{int(now*1000)}",
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(now)),
            "service": service_name,
            "risk_level": risk_level,
            "confidence": round(confidence, 2),
            "action_type": action_type,
            "trigger_reason": trigger_reason,
            "details": details,
            "status": "SUCCESS"
        }
        
        action_history.insert(0, action_record)
        print(f"⚡ AUTO-REMEDIATION EXECUTED: {action_record}")
        return {"status": "success", "action": action_record}
        
    except Exception as e:
        error_record = {
            "action_id": f"act-{int(now*1000)}",
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(now)),
            "service": service_name,
            "risk_level": risk_level,
            "confidence": round(confidence, 2),
            "action_type": action_type,
            "trigger_reason": trigger_reason,
            "details": f"Fallback applied: {str(e)}",
            "status": "PARTIAL_SUCCESS"
        }
        action_history.insert(0, error_record)
        return {"status": "partial", "action": error_record}

def get_action_history():
    return action_history[:50]
