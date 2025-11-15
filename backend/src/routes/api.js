import express from 'express';
import {
  getGameState,
  placeBlockHandler,
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
      invoice_message_id: result.invoice_message_id,
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

export default router;
