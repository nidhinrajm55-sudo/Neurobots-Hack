import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Bell, LogOut, ShieldCheck, Palette, Sparkles, Check } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '../utils/api';

const Layout = ({ children, activeTab, onTabChange, user, onLogout, currentTheme = 'light', onThemeChange }) => {
    const tabs = ['Dashboard', 'Problems', 'Prioritization', 'Blast Radius'];
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
    const [isAttackMenuOpen, setIsAttackMenuOpen] = useState(false);
    const [systemStatus, setSystemStatus] = useState('healthy');
    const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleTimeString());

    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const res = await apiClient.getStatus();
                if (res && res.system_status) {
                    setSystemStatus(res.system_status);
                }
                setLastUpdated(new Date().toLocaleTimeString());
            } catch (e) {}
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    const handleAttackSelect = async (scenario) => {
        setIsAttackMenuOpen(false);
        try {
            if (scenario === 'stop') {
                await apiClient.stopAttack();
                toast.success('Attack Stopped', { description: 'Target system returning to nominal traffic.' });
            } else if (scenario === '2am_db') {
                toast.loading('Simulating 2:00 AM Silent DB Degradation...', { id: 'attack-scenario' });
                const res = await apiClient.trigger2AMScenario();
                toast.error('🌙 2:00 AM SILENT DB DEGRADATION ACTIVE', {
                    id: 'attack-scenario',
                    description: 'Unindexed query loop & memory leak active on order-service. Isolation Forest analyzing metrics...',
                    duration: 6000
                });
            } else {
                toast.loading(`Launching ${scenario} scenario...`, { id: 'attack-scenario' });
                await apiClient.startAttack(scenario, 30);
                toast.error(`🔥 ATTACK ACTIVE: ${scenario.toUpperCase()}`, {
                    id: 'attack-scenario',
                    description: 'Sentinel-X AI scanner running real-time anomaly detection...',
                    duration: 5000
                });
            }
        } catch (e) {
            toast.error('Attack trigger failed', { id: 'attack-scenario', description: e.message });
        }
    };

    const statusPillConfig = {
        healthy: { text: '● LIVE', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', dot: 'bg-emerald-400' },
        degrading: { text: '● DEGRADED', color: 'bg-amber-500/20 text-amber-400 border-amber-500/40', dot: 'bg-amber-400 animate-ping' },
        critical: { text: '● CRITICAL', color: 'bg-red-500/20 text-red-400 border-red-500/40', dot: 'bg-red-500 animate-ping' }
    };

    const currentPill = statusPillConfig[systemStatus] || statusPillConfig.healthy;

    const themeOptions = [
        { id: 'light', name: 'Cascade Light', color: 'bg-blue-500', border: 'border-blue-400' },
        { id: 'dark', name: 'Cyber Slate', color: 'bg-slate-900', border: 'border-slate-700' },
        { id: 'ocean', name: 'Oceanic Cyan', color: 'bg-cyan-600', border: 'border-cyan-400' },
        { id: 'emerald', name: 'Forest Emerald', color: 'bg-emerald-600', border: 'border-emerald-400' },
        { id: 'amber', name: 'Warm Amber', color: 'bg-amber-600', border: 'border-amber-400' },
    ];

    return (
        <div className="min-h-screen flex flex-col overflow-auto md:overflow-hidden text-[var(--color-text-main)] font-sans selection:bg-blue-600 selection:text-white transition-colors duration-300">
            {/* Top Floating Navigation Bar */}
            <div className="w-full px-4 sm:px-6 lg:px-8 pt-4 pb-2 flex-shrink-0 z-50 sticky top-0 md:relative">
                <nav className="w-full theme-nav rounded-2xl md:rounded-full px-4 sm:px-6 py-2.5 transition-all">
                    <div className="flex items-center justify-between">
                        {/* Brand Logo & Name */}
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-500/30">
                                <ShieldCheck className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex items-center">
                                <span className="text-xl font-black tracking-tight theme-text-main">Sentinel-X</span>
                                <span className="text-xl font-black tracking-tight text-blue-500 ml-1">AI</span>
                            </div>

                            {/* System Status Pill */}
                            <div className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider border flex items-center gap-1.5 ml-2 ${currentPill.color}`}>
                                <div className={`w-2 h-2 rounded-full ${currentPill.dot}`} />
                                <span>{currentPill.text}</span>
                            </div>
                        </div>

                        {/* Desktop Navigation Tabs */}
                        <div className="hidden md:block">
                            <div className="flex items-center bg-[var(--color-pill-bg)] border border-[var(--color-card-border)] p-1 rounded-full space-x-1">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => onTabChange(tab)}
                                        className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase transition-all relative outline-none ${
                                            activeTab === tab ? 'text-white' : 'theme-text-muted hover:theme-text-main'
                                        }`}
                                    >
                                        {activeTab === tab && (
                                            <motion.div
                                                layoutId="active-pill"
                                                className="absolute inset-0 bg-blue-600 rounded-full shadow-md shadow-blue-600/30"
                                                transition={{ type: "spring", stiffness: 350, damping: 30 }}
                                            />
                                        )}
                                        <span className="relative z-10">{tab}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Right Actions: Trigger Attack Dropdown, Theme Picker, Timestamp & User */}
                        <div className="hidden md:flex items-center gap-3">
                            {/* Trigger Attack Dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => setIsAttackMenuOpen(!isAttackMenuOpen)}
                                    className="flex items-center gap-2 px-3.5 py-1.5 bg-gradient-to-r from-red-600 to-amber-600 text-white rounded-full text-xs font-bold uppercase tracking-wider shadow-md hover:from-red-500 hover:to-amber-500 transition-all"
                                >
                                    <Sparkles size={14} />
                                    <span>Trigger Attack ▾</span>
                                </button>

                                <AnimatePresence>
                                    {isAttackMenuOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            className="absolute right-0 mt-2 w-48 bg-slate-900 text-white rounded-2xl p-2 shadow-2xl z-50 border border-slate-700"
                                        >
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1.5">
                                                Simulate Attack Scenario
                                            </div>
                                            <button
                                                onClick={() => handleAttackSelect('2am_db')}
                                                className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-amber-300 hover:bg-slate-800 transition-all border-b border-slate-800 pb-2 mb-1"
                                            >
                                                🌙 2:00 AM DB Degradation
                                            </button>
                                            <button
                                                onClick={() => handleAttackSelect('load_flood')}
                                                className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-red-400 hover:bg-slate-800 transition-all"
                                            >
                                                🔥 Load Flood (DDoS)
                                            </button>
                                            <button
                                                onClick={() => handleAttackSelect('memory_leak')}
                                                className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-purple-400 hover:bg-slate-800 transition-all"
                                            >
                                                💧 RAM Exhaustion Leak
                                            </button>
                                            <button
                                                onClick={() => handleAttackSelect('stop')}
                                                className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-emerald-400 hover:bg-slate-800 transition-all border-t border-slate-800 mt-1 pt-2"
                                            >
                                                🛑 Stop Active Attack
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Theme Selector Pill */}
                            <div className="relative">
                                <button
                                    onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
                                    className="flex items-center gap-2 px-3 py-1.5 theme-card rounded-full text-xs font-bold uppercase tracking-wider shadow-sm hover:shadow transition-all"
                                    title="Switch Color Theme"
                                >
                                    <Palette size={14} className="text-blue-500" />
                                    <span className="hidden xl:inline capitalize">{currentTheme}</span>
                                </button>

                                <AnimatePresence>
                                    {isThemeMenuOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            className="absolute right-0 mt-2 w-48 theme-card rounded-2xl p-2 shadow-2xl z-50 border border-[var(--color-card-border)]"
                                        >
                                            <div className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider px-3 py-1.5">
                                                Select Theme
                                            </div>
                                            <div className="space-y-1">
                                                {themeOptions.map((option) => (
                                                    <button
                                                        key={option.id}
                                                        onClick={() => {
                                                            if (onThemeChange) onThemeChange(option.id);
                                                            setIsThemeMenuOpen(false);
                                                        }}
                                                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                                                            currentTheme === option.id
                                                                ? 'bg-blue-600 text-white shadow-sm'
                                                                : 'theme-text-main hover:bg-[var(--color-pill-bg)]'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-3.5 h-3.5 rounded-full ${option.color} border ${option.border}`} />
                                                            <span>{option.name}</span>
                                                        </div>
                                                        {currentTheme === option.id && <Check size={14} />}
                                                    </button>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* User / Controller Badge */}
                            <div className="flex items-center gap-2.5 theme-card py-1 px-3 rounded-full shadow-sm">
                                {user?.avatar ? (
                                    <img src={user.avatar} alt="User Avatar" className="w-6 h-6 rounded-full border border-slate-200" />
                                ) : (
                                    <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center font-bold text-xs">
                                        SX
                                    </div>
                                )}
                                <span className="text-xs font-bold theme-text-main tracking-wide uppercase">
                                    {user?.name || 'SENTINEL ENGINE'}
                                </span>
                            </div>

                            {/* Logout Button */}
                            <button
                                onClick={onLogout}
                                className="flex items-center gap-1.5 px-3 py-1.5 theme-card theme-text-main hover:text-red-500 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm transition-all"
                                title="Sign Out"
                            >
                                <LogOut size={14} />
                                <span>Logout</span>
                            </button>
                        </div>

                        {/* Mobile Menu Button */}
                        <div className="-mr-1 flex md:hidden">
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="bg-white p-2 rounded-xl text-slate-700 hover:text-blue-600 focus:outline-none border border-slate-200 shadow-sm"
                            >
                                <span className="sr-only">Open main menu</span>
                                {isMobileMenuOpen ? (
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                ) : (
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>
                </nav>

                {/* Mobile Menu Dropdown */}
                <AnimatePresence>
                    {isMobileMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="md:hidden mt-2 rounded-2xl border border-white/80 bg-white/95 backdrop-blur-xl overflow-hidden shadow-xl"
                        >
                            <div className="px-4 py-4 space-y-3">
                                <div className="space-y-1">
                                    {tabs.map((tab) => (
                                        <button
                                            key={tab}
                                            onClick={() => {
                                                onTabChange(tab);
                                                setIsMobileMenuOpen(false);
                                            }}
                                            className={`w-full text-left block px-4 py-2.5 rounded-xl text-sm font-bold tracking-wider uppercase transition-all ${
                                                activeTab === tab
                                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                            }`}
                                        >
                                            {tab}
                                        </button>
                                    ))}
                                </div>

                                <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-slate-800 uppercase">
                                            {user?.name || 'SENTINEL ENGINE'}
                                        </span>
                                    </div>
                                    <button
                                        onClick={onLogout}
                                        className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-bold uppercase"
                                    >
                                        <LogOut size={14} />
                                        Logout
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto flex flex-col w-full px-4 sm:px-6 lg:px-8 py-4 relative scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
                <div className="flex-1 animate-in fade-in slide-in-from-bottom-2 duration-300 pb-8">
                    {children}
                </div>

                {/* PRD Last Updated Timestamp Badge */}
                <div className="fixed bottom-3 right-4 z-40 bg-slate-900/90 text-slate-400 border border-slate-700/80 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-mono shadow-lg flex items-center gap-1.5 pointer-events-none">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Last synced: {lastUpdated}</span>
                </div>
            </main>
        </div>
    );
};

export default Layout;
