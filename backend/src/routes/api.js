import express from 'express';
import {
  getGameState,
  placeBlockHandler,
  placePremiumBlockHandler,
  markOnboardingShownHandler,
  claimPayoutHandler,
} from '../controllers/gameController.js';
import { createInvoice } from '../bot/index.js';
import { getOrCreateUser } from '../services/userService.js';
import clanService from '../services/clanService.js';

const router = express.Router();

/**
 * POST /api/game-state
 * Get complete game state for user
 */
router.post('/game-state', getGameState);

/**
 * POST /api/place-block
 * Place a block using blocks balance
 */
router.post('/place-block', placeBlockHandler);

/**
 * POST /api/place-premium-block
 * Place a premium block using premium blocks balance
 */
router.post('/place-premium-block', placePremiumBlockHandler);

/**
 * POST /api/mark-onboarding-shown
 * Mark onboarding as shown for user
 */
router.post('/mark-onboarding-shown', markOnboardingShownHandler);

/**
 * POST /api/create-invoice
 * Create Telegram Stars invoice
 */
router.post('/create-invoice', async (req, res) => {
  try {
    const { telegram_id, type, amount, offer_id } = req.body;

    if (!telegram_id || !type) {
      return res.status(400).json({ error: 'telegram_id and type are required' });
    }

    const result = await createInvoice(telegram_id, type, amount, offer_id);

    res.json({
      success: true,
      invoice_link: result.invoice_link,
    });
  } catch (error) {
    console.error('Error in create-invoice:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/claim-payout
 * Claim payout from ended season
 */
router.post('/claim-payout', claimPayoutHandler);

/**
 * POST /api/admin/end-season
 * Force end current season and start new one (admin only)
 */
router.post('/admin/end-season', async (req, res) => {
  try {
    const { endSeasonAndCreateNext } = await import('../services/seasonService.js');

    console.log('[ADMIN] Force ending current season...');
    await endSeasonAndCreateNext();

    res.json({
      success: true,
      message: 'Season ended and new season created successfully'
    });
  } catch (error) {
    console.error('[ADMIN] Error ending season:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/clans/list
 * Get all clans
 */
router.post('/clans/list', async (req, res) => {
  try {
    const clans = await clanService.getAllClans();
    res.json({ success: true, clans });
  } catch (error) {
    console.error('Error getting clans:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/clans/leaderboard
 * Get clan leaderboard for current season
 */
router.post('/clans/leaderboard', async (req, res) => {
  try {
    const { season_id } = req.body;
    if (!season_id) {
      return res.status(400).json({ error: 'season_id is required' });
    }

    const leaderboard = await clanService.getClanLeaderboard(season_id);
    res.json({ success: true, leaderboard });
  } catch (error) {
    console.error('Error getting clan leaderboard:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/clans/members
 * Get clan members leaderboard
 */
router.post('/clans/members', async (req, res) => {
  try {
    const { clan_id, season_id } = req.body;
    if (!clan_id || !season_id) {
      return res.status(400).json({ error: 'clan_id and season_id are required' });
    }

    const members = await clanService.getClanMembersLeaderboard(clan_id, season_id);
    res.json({ success: true, members });
  } catch (error) {
    console.error('Error getting clan members:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/clans/join
 * Join a clan
 */
router.post('/clans/join', async (req, res) => {
  try {
    const { telegram_id, clan_id, season_number } = req.body;
    if (!telegram_id || !clan_id || !season_number) {
      return res.status(400).json({ error: 'telegram_id, clan_id, and season_number are required' });
    }

    const user = await getOrCreateUser(telegram_id);
    const result = await clanService.joinClan(user.id, clan_id, season_number);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error joining clan:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/clans/leave
 * Leave current clan
 */
router.post('/clans/leave', async (req, res) => {
  try {
    const { telegram_id, season_number, tower_is_collapsed } = req.body;
    if (!telegram_id || season_number === undefined) {
      return res.status(400).json({ error: 'telegram_id and season_number are required' });
    }

    const user = await getOrCreateUser(telegram_id);
    const result = await clanService.leaveClan(user.id, season_number, tower_is_collapsed);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error leaving clan:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/clans/special-offers
 * Get clan special offers
 */
router.post('/clans/special-offers', async (req, res) => {
  try {
    const { clan_id } = req.body;
    if (!clan_id) {
      return res.status(400).json({ error: 'clan_id is required' });
    }

    const offers = await clanService.getClanSpecialOffers(clan_id);
    res.json({ success: true, offers });
  } catch (error) {
    console.error('Error getting clan offers:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
