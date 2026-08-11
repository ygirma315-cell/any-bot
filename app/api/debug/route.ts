import { NextResponse } from 'next/server';
import { isSupabaseConfigured, getAdminSupabase } from '@/lib/supabase';

export async function GET() {
  const dbClient = getAdminSupabase();
  let dbStatus = 'Not Configured';
  let ordersCount = null;
  let dbError = null;

  if (isSupabaseConfigured && dbClient) {
    try {
      const { count, error } = await dbClient.from('orders').select('*', { count: 'exact', head: true });
      if (error) {
        dbStatus = 'Error';
        dbError = error.message;
      } else {
        dbStatus = 'Connected Successfully!';
        ordersCount = count;
      }
    } catch (e: any) {
      dbStatus = 'Exception';
      dbError = e.message;
    }
  }

  return NextResponse.json({
    isSupabaseConfigured,
    hasUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    hasAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    hasServiceKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    dbStatus,
    ordersCount,
    dbError
  });
}
