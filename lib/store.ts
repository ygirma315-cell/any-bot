import { Product, PRODUCTS } from '@/config/products';
import { PAYMENT_METHODS, PaymentMethod } from '@/config/payments';
import { OrderPayload } from '@/lib/bot';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

const LEGACY_LOCAL_STORAGE_KEYS = [
  'buy_ai_store_orders',
  'buy_ai_store_visitors',
  'buy_ai_store_products',
  'buy_ai_store_categories',
  'buy_ai_store_payments'
];
const ADMIN_PASSWORD_KEY = 'buy_ai_store_admin_password';

let sessionOrders: OrderPayload[] = [];
let cachedProducts: Product[] | null = null;
let cachedCategories: string[] | null = null;
let cachedPaymentMethods: PaymentMethod[] | null = null;
let sessionVisitors: VisitorRecord[] = [];

// Removes ALL lingering website data (old orders, payment pendings, caches)
// from the visitor's browser storage. Data now lives only in the database.
export function clearLegacyLocalStorage(): void {
  if (typeof window === 'undefined') return;
  LEGACY_LOCAL_STORAGE_KEYS.forEach(key => {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore storage errors
    }
  });
}

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
  if (cachedProducts) return cachedProducts;
  return PRODUCTS;
}

export function saveStoredProducts(products: Product[], syncRemote = true): void {
  cachedProducts = products;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('ai_store_products_updated'));
  }

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
  if (cachedCategories) return cachedCategories;
  return DEFAULT_CATEGORIES;
}

export function saveStoredCategories(categories: string[], syncRemote = true): void {
  cachedCategories = categories;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('ai_store_categories_updated'));
  }

  const records = categories.filter(c => c !== 'All').map((name, index) => ({ name, sort_order: index }));
  if (syncRemote) syncAdminDatabase('save-categories', records);
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
  if (cachedPaymentMethods) return cachedPaymentMethods;
  return PAYMENT_METHODS.filter(m => m.id !== 'cbe' && m.id !== 'bank-transfer');
}

export function saveStoredPaymentMethods(methods: PaymentMethod[], syncRemote = true): void {
  cachedPaymentMethods = methods;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('ai_store_payments_updated'));
  }

  const records = methods.map((m, index) => ({
    id: m.id, name: m.name, subtitle: m.subtitle, badge: m.badge,
    logo_path: m.logoPath, color: m.color, account_id: m.accountId,
    account_name: m.accountName, network: m.network,
    instructions: m.instructions, sort_order: index
  }));
  if (syncRemote) syncAdminDatabase('save-payment-methods', records);
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
// Orders NEVER touch localStorage. They live in the database only, and this
// in-memory session list is used for the current browser session (updates
// instantly after submit, disappears on reload - no phantom order data).
export function getStoredOrders(): OrderPayload[] {
  return sessionOrders;
}

export function saveStoredOrders(orders: OrderPayload[]): void {
  sessionOrders = orders;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('ai_store_orders_updated'));
  }
}

export function mapOrdersFromDb(rows: any[]): OrderPayload[] {
  return rows.map((o: any) => {
    const userObj = o.telegram_users && typeof o.telegram_users === 'object' ? o.telegram_users : {};
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
      return [];
    }

    const mapped = mapOrdersFromDb(data);

    saveStoredOrders(mapped);
    return mapped;
  } catch (err) {
    console.error('Error fetching orders from Supabase:', err);
    return getStoredOrders();
  }
}

// Sequential order IDs (#ORD-001, #ORD-002, ...) are assigned by the server
// (/api/orders) based on the real order_number sequence in the database.

export function addOrder(order: OrderPayload): void {
  const existingIndex = sessionOrders.findIndex(o => o.orderId === order.orderId);
  if (existingIndex >= 0) {
    sessionOrders[existingIndex] = order;
  } else {
    sessionOrders = [order, ...sessionOrders];
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('ai_store_orders_updated'));
  }
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
  return sessionVisitors;
}

export function recordVisitor(user: { id: number; username?: string; first_name: string; last_name?: string }, hasOrdered = false): void {
  if (typeof window === 'undefined') return;
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
  sessionVisitors = updated;
  window.dispatchEvent(new Event('ai_store_visitors_updated'));

  void fetch('/api/visitors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user, hasOrdered })
  }).catch(err => console.error('Visitor sync error:', err));
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
  sessionOrders = sessionOrders.map(order => {
    if (order.orderId === orderId) {
      return { ...order, status };
    }
    return order;
  });
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('ai_store_orders_updated'));
  }

  syncAdminDatabase('update-order-status', { orderId, status });
}

export function clearAllOrders(): void {
  if (typeof window === 'undefined') return;
  sessionOrders = [];
  window.dispatchEvent(new Event('ai_store_orders_updated'));

  syncAdminDatabase('clear-orders', {});
}

export function clearAllVisitors(): void {
  if (typeof window === 'undefined') return;
  sessionVisitors = [];
  window.dispatchEvent(new Event('ai_store_visitors_updated'));

  syncAdminDatabase('clear-visitors', {});
}

export function clearAllStoreHistory(): void {
  clearAllOrders();
  clearAllVisitors();
}
