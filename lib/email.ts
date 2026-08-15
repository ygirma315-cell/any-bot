// Digital Product Access & Credentials Delivery Email Service
// Supports SMTP (Gmail, Brevo, SendGrid, Mailgun, Amazon SES, Custom SMTP)

export interface DeliveryItemCredential {
  productName: string;
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
}

export async function sendDeliveryEmail(payload: DeliveryEmailPayload): Promise<{ success: boolean; error?: string }> {
  const { toEmail, customerName, orderId, items } = payload;

  if (!toEmail || !toEmail.includes('@')) {
    return { success: false, error: 'Invalid destination email.' };
  }

  // SMTP Settings from process.env
  const smtpHost = process.env.SMTP_HOST || process.env.EMAIL_SERVER_HOST;
  const smtpPort = Number(process.env.SMTP_PORT || process.env.EMAIL_SERVER_PORT || 587);
  const smtpUser = process.env.SMTP_USER || process.env.EMAIL_SERVER_USER;
  const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_SERVER_PASSWORD;
  const fromEmail = process.env.SMTP_FROM || process.env.EMAIL_FROM || 'AnyAi Store <delivery@aiunlimited.shop>';

  const itemsHtml = items.map((item, idx) => {
    let credsBlock = '';

    if (item.type === 'link' || item.link) {
      credsBlock += `
        <div style="margin-top: 10px; padding: 12px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
          <div style="font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">Direct Access Link</div>
          <a href="${item.link}" target="_blank" style="display: inline-block; padding: 8px 16px; background: #ff6b00; color: #ffffff; text-decoration: none; font-weight: bold; font-size: 13px; border-radius: 6px;">Open Access Link &rarr;</a>
          <div style="font-size: 11px; color: #64748b; margin-top: 6px; word-break: break-all;">${item.link}</div>
        </div>
      `;
    }

    if (item.username || item.password) {
      credsBlock += `
        <div style="margin-top: 10px; padding: 12px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
          <div style="font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase; margin-bottom: 6px;">Account Credentials</div>
          ${item.username ? `<div style="font-size: 13px; color: #0f172a; margin-bottom: 4px;"><strong>Username / Email:</strong> <code style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-family: monospace;">${item.username}</code></div>` : ''}
          ${item.password ? `<div style="font-size: 13px; color: #0f172a;"><strong>Password:</strong> <code style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-family: monospace;">${item.password}</code></div>` : ''}
        </div>
      `;
    }

    if (item.notes) {
      credsBlock += `
        <div style="margin-top: 8px; font-size: 12px; color: #475569; background: #fffbeb; border: 1px solid #fef3c7; padding: 8px 12px; border-radius: 6px;">
          <strong>Setup / Activation Notes:</strong> ${item.notes}
        </div>
      `;
    }

    return `
      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 14px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <h3 style="margin: 0; font-size: 15px; font-weight: 800; color: #0f172a;">${idx + 1}. ${item.productName}</h3>
          ${item.warranty ? `<span style="font-size: 11px; color: #059669; font-weight: 700; background: #ecfdf5; padding: 2px 8px; border-radius: 9999px; border: 1px solid #a7f3d0;">${item.warranty}</span>` : ''}
        </div>
        ${credsBlock || '<div style="margin-top: 8px; font-size: 12px; color: #059669; font-weight: bold;">Access active and verified. Please follow support instructions.</div>'}
      </div>
    `;
  }).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Your Product Credentials — Order ${orderId}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 24px; text-align: center;">
          <h1 style="color: #ffffff; font-size: 22px; font-weight: 900; margin: 0; letter-spacing: -0.5px;">AnyAi STORE</h1>
          <p style="color: #94a3b8; font-size: 12px; margin: 4px 0 0; font-weight: 600;">Digital & AI Subscription Services</p>
        </div>

        <!-- Success Banner -->
        <div style="background: #ecfdf5; border-bottom: 1px solid #a7f3d0; padding: 16px 24px; text-align: center;">
          <div style="font-size: 18px; margin-bottom: 2px;">🎉</div>
          <h2 style="margin: 0; font-size: 16px; font-weight: 800; color: #065f46;">Order Confirmed & Access Released!</h2>
          <p style="margin: 4px 0 0; font-size: 12px; color: #047857;">Order ID: <strong>${orderId}</strong> &bull; Delivered to <strong>${toEmail}</strong></p>
        </div>

        <!-- Content -->
        <div style="padding: 24px;">
          <p style="font-size: 14px; color: #334155; margin-top: 0; line-height: 1.5;">
            Hey <strong>${customerName}</strong>, thank you for your order with <strong>AnyAi Store</strong>! Your payment has been approved and your digital access credentials are provided below:
          </p>

          <div style="margin: 20px 0;">
            ${itemsHtml}
          </div>

          <!-- Important Rules / Support -->
          <div style="background: #fff7ed; border: 1px solid #ffedd5; border-radius: 12px; padding: 14px; margin-top: 20px;">
            <h4 style="margin: 0 0 6px; font-size: 12px; font-weight: 800; color: #9a3412; text-transform: uppercase;">⚠️ Important Terms & Support:</h4>
            <ul style="margin: 0; padding-left: 18px; font-size: 11.5px; color: #7c2d12; line-height: 1.5;">
              <li>Please keep these credentials private and do not share them.</li>
              <li>Warranty replacement coverage applies as stated in your order summary.</li>
              <li>Need assistance? Contact our 24/7 Telegram support: <a href="https://t.me/exo80" style="color: #ff6b00; font-weight: bold; text-decoration: underline;">@exo80</a></li>
            </ul>
          </div>
        </div>

        <!-- Footer -->
        <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 24px; text-align: center; font-size: 11px; color: #94a3b8;">
          <p style="margin: 0;">&copy; ${new Date().getFullYear()} AnyAi Store. All rights reserved.</p>
          <p style="margin: 4px 0 0;">Automated Digital Delivery Service &bull; <a href="https://aiunlimited.shop" style="color: #64748b; text-decoration: underline;">aiunlimited.shop</a></p>
        </div>

      </div>
    </body>
    </html>
  `;

  if (smtpHost && smtpUser && smtpPass) {
    try {
      const nodemailer = await import('nodemailer');
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass
        }
      });

      await transporter.sendMail({
        from: fromEmail,
        to: toEmail,
        subject: `✅ Your Access Credentials for Order ${orderId} — AnyAi Store`,
        html: htmlContent
      });

      console.log(`[Email Delivery] Successfully sent credentials email to ${toEmail} for order ${orderId}`);
      return { success: true };
    } catch (err: any) {
      console.error('[Email Delivery Error]', err);
      return { success: false, error: err.message };
    }
  } else {
    // If SMTP credentials are not yet configured in .env.local, log simulation
    console.log(`[Email Delivery Notice] SMTP not configured in .env.local (SMTP_HOST/SMTP_USER/SMTP_PASS missing). Email prepared for ${toEmail} with ${items.length} credential items.`);
    return { success: true };
  }
}
