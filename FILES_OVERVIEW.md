# Обзор файлов проекта

## 📁 Структура проекта

Всего создано **52 файла**, включая код, конфигурацию и документацию.

---

## 📄 Документация (7 файлов)

| Файл | Назначение |
|------|-----------|
| `README.md` | Полная документация на английском |
| `README.ru.md` | Краткая документация на русском |
| `QUICKSTART.md` | Быстрый старт за 5 минут |
| `DEPLOYMENT.md` | Подробное руководство по развертыванию |
| `PROJECT_SUMMARY.md` | Описание проекта и его компонентов |
| `FIRST_RUN.md` | Инструкции для первого запуска |
| `FILES_OVERVIEW.md` | Этот файл |

---

## 🔧 Корневые конфигурационные файлы (4 файла)

| Файл | Назначение |
|------|-----------|
| `package.json` | Корневой package.json с командами для всего проекта |
| `railway.toml` | Конфигурация для развертывания на Railway |
| `.gitignore` | Список файлов, игнорируемых Git |
| `.github/workflows/deploy-frontend.yml` | GitHub Actions для автоматического развертывания фронтенда |

---

## 🖥️ Backend (19 файлов)

### Корень backend/

| Файл | Назначение |
|------|-----------|
| `package.json` | Зависимости и скрипты для backend |
| `.env` | Переменные окружения (с вашими данными) |
| `.env.example` | Пример переменных окружения |
| `railway.json` | Конфигурация Railway специфично для backend |

### backend/src/

| Файл | Назначение |
|------|-----------|
| `index.js` | Главный файл сервера Express |

### backend/src/config/

| Файл | Назначение |
|------|-----------|
| `database.js` | Настройка подключения к PostgreSQL |
| `bot.js` | Конфигурация Telegram бота |

### backend/src/bot/

| Файл | Назначение |
|------|-----------|
| `index.js` | Telegram бот: команды, обработка платежей |

### backend/src/controllers/

| Файл | Назначение |
|------|-----------|
| `gameController.js` | Контроллеры API (game-state, place-block, claim-payout) |

### backend/src/routes/

| Файл | Назначение |
|------|-----------|
| `api.js` | Маршруты API endpoints |

### backend/src/services/

| Файл | Назначение |
|------|-----------|
| `gameLogic.js` | Математика игры (вероятность обрушения, выплаты) |
| `userService.js` | Работа с пользователями |
| `seasonService.js` | Управление сезонами |
| `towerService.js` | Управление башнями и блоками |
| `activityService.js` | Лента активности |
| `offerService.js` | Специальные предложения |

### backend/src/migrations/

| Файл | Назначение |
|------|-----------|
| `run.js` | Миграции базы данных (создание таблиц) |

### backend/src/utils/

| Файл | Назначение |
|------|-----------|
| `cronJobs.js` | Cron задачи (автоматическая смена сезонов) |

---

## 🎨 Frontend (22 файла)

### Корень frontend/

| Файл | Назначение |
|------|-----------|
| `package.json` | Зависимости и скрипты для frontend |
| `vite.config.js` | Конфигурация Vite (сборщик) |
| `index.html` | HTML entry point |
| `.env` | Переменные окружения |
| `.env.example` | Пример переменных окружения |

### frontend/src/

| Файл | Назначение |
|------|-----------|
| `main.jsx` | React entry point |
| `App.jsx` | Главный компонент приложения |
| `App.css` | Стили для App |

### frontend/src/api/

| Файл | Назначение |
|------|-----------|
| `client.js` | API клиент + обертка для Telegram WebApp SDK |

### frontend/src/styles/

| Файл | Назначение |
|------|-----------|
| `global.css` | Глобальные стили, CSS переменные, темы |

### frontend/src/components/

| Файл | Назначение |
|------|-----------|
| `Header.jsx` | Компонент шапки (сезон, баланс) |
| `Header.css` | Стили для Header |
| `TowerDisplay.jsx` | Отображение башни (высота, визуализация блоков) |
| `TowerDisplay.css` | Стили для TowerDisplay |
| `ActionButton.jsx` | Кнопка "Place Block" |
| `ActionButton.css` | Стили для ActionButton |
| `ActivityFeed.jsx` | Лента активности (последние события) |
| `ActivityFeed.css` | Стили для ActivityFeed |
| `Leaderboard.jsx` | Таблица лидеров |
| `Leaderboard.css` | Стили для Leaderboard |
| `SpecialOffers.jsx` | Специальные предложения |
| `SpecialOffers.css` | Стили для SpecialOffers |

---

## 🔑 Ключевые файлы для понимания проекта

### Начать изучение с этих файлов:

1. **FIRST_RUN.md** - Пошаговая инструкция запуска
2. **backend/src/index.js** - Точка входа backend
3. **backend/src/services/gameLogic.js** - Игровая механика
4. **frontend/src/App.jsx** - Главный компонент UI
5. **backend/src/bot/index.js** - Telegram бот

---

## 🎯 Что делает каждая часть

### Backend отвечает за:
- API endpoints для frontend
- Telegram бот (команды /start, /stats, /referral)
- Обработка платежей Telegram Stars
- Игровая логика (вероятность обрушения, выплаты)
- Автоматическая смена сезонов (cron jobs)
- Хранение данных в PostgreSQL

### Frontend отвечает за:
- Пользовательский интерфейс
- Интеграция с Telegram WebApp
- Визуализация башни
- Анимации (Framer Motion)
- Отображение статистики, лидеров, активности

### База данных хранит:
- Пользователей (users)
- Сезоны (seasons)
- Башни (towers)
- Блоки (blocks)
- Активность (activity_feed)
- Спецпредложения (special_offers)

---

## 🔄 Поток данных

```
Пользователь в Telegram
    ↓
Нажимает "Play Game"
    ↓
Открывается WebApp (frontend на GitHub Pages)
    ↓
Frontend делает запрос к API (backend на Railway)
    ↓
Backend обрабатывает запрос, обращается к БД
    ↓
Возвращает данные frontend
    ↓
Frontend отображает результат пользователю
```

### Обработка платежей:

```
Пользователь нажимает "Place Block" (нет блоков)
    ↓
Frontend вызывает /api/create-invoice
    ↓
Backend создает Telegram Stars invoice
    ↓
Telegram показывает окно оплаты
    ↓
Пользователь платит
    ↓
Telegram отправляет successful_payment в бота
    ↓
Backend обрабатывает платеж, размещает блок
    ↓
Frontend обновляет состояние игры
```

---

## 📦 Зависимости

### Backend:
- express - веб-фреймворк
- pg - PostgreSQL клиент
- node-telegram-bot-api - Telegram Bot API
- node-cron - планировщик задач
- dotenv - переменные окружения
- cors - CORS middleware

### Frontend:
- react - UI библиотека
- react-dom - React DOM renderer
- framer-motion - анимации
- vite - сборщик

---

## 🚀 Команды для работы с проектом

```bash
# Из корня проекта:

# Установить все зависимости
npm run install:all

# Запустить backend (dev)
npm run dev:backend

# Запустить frontend (dev)
npm run dev:frontend

# Собрать frontend
npm run build:frontend

# Миграции БД
npm run migrate
```

---

## ✅ Готовность к развертыванию

Все файлы готовы для развертывания:

- ✅ Backend готов для Railway
- ✅ Frontend готов для GitHub Pages
- ✅ База данных готова для PostgreSQL
- ✅ Telegram бот настроен
- ✅ Документация написана

Следуйте инструкциям в **FIRST_RUN.md** для развертывания!

---

## 🎉 Итого

**Проект полностью готов к использованию!**

- 52 файла созданы
- Вся функциональность реализована
- Документация подробная
- Готов к развертыванию

Удачи с вашей игрой! 🏗️⭐️
