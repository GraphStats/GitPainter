'use client';

import { Github, Wand2 } from 'lucide-react';
import { useState, useEffect } from 'react';

interface HeaderProps {
    onOpenSimpleSetup: () => void;
}

export default function Header({ onOpenSimpleSetup }: HeaderProps) {
    const [tilt, setTilt] = useState(0);
    const [pressed, setPressed] = useState(false);

    const handlePress = (e: React.MouseEvent<HTMLAnchorElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width; // 0..1
        const centered = x - 0.5; // -0.5..0.5
        setTilt(centered);
        setPressed(true);
    };

    const handleRelease = () => {
        setPressed(false);
        setTilt(0);
    };

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

            <nav className="flex items-center gap-3">
                <button
                    onClick={onOpenSimpleSetup}
                    className="btn btn-secondary text-sm gap-2 border border-[#30363d] px-3 py-2"
                >
                    <Wand2 size={14} /> Simple Setup
                </button>
                <a
                    href="https://github.com/GraphStats/GitPainter"
                    target="_blank"
                    onMouseDown={handlePress}
                    onMouseUp={handleRelease}
                    onMouseLeave={handleRelease}
                    style={{
                        transform: `translateX(${pressed ? tilt * 8 : 0}px) translateY(${pressed ? 2 : 0}px) rotate(${pressed ? tilt * 4 : 0}deg)`,
                        transition: pressed ? 'transform 60ms ease' : 'transform 160ms ease',
                        transformOrigin: 'center',
                    }}
                    className="btn btn-ghost text-sm gap-2 active:scale-95"
                >
                    <Github size={16} /> Star on GitHub
                </a>
                <div className="h-4 w-[1px] bg-[var(--border)]"></div>
                <span className="px-2 py-1 bg-yellow-500/10 text-yellow-500 text-xs rounded border border-yellow-500/20">
                    v3.2 (latest)
                </span>
            </nav>
        </header>
    );
}
