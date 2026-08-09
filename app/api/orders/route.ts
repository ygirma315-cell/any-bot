import { NextResponse } from 'next/server';
import { sendTelegramAdminNotification, OrderPayload } from '@/lib/bot';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { telegramUser, items, total, subtotal, paymentMethod } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Order must contain at least one product.' },
        { status: 400 }
      );
    }

    if (!paymentMethod || !paymentMethod.id) {
      return NextResponse.json(
        { success: false, error: 'Please select a valid payment method.' },
        { status: 400 }
      );
    }

    // Generate unique human-readable order ID
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderId = `ORD-${dateStr}-${randomSuffix}`;

    const orderPayload: OrderPayload = {
      orderId,
      telegramUser: telegramUser || { id: 987654321, first_name: 'Guest', username: 'guest_user' },
      items,
      subtotal: subtotal || total,
      total,
      paymentMethod,
      timestamp: new Date().toLocaleString('en-US', { timeZone: 'UTC', dateStyle: 'medium', timeStyle: 'short' }) + ' UTC',
      status: 'Payment Submitted'
    };

    // Safely attempt notification
    const telegramResult = await sendTelegramAdminNotification(orderPayload);

    return NextResponse.json({
      success: true,
      orderId,
      status: orderPayload.status,
      timestamp: orderPayload.timestamp,
      notification: telegramResult.message
    });
  } catch (err: any) {
    console.error('Order creation error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error while creating order.' },
      { status: 500 }
    );
  }
}
