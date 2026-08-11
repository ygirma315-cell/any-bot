import { NextResponse } from 'next/server';
import { sendTelegramAdminNotification, OrderPayload } from '@/lib/bot';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderId: incomingOrderId, deliveryEmail, telegramUser, items, total, subtotal, paymentMethod } = body;

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

    const orderId = incomingOrderId || `#1`;

    const orderPayload: OrderPayload = {
      orderId,
      deliveryEmail: deliveryEmail || undefined,
      telegramUser: telegramUser || { id: 987654321, first_name: 'Guest', username: 'guest_user' },
      items,
      subtotal: subtotal || total,
      total,
      paymentMethod,
      timestamp: new Date().toLocaleString('en-US', { timeZone: 'UTC', dateStyle: 'medium', timeStyle: 'short' }) + ' UTC',
      status: 'Pending'
    };

    // 1. Sync order directly into Supabase DB on server side if configured
    if (isSupabaseConfigured && supabase) {
      try {
        if (orderPayload.telegramUser?.id) {
          await supabase.from('telegram_users').upsert({
            telegram_id: orderPayload.telegramUser.id,
            username: orderPayload.telegramUser.username,
            first_name: orderPayload.telegramUser.first_name,
            last_name: orderPayload.telegramUser.last_name,
            has_ordered: true,
            last_active_at: new Date().toISOString()
          }).catch(err => console.warn('telegram_users upsert warning:', err));
        }

        let { data: insertedOrder, error: orderErr } = await supabase.from('orders').upsert({
          order_id: orderPayload.orderId,
          telegram_user_id: orderPayload.telegramUser?.id || null,
          delivery_email: orderPayload.deliveryEmail || null,
          subtotal: orderPayload.subtotal,
          total: orderPayload.total,
          payment_method: orderPayload.paymentMethod,
          status: orderPayload.status
        }, { onConflict: 'order_id' }).select('id').single();

        if (orderErr) {
          console.warn('First order upsert attempt error, retrying without FK:', orderErr);
          const retry = await supabase.from('orders').upsert({
            order_id: orderPayload.orderId,
            telegram_user_id: null,
            delivery_email: orderPayload.deliveryEmail || null,
            subtotal: orderPayload.subtotal,
            total: orderPayload.total,
            payment_method: orderPayload.paymentMethod,
            status: orderPayload.status
          }, { onConflict: 'order_id' }).select('id').single();
          insertedOrder = retry.data;
          orderErr = retry.error;
        }

        if (!orderErr && insertedOrder && orderPayload.items?.length) {
          const itemsToInsert = orderPayload.items.map(item => ({
            order_id: insertedOrder.id,
            product_id: item.id,
            product_name: item.name,
            price: item.price,
            quantity: item.quantity,
            warranty: item.warranty
          }));
          await supabase.from('order_items').insert(itemsToInsert).catch(err => console.warn('order_items insert warning:', err));
        }
      } catch (dbErr) {
        console.error('Server-side Supabase order sync error:', dbErr);
      }
    }

    // 2. Dispatch Telegram notification to Admin
    const telegramResult = await sendTelegramAdminNotification(orderPayload);

    return NextResponse.json({
      success: true,
      orderId,
      status: orderPayload.status,
      timestamp: orderPayload.timestamp,
      notification: telegramResult.message
    });
  } catch (err: unknown) {
    console.error('Order creation error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error while creating order.' },
      { status: 500 }
    );
  }
}
