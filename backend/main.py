from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List
from services.downloader import DownloaderService
from services.mixer import MixerService
import os
import urllib.parse
import zipfile
import time

app = FastAPI()

# Configurar CORS (Permitir todo por ahora para dev)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

downloader = DownloaderService()
mixer = MixerService()

def cleanup_old_files(max_age_seconds=3600):
    """Borra archivos en downloads con más de 1 hora de antigüedad"""
    print("🧹 Iniciando limpieza de archivos antiguos...")
    now = time.time()
    count = 0
    try:
        for f in downloader.download_dir.iterdir():
            if f.is_file() and (now - f.stat().st_mtime) > max_age_seconds:
                f.unlink()
                count += 1
        if count > 0:
            print(f"✅ Se borraron {count} archivos antiguos.")
    except Exception as e:
        print(f"⚠️ Error en limpieza: {e}")

class DownloadRequest(BaseModel):
    url: str

class CombineItem(BaseModel):
    url: str

class CombineRequest(BaseModel):
    items: List[CombineItem]
    method: str = "concat"
    include_originals: bool = False

@app.get("/")
def read_root():
    return {"status": "EasyMix Backend Running"}

@app.get("/favicon.ico")
def favicon():
    return ""

@app.post("/api/download")
def download_audio(req: DownloadRequest):
    if not req.url:
        raise HTTPException(status_code=400, detail="URL requerida")
    
    result = downloader.download_audio(req.url)
    
    if result["success"]:
        # Add download_url to response
        result["download_url"] = f"/api/files/{result['filename']}"
        return result
    else:
        raise HTTPException(status_code=500, detail=result.get("error", "Error desconocido"))



@app.post("/api/combine")
def combine_audio(req: CombineRequest):
    if not req.items or len(req.items) < 2:
        raise HTTPException(status_code=400, detail="Mínimo 2 Audiosequeridos")
    
    # 0. Limpieza preventiva de archivos viejos
    cleanup_old_files()

    # 1. Download Batch (Extract URLs)
    urls = [item.url for item in req.items]
    batch_results = downloader.download_batch(urls)
    
    # Map results (Preserve inputs + Add filename)
    final_items = []
    
    # We assume batch_results corresponds 1:1 to req.items (urls order preserved)
    for i, res in enumerate(batch_results):
        if res['success']:
            item = req.items[i]
            final_items.append({
                "filename": res['filename']
            })

    if len(final_items) < 2:
        raise HTTPException(status_code=500, detail="No se pudieron descargar suficientes audios (Mínimo 2 exitosos)")
        
    # 2. Mix
    try:
        result = mixer.combine_audio(final_items, method=req.method)
        
        if result["success"]:
            final_filename = result["filename"]
            
            # 3. ZIP Logic (If requested)
            if req.include_originals:
                zip_filename = f"easymix_pack_{int(time.time())}.zip"
                zip_path = downloader.download_dir / zip_filename
                
                with zipfile.ZipFile(zip_path, 'w') as zipf:
                    # Add combined file
                    zipf.write(downloader.download_dir / final_filename, arcname=final_filename)
                    # Add originals
                    for item in final_items:
                        fname = item["filename"]
                        zipf.write(downloader.download_dir / fname, arcname=f"originales/{fname}")
                
                # Cleanup combined MP3 as it's now inside the ZIP
                (downloader.download_dir / final_filename).unlink()
                final_filename = zip_filename

            # Cleanup source files (Always clean originals after processing)
            print("🧹 Limpiando originales temporales...")
            for item in final_items:
                fname = item["filename"]
                try:
                    file_path = downloader.download_dir / fname
                    if file_path.exists():
                        file_path.unlink()
                except Exception as e:
                    print(f"⚠️ No se pudo borrar {fname}: {e}")

            return {
                "success": True,
                "filename": final_filename,
                "download_url": f"/api/files/{final_filename}"
            }
        else:
            raise HTTPException(status_code=500, detail=result.get("error", "Error en el mezclador"))
            
    except Exception as e:
        print(f"❌ Error crítico en combine_audio: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/files/{filename}")
def get_file(filename: str):
    path = f"downloads/{filename}"
    if os.path.exists(path):
        return FileResponse(
            path, 
            media_type="audio/mpeg", 
            filename=filename
        )
    raise HTTPException(status_code=404, detail="Archivo no encontrado")

@app.get("/api/files")
def list_files():
    return downloader.list_files()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
