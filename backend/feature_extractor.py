import numpy as np
from typing import List, Dict, Any

FEATURE_NAMES = [
    "mean_cpu", "std_cpu", "min_cpu", "max_cpu", "delta_cpu", "cpu_trend",
    "mean_memory", "std_memory", "memory_trend",
    "mean_requests", "request_spike_count", "throughput_delta",
    "mean_latency", "latency_trend", "error_rate", "error_rate_trend"
]

def calculate_trend(values: List[float]) -> float:
    """Calculates linear slope trend over sample values."""
    if len(values) < 2:
        return 0.0
    x = np.arange(len(values))
    y = np.array(values)
    slope = np.polyfit(x, y, 1)[0]
    return float(slope)

def extract_features_from_window(samples: List[Dict[str, float]]) -> List[float]:
    """
    Extracts 16 statistical features from a rolling metric window for a single node.
    samples: list of dicts with keys: cpu_percent, memory_mb, request_count, error_count, latency_p95_ms
    """
    if not samples:
        return [0.0] * len(FEATURE_NAMES)
    
    cpus = [s.get("cpu_percent", 0.0) for s in samples]
    mems = [s.get("memory_mb", 0.0) for s in samples]
    reqs = [s.get("request_count", 0) for s in samples]
    errs = [s.get("error_count", 0) for s in samples]
    lats = [s.get("latency_p95_ms", 0.0) for s in samples]
    
    # CPU features
    mean_cpu = float(np.mean(cpus))
    std_cpu = float(np.std(cpus))
    min_cpu = float(np.min(cpus))
    max_cpu = float(np.max(cpus))
    delta_cpu = cpus[-1] - cpus[0] if len(cpus) > 1 else 0.0
    cpu_trend = calculate_trend(cpus)
    
    # Memory features
    mean_mem = float(np.mean(mems))
    std_mem = float(np.std(mems))
    mem_trend = calculate_trend(mems)
    
    # Request & Throughput features
    mean_reqs = float(np.mean(reqs))
    req_mean = mean_reqs if mean_reqs > 0 else 1.0
    request_spike_count = int(sum(1 for r in reqs if r > req_mean * 1.5))
    throughput_delta = reqs[-1] - reqs[0] if len(reqs) > 1 else 0.0
    
    # Latency & Error features
    mean_lat = float(np.mean(lats))
    latency_trend = calculate_trend(lats)
    error_rate = float(np.mean(errs))
    error_rate_trend = calculate_trend(errs)
    
    return [
        round(mean_cpu, 2),
        round(std_cpu, 2),
        round(min_cpu, 2),
        round(max_cpu, 2),
        round(delta_cpu, 2),
        round(cpu_trend, 4),
        round(mean_mem, 2),
        round(std_mem, 2),
        round(mem_trend, 4),
        round(mean_reqs, 2),
        request_spike_count,
        round(throughput_delta, 2),
        round(mean_lat, 2),
        round(latency_trend, 4),
        round(error_rate, 2),
        round(error_rate_trend, 4)
    ]
