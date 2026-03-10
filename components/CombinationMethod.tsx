"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { ListMusic, Music } from "lucide-react";

interface Props {
    method: "concat" | "mix";
    setMethod: (m: "concat" | "mix") => void;
}

export function CombinationMethod({ method, setMethod }: Props) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
                onClick={() => setMethod("concat")}
                className={cn(
                    "flex flex-col items-center p-4 rounded-xl border-2 transition-all hover:bg-gray-50 dark:hover:bg-gray-800/50",
                    method === "concat"
                        ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/10 dark:border-blue-400"
                        : "border-gray-200 dark:border-gray-700"
                )}
            >
                <div className={cn(
                    "p-3 rounded-full mb-3",
                    method === "concat" ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500"
                )}>
                    <ListMusic size={24} />
                </div>
                <h4 className="font-bold text-gray-800 dark:text-gray-100">Concatenar</h4>
                <p className="text-xs text-gray-500 text-center mt-1">
                    Uno tras otro. Ideal para podcasts, lecciones o playlists.
                </p>
            </button>

            <button
                onClick={() => setMethod("mix")}
                className={cn(
                    "flex flex-col items-center p-4 rounded-xl border-2 transition-all hover:bg-gray-50 dark:hover:bg-gray-800/50",
                    method === "mix"
                        ? "border-purple-500 bg-purple-50/50 dark:bg-purple-900/10 dark:border-purple-400"
                        : "border-gray-200 dark:border-gray-700"
                )}
            >
                <div className={cn(
                    "p-3 rounded-full mb-3",
                    method === "mix" ? "bg-purple-100 text-purple-600" : "bg-gray-100 text-gray-500"
                )}>
                    <Music size={24} />
                </div>
                <h4 className="font-bold text-gray-800 dark:text-gray-100">Mezclar</h4>
                <p className="text-xs text-gray-500 text-center mt-1">
                    Reproducir simultáneamente. Ideal para música o capas de sonido.
                </p>
            </button>
        </div>
    );
}
