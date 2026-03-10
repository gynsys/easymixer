from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List
from services.downloader import DownloaderService
from services.mixer import MixerService
import os
import urllib.parse

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

class DownloadRequest(BaseModel):
    url: str

class CombineItem(BaseModel):
    url: str

class CombineRequest(BaseModel):
    items: List[CombineItem]
    method: str = "concat"

@app.get("/")
def read_root():
    return {"status": "EasyMix Backend Running"}

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
    result = mixer.combine_audio(final_items, method=req.method)
    
    if result["success"]:
        # Cleanup source files (Eliminar archivos individuales)
        print("🧹 Limpiando archivos temporales...")
        for fname in filenames:
            try:
                os.remove(f"downloads/{fname}") 
            except Exception as e:
                print(f"⚠️ No se pudo borrar {fname}: {e}")
                file_path = downloader.download_dir / fname
                if file_path.exists():
                    file_path.unlink()
                    print(f"🗑️ Eliminado: {fname}")
            except Exception as e:
                print(f"⚠️ Error eliminando archivo temporal {fname}: {e}")

        return {
            "success": True,
            "filename": result["filename"],
            "download_url": f"/api/files/{result['filename']}"
        }
    else:
        raise HTTPException(status_code=500, detail=result.get("error"))

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
