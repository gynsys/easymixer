"use client";

import React from "react";
import { CombineOptions } from "./types";

interface Props {
    options: CombineOptions;
    setOptions: React.Dispatch<React.SetStateAction<CombineOptions>>;
}

export function AudioOptions({ options, setOptions }: Props) {
    return (
        <div className="grid grid-cols-1 gap-2">
            {/* Output Format */}
            <div className="flex flex-col gap-1 p-2 bg-black border border-gray-800 rounded-lg">
                <label className="text-xs font-medium text-gray-400">Formato de Salida</label>
                <select
                    value={options.outputFormat}
                    onChange={(e) => setOptions({ ...options, outputFormat: e.target.value as "mp3" | "wav" })}
                    className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                    <option value="mp3">MP3 (Universal)</option>
                    <option value="wav">WAV (Alta Calidad)</option>
                </select>
            </div>

            {/* Silence Between */}
            <div className="flex flex-col gap-1 p-2 bg-black border border-gray-800 rounded-lg">
                <label className="text-xs font-medium text-gray-400">Silencio entre pistas</label>
                <div className="flex items-center gap-2">
                    <input
                        type="number"
                        min="0"
                        max="10"
                        value={options.silenceBetween}
                        onChange={(e) => setOptions({ ...options, silenceBetween: parseInt(e.target.value) || 0 })}
                        className="flex-1 px-2 py-1 text-center bg-gray-900 text-white rounded border border-gray-700 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <span className="text-xs text-gray-500">seg</span>
                </div>
            </div>

            {/* Normalize */}
            <div className="flex items-center p-2 bg-black border border-gray-800 rounded-lg gap-2">
                <input
                    type="checkbox"
                    id="normalize"
                    checked={options.normalize}
                    onChange={(e) => setOptions({ ...options, normalize: e.target.checked })}
                    className="w-4 h-4 text-blue-600 bg-black border-gray-700 rounded focus:ring-blue-500 focus:ring-offset-black"
                />
                <label htmlFor="normalize" className="text-xs font-medium text-gray-300 cursor-pointer select-none">
                    Normalizar Volumen
                </label>
            </div>

            {/* Crossfade */}
            <div className="flex items-center p-2 bg-black border border-gray-800 rounded-lg gap-2">
                <input
                    type="checkbox"
                    id="crossfade"
                    checked={options.crossfade}
                    onChange={(e) => setOptions({ ...options, crossfade: e.target.checked })}
                    className="w-4 h-4 text-blue-600 bg-black border-gray-700 rounded focus:ring-blue-500 focus:ring-offset-black"
                />
                <label htmlFor="crossfade" className="text-xs font-medium text-gray-300 cursor-pointer select-none">
                    Crossfade Suave (5s)
                </label>
            </div>
        </div>
    );
}
