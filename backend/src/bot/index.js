import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import { getOrCreateUser, getUserByTelegramId } from '../services/userService.js';
import { getActiveSeason } from '../services/seasonService.js';
import { getOrCreateTower, calculatePotentialPayout, placeBlock } from '../services/towerService.js';
import { parseReferralCode } from '../services/gameLogic.js';
import { claimOffer } from '../services/offerService.js';

dotenv.config();

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

/**
 * /start command - Register user and show welcome message
 */
bot.onText(/\/start(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const telegramId = msg.from.id;
  const username = msg.from.username || '';
  const firstName = msg.from.first_name || 'Player';
  const referralCode = match[1];

  try {
    // Parse referral code if present
    let referredByTelegramId = null;
    if (referralCode) {
      referredByTelegramId = parseReferralCode(referralCode);
    }

    // Create or get user
    const user = await getOrCreateUser(telegramId, username, firstName, referredByTelegramId);

    const welcomeMessage = `Welcome to Tower Gamble! 🏗️

Build your tower, risk it all, win big!

Each block costs 10 Stars ⭐️
The higher you go, the bigger your share of the prize pool!

But be careful — each block increases collapse chance...

🎯 Special newcomer offer: 50 blocks for only 475 Stars!
(Expires in 3 days)`;

    await bot.sendMessage(chatId, welcomeMessage, {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🎮 Play Now', web_app: { url: process.env.WEBAPP_URL } }],
          [{ text: '📊 Stats', callback_data: 'stats' }],
          [{ text: '🎁 Referral', callback_data: 'referral' }],
        ],
      },
    });
  } catch (error) {
    console.error('Error in /start:', error);
    await bot.sendMessage(chatId, 'Sorry, an error occurred. Please try again.');
  }
});

/**
 * /stats command - Show user statistics
 */
bot.onText(/\/stats/, async (msg) => {
  const chatId = msg.chat.id;
  const telegramId = msg.from.id;

  try {
    const user = await getUserByTelegramId(telegramId);

    if (!user) {
      await bot.sendMessage(chatId, 'Please start the bot first with /start');
      return;
    }

    const season = await getActiveSeason();
    const tower = await getOrCreateTower(user.id, season.id);
    const potentialPayout = await calculatePotentialPayout(user.id, season.id);

    const statsMessage = `📊 Your Statistics

🏗️ Current Tower:
  Height: ${tower.height} blocks
  Status: ${tower.is_collapsed ? '💥 Collapsed' : '✅ Standing'}
  Potential payout: ${potentialPayout} Stars

💰 Season ${season.season_number}:
  Prize pool: ${season.total_pool} Stars
  Total blocks placed: ${season.total_blocks}

🎒 Your Balance:
  Blocks: ${user.blocks_balance}

📈 All-time Stats:
  Blocks placed: ${user.total_blocks_placed}
  Stars spent: ${user.total_stars_spent}
  Stars won: ${user.total_stars_won}`;

    await bot.sendMessage(chatId, statsMessage, {
      reply_markup: {
        inline_keyboard: [[{ text: '🎮 Play Now', web_app: { url: process.env.WEBAPP_URL } }]],
      },
    });
  } catch (error) {
    console.error('Error in /stats:', error);
    await bot.sendMessage(chatId, 'Sorry, an error occurred. Please try again.');
  }
});

/**
 * /referral command - Show referral link
 */
bot.onText(/\/referral/, async (msg) => {
  const chatId = msg.chat.id;
  const telegramId = msg.from.id;

  try {
    const user = await getUserByTelegramId(telegramId);

    if (!user) {
      await bot.sendMessage(chatId, 'Please start the bot first with /start');
      return;
    }

    const botUsername = (await bot.getMe()).username;
    const referralLink = `https://t.me/${botUsername}?start=${telegramId}`;

    const referralMessage = `🎁 Invite friends and get free blocks!

Both you and your friend will receive +1 free block when they join.

Your referral link:
${referralLink}`;

    await bot.sendMessage(chatId, referralMessage, {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '📤 Share Link',
              url: `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent('Join me in Tower Gamble! Build towers and win prizes! 🏗️⭐️')}`,
            },
          ],
        ],
      },
    });
  } catch (error) {
    console.error('Error in /referral:', error);
    await bot.sendMessage(chatId, 'Sorry, an error occurred. Please try again.');
  }
});

/**
 * Handle callback queries (inline button clicks)
 */
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;

  try {
    if (data === 'stats') {
      // Simulate /stats command
      const telegramId = query.from.id;
      const user = await getUserByTelegramId(telegramId);

      if (!user) {
        await bot.sendMessage(chatId, 'Please start the bot first with /start');
        return;
      }

      const season = await getActiveSeason();
      const tower = await getOrCreateTower(user.id, season.id);
      const potentialPayout = await calculatePotentialPayout(user.id, season.id);

      const statsMessage = `📊 Your Statistics

🏗️ Current Tower:
  Height: ${tower.height} blocks
  Status: ${tower.is_collapsed ? '💥 Collapsed' : '✅ Standing'}
  Potential payout: ${potentialPayout} Stars

💰 Season ${season.season_number}:
  Prize pool: ${season.total_pool} Stars
  Total blocks placed: ${season.total_blocks}

🎒 Your Balance:
  Blocks: ${user.blocks_balance}

📈 All-time Stats:
  Blocks placed: ${user.total_blocks_placed}
  Stars spent: ${user.total_stars_spent}
  Stars won: ${user.total_stars_won}`;

      await bot.sendMessage(chatId, statsMessage, {
        reply_markup: {
          inline_keyboard: [[{ text: '🎮 Play Now', web_app: { url: process.env.WEBAPP_URL } }]],
        },
      });
    } else if (data === 'referral') {
      // Simulate /referral command
      const telegramId = query.from.id;
      const user = await getUserByTelegramId(telegramId);

      if (!user) {
        await bot.sendMessage(chatId, 'Please start the bot first with /start');
        return;
      }

      const botUsername = (await bot.getMe()).username;
      const referralLink = `https://t.me/${botUsername}?start=${telegramId}`;

      const referralMessage = `🎁 Invite friends and get free blocks!

Both you and your friend will receive +1 free block when they join.

Your referral link:
${referralLink}`;

      await bot.sendMessage(chatId, referralMessage, {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '📤 Share Link',
                url: `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent('Join me in Tower Gamble! Build towers and win prizes! 🏗️⭐️')}`,
              },
            ],
          ],
        },
      });
    }

    await bot.answerCallbackQuery(query.id);
  } catch (error) {
    console.error('Error in callback_query:', error);
    await bot.answerCallbackQuery(query.id, { text: 'Error occurred' });
  }
});

/**
 * Handle pre-checkout query (Stars payment validation)
 */
bot.on('pre_checkout_query', async (query) => {
  try {
    // Always approve (validation happens in successful_payment)
    await bot.answerPreCheckoutQuery(query.id, true);
  } catch (error) {
    console.error('Error in pre_checkout_query:', error);
    await bot.answerPreCheckoutQuery(query.id, false, {
      error_message: 'Payment validation failed',
    });
  }
});

/**
 * Handle successful payment
 */
bot.on('successful_payment', async (msg) => {
  const chatId = msg.chat.id;
  const telegramId = msg.from.id;
  const payment = msg.successful_payment;

  try {
    const payload = JSON.parse(payment.invoice_payload);

    const user = await getUserByTelegramId(telegramId);

    if (!user) {
      await bot.sendMessage(chatId, 'User not found. Please start the bot with /start');
      return;
    }

    if (payload.type === 'single_block') {
      // Place block immediately
      const season = await getActiveSeason();
      const result = await placeBlock(user.id, season.id, true);

      if (result.collapsed) {
        await bot.sendMessage(
          chatId,
          `💥 Oh no! Your tower collapsed at height ${result.height}!\n\nBetter luck next time!`
        );
      } else {
        await bot.sendMessage(
          chatId,
          `✅ Block placed successfully!\n\nYour tower is now ${result.height} blocks tall.\nNext block collapse chance: ${(result.collapse_chance * 100).toFixed(2)}%`
        );
      }
    } else if (payload.type === 'block_pack') {
      // Claim offer (adds blocks to balance)
      await claimOffer(user.id, payload.offer_id);

      await bot.sendMessage(
        chatId,
        `✅ Pack purchased successfully!\n\n+${payload.amount} blocks added to your balance!`
      );
    }
  } catch (error) {
    console.error('Error in successful_payment:', error);
    await bot.sendMessage(chatId, 'Payment processed but an error occurred. Please contact support.');
  }
});

/**
 * Create invoice for Stars payment
 */
export async function createInvoice(telegramId, type, amount = null, offerId = null) {
  let title, description, price, payload;

  if (type === 'single_block') {
    title = 'Place 1 Block';
    description = 'Add 1 block to your tower';
    price = 10;
    payload = JSON.stringify({ type: 'single_block' });
  } else if (type === 'block_pack') {
    title = `${amount} Blocks Pack`;
    description = `Get ${amount} blocks for your tower`;
    price = Math.floor(amount * 9.5); // 5% discount
    payload = JSON.stringify({ type: 'block_pack', amount, offer_id: offerId });
  } else {
    throw new Error('Invalid invoice type');
  }

  const invoice = await bot.sendInvoice(
    telegramId,
    title,
    description,
    payload,
    '', // provider_token (empty for Stars)
    'XTR', // currency (Telegram Stars)
    [{ label: title, amount: price }]
  );

  return { invoice_message_id: invoice.message_id };
}

export default bot;
