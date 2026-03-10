"use client";

import React from "react";
import { Loader2, Wand2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
    processing: boolean;
    onClick: () => void;
    onCancel?: () => void;
    disabled: boolean;
}

export function ProcessButton({ processing, onClick, onCancel, disabled }: Props) {
    return (
        <button
            onClick={processing && onCancel ? onCancel : onClick}
            disabled={disabled}
            className={cn(
                "relative w-full py-4 rounded-xl font-bold text-lg text-white shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:transform-none disabled:shadow-none",
                processing
                    ? "bg-red-600 hover:bg-red-700 animate-pulse"
                    : "bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500",
                "disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed"
            )}
        >
            <div className="flex items-center justify-center gap-2">
                {processing ? (
                    <>
                        <Loader2 className="animate-spin" />
                        <span>CANCELAR PROCESO</span>
                    </>
                ) : (
                    <>
                        <Wand2 />
                        <span>COMBINAR AUDIOS</span>
                    </>
                )}
            </div>

            {!processing && !disabled && (
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs opacity-50 font-normal hidden sm:block">
                    Gratis • Rápido
                </span>
            )}
        </button>
    );
}
