import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, ShieldAlert, ShieldCheck, Cpu, Play, CheckCircle2, Copy, AlertTriangle, ArrowRight, RefreshCw, Terminal, Sparkles, Layers, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '../utils/api';

const SecurityBot = () => {
    const [targetUrl, setTargetUrl] = useState('https://neurobots-hack.vercel.app');
    const [permission, setPermission] = useState('passive');
    const [isScanning, setIsScanning] = useState(false);
    const [scanProgress, setScanProgress] = useState(0);
    const [currentStepText, setCurrentStepText] = useState('');
    const [scanData, setScanData] = useState(null);

    const [messages, setMessages] = useState([
        {
            id: 'm-1',
            sender: 'bot',
            text: 'Hello! I am your Sentinel-X AI Security Advisor. Upload or paste your website URL above, select scan permissions, and click "Run AI Audit" to diagnose vulnerabilities, compute blast radius, and generate 1-click code fixes.',
            codeSnippet: null,
            timestamp: new Date().toLocaleTimeString()
        }
    ]);
    const [inputMessage, setInputMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const chatEndRef = useRef(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    const handleRunScan = async (e) => {
        if (e) e.preventDefault();
        if (!targetUrl || !targetUrl.trim()) {
            toast.error('Please enter a valid website URL');
            return;
        }

        setIsScanning(true);
        setScanProgress(5);
        setCurrentStepText('Initializing URL target connection & TLS handshake...');

        const steps = [
            { progress: 25, text: 'Fetching HTTP response headers & Content-Security-Policy...' },
            { progress: 50, text: 'Running Isolation Forest Anomaly Detection model...' },
            { progress: 75, text: 'Computing Blast Radius & API dependency graph...' },
            { progress: 90, text: 'Generating Remediation Code Patches...' }
        ];

        for (const step of steps) {
            await new Promise((r) => setTimeout(r, 600));
            setScanProgress(step.progress);
            setCurrentStepText(step.text);
        }

        try {
            const result = await apiClient.analyzeUrl(targetUrl, permission);
            setScanProgress(100);
            setIsScanning(false);
            setScanData(result);

            toast.success('AI Security Audit Complete!', {
                description: `Discovered ${result.findings.length} security items on ${result.domain}`
            });

            // Add bot summary message to chat
            const summaryMsg = {
                id: `m-${Date.now()}`,
                sender: 'bot',
                text: `🔍 **Audit Completed for ${result.domain}** (${permission.toUpperCase()} mode)\n\n• **Security Score**: ${result.score}/100\n• **Critical Items**: ${result.findings.filter(f => f.severity === 'CRITICAL').length}\n• **Status**: ${result.status}\n\nAsk me anything about these findings or click any prompt below for instant resolution code!`,
                codeSnippet: null,
                timestamp: new Date().toLocaleTimeString()
            };
            setMessages(prev => [...prev, summaryMsg]);
        } catch (err) {
            setIsScanning(false);
            toast.error('Failed to run AI audit', { description: err.message });
        }
    };

    const handleSendMessage = async (customText) => {
        const textToSend = customText || inputMessage;
        if (!textToSend || !textToSend.trim()) return;

        const userMsg = {
            id: `msg-${Date.now()}`,
            sender: 'user',
            text: textToSend,
            timestamp: new Date().toLocaleTimeString()
        };

        setMessages(prev => [...prev, userMsg]);
        if (!customText) setInputMessage('');
        setIsTyping(true);

        try {
            const res = await apiClient.sendBotMessage(messages, textToSend);
            setIsTyping(false);
            const botMsg = {
                id: `msg-${Date.now() + 1}`,
                sender: 'bot',
                text: res.reply,
                codeSnippet: res.codeSnippet,
                timestamp: new Date().toLocaleTimeString()
            };
            setMessages(prev => [...prev, botMsg]);
        } catch (err) {
            setIsTyping(false);
            toast.error('Failed to get bot response', { description: err.message });
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        toast.success('Code copied to clipboard!');
    };

    const promptChips = [
        'How do I fix the Critical missing headers?',
        'Calculate Blast Radius for CORS vulnerability',
        'Show 1-click FastAPI middleware patch',
        'Generate Next.js security headers config'
    ];

    return (
        <div className="space-y-6 w-full pb-6">
            {/* Header Banner */}
            <div className="theme-card rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-xl border border-[var(--color-card-border)]">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="p-3.5 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl text-white shadow-lg shadow-blue-500/30">
                            <Bot className="w-8 h-8" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl sm:text-3xl font-black tracking-tight theme-text-main">AI Security & URL Audit Assistant</h1>
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-blue-500/20 text-blue-500 border border-blue-500/30">
                                    ML Copilot
                                </span>
                            </div>
                            <p className="text-xs sm:text-sm theme-text-muted mt-1">
                                Paste any website URL, set inspection permissions, and run instant ML diagnostic models to identify vulnerabilities & solutions.
                            </p>
                        </div>
                    </div>
                </div>

                {/* URL Scan Bar */}
                <form onSubmit={handleRunScan} className="mt-6 pt-6 border-t border-[var(--color-card-border)] grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                    <div className="md:col-span-6 relative">
                        <input
                            type="url"
                            value={targetUrl}
                            onChange={(e) => setTargetUrl(e.target.value)}
                            placeholder="https://your-website.com"
                            required
                            className="w-full px-4 py-3 rounded-2xl theme-input border text-sm font-mono font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-inner"
                        />
                    </div>

                    <div className="md:col-span-3">
                        <select
                            value={permission}
                            onChange={(e) => setPermission(e.target.value)}
                            className="w-full px-4 py-3 rounded-2xl theme-input border text-xs font-bold uppercase tracking-wider focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                        >
                            <option value="passive">🟢 Passive Inspection (Zero-Risk)</option>
                            <option value="active">🟡 Active Health Probe (Latency/API)</option>
                            <option value="deep">🔴 Authorized Pentest Simulation</option>
                        </select>
                    </div>

                    <div className="md:col-span-3">
                        <button
                            type="submit"
                            disabled={isScanning}
                            className="w-full py-3 px-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                        >
                            {isScanning ? (
                                <>
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    <span>Scanning...</span>
                                </>
                            ) : (
                                <>
                                    <Play className="w-4 h-4 fill-current" />
                                    <span>Run AI Audit</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>

                {/* Progress Bar when scanning */}
                <AnimatePresence>
                    {isScanning && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-4 pt-4 border-t border-[var(--color-card-border)] space-y-2"
                        >
                            <div className="flex justify-between items-center text-xs font-bold theme-text-muted">
                                <span className="flex items-center gap-2">
                                    <Cpu className="w-4 h-4 text-blue-500 animate-pulse" />
                                    {currentStepText}
                                </span>
                                <span>{scanProgress}%</span>
                            </div>
                            <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300 rounded-full"
                                    style={{ width: `${scanProgress}%` }}
                                />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Split Screen Layout: Diagnostic Panel (Left) & Chat Assistant (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Column: Diagnostic Findings Report */}
                <div className="lg:col-span-6 space-y-4">
                    {scanData ? (
                        <div className="space-y-4">
                            {/* Score Card */}
                            <div className="theme-card rounded-3xl p-5 border border-[var(--color-card-border)] shadow-md flex items-center justify-between">
                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Target Audit Score</span>
                                    <h3 className="text-xl font-bold theme-text-main mt-0.5">{scanData.domain}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                            {scanData.permission.toUpperCase()} MODE
                                        </span>
                                        <span className="text-xs theme-text-muted">{scanData.status}</span>
                                    </div>
                                </div>
                                <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center font-black text-xl shadow-lg ${
                                    scanData.score >= 80 ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30' :
                                    scanData.score >= 60 ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30' :
                                    'bg-red-500/20 text-red-500 border border-red-500/30'
                                }`}>
                                    <span>{scanData.score}</span>
                                    <span className="text-[9px] uppercase tracking-tighter opacity-80">/ 100</span>
                                </div>
                            </div>

                            {/* Findings List */}
                            <div className="space-y-3">
                                <h3 className="text-xs font-black uppercase tracking-wider theme-text-muted px-1 flex items-center gap-2">
                                    <ShieldAlert className="w-4 h-4 text-blue-500" />
                                    Detected Vulnerabilities & Recommendations
                                </h3>

                                {scanData.findings.map((item) => (
                                    <div key={item.id} className="theme-card rounded-2xl p-4 border border-[var(--color-card-border)] shadow-sm space-y-3 hover:shadow-md transition-all">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${
                                                    item.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                                                    item.severity === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                                                    'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                                }`}>
                                                    {item.severity}
                                                </span>
                                                <h4 className="text-sm font-bold theme-text-main mt-1.5">{item.title}</h4>
                                            </div>
                                            <span className="text-[11px] font-mono theme-text-muted bg-[var(--color-pill-bg)] px-2 py-1 rounded-lg border border-[var(--color-card-border)]">
                                                {item.affected_endpoint}
                                            </span>
                                        </div>

                                        <p className="text-xs theme-text-muted leading-relaxed">{item.description}</p>

                                        <div className="pt-2 border-t border-[var(--color-card-border)] flex items-center justify-between text-xs">
                                            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                                                <Zap size={12} /> Blast Radius: {item.blast_radius}
                                            </span>

                                            <button
                                                onClick={() => copyToClipboard(item.solution)}
                                                className="px-3 py-1 bg-blue-600/10 hover:bg-blue-600/20 text-blue-500 rounded-xl font-bold text-[11px] flex items-center gap-1.5 transition-all"
                                            >
                                                <Copy size={12} />
                                                <span>Copy Fix</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="theme-card rounded-3xl p-10 border border-[var(--color-card-border)] shadow-md text-center space-y-4">
                            <div className="w-16 h-16 bg-blue-600/10 text-blue-500 rounded-2xl flex items-center justify-center mx-auto">
                                <Sparkles className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold theme-text-main">No Audit Run Yet</h3>
                                <p className="text-xs theme-text-muted mt-1 max-w-sm mx-auto">
                                    Enter your website URL in the top bar and click <strong>"Run AI Audit"</strong> to generate real-time vulnerability reports & blast radius metrics.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: AI Chatbot Assistant */}
                <div className="lg:col-span-6 theme-card rounded-3xl border border-[var(--color-card-border)] shadow-xl flex flex-col h-[620px] overflow-hidden">
                    {/* Chat Header */}
                    <div className="p-4 border-b border-[var(--color-card-border)] flex items-center justify-between bg-[var(--color-pill-bg)]">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md">
                                <Bot className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold theme-text-main">Sentinel-X AI Advisor</h3>
                                <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    ONLINE • ISOLATION FOREST & ML ENGINE ACTIVE
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Chat Messages Body */}
                    <div className="flex-1 p-4 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-slate-300">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                            >
                                <div className={`max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed ${
                                    msg.sender === 'user'
                                        ? 'bg-blue-600 text-white rounded-br-none shadow-md'
                                        : 'bg-[var(--color-pill-bg)] theme-text-main border border-[var(--color-card-border)] rounded-bl-none shadow-sm'
                                }`}>
                                    <div className="whitespace-pre-wrap">{msg.text}</div>

                                    {msg.codeSnippet && (
                                        <div className="mt-3 pt-2 border-t border-slate-700/40 relative">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                                    <Terminal size={12} /> Solution Snippet
                                                </span>
                                                <button
                                                    onClick={() => copyToClipboard(msg.codeSnippet)}
                                                    className="text-[10px] text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1"
                                                >
                                                    <Copy size={10} /> Copy
                                                </button>
                                            </div>
                                            <pre className="p-3 bg-slate-950 text-emerald-400 rounded-xl font-mono text-[11px] overflow-x-auto border border-slate-800">
                                                <code>{msg.codeSnippet}</code>
                                            </pre>
                                        </div>
                                    )}
                                </div>
                                <span className="text-[9px] theme-text-muted mt-1 px-1">{msg.timestamp}</span>
                            </div>
                        ))}

                        {isTyping && (
                            <div className="flex items-center gap-2 text-xs theme-text-muted bg-[var(--color-pill-bg)] px-3 py-2 rounded-2xl w-fit border border-[var(--color-card-border)]">
                                <Bot size={14} className="text-blue-500 animate-bounce" />
                                <span>Sentinel-X AI is computing response...</span>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Quick Prompt Chips */}
                    <div className="p-2 border-t border-[var(--color-card-border)] bg-[var(--color-pill-bg)] flex items-center gap-2 overflow-x-auto scrollbar-none">
                        {promptChips.map((chip, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleSendMessage(chip)}
                                className="whitespace-nowrap px-3 py-1 bg-[var(--color-card-bg)] hover:bg-blue-600 hover:text-white theme-text-muted rounded-full text-[10px] font-bold border border-[var(--color-card-border)] transition-all shadow-sm flex-shrink-0"
                            >
                                {chip}
                            </button>
                        ))}
                    </div>

                    {/* Chat Input Bar */}
                    <div className="p-3 border-t border-[var(--color-card-border)] flex items-center gap-2">
                        <input
                            type="text"
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder="Ask AI bot about fixes, CORS, or Blast Radius..."
                            className="flex-1 px-4 py-2.5 rounded-2xl theme-input border text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <button
                            onClick={() => handleSendMessage()}
                            disabled={!inputMessage.trim()}
                            className="p-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl shadow-md transition-all disabled:opacity-40"
                        >
                            <Send size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SecurityBot;
