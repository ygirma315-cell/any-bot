import { NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE, createAdminSession, passwordsMatch } from '@/lib/admin-session';
import { getAdminSupabase, isSupabaseConfigured } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();
    const db = getAdminSupabase();
    if (!isSupabaseConfigured || !db) {
      return NextResponse.json({ success: false, error: 'Database is not configured.' }, { status: 503 });
    }

    const { data, error } = await db
      .from('admin_settings')
      .select('admin_username, admin_password_hash')
      .eq('id', 1)
      .single();
    if (error || !data || String(username || '').trim().toLowerCase() !== data.admin_username.trim().toLowerCase() || !passwordsMatch(String(password || ''), data.admin_password_hash)) {
      return NextResponse.json({ success: false, error: 'Invalid username or password.' }, { status: 401 });
    }

    const session = createAdminSession();
    if (!session) return NextResponse.json({ success: false, error: 'Server session is not configured.' }, { status: 503 });
    const response = NextResponse.json({ success: true, token: session });
    const isHttps = request.url.startsWith('https://') || (process.env.NODE_ENV === 'production' && !request.url.includes('localhost'));
    response.cookies.set(ADMIN_SESSION_COOKIE, session, {
      httpOnly: true,
      secure: isHttps,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 8
    });
    return response;
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid login request.' }, { status: 400 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
  return response;
}
