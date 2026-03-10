'use client';

import { useState, useEffect } from 'react';

import axios from 'axios';
import { Download, Loader2, Music } from 'lucide-react';

export default function DownloadSection() {
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [lastFile, setLastFile] = useState<any>(null);

    const handleDownload = async () => {
        if (!url) return;
        setLoading(true);
        setMessage('⏳ Descargando... (esto puede tomar unos segundos)');

        try {
            const API_URL = 'http://localhost:8001/api/download';

            const res = await axios.post(API_URL, { url });

            if (res.data.success) {
                setMessage(`✅ Descarga completada: ${res.data.title}`);
                setLastFile(res.data);
            } else {
                setMessage('❌ Error: ' + res.data.error);
            }
        } catch (e: any) {
            setMessage('❌ Error de conexión: ' + (e.response?.data?.detail || e.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8 shadow-2xl">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-white">
                <Music className="w-6 h-6 text-green-400" />
                Descargar de YouTube
            </h2>

            <div className="space-y-4">
                <div>
                    <input
                        type="text"
                        placeholder="Pega el enlace de YouTube aquí..."
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all font-mono text-sm"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                    />
                </div>

                <button
                    onClick={handleDownload}
                    disabled={loading || !url}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2"
                >
                    {loading ? <Loader2 className="animate-spin" /> : <Download />}
                    {loading ? 'Descargando...' : 'Descargar MP3'}
                </button>

                {message && (
                    <div className={`p-4 rounded-lg text-sm font-medium ${message.includes('Error') ? 'bg-red-900/50 text-red-200' : 'bg-green-900/50 text-green-200'}`}>
                        {message}
                    </div>
                )}
            </div>
        </div>
    );
}
