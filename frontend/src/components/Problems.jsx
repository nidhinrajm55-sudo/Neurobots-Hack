import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Filter, RefreshCcw, Activity, AlertOctagon, Monitor, Clock, ChevronDown, Download, EyeOff, LayoutGrid, List } from 'lucide-react';
import ProblemDetail from './ProblemDetail';
import { AnimatePresence } from 'framer-motion';
import BlastRadiusColumn from './BlastRadiusModal';
import { getAlerts, getBlastRadiusData } from '../utils/dataProvider';

const Problems = () => {
    const [selectedProblem, setSelectedProblem] = useState(null);
    const [selectedBlastRadiusProblem, setSelectedBlastRadiusProblem] = useState(null);
    const [activeFilter, setActiveFilter] = useState('All');
    const [selectedCategory, setSelectedCategory] = useState([]);
    const blastData = getBlastRadiusData();

    const chartFillColor = '#ef4444'; // Signal Red

    // Mock Data for Chart
    const chartData = Array.from({ length: 24 }, (_, i) => {
        const hour = Math.floor(i / 12) + 6;
        const minute = (i % 12) * 5;
        const nextMinute = minute + 5;

        const formatTime = (h, m) => {
            const period = h >= 12 ? 'PM' : 'AM';
            const displayH = h > 12 ? h - 12 : h;
            return `${displayH}:${m.toString().padStart(2, '0')} ${period}`;
        };

        let label = formatTime(hour + 12, minute);
        if (minute === 0) label = `${hour > 12 ? hour - 12 : hour} PM`;

        return {
            time: label,
            endTime: formatTime(hour + 12, nextMinute),
            count: 10 + (i % 5),
        };
    });

    const alerts = getAlerts();
    const allProblems = alerts.map(a => ({
        id: a.id,
        name: a.name,
        status: 'Active',
        category: 'Availability',
        affected: a.affectedStr,
        started: 'Just now',
        duration: '1m'
    }));

    const filteredProblems = allProblems
        .filter(problem => {
            const matchesStatus = activeFilter === 'All' || problem.status === activeFilter;
            const matchesCategory = selectedCategory.length === 0 || selectedCategory.includes(problem.category);
            return matchesStatus && matchesCategory;
        })
        .sort((a, b) => {
            if (a.status === 'Active' && b.status !== 'Active') return -1;
            if (a.status !== 'Active' && b.status === 'Active') return 1;
            return 0;
        });

    const categories = ['Resource contention', 'Custom', 'Availability', 'Custom alert'];

    const handleCategoryChange = (category) => {
        if (selectedCategory.includes(category)) {
            setSelectedCategory(selectedCategory.filter(c => c !== category));
        } else {
            setSelectedCategory([...selectedCategory, category]);
        }
    };

    if (selectedProblem) {
        return <ProblemDetail problem={selectedProblem} onBack={() => setSelectedProblem(null)} />;
    }

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-full text-slate-900">
            {/* Sidebar Filters */}
            <div className="w-full lg:w-64 flex-shrink-0 space-y-6 bg-white/80 backdrop-blur-md border border-white/90 rounded-3xl p-5 shadow-[0_10px_30px_-5px_rgba(100,116,139,0.1)]">
                <div>
                    <div className="mb-4">
                        <button className="w-full flex items-center justify-between px-3 py-2 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs font-bold text-blue-600 hover:bg-slate-100 transition-all">
                            <span>Default filter</span>
                            <ChevronDown size={14} className="text-slate-400" />
                        </button>
                    </div>

                    <h3 className="text-xs font-bold mb-3 uppercase tracking-wider text-slate-500">Status</h3>
                    <div className="space-y-2">
                        {['All', 'Active', 'Closed'].map((status) => (
                            <label key={status} className="flex items-center gap-2.5 cursor-pointer group">
                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${activeFilter === status ? 'border-blue-600 bg-blue-50' : 'border-slate-300 group-hover:border-blue-600'}`}>
                                    {activeFilter === status && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                                </div>
                                <span className={`text-xs ${activeFilter === status ? 'font-bold text-slate-800' : 'font-medium text-slate-600'} group-hover:text-slate-900`}>{status}</span>
                                <input
                                    type="radio"
                                    name="status"
                                    className="hidden"
                                    checked={activeFilter === status}
                                    onChange={() => setActiveFilter(status)}
                                />
                            </label>
                        ))}
                    </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                    <h3 className="text-xs font-bold mb-3 uppercase tracking-wider text-slate-500">Category</h3>
                    <div className="space-y-2">
                        {categories.map((category) => (
                            <label key={category} className="flex items-center gap-2.5 cursor-pointer group">
                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${selectedCategory.includes(category) ? 'bg-blue-600 border-blue-600' : 'border-slate-300 group-hover:border-blue-600'}`}>
                                    {selectedCategory.includes(category) && <div className="w-2 h-2 bg-white rounded-sm" />}
                                </div>
                                <span className={`text-xs ${selectedCategory.includes(category) ? 'font-bold text-slate-800' : 'font-medium text-slate-600'} group-hover:text-slate-900`}>{category}</span>
                                <input
                                    type="checkbox"
                                    className="hidden"
                                    checked={selectedCategory.includes(category)}
                                    onChange={() => handleCategoryChange(category)}
                                />
                            </label>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 min-w-0 flex flex-col space-y-4 min-h-0">
                {/* Top Header Panel */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-white/80 backdrop-blur-md border border-white/90 shadow-[0_10px_30px_-5px_rgba(100,116,139,0.1)]">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl">
                            <LayoutGrid size={20} />
                        </div>
                        <div className="flex items-baseline gap-2">
                            <h2 className="text-xl font-black text-slate-800 tracking-tight">Active Problems</h2>
                            <span className="px-2.5 py-0.5 text-xs font-bold bg-red-100 text-red-700 rounded-full border border-red-200">
                                <Activity size={10} className="inline mr-1" />
                                {allProblems.filter(p => p.status === 'Active').length} Active
                            </span>
                            <span className="text-xs font-bold text-slate-400">/ {allProblems.length}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-all shadow-sm">
                            Last 2 hours
                            <ChevronDown size={14} />
                        </button>
                        <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                            <RefreshCcw size={12} />
                            <span>refreshed 1 min. ago</span>
                        </div>
                    </div>
                </div>

                {/* Chart Section */}
                <div className="p-6 rounded-3xl bg-white/80 backdrop-blur-md border border-white/90 shadow-[0_10px_30px_-5px_rgba(100,116,139,0.1)] flex-shrink-0">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 relative w-full max-w-md">
                            <Filter size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Type to filter..."
                                className="w-full pl-10 pr-4 py-2 text-xs font-medium rounded-full border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="flex items-center gap-1 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 shadow-sm">
                                <EyeOff size={12} /> Hide chart
                            </button>
                        </div>
                    </div>

                    <div className="h-48 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }} barCategoryGap="10%">
                                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} interval={2} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} domain={[0, 15]} ticks={[0, 5, 10, 15]} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(241, 245, 249, 0.6)' }}
                                    content={({ active, payload, label }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="bg-white border border-slate-200 rounded-2xl shadow-xl p-3 min-w-[180px] z-50">
                                                    <div className="text-[11px] font-bold text-slate-500 mb-1">
                                                        Today, {label}
                                                    </div>
                                                    <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                                                        <span className="text-red-600">ACTIVE INCIDENTS</span>
                                                        <span>{payload[0].value}</span>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Bar dataKey="count" fill={chartFillColor} radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Table Section */}
                <div className="flex flex-col flex-1 min-h-[380px] bg-white/80 backdrop-blur-md border border-white/90 shadow-[0_10px_30px_-5px_rgba(100,116,139,0.1)] rounded-3xl overflow-hidden relative">
                    <div className="flex justify-end px-5 py-3 border-b border-slate-100 flex-shrink-0 z-20 bg-white/50 relative">
                        <button className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800">
                            <List size={12} /> 5 columns hidden
                        </button>
                        <button className="ml-3 text-slate-500 hover:text-slate-800">
                            <Download size={14} />
                        </button>
                    </div>

                    <div className="absolute inset-0 top-[45px] overflow-auto" style={{ scrollbarGutter: 'stable' }}>
                        <table className="hidden lg:table w-full text-xs text-left relative table-fixed">
                            <thead className="bg-slate-50 border-b border-slate-200/80 text-[11px] uppercase tracking-wider text-slate-600 font-bold sticky top-0 z-10">
                                <tr>
                                    <th className="px-4 py-3.5 w-12 bg-slate-50">
                                        <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                                    </th>
                                    <th className="px-4 py-3.5 w-28 bg-slate-50">ID</th>
                                    <th className="px-4 py-3.5 w-auto bg-slate-50">Name</th>
                                    <th className="px-4 py-3.5 w-32 bg-slate-50">Status</th>
                                    <th className="px-4 py-3.5 w-40 bg-slate-50">Category</th>
                                    <th className="px-4 py-3.5 w-32 text-center bg-slate-50">Affected</th>
                                    <th className="px-4 py-3.5 w-32 text-right bg-slate-50">Started</th>
                                    <th className="px-4 py-3.5 w-28 text-right bg-slate-50">Duration</th>
                                    <th className="px-4 py-3.5 w-24 text-center bg-slate-50">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredProblems.map((problem) => (
                                    <tr key={problem.id} onClick={() => setSelectedProblem(problem)} className="hover:bg-blue-50/50 transition-colors group cursor-pointer">
                                        <td className="px-4 py-3.5">
                                            <input type="checkbox" className="rounded border-slate-300 text-blue-600" />
                                        </td>
                                        <td className="px-4 py-3.5 font-mono text-xs font-bold text-slate-500">{problem.id}</td>
                                        <td className="px-4 py-3.5 font-bold text-slate-800 max-w-xs truncate text-sm" title={problem.name}>
                                            {problem.name}
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                                                problem.status === 'Active'
                                                    ? 'bg-red-50 text-red-700 border-red-200'
                                                    : 'bg-slate-100 text-slate-600 border-slate-200'
                                            }`}>
                                                {problem.status === 'Active' ? <AlertOctagon size={12} /> : <Clock size={12} />}
                                                {problem.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3.5 text-slate-600 font-medium text-xs">
                                            <div className="flex items-center gap-2">
                                                {problem.category === 'Resource contention' && <Monitor size={14} className="text-slate-400" />}
                                                {problem.category === 'Custom' && <LayoutGrid size={14} className="text-slate-400" />}
                                                {problem.category === 'Availability' && <Activity size={14} className="text-slate-400" />}
                                                {problem.category === 'Custom alert' && <AlertOctagon size={14} className="text-slate-400" />}
                                                <span className="truncate max-w-[140px] font-semibold">{problem.category}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5 text-center text-slate-700 font-bold text-xs">{problem.affected}</td>
                                        <td className="px-4 py-3.5 text-right text-slate-500 font-medium text-xs whitespace-nowrap">{problem.started}</td>
                                        <td className="px-4 py-3.5 text-right text-slate-600 font-mono font-bold text-xs">{problem.duration}</td>
                                        <td className="px-4 py-3.5 text-center">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedBlastRadiusProblem(problem);
                                                }}
                                                className="p-2 rounded-xl bg-slate-100 border border-slate-200 hover:bg-blue-600 hover:text-white text-slate-600 transition-all group relative"
                                                title="Analyze Blast Radius"
                                            >
                                                <Activity size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Mobile Cards */}
                        <div className="lg:hidden flex flex-col gap-3 p-4">
                            {filteredProblems.map((problem) => (
                                <div
                                    key={problem.id}
                                    onClick={() => setSelectedProblem(problem)}
                                    className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 hover:shadow-md transition-all cursor-pointer"
                                >
                                    <div className="flex items-start justify-between">
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase border ${
                                            problem.status === 'Active' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                                        }`}>
                                            {problem.status}
                                        </span>
                                        <span className="font-mono text-xs text-slate-400 font-bold">{problem.id}</span>
                                    </div>
                                    <h3 className="font-bold text-slate-900 text-sm leading-snug">{problem.name}</h3>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Blast Radius Modal */}
            <AnimatePresence>
                {selectedBlastRadiusProblem && (
                    <BlastRadiusColumn
                        isOpen={!!selectedBlastRadiusProblem}
                        onClose={() => setSelectedBlastRadiusProblem(null)}
                        scenarioData={{
                            service: selectedBlastRadiusProblem.affected,
                            description: selectedBlastRadiusProblem.name,
                            version: 'Detected Risk',
                            type: selectedBlastRadiusProblem.category,
                            riskLevel: selectedBlastRadiusProblem.status === 'Active' ? 'Critical' : 'Low',
                            graph: blastData.graph,
                            insights: blastData.insights
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default Problems;
