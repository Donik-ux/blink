@echo off
title Blink Project Starter
setlocal enabledelayedexpansion

echo ==========================================
echo    BLINK PROJECT - STARTUP SCRIPT
echo ==========================================

:: 1. Cleanup
echo [1/4] Очистка старых процессов...
taskkill /F /IM node.exe /T >nul 2>&1

:: 2. Check dependencies
echo [2/4] Проверка установки зависимостей...
if not exist "node_modules" (
    echo [!] Установка общих зависимостей...
    call npm install
)
if not exist "server\node_modules" (
    echo [!] Установка серверных зависимостей...
    cd server && call npm install && cd ..
)
if not exist "client\node_modules" (
    echo [!] Установка клиентских зависимостей...
    cd client && call npm install && cd ..
)

:: 3. IP Discovery for mobile access
echo [3/4] Поиск IP-адреса для доступа с телефона...
set "IP=localhost"
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4"') do (
    set "temp_ip=%%a"
    set "temp_ip=!temp_ip: =!"
    if "!temp_ip:~0,3!"=="192" set "IP=!temp_ip!"
    if "!temp_ip:~0,2!"=="10" set "IP=!temp_ip!"
    if "!temp_ip:~0,3!"=="172" set "IP=!temp_ip!"
)

echo.
echo [!] АДРЕС ДЛЯ ТЕЛЕФОНА: https://%IP%:5173
echo [!] (Примите предупреждение о безопасности в браузере телефона)
echo ==========================================
echo.

:: 4. Start concurrent development
echo [4/4] Запуск Сервера и Клиента...
echo (Используем call npm для обхода проблем с PowerShell)
echo.

:: Мы используем call npm run dev, чтобы выполнить скрипт из package.json
call npm run dev

if %ERRORLEVEL% neq 0 (
    echo.
    echo [!] Ошибка при запуске через concurrently.
    echo [!] Пробую запустить по отдельности в разных окнах...
    echo.
    start cmd /k "title Blink Server && cd server && npm run dev"
    start cmd /k "title Blink Client && cd client && npm run dev -- --host"
)

pause