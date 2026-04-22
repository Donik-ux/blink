# Blink — Трекер геолокации друзей в реальном времени

Полнофункциональное мобильное приложение для отслеживания местоположения друзей в реальном времени.

## 🚀 Возможности

- **Карта в реальном времени** — Смотри друзей на интерактивной Leaflet карте
- **Геолокация** — Автоматическое обновление координат каждые 5 секунд
- **Приглашение друзей** — Уникальные 6-символьные коды приглашения
- **Режим призрака** — Останься невидимым для всех
- **Расчет расстояния** — Узнай расстояние до каждого друга
- **Уведомления** — Когда друг рядом, онлайн или принял запрос
- **Редактирование профиля** — 10 цветов для аватара, редактирование имени
- **Приватность** — Контроль видимости: для друзей или для всех

## 📋 Требования

- Node.js 16+
- MongoDB (локально или Atlas)
- Redis (опционально)

## 🛠️ Установка

### Backend

```bash
cd server
npm install
```

**Настрой .env:**

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/blink
REDIS_URL=redis://localhost:6379
JWT_SECRET=supersecretkey123
JWT_REFRESH_SECRET=refreshsecretkey456
NODE_ENV=development
```

**Запуск:**

```bash
npm run dev
```

### Frontend

```bash
cd client
npm install
```

**Настрой .env:**

```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

**Запуск:**

```bash
npm run dev
```

Приложение откроется на `http://localhost:5173`

## 📱 Первый вход

1. На экране **Онбординга** посмотри 3 слайда и нажми "Начать"
2. **Зарегистрируйся** — введи имя, email, пароль
3. **Вход** — используй свои учётные данные
4. Разреши **геолокацию** браузера
5. На карте увидишь своё место

## 🔗 API Endpoints

### Auth
- `POST /api/auth/register` — Регистрация
- `POST /api/auth/login` — Вход
- `POST /api/auth/logout` — Выход

### Friends
- `GET /api/friends` — Список друзей с локациями
- `GET /api/friends/requests` — Входящие запросы
- `POST /api/friends/invite` — Добавить друга по коду
- `PUT /api/friends/:id/accept` — Принять запрос
- `PUT /api/friends/:id/reject` — Отклонить запрос
- `DELETE /api/friends/:id` — Удалить друга

### Profile
- `GET /api/profile` — Получить профиль
- `PUT /api/profile` — Обновить профиль

### Notifications
- `GET /api/notifications` — Список уведомлений
- `PUT /api/notifications/read-all` — Отметить как прочитанные

## 🔌 Socket.io События

**Клиент → Сервер:**
- `join` — Подключение пользователя
- `update-location` — Обновление геолокации

**Сервер → Клиент:**
- `friend-location-update` — Обновление локации друга
- `friend-nearby` — Друг рядом (< 1 км)
- `friend-online` — Друг вышел онлайн
- `friend-offline` — Друг вышел оффлайн

## 🎨 Цвета дизайна

- **Background:** `#0a0a0f` (тёмный)
- **Surface:** `#111118` (поверхность)
- **Accent:** `#63b4ff` (синий основной цвет)
- **Ghost:** `#a855f7` (фиолетовый для режима призрака)
- **Online:** `#22c55e` (зелёный)
- **Offline:** `#374151` (серый)

## 📚 Технологии

### Backend
- **Express** — Web фреймворк
- **Socket.io** — WebSockets
- **MongoDB** — База данных
- **Mongoose** — ODM для MongoDB
- **Redis** — Кэш (опционально)
- **JWT** — Аутентификация
- **bcryptjs** — Хеширование паролей

### Frontend
- **React 18** — UI фреймворк
- **Vite** — Сборщик
- **TailwindCSS** — CSS утилиты
- **Leaflet** — Карты
- **Socket.io-client** — WebSocket клиент
- **Zustand** — State management
- **Axios** — HTTP клиент
- **React Router** — Роутинг

## 📝 Структура файлов

```
Blink/
├── server/
│   ├── index.js              — Главный файл сервера
│   ├── package.json
│   ├── .env
│   ├── config/
│   │   ├── db.js             — MongoDB подключение
│   │   └── redis.js          — Redis подключение
│   ├── models/
│   │   ├── User.js
│   │   ├── Location.js
│   │   ├── Friendship.js
│   │   └── Notification.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── friends.js
│   │   ├── profile.js
│   │   └── notifications.js
│   ├── middleware/
│   │   └── auth.js           — JWT верификация
│   ├── socket/
│   │   └── handlers.js       — Socket.io обработчики
│   └── utils/
│       ├── haversine.js      — Расчёт расстояния
│       ├── geocode.js        — Геокодирование
│       └── helpers.js        — Вспомогательные функции
│
└── client/
    ├── index.html
    ├── package.json
    ├── .env
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── index.css
        ├── api/
        │   ├── client.js      — Axios интерцептор
        │   ├── auth.js
        │   ├── friends.js
        │   ├── notifications.js
        │   └── profile.js
        ├── store/            — Zustand stores
        │   ├── authStore.js
        │   ├── locationStore.js
        │   ├── friendStore.js
        │   └── notifStore.js
        ├── hooks/
        │   ├── useGeolocation.js
        │   └── useSocket.js
        ├── components/
        │   ├── Avatar.jsx
        │   ├── Toast.jsx
        │   ├── BottomNav.jsx
        │   ├── InviteBox.jsx
        │   ├── GhostToggle.jsx
        │   ├── FriendRow.jsx
        │   ├── FriendPopup.jsx
        │   └── FriendPin.jsx
        └── pages/
            ├── Onboarding.jsx
            ├── Login.jsx
            ├── Register.jsx
            ├── Map.jsx
            ├── Friends.jsx
            ├── Activity.jsx
            └── Profile.jsx
```

## 🔐 Безопасность

- Все пароли хешируются с **bcryptjs**
- JWT токены для аутентификации
- Валидация на клиенте и сервере
- CORS настроен корректно
- Геолокация требует разрешение браузера

## 📱 Мобильный браузер

Приложение полностью оптимизировано для мобильных браузеров:
- Viewport настроен правильно
- Touch events работают
- Размеры элементов удобны для пальца
- Карта работает на всех современных браузерах

## 🐛 Типичные проблемы

**Геолокация не работает:**
- Проверь, что браузер запросил разрешение
- Используй HTTPS в production
- Включи high accuracy

**MongoDB не подключается:**
```bash
# Запусти MongoDB локально
mongod
```

или используй MongoDB Atlas с URI строкой.

**Socket.io не подключается:**
- Проверь `VITE_SOCKET_URL` в .env
- Обрати внимание на CORS настройки на сервере

## 📄 Лицензия

MIT

## 👨‍💻 Автор

Создано для трекинга друзей в реальном времени.

Приложение **полностью функционально** и готово к использованию! 🚀
