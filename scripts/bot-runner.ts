import fs from 'fs';
import path from 'path';

// Simple lightweight env loader for local standalone script
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  const fallbackEnvPath = path.resolve(process.cwd(), '.env');
  
  const targetPath = fs.existsSync(envPath) ? envPath : fs.existsSync(fallbackEnvPath) ? fallbackEnvPath : null;

  if (targetPath) {
    const envConfig = fs.readFileSync(targetPath, 'utf8');
    for (const line of envConfig.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [key, ...valueParts] = trimmed.split('=');
        const val = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
        if (key && !process.env[key.trim()]) {
          process.env[key.trim()] = val;
        }
      }
    }
  }
}

loadEnv();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

if (!BOT_TOKEN || BOT_TOKEN.includes('123456789:ABCdef')) {
  console.error('\n❌ ERROR: Please set TELEGRAM_BOT_TOKEN in your .env.local file to run the local Telegram Bot.\n');
  process.exit(1);
}

console.log(`\n🤖 Starting Telegram Bot polling runner...`);
console.log(`🔗 Store Mini App URL configured: ${APP_URL}\n`);

let offset = 0;

async function pollUpdates() {
  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?offset=${offset}&timeout=30`);
    const data = await res.json();

    if (data.ok && Array.isArray(data.result)) {
      for (const update of data.result) {
        offset = update.update_id + 1;
        await handleUpdate(update);
      }
    }
  } catch (err) {
    console.error('Polling error:', err);
  }

  setTimeout(pollUpdates, 1000);
}

async function handleUpdate(update: any) {
  if (update?.message?.text?.startsWith('/start')) {
    const chatId = update.message.chat.id;
    console.log(`[Bot] /start received from Chat ID: ${chatId}`);

    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: `✨ <b>Welcome to AI Store!</b>\n\nBrowse premium digital AI subscriptions with instant delivery & warranty:\n\n• ChatGPT Plus ($5)\n• Gemini AI Pro ($5)\n• Claude 3.5 Sonnet ($5)\n• Perplexity Pro ($5)\n• Canva, CapCut & more!\n\nTap below to launch the Mini App:`,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '🛍️ Open AI Store',
                web_app: { url: APP_URL }
              }
            ]
          ]
        }
      })
    });
  }
}

pollUpdates();
