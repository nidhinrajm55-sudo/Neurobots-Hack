from datetime import datetime

# Sentinel-X Static Microservice Dependency Map
DEPENDENCY_MAP = {
    "auth-service": [
        {"service": "api-gateway", "type": "sync", "depth": 1}
    ],
    "api-gateway": [
        {"service": "order-service", "type": "sync", "depth": 1}
    ],
    "order-service": [
        {"service": "payment-service", "type": "sync", "depth": 2}
    ],
    "payment-service": []
}

def analyze_blast_radius(service_name: str, current_metrics: dict, risk_level: str = "degrading", confidence: float = 0.85):
    """
    Propagates failure risk across downstream microservices graph with confidence decay.
    """
    predicted_propagation = []
    visited = set()
    
    def trace(s_name: str, current_depth: int = 1):
        if s_name in visited or s_name not in DEPENDENCY_MAP:
            return
        visited.add(s_name)
        
        for dep in DEPENDENCY_MAP[s_name]:
            risk = "HIGH" if dep["type"] == "sync" else "MEDIUM"
            conf = max(0.2, round(confidence / (1.5 ** current_depth), 2))
            impact_min = current_depth * 2
            
            predicted_propagation.append({
                "service": dep["service"],
                "risk_level": risk,
                "confidence": conf,
                "expected_impact_seconds": impact_min * 5,
                "reason": f"Downstream {dep['type']} dependency of {s_name}"
            })
            trace(dep["service"], current_depth + 1)

    trace(service_name)
    
    unique_at_risk = list(set(p["service"] for p in predicted_propagation))
    summary = {
        "source_service": service_name,
        "source_risk_level": risk_level,
        "total_services_at_risk": len(unique_at_risk),
        "affected_nodes": unique_at_risk,
        "max_propagation_depth": max([p["expected_impact_seconds"] for p in predicted_propagation]) // 5 if predicted_propagation else 0,
        "sla_violation_risk": "LIKELY" if risk_level == "critical" else ("POSSIBLE" if risk_level == "degrading" else "LOW")
    }

    return {
        "service": service_name,
        "blast_radius": {
            "current_state": risk_level,
            "confidence": confidence,
            "predicted_propagation": predicted_propagation,
            "summary": summary
        }
    }
