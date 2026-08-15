import { NextRequest, NextResponse } from 'next/server';
import { sendDeliveryEmail, getSmtpConfigStatus } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const targetEmail = url.searchParams.get('to') || url.searchParams.get('email') || url.searchParams.get('testEmail');

  const config = getSmtpConfigStatus();

  if (!targetEmail) {
    return NextResponse.json({
      success: false,
      message: 'Provide a recipient email to trigger a live test delivery.',
      smtpConfig: config,
      usageExample: `${url.origin}/api/test-email?to=your_email@gmail.com`
    });
  }

  const result = await sendDeliveryEmail({
    toEmail: targetEmail,
    customerName: 'Live Tester',
    orderId: '#TEST-LIVE',
    totalAmount: 19.99,
    items: [
      {
        productName: 'ChatGPT Plus (Live Test Delivery)',
        price: 19.99,
        type: 'account',
        username: 'test.user@aiunlimited.shop',
        password: 'DemoPassword2026!',
        notes: 'This is a verified live test delivery email from your AnyAi Store configuration.',
        warranty: '30-Day Active Warranty'
      }
    ]
  });

  return NextResponse.json({
    success: result.success,
    delivered: result.success,
    targetEmail,
    provider: result.provider,
    error: result.error,
    smtpConfig: config
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const targetEmail = body.to || body.email || body.testEmail;
    const customerName = body.name || body.customerName || 'Live Tester';

    if (!targetEmail || !targetEmail.includes('@')) {
      return NextResponse.json({ success: false, error: 'Valid recipient email address is required.' }, { status: 400 });
    }

    const config = getSmtpConfigStatus();

    const result = await sendDeliveryEmail({
      toEmail: targetEmail,
      customerName,
      orderId: '#TEST-LIVE',
      totalAmount: 19.99,
      items: [
        {
          productName: 'ChatGPT Plus (Live Test Delivery)',
          price: 19.99,
          type: 'account',
          username: 'test.user@aiunlimited.shop',
          password: 'DemoPassword2026!',
          notes: 'This is a verified live test delivery email from your AnyAi Store configuration.',
          warranty: '30-Day Active Warranty'
        }
      ]
    });

    return NextResponse.json({
      success: result.success,
      delivered: result.success,
      targetEmail,
      provider: result.provider,
      error: result.error,
      smtpConfig: config
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal test email error' }, { status: 500 });
  }
}
