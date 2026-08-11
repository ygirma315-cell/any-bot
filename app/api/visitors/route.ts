import { NextResponse } from 'next/server';
import { getAdminSupabase, isSupabaseConfigured } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { user, hasOrdered = false } = await request.json();
    if (!user || !Number.isSafeInteger(user.id) || !user.first_name) {
      return NextResponse.json({ success: false, error: 'Invalid visitor.' }, { status: 400 });
    }
    const db = getAdminSupabase();
    if (!isSupabaseConfigured || !db) {
      return NextResponse.json({ success: false, error: 'Database is not configured.' }, { status: 503 });
    }
    const { error } = await db.from('telegram_users').upsert({
      telegram_id: user.id,
      username: user.username || null,
      first_name: user.first_name,
      last_name: user.last_name || null,
      has_ordered: Boolean(hasOrdered),
      last_active_at: new Date().toISOString()
    }, { onConflict: 'telegram_id' });
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid visitor request.' }, { status: 400 });
  }
}
