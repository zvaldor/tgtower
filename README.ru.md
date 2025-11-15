# Tower Gamble - Телеграм Мини Приложение

Игра в стиле азартных игр, где пользователи строят башни, размещая блоки. Каждый блок увеличивает риск обрушения, но также увеличивает потенциальный выигрыш. Игроки соревнуются в 5-дневных сезонах за пропорциональное вознаграждение.

## 🎮 Ваши данные

**Бот:**
- Юзернейм: @towerbuildbot
- Токен: `YOUR_BOT_TOKEN_HERE`

**URL:**
- Frontend: https://tgtower.github.io
- Backend: (развернуть на Railway)

## 🚀 Быстрый старт

### Шаг 1: Установка зависимостей

```bash
# Установить все зависимости
npm run install:all
```

### Шаг 2: Развертывание Backend на Railway

1. Зайдите на [railway.app](https://railway.app)
2. Войдите через GitHub
3. Создайте новый проект из вашего репозитория
4. Добавьте PostgreSQL базу данных (кнопка "New" → "Database" → "PostgreSQL")
5. Установите переменные окружения:
   ```
   BOT_TOKEN=YOUR_BOT_TOKEN_HERE
   WEBAPP_URL=https://tgtower.github.io
   PORT=8080
   NODE_ENV=production
   ALLOWED_ORIGINS=https://tgtower.github.io
   ```
6. В настройках установите Root Directory: `backend`
7. Нажмите Deploy
8. Скопируйте URL вашего приложения (например: `https://your-app.up.railway.app`)

### Шаг 3: Развертывание Frontend на GitHub Pages

1. Перейдите в Settings → Pages
2. Source: "GitHub Actions"
3. Перейдите в Settings → Secrets and variables → Actions
4. Добавьте секрет:
   - Name: `VITE_API_URL`
   - Value: URL вашего Railway приложения
5. Запушьте код:
   ```bash
   git add .
   git commit -m "Initial deployment"
   git push origin main
   ```
6. Дождитесь завершения GitHub Actions (вкладка Actions)
7. Приложение будет доступно по адресу https://tgtower.github.io

### Шаг 4: Настройка Telegram бота

```bash
# Установить кнопку меню
curl -X POST "https://api.telegram.org/botYOUR_BOT_TOKEN_HERE/setChatMenuButton" \
  -H "Content-Type: application/json" \
  -d '{"menu_button": {"type": "web_app", "text": "Play Game", "web_app": {"url": "https://tgtower.github.io"}}}'
```

Настройте команды через @BotFather:
```
/setcommands
→ Выберите @towerbuildbot
→ Вставьте:
start - Начать игру Tower Gamble
stats - Показать статистику
referral - Получить реферальную ссылку
```

### Шаг 5: Тестирование

1. Откройте Telegram
2. Найдите @towerbuildbot
3. Отправьте `/start`
4. Нажмите "Play Game"
5. Попробуйте разместить блок!

## 📚 Документация

- [QUICKSTART.md](QUICKSTART.md) - Быстрый старт за 5 минут
- [DEPLOYMENT.md](DEPLOYMENT.md) - Полное руководство по развертыванию
- [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) - Описание проекта
- [README.md](README.md) - Полная документация (English)

## 🎯 Как работает игра

### Механика обрушения

Вероятность обрушения башни растет с высотой:

```
вероятность = 1 - (0.99 ^ высота)
```

Примеры:
- Высота 1: 1% шанс
- Высота 50: 39.5% шанс
- Высота 100: 63.4% шанс

### Распределение призового фонда

В конце каждого 5-дневного сезона:

```
выплата_игрока = (общий_фонд * 0.8) * (высота_игрока / общая_высота_выживших)
```

- 80% призового фонда распределяется между выжившими
- 20% остается платформе
- Распределение пропорционально высоте башни

## 🏗️ Структура проекта

```
tgtower.github.io/
├── backend/          # Node.js Express бэкенд
│   ├── src/
│   │   ├── bot/     # Telegram бот
│   │   ├── services/# Игровая логика
│   │   └── index.js # Точка входа
│   └── package.json
│
├── frontend/         # React фронтенд
│   ├── src/
│   │   ├── components/  # UI компоненты
│   │   └── App.jsx      # Главный компонент
│   └── package.json
│
└── README.md
```

## 💰 Монетизация

- **1 блок:** 10 Telegram Stars
- **Паки блоков:** со скидкой (например, 50 блоков = 475 Stars)
- **Новичкам:** специальное предложение (50 блоков за 475 Stars, действует 3 дня)

## 🔧 Команды для разработки

```bash
# Установить все зависимости
npm run install:all

# Запустить backend (разработка)
npm run dev:backend

# Запустить frontend (разработка)
npm run dev:frontend

# Собрать frontend для продакшена
npm run build:frontend

# Запустить миграции базы данных
npm run migrate
```

## 🐛 Частые проблемы

### Backend не запускается

✅ Проверьте, что DATABASE_URL установлен
✅ Проверьте, что BOT_TOKEN правильный
✅ Запустите миграции: `npm run migrate`

### Frontend не подключается к backend

✅ Проверьте, что VITE_API_URL совпадает с URL backend
✅ Проверьте CORS настройки в backend
✅ Откройте консоль браузера для проверки ошибок

### Бот не отвечает

✅ Убедитесь, что backend запущен
✅ Проверьте токен бота
✅ Убедитесь, что запущен только один экземпляр бота

## 📊 База данных

### Основные таблицы

- **users** - Профили пользователей, балансы, статистика
- **seasons** - 5-дневные игровые сезоны
- **towers** - Башни пользователей по сезонам
- **blocks** - История размещения блоков
- **activity_feed** - Лента активности
- **special_offers** - Специальные предложения

## 🎨 Возможности кастомизации

### Изменить игровую логику

Отредактируйте `backend/src/services/gameLogic.js`:
- Формула обрушения
- Процент выплат
- Стоимость блоков

### Изменить UI

Отредактируйте файлы в `frontend/src/components/`:
- Цвета в `styles/global.css`
- Анимации в компонентах
- Добавить новые функции

## 📞 Поддержка

- Railway Docs: https://docs.railway.app
- Telegram Bot API: https://core.telegram.org/bots/api
- Telegram WebApps: https://core.telegram.org/bots/webapps

## ✅ Что реализовано

- ✅ Полный backend API
- ✅ Миграции базы данных
- ✅ Telegram бот со всеми командами
- ✅ Обработка платежей (Stars)
- ✅ Полный React UI
- ✅ Анимации с Framer Motion
- ✅ Интеграция с Telegram WebApp
- ✅ Автоматизация сезонов
- ✅ Таблица лидеров
- ✅ Лента активности
- ✅ Реферальная система
- ✅ Специальные предложения
- ✅ Конфигурация развертывания
- ✅ Полная документация

## 🎉 Готово к запуску!

Ваша игра Tower Gamble готова к развертыванию. Следуйте инструкциям выше или обратитесь к DEPLOYMENT.md для подробного руководства.

Удачи с вашей игрой! 🏗️⭐️
