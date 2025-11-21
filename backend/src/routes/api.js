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

export default router;
