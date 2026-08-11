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
  const message = update?.message || update?.edited_message;
  if (!message) return;

  const chatId = message.chat.id;
  const text = message.text || '';
  const fromUser = message.from;
  const username = fromUser?.username ? `@${fromUser.username}` : `${fromUser?.first_name || ''} ${fromUser?.last_name || ''}`.trim() || 'User';

  console.log(`\n📩 [Bot] Received message from ${username} (Chat ID: ${chatId}): "${text}"`);

  try {
    const welcomeText = `✨ 🤖 <b>WELCOME TO AnyAi STORE!</b> 🚀 ✨\n\n👋 <i>Greetings ${fromUser?.first_name || ''}! Your ultimate hub for premium digital AI subscriptions with instant delivery & full warranty coverage!</i> ⚡️\n\n🔥 <b>EXPLORE OUR TOP CATEGORIES:</b>\n\n🤖 <b>AI Assistants & Intelligence</b>\n• ChatGPT Plus <i>(GPT-4o, DALL·E 3, Voice)</i> — <b>$5.00</b>\n• Gemini AI Pro <i>(1M Context & Workspace)</i> — <b>$5.00</b>\n• Claude 3.5 Sonnet <i>(Artifacts & Code)</i> — <b>$5.00</b>\n• Copilot Pro <i>(Office 365 AI)</i> — <b>$5.00</b>\n\n🔍 <b>AI Search & Productivity</b>\n• Perplexity Pro <i>(Pro Search & Citations)</i> — <b>$5.00</b>\n• Notion AI <i>(Automated Docs & Q&A)</i> — <b>$4.00</b>\n\n🎨 <b>AI Design & Video Creation</b>\n• Midjourney v6 <i>(Photorealistic Art)</i> — <b>$6.00</b>\n• Canva Pro <i>(Magic Studio AI)</i> — <b>$4.00</b>\n• CapCut Pro <i>(AI Captions & 4K Export)</i> — <b>$4.00</b>\n\n📺 <b>Media & Premium Streaming</b>\n• YouTube Premium <i>(Ad-Free & Music)</i> — <b>$4.00</b>\n\n🛡️ <b>Why Choose AnyAi?</b>\n✅ 100% Replacement Warranty Guarantee\n🚀 Instant Delivery Post Payment\n💳 Multiple Local & Crypto Payment Options\n\n👇 <b>Tap the button below to launch our Mini App:</b>`;

    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: welcomeText,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '🛍️ Open AnyAi Store',
                web_app: { url: APP_URL }
              }
            ]
          ]
        }
      })
    });

    const resData = await response.json();
    if (resData.ok) {
      console.log(`✅ [Bot] Successfully sent reply to Chat ID: ${chatId}`);
    } else {
      console.error(`❌ [Bot] Telegram API Error:`, resData);
    }
  } catch (err) {
    console.error(`❌ [Bot] Error sending message:`, err);
  }
}

pollUpdates();
