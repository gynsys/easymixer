import subprocess
from pathlib import Path
import json
import sys
import shutil

class DownloaderService:
    def __init__(self, download_dir="downloads"):
        self.download_dir = Path(download_dir)
        self.download_dir.mkdir(exist_ok=True)
        self.ffmpeg_path = shutil.which('ffmpeg')
        print(f"🔧 FFmpeg path: {self.ffmpeg_path}")

    def download_audio(self, url: str) -> dict:
        """
        Descarga audio desde YouTube usando yt-dlp.
        Retorna un diccionario con el resultado.
        """
        print(f"⬇️ Iniciando descarga: {url}")
        
        # Template de salida: usar ID para evitar problemas con caracteres especiales
        output_template = str(self.download_dir / '%(id)s.%(ext)s')
        
        comando = [
            sys.executable, '-m', 'yt_dlp',
            '-x',  # Extraer audio
            '--audio-format', 'mp3',
            '--audio-quality', '0',
            '-o', output_template,
            '--no-playlist',
            '--print-json',
            '--no-warnings',
            '--no-part',
            '--no-overwrites',
            '--rm-cache-dir',
            '--restrict-filenames', # Nombres de archivo más seguros
            '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
            '--referer', 'https://www.google.com/',
        ]
        
        if self.ffmpeg_path:
            comando.extend(['--ffmpeg-location', self.ffmpeg_path])
        
        comando.append(url)
        
        print(f"🚀 Ejecutando comando: {comando}")
        
        try:
            resultado = subprocess.run(comando, capture_output=True, text=True)
            
            if resultado.returncode == 0:
                video_info = {}
                lines = resultado.stdout.strip().split('\n')
                for line in lines:
                    try:
                        video_info = json.loads(line)
                        break
                    except:
                        continue
                
                # Usar el ID como nombre de archivo base
                video_id = video_info.get('id', 'desconocido')
                title = video_info.get('title', 'audio')
                filename = f"{video_id}.mp3"
                
                return {
                    "success": True,
                    "title": title,
                    "filename": filename,
                    "info": video_info
                }
            else:
                return {
                    "success": False,
                    "error": resultado.stderr
                }

        except Exception as e:
             return {
                "success": False,
                "error": str(e)
            }



    def download_batch(self, urls: list) -> list:
        """
        Descarga multiples URLs.
        Retorna lista de resultados con metadata de mapeo.
        """
        results = []
        print(f"📦 Procesando lote de {len(urls)} URLs...")
        for url in urls:
            try:
                res = self.download_audio(url)
                if res['success']:
                    results.append({
                        "url": url,
                        "filename": res['filename'],
                        "success": True
                    })
                else:
                    results.append({
                        "url": url,
                        "success": False,
                        "error": res.get('error')
                    })
                    print(f"❌ Error descargando {url}: {res.get('error')}")
            except Exception as e:
                results.append({
                    "url": url,
                    "success": False,
                    "error": str(e)
                })
                print(f"❌ Excepción en {url}: {e}")
        return results

    def list_files(self):
        """Lista archivos MP3 descargados"""
        archivos = list(self.download_dir.glob("*.mp3"))
        archivos.sort(key=lambda x: x.stat().st_mtime, reverse=True)
        return [{"name": f.name, "size": f.stat().st_size} for f in archivos]

    def validate_url(self, url: str) -> dict:
        """
        Verifica si una URL es válida y accesible sin descargar.
        """
        # Limpiar URL si es de YouTube para evitar problemas con parámetros de listas
        # Pero si detectamos que no es un formato estándar, lo dejamos pasar
        clean_url = url.strip()
        if "youtube.com/watch" in clean_url or "youtu.be/" in clean_url:
            try:
                if "youtube.com/watch" in clean_url:
                    parts = urllib.parse.parse_qs(urllib.parse.urlparse(clean_url).query)
                    video_id = parts.get("v", [None])[0]
                    if video_id:
                        clean_url = f"https://www.youtube.com/watch?v={video_id}"
                elif "youtu.be/" in clean_url:
                    video_id = clean_url.split("youtu.be/")[1].split("?")[0].split("&")[0]
                    if video_id:
                        clean_url = f"https://www.youtube.com/watch?v={video_id}"
            except:
                pass # Usar original si falla parsing

        print(f"🔍 Validando URL: {clean_url}")
        comando = [
            sys.executable, '-m', 'yt_dlp',
            '--simulate',
            '--get-id',
            '--no-playlist',
            '--no-warnings',
            '--rm-cache-dir',
            '--no-check-certificate',
            '--geo-bypass',
            '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
            '--referer', 'https://www.google.com/',
            clean_url
        ]
        
        try:
            # Aumentar timeout a 30 segundos para evitar cortes en redes lentas
            resultado = subprocess.run(comando, capture_output=True, text=True, timeout=30)
            if resultado.returncode == 0:
                # Capturar ID
                lines = [line.strip() for line in resultado.stdout.split('\n') if line.strip()]
                video_id = lines[-1] if lines else "unknown"
                return {"success": True, "video_id": video_id}
            else:
                stderr = resultado.stderr.strip() if resultado.stderr else ""
                stdout = resultado.stdout.strip() if resultado.stdout else ""
                
                # Buscar mensaje de error específico
                error_msg = "Error desconocido de validación"
                if stderr:
                    last_line = stderr.split('\n')[-1]
                    if "ERROR:" in last_line:
                        error_msg = last_line.split("ERROR:")[1].strip()
                    else:
                        error_msg = last_line
                elif stdout:
                    error_msg = stdout.split('\n')[-1]
                
                return {"success": False, "error": error_msg}
        except subprocess.TimeoutExpired:
            return {"success": False, "error": "Tiempo de espera agotado (Timeout 30s)"}
        except Exception as e:
            return {"success": False, "error": str(e)}
