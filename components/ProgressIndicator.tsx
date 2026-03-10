"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface Props {
    progress: number;
    status: string;
}

export function ProgressIndicator({ progress, status }: Props) {
    return (
        <div className="mt-6 space-y-2">
            <div className="flex justify-between text-xs font-semibold uppercase tracking-wider text-gray-500">
                <span>{status}</span>
                <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
}
