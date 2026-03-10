import ffmpeg from 'fluent-ffmpeg';
import installer from '@ffmpeg-installer/ffmpeg';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';
import ytdl from '@distube/ytdl-core'; // YouTube support

// Configure output path
ffmpeg.setFfmpegPath(installer.path);

export type ProcessOptions = {
    method: 'concat' | 'mix';
    outputFormat: 'mp3' | 'wav';
    normalize?: boolean;
    silenceBetween?: number;
    crossfade?: boolean;
};

// Vercel friendly temp dir
const TEMP_DIR = os.tmpdir();

export async function processAudio(urls: string[], options: ProcessOptions): Promise<Buffer> {
    const sessionId = uuidv4();
    const sessionDir = path.join(TEMP_DIR, sessionId);

    try {
        // 1. Setup Session
        if (!fs.existsSync(sessionDir)) {
            fs.mkdirSync(sessionDir);
        }

        console.log(`[Processing] Session ${sessionId} started with ${urls.length} files.`);

        // 2. Download Files
        const inputFiles: string[] = [];
        await Promise.all(urls.map(async (url, index) => {
            const fileName = `input_${index}_${uuidv4()}.mp3`; // Assume mp3 for input for simplicity, or sniff buffer
            const filePath = path.join(sessionDir, fileName);
            const writer = fs.createWriteStream(filePath);

            try {
                if (ytdl.validateURL(url)) {
                    // Handle YouTube
                    console.log(`[Processing] URL ${index + 1} detected as YouTube: ${url}`);
                    ytdl(url, { quality: 'highestaudio', filter: 'audioonly' })
                        .pipe(writer);
                } else {
                    // Handle Direct Link
                    const response = await axios({
                        method: 'GET',
                        url: url,
                        responseType: 'stream',
                        timeout: 10000 // 10s download timeout
                    });

                    // Basic Validation: Reject likely non-audio content
                    const contentType = response.headers['content-type'] || '';
                    if (contentType.includes('text/html') || contentType.includes('application/json')) {
                        throw new Error(`La URL ${index + 1} no es un archivo de audio (Content-Type: ${contentType}). Asegúrate de usar un enlace directo (ej: .mp3) o un link de YouTube válido.`);
                    }

                    response.data.pipe(writer);
                }

                return new Promise<void>((resolve, reject) => {
                    writer.on('finish', () => {
                        const stats = fs.statSync(filePath);
                        if (stats.size < 1000) { // < 1KB is suspicious for audio
                            reject(new Error(`El archivo de la URL ${index + 1} es demasiado pequeño (${stats.size} bytes). Probablemente no sea audio.`));
                            return;
                        }
                        inputFiles[index] = filePath; // Ensure order
                        resolve();
                    });
                    writer.on('error', reject);
                });
            } catch (err) {
                writer.close();
                throw err;
            }
        }));

        console.log(`[Processing] Downloaded ${inputFiles.length} files.`);

        // 3. Process with FFmpeg
        const outputPath = path.join(sessionDir, `output.${options.outputFormat}`);

        const outputBuffer = await new Promise<Buffer>((resolve, reject) => {
            let command = ffmpeg();

            // Add inputs
            inputFiles.forEach(file => {
                command = command.input(file);
            });

            // Complex Filter Logic
            console.log(`[Processing] Method: ${options.method}, Output: ${outputPath}`);

            if (options.method === 'concat') {
                // Determine if we need to re-encode (if normalization or silence is on, implies re-encode)
                // Basic concat using filter_complex for robustness handling different codecs

                // If silence is requested, we need to generate silence and insert it?
                // Or simplified: Just concat streams. 
                // Creating silence gaps dynamically with fluent-ffmpeg is complex. 
                // For MVP: Concat directly.

                const filterInputs = inputFiles.map((_, i) => `[${i}:a]`).join('');
                command = command.complexFilter(`${filterInputs}concat=n=${inputFiles.length}:v=0:a=1[out]`, ['out']);
            } else {
                // Mix (Amix)
                // Filter: amix=inputs=N:duration=longest
                command = command.complexFilter(`amix=inputs=${inputFiles.length}:duration=longest[out]`, ['out']);
            }

            // Normalization
            if (options.normalize) {
                // If we already have a complex filter, we need to chain it.
                // fluent-ffmpeg handles chaining if we map the previous output?
                // Actually, standard normalization in ffmpeg is loudnorm.
                // It's safer to add it to audioFilters.
                command = command.audioFilters('loudnorm');
            }

            command
                .on('start', (cmdLine) => console.log('FFmpeg spawn:', cmdLine))
                .on('error', (err) => {
                    console.error('FFmpeg error:', err);
                    reject(new Error("Error during audio processing"));
                })
                .on('end', () => {
                    console.log('FFmpeg processing finished');
                    // Read output and return buffer
                    try {
                        const buffer = fs.readFileSync(outputPath);
                        resolve(buffer);
                    } catch (e) {
                        reject(e);
                    }
                })
                .save(outputPath);
        });

        return outputBuffer;

    } catch (error) {
        console.error("Processing failed:", error);
        throw error;
    } finally {
        // Cleanup
        try {
            if (fs.existsSync(sessionDir)) {
                fs.rmSync(sessionDir, { recursive: true, force: true });
            }
        } catch (e) {
            console.error("Cleanup error:", e);
        }
    }
}
