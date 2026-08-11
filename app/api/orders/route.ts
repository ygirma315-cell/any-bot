import { NextResponse } from 'next/server';
import { sendTelegramAdminNotification, OrderPayload } from '@/lib/bot';
import { getAdminSupabase, isSupabaseConfigured } from '@/lib/supabase';

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

    // 1. Sync order directly into Supabase DB on server side using admin client
    const dbClient = getAdminSupabase();
    if (isSupabaseConfigured && dbClient) {
      try {
        if (orderPayload.telegramUser?.id) {
          try {
            await dbClient.from('telegram_users').upsert({
              telegram_id: orderPayload.telegramUser.id,
              username: orderPayload.telegramUser.username || null,
              first_name: orderPayload.telegramUser.first_name || 'Customer',
              last_name: orderPayload.telegramUser.last_name || null,
              has_ordered: true,
              last_active_at: new Date().toISOString()
            }, { onConflict: 'telegram_id' });
          } catch (err) {
            console.warn('telegram_users upsert warning:', err);
          }
        }

        const orderDataToInsert = {
          order_id: orderPayload.orderId,
          telegram_user_id: orderPayload.telegramUser?.id || null,
          delivery_email: orderPayload.deliveryEmail || null,
          subtotal: orderPayload.subtotal,
          total: orderPayload.total,
          payment_method: orderPayload.paymentMethod,
          status: orderPayload.status
        };

        let { data: insertedOrder, error: orderErr } = await dbClient
          .from('orders')
          .insert(orderDataToInsert)
          .select('id')
          .maybeSingle();

        if (orderErr || !insertedOrder) {
          console.warn('First order insert attempt warning, retrying with fallback:', orderErr);
          const fallbackId = `${orderPayload.orderId}-${Date.now().toString().slice(-4)}`;
          const retryRow = { ...orderDataToInsert, order_id: fallbackId, telegram_user_id: null };
          const retry = await dbClient
            .from('orders')
            .insert(retryRow)
            .select('id')
            .maybeSingle();
          insertedOrder = retry.data;
          orderErr = retry.error;
        }

        if (orderErr) {
          console.error('Final Supabase order insert error:', orderErr);
        }

        if (insertedOrder?.id && orderPayload.items?.length) {
          const itemsToInsert = orderPayload.items.map(item => ({
            order_id: insertedOrder.id,
            product_id: item.id || 'product',
            product_name: item.name || 'AI Product',
            price: Number(item.price) || 0,
            quantity: Number(item.quantity) || 1,
            warranty: item.warranty || 'Warranty Included'
          }));
          const { error: itemsErr } = await dbClient.from('order_items').insert(itemsToInsert);
          if (itemsErr) {
            console.error('order_items insert error:', itemsErr);
          }
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
