import { GRID_COLS, GRID_ROWS, GradientDirection, PresetName } from './constants';

export type GridState = number[][];
export interface LineGraphPresetConfig {
    curve: number[];
    thickness: number;
    smoothing: number;
    jitter: number;
}

export interface PresetExportData {
    type: 'LINE_GRAPH';
    config: LineGraphPresetConfig;
}

interface GridExportPayload {
    version: 1;
    grid: GridState;
    preset?: PresetExportData;
}

export const createEmptyGrid = (): GridState =>
    Array(GRID_ROWS).fill(0).map(() => Array(GRID_COLS).fill(0));

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const normalizeCurve = (curve: number[], targetLength: number): number[] => {
    if (!Array.isArray(curve) || curve.length === 0) {
        return Array(targetLength).fill(0.5);
    }

    const source = curve.map((v) => clamp(Number.isFinite(v) ? v : 0.5, 0, 1));
    if (source.length === targetLength) return source;
    if (targetLength <= 1) return [source[0]];

    const srcMax = source.length - 1;
    const dstMax = targetLength - 1;
    return Array.from({ length: targetLength }, (_, i) => {
        const t = (i / dstMax) * srcMax;
        const left = Math.floor(t);
        const right = Math.min(srcMax, left + 1);
        const frac = t - left;
        return source[left] * (1 - frac) + source[right] * frac;
    });
};

const movingAverage = (values: number[], windowSize: number): number[] => {
    const size = Math.max(1, Math.floor(windowSize));
    if (size <= 1) return [...values];
    const radius = Math.floor(size / 2);

    return values.map((_, idx) => {
        let total = 0;
        let count = 0;
        for (let i = idx - radius; i <= idx + radius; i++) {
            const safe = clamp(i, 0, values.length - 1);
            total += values[safe];
            count++;
        }
        return total / Math.max(count, 1);
    });
};

export const generateLineGraphGrid = (config: LineGraphPresetConfig): GridState => {
    const grid = createEmptyGrid();
    const thickness = clamp(Math.round(config.thickness || 2), 1, GRID_ROWS);
    const smoothing = clamp(Math.round(config.smoothing || 0), 0, GRID_COLS);
    const jitter = clamp(config.jitter || 0, 0, 0.2);
    const normalizedCurve = normalizeCurve(config.curve, GRID_COLS);
    const curve = smoothing > 1 ? movingAverage(normalizedCurve, smoothing) : normalizedCurve;

    for (let c = 0; c < GRID_COLS; c++) {
        const noise = jitter > 0 ? (Math.random() * 2 - 1) * jitter : 0;
        const y = clamp(curve[c] + noise, 0, 1);
        const centerRow = Math.round((1 - y) * (GRID_ROWS - 1));

        for (let r = 0; r < GRID_ROWS; r++) {
            const distance = Math.abs(r - centerRow);
            let level = 0;

            if (distance === 0) level = 4;
            else if (distance === 1) level = 3;
            else if (distance <= thickness) level = 2;

            if (level > 0) grid[r][c] = Math.max(grid[r][c], level);
        }
    }

    return grid;
};

export const exportGridToJSON = (grid: GridState, preset?: PresetExportData) => {
    const payload: GridExportPayload | GridState = preset ? { version: 1, grid, preset } : grid;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "commit_pattern.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
};

export const importGridFromJSON = (rawJSON: string): { grid: GridState; preset?: PresetExportData } => {
    const parsed = JSON.parse(rawJSON);
    const payload = Array.isArray(parsed) ? { grid: parsed as GridState } : parsed;
    const grid = payload?.grid;

    if (!Array.isArray(grid) || grid.length !== GRID_ROWS) {
        throw new Error(`Invalid grid format: expected ${GRID_ROWS} rows.`);
    }

    const normalizedGrid: GridState = grid.map((row: any) => {
        if (!Array.isArray(row) || row.length !== GRID_COLS) {
            throw new Error(`Invalid grid format: expected ${GRID_COLS} columns.`);
        }
        return row.map((cell: any) => clamp(Math.round(Number(cell) || 0), 0, 4));
    });

    const preset = payload?.preset;
    if (preset?.type === 'LINE_GRAPH' && preset.config) {
        return {
            grid: normalizedGrid,
            preset: {
                type: 'LINE_GRAPH',
                config: {
                    curve: normalizeCurve(preset.config.curve, GRID_COLS),
                    thickness: clamp(Math.round(preset.config.thickness || 2), 1, GRID_ROWS),
                    smoothing: clamp(Math.round(preset.config.smoothing || 0), 0, GRID_COLS),
                    jitter: clamp(Number(preset.config.jitter) || 0, 0, 0.2),
                },
            },
        };
    }

    return { grid: normalizedGrid };
};

export const calculateEstimatedCommits = (grid: GridState, intensity: number = 1): number => {
    return grid.flat().reduce((acc, cell) => acc + (cell * intensity * 2), 0);
};

export const generateGradientGrid = (direction: GradientDirection, maxLevel: number): GridState => {
    const clampedMax = Math.max(0, Math.min(4, Math.round(maxLevel)));
    const colMax = Math.max(GRID_COLS - 1, 1);
    const rowMax = Math.max(GRID_ROWS - 1, 1);

    // Deterministic pseudo-random for dithering (stable across renders)
    const rand = (r: number, c: number) => {
        const x = Math.sin((r + 1) * 9283 + (c + 1) * 5471) * 43758.5453;
        return x - Math.floor(x);
    };

    return createEmptyGrid().map((row, r) =>
        row.map((_, c) => {
            let progress = 0;
            switch (direction) {
                case 'RIGHT_TO_LEFT':
                    progress = 1 - (c / colMax);
                    break;
                case 'TOP_TO_BOTTOM':
                    progress = r / rowMax;
                    break;
                case 'BOTTOM_TO_TOP':
                    progress = 1 - (r / rowMax);
                    break;
                case 'LEFT_TO_RIGHT':
                default:
                    progress = c / colMax;
                    break;
            }

            // Dithered rounding to avoid bandes nettes façon "marches"
            const floatLevel = progress * clampedMax;
            const base = Math.floor(floatLevel);
            const frac = floatLevel - base;
            const value = base + (rand(r, c) < frac ? 1 : 0);

            return Math.min(clampedMax, Math.max(0, value));
        })
    );
};

export const generatePresetGrid = (type: PresetName): GridState => {
    const grid = createEmptyGrid();
    const centerCol = Math.floor(GRID_COLS / 2);
    const centerRow = Math.floor(GRID_ROWS / 2);

    switch (type) {
        case 'HEART':
            // Simple heart shape
            const heartCoords = [
                [1, -1], [1, 1],
                [0, -2], [0, -1], [0, 0], [0, 1], [0, 2],
                [-1, -2], [-1, -1], [-1, 0], [-1, 1], [-1, 2],
                [-2, -1], [-2, 0], [-2, 1],
                [-3, 0]
            ];
            heartCoords.forEach(([r, c]) => {
                const row = centerRow - r; // Invert Y for visual logic
                const col = centerCol + c;
                if (grid[row] && grid[row][col] !== undefined) grid[row][col] = 3;
            });
            break;

        case 'SPACE_INVADER':
            const invader = [
                [0, 0], [0, -1], [0, 1],
                [1, -1], [1, 1],
                [2, -2], [2, 2], [2, -1], [2, 1], [2, 0],
                [3, -1], [3, 1], [3, -2], [3, 2],
                [4, -2], [4, 2], [4, -1], [4, 1]
            ];
            invader.forEach(([r, c]) => {
                const row = 1 + r;
                const col = centerCol + c;
                if (grid[row] && grid[row][col] !== undefined) grid[row][col] = 4;
            });
            break;

        case 'CHECKERBOARD':
            for (let r = 0; r < GRID_ROWS; r++) {
                for (let c = 0; c < GRID_COLS; c++) {
                    if ((r + c) % 2 === 0) grid[r][c] = 2;
                }
            }
            break;

        case 'LINE_GRAPH': {
            const baseCurve = Array.from({ length: GRID_COLS }, (_, c) => {
                const x = c / Math.max(1, GRID_COLS - 1);
                return clamp(0.5 + Math.sin(x * Math.PI * 2) * 0.25, 0, 1);
            });
            return generateLineGraphGrid({
                curve: baseCurve,
                thickness: 2,
                smoothing: 0,
                jitter: 0,
            });
        }

        case 'RANDOM_SCATTER':
            for (let r = 0; r < GRID_ROWS; r++) {
                for (let c = 0; c < GRID_COLS; c++) {
                    if (Math.random() > 0.7) grid[r][c] = Math.floor(Math.random() * 4) + 1;
                }
            }
            break;

        case 'CHAOS_WAVE': {
            // Motif dense, type "activité soutenue" concentrée sur les lignes centrales
            const midRows = [2, 3, 4]; // rows 2-4 (0-index) = Tue-Thu si layout standard
            const edgeRows = [1, 5];

            for (let c = 0; c < GRID_COLS; c++) {
                // colonnes respirations ponctuelles
                if (Math.random() < 0.005) continue;

                // définir un "bandeau" actif par colonne
                const center = midRows[Math.floor(Math.random() * midRows.length)];
                const height = 1 + Math.floor(Math.random() * 3); // 1 à 3 lignes actives

                for (let r = 0; r < GRID_ROWS; r++) {
                    const inBand = Math.abs(r - center) <= height;
                    const isEdge = edgeRows.includes(r) && Math.random() < 0.75;
                    const shouldFill = (inBand && Math.random() > 0.03) || isEdge;

                    if (shouldFill) {
                        const strength = 1 + Math.floor(Math.random() * 4); // 1..4
                        grid[r][c] = Math.max(grid[r][c], strength);
                    }
                }

                // pics rares en bord supérieur/inférieur pour casser la ligne
                if (Math.random() < 0.08) {
                    const top = 0, bottom = GRID_ROWS - 1;
                    const strength = 2 + Math.floor(Math.random() * 3);
                    const pickTop = Math.random() < 0.5;
                    const targetRow = pickTop ? top : bottom;
                    grid[targetRow][c] = Math.max(grid[targetRow][c], strength - 1);
                }
            }

            // Backfill plus appuyé pour réduire quasi tous les 0 restants
            for (let r = 0; r < GRID_ROWS; r++) {
                for (let c = 0; c < GRID_COLS; c++) {
                    if (grid[r][c] === 0 && Math.random() < 0.45) {
                        grid[r][c] = 1 + Math.floor(Math.random() * 3); // niveaux 1-3
                    }
                }
            }
            break;
        }

        // Fallback for others (HI, SMILEY, etc - keep simple for now)
        default:
            // 'HI'
            const h = [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [2, 1], [0, 2], [1, 2], [2, 2], [3, 2], [4, 2]];
            const i = [[0, 4], [4, 4], [0, 5], [4, 5], [0, 6], [1, 6], [2, 6], [3, 6], [4, 6]];

            [...h, ...i].forEach(([r, c]) => {
                const row = 1 + r;
                const col = centerCol - 3 + c;
                if (grid[row] && grid[row][col] !== undefined) grid[row][col] = 4;
            });
            break;
    }
    return grid;
};

// Simple 5x5 block font for A-Z, 0-9, space
const FONT_5X5: Record<string, string[]> = {
    'A': [
        ' 1  ',
        '1 1 ',
        '111 ',
        '1 1 ',
        '1 1 ',
    ],
    'B': [
        '11  ',
        '1 1 ',
        '11  ',
        '1 1 ',
        '11  ',
    ],
    'C': [
        ' 11 ',
        '1   ',
        '1   ',
        '1   ',
        ' 11 ',
    ],
    'D': [
        '11  ',
        '1 1 ',
        '1 1 ',
        '1 1 ',
        '11  ',
    ],
    'E': [
        '111 ',
        '1   ',
        '11  ',
        '1   ',
        '111 ',
    ],
    'F': [
        '111 ',
        '1   ',
        '11  ',
        '1   ',
        '1   ',
    ],
    'G': [
        ' 11 ',
        '1   ',
        '1 11',
        '1  1',
        ' 11 ',
    ],
    'H': [
        '1 1 ',
        '1 1 ',
        '111 ',
        '1 1 ',
        '1 1 ',
    ],
    'I': [
        '111 ',
        ' 1  ',
        ' 1  ',
        ' 1  ',
        '111 ',
    ],
    'J': [
        ' 111',
        '   1',
        '   1',
        '1  1',
        ' 11 ',
    ],
    'K': [
        '1 1 ',
        '1 1 ',
        '11  ',
        '1 1 ',
        '1 1 ',
    ],
    'L': [
        '1   ',
        '1   ',
        '1   ',
        '1   ',
        '111 ',
    ],
    'M': [
        '1 1 ',
        '111 ',
        '111 ',
        '1 1 ',
        '1 1 ',
    ],
    'N': [
        '1 1 ',
        '111 ',
        '111 ',
        '111 ',
        '1 1 ',
    ],
    'O': [
        ' 1  ',
        '1 1 ',
        '1 1 ',
        '1 1 ',
        ' 1  ',
    ],
    'P': [
        '11  ',
        '1 1 ',
        '11  ',
        '1   ',
        '1   ',
    ],
    'Q': [
        ' 1  ',
        '1 1 ',
        '1 1 ',
        '1 1 ',
        ' 11 ',
    ],
    'R': [
        '11  ',
        '1 1 ',
        '11  ',
        '1 1 ',
        '1 1 ',
    ],
    'S': [
        ' 11 ',
        '1   ',
        ' 1  ',
        '  1 ',
        '11  ',
    ],
    'T': [
        '111 ',
        ' 1  ',
        ' 1  ',
        ' 1  ',
        ' 1  ',
    ],
    'U': [
        '1 1 ',
        '1 1 ',
        '1 1 ',
        '1 1 ',
        '111 ',
    ],
    'V': [
        '1 1 ',
        '1 1 ',
        '1 1 ',
        '1 1 ',
        ' 1  ',
    ],
    'W': [
        '1 1 ',
        '1 1 ',
        '111 ',
        '111 ',
        '1 1 ',
    ],
    'X': [
        '1 1 ',
        '1 1 ',
        ' 1  ',
        '1 1 ',
        '1 1 ',
    ],
    'Y': [
        '1 1 ',
        '1 1 ',
        ' 1  ',
        ' 1  ',
        ' 1  ',
    ],
    'Z': [
        '111 ',
        '  1 ',
        ' 1  ',
        '1   ',
        '111 ',
    ],
    '0': [
        '111 ',
        '1 1 ',
        '1 1 ',
        '1 1 ',
        '111 ',
    ],
    '1': [
        ' 1  ',
        '11  ',
        ' 1  ',
        ' 1  ',
        '111 ',
    ],
    '2': [
        '111 ',
        '  1 ',
        '111 ',
        '1   ',
        '111 ',
    ],
    '3': [
        '111 ',
        '  1 ',
        '111 ',
        '  1 ',
        '111 ',
    ],
    '4': [
        '1 1 ',
        '1 1 ',
        '111 ',
        '  1 ',
        '  1 ',
    ],
    '5': [
        '111 ',
        '1   ',
        '111 ',
        '  1 ',
        '111 ',
    ],
    '6': [
        '111 ',
        '1   ',
        '111 ',
        '1 1 ',
        '111 ',
    ],
    '7': [
        '111 ',
        '  1 ',
        ' 1  ',
        ' 1  ',
        ' 1  ',
    ],
    '8': [
        '111 ',
        '1 1 ',
        '111 ',
        '1 1 ',
        '111 ',
    ],
    '9': [
        '111 ',
        '1 1 ',
        '111 ',
        '  1 ',
        '111 ',
    ],
    ' ': [
        '    ',
        '    ',
        '    ',
        '    ',
        '    ',
    ],
};

export const renderTextToGrid = (text: string, level: number = 4): GridState => {
    const grid = createEmptyGrid();
    if (!text) return grid;

    const upper = text.toUpperCase();
    const charWidth = 4; // patterns use width up to 4 (including trailing space)
    const spacing = 1;
    const totalWidth = upper.length * charWidth + (upper.length - 1) * spacing;
    const startCol = Math.max(0, Math.floor((GRID_COLS - totalWidth) / 2));
    const startRow = 1; // center vertically (rows 1-5 fit in 7)

    let col = startCol;
    for (const ch of upper) {
        const pattern = FONT_5X5[ch] || FONT_5X5[' '];
        for (let pr = 0; pr < pattern.length; pr++) {
            for (let pc = 0; pc < pattern[pr].length; pc++) {
                if (pattern[pr][pc] === '1') {
                    const r = startRow + pr;
                    const c = col + pc;
                    if (grid[r] && grid[r][c] !== undefined) {
                        grid[r][c] = level;
                    }
                }
            }
        }
        col += charWidth + spacing;
        if (col >= GRID_COLS) break; // stop if no more space
    }
    return grid;
};
