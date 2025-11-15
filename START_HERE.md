# 🏗️ Tower Gamble - Начните отсюда!

## 👋 Добро пожаловать!

Ваш проект **Tower Gamble** полностью готов! Все файлы созданы, код написан, осталось только развернуть.

---

## ⚡ Самый быстрый способ запустить

### 1. Установите зависимости (1 минута)

```bash
npm run install:all
```

### 2. Разверните на Railway (5 минут)

1. Зайдите на https://railway.app
2. Войдите через GitHub
3. "New Project" → "Deploy from GitHub repo" → выберите `tgtower.github.io`
4. Добавьте PostgreSQL: "New" → "Database" → "Add PostgreSQL"
5. Настройте backend:
   - Settings → Root Directory: `backend`
   - Variables → Добавьте:
     ```
     BOT_TOKEN=YOUR_BOT_TOKEN_HERE
     WEBAPP_URL=https://tgtower.github.io
     ALLOWED_ORIGINS=https://tgtower.github.io
     ```
6. Deploy!
7. Скопируйте URL вашего приложения

### 3. Разверните на GitHub Pages (2 минуты)

1. Settings → Pages → Source: "GitHub Actions"
2. Settings → Secrets → Добавьте:
   - Name: `VITE_API_URL`
   - Value: ваш Railway URL
3. Запуште код:
   ```bash
   git add .
   git commit -m "Deploy"
   git push origin main
   ```

### 4. Настройте бота (1 минута)

```bash
curl -X POST "https://api.telegram.org/botYOUR_BOT_TOKEN_HERE/setChatMenuButton" \
  -H "Content-Type: application/json" \
  -d '{"menu_button": {"type": "web_app", "text": "Play Game", "web_app": {"url": "https://tgtower.github.io"}}}'
```

### 5. Готово! 🎉

Откройте Telegram → @towerbuildbot → /start → Play Game

---

## 📚 Документация

Выберите нужный файл в зависимости от задачи:

| Если вы хотите... | Откройте этот файл |
|-------------------|-------------------|
| 🚀 Быстро запустить проект | [FIRST_RUN.md](FIRST_RUN.md) |
| 📖 Понять как все устроено | [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) |
| 🛠️ Подробно разобраться с развертыванием | [DEPLOYMENT.md](DEPLOYMENT.md) |
| ⚡ Самый быстрый старт | [QUICKSTART.md](QUICKSTART.md) |
| 🇷🇺 Кратко на русском | [README.ru.md](README.ru.md) |
| 🇬🇧 Полная документация | [README.md](README.md) |
| 📁 Понять структуру файлов | [FILES_OVERVIEW.md](FILES_OVERVIEW.md) |

---

## 🎯 Ваши данные

**Telegram Bot:**
- Юзернейм: @towerbuildbot
- Токен: `YOUR_BOT_TOKEN_HERE`

**URLs:**
- Frontend: https://tgtower.github.io
- Backend: Развернуть на Railway

---

## 🔍 Что внутри проекта

```
✅ Backend (Node.js + Express + PostgreSQL)
   - API endpoints
   - Telegram бот
   - Обработка платежей
   - Игровая логика
   - Автоматические сезоны

✅ Frontend (React + Vite + Telegram WebApp)
   - Красивый UI
   - Анимации
   - Интеграция с Telegram
   - Responsive дизайн

✅ База данных (PostgreSQL)
   - 6 таблиц
   - Миграции готовы
   - Индексы настроены

✅ Документация
   - 8 файлов документации
   - Пошаговые инструкции
   - Решение проблем
```

---

## 🎮 Как работает игра

1. **Пользователь заходит в бота** → отправляет /start
2. **Открывает игру** → нажимает "Play Game"
3. **Размещает блоки** → каждый блок = 10 Stars
4. **Рискует** → с каждым блоком риск обрушения растет
5. **Выигрывает** → если башня выстояла 5 дней
6. **Получает приз** → пропорционально высоте башни

### Математика:

```javascript
Вероятность обрушения = 1 - (0.99 ^ высота)

Высота 1:   1% шанс обрушения
Высота 50:  39.5% шанс
Высота 100: 63.4% шанс

Выплата = (общий_фонд * 80%) * (ваша_высота / общая_высота_выживших)
```

---

## 🚀 Команды для работы

```bash
# Установить зависимости
npm run install:all

# Локальная разработка
npm run dev:backend    # Terminal 1
npm run dev:frontend   # Terminal 2

# Миграции БД
npm run migrate

# Сборка frontend
npm run build:frontend
```

---

## ✅ Чеклист перед запуском

- [ ] Установлены зависимости
- [ ] Backend развернут на Railway
- [ ] PostgreSQL добавлен
- [ ] Переменные окружения установлены
- [ ] Frontend развернут на GitHub Pages
- [ ] Секрет VITE_API_URL добавлен
- [ ] Кнопка меню бота настроена
- [ ] Команды бота установлены

---

## 🐛 Проблемы?

### Backend не работает
→ Проверьте логи в Railway → Deployments → View Logs

### Frontend не загружается
→ Проверьте GitHub Actions → смотрите логи

### Бот не отвечает
→ Убедитесь, что backend запущен и токен правильный

**Подробнее:** [FIRST_RUN.md](FIRST_RUN.md) → раздел "Что делать если что-то не работает"

---

## 💰 Стоимость

- **Railway:** ~$5/месяц (Hobby план)
- **GitHub Pages:** Бесплатно
- **Итого:** ~$5/месяц

---

## 🎨 Кастомизация

Хотите изменить игру? Начните с этих файлов:

- `backend/src/services/gameLogic.js` - игровая механика
- `frontend/src/components/TowerDisplay.jsx` - UI башни
- `frontend/src/styles/global.css` - цвета и стили

---

## 📞 Поддержка

- **Telegram Bot API:** https://core.telegram.org/bots/api
- **Railway Docs:** https://docs.railway.app
- **React Docs:** https://react.dev

---

## 🎉 Следующие шаги

1. ✅ Разверните проект (следуйте инструкциям выше)
2. ✅ Протестируйте все функции
3. ✅ Пригласите друзей для тестирования
4. ✅ Настройте мониторинг
5. ✅ Продвигайте своего бота!

---

## 💡 Фичи проекта

- ✅ Telegram Stars платежи
- ✅ Автоматические сезоны (5 дней)
- ✅ Реферальная система (+1 блок обоим)
- ✅ Специальные предложения (50 блоков со скидкой)
- ✅ Таблица лидеров
- ✅ Лента активности
- ✅ Темная/светлая тема
- ✅ Анимации
- ✅ Haptic feedback

---

**Готовы начать?** → Откройте [FIRST_RUN.md](FIRST_RUN.md) и следуйте инструкциям!

Удачи! 🏗️⭐️
