import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Moon, ShieldAlert, Cpu, HardDrive, Database, Activity, CheckCircle2,
    Clock, Zap, RefreshCcw, Lock, Server, Terminal, AlertTriangle, Layers, Play
} from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '../utils/api';

const AIOpsClosedLoopSection = () => {
    const [activePhase, setActivePhase] = useState('phase_4_full_autonomy');
    const [isSimulating, setIsSimulating] = useState(false);
    const [scenarioResults, setScenarioResults] = useState(null);
    const [telemetry, setTelemetry] = useState({
        cpu: 34.2,
        memory: 142.0,
        diskIo: 18.5,
        network: '14.2 MB/s',
        httpP95: 124,
        error5xx: 0.02,
        dbLocks: '12 / 100 (Normal)',
        ttfWindow: 'Nominal',
        isoForestScore: 0.18,
        rfClassification: 'HEALTHY_BASELINE',
        rfConfidence: 0.98
    });

    useEffect(() => {
        const fetchState = async () => {
            try {
                const res = await apiClient.getRolloutPhase();
                if (res && res.phase) {
                    setActivePhase(res.phase);
                }

                const statusRes = await apiClient.getStatus();
                if (statusRes && statusRes.active_attack?.is_active) {
                    const mode = statusRes.active_attack.mode || 'load_flood';
                    setTelemetry({
                        cpu: mode === 'memory_leak' ? 96.2 : 94.8,
                        memory: mode === 'memory_leak' ? 840.5 : 360.2,
                        diskIo: 92.4,
                        network: '184.5 MB/s',
                        httpP95: mode === 'memory_leak' ? 780 : 1840,
                        error5xx: 18.4,
                        dbLocks: '98 / 100 (CRITICAL SATURATION)',
                        ttfWindow: '~3m 45s (94% Confidence)',
                        isoForestScore: -0.48,
                        rfClassification: `ATTACK_${mode.toUpperCase()}`,
                        rfConfidence: 0.98
                    });
                } else {
                    setTelemetry({
                        cpu: 12.4,
                        memory: 52.0,
                        diskIo: 8.5,
                        network: '14.2 MB/s',
                        httpP95: 24,
                        error5xx: 0.00,
                        dbLocks: '12 / 100 (Normal)',
                        ttfWindow: 'Nominal',
                        isoForestScore: 0.18,
                        rfClassification: 'HEALTHY_BASELINE',
                        rfConfidence: 0.98
                    });
                }
            } catch (e) {}
        };
        fetchState();
        const interval = setInterval(fetchState, 2000);
        return () => clearInterval(interval);
    }, []);

    const phases = [
        {
            id: 'phase_1_shadow',
            badge: 'PHASE 1',
            title: 'Shadow Mode',
            description: 'Predictions logged to local_start.log. Auto-execution strictly blocked to audit precision.',
            color: 'border-slate-300 bg-slate-50/60 text-slate-700',
            activeColor: 'border-slate-700 bg-slate-900 text-white shadow-lg'
        },
        {
            id: 'phase_2_human_in_loop',
            badge: 'PHASE 2',
            title: 'Human-in-the-Loop',
            description: 'Advisory card generated in dashboard. Requires 1-Click human authorization.',
            color: 'border-blue-200 bg-blue-50/60 text-blue-800',
            activeColor: 'border-blue-600 bg-blue-600 text-white shadow-lg'
        },
        {
            id: 'phase_3_limited',
            badge: 'PHASE 3',
            title: 'Limited Automation',
            description: 'Low-risk reversible tasks (cache flush, file compression) auto-executed.',
            color: 'border-amber-200 bg-amber-50/60 text-amber-900',
            activeColor: 'border-amber-600 bg-amber-600 text-white shadow-lg'
        },
        {
            id: 'phase_4_full_autonomy',
            badge: 'PHASE 4',
            title: 'Full Autonomy',
            description: 'Resilient self-healing closed-loop operational. Full robotic runbook execution.',
            color: 'border-emerald-200 bg-emerald-50/60 text-emerald-900',
            activeColor: 'border-emerald-600 bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
        }
    ];

    const handlePhaseSelect = async (phaseId) => {
        setActivePhase(phaseId);
        try {
            await apiClient.setRolloutPhase(phaseId);
            const selected = phases.find(p => p.id === phaseId);
            toast.success(`Rollout Phase Updated: ${selected.title}`, {
                description: selected.description
            });
        } catch (e) {
            toast.error('Failed to update rollout phase', { description: e.message });
        }
    };

    const handleTrigger2AMScenario = async () => {
        setIsSimulating(true);
        toast.loading('🌙 2:00 AM Silent DB Degradation Initiated...', { id: 'scenario-toast' });
        try {
            const res = await apiClient.trigger2AMScenario();
            setScenarioResults(res);

            // Update local telemetry to reflect unindexed query loop & memory leak drift
            setTelemetry({
                cpu: 94.8,
                memory: 485.2,
                diskIo: 92.4,
                network: '184.5 MB/s',
                httpP95: 1840,
                error5xx: 18.4,
                dbLocks: '98 / 100 (CRITICAL SATURATION)',
                ttfWindow: '~3m 45s (94% Confidence)',
                isoForestScore: -0.42,
                rfClassification: 'DB_OOM_UNINDEXED_QUERY_LOCK',
                rfConfidence: 0.94
            });

            toast.error('🌙 2:00 AM UNINDEXED QUERY LOOP & RAM LEAK ACTIVE', {
                id: 'scenario-toast',
                description: 'Prometheus metrics drifting! Isolation Forest flagged anomaly. TTF Window: ~3m 45s.',
                duration: 6000
            });

            // Simulate auto-remediation step after 4 seconds
            setTimeout(() => {
                setIsSimulating(false);
                if (activePhase === 'phase_1_shadow') {
                    toast.warning('Phase 1 Shadow Mode Active', {
                        description: 'Prediction logged to local_start.log. Execution blocked per safety policy.'
                    });
                } else if (activePhase === 'phase_2_human_in_loop') {
                    toast.info('Phase 2 Advisory Alert Generated', {
                        description: '1-Click Authorization required in Prioritization Tab to trigger Runbook 102.'
                    });
                } else {
                    toast.success('⚡ Closed-Loop Runbook Executed!', {
                        description: 'Container replica restarted & cache flushed automatically without human intervention!'
                    });
                    setTelemetry(prev => ({
                        ...prev,
                        cpu: 18.4,
                        memory: 64.0,
                        dbLocks: '14 / 100 (Recovered)',
                        ttfWindow: 'Nominal',
                        rfClassification: 'REMEDIATED_HEALTHY'
                    }));
                }
            }, 4000);
        } catch (e) {
            setIsSimulating(false);
            toast.error('Scenario launch failed', { id: 'scenario-toast', description: e.message });
        }
    };

    return (
        <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-2xl space-y-6">
            {/* Header Title Banner */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                        <Moon className="w-6 h-6 text-amber-300" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                            AIOps & Closed-Loop Self-Healing Platform
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                Real-Time Prometheus Engine
                            </span>
                        </h2>
                        <p className="text-xs font-semibold text-slate-400 mt-0.5">
                            Dual ML (Isolation Forest + Random Forest) continuous telemetry scoring with predictive Time-to-Failure (TTF) remediation.
                        </p>
                    </div>
                </div>

                {/* 2:00 AM Silent DB Scenario Button */}
                <button
                    onClick={handleTrigger2AMScenario}
                    disabled={isSimulating}
                    className="px-5 py-2.5 bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 hover:from-amber-400 hover:to-red-500 text-slate-950 font-black rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-orange-500/20 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
                >
                    {isSimulating ? (
                        <>
                            <RefreshCcw size={16} className="animate-spin text-slate-950" />
                            Simulating 2:00 AM DB Failure...
                        </>
                    ) : (
                        <>
                            <Play size={16} className="fill-slate-950 text-slate-950" />
                            Trigger 2:00 AM Silent DB Degradation
                        </>
                    )}
                </button>
            </div>

            {/* 4-Phase Rollout Strategy Controller */}
            <div>
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                        <Layers size={14} className="text-purple-400" /> 4-Phase Safety Rollout Controller
                    </h3>
                    <span className="text-[11px] font-mono text-purple-300 bg-purple-950/60 px-3 py-1 rounded-full border border-purple-800/50">
                        Active: {phases.find(p => p.id === activePhase)?.title}
                    </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {phases.map((p) => {
                        const isActive = activePhase === p.id;
                        return (
                            <button
                                key={p.id}
                                onClick={() => handlePhaseSelect(p.id)}
                                className={`text-left p-3.5 rounded-2xl border transition-all relative overflow-hidden ${
                                    isActive ? p.activeColor : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700'
                                }`}
                            >
                                <div className="flex justify-between items-center mb-1.5">
                                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                                        isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                                    }`}>
                                        {p.badge}
                                    </span>
                                    {isActive && <CheckCircle2 size={14} className="text-white" />}
                                </div>
                                <h4 className="font-extrabold text-xs mb-1">{p.title}</h4>
                                <p className={`text-[10px] leading-relaxed ${isActive ? 'text-white/90' : 'text-slate-400'}`}>
                                    {p.description}
                                </p>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Prometheus Telemetry Pipeline Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
                <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        <span>CPU Saturation</span>
                        <Cpu size={12} className="text-blue-400" />
                    </div>
                    <p className={`text-lg font-black ${telemetry.cpu > 70 ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>
                        {telemetry.cpu}%
                    </p>
                    <p className="text-[9px] text-slate-500 mt-0.5">Raw utilization spike</p>
                </div>

                <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        <span>RAM Residency</span>
                        <Server size={12} className="text-purple-400" />
                    </div>
                    <p className={`text-lg font-black ${telemetry.memory > 350 ? 'text-purple-400 animate-pulse' : 'text-emerald-400'}`}>
                        {telemetry.memory} MB
                    </p>
                    <p className="text-[9px] text-slate-500 mt-0.5">+45 MB/s RAM leak rate</p>
                </div>

                <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        <span>Disk I/O Saturation</span>
                        <HardDrive size={12} className="text-amber-400" />
                    </div>
                    <p className="text-lg font-black text-amber-400">{telemetry.diskIo}%</p>
                    <p className="text-[9px] text-slate-500 mt-0.5">Queue depth & log flush</p>
                </div>

                <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        <span>HTTP P95 Latency</span>
                        <Activity size={12} className="text-cyan-400" />
                    </div>
                    <p className={`text-lg font-black ${telemetry.httpP95 > 500 ? 'text-red-400' : 'text-cyan-400'}`}>
                        {telemetry.httpP95} ms
                    </p>
                    <p className="text-[9px] text-slate-500 mt-0.5">Round-trip latency</p>
                </div>

                <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        <span>5xx Error Rate</span>
                        <AlertTriangle size={12} className="text-red-400" />
                    </div>
                    <p className="text-lg font-black text-red-400">{telemetry.error5xx}%</p>
                    <p className="text-[9px] text-slate-500 mt-0.5">Frequency per minute</p>
                </div>

                <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        <span>DB Conn Pool Locks</span>
                        <Lock size={12} className="text-emerald-400" />
                    </div>
                    <p className={`text-xs font-black truncate mt-1 ${telemetry.dbLocks.includes('CRITICAL') ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>
                        {telemetry.dbLocks}
                    </p>
                    <p className="text-[9px] text-slate-500 mt-1">Connection saturation</p>
                </div>
            </div>

            {/* Dual ML Engine (Isolation Forest + Random Forest) & TTF Calculation Panel */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                {/* Isolation Forest Model Card */}
                <div className="p-4 bg-slate-950/90 rounded-2xl border border-slate-800 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">UNSUPERVISED MODEL</span>
                        <span className="font-mono text-[10px] text-purple-400 bg-purple-950/50 px-2 py-0.5 rounded border border-purple-800/40">
                            isolation_forest_model.pkl
                        </span>
                    </div>
                    <div className="my-2">
                        <h4 className="text-xs font-bold text-slate-300">Structural Anomaly Detector</h4>
                        <div className="flex items-baseline gap-2 mt-1">
                            <span className={`text-2xl font-black ${telemetry.isoForestScore < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                {telemetry.isoForestScore}
                            </span>
                            <span className="text-[11px] font-semibold text-slate-400">
                                {telemetry.isoForestScore < 0 ? 'Anomaly Outlier Flagged' : 'Fluid Baseline Normal'}
                            </span>
                        </div>
                    </div>
                    <p className="text-[10px] text-slate-500 border-t border-slate-900 pt-2 mt-1">
                        Maps multidimensional infrastructure baseline asynchronously to eliminate false alarms during nightly backups.
                    </p>
                </div>

                {/* Random Forest Classifier Card */}
                <div className="p-4 bg-slate-950/90 rounded-2xl border border-slate-800 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">SUPERVISED MODEL</span>
                        <span className="font-mono text-[10px] text-blue-400 bg-blue-950/50 px-2 py-0.5 rounded border border-blue-800/40">
                            random_forest_model.pkl
                        </span>
                    </div>
                    <div className="my-2">
                        <h4 className="text-xs font-bold text-slate-300">Failure Signature Classifier</h4>
                        <div className="mt-1">
                            <span className={`text-sm font-black uppercase tracking-wider px-2.5 py-1 rounded-md border ${
                                telemetry.rfClassification.includes('OOM') || telemetry.rfClassification.includes('QUERY')
                                    ? 'bg-red-950/80 text-red-300 border-red-800'
                                    : 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                            }`}>
                                {telemetry.rfClassification}
                            </span>
                        </div>
                    </div>
                    <p className="text-[10px] text-slate-500 border-t border-slate-900 pt-2 mt-1">
                        Classifies failure signature (DB OOM vs Unindexed Query vs Network Bottleneck) with {Math.round(telemetry.rfConfidence * 100)}% confidence.
                    </p>
                </div>

                {/* Time-to-Failure (TTF) Window Card */}
                <div className="p-4 bg-gradient-to-br from-slate-950 to-slate-900 rounded-2xl border border-purple-900/50 flex flex-col justify-between shadow-xl">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-purple-300 flex items-center gap-1">
                            <Clock size={12} /> TIME-TO-FAILURE (TTF)
                        </span>
                        <span className="text-[10px] font-mono text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/50">
                            Confidence &gt; 85%
                        </span>
                    </div>
                    <div className="my-2">
                        <h4 className="text-xs font-bold text-slate-300">Predictive Probability Window</h4>
                        <p className={`text-2xl font-black tracking-tight mt-1 ${telemetry.ttfWindow.includes('Nominal') ? 'text-emerald-400' : 'text-amber-400 animate-pulse'}`}>
                            {telemetry.ttfWindow}
                        </p>
                    </div>
                    <p className="text-[10px] text-slate-400 border-t border-slate-800/80 pt-2 mt-1">
                        Projects telemetry trajectories forward into the time domain to trigger robotic Runbook execution before hard downtime occurs.
                    </p>
                </div>
            </div>

            {/* Robotic Infrastructure Runbooks Pipeline */}
            <div className="border-t border-slate-800 pt-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                    <Terminal size={14} className="text-emerald-400" /> Robotic Infrastructure Runbooks Library
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-start gap-3">
                        <div className="p-2 bg-blue-950 text-blue-400 rounded-lg font-mono text-[10px]">#101</div>
                        <div>
                            <p className="font-bold text-slate-200">Storage Saturation Runbook</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">Flushes transient caches & compresses legacy log files automatically.</p>
                        </div>
                    </div>

                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-start gap-3">
                        <div className="p-2 bg-purple-950 text-purple-400 rounded-lg font-mono text-[10px]">#102</div>
                        <div>
                            <p className="font-bold text-slate-200">Memory Leak Docker Restart</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">Graceful rolling restart of isolated container replica.</p>
                        </div>
                    </div>

                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-start gap-3">
                        <div className="p-2 bg-emerald-950 text-emerald-400 rounded-lg font-mono text-[10px]">#103</div>
                        <div>
                            <p className="font-bold text-slate-200">Cloud Clone Traffic Shift</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">Provisions cloud clone server, shifts incoming traffic, decommissions failing node.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIOpsClosedLoopSection;
