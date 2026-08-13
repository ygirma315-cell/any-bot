import { NextResponse } from 'next/server';
import { isValidAdminSession } from '@/lib/admin-session';
import { getAdminSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { sendTelegramOrderStatusUpdate } from '@/lib/bot';

export const runtime = 'nodejs';

function unauthorized() {
  return NextResponse.json({ success: false, error: 'Admin login required.' }, { status: 401 });
}

function adminClient(request: Request) {
  const cookie = request.headers.get('cookie');
  const auth = request.headers.get('authorization');
  if (!isValidAdminSession(cookie, auth)) return null;
  if (!isSupabaseConfigured) return null;
  return getAdminSupabase();
}

export async function GET(request: Request) {
  const db = adminClient(request);
  if (!db) return unauthorized();
  const resource = new URL(request.url).searchParams.get('resource');

  if (resource === 'orders') {
    const { data, error } = await db.from('orders').select('*, order_items(*), telegram_users(*)').order('created_at', { ascending: false });
    return NextResponse.json({ data: data || [], error: error?.message || null }, { status: error ? 500 : 200 });
  }
  if (resource === 'credentials') {
    const { data, error } = await db.from('admin_settings').select('admin_username, admin_password_hash').eq('id', 1).single();
    return NextResponse.json({ data, error: error?.message || null }, { status: error ? 500 : 200 });
  }
  if (resource === 'visitors') {
    const { data, error } = await db.from('telegram_users').select('*').order('last_active_at', { ascending: false });
    return NextResponse.json({ data: data || [], error: error?.message || null }, { status: error ? 500 : 200 });
  }
  return NextResponse.json({ error: 'Unknown resource.' }, { status: 400 });
}

export async function POST(request: Request) {
  const db = adminClient(request);
  if (!db) return unauthorized();
  try {
    const { action, payload } = await request.json();
    let error: { message: string } | null = null;

    if (action === 'save-products') {
      ({ error } = await db.from('products').upsert(payload));
    } else if (action === 'delete-product') {
      ({ error } = await db.from('products').delete().eq('id', payload.id));
    } else if (action === 'save-categories') {
      ({ error } = await db.from('categories').upsert(payload, { onConflict: 'name' }));
    } else if (action === 'delete-category') {
      ({ error } = await db.from('categories').delete().eq('name', payload.name));
    } else if (action === 'save-payment-methods') {
      ({ error } = await db.from('payment_methods').upsert(payload));
    } else if (action === 'save-credentials') {
      ({ error } = await db.from('admin_settings').upsert(payload));
    } else if (action === 'update-order-status') {
      const { orderId, status } = payload || {};
      if (!orderId || !status) {
        return NextResponse.json({ success: false, error: 'orderId and status are required.' }, { status: 400 });
      }

      // 1. Update status and timestamp in Supabase orders table
      const updatePayload = {
        status: String(status),
        updated_at: new Date().toISOString()
      };

      const { error: updateErr, data: updatedRows } = await db
        .from('orders')
        .update(updatePayload)
        .eq('order_id', orderId)
        .select('*, telegram_users(*)');

      if (updateErr) {
        console.error('Error updating order in database:', updateErr);
        return NextResponse.json({ success: false, error: updateErr.message }, { status: 500 });
      }

      // 2. Fetch order details to ensure we have customer info
      let orderRow = updatedRows && updatedRows[0] ? updatedRows[0] : null;
      if (!orderRow) {
        const { data: fallbackRow } = await db
          .from('orders')
          .select('*, telegram_users(*)')
          .eq('order_id', orderId)
          .maybeSingle();
        orderRow = fallbackRow;
      }

      let customer: { telegramId?: number; first_name?: string; username?: string } | null = null;
      let deliveryEmail: string | undefined = orderRow?.delivery_email || payload.deliveryEmail || undefined;

      const tgUserId = orderRow?.telegram_user_id || payload.telegramUser?.id;
      if (tgUserId && Number(tgUserId) !== 987654321) {
        let firstName = payload.telegramUser?.first_name || 'Customer';
        let username = payload.telegramUser?.username || undefined;

        try {
          const { data: tgUser } = await db
            .from('telegram_users')
            .select('telegram_id, first_name, username')
            .eq('telegram_id', tgUserId)
            .maybeSingle();
          if (tgUser) {
            if (tgUser.first_name) firstName = tgUser.first_name;
            if (tgUser.username) username = tgUser.username;
          }
        } catch (tgErr) {
          console.warn('Could not query telegram_users table:', tgErr);
        }

        customer = {
          telegramId: Number(tgUserId),
          first_name: firstName,
          username
        };
      } else if (payload.telegramUser) {
        customer = {
          telegramId: payload.telegramUser.id ? Number(payload.telegramUser.id) : undefined,
          first_name: payload.telegramUser.first_name,
          username: payload.telegramUser.username
        };
      }

      const extraDetails = {
        total: orderRow?.total ? Number(orderRow.total) : payload.total ? Number(payload.total) : undefined
      };

      // 3. Dispatch Telegram notifications (Customer DM + Admin alert)
      await sendTelegramOrderStatusUpdate(
        String(orderId),
        String(status),
        customer,
        deliveryEmail,
        extraDetails
      );

      return NextResponse.json({ success: true, orderId, status });
    } else if (action === 'clear-orders') {
      ({ error } = await db.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000'));
    } else if (action === 'clear-visitors') {
      ({ error } = await db.from('telegram_users').delete().neq('telegram_id', 0));
    } else {
      return NextResponse.json({ success: false, error: 'Unknown action.' }, { status: 400 });
    }

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid admin request.' }, { status: 400 });
  }
}
