import { NextResponse } from 'next/server';
import { isSupabaseConfigured, getAdminSupabase } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function GET() {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ ok: false, reason: 'not_configured' });
  }
  try {
    const db = getAdminSupabase();
    if (!db) {
      return NextResponse.json({ ok: false, reason: 'not_configured' });
    }
    const { error } = await db.from('orders').select('id', { count: 'exact', head: true });
    if (error) {
      return NextResponse.json({ ok: false, reason: 'db_error', error: error.message });
    }
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    return NextResponse.json({ ok: false, reason: 'db_error', error: err instanceof Error ? err.message : 'unknown' });
  }
}
