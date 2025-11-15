# Deployment Guide

## Quick Start

### Step 1: Deploy Backend to Railway

1. **Create Railway Account**
   - Visit https://railway.app
   - Sign up with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose `tgtower.github.io` repository

3. **Add PostgreSQL Database**
   - In your project, click "New"
   - Select "Database" → "Add PostgreSQL"
   - Railway will automatically set `DATABASE_URL`

4. **Configure Environment Variables**

   Go to your backend service → Variables, and add:

   ```
   BOT_TOKEN=YOUR_BOT_TOKEN_HERE
   WEBAPP_URL=https://tgtower.github.io
   PORT=8080
   NODE_ENV=production
   ALLOWED_ORIGINS=https://tgtower.github.io
   ```

5. **Set Root Directory**
   - Go to Settings → Root Directory
   - Set to: `backend`

6. **Deploy**
   - Click "Deploy"
   - Wait for deployment to complete
   - Copy your app URL (e.g., `https://your-app.up.railway.app`)

### Step 2: Deploy Frontend to GitHub Pages

1. **Enable GitHub Pages**
   - Go to repository Settings
   - Click "Pages" in left sidebar
   - Under "Build and deployment":
     - Source: "GitHub Actions"

2. **Add GitHub Secret**
   - Go to Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `VITE_API_URL`
   - Value: `https://your-app.up.railway.app` (your Railway URL)

3. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial deployment"
   git push origin main
   ```

4. **Check Deployment**
   - Go to "Actions" tab
   - Wait for workflow to complete
   - Your app will be live at `https://tgtower.github.io`

### Step 3: Configure Telegram Bot

1. **Set Menu Button**

   Run this command (replace with your bot token):

   ```bash
   curl -X POST "https://api.telegram.org/botYOUR_BOT_TOKEN_HERE/setChatMenuButton" \
     -H "Content-Type: application/json" \
     -d '{"menu_button": {"type": "web_app", "text": "Play Game", "web_app": {"url": "https://tgtower.github.io"}}}'
   ```

2. **Set Bot Commands (via BotFather)**

   Message @BotFather:
   ```
   /setcommands
   → Select @towerbuildbot
   → Paste:
   start - Start playing Tower Gamble
   stats - View your statistics
   referral - Get your referral link
   ```

3. **Test Your Bot**
   - Open Telegram
   - Search for @towerbuildbot
   - Send `/start`
   - Click "Play Game" button

## Verification Checklist

- [ ] Backend deployed to Railway
- [ ] Database created and connected
- [ ] Environment variables set
- [ ] Frontend deployed to GitHub Pages
- [ ] Bot menu button configured
- [ ] Bot commands set
- [ ] Test bot in Telegram
- [ ] Test placing a block
- [ ] Test payment flow
- [ ] Check leaderboard updates

## Common Issues

### Backend Not Starting

**Check Railway Logs:**
- Click on backend service → Deployments → View Logs
- Look for errors

**Common fixes:**
- Verify `DATABASE_URL` is set
- Check `BOT_TOKEN` is correct
- Ensure root directory is `backend`

### Frontend Not Loading

**Check GitHub Actions:**
- Go to Actions tab
- Click on latest workflow run
- Look for errors

**Common fixes:**
- Verify `VITE_API_URL` secret is set
- Check build logs for errors
- Ensure GitHub Pages is enabled

### Bot Not Responding

**Common fixes:**
- Verify bot token is correct
- Check Railway backend is running
- Ensure webhook is not set (we use polling)

### CORS Errors

**Fix:**
- Add your frontend URL to `ALLOWED_ORIGINS` in Railway
- Redeploy backend

## Updating the App

### Update Backend

1. Make changes to backend code
2. Commit and push to GitHub
3. Railway will automatically redeploy

### Update Frontend

1. Make changes to frontend code
2. Commit and push to GitHub
3. GitHub Actions will automatically rebuild and deploy

## Environment Variables Reference

### Backend (Railway)

| Variable | Value | Description |
|----------|-------|-------------|
| `BOT_TOKEN` | `8440138506:AAF...` | Telegram bot token |
| `WEBAPP_URL` | `https://tgtower.github.io` | Frontend URL |
| `DATABASE_URL` | Auto-set by Railway | PostgreSQL connection string |
| `PORT` | `8080` | Server port |
| `NODE_ENV` | `production` | Environment |
| `ALLOWED_ORIGINS` | `https://tgtower.github.io` | CORS allowed origins |

### Frontend (GitHub Secrets)

| Secret | Value | Description |
|--------|-------|-------------|
| `VITE_API_URL` | `https://your-app.up.railway.app` | Backend API URL |

## Database Management

### View Database

Use Railway's PostgreSQL plugin:
- Click on PostgreSQL service
- Click "Data" tab
- Browse tables

### Run Migrations Manually

If needed, you can run migrations via Railway CLI:

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to project
railway link

# Run migrations
railway run npm run db:migrate
```

### Backup Database

Railway provides automatic backups. To create manual backup:
- Go to PostgreSQL service
- Click "Backups" tab
- Click "Create Backup"

## Monitoring

### Backend Health Check

Visit: `https://your-app.up.railway.app/health`

Should return:
```json
{
  "status": "ok",
  "timestamp": "2025-11-15T..."
}
```

### Check Cron Jobs

Look for these in Railway logs:
```
[CRON] Season end check scheduled (every hour)
[CRON] All towers collapsed check scheduled (every 10 minutes)
```

### Monitor Errors

Railway logs will show:
- API errors
- Database connection issues
- Payment processing errors
- Cron job execution

## Scaling

### Backend

Railway automatically scales based on usage. To adjust:
- Go to backend service → Settings
- Adjust resources as needed

### Database

If you need more database resources:
- Upgrade PostgreSQL plan in Railway
- Or migrate to external PostgreSQL provider

## Security Best Practices

1. **Never commit `.env` files**
   - Already in `.gitignore`

2. **Rotate bot token periodically**
   - Use @BotFather to generate new token
   - Update in Railway variables

3. **Use HTTPS only**
   - GitHub Pages: automatic
   - Railway: automatic

4. **Monitor logs for suspicious activity**
   - Check for unusual API calls
   - Watch for failed payment attempts

## Cost Estimates

### Railway (Backend + Database)

- **Hobby Plan:** $5/month
  - 512MB RAM
  - 1GB Storage
  - 100GB Bandwidth

- **Pro Plan:** $20/month (if you need more resources)

### GitHub Pages (Frontend)

- **Free** for public repositories

### Total Monthly Cost: ~$5

## Support Resources

- **Railway Docs:** https://docs.railway.app
- **Telegram Bot API:** https://core.telegram.org/bots/api
- **Telegram WebApp:** https://core.telegram.org/bots/webapps
- **GitHub Actions:** https://docs.github.com/actions

---

**Need Help?**

1. Check Railway logs
2. Check GitHub Actions logs
3. Test locally first
4. Open GitHub issue with error details
