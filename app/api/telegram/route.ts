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
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

      if (botToken) {
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: `✨ <b>Welcome to AI Store!</b>\n\nBrowse our premium AI subscriptions and digital services at unbeatable prices:\n\n• ChatGPT Plus ($5)\n• Gemini AI Pro ($5)\n• Claude 3.5 Sonnet ($5)\n• Perplexity Pro ($5)\n• Canva Pro, CapCut & more!\n\nTap below to open the Mini App:`,
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: '🛍️ Open AI Store',
                    web_app: { url: appUrl }
                  }
                ]
              ]
            }
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

