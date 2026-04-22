@echo off
title Blink — Статус
echo ==========================================
echo    BLINK - СТАТУС ПРОЦЕССОВ
echo ==========================================
echo.

where pm2 >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [!] PM2 не установлен.
    pause
    exit /b 1
)

call pm2 status

echo.
echo ==========================================
echo  Хочешь увидеть живые логи? Нажми Y, иначе любую другую клавишу.
echo ==========================================
choice /c YN /n /m "Открыть логи (Y/N)? "
if errorlevel 2 exit /b 0
if errorlevel 1 call pm2 logs
