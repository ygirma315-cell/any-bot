import fs from 'fs';
import path from 'path';

// ─── Env Loader ───────────────────────────────────────────────────────────────
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  const fallback = path.resolve(process.cwd(), '.env');
  const target = fs.existsSync(envPath) ? envPath : fs.existsSync(fallback) ? fallback : null;
  if (!target) return;
  for (const line of fs.readFileSync(target, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const [key, ...rest] = trimmed.split('=');
    const val = rest.join('=').trim().replace(/^["']|["']$/g, '');
    if (key && !process.env[key.trim()]) process.env[key.trim()] = val;
  }
}

loadEnv();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

if (!BOT_TOKEN || BOT_TOKEN.includes('123456789:ABCdef')) {
  console.error('\n❌ ERROR: TELEGRAM_BOT_TOKEN not set in .env.local\n');
  process.exit(1);
}

console.log('\n╔══════════════════════════════════════╗');
console.log('║   🤖  AnyAi Store Bot  –  STARTING  ║');
console.log('╚══════════════════════════════════════╝');
console.log(`🔗 Mini App URL : ${APP_URL}`);
console.log(`👤 Admin Chat ID: ${ADMIN_CHAT_ID || 'not set'}\n`);

let offset = 0;

// ─── Init: clear any webhook conflict ────────────────────────────────────────
async function initBot() {
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/deleteWebhook?drop_pending_updates=true`
    ).then(r => r.json());
    if (res.ok) {
      console.log('✅ Webhook cleared. Bot is now listening via long-polling...\n');
    } else {
      console.error('⚠️  Could not clear webhook:', res.description);
    }
  } catch (err) {
    console.error('❌ Error clearing webhook:', err);
  }
  poll();
}

// ─── Polling Loop ─────────────────────────────────────────────────────────────
async function poll() {
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?offset=${offset}&timeout=30&allowed_updates=["message"]`
    );
    const data = await res.json();

    if (data.ok && Array.isArray(data.result)) {
      for (const update of data.result) {
        offset = update.update_id + 1;
        await handleUpdate(update);
      }
    } else if (!data.ok) {
      console.error('⚠️  Polling error:', data.description || JSON.stringify(data));
      // Back off 5 seconds on error so we don't spam Telegram
      await sleep(5000);
    }
  } catch (err) {
    console.error('❌ Network error, retrying in 5s:', err);
    await sleep(5000);
  }
  setTimeout(poll, 500);
}

// ─── Handle Incoming Update ───────────────────────────────────────────────────
async function handleUpdate(update: any) {
  const msg = update?.message;
  if (!msg) return;

  const chatId: number = msg.chat.id;
  const text: string = msg.text || '';
  const user = msg.from;
  const name = user?.first_name || user?.username || 'there';
  const handle = user?.username ? `@${user.username}` : name;

  console.log(`📩 [${new Date().toLocaleTimeString()}] Message from ${handle} (${chatId}): "${text}"`);

  // Only respond to /start command
  if (!text.startsWith('/start')) return;

  const isHttps = APP_URL.startsWith('https://');

  const welcome =
    `🌟 <b>Welcome to AnyAi Store!</b> 🌟\n\n` +
    `👋 Hey ${name}! You've found your <b>#1 destination for premium digital services</b> at unbeatable prices.\n\n` +
    `🛒 <b>What we offer:</b>\n` +
    `• 🤖 ChatGPT Plus, Claude, Gemini AI Pro\n` +
    `• 🎨 Canva Pro, Midjourney, CapCut Pro\n` +
    `• 📺 YouTube Premium & more!\n\n` +
    `⚡ <i>Instant delivery · 100% warranty · Local & crypto payments</i>\n\n` +
    `📢 <i>Join our channel for deals & updates: @anyaiplan</i>\n\n` +
    `👇 <b>Choose an option below to get started:</b>`;

  // Build keyboard — web_app button only works with HTTPS links
  const inlineRows: any[] = [];

  if (isHttps) {
    inlineRows.push([{ text: '🛍️ Open Digital Store', web_app: { url: APP_URL } }]);
  }

  // Join channel button (optional)
  inlineRows.push([{ text: '📢 Join Our Channel', url: 'https://t.me/anyaiplan' }]);

  // Contact row — Admin + Developer side by side
  inlineRows.push([
    { text: '📞 Contact Admin', url: 'https://t.me/exo80' },
    { text: '👨‍💻 Developer', url: 'https://t.me/grpbuyer3' }
  ]);

  const keyboard = { inline_keyboard: inlineRows };

  await sendMessage(chatId, welcome, keyboard);
}

// ─── Send Message Helper ──────────────────────────────────────────────────────
async function sendMessage(chatId: number, text: string, reply_markup?: object) {
  try {
    const body: any = { chat_id: chatId, text, parse_mode: 'HTML' };
    if (reply_markup) body.reply_markup = reply_markup;

    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (data.ok) {
      console.log(`✅ Replied to chat ${chatId}`);
    } else {
      console.error(`❌ Send error to ${chatId}:`, data.description || JSON.stringify(data));
    }
  } catch (err) {
    console.error(`❌ Network error sending to ${chatId}:`, err);
  }
}

// ─── Utility ──────────────────────────────────────────────────────────────────
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ─── Start ────────────────────────────────────────────────────────────────────
initBot();
