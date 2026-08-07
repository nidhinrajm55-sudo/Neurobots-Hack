import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    GitCommit, Clock, AlertTriangle, TrendingUp, Activity, ArrowRight,
    Search, Cpu, Zap, CheckCircle2, Share2, X
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { getCorrelationData } from '../utils/dataProvider';

const CorrelationAnalysis = ({ data = null, onClose }) => {
    const analysisData = data || getCorrelationData();
    const { service, change_event, correlation } = analysisData;

    const formatTime = (isoString) => {
        const date = new Date(isoString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const getMetricIcon = (metricName) => {
        if (metricName.includes('cpu')) return <Cpu size={16} />;
        if (metricName.includes('latency')) return <Zap size={16} />;
        return <Activity size={16} />;
    };

    const getConfidenceColor = (score) => {
        if (score >= 0.8) return 'text-emerald-700 border-emerald-200 bg-emerald-50';
        if (score >= 0.6) return 'text-amber-700 border-amber-200 bg-amber-50';
        return 'text-red-700 border-red-200 bg-red-50';
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="w-full bg-white/80 backdrop-blur-md border border-white/90 rounded-3xl shadow-[0_10px_30px_-5px_rgba(100,116,139,0.1)] overflow-hidden text-slate-900"
        >
            {/* Header Section */}
            <div className="p-6 border-b border-slate-100 bg-white/40">
                <div className="flex justify-between items-start">
                    <div className="flex gap-4 items-center">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100 shadow-sm">
                            <GitCommit size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                                Change Correlation Analysis
                                {correlation.is_correlated && (
                                    <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-blue-100 text-blue-700 border border-blue-200 uppercase tracking-wider">
                                        AI Insight
                                    </span>
                                )}
                            </h2>
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
                                Service: <span className="font-mono text-slate-800 bg-slate-100 px-2 py-0.5 rounded-full">{service}</span>
                                <span className="w-1 h-1 rounded-full bg-slate-400"></span>
                                Event: {change_event.type} <span className="font-mono text-emerald-600 font-bold">{change_event.version}</span>
                            </p>
                        </div>
                    </div>

                    {onClose && (
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Context */}
                <div className="space-y-5">
                    {/* Confidence Score Card */}
                    <div className={`p-5 rounded-2xl border ${getConfidenceColor(correlation.correlation_confidence)} shadow-sm relative overflow-hidden`}>
                        <h3 className="text-xs uppercase tracking-wider font-bold opacity-80 mb-1">Correlation Confidence</h3>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-black">{Math.round(correlation.correlation_confidence * 100)}%</span>
                            <span className="text-xs font-bold uppercase opacity-80">High Probability</span>
                        </div>
                        <p className="mt-3 text-xs opacity-90 leading-relaxed border-t border-slate-200/60 pt-3 font-medium">
                            The system identified a high statistical link between release <span className="font-mono font-bold">{change_event.version}</span> and subsequent metrics anomalies.
                        </p>
                    </div>

                    {/* Timeline Info */}
                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold border border-blue-200">
                                1
                            </div>
                            <div className="flex-1">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Change Event</p>
                                <div className="text-xs text-slate-800 font-bold flex items-center justify-between mt-0.5">
                                    <span>Deployment {change_event.version}</span>
                                    <span className="font-mono text-slate-500 text-[11px]">{formatTime(change_event.timestamp)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="pl-3.5 ml-3 border-l-2 border-dashed border-slate-300 h-5" />

                        <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold border border-amber-200">
                                2
                            </div>
                            <div className="flex-1">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Anomaly Detected</p>
                                <div className="text-xs text-slate-800 font-bold flex items-center justify-between mt-0.5">
                                    <span>Metrics Shift</span>
                                    <span className="font-mono text-slate-500 text-[11px]">
                                        +{correlation.time_offset_minutes} mins later
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Metrics Analysis */}
                <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Affected Metrics Analysis</h3>

                    {correlation.affected_metrics.map((metric, idx) => (
                        <motion.div
                            key={`${metric.metric}-${idx}`}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 hover:border-blue-300 transition-colors"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-white text-slate-700 border border-slate-200 shadow-sm">
                                        {getMetricIcon(metric.metric)}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-800 capitalize text-sm">{metric.metric.replace('_', ' ')}</h4>
                                        <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                                            Pattern: <span className="text-amber-600 font-bold">{metric.pattern.replace('_', ' ')}</span>
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xl font-black text-red-600 flex items-center justify-end gap-1">
                                        <TrendingUp size={18} />
                                        +{metric.delta_percent}%
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Change Magnitude</p>
                                </div>
                            </div>

                            {/* Visual Bar Comparison */}
                            <div className="relative h-10 bg-slate-200/60 rounded-xl overflow-hidden flex items-center px-2">
                                <div className="h-3 bg-blue-500 rounded-full" style={{ width: `${Math.min(100, (metric.before_avg / Math.max(metric.before_avg, metric.after_avg)) * 80)}%` }} />
                                <div className="mx-2 text-slate-400">
                                    <ArrowRight size={14} />
                                </div>
                                <div className="h-3 bg-red-500 rounded-full" style={{ width: `${Math.min(100, (metric.after_avg / Math.max(metric.before_avg, metric.after_avg)) * 80)}%` }} />
                            </div>

                            <div className="flex justify-between mt-2 text-[11px] text-slate-500 font-bold font-mono px-1">
                                <span>Before: {metric.before_avg}</span>
                                <span>After: {metric.after_avg}</span>
                            </div>
                        </motion.div>
                    ))}

                    <div className="flex justify-end gap-3 mt-4">
                        <button className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 shadow-sm transition-all flex items-center gap-2">
                            <Share2 size={14} /> Share Report
                        </button>
                        <button className="px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/25 transition-all flex items-center gap-2">
                            <CheckCircle2 size={14} /> Mark Resolved
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default CorrelationAnalysis;
