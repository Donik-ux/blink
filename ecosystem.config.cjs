// PM2 конфиг — позволяет серверу и клиенту работать в фоне даже после закрытия терминала.
// Использование:
//   start-bg.bat   — поднять оба процесса (build + start)
//   stop-bg.bat    — остановить
//   status-bg.bat  — посмотреть статус и логи
//
// PM2 docs: https://pm2.keymetrics.io/docs/usage/quick-start/

module.exports = {
  apps: [
    {
      name: 'blink-server',
      cwd: './server',
      script: 'index.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: '5000',
      },
      out_file: './logs/server-out.log',
      error_file: './logs/server-err.log',
      merge_logs: true,
      time: true,
    },
    {
      name: 'blink-client',
      cwd: './client',
      // vite preview обслуживает уже собранный dist на 5173 порту
      // --host даёт доступ с других устройств в локальной сети
      script: 'npm',
      args: 'run preview -- --host --port 5173',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      out_file: './logs/client-out.log',
      error_file: './logs/client-err.log',
      merge_logs: true,
      time: true,
    },
  ],
};
