import dotenv from 'dotenv';

dotenv.config();

export const botConfig = {
  token: process.env.BOT_TOKEN,
  webAppUrl: process.env.WEBAPP_URL,
  options: {
    polling: true,
  },
};

export function validateBotConfig() {
  if (!botConfig.token) {
    throw new Error('BOT_TOKEN is not set in environment variables');
  }

  if (!botConfig.webAppUrl) {
    throw new Error('WEBAPP_URL is not set in environment variables');
  }

  console.log('Bot configuration validated successfully');
}
