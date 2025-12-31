import { NextRequest, NextResponse } from 'next/server';
import git from 'isomorphic-git';
import http from 'isomorphic-git/http/node';
import { addWeeks, addDays, startOfWeek } from 'date-fns';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { updateStatus } from '../../lib/status';

// Increase max duration for Vercel (Pro plan allows up to 300s, Hobby 10s or 60s)
export const maxDuration = 300;
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    let isClientConnected = true;

    const sendProgress = async (data: any) => {
        // Always update server-side state
        updateStatus({
            state: data.status === 'done' ? 'done' : data.status === 'generating' ? 'generating' : data.status === 'pushing' ? 'pushing' : data.error ? 'error' : 'idle',
            current: data.current,
            total: data.total,
            message: data.message,
            timestamp: Date.now()
        });

        if (!isClientConnected) return;
        try {
            await writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch (e) {
            console.log('Client disconnected from stream. Continuing background job...');
            isClientConnected = false;
        }
    };

    const runProcess = async () => {
        let tempDir = '';
        try {
            const body = await req.json();
            const { grid, token, username, repo, year } = body;

            if (!grid || !token || !username || !repo) {
                await sendProgress({ error: 'Données manquantes' });
                await writer.close();
                return;
            }

            // Create a unique temp directory
            // Note: On Vercel, /tmp is the only writable directory
            tempDir = path.join(os.tmpdir(), `git-bot-${Date.now()}`);
            // Ensure parent exists (os.tmpdir usually exists)
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }

            const remoteUrl = `https://github.com/${username}/${repo}.git`;

            // Update status to indicate setup/cloning
            await sendProgress({ status: 'generating', current: 0, total: 0, message: 'Cloning repository...' });

            try {
                // Try to clone the repository (shallow clone to save time/bandwidth)
                await git.clone({
                    fs,
                    http,
                    dir: tempDir,
                    url: remoteUrl,
                    depth: 1,
                    singleBranch: true,
                    onAuth: () => ({ username: token })
                });
            } catch (cloneError: any) {
                console.log("Clone failed, attempting init fallback:", cloneError.message);
                // If clone fails, ensure dir exists and init
                if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

                await git.init({ fs, dir: tempDir });
                await git.addRemote({ fs, dir: tempDir, remote: 'origin', url: remoteUrl });
            }

            // Configure author for this session
            const author = {
                name: username,
                email: `${username}@users.noreply.github.com`,
            };

            // Use provided year or default to current year.
            const targetYear = year || new Date().getFullYear();
            const startOfYear = new Date(targetYear, 0, 1);
            const startDate = startOfWeek(startOfYear, { weekStartsOn: 0 });

            const filePath = path.join(tempDir, 'README.md');

            // Append to README if it exists, or create it.
            if (!fs.existsSync(filePath)) {
                fs.writeFileSync(filePath, `# Commit Art: ${repo}\n\nGénéré avec GitPainter.`);
            } else {
                fs.appendFileSync(filePath, `\n\n## Update: ${new Date().toISOString()}`);
            }

            let commitCount = 0;
            const totalPlanned = grid.flat().reduce((acc: number, val: number) => acc + (val * 2), 0);

            await sendProgress({ status: 'generating', current: 0, total: totalPlanned });

            for (let col = 0; col < 53; col++) {
                for (let row = 0; row < 7; row++) {
                    const count = grid[row][col];
                    if (count > 0) {
                        const commitDate = addDays(addWeeks(startDate, col), row);
                        const dateStr = commitDate.toISOString();
                        const timestamp = Math.floor(commitDate.getTime() / 1000);
                        const commitsForThisDay = count * 2;

                        for (let i = 0; i < commitsForThisDay; i++) {
                            // Append content to ensure file changes
                            fs.appendFileSync(filePath, `\n<!-- ${dateStr}-${i} -->`);

                            await git.add({ fs, dir: tempDir, filepath: 'README.md' });

                            await git.commit({
                                fs,
                                dir: tempDir,
                                message: `Art ${col}-${row}-${i}`,
                                author: { ...author, timestamp, timezoneOffset: 0 },
                                committer: { ...author, timestamp, timezoneOffset: 0 },
                            });

                            commitCount++;
                        }
                    }
                }
                // Send progress update
                if (commitCount % 10 === 0) {
                    await sendProgress({ status: 'generating', current: commitCount, total: totalPlanned });
                }
            }

            await sendProgress({ status: 'pushing' });

            // specific check for branch
            const currentBranch = await git.currentBranch({ fs, dir: tempDir }) || 'main';

            await git.push({
                fs,
                http,
                dir: tempDir,
                remote: 'origin',
                ref: currentBranch,
                onAuth: () => ({ username: token })
            });

            await sendProgress({ status: 'done', commitCount });

        } catch (error: any) {
            console.error('Error generating commits:', error);
            await sendProgress({ error: error.message || 'Erreur interne' });
        } finally {
            // Cleanup temp dir
            if (tempDir && fs.existsSync(tempDir)) {
                try {
                    fs.rmSync(tempDir, { recursive: true, force: true });
                } catch (e) {
                    console.error('Failed to cleanup temp dir', e);
                }
            }

            try {
                await writer.close();
            } catch (e) { }
        }
    };

    runProcess();

    return new NextResponse(stream.readable, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive', // Important for Vercel
        },
    });
}
