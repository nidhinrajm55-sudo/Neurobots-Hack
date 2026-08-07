import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, AlertTriangle, CheckCircle2, GitBranch, Layers, Server, Zap, TrendingUp, DollarSign, X } from 'lucide-react';

const BlastRadiusColumn = ({ isOpen, onClose, scenarioData }) => {
    const defaultData = {
        id: 'change-default',
        service: 'Payment Service',
        type: 'Deployment',
        version: 'v2.4.0',
        riskLevel: 'Critical',
        description: 'Major refactor of transaction processing logic.',
        graph: {
            nodes: [
                { id: '1', label: 'Payment', sub: 'v2.4.0', type: 'origin', x: 50, y: 140, status: 'deploying' },
                { id: '2', label: 'Checkout', sub: 'Critical', type: 'target', x: 250, y: 60, status: 'risk', risk: '92% Fail' },
                { id: '3', label: 'Analytics', sub: 'High Load', type: 'target', x: 250, y: 220, status: 'warning', risk: 'Latency' },
            ],
            paths: [
                { d: "M 120 180 C 180 180, 180 100, 250 100", stroke: 'risk' },
                { d: "M 120 180 C 180 180, 180 260, 250 260", stroke: 'warning' }
            ]
        },
        insights: {
            reliability: {
                title: 'Checkout Service Outage',
                prob: '92% Prob',
                desc: 'Memory leak detected in core loop.'
            },
            finops: {
                waste: '$1,247.00',
                cause: 'Unoptimized SQL queries.'
            },
            recommendation: 'Abort deployment.'
        }
    };

    const data = { ...defaultData, ...scenarioData };
    const [isAnalyzing, setIsAnalyzing] = useState(true);

    useEffect(() => {
        if (isOpen) {
            setIsAnalyzing(true);
            const timer = setTimeout(() => {
                setIsAnalyzing(false);
            }, 1200);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white border border-white/90 rounded-3xl w-full max-w-4xl h-[580px] flex flex-col overflow-hidden shadow-2xl relative text-slate-900"
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-50 p-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                >
                    <X size={18} />
                </button>

                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-2xl bg-blue-100 text-blue-600">
                            <Server size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 tracking-tight">Impact Analysis: {data.service}</h2>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-0.5">{data.description}</p>
                        </div>
                    </div>
                </div>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 min-h-0">
                    {/* Left: Graph Canvas */}
                    <div className="md:col-span-2 bg-slate-900 relative flex flex-col justify-center items-center overflow-hidden p-4">
                        <div className="absolute top-4 left-4 text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <GitBranch size={14} /> Propagation Map
                        </div>

                        {isAnalyzing ? (
                            <div className="flex flex-col items-center gap-3 text-slate-400">
                                <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                                <span className="text-xs font-mono">Analyzing blast radius...</span>
                            </div>
                        ) : (
                            <div className="relative w-full h-full flex items-center justify-center">
                                <svg className="absolute inset-0 w-full h-full">
                                    {data.graph.paths.map((p, i) => (
                                        <path key={i} d={p.d} fill="none" stroke={p.stroke === 'risk' ? '#ef4444' : '#f59e0b'} strokeWidth="3" strokeDasharray="4 4" />
                                    ))}
                                </svg>
                                {data.graph.nodes.map((node, i) => (
                                    <div key={i} className="absolute p-3 rounded-2xl bg-slate-800 border-2 border-slate-600 text-center" style={{ left: node.x, top: node.y }}>
                                        <Server size={20} className={node.status === 'risk' ? 'text-red-400' : 'text-blue-400'} />
                                        <div className="text-[10px] font-bold text-white mt-1">{node.label}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right: Insights */}
                    <div className="p-5 flex flex-col justify-between bg-white">
                        <div>
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4">Risk Assessment</h3>
                            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 space-y-2">
                                <div className="flex justify-between items-center text-xs font-bold text-red-700">
                                    <span>{data.insights.reliability.title}</span>
                                    <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px]">{data.insights.reliability.prob}</span>
                                </div>
                                <p className="text-xs text-slate-600 font-medium">{data.insights.reliability.desc}</p>
                            </div>

                            <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                                <div className="text-xs font-bold text-slate-500 uppercase">FinOps Monthly Waste</div>
                                <div className="text-xl font-black text-amber-600 mt-1">{data.insights.finops.waste}</div>
                            </div>
                        </div>

                        <button onClick={onClose} className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-full font-bold text-xs uppercase tracking-wider shadow-md">
                            Close Inspection
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default BlastRadiusColumn;
