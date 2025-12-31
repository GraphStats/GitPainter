import { GRID_COLS, GRID_ROWS, PresetName } from './constants';

export type GridState = number[][];

export const createEmptyGrid = (): GridState =>
    Array(GRID_ROWS).fill(0).map(() => Array(GRID_COLS).fill(0));

export const exportGridToJSON = (grid: GridState) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(grid));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "commit_pattern.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
};

export const calculateEstimatedCommits = (grid: GridState, intensity: number = 1): number => {
    return grid.flat().reduce((acc, cell) => acc + (cell * intensity * 2), 0);
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

        case 'RANDOM_SCATTER':
            for (let r = 0; r < GRID_ROWS; r++) {
                for (let c = 0; c < GRID_COLS; c++) {
                    if (Math.random() > 0.7) grid[r][c] = Math.floor(Math.random() * 4) + 1;
                }
            }
            break;

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
