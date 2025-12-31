'use client';

import { Settings, Shield, Clock, Calendar, Zap, Github } from 'lucide-react';

interface SettingsFormProps {
    formData: any;
    setFormData: (data: any) => void;
    loading: boolean;
    onGenerate: () => void;
}

export default function SettingsForm({ formData, setFormData, loading, onGenerate }: SettingsFormProps) {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
    };

    return (
        <div className="card glass-panel w-full max-w-lg mb-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center gap-2 mb-6 border-b border-gray-700/50 pb-4">
                <Settings size={20} className="text-[var(--primary)]" />
                <h3 className="font-semibold text-lg">Configuration</h3>
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                        <Github size={14} /> GitHub Username
                    </label>
                    <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        placeholder="Ex: octocat"
                        className="input-field"
                    />
                </div>

                <div className="flex gap-4">
                    <div className="space-y-2 flex-1">
                        <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                            <Calendar size={14} /> Year to Art
                        </label>
                        <input
                            type="number"
                            name="year"
                            value={formData.year}
                            onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || new Date().getFullYear() })}
                            min="2000"
                            max="2100"
                            className="input-field"
                        />
                    </div>
                    <div className="space-y-2 flex-[2]">
                        <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                            Target Repo
                        </label>
                        <input
                            type="text"
                            name="repo"
                            value={formData.repo}
                            onChange={handleChange}
                            placeholder="Ex: my-art-repo"
                            className="input-field"
                        />
                    </div>
                </div>

                <div className="space-y-2 relative">
                    <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                        <Shield size={14} /> Personal Access Token
                    </label>
                    <input
                        type="password"
                        name="token"
                        value={formData.token}
                        onChange={handleChange}
                        placeholder="ghp_xxxxxxxxxxxx"
                        className="input-field pr-10"
                    />
                    <div className="text-[10px] text-gray-500 mt-1">Requires <span className="text-yellow-500 bg-yellow-500/10 px-1 rounded">repo</span> scope permissions.</div>
                </div>
            </div>

            {/* Advanced Settings Checkboxes */}
            <div className="mt-6 pt-6 border-t border-gray-700/50 space-y-3">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-widest flex items-center gap-2 mb-3">
                    <Zap size={12} /> Advanced Options
                </h4>

                <div className="grid grid-cols-2 gap-4">
                    <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer hover:text-white transition-colors">
                        <input type="checkbox" name="weekendMode" checked={formData.weekendMode} onChange={handleChange} className="accent-[var(--primary)] w-4 h-4 rounded border-gray-700 bg-gray-900" />
                        <span className="flex items-center gap-1.5"><Clock size={12} /> Skip Weekends</span>
                    </label>

                    <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer hover:text-white transition-colors">
                        <input type="checkbox" name="randomizeTime" checked={formData.randomizeTime} onChange={handleChange} className="accent-[var(--primary)] w-4 h-4 rounded border-gray-700 bg-gray-900" />
                        <span className="flex items-center gap-1.5"><ShuffleIcon size={12} /> Randomize Times</span>
                    </label>
                </div>
            </div>

            <button
                onClick={onGenerate}
                disabled={loading}
                className={`btn w-full mt-6 py-3 font-bold text-lg shadow-xl shadow-green-900/20 ${loading ? 'btn-secondary opacity-50' : 'btn-primary'}`}
            >
                {loading ? (
                    <span className="flex items-center gap-2">
                        <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                        Processing...
                    </span>
                ) : (
                    'Deploy to GitHub'
                )}
            </button>
        </div>
    );
}

function ShuffleIcon({ size }: { size: number }) { return <Clock size={size} /> } // Reuse icon for now if blocked, but Shuffle is from lucide.
