export const CONTRIBUTION_LEVELS = [
    '#161b22', // Level 0 (Empty)
    '#0e4429', // Level 1
    '#006d32', // Level 2
    '#26a641', // Level 3
    '#39d353', // Level 4
];

export const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const GRID_ROWS = 7;
export const GRID_COLS = 53;

export type PresetName = 'HEART' | 'SMILEY' | 'SPACE_INVADER' | 'HI' | 'RIP' | 'RANDOM_SCATTER' | 'CHECKERBOARD';

export const PRESETS: Record<PresetName, { name: string, description: string }> = {
    HEART: { name: 'Cœur', description: 'Un cœur pixel art au centre' },
    SMILEY: { name: 'Smiley', description: 'Un visage souriant' },
    SPACE_INVADER: { name: 'Space Invader', description: 'Alien rétro' },
    HI: { name: 'Say Hi', description: 'Écrit "HI" sur la grille' },
    RIP: { name: 'RIP', description: 'Pour les projets morts' },
    RANDOM_SCATTER: { name: 'Pluie Aléatoire', description: 'Chaos organisé' },
    CHECKERBOARD: { name: 'Damier', description: 'Motif alterné' },
};

export const MOCK_LOGS = [
    "Initialisation du dépôt git...",
    "Vérification des accès distants...",
    "Création du dossier .git...",
    "Configuration de user.name...",
    "Configuration de user.email...",
    "Génération de la matrice temporelle...",
    "Calcul des hash SHA-256...",
];
