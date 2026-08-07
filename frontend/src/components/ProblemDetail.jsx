import React, { useState } from 'react';
import {
    X, Sparkles, Send, MoreVertical, Monitor, Server, Database,
    Globe, Activity, AlertOctagon, Terminal, FileText, Settings,
    Cpu, Network, GitBranch, Layers, ArrowLeft, ChevronDown
} from 'lucide-react';

const ProblemDetail = ({ problem, onBack }) => {
    const [activeTab, setActiveTab] = useState('Overview');
    const tabs = ['Overview', 'Deployment', 'Events', 'Logs', 'Troubleshooting'];

    return (
        <div className="h-full flex flex-col space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-300 text-slate-900">
            {/* Header Section */}
            <div className="flex flex-col gap-4 bg-white/80 backdrop-blur-md border border-white/90 rounded-3xl p-6 shadow-[0_10px_30px_-5px_rgba(100,116,139,0.1)]">
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
                                {problem?.name || 'Cisco Memory Free critical low'}
                            </h1>
                            <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-wider">
                                <span className="flex items-center gap-1 text-red-700 bg-red-50 px-2.5 py-0.5 rounded-full border border-red-200">
                                    <AlertOctagon size={12} /> Active
                                </span>
                                <span className="font-mono text-slate-500">P-2601869</span>
                                <span className="px-2 py-0.5 rounded-full border border-slate-200 bg-slate-100 text-slate-600">Custom</span>
                                <span className="text-slate-500">Started at {problem?.started || 'Jan 15, 2026, 9:32 PM'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-full bg-blue-600 text-white shadow-md shadow-blue-500/25 transition-all">
                            <Sparkles size={14} />
                            Explain Problem
                        </button>
                        <button onClick={onBack} className="p-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Context Cards */}
                <div className="grid grid-cols-2 md:grid-cols-6 gap-3 pt-2">
                    {['Affected frontends', 'Affected services', 'Affected infrastructure', 'Affected synthetic', 'Potentially affected', 'Events'].map((label, idx) => (
                        <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between h-20">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 truncate">{label}</span>
                            <div className="flex justify-between items-end">
                                <span className="text-lg font-black text-slate-900">{idx === 5 ? '10' : '-'}</span>
                                {idx === 5 && <button className="p-1 hover:bg-slate-200 rounded"><MoreVertical size={14} className="text-slate-500" /></button>}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-6 border-b border-slate-100 pt-2">
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 flex-1 min-h-[300px]">
                <div className="bg-white/80 backdrop-blur-md border border-white/90 rounded-3xl p-6 shadow-[0_10px_30px_-5px_rgba(100,116,139,0.1)] flex flex-col">
                    <h3 className="text-sm font-black text-slate-800 tracking-wider uppercase mb-4">Root Cause Impact Tree</h3>
                    <div className="flex-1 bg-slate-900 rounded-2xl p-4 border border-slate-700/60 flex items-center justify-center text-slate-400 font-mono text-xs">
                        [Interactive Dependency Graph View]
                    </div>
                </div>
                <div className="bg-white/80 backdrop-blur-md border border-white/90 rounded-3xl p-6 shadow-[0_10px_30px_-5px_rgba(100,116,139,0.1)] flex flex-col">
                    <h3 className="text-sm font-black text-slate-800 tracking-wider uppercase mb-4">Telemetry Stream</h3>
                    <div className="space-y-3 font-mono text-xs text-slate-700">
                        <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-red-700 font-bold">
                            CRITICAL: Memory allocation overflow in main buffer loop.
                        </div>
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                            INFO: Sentinal Bot dispatched for automated pod reset.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProblemDetail;
