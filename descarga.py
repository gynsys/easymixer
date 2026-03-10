import subprocess
from pathlib import Path
import sys

def descargar_rapido():
    """Descarga audio de YouTube de forma directa y rápida."""
    
    print("DESCARGADOR RÁPIDO DE AUDIO")
    print("-" * 40)
    
    url = input("URL de YouTube: ").strip()
    
    if not url:
        print("❌ No se ingresó URL")
        return
    
    # Carpeta de descargas
    descargas = Path.home() / "Downloads"
    if not descargas.exists():
        descargas = Path.cwd() / "descargas"
    descargas.mkdir(exist_ok=True)
    
    print(f"\n📁 Guardando en: {descargas}")
    print("⏳ Descargando...\n")
    
    # Comando SIMPLE y DIRECTO
    comando = [
        'yt-dlp',
        '-x',  # Extraer audio
        '--audio-format', 'mp3',
        '--audio-quality', '0',
        '-o', str(descargas / '%(title)s.%(ext)s'),
        '--no-playlist',
        '--quiet',  # Modo silencioso (menos output)
        '--no-warnings',
        url
    ]
    
    try:
        # Ejecutar directamente
        resultado = subprocess.run(comando, capture_output=True, text=True)
        
        if resultado.returncode == 0:
            print("✅ ¡Descarga completada!")
            
            # Mostrar archivos recientes
            print("\n📁 Archivos en carpeta de descargas:")
            archivos = list(descargas.glob("*.mp3"))
            archivos.sort(key=lambda x: x.stat().st_mtime, reverse=True)
            
            for i, archivo in enumerate(archivos[:3], 1):
                tamaño = archivo.stat().st_size
                print(f"  {i}. {archivo.name} ({tamaño/1024/1024:.1f} MB)")
        else:
            print("❌ Error en la descarga")
            if resultado.stderr:
                print(f"Detalles: {resultado.stderr[:200]}")
    
    except KeyboardInterrupt:
        print("\n⏹️  Cancelado por usuario")
    except Exception as e:
        print(f"❌ Error: {str(e)}")

# Script directo para ejecutar
if __name__ == "__main__":
    # Verificar yt-dlp
    try:
        subprocess.run(['yt-dlp', '--version'], capture_output=True)
    except:
        print("❌ yt-dlp no está instalado")
        print("Instalando...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "yt-dlp"])
        print("✅ yt-dlp instalado")
    
    while True:
        descargar_rapido()
        if input("\n¿Otra descarga? (s/n): ").lower() != 's':
            break