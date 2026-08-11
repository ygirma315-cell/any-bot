import { Product, PRODUCTS } from '@/config/products';
import { PAYMENT_METHODS, PaymentMethod } from '@/config/payments';
import { OrderPayload } from '@/lib/bot';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

const PRODUCTS_KEY = 'buy_ai_store_products';
const CATEGORIES_KEY = 'buy_ai_store_categories';
const PAYMENTS_KEY = 'buy_ai_store_payments';
const ORDERS_KEY = 'buy_ai_store_orders';
const VISITORS_KEY = 'buy_ai_store_visitors';
const ADMIN_PASSWORD_KEY = 'buy_ai_store_admin_password';

export function syncAdminDatabase(action: string, payload: unknown): void {
  if (typeof window === 'undefined') return;
  void fetch('/api/admin/database', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, payload })
  }).then(async response => {
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error || 'Admin database update failed.');
    }
  }).catch(error => console.error('Admin database sync error:', error));
}

export const DEFAULT_CATEGORIES = [
  'All',
  'AI Assistants',
  'AI Search & Knowledge',
  'AI Design & Video',
  'Media & Streaming'
];

// --- PRODUCTS ---
export function getStoredProducts(): Product[] {
  if (typeof window === 'undefined') return PRODUCTS;
  try {
    const raw = localStorage.getItem(PRODUCTS_KEY);
    if (!raw) {
      localStorage.setItem(PRODUCTS_KEY, JSON.stringify(PRODUCTS));
      return PRODUCTS;
    }
    return JSON.parse(raw);
  } catch {
    return PRODUCTS;
  }
}

export function saveStoredProducts(products: Product[], syncRemote = true): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
    window.dispatchEvent(new Event('ai_store_products_updated'));
    
    const records = products.map(p => ({
      id: p.id,
      name: p.name,
      short_description: p.shortDescription,
      full_description: p.fullDescription,
      price: p.price,
      currency: p.currency,
      warranty: p.warranty,
      warranty_days: p.warrantyDays,
      is_warranty: p.isWarranty,
      available: p.available,
      stock: p.stock,
      category: p.category,
      logo_path: p.logoPath,
      accent_color: p.accentColor,
      features: p.features
    }));
    if (syncRemote) syncAdminDatabase('save-products', records);
  } catch (e) {
    console.error('Error saving products:', e);
  }
}

export async function fetchProductsFromSupabase(): Promise<Product[]> {
  if (!isSupabaseConfigured || !supabase) return getStoredProducts();
  try {
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: true });
    if (error || !data || data.length === 0) return getStoredProducts();

    const mapped: Product[] = data.map((p: any) => ({
      id: p.id,
      name: p.name,
      shortDescription: p.short_description || '',
      fullDescription: p.full_description || '',
      price: Number(p.price) || 0,
      currency: p.currency || '$',
      warranty: p.warranty || '',
      warrantyDays: p.warranty_days || 0,
      isWarranty: p.is_warranty !== false,
      available: p.available !== false,
      stock: p.stock || 0,
      category: p.category || 'General',
      logoPath: p.logo_path || '/assets/products/chatgpt.png',
      accentColor: p.accent_color || 'rgba(16, 163, 127, 0.4)',
      features: Array.isArray(p.features) ? p.features : []
    }));

    saveStoredProducts(mapped, false);
    return mapped;
  } catch (err) {
    console.error('Error fetching products from Supabase:', err);
    return getStoredProducts();
  }
}

// --- CATEGORIES ---
export function getStoredCategories(): string[] {
  if (typeof window === 'undefined') return DEFAULT_CATEGORIES;
  try {
    const raw = localStorage.getItem(CATEGORIES_KEY);
    if (!raw) {
      localStorage.setItem(CATEGORIES_KEY, JSON.stringify(DEFAULT_CATEGORIES));
      return DEFAULT_CATEGORIES;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_CATEGORIES;
  }
}

export function saveStoredCategories(categories: string[], syncRemote = true): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
    window.dispatchEvent(new Event('ai_store_categories_updated'));

    const records = categories.filter(c => c !== 'All').map((name, index) => ({ name, sort_order: index }));
    if (syncRemote) syncAdminDatabase('save-categories', records);
  } catch (e) {
    console.error('Error saving categories:', e);
  }
}

export async function fetchCategoriesFromSupabase(): Promise<string[]> {
  if (!isSupabaseConfigured || !supabase) return getStoredCategories();
  try {
    const { data, error } = await supabase.from('categories').select('name').order('sort_order', { ascending: true });
    if (error || !data || data.length === 0) return getStoredCategories();

    const categoryNames = ['All', ...data.map((c: any) => c.name)];
    const uniqueNames = Array.from(new Set(categoryNames));
    saveStoredCategories(uniqueNames, false);
    return uniqueNames;
  } catch (err) {
    console.error('Error fetching categories from Supabase:', err);
    return getStoredCategories();
  }
}

// --- PAYMENT METHODS ---
export function getStoredPaymentMethods(): PaymentMethod[] {
  if (typeof window === 'undefined') return PAYMENT_METHODS;
  try {
    const raw = localStorage.getItem(PAYMENTS_KEY);
    if (!raw) {
      localStorage.setItem(PAYMENTS_KEY, JSON.stringify(PAYMENT_METHODS));
      return PAYMENT_METHODS;
    }
    const parsed: PaymentMethod[] = JSON.parse(raw);
    const filtered = parsed.filter(m => m.id !== 'cbe' && m.id !== 'bank-transfer');
    if (filtered.length !== parsed.length) {
      localStorage.setItem(PAYMENTS_KEY, JSON.stringify(filtered));
    }
    return filtered;
  } catch {
    return PAYMENT_METHODS;
  }
}

export function saveStoredPaymentMethods(methods: PaymentMethod[], syncRemote = true): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PAYMENTS_KEY, JSON.stringify(methods));
    window.dispatchEvent(new Event('ai_store_payments_updated'));

    const records = methods.map((m, index) => ({
      id: m.id, name: m.name, subtitle: m.subtitle, badge: m.badge,
      logo_path: m.logoPath, color: m.color, account_id: m.accountId,
      account_name: m.accountName, network: m.network,
      instructions: m.instructions, sort_order: index
    }));
    if (syncRemote) syncAdminDatabase('save-payment-methods', records);
  } catch (e) {
    console.error('Error saving payment methods:', e);
  }
}

export async function fetchPaymentMethodsFromSupabase(): Promise<PaymentMethod[]> {
  if (!isSupabaseConfigured || !supabase) return getStoredPaymentMethods();
  try {
    const { data, error } = await supabase.from('payment_methods').select('*').order('sort_order', { ascending: true });
    if (error || !data || data.length === 0) return getStoredPaymentMethods();

    const mapped: PaymentMethod[] = data.map((m: any) => ({
      id: m.id,
      name: m.name,
      subtitle: m.subtitle || '',
      badge: m.badge || '',
      logoPath: m.logo_path || '/assets/payments/binance.png',
      color: m.color || 'rgba(240, 185, 11, 0.25)',
      accountId: m.account_id || '',
      accountName: m.account_name || '',
      network: m.network || '',
      instructions: Array.isArray(m.instructions) ? m.instructions : []
    }));

    saveStoredPaymentMethods(mapped, false);
    return mapped;
  } catch (err) {
    console.error('Error fetching payment methods from Supabase:', err);
    return getStoredPaymentMethods();
  }
}

// --- ORDERS ---
export function getStoredOrders(): OrderPayload[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    if (!raw) return [];
    const parsed: OrderPayload[] = JSON.parse(raw);
    // Purge any old legacy orders (like ORD-20260810-2217 or long IDs)
    const clean = parsed.filter(o => {
      if (!o || typeof o.orderId !== 'string') return false;
      if (o.orderId.includes('2026') || o.orderId.length > 12) return false;
      return o.orderId.startsWith('#ORD-');
    });
    if (clean.length !== parsed.length) {
      localStorage.setItem(ORDERS_KEY, JSON.stringify(clean));
    }
    return clean;
  } catch {
    return [];
  }
}

export function saveStoredOrders(orders: OrderPayload[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    window.dispatchEvent(new Event('ai_store_orders_updated'));
  } catch (e) {
    console.error('Error saving orders:', e);
  }
}

export async function fetchOrdersFromSupabase(): Promise<OrderPayload[]> {
  if (!isSupabaseConfigured || !supabase) return getStoredOrders();
  try {
    const response = await fetch('/api/admin/database?resource=orders');
    if (!response.ok) {
      return getStoredOrders();
    }
    const { data } = await response.json();

    if (!data || data.length === 0) {
      if (typeof window !== 'undefined') {
        localStorage.setItem(ORDERS_KEY, JSON.stringify([]));
      }
      return [];
    }

    const mapped: OrderPayload[] = data.map((o: any) => {
      const userObj = o.telegram_users || {};
      return {
        orderId: o.order_id || `#${o.order_number || 1}`,
        deliveryEmail: o.delivery_email || undefined,
        telegramUser: {
          id: o.telegram_user_id || 987654321,
          username: userObj.username || 'customer',
          first_name: userObj.first_name || 'Customer',
          last_name: userObj.last_name || ''
        },
        items: (o.order_items || []).map((item: any) => ({
          id: item.product_id || '',
          name: item.product_name || 'AI Product',
          price: Number(item.price) || 0,
          quantity: item.quantity || 1,
          warranty: item.warranty || 'Warranty Included'
        })),
        subtotal: Number(o.subtotal) || 0,
        total: Number(o.total) || 0,
        paymentMethod: typeof o.payment_method === 'object' && o.payment_method ? o.payment_method : {
          id: 'cbe',
          name: 'Payment',
          accountName: 'AI Store',
          accountId: '1000'
        },
        timestamp: new Date(o.created_at).toLocaleString('en-US', { timeZone: 'UTC', dateStyle: 'medium', timeStyle: 'short' }) + ' UTC',
        status: o.status || 'Pending'
      };
    });

    saveStoredOrders(mapped);
    return mapped;
  } catch (err) {
    console.error('Error fetching orders from Supabase:', err);
    return getStoredOrders();
  }
}

// Clean Sequential Order ID Generator (#ORD-001, #ORD-002, #ORD-003...)
export async function generateSequentialOrderId(): Promise<string> {
  let nextNum = 1;

  if (isSupabaseConfigured && supabase) {
    try {
      const { count, error } = await supabase.from('orders').select('*', { count: 'exact', head: true });
      if (!error && typeof count === 'number') {
        nextNum = count + 1;
      }
    } catch {
      const local = getStoredOrders();
      nextNum = local.length + 1;
    }
  } else {
    const local = getStoredOrders();
    nextNum = local.length + 1;
  }

  const padded = String(nextNum).padStart(3, '0');
  return `#ORD-${padded}`;
}

export function addOrder(order: OrderPayload): void {
  const currentOrders = getStoredOrders();
  const existingIndex = currentOrders.findIndex(o => o.orderId === order.orderId);
  let updated: OrderPayload[];
  if (existingIndex >= 0) {
    updated = [...currentOrders];
    updated[existingIndex] = order;
  } else {
    updated = [order, ...currentOrders];
  }
  saveStoredOrders(updated);
}

// --- VISITORS ---
export interface VisitorRecord {
  telegramId: number;
  username?: string;
  first_name: string;
  last_name?: string;
  lastActive: string;
  hasOrdered: boolean;
}

export function getStoredVisitors(): VisitorRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(VISITORS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function recordVisitor(user: { id: number; username?: string; first_name: string; last_name?: string }, hasOrdered = false): void {
  if (typeof window === 'undefined') return;
  try {
    const visitors = getStoredVisitors();
    const existingIndex = visitors.findIndex(v => v.telegramId === user.id);
    const now = new Date().toISOString();

    let updated: VisitorRecord[];
    if (existingIndex >= 0) {
      updated = [...visitors];
      updated[existingIndex] = {
        ...updated[existingIndex],
        username: user.username || updated[existingIndex].username,
        first_name: user.first_name || updated[existingIndex].first_name,
        last_name: user.last_name || updated[existingIndex].last_name,
        lastActive: now,
        hasOrdered: hasOrdered || updated[existingIndex].hasOrdered
      };
    } else {
      updated = [
        {
          telegramId: user.id,
          username: user.username,
          first_name: user.first_name,
          last_name: user.last_name,
          lastActive: now,
          hasOrdered
        },
        ...visitors
      ];
    }

    localStorage.setItem(VISITORS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('ai_store_visitors_updated'));

    if (isSupabaseConfigured && supabase) {
      Promise.resolve(supabase.from('telegram_users').upsert({
        telegram_id: user.id,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        has_ordered: hasOrdered,
        last_active_at: now
      })).catch((err: unknown) => console.error('Supabase visitor sync error:', err));
    }
  } catch (e) {
    console.error('Error recording visitor:', e);
  }
}

export function getOnlineUsers24hCount(): number {
  const visitors = getStoredVisitors();
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return visitors.filter(v => new Date(v.lastActive) >= cutoff).length;
}

// --- ADMIN SETTINGS ---
export function getStoredAdminCredentials(): { username: string; password: string } {
  if (typeof window === 'undefined') return { username: 'admin', password: 'admin123' };
  try {
    const username = localStorage.getItem('buy_ai_store_admin_username') || 'admin';
    const password = localStorage.getItem(ADMIN_PASSWORD_KEY) || 'admin123';
    return { username, password };
  } catch {
    return { username: 'admin', password: 'admin123' };
  }
}

export function getStoredAdminPassword(): string {
  return getStoredAdminCredentials().password;
}

export function saveStoredAdminCredentials(username: string, password: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('buy_ai_store_admin_username', username);
    localStorage.setItem(ADMIN_PASSWORD_KEY, password);
    window.dispatchEvent(new Event('ai_store_admin_password_updated'));

    syncAdminDatabase('save-credentials', {
      id: 1, admin_username: username, admin_password_hash: password,
      updated_at: new Date().toISOString()
    });
  } catch (e) {
    console.error('Error saving admin credentials:', e);
  }
}

export function saveStoredAdminPassword(password: string): void {
  const { username } = getStoredAdminCredentials();
  saveStoredAdminCredentials(username, password);
}

export async function fetchAdminCredentialsFromSupabase(): Promise<{ username: string; password: string }> {
  if (!isSupabaseConfigured) return getStoredAdminCredentials();
  try {
    const response = await fetch('/api/admin/database?resource=credentials');
    if (!response.ok) return getStoredAdminCredentials();
    const { data } = await response.json();
    if (data) {
      const username = data.admin_username || 'admin';
      const password = data.admin_password_hash || 'admin123';
      if (typeof window !== 'undefined') {
        localStorage.setItem('buy_ai_store_admin_username', username);
        localStorage.setItem(ADMIN_PASSWORD_KEY, password);
      }
      return { username, password };
    }
  } catch (err) {
    console.error('Error fetching admin credentials from Supabase:', err);
  }
  return getStoredAdminCredentials();
}

export async function fetchAdminPasswordFromSupabase(): Promise<string> {
  const creds = await fetchAdminCredentialsFromSupabase();
  return creds.password;
}

export function updateOrderStatus(orderId: string, status: OrderPayload['status']): void {
  const currentOrders = getStoredOrders();
  const updated = currentOrders.map(order => {
    if (order.orderId === orderId) {
      return { ...order, status };
    }
    return order;
  });
  saveStoredOrders(updated);

  syncAdminDatabase('update-order-status', { orderId, status });
}

export function clearAllOrders(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(ORDERS_KEY);
    window.dispatchEvent(new Event('ai_store_orders_updated'));

    syncAdminDatabase('clear-orders', {});
  } catch (e) {
    console.error('Error clearing orders:', e);
  }
}

export function clearAllVisitors(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(VISITORS_KEY);
    window.dispatchEvent(new Event('ai_store_visitors_updated'));

    syncAdminDatabase('clear-visitors', {});
  } catch (e) {
    console.error('Error clearing visitors:', e);
  }
}

export function clearAllStoreHistory(): void {
  clearAllOrders();
  clearAllVisitors();
}
