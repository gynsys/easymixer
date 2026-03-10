
import subprocess
from pathlib import Path
import os
import uuid

class MixerService:
    def __init__(self, download_dir="downloads"):
        self.download_dir = Path(download_dir)
        self.download_dir.mkdir(exist_ok=True)

    def combine_audio(self, items: list, method="concat") -> dict:
        """
        Combina multiples archivos de audio (concatenación o mezcla).
        items: lista de dicts {filename}
        """
        if not items or len(items) < 2:
            return {"success": False, "error": "Mínimo 2 audios requeridos"}
        
        output_filename = f"easymix_output_{uuid.uuid4().hex[:8]}.mp3"
        output_path = self.download_dir / output_filename
        
        file_paths = []
        for item in items:
             fname = item.get('filename') if isinstance(item, dict) else item
             path = self.download_dir / fname
             if not path.exists():
                 return {"success": False, "error": f"Archivo no encontrado: {fname}"}
             file_paths.append(str(path))
             
        try:
            cmd = ['ffmpeg', '-y']
            
            # Inputs
            for f in file_paths:
                cmd.extend(['-i', f])
            
            if method == "concat":
                # Concat filter
                filter_complex = "".join([f"[{i}:a]" for i in range(len(file_paths))])
                filter_complex += f"concat=n={len(file_paths)}:v=0:a=1[outa]"
            else:
                # Mix filter
                filter_complex = "".join([f"[{i}:a]" for i in range(len(file_paths))])
                filter_complex += f"amix=inputs={len(file_paths)}:duration=longest[outa]"
            
            cmd.extend(['-filter_complex', filter_complex])
            cmd.extend(['-map', '[outa]'])
            cmd.extend(['-b:a', '192k'])
            cmd.extend([str(output_path)])
            
            print(f"🎛️ Ejecutando FFmpeg: {' '.join(cmd)}")
            process = subprocess.run(cmd, capture_output=True, text=True)
            
            if process.returncode != 0:
                print(f"❌ Error en FFmpeg: {process.stderr}")
                return {"success": False, "error": f"Error de FFmpeg: {process.stderr[:200]}"}
            
            if output_path.exists():
                return {"success": True, "filename": output_filename, "path": str(output_path)}
            else:
                 return {"success": False, "error": "Salida no generada"}

        except Exception as e:
             print(f"❌ Excepción en Mixer: {e}")
             return {"success": False, "error": str(e)}
