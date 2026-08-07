/**
 * Logic ported from SEp/backend/run.py
 * Detects incident types based on telemetry data patterns.
 */

export const detectIncidentType = (data) => {
    // Helper to safely get values or default to 0
    const val = (key, def = 0) => (data[key] !== undefined ? data[key] : def);

    const meanCpu = val('mean_cpu');
    const cpuVolatility = val('cpu_volatility');
    const unitEconomics = val('unit_economics_ratio', 1.0);
    const requestSpikes = val('request_spike_count');
    const memoryTrend = val('memory_trend');
    const meanMemory = val('mean_memory');
    const meanRequests = val('mean_requests');
    const throughputDelta = val('throughput_delta');

    // Check for BadDeploy pattern (Critical)
    const badDeployIndicators = [];
    if (meanCpu > 80) badDeployIndicators.push(`High CPU usage (${meanCpu.toFixed(1)}% > 80%)`);
    if (cpuVolatility > 1.0) badDeployIndicators.push(`Elevated CPU volatility (${cpuVolatility.toFixed(1)} > 1.0)`);
    if (unitEconomics < 1.0) badDeployIndicators.push(`Concerning unit economics (ratio: ${unitEconomics.toFixed(1)} < 1.0)`);
    if (requestSpikes > 5) badDeployIndicators.push(`High request spikes detected (${requestSpikes})`);

    if (badDeployIndicators.length >= 2) {
        return {
            type: "BadDeploy",
            severity: "Critical",
            confidence: Math.min(0.95, 0.7 + (0.1 * badDeployIndicators.length)),
            indicators: badDeployIndicators,
            description: "Deployment causing critical resource regression."
        };
    }

    // Check for MemoryLeak pattern (High)
    const memoryLeakIndicators = [];
    if (memoryTrend > 0.8) memoryLeakIndicators.push(`Memory trend increasing (${memoryTrend.toFixed(1)} > 0.8)`);
    if (meanMemory > 65) memoryLeakIndicators.push(`Elevated memory usage (${meanMemory.toFixed(1)}% > 65%)`);
    if (requestSpikes > 0) memoryLeakIndicators.push(`Request spikes detected (${requestSpikes})`);

    if (memoryLeakIndicators.length >= 2) {
        return {
            type: "MemoryLeak",
            severity: "High",
            confidence: Math.min(0.9, 0.7 + (0.1 * memoryLeakIndicators.length)),
            indicators: memoryLeakIndicators,
            description: "Potential memory leak detected in service."
        };
    }

    // Check for TrafficSpike pattern (Medium/Info)
    const trafficSpikeIndicators = [];
    if (meanRequests > 2000) trafficSpikeIndicators.push(`High request count (${meanRequests.toFixed(0)} > 2000)`);
    if (throughputDelta > 200) trafficSpikeIndicators.push(`Elevated throughput delta (${throughputDelta.toFixed(0)} > 200)`);
    if (unitEconomics > 1.2) trafficSpikeIndicators.push(`Healthy unit economics (ratio: ${unitEconomics.toFixed(1)} > 1.2)`);

    if (trafficSpikeIndicators.length >= 2) {
        return {
            type: "TrafficSpike",
            severity: "Medium",
            confidence: Math.min(0.9, 0.7 + (0.1 * trafficSpikeIndicators.length)),
            indicators: [...trafficSpikeIndicators, "Legitimate traffic pattern"],
            description: "Traffic surge detected (likely legitimate)."
        };
    }

    // Check for Normal pattern
    const normalConditions = [
        { met: meanCpu < 70, desc: `CPU (${meanCpu.toFixed(1)}%) < 70%` },
        { met: meanMemory < 70, desc: `Memory (${meanMemory.toFixed(1)}%) < 70%` },
        { met: unitEconomics >= 1.0, desc: `Unit economics (${unitEconomics.toFixed(1)}) >= 1.0` },
        { met: requestSpikes <= 5, desc: `Spikes (${requestSpikes}) <= 5` }
    ];

    if (normalConditions.every(c => c.met)) {
        return {
            type: "Normal",
            severity: "Low",
            confidence: 0.9,
            indicators: normalConditions.map(c => c.desc),
            description: "All metrics within healthy ranges."
        };
    }

    // Fallback: Watch / Warning
    const concerning = [];
    if (meanCpu > 70) concerning.push(`Elevated CPU (${meanCpu.toFixed(1)}%)`);
    if (meanMemory > 65) concerning.push(`Elevated Memory (${meanMemory.toFixed(1)}%)`);
    if (unitEconomics < 1.0) concerning.push(`Bad Unit Economics (${unitEconomics.toFixed(1)})`);

    return {
        type: "Watch",
        severity: "Medium",
        confidence: 0.6,
        indicators: ["Potential issues detected:", ...concerning],
        description: "Metrics showing signs of degradation."
    };
};

/**
 * Generate a random telemetry snapshot for simulation
 */
export const generateTelemetry = () => {
    // Helper for random range
    const rand = (min, max) => Math.random() * (max - min) + min;

    // We start with a base "Scenario"
    const scenario = Math.random();

    if (scenario < 0.25) {
        // Bad Deploy Scenario
        return {
            mean_cpu: rand(75, 95),
            std_cpu: rand(2, 5),
            min_cpu: rand(70, 80),
            max_cpu: rand(90, 100),
            cpu_volatility: rand(0.8, 1.5),
            mean_memory: rand(40, 60),
            unit_economics_ratio: rand(0.5, 0.9),
            request_spike_count: Math.floor(rand(4, 10)),
            mean_requests: rand(500, 1000)
        };
    } else if (scenario < 0.5) {
        // Memory Leak Scenario
        return {
            mean_cpu: rand(40, 60),
            mean_memory: rand(70, 90),
            memory_trend: rand(0.7, 1.2),
            std_memory: rand(5, 15),
            request_spike_count: Math.floor(rand(0, 3)),
            unit_economics_ratio: rand(0.9, 1.1)
        };
    } else if (scenario < 0.7) {
        // Traffic Spike
        return {
            mean_cpu: rand(60, 80),
            mean_requests: rand(2500, 4000),
            throughput_delta: rand(250, 500),
            unit_economics_ratio: rand(1.1, 1.5),
            request_spike_count: Math.floor(rand(0, 2)),
            mean_memory: rand(50, 70)
        };
    } else {
        // Normal
        return {
            mean_cpu: rand(30, 60),
            mean_memory: rand(40, 60),
            unit_economics_ratio: rand(1.1, 1.3),
            request_spike_count: Math.floor(rand(0, 3)),
            mean_requests: rand(800, 1500)
        };
    }
};
