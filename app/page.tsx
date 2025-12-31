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
    exportGridToJSON,
    calculateEstimatedCommits,
    GridState
} from './lib/utils';
import { PresetName, MOCK_LOGS } from './lib/constants';
import { Activity, GitCommit, Calendar, Hash, Zap } from 'lucide-react';

export default function Home() {
    // Core State
    const [grid, setGrid] = useState<GridState>(createEmptyGrid());
    const [selectedColor, setSelectedColor] = useState(1);
    const [brushSize, setBrushSize] = useState<1 | 2>(1);
    const [isDrawing, setIsDrawing] = useState(false);

    // History State (Undo/Redo)
    const [history, setHistory] = useState<GridState[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    // Settings State
    const [formData, setFormData] = useState({
        token: '',
        username: '',
        repo: '',
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
                <Header />

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
                            <span className="text-green-400 font-medium inline-flex items-center gap-1 mt-1">
                                <Activity size={12} /> Background Ready: You can safely close this tab while generating.
                            </span>
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

                            <div className="mt-2 w-full p-6 rounded-2xl bg-gradient-to-br from-green-900/20 to-emerald-900/10 border border-green-500/20 text-center">
                                <h4 className="text-green-400 font-bold mb-2">Did you know?</h4>
                                <p className="text-sm text-green-200/70">
                                    The bot runs on the server. Once you click "Deploy", you can close this window and the magic will continue!
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
