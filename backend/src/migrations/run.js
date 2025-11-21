import pool from '../config/database.js';
import dotenv from 'dotenv';

dotenv.config();

const migrations = [
  // Migration 1: Create users table
  `CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    telegram_id BIGINT UNIQUE NOT NULL,
    telegram_username TEXT,
    telegram_first_name TEXT,
    blocks_balance INT DEFAULT 0,
    premium_blocks_balance INT DEFAULT 0,
    total_blocks_placed INT DEFAULT 0,
    total_stars_spent INT DEFAULT 0,
    total_stars_won INT DEFAULT 0,
    showed_onboarding BOOLEAN DEFAULT false,
    referred_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
  );`,

  // Migration 2: Create seasons table
  `CREATE TABLE IF NOT EXISTS seasons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    season_number INT UNIQUE NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    total_pool INT DEFAULT 0,
    premium_pool INT DEFAULT 0,
    total_blocks INT DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'ended', 'distributing', 'completed')),
    created_at TIMESTAMP DEFAULT NOW()
  );`,

  // Migration 3: Create towers table (shared tower per season)
  `CREATE TABLE IF NOT EXISTS towers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    season_id UUID REFERENCES seasons(id) NOT NULL,
    height INT DEFAULT 0,
    is_collapsed BOOLEAN DEFAULT false,
    collapse_height INT,
    final_payout INT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  );`,

  // Migration 3.5: Create user_contributions table to track each user's contribution
  `CREATE TABLE IF NOT EXISTS user_contributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) NOT NULL,
    season_id UUID REFERENCES seasons(id) NOT NULL,
    blocks_contributed INT DEFAULT 0,
    has_claimed_payout BOOLEAN DEFAULT false,
    payout_amount INT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, season_id)
  );`,

  // Migration 3.6: Create premium_towers table
  `CREATE TABLE IF NOT EXISTS premium_towers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    season_id UUID REFERENCES seasons(id) NOT NULL,
    height INT DEFAULT 0,
    is_collapsed BOOLEAN DEFAULT false,
    collapse_height INT,
    final_payout INT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  );`,

  // Migration 4: Create blocks table
  `CREATE TABLE IF NOT EXISTS blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tower_id UUID REFERENCES towers(id) NOT NULL,
    user_id UUID REFERENCES users(id),
    block_number INT NOT NULL,
    was_fatal BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
  );`,

  // Migration 5: Create activity_feed table
  `CREATE TABLE IF NOT EXISTS activity_feed (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) NOT NULL,
    season_id UUID REFERENCES seasons(id) NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('block_placed', 'tower_collapsed', 'payout_claimed')),
    tower_type TEXT DEFAULT 'regular' CHECK (tower_type IN ('regular', 'premium')),
    height INT,
    created_at TIMESTAMP DEFAULT NOW()
  );`,

  // Migration 6: Create special_offers table
  `CREATE TABLE IF NOT EXISTS special_offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) NOT NULL,
    offer_type TEXT NOT NULL,
    blocks_amount INT NOT NULL,
    stars_price INT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    is_claimed BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
  );`,

  // Migration 7: Create indexes
  `CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);`,
  `CREATE INDEX IF NOT EXISTS idx_seasons_status ON seasons(status);`,
  `CREATE INDEX IF NOT EXISTS idx_towers_season_id ON towers(season_id);`,
  `CREATE INDEX IF NOT EXISTS idx_towers_user_id ON towers(user_id);`,
  `CREATE INDEX IF NOT EXISTS idx_premium_towers_season_id ON premium_towers(season_id);`,
  `CREATE INDEX IF NOT EXISTS idx_premium_towers_user_id ON premium_towers(user_id);`,
  `CREATE INDEX IF NOT EXISTS idx_activity_feed_season_id ON activity_feed(season_id);`,
  `CREATE INDEX IF NOT EXISTS idx_activity_feed_created_at ON activity_feed(created_at DESC);`,
  `CREATE INDEX IF NOT EXISTS idx_special_offers_user_id ON special_offers(user_id);`,

  // Migration 8: Insert initial season
  `INSERT INTO seasons (season_number, start_time, end_time, status)
   SELECT 1, NOW(), NOW() + INTERVAL '5 days', 'active'
   WHERE NOT EXISTS (SELECT 1 FROM seasons WHERE season_number = 1);`,

  // Migration 9: Alter towers table to allow NULL user_id (for shared tower)
  `ALTER TABLE towers ALTER COLUMN user_id DROP NOT NULL;`,

  // Migration 10: Drop old UNIQUE constraint on user_id, season_id if exists
  `ALTER TABLE towers DROP CONSTRAINT IF EXISTS towers_user_id_season_id_key;`,

  // Migration 11: Add premium_blocks_balance to existing users table
  `DO $$
   BEGIN
     IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='premium_blocks_balance') THEN
       ALTER TABLE users ADD COLUMN premium_blocks_balance INT DEFAULT 0;
     END IF;
   END $$;`,

  // Migration 12: Add showed_onboarding to existing users table
  `DO $$
   BEGIN
     IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='showed_onboarding') THEN
       ALTER TABLE users ADD COLUMN showed_onboarding BOOLEAN DEFAULT false;
     END IF;
   END $$;`,

  // Migration 13: Add premium_pool to existing seasons table
  `DO $$
   BEGIN
     IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='seasons' AND column_name='premium_pool') THEN
       ALTER TABLE seasons ADD COLUMN premium_pool INT DEFAULT 0;
     END IF;
   END $$;`,

  // Migration 14: Add tower_type to existing activity_feed table
  `DO $$
   BEGIN
     IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='activity_feed' AND column_name='tower_type') THEN
       ALTER TABLE activity_feed ADD COLUMN tower_type TEXT DEFAULT 'regular' CHECK (tower_type IN ('regular', 'premium'));
     END IF;
   END $$;`,

  // Migration 15: Add user_id to existing blocks table
  `DO $$
   BEGIN
     IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='blocks' AND column_name='user_id') THEN
       ALTER TABLE blocks ADD COLUMN user_id UUID REFERENCES users(id);
     END IF;
   END $$;`,
];

async function runMigrations() {
  const client = await pool.connect();

  try {
    console.log('Starting database migrations...');

    for (let i = 0; i < migrations.length; i++) {
      console.log(`Running migration ${i + 1}/${migrations.length}...`);
      await client.query(migrations[i]);
    }

    console.log('All migrations completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations();
