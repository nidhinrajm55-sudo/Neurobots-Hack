import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity, AlertTriangle, CheckCircle2, GitBranch, Layers, Server,
    Zap, TrendingUp, DollarSign, Database, Lock, Globe, ShieldAlert,
    Cpu, RefreshCcw, ArrowRight, Eye, Radio, ShieldCheck, Flame
} from 'lucide-react';
import { apiClient } from '../utils/api';

const SCENARIOS = {
    'order-service': {
        id: 'order-service',
        service: 'order-service',
        title: 'Order Processing Microservice Target',
        version: 'v3.1.0',
        description: 'Predicting spider-web failure propagation for high concurrency DDoS & load flood on target app.',
        priorityNodes: [
            { id: 'order-service', name: 'order-service', tier: 'P0', role: 'Root Target', riskScore: 99, prob: '99%', status: 'critical', costWaste: '$18,500/hr', latency: '+840ms', impact: 'Target App Order Outage' },
            { id: 'api-gateway', name: 'api-gateway', tier: 'P0', role: 'Ingress Router', riskScore: 94, prob: '94%', status: 'critical', costWaste: '$12,400/hr', latency: '+480ms', impact: 'Rate Limit 429 Throttle' },
            { id: 'payment-service', name: 'payment-service', tier: 'P0', role: 'Payment Core', riskScore: 88, prob: '88%', status: 'high', costWaste: '$7,200/hr', latency: '+320ms', impact: 'Payment Processing Lag' },
            { id: 'postgres-db', name: 'postgres-db', tier: 'P1', role: 'Transactional DB', riskScore: 79, prob: '79%', status: 'high', costWaste: '$4,300/hr', latency: '+220ms', impact: 'Unindexed Query Lock' },
            { id: 'inventory-service', name: 'inventory-service', tier: 'P1', role: 'Stock Manager', riskScore: 66, prob: '66%', status: 'medium', costWaste: '$2,100/hr', latency: '+95ms', impact: 'Inventory Hold Stalls' },
            { id: 'auth-service', name: 'auth-service', tier: 'P2', role: 'Token Verifier', riskScore: 48, prob: '48%', status: 'medium', costWaste: '$850/hr', latency: '+45ms', impact: 'Auth Token Queue' }
        ],
        graphNodes: [
            { id: 'order-service', label: 'order-service', ring: 0, angle: 0, status: 'critical', tier: 'P0' },
            { id: 'api-gateway', label: 'api-gateway', ring: 1, angle: 0, status: 'critical', tier: 'P0' },
            { id: 'payment-service', label: 'payment-service', ring: 1, angle: 120, status: 'high', tier: 'P0' },
            { id: 'postgres-db', label: 'postgres-db', ring: 1, angle: 240, status: 'high', tier: 'P1' },
            { id: 'inventory-service', label: 'inventory-service', ring: 2, angle: 60, status: 'medium', tier: 'P1' },
            { id: 'auth-service', label: 'auth-service', ring: 2, angle: 180, status: 'low', tier: 'P2' }
        ]
    },
    'payment-service': {
        id: 'payment-service',
        service: 'payment-service',
        title: 'Payment Gateway Core',
        version: 'v2.4.1',
        description: 'Predicting downstream blast radius for transaction processing memory overflow.',
        priorityNodes: [
            { id: 'payment-service', name: 'payment-service', tier: 'P0', role: 'Root Target', riskScore: 98, prob: '98%', status: 'critical', costWaste: '$14,250/hr', latency: '+420ms', impact: 'Direct Payment Outage' },
            { id: 'checkout-api', name: 'checkout-api', tier: 'P0', role: 'Direct Dependency', riskScore: 92, prob: '92%', status: 'critical', costWaste: '$8,400/hr', latency: '+380ms', impact: 'Checkout Cart Failures' },
            { id: 'auth-service', name: 'auth-service', tier: 'P0', role: 'Token Verifier', riskScore: 88, prob: '88%', status: 'high', costWaste: '$5,100/hr', latency: '+210ms', impact: 'Session Token Throttling' },
            { id: 'postgres-db', name: 'postgres-db', tier: 'P1', role: 'Primary DB', riskScore: 79, prob: '79%', status: 'high', costWaste: '$3,200/hr', latency: '+160ms', impact: 'Connection Pool Saturation' },
            { id: 'inventory-service', name: 'inventory-service', tier: 'P1', role: 'Stock Reservation', riskScore: 65, prob: '65%', status: 'medium', costWaste: '$1,800/hr', latency: '+95ms', impact: 'Delayed Stock Hold' },
            { id: 'redis-cache', name: 'redis-cache', tier: 'P2', role: 'Session Cache', riskScore: 48, prob: '48%', status: 'medium', costWaste: '$650/hr', latency: '+45ms', impact: 'Cache Eviction Rate' },
            { id: 'notification-service', name: 'notification-service', tier: 'P2', role: 'Receipt Worker', riskScore: 32, prob: '32%', status: 'low', costWaste: '$220/hr', latency: '+20ms', impact: 'Queued Email Delays' },
            { id: 'analytics-collector', name: 'analytics-collector', tier: 'P3', role: 'Edge Telemetry', riskScore: 15, prob: '15%', status: 'low', costWaste: '$50/hr', latency: '+5ms', impact: 'Minor Metric Lag' }
        ],
        graphNodes: [
            { id: 'payment-service', label: 'payment-service', ring: 0, angle: 0, status: 'critical', tier: 'P0' },
            { id: 'checkout-api', label: 'checkout-api', ring: 1, angle: 45, status: 'critical', tier: 'P0' },
            { id: 'auth-service', label: 'auth-service', ring: 1, angle: 135, status: 'high', tier: 'P0' },
            { id: 'postgres-db', label: 'postgres-db', ring: 1, angle: 225, status: 'high', tier: 'P1' },
            { id: 'inventory-service', label: 'inventory-service', ring: 2, angle: 0, status: 'medium', tier: 'P1' },
            { id: 'redis-cache', label: 'redis-cache', ring: 2, angle: 90, status: 'medium', tier: 'P2' },
            { id: 'notification-service', label: 'notification-service', ring: 2, angle: 180, status: 'low', tier: 'P2' },
            { id: 'analytics-collector', label: 'analytics-collector', ring: 3, angle: 270, status: 'low', tier: 'P3' }
        ]
    },
    'auth-service': {
        id: 'auth-service',
        service: 'auth-service',
        title: 'Authentication & IAM Service',
        version: 'v1.9.0',
        description: 'Simulating cascading OAuth JWT validation failures across entire cluster.',
        priorityNodes: [
            { id: 'auth-service', name: 'auth-service', tier: 'P0', role: 'Root Target', riskScore: 96, prob: '96%', status: 'critical', costWaste: '$12,000/hr', latency: '+510ms', impact: 'Global Auth Lockout' },
            { id: 'api-gateway', name: 'api-gateway', tier: 'P0', role: 'Edge Ingress', riskScore: 94, prob: '94%', status: 'critical', costWaste: '$9,800/hr', latency: '+490ms', impact: 'Request Rejection 401' },
            { id: 'user-service', name: 'user-service', tier: 'P0', role: 'Profile Provider', riskScore: 85, prob: '85%', status: 'high', costWaste: '$4,200/hr', latency: '+190ms', impact: 'Profile Fetch Stalls' },
            { id: 'redis-cache', name: 'redis-cache', tier: 'P1', role: 'Token Store', riskScore: 78, prob: '78%', status: 'high', costWaste: '$2,900/hr', latency: '+140ms', impact: 'Key Expiration Spikes' },
            { id: 'payment-service', name: 'payment-service', tier: 'P1', role: 'Downstream Consumer', riskScore: 62, prob: '62%', status: 'medium', costWaste: '$1,500/hr', latency: '+85ms', impact: 'Payment Auth Timeout' },
            { id: 'audit-log-service', name: 'audit-log-service', tier: 'P2', role: 'Compliance Logger', riskScore: 40, prob: '40%', status: 'low', costWaste: '$310/hr', latency: '+15ms', impact: 'Log Queue Backlog' }
        ],
        graphNodes: [
            { id: 'auth-service', label: 'auth-service', ring: 0, angle: 0, status: 'critical', tier: 'P0' },
            { id: 'api-gateway', label: 'api-gateway', ring: 1, angle: 0, status: 'critical', tier: 'P0' },
            { id: 'user-service', label: 'user-service', ring: 1, angle: 120, status: 'high', tier: 'P0' },
            { id: 'redis-cache', label: 'redis-cache', ring: 1, angle: 240, status: 'high', tier: 'P1' },
            { id: 'payment-service', label: 'payment-service', ring: 2, angle: 60, status: 'medium', tier: 'P1' },
            { id: 'audit-log-service', label: 'audit-log-service', ring: 2, angle: 180, status: 'low', tier: 'P2' }
        ]
    },
    'db-primary': {
        id: 'db-primary',
        service: 'db-primary',
        title: 'Primary Database Cluster',
        version: 'PG-16.2',
        description: 'Simulating IOPS degradation and write lock starvation on primary database node.',
        priorityNodes: [
            { id: 'db-primary', name: 'db-primary', tier: 'P0', role: 'Root Target', riskScore: 99, prob: '99%', status: 'critical', costWaste: '$22,500/hr', latency: '+890ms', impact: 'Write Transaction Lockout' },
            { id: 'payment-service', name: 'payment-service', tier: 'P0', role: 'Transactional Core', riskScore: 95, prob: '95%', status: 'critical', costWaste: '$16,000/hr', latency: '+740ms', impact: 'Payment Commit Timeouts' },
            { id: 'user-service', name: 'user-service', tier: 'P0', role: 'User Metadata', riskScore: 89, prob: '89%', status: 'high', costWaste: '$6,300/hr', latency: '+320ms', impact: 'Account Update Failures' },
            { id: 'inventory-service', name: 'inventory-service', tier: 'P1', role: 'Stock Manager', riskScore: 81, prob: '81%', status: 'high', costWaste: '$3,900/hr', latency: '+210ms', impact: 'Inventory Lock Timeouts' },
            { id: 'analytics-worker', name: 'analytics-worker', tier: 'P2', role: 'ETL Pipeline', riskScore: 50, prob: '50%', status: 'medium', costWaste: '$800/hr', latency: '+60ms', impact: 'ETL Synchronization Lag' }
        ],
        graphNodes: [
            { id: 'db-primary', label: 'db-primary', ring: 0, angle: 0, status: 'critical', tier: 'P0' },
            { id: 'payment-service', label: 'payment-service', ring: 1, angle: 30, status: 'critical', tier: 'P0' },
            { id: 'user-service', label: 'user-service', ring: 1, angle: 150, status: 'high', tier: 'P0' },
            { id: 'inventory-service', label: 'inventory-service', ring: 1, angle: 270, status: 'high', tier: 'P1' },
            { id: 'analytics-worker', label: 'analytics-worker', ring: 2, angle: 90, status: 'medium', tier: 'P2' }
        ]
    }
};

const BlastRadius = () => {
    const [selectedService, setSelectedService] = useState('order-service');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [hoveredNode, setHoveredNode] = useState(null);
    const [isolatedNodes, setIsolatedNodes] = useState([]);
    const [filterTier, setFilterTier] = useState('ALL');
    const [activeAttack, setActiveAttack] = useState(null);

    useEffect(() => {
        const checkAttackState = async () => {
            try {
                const statusData = await apiClient.getStatus();
                if (statusData.active_attack?.is_active) {
                    setActiveAttack(statusData.active_attack);
                    const target = statusData.active_attack.mode === 'memory_leak' ? 'auth-service' : 'order-service';
                    if (selectedService !== target) {
                        setSelectedService(target);
                    }
                } else {
                    setActiveAttack(null);
                }
            } catch (e) {}
        };
        checkAttackState();
        const interval = setInterval(checkAttackState, 2000);
        return () => clearInterval(interval);
    }, [selectedService]);

    const isAttackActive = !!activeAttack?.is_active;
    const baseScenario = SCENARIOS[selectedService] || SCENARIOS['order-service'];

    // Dynamically transform scenario based on active attack state vs normal state
    const scenario = useMemo(() => {
        if (isAttackActive) {
            return {
                ...baseScenario,
                priorityNodes: baseScenario.priorityNodes.map(node => ({
                    ...node,
                    riskScore: node.id === selectedService ? 99 : Math.max(70, node.riskScore),
                    prob: node.id === selectedService ? '99%' : `${Math.max(75, parseInt(node.prob))}%`,
                    status: node.id === selectedService ? 'critical' : node.status,
                    costWaste: node.id === selectedService ? '$24,500/hr' : node.costWaste,
                    latency: node.id === selectedService ? '+850ms' : node.latency,
                    impact: node.id === selectedService ? `🔥 LIVE ATTACK TARGET (${activeAttack.mode?.toUpperCase()})` : node.impact
                })),
                graphNodes: baseScenario.graphNodes.map(node => ({
                    ...node,
                    status: node.id === selectedService ? 'critical' : node.status
                }))
            };
        } else {
            // Normal nominal baseline state
            return {
                ...baseScenario,
                priorityNodes: baseScenario.priorityNodes.map(node => ({
                    ...node,
                    riskScore: node.id === selectedService ? 12 : Math.max(5, Math.floor(node.riskScore / 5)),
                    prob: '5%',
                    status: 'low',
                    tier: node.id === selectedService ? 'P0' : 'P3',
                    costWaste: '$0/hr',
                    latency: '+8ms',
                    impact: 'Nominal Operations Baseline'
                })),
                graphNodes: baseScenario.graphNodes.map(node => ({
                    ...node,
                    status: 'low',
                    tier: node.id === selectedService ? 'P0' : 'P3'
                }))
            };
        }
    }, [baseScenario, isAttackActive, selectedService, activeAttack]);

    const handleRunPrediction = () => {
        setIsAnalyzing(true);
        setTimeout(() => {
            setIsAnalyzing(false);
        }, 1200);
    };

    const toggleIsolate = (nodeId) => {
        if (isolatedNodes.includes(nodeId)) {
            setIsolatedNodes(isolatedNodes.filter(id => id !== nodeId));
        } else {
            setIsolatedNodes([...isolatedNodes, nodeId]);
        }
    };

    // Filter priority nodes
    const filteredPriorityNodes = useMemo(() => {
        if (filterTier === 'ALL') return scenario.priorityNodes;
        return scenario.priorityNodes.filter(node => node.tier === filterTier);
    }, [scenario, filterTier]);

    // Spider Web geometry parameters
    const cx = 360;
    const cy = 270;
    const ringRadii = [0, 85, 160, 230]; // Ring 0 (Center), Ring 1, Ring 2, Ring 3
    const numSpokes = 8;
    const angles = [0, 45, 90, 135, 180, 225, 270, 315];

    // Compute Web Spoke lines
    const spokeLines = angles.map(angle => {
        const rad = (angle * Math.PI) / 180;
        const x2 = cx + ringRadii[3] * Math.cos(rad);
        const y2 = cy + ringRadii[3] * Math.sin(rad);
        return { angle, x1: cx, y1: cy, x2, y2 };
    });

    // Compute Concentric Octagon Rings
    const ringPolygons = [1, 2, 3].map(ringIdx => {
        const r = ringRadii[ringIdx];
        const points = angles.map(angle => {
            const rad = (angle * Math.PI) / 180;
            const x = cx + r * Math.cos(rad);
            const y = cy + r * Math.sin(rad);
            return `${x.toFixed(1)},${y.toFixed(1)}`;
        }).join(' ');
        return { ringIdx, points, r };
    });

    // Map graphNodes to (x, y) coordinates
    const computedNodes = scenario.graphNodes.map(n => {
        const r = ringRadii[n.ring];
        const rad = (n.angle * Math.PI) / 180;
        const x = cx + r * Math.cos(rad);
        const y = cy + r * Math.sin(rad);
        const isIsolated = isolatedNodes.includes(n.id);
        return { ...n, x, y, r, isIsolated };
    });

    const statusBadgeColors = {
        P0: 'bg-red-600 text-white border-red-500 shadow-red-900/50',
        P1: 'bg-orange-600 text-white border-orange-500 shadow-orange-900/50',
        P2: 'bg-amber-500 text-black border-amber-400 shadow-amber-900/50',
        P3: 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-900/50'
    };

    const statusCardBorders = {
        P0: 'border-l-4 border-l-red-600 bg-red-50/40 hover:bg-red-50/80',
        P1: 'border-l-4 border-l-orange-500 bg-orange-50/40 hover:bg-orange-50/80',
        P2: 'border-l-4 border-l-amber-500 bg-amber-50/40 hover:bg-amber-50/80',
        P3: 'border-l-4 border-l-emerald-500 bg-emerald-50/40 hover:bg-emerald-50/80'
    };

    return (
        <div className="h-full w-full p-4 overflow-y-auto space-y-6 text-slate-900">
            {/* Live Attack Header Alert */}
            {isAttackActive ? (
                <div className="bg-gradient-to-r from-red-600 via-amber-600 to-red-700 text-white p-3.5 rounded-2xl shadow-lg flex items-center justify-between animate-pulse">
                    <div className="flex items-center gap-3">
                        <Zap className="h-5 w-5 text-yellow-300 animate-bounce" />
                        <div>
                            <h4 className="font-black text-xs uppercase tracking-wider">
                                🔥 LIVE ATTACK BLAST RADIUS: {activeAttack.mode?.toUpperCase()} ON {selectedService.toUpperCase()}
                            </h4>
                            <p className="text-[11px] opacity-90 font-medium">
                                Downstream failure risk propagating across graph. High cost waste and latency lag active!
                            </p>
                        </div>
                    </div>
                    <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-mono font-bold uppercase tracking-wider">
                        BLAST RADIUS EXPANDING
                    </span>
                </div>
            ) : (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 p-3 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <span>SYSTEM NOMINAL — All Microservice Dependency Nodes Operating within Baseline</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-100 px-2.5 py-0.5 rounded-full uppercase">
                        ZERO PROPAGATION RISK
                    </span>
                </div>
            )}

            {/* Header & Scenario Control Bar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white/90 backdrop-blur-md border border-slate-200 rounded-3xl p-6 shadow-sm">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                            <Flame className={`text-red-600 ${isAttackActive ? 'animate-pulse' : ''}`} /> Spider-Web Blast Radius
                        </h1>
                        <span className="px-3 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200 text-xs font-bold uppercase tracking-wider font-mono">
                            AI Predictive Engine
                        </span>
                    </div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
                        Concentric Spider-Web Failure Propagation & Tier-Ranked Priority Analysis
                    </p>
                </div>

                {/* Service Selector & Predict Action */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-full border border-slate-200">
                        <span className="text-xs font-bold text-slate-500 pl-2">Target:</span>
                        {Object.keys(SCENARIOS).map(key => (
                            <button
                                key={key}
                                onClick={() => setSelectedService(key)}
                                className={`px-3 py-1 rounded-full text-xs font-bold font-mono transition-all ${
                                    selectedService === key
                                        ? 'bg-blue-600 text-white shadow-md'
                                        : 'text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                {key}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={handleRunPrediction}
                        disabled={isAnalyzing}
                        className="px-5 py-2.5 bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white rounded-full text-xs font-bold uppercase tracking-wider shadow-lg shadow-red-500/25 transition-all flex items-center gap-2"
                    >
                        <Zap size={14} className={isAnalyzing ? 'animate-spin' : ''} />
                        {isAnalyzing ? 'Analyzing Web...' : 'Run Web Prediction'}
                    </button>
                </div>
            </div>

            {/* Main Visualizer & Priority List Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[580px]">
                {/* Left (7 Cols): Interactive Spider Web Graphic Canvas */}
                <div className="lg:col-span-7 bg-slate-950 rounded-3xl border border-slate-800 relative overflow-hidden flex flex-col shadow-2xl">
                    {/* Top Web Canvas Bar */}
                    <div className="p-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md z-20 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                                Concentric Spider Web Radar — Epicenter: <span className="text-red-400 font-bold">{scenario.service}</span>
                            </h3>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Ring 1: P0 Direct</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500" /> Ring 2: P1 High</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Ring 3: P2/P3 Edge</span>
                        </div>
                    </div>

                    {/* SVG Spider Web Canvas */}
                    <div className="flex-1 relative flex items-center justify-center min-h-[480px]">
                        {isAnalyzing ? (
                            <div className="flex flex-col items-center justify-center gap-4 text-center z-30">
                                <div className="relative">
                                    <div className="w-16 h-16 rounded-full border-4 border-red-500/20 border-t-red-500 animate-spin" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Zap size={24} className="text-red-500 animate-pulse" />
                                    </div>
                                </div>
                                <div className="text-xs font-mono text-slate-400 animate-pulse">
                                    Calculating spider-web energy propagation matrix...
                                </div>
                            </div>
                        ) : (
                            <div className="relative w-full h-full flex items-center justify-center">
                                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 720 540">
                                    <defs>
                                        {/* Glowing Spider Web Strand Gradients */}
                                        <linearGradient id="webGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
                                            <stop offset="50%" stopColor="#f97316" stopOpacity="0.5" />
                                            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.2" />
                                        </linearGradient>

                                        <radialGradient id="epicenterPulse" cx="50%" cy="50%" r="50%">
                                            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.6" />
                                            <stop offset="70%" stopColor="#ef4444" stopOpacity="0.2" />
                                            <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                                        </radialGradient>
                                    </defs>

                                    {/* Radial Spoke Lines radiating from center (cx, cy) */}
                                    {spokeLines.map((line, idx) => (
                                        <line
                                            key={`spoke-${idx}`}
                                            x1={line.x1}
                                            y1={line.y1}
                                            x2={line.x2}
                                            y2={line.y2}
                                            stroke="#334155"
                                            strokeWidth="1.5"
                                            strokeDasharray="4 4"
                                        />
                                    ))}

                                    {/* Concentric Octagonal Spider Web Rings */}
                                    {ringPolygons.map((ring) => (
                                        <polygon
                                            key={`ring-${ring.ringIdx}`}
                                            points={ring.points}
                                            fill="none"
                                            stroke={ring.ringIdx === 1 ? '#ef4444' : ring.ringIdx === 2 ? '#f97316' : '#3b82f6'}
                                            strokeWidth={ring.ringIdx === 1 ? '2' : '1.5'}
                                            strokeOpacity={ring.ringIdx === 1 ? '0.6' : '0.35'}
                                            strokeDasharray={ring.ringIdx === 3 ? '6 6' : '0'}
                                        />
                                    ))}

                                    {/* Radiant Energy Beams traveling from center to active nodes */}
                                    {computedNodes.filter(n => n.ring > 0).map((n, idx) => (
                                        <g key={`beam-${n.id}`}>
                                            <line
                                                x1={cx}
                                                y1={cy}
                                                x2={n.x}
                                                y2={n.y}
                                                stroke={n.isIsolated ? '#475569' : n.status === 'critical' ? '#ef4444' : n.status === 'high' ? '#f97316' : '#10b981'}
                                                strokeWidth={hoveredNode === n.id ? '4' : '2'}
                                                strokeDasharray={n.isIsolated ? '3 3' : '6 4'}
                                                strokeOpacity={hoveredNode === n.id ? '1' : '0.7'}
                                            />

                                            {/* Pulse Energy Particle along beam */}
                                            {!n.isIsolated && (
                                                <circle
                                                    r="4"
                                                    fill={n.status === 'critical' ? '#fca5a5' : '#fed7aa'}
                                                    className="animate-pulse"
                                                >
                                                    <animateMotion
                                                        path={`M ${cx} ${cy} L ${n.x} ${n.y}`}
                                                        dur={`${1.5 + idx * 0.4}s`}
                                                        repeatCount="indefinite"
                                                    />
                                                </circle>
                                            )}
                                        </g>
                                    ))}

                                    {/* Epicenter Background Glow */}
                                    <circle cx={cx} cy={cy} r="65" fill="url(#epicenterPulse)" className="animate-pulse" />
                                </svg>

                                {/* Render Epicenter Node (Center) */}
                                <div
                                    className="absolute z-20 flex flex-col items-center justify-center cursor-pointer transition-all transform hover:scale-110"
                                    style={{ left: cx - 45, top: cy - 45 }}
                                    onMouseEnter={() => setHoveredNode(computedNodes[0]?.id)}
                                    onMouseLeave={() => setHoveredNode(null)}
                                >
                                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-red-950 via-slate-900 to-red-900 border-4 border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.6)] flex flex-col items-center justify-center p-2 text-center relative">
                                        <div className="absolute -top-3 px-2 py-0.5 rounded-full bg-red-600 text-white text-[9px] font-black uppercase tracking-wider shadow">
                                            EPICENTER
                                        </div>
                                        <ShieldAlert size={22} className="text-red-400 animate-bounce mb-0.5" />
                                        <span className="text-[11px] font-black text-white truncate max-w-[80px] font-mono">
                                            {scenario.service}
                                        </span>
                                        <span className="text-[9px] font-bold text-red-400 uppercase">P0 CRITICAL</span>
                                    </div>
                                </div>

                                {/* Render Spider Web Radial Nodes */}
                                {computedNodes.filter(n => n.ring > 0).map((n) => (
                                    <div
                                        key={n.id}
                                        className="absolute z-20 transition-all transform hover:scale-110"
                                        style={{ left: n.x - 36, top: n.y - 36 }}
                                        onMouseEnter={() => setHoveredNode(n.id)}
                                        onMouseLeave={() => setHoveredNode(null)}
                                    >
                                        <div className={`w-18 h-18 w-[72px] h-[72px] rounded-2xl bg-slate-900 border-2 ${
                                            n.isIsolated ? 'border-slate-700 opacity-40' :
                                            hoveredNode === n.id ? 'border-white shadow-[0_0_20px_rgba(255,255,255,0.8)]' :
                                            n.status === 'critical' ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]' :
                                            n.status === 'high' ? 'border-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.4)]' :
                                            n.status === 'medium' ? 'border-amber-400' : 'border-emerald-500'
                                        } flex flex-col items-center justify-center p-1.5 relative bg-slate-900/90 backdrop-blur-md`}>
                                            <span className={`absolute -top-2 px-1.5 py-0.2 rounded text-[8px] font-black uppercase border ${statusBadgeColors[n.tier]}`}>
                                                {n.tier}
                                            </span>

                                            <Server size={16} className={
                                                n.isIsolated ? 'text-slate-600' :
                                                n.status === 'critical' ? 'text-red-400' :
                                                n.status === 'high' ? 'text-orange-400' :
                                                n.status === 'medium' ? 'text-amber-400' : 'text-emerald-400'
                                            } />

                                            <span className="text-[9px] font-bold text-slate-100 truncate w-full text-center mt-1 font-mono">
                                                {n.label}
                                            </span>

                                            {n.isIsolated && (
                                                <span className="text-[8px] font-black text-slate-500 uppercase">ISOLATED</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right (5 Cols): Priority Ranked Important Nodes List */}
                <div className="lg:col-span-5 bg-white/90 backdrop-blur-md border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                        <div>
                            <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                                <ShieldCheck className="text-blue-600" /> Important Nodes Priority Rank
                            </h2>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                                Ordered by Failure Probability & Business Impact
                            </p>
                        </div>

                        {/* Tier Filters */}
                        <div className="flex gap-1 bg-slate-100 p-1 rounded-full border border-slate-200">
                            {['ALL', 'P0', 'P1', 'P2'].map(tier => (
                                <button
                                    key={tier}
                                    onClick={() => setFilterTier(tier)}
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-all ${
                                        filterTier === tier ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'
                                    }`}
                                >
                                    {tier}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Node Priority List Items */}
                    <div className="space-y-3 flex-1 overflow-y-auto max-h-[500px] pr-1">
                        {filteredPriorityNodes.map((node, index) => {
                            const isIsolated = isolatedNodes.includes(node.id);
                            return (
                                <div
                                    key={node.id}
                                    onMouseEnter={() => setHoveredNode(node.id)}
                                    onMouseLeave={() => setHoveredNode(null)}
                                    className={`p-4 rounded-2xl border transition-all ${statusCardBorders[node.tier]} ${
                                        hoveredNode === node.id ? 'ring-2 ring-blue-500 shadow-md' : ''
                                    } ${isIsolated ? 'opacity-50 grayscale' : ''}`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2.5">
                                            <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-mono text-xs font-bold flex items-center justify-center">
                                                #{index + 1}
                                            </span>
                                            <div>
                                                <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                                    {node.name}
                                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${statusBadgeColors[node.tier]}`}>
                                                        {node.tier}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-slate-500 font-medium">{node.role}</div>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <div className="text-xs font-black text-slate-900 font-mono">
                                                Risk: <span className="text-red-600">{node.riskScore}/100</span>
                                            </div>
                                            <div className="text-[10px] font-bold text-slate-500">Prob: {node.prob}</div>
                                        </div>
                                    </div>

                                    {/* Metrics Row */}
                                    <div className="grid grid-cols-3 gap-2 mt-3 pt-2 border-t border-slate-200/60 text-xs font-mono">
                                        <div className="bg-white/80 p-2 rounded-xl border border-slate-200">
                                            <span className="text-[9px] text-slate-400 block font-bold uppercase">Cost Waste</span>
                                            <span className="font-bold text-slate-800">{node.costWaste}</span>
                                        </div>
                                        <div className="bg-white/80 p-2 rounded-xl border border-slate-200">
                                            <span className="text-[9px] text-slate-400 block font-bold uppercase">Latency Lag</span>
                                            <span className="font-bold text-amber-600">{node.latency}</span>
                                        </div>
                                        <div className="bg-white/80 p-2 rounded-xl border border-slate-200">
                                            <span className="text-[9px] text-slate-400 block font-bold uppercase">Action</span>
                                            <button
                                                onClick={() => toggleIsolate(node.id)}
                                                className={`w-full text-[9px] font-bold uppercase rounded py-0.5 transition-colors ${
                                                    isIsolated
                                                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                                                }`}
                                            >
                                                {isIsolated ? 'Reconnect' : 'Isolate'}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="mt-2 text-[11px] font-medium text-slate-600 flex items-center justify-between">
                                        <span>Impact: <strong className="text-slate-800">{node.impact}</strong></span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BlastRadius;
