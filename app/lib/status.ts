import fs from 'fs';
import path from 'path';
import os from 'os';

const STATUS_FILE = path.join(os.tmpdir(), 'git-painter-status.json');

export type JobStatus = {
    state: 'idle' | 'generating' | 'pushing' | 'done' | 'error';
    current?: number;
    total?: number;
    message?: string;
    repo?: string;
    timestamp: number;
};

export function updateStatus(status: JobStatus) {
    try {
        fs.writeFileSync(STATUS_FILE, JSON.stringify(status));
    } catch (e) {
        console.error("Failed to write status file", e);
    }
}

export function getStatus(): JobStatus {
    try {
        if (!fs.existsSync(STATUS_FILE)) {
            return { state: 'idle', timestamp: Date.now() };
        }
        const data = fs.readFileSync(STATUS_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (e) {
        return { state: 'idle', timestamp: Date.now() };
    }
}
