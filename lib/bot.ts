export interface OrderPayload {
  orderId: string;
  telegramUser: {
    id: number;
    username?: string;
    first_name: string;
    last_name?: string;
  };
  items: {
    id: string;
    name: string;
    price: number;
    quantity: number;
    warranty: string;
  }[];
  subtotal: number;
  total: number;
  paymentMethod: {
    id: string;
    name: string;
    accountName: string;
    accountId: string;
  };
  timestamp: string;
  status: 'Pending' | 'Payment Submitted' | 'Payment Confirmed' | 'Processing' | 'Completed' | 'Cancelled';
}

export async function sendTelegramAdminNotification(payload: OrderPayload): Promise<{ success: boolean; message: string }> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;

  if (!botToken || !adminChatId || botToken.includes('123456789:ABCdef')) {
    console.warn('[Telegram Bot] TELEGRAM_BOT_TOKEN or TELEGRAM_ADMIN_CHAT_ID not configured in .env. Skipping real telegram message.');
    return {
      success: true,
      message: 'Order recorded locally. (Set TELEGRAM_BOT_TOKEN in .env to receive real Telegram notifications).'
    };
  }

  const userHandle = payload.telegramUser.username
    ? `@${payload.telegramUser.username}`
    : `${payload.telegramUser.first_name} ${payload.telegramUser.last_name || ''}`.trim();

  const itemsFormatted = payload.items
    .map(item => `• <b>${escapeHtml(item.name)}</b> ×${item.quantity} — $${(item.price * item.quantity).toFixed(2)} <i>(${escapeHtml(item.warranty)})</i>`)
    .join('\n');

  const textMessage = `
🛒 <b>NEW AI STORE ORDER</b>

<b>Order ID:</b> <code>${payload.orderId}</code>
<b>Customer:</b> ${userHandle}
<b>Telegram ID:</b> <code>${payload.telegramUser.id}</code>

<b>Products:</b>
${itemsFormatted}

<b>TOTAL AMOUNT:</b> <b>$${payload.total.toFixed(2)}</b>

<b>Payment Method:</b> ${escapeHtml(payload.paymentMethod.name)}
<b>Account ID:</b> <code>${escapeHtml(payload.paymentMethod.accountId)}</code>
<b>Status:</b> 🟡 <b>${payload.status}</b>
<b>Time:</b> ${payload.timestamp}
`;

  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_id: adminChatId,
        text: textMessage,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '✅ Confirm Payment', callback_data: `confirm_${payload.orderId}` },
              { text: '❌ Reject', callback_data: `reject_${payload.orderId}` }
            ]
          ]
        }
      })
    });

    const data = await response.json();
    if (!response.ok || !data.ok) {
      console.error('[Telegram Bot Error]', data);
      return { success: false, message: data.description || 'Failed to dispatch Telegram message' };
    }

    return { success: true, message: 'Order submitted to Telegram Admin successfully!' };
  } catch (error) {
    console.error('[Telegram Bot Fetch Error]', error);
    return { success: false, message: 'Network error connecting to Telegram Bot API' };
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
