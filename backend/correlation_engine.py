from datetime import datetime, timedelta
import numpy as np

def calculate_correlation(baseline, impact, change_event):
    """
    Correlates an anomaly to a change event by comparing baseline vs impact features.
    
    baseline: dict of features BEFORE change
    impact: dict of features AFTER change
    change_event: dict containing metadata about the change
    """
    if not baseline or not impact:
        return None

    affected_metrics = []
    indicators = []
    
    # Configuration for interesting metrics
    metrics_to_check = {
        "mean_cpu": "CPU usage",
        "mean_memory": "Memory usage",
        "mean_requests": "Request rate",
        "cpu_trend": "CPU trend",
        "memory_trend": "Memory trend"
    }

    total_delta_pct = 0
    checked_count = 0

    for key, label in metrics_to_check.items():
        b_val = baseline.get(key, 0)
        i_val = impact.get(key, 0)
        
        # Avoid division by zero
        delta = i_val - b_val
        if b_val != 0:
            delta_pct = (delta / abs(b_val)) * 100
        else:
            delta_pct = 100.0 if delta > 0 else 0.0

        pattern = "stable"
        if delta_pct > 15:
            pattern = "sustained_increase" if "trend" not in key else "accelerated"
        elif delta_pct < -15:
            pattern = "sustained_decrease" if "trend" not in key else "decelerated"

        if abs(delta_pct) > 10: # Only report significant changes
            affected_metrics.append({
                "metric": key.replace("mean_", ""),
                "before": round(float(b_val), 2),
                "after": round(float(i_val), 2),
                "delta_percent": round(float(delta_pct), 1),
                "pattern": pattern
            })
            
            # Generate human-readable indicator
            direction = "increased" if delta > 0 else "decreased"
            indicators.append(f"{label} {direction} {round(abs(delta_pct))}% after {change_event['type']}")

        total_delta_pct += abs(delta_pct)
        checked_count += 1

    # Simple confidence score: normalized average delta of checked metrics
    # If the metrics changed significantly after the event, confidence is higher.
    avg_delta = total_delta_pct / checked_count if checked_count > 0 else 0
    confidence = min(0.95, 0.4 + (avg_delta / 100)) # Start at 0.4 base

    # Delay estimation: Mocked for hackathon or based on timestamp diff
    delay_minutes = 0
    if change_event.get("timestamp"):
        try:
            event_time = datetime.fromisoformat(change_event["timestamp"].replace("Z", "+00:00"))
            now = datetime.now()
            delay_minutes = int((now - event_time).total_seconds() / 60)
        except:
             delay_minutes = 5 # fallback

    return {
        "is_correlated": len(affected_metrics) > 0,
        "confidence": round(float(confidence), 2),
        "delay_minutes": max(1, delay_minutes),
        "affected_metrics": affected_metrics,
        "indicators": indicators
    }
