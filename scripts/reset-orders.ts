import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const getVar = (key: string): string => {
  const line = envContent.split('\n').find(l => l.startsWith(key));
  return line ? line.split('=').slice(1).join('=').trim() : '';
};

async function main() {
  const url = getVar('NEXT_PUBLIC_SUPABASE_URL');
  const key = getVar('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) {
    console.error('.env.local missing Supabase credentials');
    process.exit(1);
  }

  const db = createClient(url, key);

  const before = await db.from('orders').select('*', { count: 'exact', head: true });
  console.log('Orders before reset:', before.count);

  const itemsDelete = await db.from('order_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (itemsDelete.error) console.error('order_items delete error:', itemsDelete.error);

  const ordersDelete = await db.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (ordersDelete.error) console.error('orders delete error:', ordersDelete.error);

  const after = await db.from('orders').select('*', { count: 'exact', head: true });
  console.log('Orders after reset:', after.count);
  console.log('Done. Next order will be #ORD-001.');
}

main().catch(err => {
  console.error('Reset failed:', err);
  process.exit(1);
});