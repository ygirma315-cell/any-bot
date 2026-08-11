import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // Optional secret token verification to prevent unauthorized webhook calls
    const secretToken = process.env.TELEGRAM_SECRET_TOKEN;
    if (secretToken) {
      const headerSecret = request.headers.get('x-telegram-bot-api-secret-token');
      if (headerSecret !== secretToken) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const update = await request.json();

    if (update?.message?.text === '/start' || update?.message?.text?.startsWith('/start')) {
      const chatId = update.message.chat.id;
      const firstName = update.message.from?.first_name || 'there';
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
      const isHttps = appUrl.startsWith('https://');

      if (botToken) {
        const welcomeText =
          `🌟 <b>Welcome to AnyAi Store!</b> 🌟\n\n` +
          `👋 Hey ${firstName}! You've found your <b>#1 destination for premium digital services</b> at unbeatable prices.\n\n` +
          `🛒 <b>What we offer:</b>\n` +
          `• 🤖 ChatGPT Plus, Claude, Gemini AI Pro\n` +
          `• 🎨 Canva Pro, Midjourney, CapCut Pro\n` +
          `• 📺 YouTube Premium & more!\n\n` +
          `⚡ <i>Instant delivery · 100% warranty · Local & crypto payments</i>\n\n` +
          `📢 <i>Join our channel for deals & updates: @anyaiplan</i>\n\n` +
          `👇 <b>Choose an option below to get started:</b>`;

        const inlineRows: any[] = [];
        if (isHttps) {
          inlineRows.push([{ text: '🛍️ Open Digital Store', web_app: { url: appUrl } }]);
        }
        inlineRows.push([{ text: '📢 Join Our Channel', url: 'https://t.me/anyaiplan' }]);
        inlineRows.push([
          { text: '📞 Contact Admin', url: 'https://t.me/exo80' },
          { text: '👨‍💻 Developer', url: 'https://t.me/grpbuyer3' }
        ]);

        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: welcomeText,
            parse_mode: 'HTML',
            reply_markup: { inline_keyboard: inlineRows }
          })
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Telegram Webhook error:', err);
    return NextResponse.json({ ok: true }); // Always return 200 to Telegram
  }
}

export async function GET() {
  return NextResponse.json({ status: 'Telegram Bot Webhook Endpoint Active' });
}

