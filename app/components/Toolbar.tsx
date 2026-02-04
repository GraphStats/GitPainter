'use client';

import {
    Eraser, PaintBucket, Shuffle,
    Download, Heart, Grid3X3, MousePointer2, Blend
} from 'lucide-react';
import { CONTRIBUTION_LEVELS, PresetName } from '../lib/constants';

interface ToolbarProps {
    selectedColor: number;
    setSelectedColor: (c: number) => void;
    brushSize: 1 | 2;
    setBrushSize: (s: 1 | 2) => void;
    onClear: () => void;
    onRandom: () => void;
    onPreset: (p: PresetName) => void;
    onFill: () => void;
    onExport: () => void;
    onOpenGradientModal: () => void;
}

export default function Toolbar({
    selectedColor, setSelectedColor,
    brushSize, setBrushSize,
    onClear, onRandom, onPreset, onFill, onExport, onOpenGradientModal
}: ToolbarProps) {
    return (
        <div className="card flex flex-col gap-6 lg:flex-row lg:items-center justify-between mb-6">

            {/* Color Palette */}
            <div className="flex flex-col gap-2">
                <span className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Ink Level</span>
                <div className="flex items-center gap-2 p-1 bg-black/20 rounded-lg border border-white/5 w-fit">
                    {CONTRIBUTION_LEVELS.map((color, idx) => (
                        <button
                            key={color}
                            onClick={() => setSelectedColor(idx)}
                            className={`w-8 h-8 rounded transition-all duration-200 ${selectedColor === idx ? 'ring-2 ring-white scale-110 shadow-lg' : 'hover:scale-105'}`}
                            style={{ backgroundColor: color }}
                            title={`Level ${idx}`}
                        />
                    ))}
                </div>
            </div>

            <div className="h-8 w-[1px] bg-white/10 hidden lg:block"></div>

            {/* Tools */}
            <div className="flex flex-col gap-2">
                <span className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Tools</span>
                <div className="flex items-center gap-2 flex-wrap">
                    <button onClick={() => setBrushSize(brushSize === 1 ? 2 : 1)} className={`btn btn-secondary px-3 py-1.5 text-xs ${brushSize === 2 ? 'ring-1 ring-[#39d353] text-[#39d353]' : ''}`}>
                        <MousePointer2 size={14} className="mr-2" /> Size {brushSize}x
                    </button>
                    {/* Fill Bucket - Simple implementation for now (fills all empty spots or overwrites) */}
                    <button onClick={onFill} className="btn btn-secondary px-3 py-1.5 text-xs" title="Fill all empty cells">
                        <PaintBucket size={14} className="mr-2" /> Fill
                    </button>
                    <button onClick={onClear} className="btn btn-secondary px-3 py-1.5 text-xs hover:text-red-400">
                        <Eraser size={14} className="mr-2" /> Clear
                    </button>
                    <button onClick={onExport} className="btn btn-secondary px-3 py-1.5 text-xs">
                        <Download size={14} className="mr-2" /> Save JSON
                    </button>
                </div>
            </div>

            <div className="h-8 w-[1px] bg-white/10 hidden lg:block"></div>

            {/* Presets */}
            <div className="flex flex-col gap-2">
                <span className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Presets</span>
                <div className="flex items-center gap-2 flex-wrap">
                    <button onClick={onRandom} className="btn btn-ghost px-2 py-1 text-xs">
                        <Shuffle size={14} className="mr-1" /> Chaos
                    </button>
                    <button onClick={() => onPreset('CHAOS_WAVE')} className="btn btn-ghost px-2 py-1 text-xs">
                        <Shuffle size={14} className="mr-1" /> Chaos Vague
                    </button>
                    <button onClick={() => onPreset('HEART')} className="btn btn-ghost px-2 py-1 text-xs">
                        <Heart size={14} className="mr-1" /> Love
                    </button>
                    <button onClick={() => onPreset('SPACE_INVADER')} className="btn btn-ghost px-2 py-1 text-xs">
                        <Grid3X3 size={14} className="mr-1" /> Retro
                    </button>
                    <button onClick={onOpenGradientModal} className="btn btn-ghost px-2 py-1 text-xs">
                        <Blend size={14} className="mr-1" /> Dégradé
                    </button>
                </div>
            </div>
        </div>
    );
}
