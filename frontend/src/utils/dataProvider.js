import mlResults from '../data/ml_results.json';
import blastRadiusResults from '../data/blast_radius_results.json';
import initialResults from '../data/initial_results.json';

// Normalize Dashboard Metrics from initial_results or ml_results
export const getDashboardMetrics = () => {
    // initial_results has "features" which includes mean_cpu, mean_memory, etc.
    const features = initialResults.results?.[0]?.features || {};

    return {
        cpu: {
            value: `${Math.round(features.mean_cpu || 0)}%`,
            trend: features.cpu_trend > 0 ? `+${features.cpu_trend.toFixed(1)}%` : `${features.cpu_trend.toFixed(1)}%`,
            status: features.mean_cpu > 80 ? 'critical' : 'normal'
        },
        memory: {
            value: `${Math.round(features.mean_memory || 0)}MB`,
            trend: features.memory_trend > 0 ? `+${features.memory_trend.toFixed(1)}` : `${features.memory_trend.toFixed(1)}`,
            status: features.mean_memory > 1000 ? 'warning' : 'normal' // arbitrary threshold
        },
        requests: {
            value: `${Math.round(features.mean_requests || 0)}/s`,
            trend: features.throughput_delta > 0 ? `+${features.throughput_delta}` : `${features.throughput_delta}`,
        },
        cost: {
            value: `$${(features.unit_economics_ratio * 100).toFixed(2)}`, // Fake mock
            delta: features.cost_delta || 0
        },
        // Anomaly Status
        isAnomaly: mlResults.anomaly?.is_anomaly || false,
        anomalyScore: mlResults.anomaly?.score || 0
    };
};

export const getBlastRadiusData = () => {
    // Transform blast_radius_results.json into graph format
    const rootService = blastRadiusResults.service || 'unknown';
    const propagation = blastRadiusResults.blast_radius?.predicted_propagation || [];

    // Nodes: Root + Propagated Services
    const nodes = [
        {
            id: 'root',
            label: rootService,
            type: 'origin',
            x: 50,
            y: 300,
            status: blastRadiusResults.blast_radius?.current_state === 'Healthy' ? 'safe' : 'risk'
        }
    ];

    const paths = [];

    // Simple layout logic (fan out)
    propagation.forEach((item, index) => {
        const id = `target-${index}`;
        const yPos = 100 + (index * 100); // spread vertically

        nodes.push({
            id: id,
            label: item.service,
            sub: item.reason,
            type: 'target',
            x: 400, // to the right
            y: yPos,
            status: item.risk_level === 'High' ? 'risk' : item.risk_level === 'Medium' ? 'warning' : 'safe',
            risk: item.risk_level
        });

        // Path from root to this node
        // Curved line
        paths.push({
            d: `M 150 300 C 250 300, 250 ${yPos}, 350 ${yPos}`,
            stroke: item.risk_level === 'High' ? 'risk' : item.risk_level === 'Medium' ? 'warning' : 'safe'
        });
    });

    return {
        id: 'real-data',
        service: rootService,
        description: 'Detected via ML Analysis',
        riskLevel: 'High', // derived
        graph: { nodes, paths },
        insights: {
            reliability: {
                title: 'Propagation Risk',
                prob: `${(blastRadiusResults.blast_radius?.confidence * 100).toFixed(0)}% Confidence`,
                desc: `Predicted impact on ${propagation.length} downstream services.`
            },
            finops: {
                waste: '$Unknown', // Data missing in JSON
                cause: 'Cascading resource consumption'
            },
            recommendation: 'Manual Review Required'
        }
    };
};

export const getAlerts = () => {
    const realAlert = {
        id: 'ML-DETECT-01',
        name: blastRadiusResults.service ? `${blastRadiusResults.service} Anomaly` : 'Service Anomaly',
        riskScore: Math.abs(mlResults.anomaly?.score) * 100 + 50,
        severity: 'Critical',
        time: mlResults.change_event?.timestamp || 'Just now',
        impact: 'High',
        teams: 'DevOps, SRE',
        affectedStr: blastRadiusResults.service || 'Unknown',
        cve: 'ANOMOLY-01',
        baseScore: '9.0',
        impactLabel: 'Service Degradation',
        type: 'Anomaly',
        status: 'Active',
        age: '1m'
    };

    const mockAlerts = [
        {
            id: 'S-CVE-2024-4091',
            name: 'SQL Injection in Legacy Search',
            riskScore: 92,
            severity: 'Critical',
            time: '2024-01-31T10:00:00Z',
            impact: 'Critical',
            teams: 'Data, Security',
            affectedStr: 'inventory-db',
            cve: 'CVE-2024-4091',
            baseScore: '9.8',
            impactLabel: 'Data Exfiltration',
            type: 'SQL Injection',
            status: 'Active',
            age: '4h'
        },
        {
            id: 'K8S-RES-002',
            name: 'Memory Saturation: Order Service',
            riskScore: 78,
            severity: 'High',
            time: '2024-01-31T14:30:00Z',
            impact: 'High',
            teams: 'Platform Ops',
            affectedStr: 'order-service-v2',
            cve: 'N/A',
            baseScore: '7.5',
            impactLabel: 'OOM Kill Risk',
            type: 'Resource',
            status: 'Active',
            age: '2h'
        },
        {
            id: 'NET-LAT-505',
            name: 'High Latency in US-East Region',
            riskScore: 65,
            severity: 'Medium',
            time: '2024-01-31T16:00:00Z',
            impact: 'Medium',
            teams: 'SRE',
            affectedStr: 'api-gateway',
            cve: 'N/A',
            baseScore: '6.0',
            impactLabel: 'User Experience',
            type: 'Performance',
            status: 'Investigating',
            age: '30m'
        },
        {
            id: 'SEC-LOG-201',
            name: 'Suspicious Admin Access Pattern',
            riskScore: 88,
            severity: 'High',
            time: '2024-01-31T09:15:00Z',
            impact: 'Critical',
            teams: 'SecOps',
            affectedStr: 'admin-portal',
            cve: 'N/A',
            baseScore: '8.2',
            impactLabel: 'Unauthorized Access',
            type: 'Security Event',
            status: 'Active',
            age: '6h'
        },
        {
            id: 'DEP-VER-099',
            name: 'Outdated SSL Certificate',
            riskScore: 45,
            severity: 'Low',
            time: '2024-01-30T10:00:00Z',
            impact: 'Low',
            teams: 'DepOps',
            affectedStr: 'cdn-static-assets',
            cve: 'N/A',
            baseScore: '4.0',
            impactLabel: 'Compliance',
            type: 'Misconfig',
            status: 'Triaged',
            age: '1d'
        }
    ];

    return [realAlert, ...mockAlerts];
};

export const getCorrelationData = () => {
    const indicators = mlResults.indicators || [];
    const affectedMetrics = indicators.map(ind => {
        // Parse sentence: "CPU usage increased 43% after deployment"
        const lowerInd = ind.toLowerCase();
        const parts = lowerInd.split(' ');

        let directionIndex = parts.indexOf('increased');
        let direction = 'increased';

        if (directionIndex === -1) {
            directionIndex = parts.indexOf('decreased');
            direction = 'decreased';
        }

        // Default fallback if parsing fails
        let metricName = parts[0];
        if (directionIndex > 0) {
            // Join words before the direction keyword
            metricName = parts.slice(0, directionIndex).join(' ');
        }

        // Capitalize words for nice label
        metricName = metricName.split(' ')
            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ');

        // Handle special case abbreviations
        metricName = metricName.replace('Cpu', 'CPU').replace('Sla', 'SLA');

        const percentStr = parts.find(p => p.includes('%')) || '0%';
        const percent = parseInt(percentStr.replace('%', ''));

        // Mocking before/after based on percent
        const before = 50;
        const after = direction === 'increased' ? 50 * (1 + percent / 100) : 50 * (1 - percent / 100);

        return {
            metric: metricName,
            before_avg: Math.round(before),
            after_avg: Math.round(after),
            delta_percent: percent,
            pattern: direction === 'increased' ? 'Sustained Increase' : 'Drop'
        };
    });

    return {
        service: mlResults.service || 'Unknown Service',
        change_event: {
            type: mlResults.change_event?.type || 'deployment',
            version: 'v2.4.0', // extracted or mock
            timestamp: mlResults.change_event?.timestamp || new Date().toISOString()
        },
        correlation: {
            is_correlated: mlResults.correlation?.is_correlated || false,
            correlation_confidence: mlResults.correlation?.confidence || 0,
            time_offset_minutes: mlResults.correlation?.delay_minutes || 0,
            affected_metrics: affectedMetrics
        }
    };
};
