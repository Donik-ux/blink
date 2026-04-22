@echo off
title Blink — Остановка
echo ==========================================
echo    BLINK - ОСТАНОВКА ФОНОВЫХ ПРОЦЕССОВ
echo ==========================================
echo.

where pm2 >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [!] PM2 не найден. Если приложение запускалось через npm run dev —
    echo     закрой соответствующее окно терминала.
    pause
    exit /b 1
)

echo Останавливаю blink-server и blink-client...
call pm2 delete ecosystem.config.cjs
call pm2 save --force

echo.
echo  Готово. Приложение остановлено.
echo ==========================================
pause
