import React, { useState, useEffect } from 'react';
import { Bot, Wrench, ShieldCheck, ShieldAlert, AlertTriangle, Zap, CheckCircle2, RefreshCw, Activity, Cpu, Eye, ToggleLeft, ToggleRight, Play } from 'lucide-react';
import { toast } from 'sonner';

const RobotInspector = ({ 
    isDisasterMode, 
    onStartRepair, 
    onCompleteRepair, 
    onTriggerChaos,
    autoScanEnabled = true 
}) => {
    // Robot States: 'PATROL', 'ALERT', 'NAVIGATING', 'INSPECTING', 'HAMMERING', 'VICTORY'
    const [robotState, setRobotState] = useState('PATROL');
    const [autoRepairEnabled, setAutoRepairEnabled] = useState(true);
    const [targetService, setTargetService] = useState(null);
    const [repairProgress, setRepairProgress] = useState(0);
    const [robotPos, setRobotPos] = useState({ x: 10, y: 30 });
    const [hammerAngle, setHammerAngle] = useState(0);
    const [sparks, setSparks] = useState([]);
    const [scanCount, setScanCount] = useState(0);

    const serviceNodes = [
        { id: 'api', name: 'API Gateway', x: 15, y: 35, color: '#2563eb' },
        { id: 'auth', name: 'Auth Service', x: 35, y: 25, color: '#8b5cf6' },
        { id: 'payment', name: 'Payment Service', x: 58, y: 45, color: isDisasterMode ? '#ef4444' : '#10b981' },
        { id: 'checkout', name: 'Checkout Service', x: 78, y: 30, color: '#f59e0b' },
        { id: 'db', name: 'Database Cluster', x: 45, y: 70, color: '#06b6d4' }
    ];

    const [patrolIndex, setPatrolIndex] = useState(0);

    // Continuous Patrol Loop when normal
    useEffect(() => {
        if (robotState !== 'PATROL') return;

        const interval = setInterval(() => {
            setPatrolIndex((prev) => {
                const nextIdx = (prev + 1) % serviceNodes.length;
                const node = serviceNodes[nextIdx];
                setRobotPos({ x: node.x, y: node.y - 12 });
                setScanCount((c) => c + 1);
                return nextIdx;
            });
        }, 3500);

        return () => clearInterval(interval);
    }, [robotState]);

    // Handle Anomaly Detection Transition
    useEffect(() => {
        if (isDisasterMode && (robotState === 'PATROL' || robotState === 'VICTORY')) {
            const paymentNode = serviceNodes.find(n => n.id === 'payment');
            setTargetService(paymentNode.name);
            setRobotState('ALERT');

            toast.error('⚡ ANOMALY DETECTED BY SENTINAL BOT!', {
                id: 'bot-alert',
                description: autoRepairEnabled 
                    ? 'Sentinal Bot is flying to Payment Service for emergency hammer repair!' 
                    : 'Auto-Repair is OFF. Sentinal Bot dispatched to inspect anomaly.',
                duration: 4000
            });

            setTimeout(() => {
                setRobotState('NAVIGATING');
                setRobotPos({ x: paymentNode.x, y: paymentNode.y - 10 });
            }, 1200);
        }
    }, [isDisasterMode]);

    // Transition from Navigating to Hammering OR Inspecting depending on Toggle
    useEffect(() => {
        if (robotState === 'NAVIGATING') {
            const timer = setTimeout(() => {
                if (autoRepairEnabled) {
                    setRobotState('HAMMERING');
                    setRepairProgress(0);
                    if (onStartRepair) onStartRepair();
                } else {
                    setRobotState('INSPECTING');
                    toast.info('🔍 SENTINAL BOT IN INSPECTION MODE', {
                        id: 'bot-inspect',
                        description: 'Auto-Repair is OFF. Robot holding at Payment Service for manual analysis.',
                        duration: 6000
                    });
                }
            }, 1400);
            return () => clearTimeout(timer);
        }
    }, [robotState, autoRepairEnabled]);

    // Hammering & Spark Animation Loop
    useEffect(() => {
        if (robotState !== 'HAMMERING') return;

        const hammerInterval = setInterval(() => {
            setHammerAngle((prev) => (prev === 0 ? -60 : 0));

            // Generate sparks
            const newSparks = Array.from({ length: 5 }, (_, i) => ({
                id: Date.now() + i,
                x: (Math.random() - 0.5) * 40,
                y: (Math.random() - 0.5) * 40,
                size: Math.random() * 5 + 2,
                color: ['#f59e0b', '#ef4444', '#38bdf8', '#ffffff'][Math.floor(Math.random() * 4)]
            }));
            setSparks(newSparks);
        }, 300);

        const progressInterval = setInterval(() => {
            setRepairProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(progressInterval);
                    clearInterval(hammerInterval);
                    setRobotState('VICTORY');
                    
                    setTimeout(() => {
                        if (onCompleteRepair) onCompleteRepair('payment-service');
                        setRobotState('PATROL');
                    }, 1000);

                    return 100;
                }
                return prev + 12;
            });
        }, 400);

        return () => {
            clearInterval(hammerInterval);
            clearInterval(progressInterval);
        };
    }, [robotState]);

    const handleStartManualRepair = () => {
        setRobotState('HAMMERING');
        setRepairProgress(0);
        if (onStartRepair) onStartRepair();
    };

    const currentNode = serviceNodes[patrolIndex];

    return (
        <div className="bg-white/80 backdrop-blur-md border border-white/90 rounded-3xl p-5 shadow-[0_10px_30px_-5px_rgba(100,116,139,0.1),0_4px_6px_-4px_rgba(100,116,139,0.04)] relative overflow-hidden">
            {/* Header Control Strip */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100/80 rounded-2xl text-blue-600">
                        <Bot size={22} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-black text-slate-800 tracking-wider uppercase">
                                AUTONOMOUS SENTINAL BOT
                            </h3>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                robotState === 'HAMMERING' ? 'bg-amber-100 text-amber-700 animate-pulse' :
                                robotState === 'INSPECTING' ? 'bg-purple-100 text-purple-700 animate-pulse' :
                                robotState === 'ALERT' || robotState === 'NAVIGATING' ? 'bg-red-100 text-red-700 animate-bounce' :
                                'bg-emerald-100 text-emerald-700'
                            }`}>
                                {robotState === 'PATROL' ? 'NETWORK PATROL' : robotState}
                            </span>
                        </div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                            Real-time AI telemetry inspector & automated incident resolver
                        </p>
                    </div>
                </div>

                {/* Controls & Mode Toggles */}
                <div className="flex items-center gap-2 self-end sm:self-auto">
                    {/* Auto-Repair Toggle */}
                    <button
                        onClick={() => setAutoRepairEnabled(!autoRepairEnabled)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border flex items-center gap-1.5 shadow-sm transition-all ${
                            autoRepairEnabled 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                : 'bg-slate-100 text-slate-700 border-slate-300'
                        }`}
                        title="Toggle Auto-Repair vs Manual Inspection mode"
                    >
                        {autoRepairEnabled ? <ToggleRight className="w-4 h-4 text-emerald-600" /> : <ToggleLeft className="w-4 h-4 text-slate-400" />}
                        <span>Auto-Fix: {autoRepairEnabled ? 'ON' : 'OFF'}</span>
                    </button>

                    {/* Chaos Injector Button */}
                    <button
                        onClick={onTriggerChaos}
                        disabled={isDisasterMode}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border transition-all flex items-center gap-1.5 shadow-sm ${
                            isDisasterMode
                                ? 'bg-red-100 text-red-600 border-red-200 cursor-not-allowed opacity-80'
                                : 'bg-white text-red-600 border-red-200 hover:bg-red-50'
                        }`}
                    >
                        <Zap size={14} className={isDisasterMode ? 'animate-bounce' : ''} />
                        <span>{isDisasterMode ? 'Chaos Active' : 'Simulate Anomaly'}</span>
                    </button>
                </div>
            </div>

            {/* Interactive Patrol Canvas Map */}
            <div className="relative w-full h-[260px] bg-slate-900 rounded-2xl border border-slate-700/60 overflow-hidden shadow-inner">
                {/* Canvas Grid Background */}
                <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-30" />
                
                {/* Connecting Laser Lines */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    <line x1="15%" y1="35%" x2="35%" y2="25%" stroke="#334155" strokeWidth="2" strokeDasharray="4" />
                    <line x1="35%" y1="25%" x2="58%" y2="45%" stroke="#334155" strokeWidth="2" strokeDasharray="4" />
                    <line x1="58%" y1="45%" x2="78%" y2="30%" stroke="#334155" strokeWidth="2" strokeDasharray="4" />
                    <line x1="35%" y1="25%" x2="45%" y2="70%" stroke="#334155" strokeWidth="2" strokeDasharray="4" />
                    <line x1="58%" y1="45%" x2="45%" y2="70%" stroke="#334155" strokeWidth="2" strokeDasharray="4" />

                    {isDisasterMode && (
                        <line x1="35%" y1="25%" x2="58%" y2="45%" stroke="#ef4444" strokeWidth="3" className="animate-pulse" />
                    )}
                </svg>

                {/* Service Nodes */}
                {serviceNodes.map((node) => {
                    const isTarget = isDisasterMode && node.id === 'payment';
                    const isCurrentlyScanned = robotState === 'PATROL' && currentNode?.id === node.id;

                    return (
                        <div
                            key={node.id}
                            style={{ left: `${node.x}%`, top: `${node.y}%` }}
                            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer transition-all duration-300"
                        >
                            {isTarget && (
                                <div className="absolute w-16 h-16 bg-red-500/30 rounded-full animate-ping pointer-events-none" />
                            )}
                            {isCurrentlyScanned && (
                                <div className="absolute w-14 h-14 bg-blue-500/20 rounded-full animate-ping pointer-events-none" />
                            )}

                            <div className={`px-3 py-1.5 rounded-full border backdrop-blur-md flex items-center gap-2 shadow-lg transition-all ${
                                isTarget ? 'bg-red-950/90 border-red-500 text-red-200 scale-110 shadow-red-900/50' :
                                isCurrentlyScanned ? 'bg-blue-950/90 border-blue-400 text-blue-200 scale-105 shadow-blue-900/50' :
                                'bg-slate-800/90 border-slate-600 text-slate-200 hover:border-slate-400'
                            }`}>
                                <div className={`w-2 h-2 rounded-full ${isTarget ? 'bg-red-500 animate-pulse' : 'bg-emerald-400'}`} />
                                <span className="text-xs font-bold tracking-wider uppercase whitespace-nowrap">{node.name}</span>
                            </div>
                        </div>
                    );
                })}

                {/* Sentinal Bot Avatar */}
                <div
                    style={{
                        left: `${robotPos.x}%`,
                        top: `${robotPos.y}%`,
                        transition: robotState === 'NAVIGATING' ? 'all 1.4s ease-in-out' : 'all 1s ease-in-out'
                    }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 z-30 flex flex-col items-center pointer-events-none"
                >
                    {/* Exclamation Bubble */}
                    {(robotState === 'ALERT' || robotState === 'NAVIGATING') && (
                        <div className="mb-2 px-2.5 py-1 bg-red-600 text-white text-[10px] font-black rounded-full shadow-lg animate-bounce border border-white/40 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-yellow-300" />
                            ANOMALY DETECTED!
                        </div>
                    )}

                    {/* Manual Inspection Box */}
                    {robotState === 'INSPECTING' && (
                        <div className="mb-2 px-3 py-2 bg-slate-900/95 border border-purple-500/80 rounded-2xl shadow-2xl text-center min-w-[170px] pointer-events-auto">
                            <div className="text-[11px] font-bold text-purple-300 flex items-center justify-center gap-1">
                                <Eye className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
                                INSPECTING (NO AUTO-FIX)
                            </div>
                            <button
                                onClick={handleStartManualRepair}
                                className="mt-2 w-full px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[10px] rounded-full shadow-md transition-all uppercase tracking-wider cursor-pointer"
                            >
                                AUTHORIZE REPAIR 🔨
                            </button>
                        </div>
                    )}

                    {/* Repair Progress HUD */}
                    {robotState === 'HAMMERING' && (
                        <div className="mb-2 px-3 py-1.5 bg-slate-900/95 border border-amber-500/80 rounded-xl shadow-xl text-center min-w-[130px]">
                            <div className="text-[10px] font-bold text-amber-300 flex items-center justify-center gap-1">
                                <Wrench className="w-3 h-3 animate-spin text-amber-400" />
                                REPAIRING POD...
                            </div>
                            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1 overflow-hidden">
                                <div
                                    className="bg-amber-400 h-full transition-all duration-300"
                                    style={{ width: `${repairProgress}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Robot Character Box */}
                    <div className="relative group pointer-events-auto">
                        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 border-2 p-1 flex flex-col items-center justify-center shadow-xl ${
                            robotState === 'HAMMERING' ? 'border-amber-400 shadow-amber-500/30' :
                            robotState === 'INSPECTING' ? 'border-purple-400 shadow-purple-500/40' :
                            robotState === 'ALERT' || robotState === 'NAVIGATING' ? 'border-red-500 shadow-red-500/40' :
                            'border-blue-400 shadow-blue-500/30'
                        }`}>
                            <div className={`w-8 h-3 rounded-md flex items-center justify-center gap-1 ${
                                robotState === 'ALERT' || robotState === 'NAVIGATING' ? 'bg-red-950 border border-red-500/80' : 'bg-blue-950 border border-blue-500/80'
                            }`}>
                                <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                                <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                            </div>
                            <Bot className="w-3.5 h-3.5 text-slate-300 mt-1" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Status Strip */}
            <div className="relative z-10 mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="bg-slate-50 border border-slate-200/80 p-2.5 rounded-2xl flex items-center gap-2.5">
                    <Activity className="w-4 h-4 text-blue-600" />
                    <div>
                        <div className="text-slate-500 text-[10px] font-bold uppercase">Patrol Status</div>
                        <div className="text-slate-800 font-bold">{currentNode ? `Scanning ${currentNode.name}` : 'Scanning Network'}</div>
                    </div>
                </div>

                <div className="bg-slate-50 border border-slate-200/80 p-2.5 rounded-2xl flex items-center gap-2.5">
                    <Cpu className="w-4 h-4 text-purple-600" />
                    <div>
                        <div className="text-slate-500 text-[10px] font-bold uppercase">Healing Policy</div>
                        <div className="text-slate-800 font-bold">{autoRepairEnabled ? 'Auto-Fix Enabled' : 'Manual Approval'}</div>
                    </div>
                </div>

                <div className="bg-slate-50 border border-slate-200/80 p-2.5 rounded-2xl flex items-center gap-2.5">
                    <RefreshCw className="w-4 h-4 text-blue-600" />
                    <div>
                        <div className="text-slate-500 text-[10px] font-bold uppercase">Telemetry Cycles</div>
                        <div className="text-slate-800 font-bold">{scanCount} passes</div>
                    </div>
                </div>

                <div className="bg-slate-50 border border-slate-200/80 p-2.5 rounded-2xl flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <div>
                        <div className="text-slate-500 text-[10px] font-bold uppercase">Remediation Engine</div>
                        <div className="text-slate-800 font-bold">Pod Auto-Reset</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RobotInspector;
