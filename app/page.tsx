'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import GridEditor from './components/GridEditor';
import Toolbar from './components/Toolbar';
import SettingsForm from './components/SettingsForm';
import Terminal from './components/Terminal';
import {
    createEmptyGrid,
    generatePresetGrid,
    generateGradientGrid,
    renderTextToGrid,
    exportGridToJSON,
    calculateEstimatedCommits,
    GridState
} from './lib/utils';
import { PresetName, GradientDirection } from './lib/constants';
import { Activity, GitCommit, Calendar, Hash, Zap, ArrowLeft, ArrowRight, ArrowUp, ArrowDown, X, Blend, PenLine } from 'lucide-react';

export default function Home() {
    // Core State
    const [grid, setGrid] = useState<GridState>(createEmptyGrid());
    const [selectedColor, setSelectedColor] = useState(1);
    const [brushSize, setBrushSize] = useState<1 | 2>(1);
    const [isDrawing, setIsDrawing] = useState(false);
    const [gradientDirection, setGradientDirection] = useState<GradientDirection>('LEFT_TO_RIGHT');
    const [gradientMaxLevel, setGradientMaxLevel] = useState(4);
    const [isGradientModalOpen, setIsGradientModalOpen] = useState(false);
    const [isWritingModalOpen, setIsWritingModalOpen] = useState(false);
    const [writingText, setWritingText] = useState('HELLO');
    const [writingLevel, setWritingLevel] = useState(4);
    const [isSimpleSetupOpen, setIsSimpleSetupOpen] = useState(false);
    const [simpleStep, setSimpleStep] = useState(0);

    // History State (Undo/Redo)
    const [history, setHistory] = useState<GridState[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    // Settings State
    const [formData, setFormData] = useState({
        token: '',
        username: '',
        repo: '',
        email: '',
        year: new Date().getFullYear(),
        weekendMode: false,
        randomizeTime: false,
    });

    // Execution State
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState<Array<{ message: string; type: string }>>([]);
    const [stats, setStats] = useState({ total: 0, maxDay: 0 });

    // Initialize
    useEffect(() => {
        const initialGrid = createEmptyGrid();
        setGrid(initialGrid);
        addToHistory(initialGrid);

        // Load settings from localStorage
        const savedSettings = localStorage.getItem('gitpainter_settings');
        if (savedSettings) {
            try {
                setFormData(JSON.parse(savedSettings));
            } catch (e) {
                console.error("Failed to parse settings", e);
            }
        }

        // Check for active job on server
        const checkStatus = async () => {
            try {
                const res = await fetch('/api/status');
                const status = await res.json();

                // If a job is running or was recently finished (within 5 seconds), let's show it
                if (status.state === 'generating' || status.state === 'pushing') {
                    setLoading(true);
                    setLogs([{ message: 'Resuming session: Found active background job...', type: 'info' }]);

                    // Start polling
                    const interval = setInterval(async () => {
                        const r = await fetch('/api/status');
                        const s = await r.json();

                        if (s.state === 'generating') {
                            setLogs(prev => {
                                const newLogs = [...prev];
                                if (newLogs.length > 0 && newLogs[newLogs.length - 1].message.includes('Generating')) {
                                    newLogs[newLogs.length - 1] = { message: `Generating commits: ${s.current}/${s.total}`, type: 'info' };
                                    return newLogs;
                                }
                                return [...prev, { message: `Generating commits: ${s.current}/${s.total}`, type: 'info' }];
                            });
                        } else if (s.state === 'pushing') {
                            setLogs(prev => [...prev, { message: 'Pushing to remote repository...', type: 'warning' }]);
                        } else if (s.state === 'done') {
                            setLogs(prev => [...prev, { message: `SUCCESS: Job completed in background!`, type: 'success' }]);
                            setLoading(false);
                            clearInterval(interval);
                        } else if (s.state === 'error') {
                            setLogs(prev => [...prev, { message: `Background job failed.`, type: 'error' }]);
                            setLoading(false);
                            clearInterval(interval);
                        }
                    }, 1000);
                }
            } catch (e) { console.error("Status check failed", e); }
        };
        checkStatus();

    }, []);

    useEffect(() => {
        // Save settings to localStorage whenever they change
        localStorage.setItem('gitpainter_settings', JSON.stringify(formData));
    }, [formData]);


    useEffect(() => {
        // Recalculate stats whenever grid changes
        const total = calculateEstimatedCommits(grid);
        const maxDay = Math.max(...grid.flat());
        setStats({ total, maxDay });
    }, [grid]);

    // History Management
    const addToHistory = (newGrid: GridState) => {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newGrid.map(row => [...row])); // Deep copy
        if (newHistory.length > 20) newHistory.shift(); // Limit history
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    };

    const handleGridChange = (newGrid: GridState) => {
        setGrid(newGrid);
        // We defer history add to mouseUp to avoid spamming history during drag, 
        // but for now simple implementation:
    };

    const handleMouseUp = () => {
        setIsDrawing(false);
        // Add to history only when drawing stops
        addToHistory(grid);
    };

    // Tools
    const handleClear = () => {
        const newGrid = createEmptyGrid();
        handleGridChange(newGrid);
        addToHistory(newGrid);
    };

    const handleFill = () => {
        const newGrid = grid.map(row => row.map(cell => cell === 0 ? selectedColor : cell));
        handleGridChange(newGrid);
        addToHistory(newGrid);
    };

    const handleRandom = () => {
        const newGrid = generatePresetGrid('RANDOM_SCATTER');
        handleGridChange(newGrid);
        addToHistory(newGrid);
    };

    const handlePreset = (type: PresetName) => {
        const newGrid = generatePresetGrid(type);
        handleGridChange(newGrid);
        addToHistory(newGrid);
    };

    const handleApplyGradient = () => {
        const maxLevel = Math.max(gradientMaxLevel, 1);
        const newGrid = generateGradientGrid(gradientDirection, maxLevel);
        handleGridChange(newGrid);
        addToHistory(newGrid);

        const directionLabels: Record<GradientDirection, string> = {
            LEFT_TO_RIGHT: 'gauche -> droite',
            RIGHT_TO_LEFT: 'droite -> gauche',
            TOP_TO_BOTTOM: 'haut -> bas',
            BOTTOM_TO_TOP: 'bas -> haut',
        };

        setLogs(prev => [...prev, { message: `Dégradé appliqué (${directionLabels[gradientDirection]}, intensité max ${maxLevel}).`, type: 'info' }]);
        setIsGradientModalOpen(false);
    };

    const handleApplyWriting = () => {
        const text = writingText.trim();
        if (!text) {
            setLogs(prev => [...prev, { message: 'Écriture: texte vide.', type: 'error' }]);
            return;
        }
        const level = Math.max(1, Math.min(4, writingLevel));
        const newGrid = renderTextToGrid(text, level);
        handleGridChange(newGrid);
        addToHistory(newGrid);
        setLogs(prev => [...prev, { message: `Texte "${text}" appliqué (niveau ${level}).`, type: 'info' }]);
        setIsWritingModalOpen(false);
    };

    // Generation Logic
    const handleGenerate = async () => {
        if (!formData.token || !formData.username || !formData.repo) {
            setLogs(prev => [...prev, { message: 'Setup Failed: Please check your credentials.', type: 'error' }]);
            return;
        }

        setLoading(true);
        setLogs([{ message: 'Initializing sequence...', type: 'info' }]);

        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ grid, ...formData }),
            });

            if (!response.body) throw new Error('No response from backend server.');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n\n');

                for (const line of lines) {
                    if (!line.startsWith('data: ')) continue;
                    try {
                        const data = JSON.parse(line.replace('data: ', ''));

                        if (data.error) {
                            setLogs(prev => [...prev, { message: `Error: ${data.error}`, type: 'error' }]);
                            setLoading(false);
                            return;
                        }

                        if (data.status === 'generating') {
                            // Update last log if it's progress, or push new
                            setLogs(prev => {
                                const newLogs = [...prev];
                                if (newLogs.length > 0 && newLogs[newLogs.length - 1].message.includes('Generating')) {
                                    newLogs[newLogs.length - 1] = { message: `Generating commits: ${data.current}/${data.total} (${Math.round(data.current / data.total * 100)}%)`, type: 'info' };
                                    return newLogs;
                                }
                                return [...prev, { message: `Generating commits: ${data.current}/${data.total}`, type: 'info' }];
                            });
                        } else if (data.status === 'pushing') {
                            setLogs(prev => [...prev, { message: 'Pushing to remote repository...', type: 'warning' }]);
                        } else if (data.status === 'done') {
                            setLogs(prev => [...prev, { message: `SUCCESS: ${data.commitCount} commits deployed to ${formData.username}/${formData.repo}!`, type: 'success' }]);
                            setLoading(false);
                        }
                    } catch (e) {
                        console.error('Error parsing stream', e);
                    }
                }
            }
        } catch (err: any) {
            setLogs(prev => [...prev, { message: `Connection Error: ${err.message}`, type: 'error' }]);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--background)] flex flex-col items-center" onMouseUp={handleMouseUp} onMouseLeave={() => setIsDrawing(false)}>
            <div className="w-full max-w-[1400px] px-4 md:px-8 pb-20 flex flex-col items-center">
                <Header onOpenSimpleSetup={() => setIsSimpleSetupOpen(true)} />

                {!isSimpleSetupOpen ? (
                    <>
                        {/* Info Card */}
                        <div className="w-full mb-6 p-4 rounded-xl bg-blue-900/10 border border-blue-500/20 backdrop-blur-sm animate-fade-in flex items-start gap-4">
                            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                                <Zap size={20} />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-blue-100 mb-1">Create Your Legacy</h3>
                                <p className="text-sm text-blue-200/70 leading-relaxed">
                                    Paint your contributions history, select a target year, and deploy directly to GitHub.
                                    <br />
                                </p>
                            </div>
                        </div>

                        {/* Stats Row */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full mb-6 animate-fade-in">
                            <div className="card flex items-center gap-4 py-4 px-6">
                                <div className="p-3 rounded-full bg-blue-500/10 text-blue-400"><GitCommit /></div>
                                <div>
                                    <p className="text-2xl font-bold font-mono">{stats.total}</p>
                                    <p className="text-xs text-gray-500 uppercase tracking-wider">Est. Commits</p>
                                </div>
                            </div>
                            <div className="card flex items-center gap-4 py-4 px-6">
                                <div className="p-3 rounded-full bg-green-500/10 text-green-400"><Calendar /></div>
                                <div>
                                    <p className="text-2xl font-bold font-mono">1 Yr</p>
                                    <p className="text-xs text-gray-500 uppercase tracking-wider">Timeframe</p>
                                </div>
                            </div>
                            <div className="card flex items-center gap-4 py-4 px-6">
                                <div className="p-3 rounded-full bg-purple-500/10 text-purple-400"><Activity /></div>
                                <div>
                                    <p className="text-2xl font-bold font-mono">High</p>
                                    <p className="text-xs text-gray-500 uppercase tracking-wider">Intensity</p>
                                </div>
                            </div>
                            <div className="card flex items-center gap-4 py-4 px-6">
                                <div className="p-3 rounded-full bg-orange-500/10 text-orange-400"><Hash /></div>
                                <div>
                                    <p className="text-2xl font-bold font-mono">{formData.repo || '...'}</p>
                                    <p className="text-xs text-gray-500 uppercase tracking-wider">Target Repo</p>
                                </div>
                            </div>
                        </div>

                        {/* Main Workspace */}
                        <div className="flex flex-col xl:flex-row gap-6 w-full">
                            {/* Left: Editor */}
                            <div className="flex-1 flex flex-col gap-2">
                                <Toolbar
                                    selectedColor={selectedColor}
                                    setSelectedColor={setSelectedColor}
                                    brushSize={brushSize}
                                    setBrushSize={setBrushSize}
                                    onClear={handleClear}
                                    onRandom={handleRandom}
                                    onPreset={handlePreset}
                                    onFill={handleFill}
                                    onExport={() => exportGridToJSON(grid)}
                                    onOpenGradientModal={() => setIsGradientModalOpen(true)}
                                    onOpenWritingModal={() => setIsWritingModalOpen(true)}
                                />
                                <div className="card shadow-2xl shadow-black/50 border border-white/5 relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-green-500/5 pointer-events-none" />
                                    <GridEditor
                                        grid={grid}
                                        setGrid={handleGridChange}
                                        selectedColor={selectedColor}
                                        isDrawing={isDrawing}
                                        setIsDrawing={setIsDrawing}
                                        brushSize={brushSize}
                                    />
                                </div>
                                {/* Terminal Output */}
                                <Terminal logs={logs} isOpen={logs.length > 0} />
                            </div>

                            {/* Right: Settings */}
                            <div className="w-full xl:w-[400px] flex-shrink-0 flex flex-col items-center">
                                <div className="sticky top-6 w-full flex flex-col items-center">
                                    <SettingsForm
                                        formData={formData}
                                        setFormData={setFormData}
                                        loading={loading}
                                        onGenerate={handleGenerate}
                                    />
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="w-full max-w-5xl mt-6">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <p className="text-xs uppercase tracking-widest text-gray-500">Assistant</p>
                                <h2 className="text-2xl font-bold">Simple Setup</h2>
                            </div>
                            <button className="btn btn-secondary" onClick={() => setIsSimpleSetupOpen(false)}>Quitter</button>
                        </div>

                        <div className="grid md:grid-cols-4 gap-4 mb-6">
                            {['Identité', 'Token', 'Cible', 'Dessine'].map((label, idx) => (
                                <div
                                    key={label}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${simpleStep === idx ? 'border-green-500 bg-green-500/10 text-white' : 'border-[#30363d] text-gray-400'}`}
                                >
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${simpleStep === idx ? 'bg-green-500 text-black' : 'bg-[#161b22] border border-[#30363d]'}`}>
                                        {idx + 1}
                                    </div>
                                    <span>{label}</span>
                                </div>
                            ))}
                        </div>

                        <div className="card">
                            {simpleStep === 0 && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm text-gray-400">GitHub Username</label>
                                        <input
                                            className="input-field mt-1"
                                            value={formData.username}
                                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                            placeholder="octocat"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-400">Email</label>
                                        <input
                                            type="email"
                                            className="input-field mt-1"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            placeholder="you@example.com"
                                        />
                                    </div>
                                </div>
                            )}

                            {simpleStep === 1 && (
                                <div className="space-y-3">
                                    <label className="text-sm text-gray-400">Token (PAT)</label>
                                    <input
                                        type="password"
                                        className="input-field"
                                        value={formData.token}
                                        onChange={(e) => setFormData({ ...formData, token: e.target.value })}
                                        placeholder="ghp_xxxxx"
                                    />
                                    <div className="text-[11px] text-gray-500">Scope requis : repo</div>
                                </div>
                            )}

                            {simpleStep === 2 && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm text-gray-400">Target Repo</label>
                                        <input
                                            className="input-field mt-1"
                                            value={formData.repo}
                                            onChange={(e) => setFormData({ ...formData, repo: e.target.value })}
                                            placeholder="my-art-repo"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-400">Year</label>
                                        <input
                                            type="number"
                                            className="input-field mt-1"
                                            value={formData.year}
                                            onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value, 10) || new Date().getFullYear() })}
                                            min={2000}
                                            max={2100}
                                        />
                                    </div>
                                </div>
                            )}

                            {simpleStep === 3 && (
                                <div className="space-y-4">
                                    <p className="text-sm text-gray-400">Dessine ton graphique de contributions :</p>
                                    <Toolbar
                                        selectedColor={selectedColor}
                                        setSelectedColor={setSelectedColor}
                                        brushSize={brushSize}
                                        setBrushSize={setBrushSize}
                                        onClear={handleClear}
                                        onRandom={handleRandom}
                                        onPreset={handlePreset}
                                        onFill={handleFill}
                                        onExport={() => exportGridToJSON(grid)}
                                        onOpenGradientModal={() => setIsGradientModalOpen(true)}
                                        onOpenWritingModal={() => setIsWritingModalOpen(true)}
                                    />
                                    <div className="card border border-[#334155] bg-[#0f1622] shadow-lg p-4">
                                        <GridEditor
                                            grid={grid}
                                            setGrid={handleGridChange}
                                            selectedColor={selectedColor}
                                            isDrawing={isDrawing}
                                            setIsDrawing={setIsDrawing}
                                            brushSize={brushSize}
                                        />
                                    </div>
                                    <Terminal logs={logs} isOpen={logs.length > 0} />
                                </div>
                            )}
                        </div>

                        <div className="flex justify-between items-center mt-6">
                            <button className="btn btn-secondary" onClick={() => setIsSimpleSetupOpen(false)}>Annuler</button>
                            <div className="flex items-center gap-2">
                                {simpleStep > 0 && (
                                    <button className="btn btn-secondary" onClick={() => setSimpleStep((s) => Math.max(0, s - 1))}>Précédent</button>
                                )}
                                {simpleStep < 3 && (
                                    <button className="btn btn-primary" onClick={() => setSimpleStep((s) => Math.min(3, s + 1))}>Suivant</button>
                                )}
                                {simpleStep === 3 && (
                                    <button className="btn btn-primary" onClick={() => { setIsSimpleSetupOpen(false); handleGenerate(); }}>
                                        Lancer
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Gradient Direction Modal */}
            {isGradientModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center px-4" onClick={() => setIsGradientModalOpen(false)}>
                    <div
                        className="bg-[#0f1622] border border-[#30363d] rounded-xl shadow-2xl w-full max-w-md p-6 relative animate-fade-in"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setIsGradientModalOpen(false)}
                            className="absolute right-3 top-3 text-gray-500 hover:text-white"
                            aria-label="Fermer"
                        >
                            <X size={16} />
                        </button>

                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-2 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20">
                                <Blend size={16} />
                            </div>
                            <div>
                                <h3 className="font-semibold">Mode dégradé</h3>
                                <p className="text-xs text-gray-400">Choisis la direction puis applique au canvas.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {([
                                { value: 'LEFT_TO_RIGHT' as GradientDirection, label: 'Gauche → Droite', icon: <ArrowRight size={14} /> },
                                { value: 'RIGHT_TO_LEFT' as GradientDirection, label: 'Droite → Gauche', icon: <ArrowLeft size={14} /> },
                                { value: 'TOP_TO_BOTTOM' as GradientDirection, label: 'Haut → Bas', icon: <ArrowDown size={14} /> },
                                { value: 'BOTTOM_TO_TOP' as GradientDirection, label: 'Bas → Haut', icon: <ArrowUp size={14} /> },
                            ]).map(option => (
                                <button
                                    key={option.value}
                                    onClick={() => setGradientDirection(option.value)}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                                        gradientDirection === option.value
                                            ? 'border-green-500 bg-green-500/10 text-green-100'
                                            : 'border-[#30363d] bg-[#0b1018] text-gray-300 hover:border-gray-600'
                                    }`}
                                >
                                    {option.icon}
                                    <span className="text-sm">{option.label}</span>
                                </button>
                            ))}
                        </div>

                        <div className="mt-4">
                            <label className="text-xs text-gray-400 flex justify-between mb-1">
                                <span>Intensité maximale</span>
                                <span className="text-green-300 font-semibold">Niveau {gradientMaxLevel}</span>
                            </label>
                            <input
                                type="range"
                                min={1}
                                max={4}
                                step={1}
                                value={gradientMaxLevel}
                                onChange={(e) => setGradientMaxLevel(parseInt(e.target.value, 10))}
                                className="w-full accent-[var(--primary)]"
                            />
                        </div>

                        <button
                            onClick={handleApplyGradient}
                            className="btn btn-primary w-full mt-4 py-2 font-semibold"
                        >
                            Appliquer le dégradé
                        </button>
                    </div>
                </div>
            )}

            {/* Writing Modal */}
            {isWritingModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center px-4" onClick={() => setIsWritingModalOpen(false)}>
                    <div
                        className="bg-[#0f1622] border border-[#30363d] rounded-xl shadow-2xl w-full max-w-md p-6 relative animate-fade-in"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setIsWritingModalOpen(false)}
                            className="absolute right-3 top-3 text-gray-500 hover:text-white"
                            aria-label="Fermer"
                        >
                            <X size={16} />
                        </button>

                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-300 border border-blue-500/20">
                                <PenLine size={16} />
                            </div>
                            <div>
                                <h3 className="font-semibold">Mode écriture</h3>
                                <p className="text-xs text-gray-400">Tape le texte à dessiner sur la grille (A-Z, 0-9).</p>
                            </div>
                        </div>

                        <label className="text-xs text-gray-400 mb-2 block">Texte</label>
                        <input
                            type="text"
                            value={writingText}
                            onChange={(e) => setWritingText(e.target.value)}
                            maxLength={20}
                            className="input-field mb-4"
                            placeholder="HELLO WORLD"
                        />

                        <div className="mb-4">
                            <label className="text-xs text-gray-400 mb-2 block">Intensité (niveau 1-4)</label>
                            <input
                                type="range"
                                min={1}
                                max={4}
                                step={1}
                                value={writingLevel}
                                onChange={(e) => setWritingLevel(parseInt(e.target.value, 10))}
                                className="w-full accent-[var(--primary)]"
                            />
                            <div className="text-[11px] text-gray-400 mt-1">Niveau actuel : {writingLevel}</div>
                        </div>

                        <button
                            onClick={handleApplyWriting}
                            className="btn btn-primary w-full py-2 font-semibold"
                        >
                            Dessiner le texte
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
}
