export interface OrderPayload {
  orderId: string;
  deliveryEmail?: string;
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
  status: 'Pending' | 'Payment Submitted' | 'Payment Confirmed' | 'Processing' | 'Completed' | 'Cancelled' | 'Accepted' | 'Rejected';
}

export async function sendTelegramAdminNotification(payload: OrderPayload): Promise<{ success: boolean; message: string }> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;

  if (botToken && adminChatId && !botToken.includes('123456789:ABCdef')) {
    try {
      const userHandle = payload.telegramUser.username
        ? `@${payload.telegramUser.username}`
        : `${payload.telegramUser.first_name} ${payload.telegramUser.last_name || ''}`.trim();

      const itemsFormatted = payload.items
        .map(item => `• <b>${escapeHtml(item.name)}</b> ×${item.quantity} — $${(item.price * item.quantity).toFixed(2)} <i>(${escapeHtml(item.warranty)})</i>`)
        .join('\n');

      const adminTextMessage = `
🛒 <b>NEW AI STORE ORDER</b>

<b>Order ID:</b> <code>${payload.orderId}</code>
<b>Customer:</b> ${userHandle}
<b>Delivery Email:</b> <code>${escapeHtml(payload.deliveryEmail || 'Not Provided')}</code>
<b>Telegram ID:</b> <code>${payload.telegramUser.id}</code>

<b>Products:</b>
${itemsFormatted}

<b>TOTAL AMOUNT:</b> <b>$${payload.total.toFixed(2)}</b>

<b>Payment Method:</b> ${escapeHtml(payload.paymentMethod.name)}
<b>Account ID:</b> <code>${escapeHtml(payload.paymentMethod.accountId)}</code>
<b>Status:</b> 🟡 <b>${payload.status}</b>
<b>Time:</b> ${payload.timestamp}
`;

      const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
      
      // 1. Send notification to Admin
      const adminRes = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: adminChatId,
          text: adminTextMessage,
          parse_mode: 'HTML'
        })
      });
      const adminData = await adminRes.json();
      console.log('Telegram Admin Notification Result:', adminData);

      // 2. Also send order confirmation DM to customer if valid Telegram user ID
      if (payload.telegramUser.id && payload.telegramUser.id !== 987654321 && String(payload.telegramUser.id) !== String(adminChatId)) {
        const customerTextMessage = `
✅ <b>ORDER RECEIVED — AnyAi Store</b>

Hey ${escapeHtml(payload.telegramUser.first_name)}! We received your payment request.

<b>Order ID:</b> <code>${payload.orderId}</code>
<b>Delivery Target:</b> <code>${escapeHtml(payload.deliveryEmail || 'Your Email')}</code>
<b>Status:</b> 🟡 <b>Pending Admin Verification</b>

We will verify your payment and send access credentials to your email address shortly!
`;
        await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: payload.telegramUser.id,
            text: customerTextMessage,
            parse_mode: 'HTML'
          })
        }).catch(err => console.error('Error sending customer DM:', err));
      }
    } catch (err) {
      console.error('Telegram notification fetch exception:', err);
    }
  } else {
    console.warn('Telegram notification skipped: TELEGRAM_BOT_TOKEN or TELEGRAM_ADMIN_CHAT_ID missing in process.env');
  }

  return {
    success: true,
    message: 'Order created successfully!'
  };
}

function escapeHtml(str: string): string {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
