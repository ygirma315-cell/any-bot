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
  deliveredCredentials?: Array<{
    product_id?: string;
    product_name?: string;
    type?: string;
    link?: string;
    username?: string;
    password?: string;
    notes?: string;
  }>;
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
      if (payload.telegramUser.id && payload.telegramUser.id !== 987654321) {
        const customerTextMessage = `
✅ <b>ORDER RECEIVED — AnyAi Store</b>

Hey ${escapeHtml(payload.telegramUser.first_name)}! We received your payment request.

<b>Order ID:</b> <code>${payload.orderId}</code>
<b>Delivery Target:</b> <code>${escapeHtml(payload.deliveryEmail || 'Your Email')}</code>
<b>Status:</b> 🟡 <b>Pending Admin Verification</b>

We will verify your payment and send access credentials to your email address shortly!
`;
        try {
          const customerRes = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: payload.telegramUser.id,
              text: customerTextMessage,
              parse_mode: 'HTML'
            })
          });
          const customerData = await customerRes.json();
          console.log('Telegram Customer Notification Result:', customerData);
        } catch (err) {
          console.error('Error sending customer DM:', err);
        }
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

export async function sendTelegramOrderStatusUpdate(
  orderId: string,
  status: string,
  customer: { telegramId?: number; first_name?: string; username?: string } | null,
  deliveryEmail?: string,
  extraDetails?: { 
    items?: { name: string; quantity: number }[]; 
    total?: number;
    credentials?: {
      productName: string;
      price?: number;
      type?: 'link' | 'account' | 'key' | 'text';
      link?: string;
      username?: string;
      password?: string;
      notes?: string;
      warranty?: string;
    }[];
  }
): Promise<{ success: boolean; message: string }> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;

  if (!botToken || botToken.includes('123456789:ABCdef')) {
    console.warn('Telegram status update skipped: TELEGRAM_BOT_TOKEN is missing or invalid in process.env');
    return { success: false, message: 'TELEGRAM_BOT_TOKEN not configured.' };
  }

  const isAccepted = status === 'Accepted' || status === 'Completed' || status === 'Payment Confirmed';
  const isRejected = status === 'Rejected' || status === 'Cancelled';
  let statusEmoji: string;
  let headline: string;
  let customerStatusText: string;

  if (isAccepted) {
    statusEmoji = '✅';
    headline = 'ORDER ACCEPTED & ACCESS DELIVERED — AnyAi Store';
    customerStatusText = 'Your payment has been verified! Below are your digital access credentials / links:';
  } else if (isRejected) {
    statusEmoji = '❌';
    headline = 'ORDER REJECTED — AnyAi Store';
    customerStatusText = 'We could not verify your payment. Please check your transaction details and contact admin support (@exo80) if you need assistance.';
  } else {
    statusEmoji = '🟡';
    headline = 'ORDER STATUS UPDATE — AnyAi Store';
    customerStatusText = `Your order status has been updated to ${status}.`;
  }

  // Format digital credentials if available
  let credentialsFormatted = '';
  if (extraDetails?.credentials && extraDetails.credentials.length > 0) {
    credentialsFormatted = '\n\n🔑 <b>YOUR SUBSCRIPTION ACCESS DETAILS:</b>\n' + extraDetails.credentials.map((cred, idx) => {
      const priceText = cred.price !== undefined ? ` — <b>$${cred.price.toFixed(2)}</b>` : '';
      let block = `\n━━━━━━━━━━━━━━━━━━━━\n📦 <b>${idx + 1}. ${escapeHtml(cred.productName)}</b>${priceText}\n<i>From AnyAi STORE: Here is your ${escapeHtml(cred.productName)} subscription access:</i>`;
      if (cred.link) {
        block += `\n🔗 <b>Access Link:</b> ${escapeHtml(cred.link)}`;
      }
      if (cred.username) {
        block += `\n👤 <b>Username/Email:</b> <code>${escapeHtml(cred.username)}</code>`;
      }
      if (cred.password) {
        block += `\n🔒 <b>Password:</b> <code>${escapeHtml(cred.password)}</code>`;
      }
      if (cred.notes) {
        block += `\n📝 <b>Instructions:</b> <i>${escapeHtml(cred.notes)}</i>`;
      }
      if (cred.warranty) {
        block += `\n🛡️ <b>Warranty:</b> <i>${escapeHtml(cred.warranty)}</i>`;
      }
      return block;
    }).join('\n');
  }

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const validCustomerTgId = customer?.telegramId && customer.telegramId !== 987654321 ? customer.telegramId : null;
  const customerName = customer?.first_name || (customer?.username ? `@${customer.username}` : 'there');

  // 1. Send Direct Message to Customer (if valid Telegram user ID)
  if (validCustomerTgId) {
    const customerTextMessage = `
${statusEmoji} <b>${headline}</b>

Hey ${escapeHtml(customerName)}!

<b>Order ID:</b> <code>${escapeHtml(orderId)}</code>
<b>Delivery Target:</b> <code>${escapeHtml(deliveryEmail || 'Your Email')}</code>
<b>Status:</b> ${statusEmoji} <b>${escapeHtml(status)}</b>

${customerStatusText}${credentialsFormatted}

💬 <i>Need help? Contact support: @exo80</i>
`;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000),
        body: JSON.stringify({
          chat_id: validCustomerTgId,
          text: customerTextMessage,
          parse_mode: 'HTML'
        })
      });
      const data = await res.json();
      console.log('Telegram Customer Status Update Result:', data);
    } catch (err) {
      console.error('Error sending customer status update DM:', err);
    }
  } else {
    console.log('Customer DM skipped (no valid customer Telegram ID for order', orderId, ')');
  }

  // 2. Also send Status Change notification to Admin Chat (if configured)
  if (adminChatId) {
    const isSameAsCustomer = validCustomerTgId && String(validCustomerTgId) === String(adminChatId);
    if (!isSameAsCustomer) {
      const customerDisplay = customer?.username
        ? `@${customer.username}`
        : customer?.first_name
        ? `${customer.first_name}${validCustomerTgId ? ` (${validCustomerTgId})` : ''}`
        : validCustomerTgId
        ? `ID: ${validCustomerTgId}`
        : 'Direct Web Visitor';

      const adminTextMessage = `
🔔 <b>ORDER STATUS UPDATED</b>

<b>Order ID:</b> <code>${escapeHtml(orderId)}</code>
<b>New Status:</b> ${statusEmoji} <b>${escapeHtml(status)}</b>
<b>Customer:</b> ${escapeHtml(customerDisplay)}
<b>Delivery Email:</b> <code>${escapeHtml(deliveryEmail || 'Not Provided')}</code>
${extraDetails?.total ? `<b>Total:</b> $${extraDetails.total.toFixed(2)}\n` : ''}${credentialsFormatted ? `<b>Credentials Dispatched:</b> Yes (${extraDetails?.credentials?.length || 0} items)\n` : ''}
<i>Updated from Admin Dashboard at ${new Date().toLocaleTimeString()}</i>
`;

      try {
        const adminRes = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(5000),
          body: JSON.stringify({
            chat_id: adminChatId,
            text: adminTextMessage,
            parse_mode: 'HTML'
          })
        });
        const adminData = await adminRes.json();
        console.log('Telegram Admin Status Update Log Result:', adminData);
      } catch (err) {
        console.error('Error sending admin status update notification:', err);
      }
    }
  }

  return { success: true, message: 'Status notifications processed.' };
}

function escapeHtml(str: string): string {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
