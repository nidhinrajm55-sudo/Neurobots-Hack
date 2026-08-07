import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity, AlertTriangle, CheckCircle2, GitBranch, Layers, Server,
    Zap, TrendingUp, DollarSign, Database, Lock, Globe
} from 'lucide-react';
import { getBlastRadiusData } from '../utils/dataProvider';

const BlastRadius = () => {
    const activeScenario = getBlastRadiusData();
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [showResults, setShowResults] = useState(false);

    const handleSimulate = () => {
        setIsAnalyzing(true);
        setShowResults(false);
        setTimeout(() => {
            setIsAnalyzing(false);
            setShowResults(true);
        }, 2000);
    };

    return (
        <div className="h-full w-full p-2 overflow-hidden flex flex-col gap-5 text-slate-900">
            {/* Header */}
            <div className="flex-shrink-0">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                    Predictive Blast Radius
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 text-xs font-bold uppercase tracking-wider">
                        Gold Feature
                    </span>
                </h1>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
                    Select a detected change event to simulate its downstream impact before it goes live.
                </p>
            </div>

            <div className="flex-1 flex flex-col gap-6 min-h-0">
                {/* Top Action Bar */}
                <div className="bg-white/80 backdrop-blur-md border border-white/90 rounded-3xl p-5 shadow-[0_10px_30px_-5px_rgba(100,116,139,0.1)] flex justify-between items-center">
                    <div>
                        <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                            Simulating Service: <span className="text-blue-600 font-black">{activeScenario.service}</span>
                            <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full font-bold">{activeScenario.version}</span>
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">{activeScenario.description}</p>
                    </div>
                    {!showResults && !isAnalyzing && (
                        <button
                            onClick={handleSimulate}
                            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-bold uppercase tracking-wider shadow-md shadow-blue-500/25 transition-all flex items-center gap-2 animate-pulse"
                        >
                            <Zap size={14} />
                            Run Prediction
                        </button>
                    )}
                    {showResults && (
                        <button
                            onClick={handleSimulate}
                            className="px-4 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-full text-xs font-bold uppercase tracking-wider transition-all"
                        >
                            Re-run
                        </button>
                    )}
                </div>

                <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
                    {/* Graph Map */}
                    <div className="lg:col-span-2 bg-slate-900 rounded-3xl border border-slate-700/60 relative overflow-hidden flex flex-col shadow-xl">
                        <div className="p-4 border-b border-slate-800 bg-slate-950/60 backdrop-blur-sm z-10 flex justify-between items-center">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <GitBranch size={14} /> Dependency Impact Map
                            </h3>
                        </div>

                        <div className="flex-1 relative flex items-center justify-center overflow-hidden">
                            <AnimatePresence mode="wait">
                                {isAnalyzing ? (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="flex flex-col items-center gap-4 text-center z-20"
                                    >
                                        <div className="relative">
                                            <div className="w-14 h-14 rounded-full border-4 border-blue-500/30 border-t-blue-500 animate-spin" />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <Server size={20} className="text-blue-500 animate-pulse" />
                                            </div>
                                        </div>
                                        <div className="text-xs text-slate-400 font-mono">Simulating propagation...</div>
                                    </motion.div>
                                ) : (
                                    <div className="relative w-full h-full flex items-center justify-center pointer-events-none">
                                        <svg className="absolute inset-0 w-full h-full overflow-visible z-0">
                                            <defs>
                                                <linearGradient id="riskGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                                    <stop offset="0%" style={{ stopColor: '#2563eb', stopOpacity: 0.5 }} />
                                                    <stop offset="100%" style={{ stopColor: '#ef4444', stopOpacity: 0.8 }} />
                                                </linearGradient>
                                                <linearGradient id="warnGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                                    <stop offset="0%" style={{ stopColor: '#2563eb', stopOpacity: 0.5 }} />
                                                    <stop offset="100%" style={{ stopColor: '#f59e0b', stopOpacity: 0.8 }} />
                                                </linearGradient>
                                            </defs>

                                            {activeScenario.graph.paths.map((path, i) => (
                                                <motion.path
                                                    key={`path-${activeScenario.id}-${i}`}
                                                    d={path.d}
                                                    fill="none"
                                                    stroke={
                                                        showResults
                                                            ? (path.stroke === 'risk' ? "url(#riskGrad)" : path.stroke === 'warning' ? "url(#warnGrad)" : "#10b981")
                                                            : "#334155"
                                                    }
                                                    strokeWidth={path.stroke === 'safe' ? 2 : 3}
                                                    strokeDasharray={path.stroke === 'safe' ? "0" : "5,5"}
                                                    initial={{ pathLength: 0 }}
                                                    animate={{ pathLength: 1 }}
                                                    transition={{ duration: 1 }}
                                                />
                                            ))}
                                        </svg>

                                        {activeScenario.graph.nodes.map((node, i) => (
                                            <motion.div
                                                key={`node-${activeScenario.id}-${i}`}
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: i * 0.1 }}
                                                className="absolute z-10 flex flex-col items-center gap-2"
                                                style={{ left: node.x, top: node.y }}
                                            >
                                                <div className={`w-20 h-20 rounded-2xl bg-slate-800 border-2 flex flex-col items-center justify-center relative transition-all ${
                                                    !showResults ? 'border-slate-600' :
                                                    (node.status === 'risk' ? 'border-red-500 shadow-red-900/50' :
                                                    node.status === 'warning' ? 'border-amber-500 shadow-amber-900/50' :
                                                    node.status === 'deploying' ? 'border-blue-500' : 'border-emerald-500/50')
                                                }`}>
                                                    {node.status === 'deploying' && (
                                                        <div className="absolute -top-2.5 px-2 py-0.5 rounded-full bg-blue-600 text-white text-[9px] font-bold uppercase">
                                                            Target
                                                        </div>
                                                    )}
                                                    <Server size={22} className={
                                                        !showResults ? "text-slate-400" :
                                                        (node.status === 'risk' ? "text-red-400" :
                                                        node.status === 'warning' ? "text-amber-400" :
                                                        node.status === 'deploying' ? "text-blue-400" : "text-emerald-400")
                                                    } />
                                                    <span className="text-[10px] font-bold text-white mt-1">{node.label}</span>
                                                    <span className="text-[9px] font-mono text-slate-400">{node.sub}</span>

                                                    {showResults && node.risk && (
                                                        <div className={`absolute -bottom-3 px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                                            node.status === 'risk' ? 'bg-red-600 text-white' : 'bg-amber-500 text-black'
                                                        }`}>
                                                            {node.risk}
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Insights Card */}
                    <div className="bg-white/80 backdrop-blur-md border border-white/90 rounded-3xl p-5 shadow-[0_10px_30px_-5px_rgba(100,116,139,0.1)] flex flex-col overflow-hidden">
                        <div className="pb-3 border-b border-slate-100">
                            <h2 className="font-black text-slate-800 text-sm tracking-wider uppercase">Impact Assessment</h2>
                        </div>

                        <div className="py-4 flex-1 overflow-y-auto space-y-4">
                            {!showResults ? (
                                <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 gap-2">
                                    <TrendingUp size={32} />
                                    <p className="text-xs font-bold uppercase tracking-wider">Awaiting Analysis...</p>
                                </div>
                            ) : (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                                    {/* Reliability */}
                                    <div>
                                        <h3 className="text-[10px] uppercase tracking-wider text-slate-500 font-bold flex items-center gap-1 mb-1">
                                            <TrendingUp size={12} /> Reliability
                                        </h3>
                                        <div className={`border rounded-2xl p-3 ${
                                            activeScenario.riskLevel === 'Low' ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'
                                        }`}>
                                            <div className="flex justify-between items-start mb-1">
                                                <span className={`font-bold text-xs ${activeScenario.riskLevel === 'Low' ? 'text-emerald-700' : 'text-red-700'}`}>
                                                    {activeScenario.insights.reliability.title}
                                                </span>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                    activeScenario.riskLevel === 'Low' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
                                                }`}>
                                                    {activeScenario.insights.reliability.prob}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-600">
                                                {activeScenario.insights.reliability.desc}
                                            </p>
                                        </div>
                                    </div>

                                    {/* FinOps */}
                                    <div>
                                        <h3 className="text-[10px] uppercase tracking-wider text-slate-500 font-bold flex items-center gap-1 mb-1">
                                            <DollarSign size={12} /> FinOps Projection
                                        </h3>
                                        <div className="border border-slate-200 rounded-2xl p-3 bg-slate-50">
                                            <div className="flex items-baseline justify-between">
                                                <span className="text-xs font-bold text-slate-500">Waste/Mo</span>
                                                <span className={`text-lg font-black ${activeScenario.riskLevel === 'Low' ? 'text-emerald-600' : 'text-amber-600'}`}>
                                                    {activeScenario.insights.finops.waste}
                                                </span>
                                            </div>
                                            <div className="text-[10px] text-slate-500 font-medium mt-1">
                                                {activeScenario.insights.finops.cause}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="pt-3 border-t border-slate-100">
                                        <p className="text-xs text-slate-700 mb-3 font-bold">
                                            AI Recommends: <span className="font-normal text-slate-600">{activeScenario.insights.recommendation}</span>
                                        </p>
                                        {activeScenario.riskLevel === 'Low' ? (
                                            <button className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-md shadow-emerald-500/25">
                                                Proceed to Deploy
                                            </button>
                                        ) : (
                                            <button className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-md shadow-red-500/25">
                                                Abort & Rollback
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BlastRadius;
