import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Read .env.local manually
const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

let url = '';
let key = '';

envContent.split('\n').forEach(line => {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
    url = line.split('=')[1].trim();
  }
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
    key = line.split('=')[1].trim();
  }
});

console.log('\n--- 🔍 SUPABASE CONNECTION TEST ---');
console.log('Project URL:', url);
console.log('Key Status:', key ? 'Key Configured (Length: ' + key.length + ')' : 'Missing');

if (!key || key.includes('your_supabase_anon_key')) {
  console.error('\n❌ ERROR: Key is missing in .env.local');
  process.exit(1);
}

const supabase = createClient(url, key);

async function testConnection() {
  try {
    const { data: products, error: prodErr } = await supabase.from('products').select('id, name, price');
    
    if (prodErr) {
      console.log('\n⚠️ Connected to Supabase URL, but database tables are not created yet in Supabase!');
      console.log('Error details:', prodErr.message);
      console.log('👉 Make sure you ran scripts/schema.sql in Supabase SQL Editor.\n');
    } else {
      console.log('\n🎉 SUCCESS! SUPABASE IS FULLY CONNECTED & HEALTHY!');
      console.log(`📦 Found ${products?.length || 0} products in database:`);
      products?.slice(0, 5).forEach((p: any) => console.log(`   • ${p.name} ($${p.price})`));
      console.log('\nYour application is ready to run live with Supabase!\n');
    }
  } catch (err: any) {
    console.error('\n❌ Connection Failed:', err.message);
  }
}

testConnection();
