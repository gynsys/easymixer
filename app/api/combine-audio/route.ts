import { NextRequest, NextResponse } from 'next/server';
import { processAudio, ProcessOptions } from '@/lib/audio';

export const maxDuration = 30; // Attempt to warn Vercel? No effect here.

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { urls, method, options } = body;

        // Validation
        if (!urls || !Array.isArray(urls) || urls.length < 2) {
            return NextResponse.json({ message: "Se requieren al menos 2 URLs" }, { status: 400 });
        }

        if (urls.length > 10) {
            return NextResponse.json({ message: "Máximo 10 URLs permitidas" }, { status: 400 });
        }

        // Process
        const buffer = await processAudio(urls, {
            method: method || 'concat',
            outputFormat: options?.outputFormat || 'mp3',
            normalize: options?.normalize,
            silenceBetween: options?.silenceBetween,
            crossfade: options?.crossfade
        });

        // Headers for download
        const headers = new Headers();
        headers.set('Content-Type', options?.outputFormat === 'wav' ? 'audio/wav' : 'audio/mpeg');
        headers.set('Content-Length', buffer.length.toString());
        headers.set('Content-Disposition', `attachment; filename="easymix_output.${options?.outputFormat || 'mp3'}"`);

        return new NextResponse(buffer, {
            status: 200,
            headers
        });

    } catch (error: any) {
        console.error("API Error:", error);
        return NextResponse.json({
            message: "Error procesando el audio. Verifica que las URLs sean accesibles y archivos de audio válidos."
        }, { status: 500 });
    }
}
