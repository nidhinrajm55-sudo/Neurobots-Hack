import React, { useState } from 'react';
import {
    X, Sparkles, Send, MoreVertical, Monitor, Server, Database,
    Globe, Activity, AlertOctagon, Terminal, FileText, Settings,
    Cpu, Network, GitBranch, Layers, ArrowLeft, ChevronDown, CheckCircle2, ShieldAlert, Wrench, Trash2
} from 'lucide-react';
import { apiClient } from '../utils/api';

const ProblemDetail = ({ problem, onBack, onRemediate, onDismiss }) => {
    const [activeTab, setActiveTab] = useState('Overview');
    const [actionLoading, setActionLoading] = useState(false);
    const [actionMessage, setActionMessage] = useState(null);
    const tabs = ['Overview', 'Deployment', 'Events', 'Telemetry & ML', 'Troubleshooting'];

    const handleRemediate = async () => {
        setActionLoading(true);
        try {
            if (onRemediate) {
                await onRemediate(problem.id);
            } else {
                await apiClient.remediateProblem(problem.id);
            }
            setActionMessage({ type: 'success', text: 'Remediation action dispatched successfully.' });
        } catch (err) {
            setActionMessage({ type: 'error', text: 'Failed to dispatch remediation action.' });
        } finally {
            setActionLoading(false);
        }
    };

    const handleDismiss = async () => {
        setActionLoading(true);
        try {
            if (onDismiss) {
                await onDismiss(problem.id);
            } else {
                await apiClient.dismissProblem(problem.id);
            }
            setActionMessage({ type: 'info', text: 'Problem dismissed.' });
        } catch (err) {
            setActionMessage({ type: 'error', text: 'Failed to dismiss problem.' });
        } finally {
            setActionLoading(false);
        }
    };

    const severityColors = {
        critical: 'text-red-700 bg-red-50 border-red-200',
        high: 'text-orange-700 bg-orange-50 border-orange-200',
        medium: 'text-amber-700 bg-amber-50 border-amber-200',
        low: 'text-emerald-700 bg-emerald-50 border-emerald-200'
    };

    const serviceName = problem?.service || 'Target Service';
    const problemTitle = problem?.description || `Anomalous behavior on ${serviceName}`;
    const severity = problem?.severity || 'high';
    const status = problem?.status || 'ongoing';
    const startedTime = problem?.timestamp ? new Date(problem.timestamp).toLocaleString() : 'Just now';

    return (
        <div className="h-full flex flex-col space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-300 text-slate-900">
            {/* Header Section */}
            <div className="flex flex-col gap-4 bg-white/90 backdrop-blur-md border border-slate-200 rounded-3xl p-6 shadow-[0_10px_30px_-5px_rgba(100,116,139,0.1)]">
                <div className="flex justify-between items-start">
                    <div className="flex items-start gap-4">
                        <button
                            onClick={onBack}
                            className="p-2.5 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors border border-slate-200 bg-white"
                            aria-label="Back to problems"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div className="space-y-1">
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                                {problemTitle}
                            </h1>
                            <div className="flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-wider">
                                <span className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full border ${severityColors[severity] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                                    <AlertOctagon size={12} /> {severity} SEVERITY
                                </span>
                                <span className="font-mono text-slate-500">ID: #{problem?.id || 'PROB-101'}</span>
                                <span className="px-2.5 py-0.5 rounded-full border border-blue-200 bg-blue-50 text-blue-700 font-mono">
                                    Service: {serviceName}
                                </span>
                                <span className="text-slate-500">Started: {startedTime}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {status !== 'resolved' && status !== 'dismissed' && (
                            <button 
                                onClick={handleRemediate}
                                disabled={actionLoading}
                                className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/25 transition-all disabled:opacity-50"
                            >
                                <Wrench size={14} />
                                {actionLoading ? 'Remediating...' : 'Remediate Now'}
                            </button>
                        )}
                        <button 
                            onClick={handleDismiss}
                            disabled={actionLoading}
                            className="p-2.5 rounded-full border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors bg-white"
                            title="Dismiss Problem"
                        >
                            <Trash2 size={18} />
                        </button>
                        <button onClick={onBack} className="p-2.5 rounded-full border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors bg-white">
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {actionMessage && (
                    <div className={`p-3 rounded-2xl text-xs font-bold flex items-center justify-between ${
                        actionMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-slate-100 text-slate-800 border border-slate-200'
                    }`}>
                        <span>{actionMessage.text}</span>
                        <button onClick={() => setActionMessage(null)} className="text-slate-400 hover:text-slate-600"><X size={14} /></button>
                    </div>
                )}

                {/* Context Cards */}
                <div className="grid grid-cols-2 md:grid-cols-6 gap-3 pt-2">
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between h-20">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 truncate">Target Service</span>
                        <span className="text-sm font-black text-slate-900 font-mono">{serviceName}</span>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between h-20">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 truncate">Status</span>
                        <span className="text-sm font-black text-blue-600 uppercase">{status}</span>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between h-20">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 truncate">RF Confidence</span>
                        <span className="text-sm font-black text-slate-900">
                            {problem?.detail?.model?.rf_confidence ? `${(problem.detail.model.rf_confidence * 100).toFixed(0)}%` : '94%'}
                        </span>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between h-20">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 truncate">IF Anomaly Score</span>
                        <span className="text-sm font-black text-amber-600 font-mono">
                            {problem?.detail?.model?.if_score ? problem.detail.model.if_score.toFixed(3) : '-0.142'}
                        </span>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between h-20">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 truncate">Correlated Action</span>
                        <span className="text-sm font-black text-slate-900 font-mono">
                            #{problem?.detail?.linked_action_id || 'A-894'}
                        </span>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between h-20">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 truncate">Event Stream</span>
                        <span className="text-sm font-black text-emerald-600">Active</span>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-6 border-b border-slate-200 pt-2">
                    {tabs.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`pb-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
                                activeTab === tab
                                    ? 'text-blue-600 border-blue-600'
                                    : 'text-slate-500 border-transparent hover:text-slate-900'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 flex-1 min-h-[350px]">
                {/* Root Cause Impact Tree */}
                <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-3xl p-6 shadow-[0_10px_30px_-5px_rgba(100,116,139,0.1)] flex flex-col">
                    <h3 className="text-xs font-black text-slate-800 tracking-wider uppercase mb-4 flex items-center gap-2">
                        <GitBranch size={16} className="text-blue-600" /> Root Cause & Impact Graph
                    </h3>
                    <div className="flex-1 bg-slate-950 rounded-2xl p-6 border border-slate-800 flex flex-col items-center justify-center relative overflow-hidden font-mono text-xs">
                        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-50" />
                        
                        <div className="relative z-10 flex flex-col items-center gap-6 w-full max-w-sm">
                            {/* Root Node */}
                            <div className="w-full p-3 rounded-xl bg-red-950/80 border-2 border-red-500 text-red-200 flex items-center justify-between shadow-lg shadow-red-950">
                                <div className="flex items-center gap-2">
                                    <ShieldAlert size={18} className="text-red-400" />
                                    <div>
                                        <div className="font-bold">{serviceName}</div>
                                        <div className="text-[10px] text-red-400">Primary Incident Root</div>
                                    </div>
                                </div>
                                <span className="px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-bold">CRITICAL</span>
                            </div>

                            {/* Connecting Pulse Line */}
                            <div className="w-0.5 h-8 bg-gradient-to-b from-red-500 via-amber-500 to-emerald-500 relative">
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-red-400 animate-ping" />
                            </div>

                            {/* Impacted Downstream Nodes */}
                            <div className="grid grid-cols-2 gap-3 w-full">
                                <div className="p-2.5 rounded-lg bg-amber-950/60 border border-amber-500/50 text-amber-200 text-center">
                                    <div className="font-bold text-[11px]">auth-service</div>
                                    <div className="text-[9px] text-amber-400">High Latency (+140ms)</div>
                                </div>
                                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 text-center">
                                    <div className="font-bold text-[11px]">db-primary</div>
                                    <div className="text-[9px] text-emerald-400">Stable Pool</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Telemetry & Log Stream */}
                <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-3xl p-6 shadow-[0_10px_30px_-5px_rgba(100,116,139,0.1)] flex flex-col">
                    <h3 className="text-xs font-black text-slate-800 tracking-wider uppercase mb-4 flex items-center gap-2">
                        <Terminal size={16} className="text-blue-600" /> Real-time Telemetry & ML Insights
                    </h3>
                    <div className="space-y-3 font-mono text-xs text-slate-700 overflow-y-auto max-h-[320px] pr-1">
                        <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-red-800 flex items-start gap-3">
                            <AlertOctagon size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <div className="font-bold text-red-900">INCIDENT BREACH: {problemTitle}</div>
                                <div className="text-[11px] mt-1 text-red-700">
                                    CPU P95 spike detected at {startedTime}. Anomaly score -0.24 threshold exceeded.
                                </div>
                            </div>
                        </div>
                        
                        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-3">
                            <Activity size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <div className="font-bold text-slate-900">ML Model Diagnostics</div>
                                <div className="text-[11px] text-slate-600 mt-1">
                                    Random Forest Classifier: <span className="font-semibold text-slate-800">CRITICAL</span> | Isolation Forest: <span className="font-semibold text-amber-700">ANOMALY</span>
                                </div>
                            </div>
                        </div>

                        {problem?.detail?.correlated_change && (
                            <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl flex items-start gap-3">
                                <GitBranch size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <div className="font-bold text-blue-900">Correlated Code Deployment</div>
                                    <div className="text-[11px] text-blue-800 mt-1">
                                        Change <span className="font-mono font-bold">#{problem.detail.correlated_change.change_id}</span> ({problem.detail.correlated_change.type}) pushed right before spike.
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-start gap-3">
                            <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <div className="font-bold text-emerald-900">Auto-remediation Readiness</div>
                                <div className="text-[11px] text-emerald-800 mt-1">
                                    Sentinel-X AI agent has verified automated rollback script. Ready for single-click execution.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProblemDetail;
