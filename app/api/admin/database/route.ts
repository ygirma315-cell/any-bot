import { NextResponse } from 'next/server';
import { isValidAdminSession } from '@/lib/admin-session';
import { getAdminSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { sendTelegramOrderStatusUpdate } from '@/lib/bot';

export const runtime = 'nodejs';

function unauthorized() {
  return NextResponse.json({ success: false, error: 'Admin login required.' }, { status: 401 });
}

function adminClient(request: Request) {
  if (!isValidAdminSession(request.headers.get('cookie'))) return null;
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
      ({ error } = await db.from('orders').update({ status: payload.status }).eq('order_id', payload.orderId));
      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
      const { data: customer } = await db
        .from('orders')
        .select('telegram_users(telegram_id, first_name)')
        .eq('order_id', payload.orderId)
        .maybeSingle();
      const telegramUser = customer?.telegram_users as unknown as { telegram_id?: number; first_name?: string } | null;
      await sendTelegramOrderStatusUpdate(
        String(payload.orderId),
        String(payload.status),
        telegramUser && telegramUser.telegram_id
          ? { telegramId: telegramUser.telegram_id, first_name: telegramUser.first_name }
          : null
      );
      return NextResponse.json({ success: true });
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
