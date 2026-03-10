export type AudioFile = {
    id: string;
    url: string;
    title?: string;
    duration?: number;
    isLoadingMetadata?: boolean;
    webpage_url?: string;
    status: "idle" | "error";
    error?: string;
};

export type CombineOptions = {
    normalize: boolean;
    silenceBetween: number; // seconds
    crossfade: boolean;
    outputFormat: "mp3" | "wav";
    includeOriginals: boolean;
};
