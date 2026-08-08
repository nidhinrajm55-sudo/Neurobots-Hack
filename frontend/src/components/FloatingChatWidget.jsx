import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send, Terminal, Copy, Sparkles, Zap, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '../utils/api';

const FloatingChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            id: 'fw-1',
            sender: 'bot',
            text: '👋 Need instant security analysis or code remediation? Ask me or paste a website URL below!',
            codeSnippet: null,
            timestamp: new Date().toLocaleTimeString()
        }
    ]);
    const [inputMsg, setInputMsg] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const chatEndRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen, isTyping]);

    const handleSend = async (customText) => {
        const text = customText || inputMsg;
        if (!text || !text.trim()) return;

        const userMessage = {
            id: `fw-user-${Date.now()}`,
            sender: 'user',
            text,
            timestamp: new Date().toLocaleTimeString()
        };

        setMessages(prev => [...prev, userMessage]);
        if (!customText) setInputMsg('');
        setIsTyping(true);

        try {
            const res = await apiClient.sendBotMessage(messages, text);
            setIsTyping(false);
            const botMessage = {
                id: `fw-bot-${Date.now() + 1}`,
                sender: 'bot',
                text: res.reply,
                codeSnippet: res.codeSnippet,
                timestamp: new Date().toLocaleTimeString()
            };
            setMessages(prev => [...prev, botMessage]);
        } catch (err) {
            setIsTyping(false);
            toast.error('Bot error', { description: err.message });
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        toast.success('Code copied!');
    };

    return (
        <div className="fixed bottom-5 right-5 z-50">
            {/* Floating Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="group relative flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full shadow-2xl shadow-blue-600/40 hover:scale-105 active:scale-95 transition-all duration-200"
                title="Open AI Security Advisor"
            >
                <div className="relative">
                    <Bot className="w-6 h-6" />
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full" />
                </div>
                <span className="text-xs font-black uppercase tracking-wider hidden sm:inline">AI Security Bot</span>
            </button>

            {/* Slide-over Drawer Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="fixed bottom-20 right-4 sm:right-6 w-[92vw] sm:w-[420px] h-[540px] theme-card rounded-3xl border border-[var(--color-card-border)] shadow-2xl flex flex-col overflow-hidden z-50"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-[var(--color-card-border)] flex items-center justify-between bg-blue-600 text-white">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/10 rounded-xl">
                                    <Bot className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h4 className="text-xs font-black uppercase tracking-wider">Sentinel-X AI Advisor</h4>
                                    <span className="text-[10px] text-blue-100 font-medium">Real-Time Anomaly & Fix Engine</span>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1.5 hover:bg-white/20 rounded-xl transition-all"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="flex-1 p-4 overflow-y-auto space-y-3 scrollbar-thin scrollbar-thumb-slate-300">
                            {messages.map((m) => (
                                <div
                                    key={m.id}
                                    className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
                                >
                                    <div className={`max-w-[88%] p-3 rounded-2xl text-xs leading-relaxed ${
                                        m.sender === 'user'
                                            ? 'bg-blue-600 text-white rounded-br-none shadow-md'
                                            : 'bg-[var(--color-pill-bg)] theme-text-main border border-[var(--color-card-border)] rounded-bl-none shadow-sm'
                                    }`}>
                                        <div className="whitespace-pre-wrap">{m.text}</div>
                                        {m.codeSnippet && (
                                            <div className="mt-2 pt-2 border-t border-slate-700/40">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-[9px] font-mono text-slate-400 uppercase">Patch Snippet</span>
                                                    <button
                                                        onClick={() => copyToClipboard(m.codeSnippet)}
                                                        className="text-[9px] text-blue-400 font-bold flex items-center gap-1"
                                                    >
                                                        <Copy size={10} /> Copy
                                                    </button>
                                                </div>
                                                <pre className="p-2 bg-slate-950 text-emerald-400 rounded-lg font-mono text-[10px] overflow-x-auto">
                                                    <code>{m.codeSnippet}</code>
                                                </pre>
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-[8px] theme-text-muted mt-0.5">{m.timestamp}</span>
                                </div>
                            ))}

                            {isTyping && (
                                <div className="flex items-center gap-1.5 text-[11px] theme-text-muted">
                                    <Bot size={12} className="text-blue-500 animate-spin" />
                                    <span>AI Assistant is typing...</span>
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Chips */}
                        <div className="p-2 border-t border-[var(--color-card-border)] bg-[var(--color-pill-bg)] flex items-center gap-1.5 overflow-x-auto">
                            <button
                                onClick={() => handleSend('How do I fix missing security headers?')}
                                className="px-2.5 py-1 bg-[var(--color-card-bg)] hover:bg-blue-600 hover:text-white theme-text-muted rounded-full text-[10px] font-bold border border-[var(--color-card-border)] whitespace-nowrap"
                            >
                                🛡️ Fix Headers
                            </button>
                            <button
                                onClick={() => handleSend('Calculate Blast Radius for CORS issue')}
                                className="px-2.5 py-1 bg-[var(--color-card-bg)] hover:bg-blue-600 hover:text-white theme-text-muted rounded-full text-[10px] font-bold border border-[var(--color-card-border)] whitespace-nowrap"
                            >
                                💥 Blast Radius
                            </button>
                        </div>

                        {/* Input */}
                        <div className="p-3 border-t border-[var(--color-card-border)] flex items-center gap-2">
                            <input
                                type="text"
                                value={inputMsg}
                                onChange={(e) => setInputMsg(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Type a message or paste URL..."
                                className="flex-1 px-3 py-2 rounded-xl theme-input border text-xs outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                                onClick={() => handleSend()}
                                disabled={!inputMsg.trim()}
                                className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-md disabled:opacity-40"
                            >
                                <Send size={14} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default FloatingChatWidget;
