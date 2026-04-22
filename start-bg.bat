@echo off
title Blink — Запуск в фоне (можно закрыть это окно)
setlocal enabledelayedexpansion

echo ==========================================
echo    BLINK - ФОНОВЫЙ ЗАПУСК (PM2)
echo ==========================================
echo.

:: 1. Проверка PM2
echo [1/5] Проверка PM2...
where pm2 >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [!] PM2 не установлен. Устанавливаю глобально...
    call npm install -g pm2
    if %ERRORLEVEL% neq 0 (
        echo [X] Не удалось установить PM2. Запусти вручную: npm install -g pm2
        pause
        exit /b 1
    )
)
echo     OK

:: 2. Установка зависимостей если нужно
echo [2/5] Проверка зависимостей...
if not exist "server\node_modules" (
    echo     Устанавливаю серверные...
    cd server && call npm install && cd ..
)
if not exist "client\node_modules" (
    echo     Устанавливаю клиентские...
    cd client && call npm install && cd ..
)
echo     OK

:: 3. Сборка клиента (production билд)
echo [3/5] Сборка клиента (vite build)...
cd client
call npm run build
if %ERRORLEVEL% neq 0 (
    echo [X] Ошибка сборки клиента
    cd ..
    pause
    exit /b 1
)
cd ..
echo     OK

:: 4. Создание папки логов
if not exist "logs" mkdir logs

:: 5. Поиск IP для мобильного доступа
echo [4/5] Поиск IP для телефона...
set "IP=localhost"
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4"') do (
    set "temp_ip=%%a"
    set "temp_ip=!temp_ip: =!"
    if "!temp_ip:~0,3!"=="192" set "IP=!temp_ip!"
    if "!temp_ip:~0,2!"=="10" set "IP=!temp_ip!"
)
echo     IP: !IP!

:: 6. Останавливаем старые процессы PM2 (если были)
echo [5/5] Запуск через PM2...
call pm2 delete ecosystem.config.cjs >nul 2>&1

:: Запускаем
call pm2 start ecosystem.config.cjs
if %ERRORLEVEL% neq 0 (
    echo [X] Ошибка запуска PM2
    pause
    exit /b 1
)

:: Сохраняем процесс-лист — чтобы pm2 resurrect мог восстановить после перезагрузки
call pm2 save

echo.
echo ==========================================
echo    BLINK ЗАПУЩЕН В ФОНЕ
echo ==========================================
echo.
echo  Локально:  http://localhost:5173
echo  Телефон:   http://!IP!:5173
echo.
echo  Полезные команды:
echo    pm2 status         - статус процессов
echo    pm2 logs           - живые логи
echo    pm2 restart all    - перезапуск
echo    stop-bg.bat        - остановить всё
echo.
echo  Можно закрыть это окно — приложение продолжит работать.
echo ==========================================
pause
