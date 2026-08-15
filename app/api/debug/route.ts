import { NextRequest, NextResponse } from 'next/server';
import { isSupabaseConfigured, getAdminSupabase } from '@/lib/supabase';
import { sendDeliveryEmail, getSmtpConfigStatus } from '@/lib/email';
import { isValidAdminSession } from '@/lib/admin-session';

export const dynamic = 'force-dynamic';

function requireAdmin(req: NextRequest): boolean {
  const cookie = req.headers.get('cookie');
  const auth = req.headers.get('authorization');
  return isValidAdminSession(cookie, auth);
}

export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ success: false, error: 'Admin authentication required.' }, { status: 401 });
  }

  const url = new URL(req.url);
  const testEmail = url.searchParams.get('testEmail') || url.searchParams.get('email');

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

  const smtpStatus = getSmtpConfigStatus();

  let emailTestResult = null;
  if (testEmail) {
    try {
      emailTestResult = await sendDeliveryEmail({
        toEmail: testEmail,
        customerName: 'Live Test Customer',
        orderId: '#TEST-LIVE',
        totalAmount: 19.99,
        items: [
          {
            productName: 'ChatGPT Plus (1 Month Live Test)',
            price: 19.99,
            type: 'account',
            username: 'test.account@aiunlimited.shop',
            password: 'TestPass-DEMO',
            notes: 'This is a verified live test delivery email from your AnyAi Store configuration.',
            warranty: '30-Day Warranty'
          }
        ]
      });
    } catch (err: any) {
      emailTestResult = { success: false, error: err.message || String(err) };
    }
  }

  return NextResponse.json({
    status: 'AnyAi Store API Diagnostic & Live Testing System',
    timestamp: new Date().toISOString(),
    database: {
      isSupabaseConfigured,
      hasUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      hasAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      hasServiceKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      dbStatus,
      ordersCount,
      dbError
    },
    emailConfig: smtpStatus,
    liveEmailTest: emailTestResult ? {
      targetEmail: testEmail,
      delivered: emailTestResult.success,
      provider: emailTestResult.provider,
      result: emailTestResult
    } : {
      hint: 'To send a live test delivery email, append ?testEmail=your_email@gmail.com to this URL',
      example: `${url.origin}/api/debug?testEmail=your_email@gmail.com`
    },
    setupInstructions: smtpStatus.isConfigured ? 'Email configuration is ACTIVE' : {
      message: 'SMTP is not yet configured. To enable automatic delivery emails upon order acceptance:',
      steps: [
        'Option A (Gmail): Set SMTP_HOST=smtp.gmail.com, SMTP_PORT=465, SMTP_SECURE=true, SMTP_USER=your_gmail@gmail.com, SMTP_PASS=your_16_char_app_password',
        'Option B (Resend): Set RESEND_API_KEY=re_123456789, SMTP_FROM=onboarding@resend.dev or your verified domain',
        'Option C (Brevo/SendGrid): Set SMTP_HOST=smtp-relay.brevo.com, SMTP_PORT=587, SMTP_USER=your_login, SMTP_PASS=your_smtp_key'
      ]
    }
  });
}

export async function POST(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ success: false, error: 'Admin authentication required.' }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { testEmail, customerName = 'Live Test Customer' } = body;

    if (!testEmail || !testEmail.includes('@')) {
      return NextResponse.json({ success: false, error: 'Valid testEmail address is required in POST body.' }, { status: 400 });
    }

    const emailTestResult = await sendDeliveryEmail({
      toEmail: testEmail,
      customerName,
      orderId: '#TEST-LIVE',
      totalAmount: 19.99,
      items: [
        {
          productName: 'ChatGPT Plus (1 Month Live Test)',
          price: 19.99,
          type: 'account',
          username: 'test.account@aiunlimited.shop',
          password: 'TestPass-DEMO',
          notes: 'This is a verified live test delivery email from your AnyAi Store configuration.',
          warranty: '30-Day Warranty'
        }
      ]
    });

    return NextResponse.json({
      success: emailTestResult.success,
      delivered: emailTestResult.success,
      targetEmail: testEmail,
      provider: emailTestResult.provider,
      error: emailTestResult.error,
      config: getSmtpConfigStatus()
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal error during live email test.' }, { status: 500 });
  }
}
