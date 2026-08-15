import { NextRequest, NextResponse } from 'next/server';
import { isSupabaseConfigured, getAdminSupabase } from '@/lib/supabase';
import { sendDeliveryEmail } from '@/lib/email';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const testEmail = url.searchParams.get('testEmail');

  const dbClient = getAdminSupabase();
  let dbStatus = 'Not Configured';
  let ordersCount = null;
  let dbError = null;

  if (isSupabaseConfigured && dbClient) {
    try {
      const { count, error } = await dbClient.from('orders').select('*', { count: 'exact', head: true });
      if (error) {
        dbStatus = 'Error';
        dbError = error.message;
      } else {
        dbStatus = 'Connected Successfully!';
        ordersCount = count;
      }
    } catch (e: any) {
      dbStatus = 'Exception';
      dbError = e.message;
    }
  }

  // SMTP Settings Diagnosis
  const smtpHost = process.env.SMTP_HOST || process.env.EMAIL_SERVER_HOST;
  const smtpPort = process.env.SMTP_PORT || process.env.EMAIL_SERVER_PORT || '587';
  const smtpUser = process.env.SMTP_USER || process.env.EMAIL_SERVER_USER;
  const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_SERVER_PASSWORD;
  const smtpFrom = process.env.SMTP_FROM || process.env.EMAIL_FROM;

  let emailTestResult = null;
  if (testEmail) {
    try {
      emailTestResult = await sendDeliveryEmail({
        toEmail: testEmail,
        customerName: 'Test Customer',
        orderId: '#TEST-DIAGNOSTIC',
        totalAmount: 19.99,
        items: [
          {
            productName: 'ChatGPT Plus (1 Month Diagnostic)',
            price: 19.99,
            type: 'account',
            username: 'test.account@aiunlimited.shop',
            password: 'DemoPassword2026!',
            notes: 'This is a live test delivery email from your AnyAi Store configuration.',
            warranty: '30-Day Warranty'
          }
        ]
      });
    } catch (err: any) {
      emailTestResult = { success: false, error: err.message || String(err) };
    }
  }

  return NextResponse.json({
    database: {
      isSupabaseConfigured,
      hasUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      hasAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      hasServiceKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      dbStatus,
      ordersCount,
      dbError
    },
    smtpConfig: {
      isConfigured: Boolean(smtpHost && smtpUser && smtpPass),
      host: smtpHost || 'NOT_SET',
      port: smtpPort,
      user: smtpUser ? `${smtpUser.slice(0, 3)}***@${smtpUser.split('@')[1] || 'domain'}` : 'NOT_SET',
      hasPass: Boolean(smtpPass),
      from: smtpFrom || 'DEFAULT_SENDER'
    },
    emailTestResult: emailTestResult ? {
      targetEmail: testEmail,
      result: emailTestResult
    } : 'Add ?testEmail=your_email@gmail.com to this URL to trigger a live test email'
  });
}
