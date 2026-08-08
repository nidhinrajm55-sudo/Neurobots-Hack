import React, { useState, useEffect, useMemo } from 'react';
import {
    Shield, Filter, RefreshCcw, ChevronDown, List, Download, AlertTriangle,
    Bug, Globe, Gem, ExternalLink, TrendingUp, DollarSign, Users, Server,
    ArrowUpRight, Activity, CheckCircle2, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import BlastRadiusColumn from './BlastRadiusModal';
import { getAlerts, getBlastRadiusData } from '../utils/dataProvider';
import { apiClient } from '../utils/api';

const Prioritization = () => {
    const blastData = getBlastRadiusData();

    const [vulnerabilities, setVulnerabilities] = useState([]);
    const [activeAttack, setActiveAttack] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: 'riskScore', direction: 'desc' });
    const [selectedVuln, setSelectedVuln] = useState(null);

    useEffect(() => {
        const fetchPrioritization = async () => {
            try {
                const data = await apiClient.getPrioritization();
                setActiveAttack(data.active_attack || null);

                if (data.ranked && data.ranked.length > 0) {
                    const formatted = data.ranked.map((item, idx) => ({
                        id: item.problem_id || `P-${idx}`,
                        name: item.summary || `${item.service} Degradation`,
                        riskScore: item.priority_score || 85,
                        severity: item.priority_score >= 90 ? 'Critical' : item.priority_score >= 70 ? 'High' : 'Medium',
                        time: item.age || 'Just now',
                        impact: item.impactLabel || 'Service Risk',
                        teams: item.teams || 'SRE, DevOps',
                        affectedStr: item.service || 'order-service',
                        cve: item.cve || 'ANOMALY-01',
                        baseScore: (item.priority_score / 10).toFixed(1),
                        impactLabel: item.impactLabel || 'Service Risk',
                        type: item.type || 'Anomaly',
                        status: item.status || 'Active',
                        age: item.age || 'Just now',
                        is_active_attack: item.is_active_attack || false
                    }));
                    setVulnerabilities(formatted);
                } else {
                    setVulnerabilities([]);
                }
            } catch (e) {
                console.error('Prioritization fetch error:', e);
            }
        };

        fetchPrioritization();
        const interval = setInterval(fetchPrioritization, 2000);
        return () => clearInterval(interval);
    }, []);

    const sortedData = useMemo(() => {
        let sorted = [...vulnerabilities];
        if (sortConfig.key) {
            sorted.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (a[sortConfig.key] > b[sortConfig.key]) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sorted;
    }, [vulnerabilities, sortConfig]);

    const handleSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const getRiskColor = (score) => {
        if (score >= 90) return 'text-white bg-red-600';
        if (score >= 70) return 'text-white bg-orange-500';
        if (score >= 50) return 'text-white bg-amber-500';
        return 'text-white bg-emerald-600';
    };

    const getImpactIcon = (label) => {
        if (label.includes('Revenue') || label.includes('Dollar')) return <DollarSign size={13} />;
        if (label.includes('User')) return <Users size={13} />;
        return <AlertTriangle size={13} />;
    };

    return (
        <div className="flex flex-col text-slate-900 h-full overflow-hidden p-2 gap-4">
            {/* Live Attack Warning Banner */}
            {activeAttack?.is_active ? (
                <div className="bg-gradient-to-r from-red-600 via-amber-600 to-red-700 text-white p-3.5 rounded-2xl shadow-lg flex items-center justify-between animate-pulse">
                    <div className="flex items-center gap-3">
                        <Zap className="h-5 w-5 text-yellow-300 animate-bounce" />
                        <div>
                            <h4 className="font-black text-xs uppercase tracking-wider">
                                🔥 CRITICAL ATTACK DETECTED: {activeAttack.mode?.toUpperCase()}
                            </h4>
                            <p className="text-[11px] opacity-90 font-medium">
                                Target service elevated to Rank #1 with 99/100 Risk Score. Real-time remediation required!
                            </p>
                        </div>
                    </div>
                    <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-mono font-bold uppercase tracking-wider">
                        RANK #1 CRITICAL
                    </span>
                </div>
            ) : (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 p-3 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <span>SYSTEM NOMINAL — AI Risk Prioritization Baseline Operational</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-100 px-2.5 py-0.5 rounded-full uppercase">
                        ZERO ACTIVE ATTACKS
                    </span>
                </div>
            )}

            {/* Header Area */}
            <div className="flex flex-col gap-6 flex-shrink-0">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-1 flex items-center gap-2">
                            Risk Prioritization
                            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider">Beta</span>
                        </h1>
                        <p className="text-slate-600 text-xs font-medium max-w-2xl">
                            AI-driven risk scoring based on exploitability, business impact, and active threat intelligence.
                        </p>
                    </div>

                    {/* Top Stats Cards */}
                    <div className="flex gap-3">
                        <div className={`backdrop-blur-md border p-3 rounded-2xl flex flex-col min-w-[120px] shadow-sm ${
                            activeAttack?.is_active ? 'bg-red-50/90 border-red-200' : 'bg-white/80 border-white/90'
                        }`}>
                            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Critical Risk</span>
                            <span className={`text-2xl font-black mt-0.5 ${activeAttack?.is_active ? 'text-red-600' : 'text-slate-800'}`}>
                                {activeAttack?.is_active ? '1 Attack' : '0'}
                            </span>
                            <span className={`text-[10px] font-bold flex items-center gap-1 mt-0.5 ${
                                activeAttack?.is_active ? 'text-red-600' : 'text-emerald-600'
                            }`}>
                                {activeAttack?.is_active ? <><ArrowUpRight size={10} /> Live Threat</> : '● Nominal'}
                            </span>
                        </div>
                        <div className="bg-white/80 backdrop-blur-md border border-white/90 p-3 rounded-2xl flex flex-col min-w-[120px] shadow-sm">
                            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Assets at Risk</span>
                            <span className="text-2xl font-black text-amber-600 mt-0.5">
                                {activeAttack?.is_active ? '3 Services' : '1 Service'}
                            </span>
                            <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1 mt-0.5">
                                {activeAttack?.is_active ? 'Downstream propagation' : 'Baseline monitoring'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                        {['All Risks', 'Critical Only', 'Exploitable', 'Fixable'].map((filter, idx) => (
                            <button
                                key={filter}
                                className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-full border transition-all whitespace-nowrap ${
                                    idx === 0
                                        ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                }`}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>

                    <div className="w-full sm:w-64 relative">
                        <Filter size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Filter by CVE, Team..."
                            className="w-full pl-9 pr-4 py-1.5 text-xs font-medium rounded-full border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                    </div>
                </div>
            </div>

            {/* Table Card */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col bg-white/80 backdrop-blur-md border border-white/90 shadow-[0_10px_30px_-5px_rgba(100,116,139,0.1)] rounded-3xl overflow-hidden flex-1 min-h-[380px]"
            >
                <div className="flex justify-between items-center px-5 py-3 border-b border-slate-100 bg-white/50">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Live Risk Feed</span>
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Updated now
                        </span>
                    </div>
                    <div className="flex items-center gap-4 text-slate-500">
                        <span className="text-xs font-bold text-slate-600">AI Correlation Active</span>
                        <button className="hover:text-slate-900">
                            <Download size={16} />
                        </button>
                    </div>
                </div>

                <div className="overflow-auto flex-1">
                    <table className="w-full text-xs text-left relative min-w-[800px]">
                        <thead className="bg-slate-50 border-b border-slate-200/80 text-[11px] uppercase tracking-wider text-slate-600 font-bold sticky top-0 z-10">
                            <tr>
                                <th className="px-6 py-3.5 cursor-pointer hover:text-slate-900" onClick={() => handleSort('name')}>
                                    Vulnerability / CVE
                                </th>
                                <th className="px-6 py-3.5 w-40 cursor-pointer hover:text-slate-900" onClick={() => handleSort('riskScore')}>
                                    <div className="flex items-center gap-1">
                                        Risk Score <ArrowUpRight size={12} />
                                    </div>
                                </th>
                                <th className="px-6 py-3.5 w-48">Business Impact</th>
                                <th className="px-6 py-3.5 w-40">Affected Asset</th>
                                <th className="px-6 py-3.5 w-32 text-center">Teams</th>
                                <th className="px-6 py-3.5 w-32 text-right">Age</th>
                                <th className="px-6 py-3.5 w-24 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {sortedData.length > 0 ? (
                                sortedData.map((vuln) => (
                                    <tr key={vuln.id} className="hover:bg-blue-50/40 transition-colors cursor-pointer">
                                        <td className="px-6 py-4">
                                            <div className="flex items-start gap-3">
                                                <div className="mt-0.5">
                                                    {vuln.rawScore >= 9 ? <AlertTriangle size={16} className="text-red-500" /> : <Bug size={16} className="text-amber-500" />}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-800 text-sm">{vuln.name}</div>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{vuln.cve}</span>
                                                        <span className="text-[10px] text-slate-500 font-semibold">{vuln.type}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black shadow-sm ${getRiskColor(vuln.riskScore)}`}>
                                                    <Activity size={12} />
                                                    {vuln.riskScore}
                                                    <span className="text-[9px] opacity-80">/100</span>
                                                </div>
                                                <span className="text-[10px] font-bold text-slate-400 pl-1">CVSS: {vuln.baseScore}</span>
                                            </div>
                                        </td>

                                        <td className="px-6 py-4">
                                            <span className="text-xs font-bold px-2.5 py-1 rounded-full w-fit flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-100">
                                                {getImpactIcon(vuln.impactLabel)}
                                                {vuln.impactLabel}
                                            </span>
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-slate-700 font-bold text-xs">
                                                <Server size={14} className="text-slate-400" />
                                                {vuln.affectedStr}
                                            </div>
                                        </td>

                                        <td className="px-6 py-4 text-center">
                                            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                                                {vuln.teams}
                                            </span>
                                        </td>

                                        <td className="px-6 py-4 text-right">
                                            <div className="flex flex-col items-end gap-0.5">
                                                <span className="text-xs font-bold text-slate-700">{vuln.age}</span>
                                                {vuln.status !== 'Resolved' && (
                                                    <span className="text-[10px] uppercase font-bold tracking-wider text-red-600">
                                                        Open
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedVuln(vuln);
                                                }}
                                                className="p-2 rounded-xl bg-slate-100 border border-slate-200 hover:bg-blue-600 hover:text-white text-slate-600 transition-all"
                                                title="Analyze Blast Radius"
                                            >
                                                <Activity size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="py-12 text-center text-slate-400">
                                        <CheckCircle2 size={32} className="mx-auto mb-2 text-emerald-500" />
                                        <p className="font-bold text-slate-700 text-sm">System Nominal — Zero Active Threats</p>
                                        <p className="text-xs text-slate-500 mt-0.5">Click 'Trigger Attack' in top bar to simulate live threat prioritization.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </motion.div>

            {/* Modal */}
            <AnimatePresence>
                {selectedVuln && (
                    <BlastRadiusColumn
                        isOpen={!!selectedVuln}
                        onClose={() => setSelectedVuln(null)}
                        scenarioData={{
                            service: selectedVuln.affectedStr,
                            description: selectedVuln.name,
                            version: 'Current',
                            type: selectedVuln.type,
                            graph: blastData.graph,
                            insights: blastData.insights
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default Prioritization;
