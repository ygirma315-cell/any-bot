import { NextResponse } from 'next/server';
import { isValidAdminSession } from '@/lib/admin-session';
import { getAdminSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { sendTelegramOrderStatusUpdate } from '@/lib/bot';
import { sendDeliveryEmail, DeliveryItemCredential } from '@/lib/email';

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
  if (resource === 'storage') {
    const { data, error } = await db.from('product_storage').select('*').order('created_at', { ascending: false });
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
    } else if (action === 'save-storage-items') {
      ({ error } = await db.from('product_storage').upsert(payload));
      // Auto-sync stock in products table from count of unused storage items
      const productIds = Array.from(new Set((Array.isArray(payload) ? payload : [payload]).map(p => p.product_id).filter(Boolean)));
      for (const pId of productIds) {
        const { count } = await db.from('product_storage').select('id', { count: 'exact', head: true }).eq('product_id', pId).eq('is_used', false);
        await db.from('products').update({ stock: count || 0, available: (count || 0) > 0 }).eq('id', pId);
      }
    } else if (action === 'delete-storage-item') {
      const { data: itemData } = await db.from('product_storage').select('product_id').eq('id', payload.id).maybeSingle();
      ({ error } = await db.from('product_storage').delete().eq('id', payload.id));
      if (itemData?.product_id) {
        const { count } = await db.from('product_storage').select('id', { count: 'exact', head: true }).eq('product_id', itemData.product_id).eq('is_used', false);
        await db.from('products').update({ stock: count || 0, available: (count || 0) > 0 }).eq('id', itemData.product_id);
      }
    } else if (action === 'update-order-status') {
      const { orderId, status } = payload || {};
      if (!orderId || !status) {
        return NextResponse.json({ success: false, error: 'orderId and status are required.' }, { status: 400 });
      }

      const isAccepted = status === 'Accepted' || status === 'Completed' || status === 'Payment Confirmed';

      // 1. Fetch order details with order_items
      const { data: orderData } = await db
        .from('orders')
        .select('*, order_items(*), telegram_users(*)')
        .eq('order_id', orderId)
        .maybeSingle();

      const orderRow = orderData || null;
      let deliveryEmail: string | undefined = orderRow?.delivery_email || payload.deliveryEmail || undefined;
      const orderItems = orderRow?.order_items || payload.items || [];

      // 2. If Order is Approved / Accepted, automatically claim available credentials from product_storage
      const claimedCredentials: DeliveryItemCredential[] = [];

      if (isAccepted && Array.isArray(orderItems) && orderItems.length > 0) {
        try {
          for (const item of orderItems) {
            const prodId = item.product_id || item.id;
            const quantity = Number(item.quantity) || 1;
            const prodName = item.product_name || item.name || 'AI Digital Service';
            const warranty = item.warranty || 'Warranty Included';

            // Find available unused credentials in product_storage for this product
            const { data: availableCreds } = await db
              .from('product_storage')
              .select('*')
              .eq('product_id', prodId)
              .eq('is_used', false)
              .order('created_at', { ascending: true })
              .limit(quantity);

            if (availableCreds && availableCreds.length > 0) {
              const idsToClaim = availableCreds.map(c => c.id);
              await db
                .from('product_storage')
                .update({
                  is_used: true,
                  order_id: String(orderId),
                  used_at: new Date().toISOString()
                })
                .in('id', idsToClaim);

              for (const cred of availableCreds) {
                claimedCredentials.push({
                  productName: prodName,
                  price: Number(item.price) || undefined,
                  type: cred.type,
                  link: cred.link || undefined,
                  username: cred.username || undefined,
                  password: cred.password || undefined,
                  notes: cred.notes || undefined,
                  warranty
                });
              }
            } else {
              // Fallback default fulfillment entry if no storage stock was preloaded
              claimedCredentials.push({
                productName: prodName,
                price: Number(item.price) || undefined,
                type: 'text',
                notes: 'Your access has been activated by the admin. Check order support if needed.',
                warranty
              });
            }

            // Immediately decrement / update product stock in 'products' table
            const { count: remainingCount } = await db
              .from('product_storage')
              .select('id', { count: 'exact', head: true })
              .eq('product_id', prodId)
              .eq('is_used', false);
            
            await db
              .from('products')
              .update({
                stock: remainingCount || 0,
                available: (remainingCount || 0) > 0
              })
              .eq('id', prodId);
          }
        } catch (credErr) {
          console.error('Error claiming product credentials from storage:', credErr);
        }
      }

      // 3. Update status in Supabase orders table
      const updatePayload: Record<string, any> = {
        status: String(status),
        updated_at: new Date().toISOString()
      };
      if (claimedCredentials.length > 0) {
        updatePayload.delivered_credentials = claimedCredentials;
      }

      let { error: updateErr } = await db
        .from('orders')
        .update(updatePayload)
        .eq('order_id', orderId);

      if (updateErr && updatePayload.delivered_credentials) {
        console.warn('Retrying order status update without delivered_credentials column in case schema is not yet migrated:', updateErr);
        const { error: retryErr } = await db
          .from('orders')
          .update({
            status: String(status),
            updated_at: new Date().toISOString()
          })
          .eq('order_id', orderId);
        if (retryErr) {
          console.error('Error updating order status in Supabase:', retryErr);
        }
      }

      // 4. Resolve customer contact info
      let customer: { telegramId?: number; first_name?: string; username?: string } | null = null;
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
      } else if (payload.telegramUser && Number(payload.telegramUser.id) !== 987654321) {
        customer = {
          telegramId: payload.telegramUser.id ? Number(payload.telegramUser.id) : undefined,
          first_name: payload.telegramUser.first_name,
          username: payload.telegramUser.username
        };
      }

      const extraDetails = {
        total: orderRow?.total ? Number(orderRow.total) : payload.total ? Number(payload.total) : undefined,
        credentials: claimedCredentials.length > 0 ? claimedCredentials : undefined
      };

      // 5. Automated Delivery via Email (dispatched in background, non-blocking)
      if (isAccepted && deliveryEmail && deliveryEmail.includes('@') && claimedCredentials.length > 0) {
        sendDeliveryEmail({
          toEmail: deliveryEmail,
          customerName: customer?.first_name || 'Customer',
          orderId: String(orderId),
          items: claimedCredentials,
          totalAmount: extraDetails.total
        }).catch(emailErr => {
          console.error('[Background Email Dispatch Error]', emailErr);
        });
      }

      // 6. Automated Delivery via Telegram Bot DM (dispatched in background, non-blocking)
      sendTelegramOrderStatusUpdate(
        String(orderId),
        String(status),
        customer,
        deliveryEmail,
        extraDetails
      ).catch(tgErr => {
        console.error('[Background Telegram Dispatch Error]', tgErr);
      });

      return NextResponse.json({ 
        success: true, 
        orderId, 
        status, 
        deliveredCredentials: claimedCredentials 
      });
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
