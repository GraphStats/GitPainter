'use client';

import React, { useState, useRef } from 'react';
import { CONTRIBUTION_LEVELS, DAYS, MONTHS } from '../lib/constants';

interface GridEditorProps {
    grid: number[][];
    setGrid: (grid: number[][]) => void;
    selectedColor: number;
    brushSize: 1 | 2;
    isDrawing: boolean;
    setIsDrawing: (drawing: boolean) => void;
}

export default function GridEditor({ grid, setGrid, selectedColor, brushSize, isDrawing, setIsDrawing }: GridEditorProps) {
    const updateCell = (row: number, col: number) => {
        const newGrid = [...grid.map(r => [...r])]; // Deep copy for safety

        // Apply brush size
        const updates = [[0, 0]];
        if (brushSize === 2) {
            updates.push([0, 1], [1, 0], [1, 1]);
        }

        updates.forEach(([dr, dc]) => {
            const r = row + dr;
            const c = col + dc;
            if (newGrid[r] && newGrid[r][c] !== undefined) {
                newGrid[r][c] = selectedColor;
            }
        });

        setGrid(newGrid);
    };

    const handleMouseDown = (row: number, col: number) => {
        setIsDrawing(true);
        updateCell(row, col);
    };

    const handleMouseEnter = (row: number, col: number) => {
        if (isDrawing) {
            updateCell(row, col);
        }
    };

    return (
        <div className="w-full overflow-x-auto overflow-y-hidden pb-4 custom-scrollbar select-none flex justify-center">
            <div className="relative pt-6 pl-8">
                {/* Month labels (approximate positions based on standard 53-week layout) */}
                <div className="flex relative mb-2 pl-8 h-4">
                    {/* Fixed column positions for months to align with grid */
                        /* Jan=0, Feb=4, Mar=9, Apr=13, May=18, Jun=22, Jul=27, Aug=31, Sep=36, Oct=40, Nov=45, Dec=49 */
                        [0, 4, 9, 13, 18, 22, 27, 31, 36, 40, 45, 49].map((colIndex, i) => (
                            <span
                                key={i}
                                style={{
                                    position: 'absolute',
                                    left: `${32 + (colIndex * 15)}px` // 32px padding-left + (col width 12 + gap 3 = 15)
                                }}
                                className="text-[10px] text-gray-500 font-mono"
                            >
                                {MONTHS[i]}
                            </span>
                        ))}
                </div>

                {/* Day labels */}
                <div className="absolute left-0 top-8 flex flex-col gap-[3px] text-[9px] text-gray-500 font-mono h-full pt-1">
                    <span>Mon</span>
                    <span className="mt-[27px]">Wed</span>
                    <span className="mt-[27px]">Fri</span>
                </div>

                <div className="flex gap-[3px]">
                    {grid[0].map((_, colIndex) => (
                        <div key={`col-${colIndex}`} className="flex flex-col gap-[3px]">
                            {grid.map((_, rowIndex) => (
                                <div
                                    key={`${rowIndex}-${colIndex}`}
                                    className="w-[12px] h-[12px] rounded-[2px] cursor-crosshair transition-all duration-75 hover:scale-125 hover:z-10 hover:border hover:border-white/50"
                                    style={{
                                        backgroundColor: CONTRIBUTION_LEVELS[grid[rowIndex][colIndex]],
                                    }}
                                    onMouseDown={() => handleMouseDown(rowIndex, colIndex)}
                                    onMouseEnter={() => handleMouseEnter(rowIndex, colIndex)}
                                />
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
