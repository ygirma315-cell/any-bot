import { NextResponse } from 'next/server';
import { getAdminSupabase, isSupabaseConfigured } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { user, hasOrdered = false, isWebVisitor = false, email } = await request.json();
    if (!user && !email) {
      return NextResponse.json({ success: false, error: 'Invalid visitor payload.' }, { status: 400 });
    }

    const db = getAdminSupabase();
    if (!isSupabaseConfigured || !db) {
      return NextResponse.json({ success: false, error: 'Database is not configured.' }, { status: 503 });
    }

    // Determine visitor ID: if valid Telegram ID, use it; otherwise generate/use a stable numeric identifier for web visitor
    let tgId = user?.id;
    if (!tgId || !Number.isSafeInteger(tgId) || tgId === 987654321) {
      // If web visitor with an email, generate a deterministic hash from email, otherwise use provided id or random 9-digit ID
      if (email) {
        let hash = 0;
        for (let i = 0; i < email.length; i++) {
          hash = ((hash << 5) - hash) + email.charCodeAt(i);
          hash |= 0;
        }
        tgId = Math.abs(hash) + 8000000000;
      } else {
        tgId = user?.id && user.id > 1000 ? user.id : 9000000001;
      }
    }

    const { data: existing } = await db
      .from('telegram_users')
      .select('has_ordered')
      .eq('telegram_id', tgId)
      .maybeSingle();
    const finalHasOrdered = Boolean(hasOrdered) || Boolean(existing?.has_ordered);

    const firstName = user?.first_name || (email ? email.split('@')[0] : 'Web Visitor');
    const username = user?.username && user.username !== 'demo_customer' && user.username !== 'customer' ? user.username : null;

    const { error } = await db.from('telegram_users').upsert({
      telegram_id: tgId,
      username: username,
      first_name: firstName,
      last_name: user?.last_name || null,
      has_ordered: finalHasOrdered,
      last_active_at: new Date().toISOString()
    }, { onConflict: 'telegram_id' });

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, id: tgId });
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid visitor request.' }, { status: 400 });
  }
}
