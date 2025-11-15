# 🚀 Коммит и развертывание

## ✅ Проект готов к развертыванию!

Все файлы созданы и проект готов к коммиту в Git и развертыванию.

---

## 📝 Шаг 1: Коммит в Git

```bash
# Проверьте статус (должны быть только нужные файлы)
git status

# Добавьте все файлы
git add .

# Создайте коммит
git commit -m "Initial commit: Tower Gamble Telegram Mini App

- Backend: Express + PostgreSQL + Telegram Bot
- Frontend: React + Vite + Telegram WebApp
- Database: 6 tables with migrations
- Payment: Telegram Stars integration
- Features: Seasons, Leaderboard, Referrals, Special Offers
- Docs: Complete documentation in Russian and English"

# Запушьте в GitHub
git push origin main
```

---

## 🚀 Шаг 2: Автоматическое развертывание Frontend

После `git push`, GitHub Actions автоматически:

1. ✅ Соберет React приложение
2. ✅ Развернет на GitHub Pages
3. ✅ Приложение будет доступно по адресу https://tgtower.github.io

**Но сначала настройте:**

### 2.1. Включите GitHub Pages

1. Зайдите в Settings вашего репозитория
2. Перейдите в "Pages"
3. Source: выберите "GitHub Actions"

### 2.2. Добавьте Secret для API URL

**ВАЖНО:** Сначала разверните backend на Railway (Шаг 3), затем вернитесь сюда!

1. Settings → Secrets and variables → Actions
2. "New repository secret"
3. Name: `VITE_API_URL`
4. Value: (ваш Railway URL, например: `https://your-app.up.railway.app`)
5. "Add secret"

### 2.3. Проверьте развертывание

1. Перейдите во вкладку "Actions"
2. Дождитесь завершения workflow
3. Если зеленая галочка ✅ - все готово!
4. Откройте https://tgtower.github.io

---

## 🖥️ Шаг 3: Развертывание Backend на Railway

### 3.1. Создайте проект Railway

1. Зайдите на https://railway.app
2. Войдите через GitHub
3. "New Project"
4. "Deploy from GitHub repo"
5. Выберите `tgtower.github.io`

### 3.2. Добавьте PostgreSQL

1. В вашем проекте нажмите "New"
2. "Database" → "Add PostgreSQL"
3. Railway автоматически создаст базу и установит `DATABASE_URL`

### 3.3. Настройте Backend Service

**A) Установите Root Directory:**

1. Кликните на ваш service (tgtower...)
2. Settings → Root Directory
3. Введите: `backend`
4. Сохраните

**B) Добавьте Environment Variables:**

1. Перейдите во вкладку "Variables"
2. Добавьте следующие переменные:

```
BOT_TOKEN=YOUR_BOT_TOKEN_HERE
WEBAPP_URL=https://tgtower.github.io
PORT=8080
NODE_ENV=production
ALLOWED_ORIGINS=https://tgtower.github.io
```

**ВАЖНО:** Для production рекомендуется создать НОВОГО бота и использовать новый токен!

**C) Разверните:**

1. Railway автоматически начнет deployment
2. Дождитесь завершения (3-5 минут)
3. Проверьте логи на ошибки

### 3.4. Получите Railway URL

1. После успешного deployment
2. Кликните на ваш service
3. Найдите раздел "Deployments"
4. Скопируйте URL (например: `https://tgtower-production.up.railway.app`)

**⚠️ Теперь вернитесь к Шагу 2.2** и добавьте этот URL в GitHub Secrets!

### 3.5. Проверьте Backend

Откройте в браузере:
```
https://your-railway-url.up.railway.app/health
```

Должен вернуться JSON:
```json
{
  "status": "ok",
  "timestamp": "2025-11-15T..."
}
```

---

## 🤖 Шаг 4: Настройка Telegram Бота

### 4.1. Установите Menu Button

Выполните команду (замените URL если нужно):

```bash
curl -X POST "https://api.telegram.org/botYOUR_BOT_TOKEN_HERE/setChatMenuButton" \
  -H "Content-Type: application/json" \
  -d '{"menu_button": {"type": "web_app", "text": "Play Game", "web_app": {"url": "https://tgtower.github.io"}}}'
```

Ответ должен быть:
```json
{"ok":true,"result":true}
```

### 4.2. Установите команды через BotFather

1. Откройте Telegram
2. Найдите @BotFather
3. Отправьте: `/setcommands`
4. Выберите: @towerbuildbot
5. Вставьте:
   ```
   start - Начать игру Tower Gamble
   stats - Показать статистику
   referral - Получить реферальную ссылку
   ```

---

## ✅ Шаг 5: Финальная проверка

### 5.1. Проверьте Backend

- [ ] Railway deployment успешен (зеленый статус)
- [ ] Логи без критических ошибок
- [ ] `/health` endpoint отвечает
- [ ] База данных подключена

### 5.2. Проверьте Frontend

- [ ] GitHub Pages deployment успешен
- [ ] https://tgtower.github.io открывается
- [ ] Нет ошибок в консоли браузера
- [ ] API подключается к backend

### 5.3. Проверьте Telegram бота

1. Откройте Telegram
2. Найдите @towerbuildbot
3. Отправьте `/start`

**Должно произойти:**
- ✅ Бот ответит приветственным сообщением
- ✅ Появится кнопка "🎮 Play Now"
- ✅ При нажатии откроется WebApp
- ✅ Можно разместить блок

### 5.4. Проверьте функции

- [ ] Размещение блока работает
- [ ] Счетчик высоты обновляется
- [ ] Таблица лидеров показывает данные
- [ ] Лента активности обновляется
- [ ] `/stats` показывает статистику
- [ ] `/referral` дает реферальную ссылку

---

## 🎉 Готово!

Если все проверки пройдены - ваша игра полностью развернута и работает!

---

## 🔄 Обновление проекта

### Обновление Backend

1. Внесите изменения в код
2. Закоммитьте и запушьте:
   ```bash
   git add .
   git commit -m "Update: описание изменений"
   git push origin main
   ```
3. Railway автоматически пересоберет и развернет

### Обновление Frontend

1. Внесите изменения в код
2. Закоммитьте и запушьте (аналогично backend)
3. GitHub Actions автоматически пересоберет и развернет

---

## 🐛 Troubleshooting

### Frontend не подключается к Backend

**Проверьте:**
1. `VITE_API_URL` в GitHub Secrets правильный
2. CORS настроен в backend (`ALLOWED_ORIGINS`)
3. Railway backend запущен и доступен

**Решение:**
1. Проверьте консоль браузера (F12)
2. Проверьте логи Railway
3. Убедитесь, что URL совпадает

### Бот не отвечает

**Проверьте:**
1. Backend запущен на Railway
2. `BOT_TOKEN` правильный
3. Логи Railway не показывают ошибок подключения к Telegram API

**Решение:**
1. Проверьте логи Railway → ищите ошибки бота
2. Убедитесь, что токен валидный
3. Проверьте, что запущен только один экземпляр бота

### База данных не подключается

**Проверьте:**
1. PostgreSQL сервис запущен в Railway
2. `DATABASE_URL` установлен автоматически
3. Миграции выполнены

**Решение:**
1. Railway → PostgreSQL → проверьте статус
2. Проверьте переменные окружения
3. Перезапустите backend service

---

## 📊 Мониторинг

### Railway Logs

1. Railway → ваш service
2. Deployments → View Logs
3. Следите за ошибками

### GitHub Actions

1. Вкладка "Actions"
2. Смотрите историю deployments
3. Проверяйте логи при ошибках

### Database

1. Railway → PostgreSQL
2. Data → просмотр таблиц
3. Metrics → использование

---

## 💰 Стоимость

**Railway:**
- Hobby: $5/месяц
- Включает PostgreSQL

**GitHub Pages:**
- Бесплатно для публичных репозиториев

**Telegram:**
- Бесплатно (комиссия с Stars берется автоматически)

**Итого: ~$5/месяц**

---

## 📚 Документация

- [START_HERE.md](START_HERE.md) - Быстрый обзор
- [FIRST_RUN.md](FIRST_RUN.md) - Первый запуск
- [DEPLOYMENT.md](DEPLOYMENT.md) - Подробное развертывание
- [SECURITY.md](SECURITY.md) - Безопасность
- [README.md](README.md) - Полная документация

---

**Удачи с вашей игрой! 🏗️⭐️**

Если возникли проблемы - проверьте логи или создайте Issue на GitHub.
