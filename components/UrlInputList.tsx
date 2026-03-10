"use client";

import React, { useState } from "react";
import { Plus, Trash2, Link as LinkIcon, Download, Loader2, XCircle } from "lucide-react";
import { AudioFile } from "./types";
import { cn } from "@/lib/utils";
import axios from "axios";

interface ItemProps {
    file: AudioFile;
    index: number;
    updateUrl: (id: string, url: string) => void;
    removeUrl: (id: string) => void;
    canRemove: boolean;
}

function AudioItem({ file, index, updateUrl, removeUrl, canRemove }: ItemProps) {
    const [isDownloading, setIsDownloading] = useState(false);
    const abortControllerRef = React.useRef<AbortController | null>(null);

    const handleDownload = async () => {
        if (isDownloading) {
            abortControllerRef.current?.abort();
            setIsDownloading(false);
            return;
        }

        if (!file.url) return;
        setIsDownloading(true);
        abortControllerRef.current = new AbortController();

        try {
            const API_URL = "http://localhost:8001/api/download";
            const response = await axios.post(API_URL, { url: file.url }, {
                signal: abortControllerRef.current.signal
            });

            if (response.data.success && response.data.download_url) {
                const fullUrl = `http://localhost:8001${response.data.download_url}`;
                const link = document.createElement('a');
                link.href = fullUrl;
                link.setAttribute('download', response.data.filename || 'audio.mp3');
                document.body.appendChild(link);
                link.click();
                link.remove();
            }
        } catch (error) {
            console.error("Download error:", error);
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div className="flex items-center gap-2 bg-black border border-gray-800 p-2 rounded-lg">
            <div className="w-6 h-8 flex items-center justify-center text-gray-500 text-xs font-bold shrink-0">
                {index + 1}
            </div>

            <div className="relative flex-1">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    <LinkIcon size={16} />
                </div>
                <input
                    type="url"
                    value={file.url}
                    onChange={(e) => updateUrl(file.id, e.target.value)}
                    placeholder="https://ejemplo.com/audio.mp3"
                    className="w-full pl-10 pr-4 py-2 bg-black border border-gray-700 rounded-lg text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none"
                />
            </div>

            <button
                onClick={handleDownload}
                disabled={!file.url}
                className={cn(
                    "p-2 rounded-full transition-colors disabled:opacity-30",
                    isDownloading ? "text-red-500" : "text-gray-400 hover:text-green-500"
                )}
            >
                {isDownloading ? <XCircle size={18} /> : <Download size={18} />}
            </button>

            <button
                onClick={() => removeUrl(file.id)}
                disabled={!canRemove}
                className="p-2 text-gray-400 hover:text-red-500 disabled:opacity-30"
            >
                <Trash2 size={18} />
            </button>
        </div>
    );
}

export function UrlInputList({ files, setFiles }: { files: AudioFile[]; setFiles: React.Dispatch<React.SetStateAction<AudioFile[]>> }) {
    const addUrl = () => {
        setFiles([...files, { id: crypto.randomUUID(), url: "", status: "idle" }]);
    };

    const removeUrl = (id: string) => {
        setFiles(files.filter(f => f.id !== id));
    };

    const updateUrl = (id: string, url: string) => {
        setFiles(files.map(f => f.id === id ? { ...f, url, status: "idle" } : f));
    };

    const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            const lines = content.split(/\r?\n/).map(l => l.trim()).filter(l => l !== "");

            if (lines.length > 0) {
                const newFiles = lines.map(url => ({
                    id: crypto.randomUUID(),
                    url: url,
                    status: "idle" as const
                }));

                // Filtramos los campos que ya tengan una URL escrita
                const existingFilesWithContent = files.filter(f => f.url.trim() !== "");

                // Si no hay nada escrito, reemplazamos todo. Si hay algo, lo conservamos y añadimos los nuevos.
                if (existingFilesWithContent.length === 0) {
                    setFiles(newFiles);
                } else {
                    setFiles([...existingFilesWithContent, ...newFiles]);
                }
            }
            // Reset input
            e.target.value = "";
        };
        reader.readAsText(file);
    };

    return (
        <div className="space-y-3">
            <div className="space-y-2">
                {files.map((file, index) => (
                    <AudioItem
                        key={file.id}
                        file={file}
                        index={index}
                        updateUrl={updateUrl}
                        removeUrl={removeUrl}
                        canRemove={files.length > 1}
                    />
                ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-2 mt-4">
                <button
                    onClick={addUrl}
                    className="flex-1 flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-4 py-2 rounded-lg transition-colors justify-center border border-dashed border-blue-200"
                >
                    <Plus size={16} />
                    Añadir otra URL
                </button>

                <label className="flex-1 flex items-center gap-2 text-sm font-medium text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 px-4 py-2 rounded-lg transition-colors justify-center border border-dashed border-emerald-200 cursor-pointer">
                    <Download size={16} className="rotate-180" />
                    Importar desde .txt
                    <input
                        type="file"
                        accept=".txt"
                        className="hidden"
                        onChange={handleFileImport}
                    />
                </label>
            </div>
        </div>
    );
}
