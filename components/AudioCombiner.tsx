"use client";

import React, { useState } from "react";
import { Plus, Trash2, GripVertical, AlertCircle } from "lucide-react";
import { UrlInputList } from "./UrlInputList";
import { CombinationMethod } from "./CombinationMethod";
import { AudioOptions } from "./AudioOptions";
import { ProcessButton } from "./ProcessButton";
import { ProgressIndicator } from "./ProgressIndicator";

import { cn } from "@/lib/utils";
import axios from "axios";

import { AudioFile, CombineOptions } from "./types";

export default function AudioCombiner() {
    const [files, setFiles] = useState<AudioFile[]>([
        { id: "1", url: "", status: "idle" },
        { id: "2", url: "", status: "idle" },
    ]);
    const [method, setMethod] = useState<"concat" | "mix">("concat");
    const [options, setOptions] = useState<CombineOptions>({
        normalize: false,
        silenceBetween: 0,
        crossfade: false,
        outputFormat: "mp3",
    });
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
    const [globalError, setGlobalError] = useState<string | null>(null);
    const abortControllerRef = React.useRef<AbortController | null>(null);



    const handleCancel = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        setProcessing(false);
        setGlobalError("Proceso cancelado por el usuario.");
    };

    const handleProcess = async () => {
        setProcessing(true);
        setGlobalError(null);
        setProgress(10);

        // Validate
        const validFiles = files.filter(f => f.url.trim() !== "");
        if (validFiles.length < 2) {
            setGlobalError("Por favor ingresa al menos 2 URLs válidas.");
            setProcessing(false);
            return;
        }

        try {
            // New Backend Endpoint (Python)
            const API_URL = "http://localhost:8001/api/combine";

            // Init Controller
            abortControllerRef.current = new AbortController();

            const response = await axios.post(API_URL, {
                items: validFiles.map(f => ({
                    url: f.url
                })),
                method,
                // options passed but currently ignored by simple Python MVP
            }, {
                signal: abortControllerRef.current.signal
            });

            if (response.data.success && response.data.download_url) {
                // Construct full download URL
                const fullUrl = `http://localhost:8001${response.data.download_url}`;
                setDownloadUrl(fullUrl);
                setProgress(100);
            } else {
                throw new Error(response.data.error || "Error desconocido del servidor");
            }

        } catch (err: any) {
            if (axios.isCancel(err)) {
                console.log("Request canceled", err.message);
                return; // Handled by handleCancel state update usually, but just in case
            }
            console.error(err);
            const detail = err.response?.data?.detail;
            let errorMessage = err.message || "Error al procesar audio.";

            if (typeof detail === 'string') {
                errorMessage = detail;
            } else if (Array.isArray(detail)) {
                // Pydantic validation error
                errorMessage = detail.map((e: any) => e.msg).join(", ");
            } else if (typeof detail === 'object') {
                errorMessage = JSON.stringify(detail);
            }

            setGlobalError(errorMessage);
            setProgress(0);
        } finally {
            if (!axios.isCancel(globalError)) { // Only reset if not cancelled (cancelled handles it)
                // actually simple: setProcessing(false) is fine, but handleCancel sets it too.
                // let's just leave it:
                // If cancelled, handleCancel sets processing false immediately.
                // The finally block runs too.
                // We can rely on handleCancel.
            }
            setProcessing(false);
            abortControllerRef.current = null;
        }
    };

    return (
        <div className="w-full max-w-3xl mx-auto bg-black rounded-2xl shadow-xl overflow-hidden border border-gray-800">

            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    🔊 EasyMix Audio Combiner <span className="text-xs font-light opacity-80 border-l border-blue-400 pl-2 ml-2">By: Ing. Pablo Milano</span>
                </h2>
                <p className="text-blue-100 text-sm mt-1">Mezcla o une pistas de audio desde URLs</p>
            </div>

            <div className="p-6 space-y-8">

                {/* URL Inputs */}
                <section>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                        1. Archivos de Audio
                    </h3>
                    <UrlInputList files={files} setFiles={setFiles} />
                </section>



                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Method */}
                    <section>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                            2. Método de Combinación
                        </h3>
                        <CombinationMethod method={method} setMethod={setMethod} />
                    </section>

                    {/* Options */}
                    <section>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                            3. Opciones
                        </h3>
                        <AudioOptions options={options} setOptions={setOptions} />
                    </section>
                </div>



                {/* Action */}
                <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                    {globalError && (
                        <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-lg flex items-center gap-2 text-sm">
                            <AlertCircle size={16} />
                            {globalError}
                        </div>
                    )}

                    <div className="flex items-center gap-4">
                        <ProcessButton
                            processing={processing}
                            onClick={handleProcess}
                            onCancel={handleCancel}
                            disabled={files.filter(f => f.url).length < 2}
                        />
                    </div>

                    {progress > 0 && (
                        <ProgressIndicator progress={progress} status={processing ? "Procesando..." : "Completado"} />
                    )}

                    {downloadUrl && !processing && (
                        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg text-center animate-in fade-in slide-in-from-bottom-2">
                            <p className="text-green-800 font-medium mb-2">¡Tu audio está listo!</p>
                            <a
                                href={downloadUrl}
                                download={`easymix_output.${options.outputFormat}`}
                                className="inline-flex items-center justify-center px-6 py-2 bg-green-600 text-white rounded-full font-bold hover:bg-green-700 transition shadow-md"
                            >
                                Descargar Archivo
                            </a>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
