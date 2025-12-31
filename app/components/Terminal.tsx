'use client';

import { Terminal as TerminalIcon, XCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface TerminalProps {
    logs: Array<{ message: string; type: string }>;
    isOpen: boolean;
}

export default function Terminal({ logs, isOpen }: TerminalProps) {
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs]);

    if (!logs.length && !isOpen) return null;

    return (
        <div className="card w-full bg-[#0d1117] border-[var(--border)] font-mono text-xs md:text-sm shadow-2xl overflow-hidden flex flex-col h-[300px] animate-slide-up p-0">
            <div className="bg-[#161b22] px-4 py-2 border-b border-[var(--border)] flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-400">
                    <TerminalIcon size={14} />
                    <span>deploy_logs.sh</span>
                </div>
                <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
                </div>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-1 font-mono">
                {logs.map((log, i) => (
                    <div key={i} className={`flex items-start gap-2 ${getColor(log.type)} animate-fade-in`}>
                        <span className="opacity-50 select-none">[{new Date().toLocaleTimeString()}]</span>
                        <span className="break-all">{log.message}</span>
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>
        </div>
    );
}

function getColor(type: string) {
    switch (type) {
        case 'error': return 'text-red-400';
        case 'success': return 'text-green-400';
        case 'info': return 'text-blue-400';
        default: return 'text-gray-300';
    }
}
