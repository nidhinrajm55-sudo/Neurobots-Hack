import React from 'react';

const Card = ({ title, children, className = '' }) => {
    return (
        <div className={`bg-white/80 backdrop-blur-md border border-white/90 rounded-3xl shadow-[0_10px_30px_-5px_rgba(100,116,139,0.1),0_4px_6px_-4px_rgba(100,116,139,0.04)] hover:shadow-[0_15px_35px_-5px_rgba(37,99,235,0.12)] transition-all duration-300 flex flex-col overflow-hidden ${className}`}>
            {title && (
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100/80 flex-shrink-0 bg-white/40">
                    <h3 className="text-sm font-bold text-slate-800 tracking-wider uppercase">
                        {title}
                    </h3>
                    <div className="h-2 w-2 rounded-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.8)] animate-pulse" />
                </div>
            )}
            <div className="text-slate-600 p-6 space-y-4 flex-1 min-h-0">
                {children}
            </div>
        </div>
    );
};

export default Card;
