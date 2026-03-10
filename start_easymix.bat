@echo off
title EasyMix Launcher
echo ==========================================
echo       🚀 Iniciando EasyMix Services
echo ==========================================
echo.

:: 1. Iniciar Backend (Python FastAPI)
echo [1/3] Iniciando Backend Python (Puerto 8001)...
start "EasyMix Backend" cmd /k "python backend/main.py"

:: 2. Iniciar Bot de Telegram
echo [2/3] Iniciando Bot de Telegram...
start "EasyMix Bot" cmd /k "python bot/bot.py"

:: 3. Iniciar Frontend (Next.js)
echo [3/3] Iniciando Frontend (Next.js)...
start "EasyMix Frontend" cmd /k "pnpm dev"

echo.
echo ✅ Todos los servicios se han iniciado en ventanas separadas.
echo ⏳ Espera unos segundos a que carguen...
timeout /t 5 >nul
start http://localhost:3000
echo.
echo Puedes minimizar esta ventana o cerrarla (los servicios seguiran abiertos).
pause
