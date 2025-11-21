import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import { getOrCreateUser, getUserByTelegramId } from '../services/userService.js';
import { getActiveSeason } from '../services/seasonService.js';
import { getOrCreateTower, calculatePotentialPayout, placeBlock } from '../services/towerService.js';
import { parseReferralCode, calculateCollapseChance } from '../services/gameLogic.js';
import { claimOffer } from '../services/offerService.js';

dotenv.config();

// Initialize bot WITHOUT polling (will use webhook)
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: false });

console.log('🤖 Bot initialized (webhook mode)');
console.log('📱 Bot token:', process.env.BOT_TOKEN ? `${process.env.BOT_TOKEN.substring(0, 10)}...` : 'NOT SET');

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
    const { user, isNewUser: justCreated, referrerTelegramId } = await getOrCreateUser(telegramId, username, firstName, referredByTelegramId);

    // Send notification to referrer if this is a new referred user
    if (justCreated && referrerTelegramId) {
      try {
        await bot.sendMessage(
          referrerTelegramId,
          `🎉 Ура! ${firstName} теперь тоже строит башню!\n\n🎁 Награждаем тебя 1 бесплатным блоком!`
        );
      } catch (notificationError) {
        console.error('Failed to send referral notification:', notificationError);
      }
    }

    // Check if user is new (just created or no blocks placed yet)
    const isNewUser = user.total_blocks_placed === 0;

    let welcomeMessage;
    if (isNewUser) {
      welcomeMessage = `Welcome to Tower Build! 🏗️

Build your tower, risk it all, win big!

Each block costs 1 Star ⭐️
The higher you go, the bigger your share of the prize pool!

But be careful — each block increases collapse chance...

🎒 Your Balance: ${user.blocks_balance} blocks`;
    } else {
      // Get tower and season info for returning users
      const season = await getActiveSeason();
      const tower = await getOrCreateTower(user.id, season.id);
      const potentialPayout = await calculatePotentialPayout(user.id, season.id);
      const collapseChance = calculateCollapseChance(tower.height + 1);

      welcomeMessage = `Welcome back, builder! 🏗️

🎒 Your Balance: ${user.blocks_balance} blocks
📏 Current height: ${tower.height} blocks
⚠️ Next collapse chance: ${(collapseChance * 100).toFixed(2)}%
💰 Potential payout: ${potentialPayout} Stars`;
    }

    await bot.sendMessage(chatId, welcomeMessage, {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🎮 Open App', web_app: { url: process.env.WEBAPP_URL } }],
          [{ text: '🧱 Place Block', callback_data: 'place_block' }],
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
              url: `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent('Join me in Tower Build! Build towers and win prizes! 🏗️⭐️')}`,
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
  const telegramId = query.from.id;

  try {
    if (data === 'place_block') {
      // Place block directly
      const user = await getUserByTelegramId(telegramId);

      if (!user) {
        await bot.answerCallbackQuery(query.id, { text: 'Please start the bot first with /start' });
        return;
      }

      const season = await getActiveSeason();
      const tower = await getOrCreateTower(user.id, season.id);

      // Check if tower is already collapsed
      if (tower.is_collapsed) {
        const timeUntilNewSeason = new Date(season.end_time) - new Date();
        const hoursLeft = Math.floor(timeUntilNewSeason / (1000 * 60 * 60));
        const minutesLeft = Math.floor((timeUntilNewSeason % (1000 * 60 * 60)) / (1000 * 60));

        const collapsedMessage = `💥 Your tower has already collapsed this season!

📊 Final Stats:
  Height reached: ${tower.collapse_height || tower.height} blocks

⏳ New season starts in: ${hoursLeft}h ${minutesLeft}m

Come back then to build a new tower! 🏗️`;

        await bot.sendMessage(chatId, collapsedMessage, {
          reply_markup: {
            inline_keyboard: [
              [{ text: '🎮 Open App', web_app: { url: process.env.WEBAPP_URL } }],
            ],
          },
        });

        await bot.answerCallbackQuery(query.id);
        return;
      }

      // Check if user has blocks in balance
      if (user.blocks_balance > 0) {
        // Use balance block
        const result = await placeBlock(user.id, season.id, false);

        const tower = await getOrCreateTower(user.id, season.id);
        const potentialPayout = await calculatePotentialPayout(user.id, season.id);

        if (result.collapsed) {
          const analyticsMessage = `💥 Oh no! Your tower collapsed at height ${result.height}!

📊 Analytics:
  Final height: ${result.height} blocks
  Collapse chance was: ${(result.collapse_chance * 100).toFixed(2)}%

🎒 Balance: ${user.blocks_balance - 1} blocks
💰 Season prize pool: ${season.total_pool} Stars`;

          await bot.sendMessage(chatId, analyticsMessage, {
            reply_markup: {
              inline_keyboard: [
                [{ text: '🎮 Open App', web_app: { url: process.env.WEBAPP_URL } }],
                [{ text: '🧱 Place Block', callback_data: 'place_block' }],
              ],
            },
          });
        } else {
          const analyticsMessage = `✅ Block placed successfully!

📏 Current height: ${result.height} blocks
⚠️ Next collapse chance: ${(result.collapse_chance * 100).toFixed(2)}%
💰 Potential payout: ${potentialPayout} Stars

🎒 Balance: ${user.blocks_balance - 1} blocks`;

          await bot.sendMessage(chatId, analyticsMessage, {
            reply_markup: {
              inline_keyboard: [
                [{ text: '🎮 Open App', web_app: { url: process.env.WEBAPP_URL } }],
                [{ text: '🧱 Place Block', callback_data: 'place_block' }],
              ],
            },
          });
        }
      } else {
        // No balance - send invoice directly
        await bot.sendInvoice(
          chatId,
          '🧱 Place 1 Block',
          'Pay 1 Star',
          JSON.stringify({ type: 'single_block' }),
          '', // provider_token (empty for Stars)
          'XTR', // currency (Telegram Stars)
          [{ label: 'Place Block', amount: 1 }]
        );

        await bot.answerCallbackQuery(query.id);
        return;
      }

      await bot.answerCallbackQuery(query.id);
    } else if (data === 'stats') {
      // Simulate /stats command
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
                url: `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent('Join me in Tower Build! Build towers and win prizes! 🏗️⭐️')}`,
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
  console.log('💳 Pre-checkout query received from:', query.from.id);
  console.log('   Payload:', query.invoice_payload);
  console.log('   Currency:', query.currency);
  console.log('   Total amount:', query.total_amount);

  try {
    // Always approve (validation happens in successful_payment)
    await bot.answerPreCheckoutQuery(query.id, true);
    console.log('✅ Pre-checkout approved');
  } catch (error) {
    console.error('❌ Error in pre_checkout_query:', error);
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

  console.log('=== PAYMENT RECEIVED ===');
  console.log('Telegram ID:', telegramId);
  console.log('Payment amount:', payment.total_amount);
  console.log('Payment payload:', payment.invoice_payload);

  try {
    const payload = JSON.parse(payment.invoice_payload);
    console.log('Parsed payload:', payload);

    const user = await getUserByTelegramId(telegramId);
    console.log('User found:', user ? `ID ${user.id}` : 'NOT FOUND');

    if (!user) {
      await bot.sendMessage(chatId, 'User not found. Please start the bot with /start');
      return;
    }

    if (payload.type === 'single_block') {
      console.log('Processing single_block payment...');
      // Place block immediately
      const season = await getActiveSeason();
      console.log('Active season:', season.id);

      const tower = await getOrCreateTower(user.id, season.id);
      console.log('Tower state:', { id: tower.id, height: tower.height, collapsed: tower.is_collapsed });

      // Check if tower is already collapsed
      if (tower.is_collapsed) {
        const timeUntilNewSeason = new Date(season.end_time) - new Date();
        const hoursLeft = Math.floor(timeUntilNewSeason / (1000 * 60 * 60));
        const minutesLeft = Math.floor((timeUntilNewSeason % (1000 * 60 * 60)) / (1000 * 60));

        const collapsedMessage = `💥 Your tower has already collapsed this season!

Payment received, but you cannot place blocks on a collapsed tower.

📊 Final Stats:
  Height reached: ${tower.collapse_height || tower.height} blocks

⏳ New season starts in: ${hoursLeft}h ${minutesLeft}m

Your Stars will be refunded automatically. 💫`;

        await bot.sendMessage(chatId, collapsedMessage, {
          reply_markup: {
            inline_keyboard: [
              [{ text: '🎮 Open App', web_app: { url: process.env.WEBAPP_URL } }],
            ],
          },
        });
        return;
      }

      console.log('Calling placeBlock...');
      const result = await placeBlock(user.id, season.id, true);
      console.log('Block placed successfully:', result);

      const potentialPayout = await calculatePotentialPayout(user.id, season.id);
      console.log('Potential payout:', potentialPayout);

      if (result.collapsed) {
        const analyticsMessage = `💥 Oh no! Your tower collapsed at height ${result.height}!

📊 Analytics:
  Final height: ${result.height} blocks
  Collapse chance was: ${(result.collapse_chance * 100).toFixed(2)}%

💰 Season prize pool: ${season.total_pool} Stars`;

        await bot.sendMessage(chatId, analyticsMessage, {
          reply_markup: {
            inline_keyboard: [
              [{ text: '🎮 Open App', web_app: { url: process.env.WEBAPP_URL } }],
              [{ text: '🧱 Place Block', callback_data: 'place_block' }],
            ],
          },
        });
      } else {
        const analyticsMessage = `✅ Block placed successfully!

📏 Current height: ${result.height} blocks
⚠️ Next collapse chance: ${(result.collapse_chance * 100).toFixed(2)}%
💰 Potential payout: ${potentialPayout} Stars`;

        await bot.sendMessage(chatId, analyticsMessage, {
          reply_markup: {
            inline_keyboard: [
              [{ text: '🎮 Open App', web_app: { url: process.env.WEBAPP_URL } }],
              [{ text: '🧱 Place Block', callback_data: 'place_block' }],
            ],
          },
        });
      }
    } else if (payload.type === 'block_pack') {
      console.log('Processing block_pack payment...');
      // Add blocks to balance
      const blocksAmount = payload.amount || 0;
      console.log('Blocks amount:', blocksAmount);

      if (!blocksAmount) {
        throw new Error('Invalid blocks amount in payment');
      }

      // Try to claim offer if offer_id is provided
      if (payload.offer_id) {
        console.log('Attempting to claim offer:', payload.offer_id);
        try {
          await claimOffer(user.id, payload.offer_id);
          console.log('Offer claimed successfully');
        } catch (offerError) {
          // If offer claim fails (already claimed, expired, etc.), add blocks directly
          console.warn('Failed to claim offer, adding blocks directly:', offerError.message);
          const { updateUserBlocksBalance } = await import('../services/userService.js');
          await updateUserBlocksBalance(user.id, blocksAmount);
          console.log('Blocks added directly to balance');
        }
      } else {
        // No offer_id, add blocks directly
        console.log('No offer_id, adding blocks directly');
        const { updateUserBlocksBalance } = await import('../services/userService.js');
        await updateUserBlocksBalance(user.id, blocksAmount);
        console.log('Blocks added to balance');
      }

      await bot.sendMessage(
        chatId,
        `✅ Pack purchased successfully!\n\n+${blocksAmount} blocks added to your balance!`
      );
      console.log('Success message sent to user');
    }
  } catch (error) {
    console.error('=== ERROR in successful_payment ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('===================================');
    await bot.sendMessage(chatId, 'Payment processed but an error occurred. Please contact support.');
  }
});

/**
 * Create invoice for Stars payment
 * Returns invoice link for use in WebApp
 */
export async function createInvoice(telegramId, type, amount = null, offerId = null) {
  let title, description, price, payload;

  if (type === 'single_block') {
    title = 'Place 1 Block';
    description = 'Add 1 block to your tower';
    price = 1;
    payload = JSON.stringify({ type: 'single_block' });
  } else if (type === 'block_pack') {
    title = `${amount} Blocks Pack`;
    description = `Get ${amount} blocks for your tower`;
    price = Math.floor(amount * 0.95); // 5% discount
    payload = JSON.stringify({ type: 'block_pack', amount, offer_id: offerId });
  } else {
    throw new Error('Invalid invoice type');
  }

  // Create invoice link for use in WebApp
  const invoiceLink = await bot.createInvoiceLink(
    title,
    description,
    payload,
    '', // provider_token (empty for Stars)
    'XTR', // currency (Telegram Stars)
    [{ label: title, amount: price }]
  );

  return { invoice_link: invoiceLink };
}

/**
 * Set up webhook for the bot
 */
export async function setupWebhook(webhookUrl) {
  try {
    await bot.setWebHook(`${webhookUrl}/webhook/telegram`);
    console.log('✅ Webhook set up successfully');
    const webhookInfo = await bot.getWebHookInfo();
    console.log('📡 Webhook info:', webhookInfo);
  } catch (error) {
    console.error('❌ Error setting up webhook:', error);
  }
}

/**
 * Process webhook update
 */
export function processUpdate(update) {
  console.log('🔄 Processing update type:', Object.keys(update).filter(k => k !== 'update_id').join(', '));
  if (update.message) {
    console.log('   Message from:', update.message.from?.id, update.message.text?.substring(0, 50));
  }
  if (update.callback_query) {
    console.log('   Callback from:', update.callback_query.from?.id, update.callback_query.data);
  }
  if (update.pre_checkout_query) {
    console.log('   Pre-checkout from:', update.pre_checkout_query.from?.id);
  }
  bot.processUpdate(update);
}

export default bot;
