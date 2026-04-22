# 🚀 Деплой Blink на Render

Один клик — поднимает и backend (Express + Socket.io), и frontend (Vite static).

## Шаг 1 — MongoDB Atlas (5 мин)
1. https://cloud.mongodb.com → Sign up (бесплатно)
2. Create cluster → **M0 Free** → Region: Frankfurt (или ближайший)
3. Database Access → Add User → запомни пароль
4. Network Access → Add IP → `0.0.0.0/0` (доступ откуда угодно)
5. Connect → Drivers → Скопируй URI вида:
   ```
   mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/blink?retryWrites=true&w=majority
   ```

## Шаг 2 — Render Blueprint (3 мин)
1. https://render.com → Sign up (через GitHub)
2. New + → **Blueprint**
3. Connect repo `Donik-ux/blink`
4. Render найдёт `render.yaml` сам
5. Нажми **Apply**

## Шаг 3 — Заполнить секреты
В дашборде Render открой сервис `blink-server` → Environment:
- **MONGODB_URI** — вставь URI из шага 1
- **REDIS_URL** — оставь пустым (опционально)
- **JWT_SECRET / JWT_REFRESH_SECRET** — Render сгенерил автоматически ✓

Жди ~5 минут пока соберётся.

## Шаг 4 — Готово
- Backend: `https://blink-server.onrender.com`
- Frontend: `https://blink-client.onrender.com`

Открой frontend URL на телефоне → работает! 🎉

---

## ⚠️ Особенности бесплатного плана Render
- Backend засыпает после **15 мин** неактивности
- Первый запрос после сна — ~30 секунд (просыпается)
- Решение: либо платный план ($7/мес), либо сервис типа **UptimeRobot** который пингует `/health` каждые 5 мин

## Альтернатива: Vercel для фронта (быстрее, без cold start)
1. https://vercel.com → Import Git Repo → `Donik-ux/blink`
2. Root Directory: `client`
3. Environment Variables:
   - `VITE_API_URL` = `https://blink-server.onrender.com`
   - `VITE_SOCKET_URL` = `https://blink-server.onrender.com`
4. Deploy

## Обновления
Каждый `git push origin main` — Render и Vercel автоматически передеплоят.
