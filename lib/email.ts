export interface DeliveryItemCredential {
  productName: string;
  price?: number;
  type?: 'link' | 'account' | 'key' | 'text';
  link?: string;
  username?: string;
  password?: string;
  notes?: string;
  warranty?: string;
}

export interface DeliveryEmailPayload {
  toEmail: string;
  customerName: string;
  orderId: string;
  items: DeliveryItemCredential[];
  totalAmount?: number;
  smtpOverride?: {
    host?: string;
    port?: number;
    user?: string;
    pass?: string;
    from?: string;
    secure?: boolean;
  };
}

export interface EmailServiceStatus {
  isConfigured: boolean;
  provider: 'SMTP' | 'Resend' | 'None';
  host: string;
  port: number;
  user: string;
  hasPass: boolean;
  from: string;
  hasResendKey: boolean;
}

function resolveEmailConfig(smtpOverride?: DeliveryEmailPayload['smtpOverride']) {
  // Check all possible environment variable aliases
  let smtpHost = (
    smtpOverride?.host ||
    process.env.SMTP_HOST ||
    process.env.EMAIL_SERVER_HOST ||
    process.env.MAIL_HOST ||
    process.env.EMAIL_HOST ||
    process.env.GMAIL_HOST ||
    ''
  ).trim();

  let smtpUser = (
    smtpOverride?.user ||
    process.env.SMTP_USER ||
    process.env.SMTP_USERNAME ||
    process.env.SMTP_EMAIL ||
    process.env.EMAIL_SERVER_USER ||
    process.env.EMAIL_USER ||
    process.env.EMAIL_USERNAME ||
    process.env.MAIL_USERNAME ||
    process.env.MAIL_USER ||
    process.env.GMAIL_USER ||
    ''
  ).trim();

  let smtpPass = (
    smtpOverride?.pass ||
    process.env.SMTP_PASS ||
    process.env.SMTP_PASSWORD ||
    process.env.EMAIL_SERVER_PASSWORD ||
    process.env.EMAIL_PASSWORD ||
    process.env.EMAIL_PASS ||
    process.env.MAIL_PASSWORD ||
    process.env.MAIL_PASS ||
    process.env.GMAIL_PASS ||
    process.env.GMAIL_PASSWORD ||
    process.env.GMAIL_APP_PASSWORD ||
    process.env.SMTP_KEY ||
    ''
  ).trim();

  let rawPort = (
    smtpOverride?.port ||
    process.env.SMTP_PORT ||
    process.env.EMAIL_SERVER_PORT ||
    process.env.MAIL_PORT ||
    process.env.EMAIL_PORT ||
    ''
  );

  const resendKey = (
    process.env.RESEND_API_KEY ||
    process.env.RESEND_KEY ||
    process.env.RESEND_TOKEN ||
    ''
  ).trim();

  // Smart Gmail auto-detection if host wasn't explicitly provided
  if (!smtpHost && (smtpUser.includes('@gmail.com') || smtpUser.includes('@googlemail.com'))) {
    smtpHost = 'smtp.gmail.com';
  }

  const smtpPort = rawPort ? Number(rawPort) : (smtpHost.includes('gmail') ? 465 : 587);
  const isSecure = smtpOverride?.secure !== undefined 
    ? smtpOverride.secure 
    : (process.env.SMTP_SECURE === 'true' || process.env.MAIL_SECURE === 'true' || smtpPort === 465);

  let defaultFrom = 'AnyAi STORE <delivery@aiunlimited.shop>';
  if (smtpUser && smtpUser.includes('@')) {
    defaultFrom = `AnyAi STORE <${smtpUser}>`;
  }
  let fromEmail = (
    smtpOverride?.from ||
    process.env.SMTP_FROM ||
    process.env.EMAIL_FROM ||
    process.env.MAIL_FROM ||
    defaultFrom
  ).trim();

  if (smtpHost.includes('gmail') && smtpUser.includes('@') && !fromEmail.includes(smtpUser)) {
    fromEmail = `AnyAi STORE <${smtpUser}>`;
  }

  const isSmtpConfigured = Boolean(smtpHost && smtpUser && smtpPass);
  const isResendConfigured = Boolean(resendKey);

  return {
    smtpHost,
    smtpPort,
    smtpUser,
    smtpPass,
    isSecure,
    resendKey,
    fromEmail,
    isSmtpConfigured,
    isResendConfigured,
    isConfigured: isSmtpConfigured || isResendConfigured,
    provider: (isResendConfigured ? 'Resend' : isSmtpConfigured ? 'SMTP' : 'None') as 'SMTP' | 'Resend' | 'None'
  };
}

export function getSmtpConfigStatus(): EmailServiceStatus {
  const conf = resolveEmailConfig();

  return {
    isConfigured: conf.isConfigured,
    provider: conf.provider,
    host: conf.smtpHost || 'NOT_SET',
    port: conf.smtpPort,
    user: conf.smtpUser ? `${conf.smtpUser.slice(0, 3)}***@${conf.smtpUser.split('@')[1] || 'domain'}` : 'NOT_SET',
    hasPass: Boolean(conf.smtpPass),
    from: conf.fromEmail,
    hasResendKey: conf.isResendConfigured
  };
}

export async function sendDeliveryEmail(payload: DeliveryEmailPayload): Promise<{ success: boolean; error?: string; provider?: string }> {
  const { toEmail, customerName, orderId, items, totalAmount, smtpOverride } = payload;

  if (!toEmail || !toEmail.includes('@')) {
    return { success: false, error: 'Invalid destination email address.' };
  }

  const config = resolveEmailConfig(smtpOverride);
  const { smtpHost, smtpPort, smtpUser, smtpPass, isSecure, resendKey: resendApiKey, fromEmail } = config;

  // Generate Multipart Plain Text fallback (Critical for Spam Filters)
  const itemsPlainText = items.map((item, idx) => {
    const lines = [
      `[${idx + 1}] ${item.productName}${item.price ? ` — $${item.price.toFixed(2)} USD` : ''}`,
      item.warranty ? `Warranty: ${item.warranty}` : '',
      item.link ? `Direct Access Link: ${item.link}` : '',
      item.username ? `Username: ${item.username}` : '',
      item.password ? `Password: ${item.password}` : '',
      item.notes ? `Instructions: ${item.notes}` : ''
    ].filter(Boolean);
    return lines.join('\n');
  }).join('\n\n----------------------------------------\n\n');

  const textContent = `
AnyAi STORE — Digital Subscription Delivery
========================================

Hello ${customerName},

Thank you for your order with AnyAi STORE!
Your digital subscription and access credentials have been confirmed and delivered below:

Order ID: ${orderId}
Recipient: ${toEmail}
${totalAmount ? `Total Paid: $${totalAmount.toFixed(2)} USD` : ''}

DELIVERED CREDENTIALS:
----------------------------------------
${itemsPlainText}
----------------------------------------

IMPORTANT SUPPORT & WARRANTY:
- Keep your access credentials private and secure.
- Warranty coverage applies according to product terms.
- For 24/7 dedicated support, message us on Telegram: @exo80 (https://t.me/exo80)

AnyAi STORE — Automated Digital Delivery Service
https://aiunlimited.shop
`.trim();

  // HTML Email Body
  const itemsHtml = items.map((item, idx) => {
    let credsBlock = '';

    if (item.type === 'link' || item.link) {
      credsBlock += `
        <div style="margin-top: 12px; padding: 14px; background: #f8fafc; border-radius: 10px; border: 1px solid #e2e8f0;">
          <div style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.5px;">🔗 Direct Access Link:</div>
          <div style="margin: 8px 0;">
            <a href="${item.link}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 10px 22px; background: #ff6b00; color: #ffffff; text-decoration: none; font-weight: 800; font-size: 13px; border-radius: 8px; box-shadow: 0 2px 6px rgba(255,107,0,0.3);">Open Access Link &rarr;</a>
          </div>
          <div style="font-size: 11px; color: #64748b; margin-top: 8px; word-break: break-all;"><strong>URL:</strong> <a href="${item.link}" style="color: #ff6b00;">${item.link}</a></div>
        </div>
      `;
    }

    if (item.username || item.password) {
      credsBlock += `
        <div style="margin-top: 12px; padding: 14px; background: #f8fafc; border-radius: 10px; border: 1px solid #e2e8f0;">
          <div style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.5px;">👤 Login Credentials:</div>
          ${item.username ? `<div style="font-size: 13px; color: #0f172a; margin-bottom: 6px;"><strong>Username / Email:</strong> <code style="background: #e2e8f0; padding: 3px 8px; border-radius: 6px; font-family: monospace; font-weight: bold; color: #0f172a;">${item.username}</code></div>` : ''}
          ${item.password ? `<div style="font-size: 13px; color: #0f172a;"><strong>Password:</strong> <code style="background: #e2e8f0; padding: 3px 8px; border-radius: 6px; font-family: monospace; font-weight: bold; color: #0f172a;">${item.password}</code></div>` : ''}
        </div>
      `;
    }

    if (item.notes) {
      credsBlock += `
        <div style="margin-top: 10px; font-size: 12px; color: #475569; background: #fffbeb; border: 1px solid #fef3c7; padding: 10px 14px; border-radius: 8px;">
          <strong>📝 Activation / Setup Instructions:</strong> ${item.notes}
        </div>
      `;
    }

    const priceText = item.price !== undefined ? `$${item.price.toFixed(2)} USD` : '';

    return `
      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px; margin-bottom: 16px; box-shadow: 0 2px 6px rgba(0,0,0,0.04);">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9; padding-bottom: 10px; margin-bottom: 10px;">
          <div>
            <h3 style="margin: 0; font-size: 16px; font-weight: 900; color: #0f172a;">${idx + 1}. ${item.productName}</h3>
            ${priceText ? `<span style="font-size: 12px; font-weight: 800; color: #ff6b00;">${priceText}</span>` : ''}
          </div>
          ${item.warranty ? `<span style="font-size: 11px; color: #059669; font-weight: 800; background: #ecfdf5; padding: 4px 10px; border-radius: 9999px; border: 1px solid #a7f3d0;">🛡️ ${item.warranty}</span>` : ''}
        </div>

        <p style="margin: 0 0 10px; font-size: 12.5px; color: #475569;">
          From <strong>AnyAi STORE</strong>: This is your <strong>${item.productName}</strong> subscription that you ordered:
        </p>

        ${credsBlock || '<div style="margin-top: 8px; font-size: 12px; color: #059669; font-weight: bold;">✅ Your subscription has been activated! Please contact support on Telegram if you need direct assistance.</div>'}
      </div>
    `;
  }).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>AnyAi STORE — Your Subscription Details for Order ${orderId}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #334155;">
      <div style="max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 18px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 6px 24px rgba(0,0,0,0.08);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 26px; text-align: center;">
          <h1 style="color: #ffffff; font-size: 22px; font-weight: 900; margin: 0; letter-spacing: -0.5px;">AnyAi STORE</h1>
          <p style="color: #94a3b8; font-size: 12px; margin: 4px 0 0; font-weight: 600;">Digital &amp; AI Subscription Fulfillment</p>
        </div>

        <!-- Success Banner -->
        <div style="background: #ecfdf5; border-bottom: 1px solid #a7f3d0; padding: 16px 24px; text-align: center;">
          <h2 style="margin: 0; font-size: 16px; font-weight: 900; color: #065f46;">Order Confirmed &amp; Subscription Delivered!</h2>
          <p style="margin: 4px 0 0; font-size: 12px; color: #047857;">Order ID: <strong>${orderId}</strong> &bull; Sent to: <strong>${toEmail}</strong>${totalAmount ? ` &bull; Total: <strong>$${totalAmount.toFixed(2)}</strong>` : ''}</p>
        </div>

        <!-- Content -->
        <div style="padding: 24px;">
          <p style="font-size: 14px; color: #334155; margin-top: 0; line-height: 1.5;">
            Hey <strong>${customerName}</strong>, thank you for purchasing from <strong>AnyAi STORE</strong>! Below are your digital subscription access links, credentials, and details:
          </p>

          <div style="margin: 20px 0;">
            ${itemsHtml}
          </div>

          <!-- Important Rules / Support -->
          <div style="background: #fff7ed; border: 1px solid #ffedd5; border-radius: 12px; padding: 16px; margin-top: 20px;">
            <h4 style="margin: 0 0 6px; font-size: 12px; font-weight: 800; color: #9a3412; text-transform: uppercase;">⚠️ Important Terms &amp; Support:</h4>
            <ul style="margin: 0; padding-left: 18px; font-size: 12px; color: #7c2d12; line-height: 1.6;">
              <li>Please keep your subscription links and credentials secure and private.</li>
              <li>Warranty replacement coverage applies as stated in your product terms.</li>
              <li>Questions or need help? Contact our direct support: <a href="https://t.me/exo80" style="color: #ff6b00; font-weight: bold; text-decoration: underline;">@exo80 on Telegram</a></li>
            </ul>
          </div>
        </div>

        <!-- Footer -->
        <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 24px; text-align: center; font-size: 11px; color: #94a3b8;">
          <p style="margin: 0;">&copy; ${new Date().getFullYear()} AnyAi STORE. All rights reserved.</p>
          <p style="margin: 4px 0 0;">Automated Digital Delivery Service &bull; <a href="https://t.me/exo80" style="color: #64748b; text-decoration: underline;">Support @exo80</a> &bull; <a href="https://aiunlimited.shop" style="color: #64748b; text-decoration: underline;">aiunlimited.shop</a></p>
        </div>

      </div>
    </body>
    </html>
  `;

  const subject = `AnyAi STORE: Your Subscription Details for Order ${orderId}`;
  const replyTo = smtpUser && smtpUser.includes('@') ? smtpUser : 'exo80@aiunlimited.shop';

  // 1. Try Resend API first if configured
  if (resendApiKey) {
    try {
      console.log(`[Email Delivery] Dispatching via Resend API to ${toEmail}...`);
      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [toEmail],
          reply_to: replyTo,
          subject,
          text: textContent,
          html: htmlContent
        })
      });

      const resendData = await resendRes.json();
      if (!resendRes.ok) {
        throw new Error(resendData?.message || `Resend API returned status ${resendRes.status}`);
      }

      console.log(`[Email Delivery] Resend Success: ID=${resendData?.id} to ${toEmail} for order ${orderId}`);
      return { success: true, provider: 'Resend' };
    } catch (resendErr: any) {
      console.error('[Resend Delivery Error]', resendErr);
      if (!smtpHost || !smtpUser || !smtpPass) {
        return { success: false, error: `Resend delivery failed: ${resendErr.message || String(resendErr)}` };
      }
      // If SMTP is also configured, fall through to SMTP
    }
  }

  // 2. Try SMTP via Nodemailer
  if (smtpHost && smtpUser && smtpPass) {
    console.log(`[Email Delivery] SMTP configured: host=${smtpHost} port=${smtpPort} secure=${isSecure} user=${smtpUser} from=${fromEmail}`);
    try {
      const nodemailer = await import('nodemailer');
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: isSecure,
        pool: true,
        maxConnections: 3,
        maxMessages: 50,
        connectionTimeout: 8000,
        greetingTimeout: 8000,
        socketTimeout: 8000,
        auth: {
          user: smtpUser,
          pass: smtpPass
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      await Promise.race([
        transporter.sendMail({
          from: fromEmail,
          to: toEmail,
          replyTo,
          subject,
          text: textContent,
          html: htmlContent,
          headers: {
            'X-Entity-Ref-ID': orderId,
            'X-Auto-Response-Suppress': 'All',
            'Auto-Submitted': 'auto-generated',
            'List-Unsubscribe': '<https://t.me/exo80>'
          }
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('SMTP connection timeout after 8 seconds')), 8000))
      ]);

      console.log(`[Email Delivery] Successfully sent credentials email to ${toEmail} for order ${orderId}`);
      return { success: true, provider: 'SMTP' };
    } catch (err: any) {
      console.error('[Email Delivery Error]', err);
      return { success: false, error: err.message || 'SMTP delivery failed' };
    }
  }

  // 3. Neither SMTP nor Resend configured
  const errorMsg = 'SMTP / Email service is not configured. Missing SMTP_HOST, SMTP_USER, and SMTP_PASS (or RESEND_API_KEY) in environment variables.';
  console.warn(`[Email Delivery] FAILED: ${errorMsg} Delivery target was ${toEmail} for order ${orderId}.`);
  return {
    success: false,
    error: errorMsg
  };
}
