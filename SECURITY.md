# 🔒 Безопасность

## ⚠️ ВАЖНО: Не коммитьте секретные данные!

### Файлы, которые НЕ должны попадать в Git:

- ❌ `backend/.env` - содержит BOT_TOKEN
- ❌ `frontend/.env` - может содержать API URL
- ❌ `node_modules/` - зависимости
- ❌ Любые файлы с паролями, токенами, ключами

### Эти файлы уже в .gitignore:

✅ `.env` файлы игнорируются автоматически
✅ `node_modules/` игнорируются
✅ Build артефакты игнорируются

## 🔑 Как правильно хранить секреты

### Локальная разработка

1. Скопируйте `.env.example`:
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

2. Заполните своими данными:
   ```bash
   # backend/.env
   BOT_TOKEN=ваш_токен
   DATABASE_URL=ваш_database_url
   ```

3. **Никогда** не коммитьте `.env` файлы!

### Production (Railway)

1. Используйте Environment Variables в Railway dashboard
2. Переменные хранятся безопасно на стороне Railway
3. Не добавляются в Git

### Production (GitHub Pages)

1. Используйте GitHub Secrets
2. Settings → Secrets and variables → Actions
3. Секреты не видны в коде

## 🛡️ Ваши данные для этого проекта

**Telegram Bot:**
- Токен: `YOUR_BOT_TOKEN_HERE`

**⚠️ ВАЖНО:**
Этот токен уже известен (указан в документации), но в production вы должны:

1. **Использовать новый токен** (создайте нового бота через @BotFather)
2. **Хранить токен только в Railway Environment Variables**
3. **Не публиковать токен в коде**

## 🔄 Смена токена бота

Если токен скомпрометирован:

1. Зайдите в @BotFather
2. Отправьте `/mybots`
3. Выберите вашего бота
4. "Bot Settings" → "Regenerate API Token"
5. Обновите токен в Railway Environment Variables
6. Перезапустите backend на Railway

## 📋 Чеклист безопасности

Перед коммитом проверьте:

- [ ] `.env` файлы не добавлены в Git
- [ ] Нет захардкоженных паролей в коде
- [ ] Нет API ключей в коде
- [ ] Все секреты в Environment Variables (Railway/GitHub)
- [ ] `.gitignore` настроен правильно

## 🔍 Как проверить, что секреты не в Git

```bash
# Проверить, какие файлы будут закоммичены
git status

# Проверить, нет ли .env в staged
git ls-files | grep .env

# Если .env случайно добавлен, удалить из staging
git rm --cached backend/.env
git rm --cached frontend/.env
```

## 🚨 Если токен попал в Git

1. **Немедленно** смените токен через @BotFather
2. Удалите токен из истории Git:
   ```bash
   # Это сложная операция, осторожно!
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch backend/.env" \
     --prune-empty --tag-name-filter cat -- --all
   ```
3. Force push (если репозиторий приватный):
   ```bash
   git push origin --force --all
   ```

## 🎯 Рекомендации

### ДЛЯ РАЗРАБОТКИ:

1. Используйте тестового бота
2. Используйте локальную БД
3. Не используйте production токены

### ДЛЯ PRODUCTION:

1. Храните все секреты в Railway/GitHub Secrets
2. Используйте разные токены для dev/prod
3. Регулярно ротируйте токены
4. Мониторьте логи на подозрительную активность

## 📖 Дополнительно

- **Railway Security:** https://docs.railway.app/deploy/deployments#environment-variables
- **GitHub Secrets:** https://docs.github.com/en/actions/security-guides/encrypted-secrets
- **Telegram Bot Security:** https://core.telegram.org/bots/features#security

---

**Помните:** Безопасность - это не одноразовая задача, а постоянный процесс!

🔒 Храните секреты в секрете! 🔒
