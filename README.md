# Tower Gamble - Telegram Mini App

A gambling-style game where users build towers by placing blocks. Each block increases the risk of collapse but also increases potential payout. Players compete in 5-day seasons for proportional rewards.

## Overview

- **Platform:** Telegram Mini App
- **Currency:** Telegram Stars
- **Game Duration:** 5-day seasons
- **Payout:** 80% of prize pool distributed proportionally to survivors

## Project Structure

```
tgtower.github.io/
├── backend/               # Node.js Express backend
│   ├── src/
│   │   ├── bot/          # Telegram bot
│   │   ├── config/       # Database config
│   │   ├── controllers/  # API controllers
│   │   ├── migrations/   # Database migrations
│   │   ├── routes/       # API routes
│   │   ├── services/     # Business logic
│   │   └── utils/        # Utilities (cron jobs)
│   └── package.json
├── frontend/             # React frontend
│   ├── src/
│   │   ├── api/         # API client
│   │   ├── components/  # React components
│   │   ├── styles/      # CSS styles
│   │   └── App.jsx      # Main app
│   └── package.json
└── README.md
```

## Game Mechanics

### Collapse Probability

The probability of tower collapse increases with height:

```javascript
collapse_probability = 1 - (0.99 ^ height)
```

Examples:
- Height 1: 1% chance
- Height 10: 9.56% chance
- Height 50: 39.50% chance
- Height 100: 63.40% chance

### Prize Distribution

At the end of each 5-day season:

```javascript
user_payout = (total_pool * 0.8) * (user_height / total_survivor_height)
```

- 80% of prize pool distributed to survivors
- 20% kept by platform
- Distribution proportional to tower height

## Setup Instructions

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Telegram Bot Token
- Railway account (for backend hosting)
- GitHub account (for frontend hosting)

### Backend Setup (Railway)

1. **Create Railway Project:**
   ```bash
   # Visit https://railway.app and create new project
   # Add PostgreSQL database
   ```

2. **Configure Environment Variables in Railway:**
   ```
   BOT_TOKEN=YOUR_BOT_TOKEN_HERE
   WEBAPP_URL=https://tgtower.github.io
   DATABASE_URL=postgresql://... (auto-set by Railway)
   PORT=8080
   NODE_ENV=production
   ALLOWED_ORIGINS=https://tgtower.github.io
   ```

3. **Deploy:**
   - Connect your GitHub repository to Railway
   - Railway will automatically deploy from the `backend` directory
   - Database migrations run automatically on deployment

### Frontend Setup (GitHub Pages)

1. **Configure Repository Settings:**
   - Go to Settings → Pages
   - Source: GitHub Actions

2. **Add GitHub Secrets:**
   - Go to Settings → Secrets and variables → Actions
   - Add secret: `VITE_API_URL` = `https://your-railway-app.up.railway.app`

3. **Deploy:**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

   GitHub Actions will automatically build and deploy the frontend.

### Local Development

#### Backend

```bash
cd backend
npm install

# Create .env file
cp .env.example .env
# Edit .env with your credentials

# Run database migrations
npm run db:migrate

# Start development server
npm run dev
```

#### Frontend

```bash
cd frontend
npm install

# Create .env file
cp .env.example .env
# Edit .env: VITE_API_URL=http://localhost:8080

# Start development server
npm run dev
```

Visit: http://localhost:5173

## Telegram Bot Configuration

### Set Bot Commands

Use BotFather to set these commands:

```
start - Start playing Tower Gamble
stats - View your statistics
referral - Get your referral link
```

### Set Menu Button

After deployment, set the menu button to open your WebApp:

```bash
# Use BotFather
/mybots
→ Select @towerbuildbot
→ Bot Settings
→ Menu Button
→ Edit Menu Button URL
→ Enter: https://tgtower.github.io
```

Or use the Bot API:

```bash
curl -X POST "https://api.telegram.org/botYOUR_BOT_TOKEN_HERE/setChatMenuButton" \
  -H "Content-Type: application/json" \
  -d '{"menu_button": {"type": "web_app", "text": "Play Game", "web_app": {"url": "https://tgtower.github.io"}}}'
```

## API Endpoints

### POST /api/game-state
Get complete game state for user.

**Request:**
```json
{
  "telegram_id": 123456789,
  "username": "john_doe",
  "first_name": "John"
}
```

**Response:**
```json
{
  "user": { ... },
  "season": { ... },
  "tower": { ... },
  "special_offers": [ ... ],
  "leaderboard": [ ... ],
  "activity_feed": [ ... ]
}
```

### POST /api/place-block
Place a block using blocks balance.

### POST /api/create-invoice
Create Telegram Stars invoice for payment.

### POST /api/claim-payout
Claim payout from ended season.

## Database Schema

### Tables

- **users** - User profiles and statistics
- **seasons** - Game seasons (5 days each)
- **towers** - User towers per season
- **blocks** - Block placement history
- **activity_feed** - Live activity stream
- **special_offers** - Time-limited offers

See [backend/src/migrations/run.js](backend/src/migrations/run.js) for complete schema.

## Cron Jobs

### Season End Check (Every Hour)
Checks if active season has ended by time and creates next season.

### All Towers Collapsed Check (Every 10 Minutes)
Ends season early if all towers have collapsed.

## Payment Flow

1. User clicks "Place Block"
2. If user has blocks balance → use balance
3. If no balance → create Telegram Stars invoice (10 Stars)
4. User pays via Telegram
5. Bot receives `successful_payment` event
6. Block placed automatically

## Referral System

- Users get unique referral link: `https://t.me/towerbuildbot?start=123456789`
- Both referrer and new user receive +1 free block
- Tracked in `users.referred_by` field

## Special Offers

### Newcomer Pack
- 50 blocks for 475 Stars (5% discount)
- Created automatically on user registration
- Expires in 3 days

## Features

- Real-time leaderboard
- Live activity feed
- Haptic feedback
- Dark/Light theme support
- Smooth animations with Framer Motion
- Responsive mobile design

## Tech Stack

**Backend:**
- Node.js + Express
- PostgreSQL
- node-telegram-bot-api
- node-cron

**Frontend:**
- React 18
- Vite
- Framer Motion
- Telegram WebApp SDK

**Hosting:**
- Backend: Railway
- Frontend: GitHub Pages

## Testing

### Test Bot Locally

1. Start backend: `npm run dev` (in backend folder)
2. Use ngrok to expose local server:
   ```bash
   ngrok http 8080
   ```
3. Update `WEBAPP_URL` in backend `.env` to ngrok URL
4. Update frontend `.env.local`: `VITE_API_URL=https://your-ngrok-url`
5. Deploy frontend locally: `npm run dev`
6. Test in Telegram app

### Test Payments

Use Telegram's test payment environment to test Stars payments without real money.

## Monitoring

Check Railway logs for:
- API requests
- Payment events
- Cron job execution
- Database errors

## Troubleshooting

### Bot Not Responding
- Check `BOT_TOKEN` in Railway environment variables
- Verify bot is running in Railway logs
- Ensure only one bot instance is running

### WebApp Not Loading
- Check `WEBAPP_URL` in Railway matches GitHub Pages URL
- Verify CORS settings in backend
- Check browser console for errors

### Database Connection Failed
- Verify `DATABASE_URL` in Railway
- Check PostgreSQL service is running
- Run migrations: `npm run db:migrate`

### Payments Not Working
- Test with small amounts first
- Check `successful_payment` handler in bot
- Verify invoice payload structure

## License

MIT

## Support

For issues, please open a GitHub issue or contact the developer.

---

**Bot Username:** @towerbuildbot
**WebApp URL:** https://tgtower.github.io
**Backend URL:** (Set after Railway deployment)
