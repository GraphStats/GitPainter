'use client';

import { Github, Moon, Sun, Monitor } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Header() {
    return (
        <header className="w-full flex justify-between items-center py-6 animate-fade-in relative z-10">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-[#238636] to-[var(--color-level-1)] rounded-lg shadow-lg shadow-[#238636]/20">
                    <Github className="text-white w-8 h-8" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                        GitPainter
                    </h1>
                    <p className="text-xs text-gray-400 font-mono tracking-wider">COMMIT HISTORY ARTIST</p>
                </div>
            </div>

            <nav className="flex items-center gap-4">
                <a href="https://github.com/GraphStats/GitPainter" target="_blank" className="btn btn-ghost text-sm gap-2">
                    <Github size={16} /> Star on GitHub
                </a>
                <div className="h-4 w-[1px] bg-[var(--border)]"></div>
                <span className="px-2 py-1 bg-yellow-500/10 text-yellow-500 text-xs rounded border border-yellow-500/20">
                    v3.1 (latest)
                </span>
            </nav>
        </header>
    );
}
