import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID || process.env.TELEGRAM_API_ID;

    if (!botToken || !adminChatId) {
      return NextResponse.json({
        success: false,
        user: { id: 30685155, username: 'customer', first_name: 'Customer' }
      });
    }

    const response = await fetch(`https://api.telegram.org/bot${botToken}/getChat?chat_id=${adminChatId}`, {
      next: { revalidate: 60 }
    });

    const data = await response.json();

    if (data.ok && data.result) {
      const chat = data.result;
      return NextResponse.json({
        success: true,
        user: {
          id: chat.id,
          username: chat.username || null,
          first_name: chat.first_name || chat.title || 'Customer',
          last_name: chat.last_name || null
        }
      });
    }

    return NextResponse.json({
      success: false,
      user: { id: Number(adminChatId) || 30685155, username: 'customer', first_name: 'Customer' }
    });
  } catch (err) {
    console.error('Error fetching Telegram User info via Bot API:', err);
    return NextResponse.json({
      success: false,
      user: { id: 30685155, username: 'customer', first_name: 'Customer' }
    });
  }
}
