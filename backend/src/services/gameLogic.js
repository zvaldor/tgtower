/**
 * Calculate collapse probability based on tower height
 * Formula: 1 - (0.9999 ^ height)
 * Reduced by 100x from original 0.99 to make collapse much rarer
 */
export function calculateCollapseChance(height) {
  return 1 - Math.pow(0.9999, height);
}

/**
 * Check if tower should collapse at current height
 */
export function checkCollapse(height) {
  const probability = calculateCollapseChance(height);
  return Math.random() < probability;
}

/**
 * Calculate potential payout for a user's tower
 */
export function calculatePayout(userHeight, totalSurvivorHeight, totalPool) {
  if (totalSurvivorHeight === 0) return 0;

  const distributionPool = Math.floor(totalPool * 0.8);
  const userShare = userHeight / totalSurvivorHeight;

  return Math.floor(distributionPool * userShare);
}

/**
 * Generate referral code from telegram_id
 */
export function generateReferralCode(telegramId) {
  return telegramId.toString();
}

/**
 * Parse referral code to telegram_id
 */
export function parseReferralCode(code) {
  const telegramId = parseInt(code, 10);
  return isNaN(telegramId) ? null : telegramId;
}
