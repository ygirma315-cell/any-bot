import { NextResponse } from 'next/server';
import { sendTelegramAdminNotification, OrderPayload } from '@/lib/bot';
import { getAdminSupabase, isSupabaseConfigured } from '@/lib/supabase';

export async function GET(request: Request) {
  const orderId = new URL(request.url).searchParams.get('orderId');
  if (!orderId) {
    return NextResponse.json({ success: false, error: 'Missing orderId parameter.' }, { status: 400 });
  }
  const dbClient = getAdminSupabase();
  if (!isSupabaseConfigured || !dbClient) {
    return NextResponse.json({ success: false, error: 'Database not available.' }, { status: 503 });
  }
  try {
    const { data, error } = await dbClient
      .from('orders')
      .select('order_id, status, created_at, updated_at')
      .eq('order_id', orderId)
      .maybeSingle();
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ success: false, error: 'Order not found.' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, error: 'Internal Server Error.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { deliveryEmail, telegramUser, items, total, subtotal, paymentMethod } = body;

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

    // The server always assigns the sequential order ID (#ORD-001, #ORD-002, ...)
    // based on the highest order number currently in the database.
    const dbClient = getAdminSupabase();

    let nextNumber = 1;
    if (isSupabaseConfigured && dbClient) {
      try {
        const { data: latest } = await dbClient
          .from('orders')
          .select('order_number')
          .order('order_number', { ascending: false })
          .limit(1);
        if (latest && latest.length > 0 && typeof latest[0].order_number === 'number') {
          nextNumber = latest[0].order_number + 1;
        }
      } catch (err) {
        console.warn('Failed to read latest order number:', err);
      }
    }

    const orderId = `#ORD-${String(nextNumber).padStart(3, '0')}`;

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
    let dbSaved = false;
    let isFreshOrder = false;
    if (isSupabaseConfigured && dbClient) {
      try {
        // Idempotent: skip re-inserting an order that already exists in the DB
        const { data: existingOrder } = await dbClient
          .from('orders')
          .select('id')
          .eq('order_id', orderPayload.orderId)
          .maybeSingle();

        if (existingOrder?.id) {
          dbSaved = true;
          isFreshOrder = false;
        } else {
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

          // Concurrent order race: the number was taken by someone else.
          // Re-read the latest number and retry once with the next one.
          if (orderErr || !insertedOrder) {
            console.warn('Order insert raced or failed, retrying with next number:', orderErr);
            const { data: latestRetry } = await dbClient
              .from('orders')
              .select('order_number')
              .order('order_number', { ascending: false })
              .limit(1);
            const retryNumber = latestRetry && latestRetry.length > 0 && typeof latestRetry[0].order_number === 'number'
              ? latestRetry[0].order_number + 1
              : nextNumber + 1;
            const retryId = `#ORD-${String(retryNumber).padStart(3, '0')}`;
            orderPayload.orderId = retryId;
            const retry = await dbClient
              .from('orders')
              .insert({ ...orderDataToInsert, order_id: retryId, telegram_user_id: null })
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

          dbSaved = !orderErr && Boolean(insertedOrder?.id);
          isFreshOrder = dbSaved;
        }
      } catch (dbErr) {
        console.error('Server-side Supabase order sync error:', dbErr);
      }
    }

    // 2. Dispatch Telegram notification to Admin
    // Notify for fresh orders and for orders whose DB save failed (so admin is still alerted).
    // Skip only for duplicate re-submissions of orders already in the database.
    if (isSupabaseConfigured && !dbSaved && !isFreshOrder) {
      console.warn('Order not saved to Supabase:', orderPayload.orderId);
    }
    const telegramResult = isFreshOrder || !dbSaved
      ? await sendTelegramAdminNotification(orderPayload)
      : { success: true, message: 'Order already in database - notification skipped.' };

    return NextResponse.json({
      success: true,
      orderId,
      status: orderPayload.status,
      timestamp: orderPayload.timestamp,
      notification: telegramResult.message,
      dbSaved
    });
  } catch (err: unknown) {
    console.error('Order creation error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error while creating order.' },
      { status: 500 }
    );
  }
}
