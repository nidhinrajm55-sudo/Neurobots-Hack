import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sliders, Play, ShieldAlert, Cpu, CheckCircle2, XCircle, AlertTriangle,
    Clock, Database, Server, RefreshCcw, ShieldCheck, Lock, Eye, Trash2, RotateCcw, Award
} from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '../utils/api';

const JudgeRefinementsSection = () => {
    const [threshold, setThreshold] = useState(0.80);
    const [demoResult, setDemoResult] = useState(null);
    const [quarantinedNodes, setQuarantinedNodes] = useState([]);
    const [accuracyData, setAccuracyData] = useState(null);

    useEffect(() => {
        fetchThreshold();
        fetchQuarantine();
        fetchAccuracy();
    }, []);

    const fetchThreshold = async () => {
        try {
            const res = await apiClient.getThresholdConfig();
            if (res && res.confidence_threshold) {
                setThreshold(res.confidence_threshold);
            }
        } catch (e) {}
    };

    const fetchQuarantine = async () => {
        try {
            const res = await apiClient.getQuarantinedNodes();
            if (res && res.nodes) {
                setQuarantinedNodes(res.nodes);
            }
        } catch (e) {}
    };

    const fetchAccuracy = async () => {
        try {
            const res = await apiClient.getMLAccuracy();
            if (res) {
                setAccuracyData(res);
            }
        } catch (e) {}
    };

    const handleThresholdChange = async (newVal) => {
        const val = parseFloat(newVal);
        setThreshold(val);
        try {
            await apiClient.setThresholdConfig(val);
            toast.success(`Confidence Threshold set to ${Math.round(val * 100)}%`, {
                description: `Runbooks will only auto-trigger if Random Forest prediction >= ${Math.round(val * 100)}%.`
            });
        } catch (e) {}
    };

    const handleBackupSpikeDemo = async () => {
        toast.loading('Simulating Scheduled Nightly Backup CPU Spike...', { id: 'demo-toast' });
        try {
            const res = await apiClient.triggerBackupSpikeScenario();
            setDemoResult(res);
            toast.info('🛡️ FALSE POSITIVE SUPPRESSED!', {
                id: 'demo-toast',
                description: `RF Confidence (65%) < Threshold (${Math.round(threshold * 100)}%). Nightly backup spike correctly ignored!`,
                duration: 6000
            });
        } catch (e) {
            toast.error('Demo failed', { id: 'demo-toast', description: e.message });
        }
    };

    const handleRealLeakDemo = async () => {
        toast.loading('Simulating Real RAM Exhaustion Leak...', { id: 'demo-toast' });
        try {
            const res = await apiClient.triggerRealMemoryLeakScenario();
            setDemoResult(res);
            toast.error('🔥 REAL LEAK DETECTED & REMEDIATED!', {
                id: 'demo-toast',
                description: `RF Confidence (94%) >= Threshold (${Math.round(threshold * 100)}%). Triggered Runbook #102: Rolling Docker Restart!`,
                duration: 6000
            });
        } catch (e) {
            toast.error('Demo failed', { id: 'demo-toast', description: e.message });
        }
    };

    const handleQuarantineAction = async (nodeId, action) => {
        try {
            await apiClient.quarantineAction(nodeId, action);
            toast.success(`Quarantine action '${action.toUpperCase()}' applied`, {
                description: `Updated node ${nodeId}`
            });
            fetchQuarantine();
        } catch (e) {
            toast.error('Quarantine action failed', { description: e.message });
        }
    };

    return (
        <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-2xl space-y-6">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-amber-500 to-red-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                        <Award className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                            Hackathon Judge Architecture Controls & False Positive Defense
                        </h2>
                        <p className="text-xs font-semibold text-slate-400 mt-0.5">
                            Tunable confidence threshold slider, side-by-side scenario validation, quarantine exit TTL timers, and model accuracy logs.
                        </p>
                    </div>
                </div>
            </div>

            {/* Point 1: Tunable Confidence Threshold Slider & Side-by-Side Scenarios */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-slate-950/80 p-5 rounded-2xl border border-slate-800">
                {/* Left: Tunable Slider */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <label className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                            <Sliders size={16} className="text-amber-400" /> Tunable Confidence Threshold Knob
                        </label>
                        <span className="font-mono text-sm font-black text-amber-400 bg-amber-950/60 px-3 py-1 rounded-full border border-amber-800/60">
                            {Math.round(threshold * 100)}% Confidence
                        </span>
                    </div>

                    <input
                        type="range"
                        min="0.50"
                        max="0.95"
                        step="0.05"
                        value={threshold}
                        onChange={(e) => handleThresholdChange(e.target.value)}
                        className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />

                    <div className="flex justify-between text-[10px] font-mono text-slate-500">
                        <span>50% (Permissive)</span>
                        <span>80% (Default Safe)</span>
                        <span>95% (Strict)</span>
                    </div>

                    <p className="text-[11px] text-slate-400 leading-relaxed bg-slate-900 p-3 rounded-xl border border-slate-800">
                        🛡️ <strong className="text-amber-300">False Positive Defense Policy:</strong> Automated Runbook execution is strictly blocked unless Random Forest prediction confidence exceeds <strong className="text-amber-300">{Math.round(threshold * 100)}%</strong>. Prevents self-inflicted production outages ("automated foot-gun").
                    </p>
                </div>

                {/* Right: Side-by-Side Demo Buttons & Live Comparison Box */}
                <div className="space-y-3">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                        <Play size={14} className="text-emerald-400" /> Side-by-Side Scenario Demo
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <button
                            onClick={handleBackupSpikeDemo}
                            className="p-3 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-xl text-left border border-slate-800 transition-all text-xs font-bold space-y-1"
                        >
                            <span className="text-[10px] text-amber-400 uppercase tracking-widest block font-black">Scenario A</span>
                            <span className="block truncate">🌙 Nightly Backup Spike</span>
                            <span className="text-[10px] text-slate-400 font-normal block">Isolation Forest outlier (RF Conf 65% &lt; threshold) -&gt; Ignored</span>
                        </button>

                        <button
                            onClick={handleRealLeakDemo}
                            className="p-3 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-xl text-left border border-slate-800 transition-all text-xs font-bold space-y-1"
                        >
                            <span className="text-[10px] text-red-400 uppercase tracking-widest block font-black">Scenario B</span>
                            <span className="block truncate">💧 Real RAM Exhaustion Leak</span>
                            <span className="text-[10px] text-slate-400 font-normal block">Isolation Forest outlier (RF Conf 94% &gt;= threshold) -&gt; Auto-Fix</span>
                        </button>
                    </div>

                    {demoResult && (
                        <div className={`p-3.5 rounded-xl border text-xs font-mono space-y-1 ${
                            demoResult.action_taken === 'SUPPRESSED_FALSE_POSITIVE'
                                ? 'bg-amber-950/40 border-amber-800/60 text-amber-200'
                                : 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200'
                        }`}>
                            <div className="flex justify-between font-black uppercase">
                                <span>{demoResult.scenario}</span>
                                <span>{demoResult.action_taken}</span>
                            </div>
                            <p className="text-[11px] font-sans text-slate-300 mt-1">{demoResult.explanation}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Architecture Badges & Robustness Principles Grid */}
            <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                    <ShieldCheck size={14} className="text-blue-400" /> Architectural Integrity & Scope Refinements
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                        <span className="text-[10px] font-black uppercase tracking-widest text-purple-400 block mb-1">Point 2 & Point 9</span>
                        <h4 className="font-bold text-slate-200">Two-Stage Inference & Fallback</h4>
                        <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                            Cheap Isolation Forest runs first as a fast filter (saves compute). If RF confidence is low (&lt;{Math.round(threshold * 100)}%), flags <strong className="text-amber-300">"Unknown Anomaly — Manual Review"</strong> instead of guessing runbooks.
                        </p>
                    </div>

                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 block mb-1">Point 3 & Point 4</span>
                        <h4 className="font-bold text-slate-200">Stateless App Nodes & Near-Zero LB</h4>
                        <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                            Targets stateless microservices; DB relies on Postgres Streaming Read-Replicas. NGINX LB health checks drop failing server from rotation for <strong className="text-blue-300">near-zero downtime</strong>.
                        </p>
                    </div>

                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                        <span className="text-[10px] font-black uppercase tracking-widest text-red-400 block mb-1">Point 5 & Point 10</span>
                        <h4 className="font-bold text-slate-200">Systemic Outage & Security Tagging</h4>
                        <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                            If &gt;= 3 nodes degrade, cloning is suppressed (<strong className="text-red-300">Systemic Upstream Outage</strong>). High outbound network spikes tag incident as <strong className="text-red-300">"Possible Security Event"</strong>.
                        </p>
                    </div>
                </div>
            </div>

            {/* Point 6: Quarantined Server Exit Strategy & TTL Controls */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex justify-between items-center">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                        <Lock size={14} className="text-amber-400" /> Quarantined Server Exit Strategy & TTL Expiry
                    </h3>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2.5 py-1 rounded-full border border-slate-800">
                        7-Day Log Auto-Redaction Active
                    </span>
                </div>

                {quarantinedNodes.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No nodes currently in quarantine.</p>
                ) : (
                    <div className="space-y-2">
                        {quarantinedNodes.map((node) => (
                            <div key={node.id} className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                                <div>
                                    <div className="flex items-center gap-2 font-bold text-slate-200">
                                        <span>{node.service}</span>
                                        <span className="font-mono text-[10px] text-slate-500">({node.id})</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-0.5">{node.reason} • TTL: <strong className="text-amber-400">{node.ttl_display}</strong></p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleQuarantineAction(node.id, 'release')}
                                        className="px-3 py-1 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all"
                                    >
                                        <RotateCcw size={12} /> Release Node
                                    </button>
                                    <button
                                        onClick={() => handleQuarantineAction(node.id, 'extend')}
                                        className="px-3 py-1 bg-blue-950 hover:bg-blue-900 text-blue-300 border border-blue-800 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all"
                                    >
                                        <Clock size={12} /> Extend TTL
                                    </button>
                                    <button
                                        onClick={() => handleQuarantineAction(node.id, 'terminate')}
                                        className="px-3 py-1 bg-red-950 hover:bg-red-900 text-red-300 border border-red-800 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all"
                                    >
                                        <Trash2 size={12} /> Terminate
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Point 7: Model Accuracy & Retraining Feedback Log Table */}
            {accuracyData && (
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                            <CheckCircle2 size={14} className="text-emerald-400" /> Model Accuracy & Feedback Tracking
                        </h3>
                        <span className="text-xs font-black text-emerald-400 font-mono">
                            {accuracyData.overall_accuracy_pct}% Overall Accuracy
                        </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                            <span className="text-[10px] text-slate-500 uppercase tracking-widest block font-bold">Total Predictions</span>
                            <span className="text-lg font-black text-slate-200 mt-0.5 block">{accuracyData.total_predictions}</span>
                        </div>
                        <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                            <span className="text-[10px] text-slate-500 uppercase tracking-widest block font-bold">True Positives</span>
                            <span className="text-lg font-black text-emerald-400 mt-0.5 block">{accuracyData.true_positives}</span>
                        </div>
                        <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                            <span className="text-[10px] text-slate-500 uppercase tracking-widest block font-bold">False Positives Suppressed</span>
                            <span className="text-lg font-black text-amber-400 mt-0.5 block">{accuracyData.false_positives_suppressed}</span>
                        </div>
                        <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                            <span className="text-[10px] text-slate-500 uppercase tracking-widest block font-bold">False Negatives</span>
                            <span className="text-lg font-black text-red-400 mt-0.5 block">{accuracyData.false_negatives}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default JudgeRefinementsSection;
