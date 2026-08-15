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

export function getAdminAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (typeof window !== 'undefined') {
    const token = sessionStorage.getItem('ai_store_admin_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return headers;
}

export async function syncAdminDatabase(action: string, payload: unknown): Promise<{ success: boolean; error?: string }> {
  if (typeof window === 'undefined') return { success: false, error: 'Window undefined' };
  try {
    const headers = getAdminAuthHeaders();
    const response = await fetch('/api/admin/database', {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({ action, payload })
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error || `Admin database update failed with status ${response.status}`);
    }
    return { success: true };
  } catch (error: any) {
    console.error('Admin database sync error:', error);
    return { success: false, error: error.message || 'Database update failed' };
  }
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
  const base = cachedProducts || [...PRODUCTS];
  const storage = getStoredStorage();
  const synced = base.map(p => {
    const hasStorage = storage.some(s => s.product_id === p.id);
    if (hasStorage) {
      const unusedCount = storage.filter(s => s.product_id === p.id && !s.is_used).length;
      return { ...p, stock: unusedCount, available: unusedCount > 0 };
    }
    return p;
  });
  return synced.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
}

export function saveStoredProducts(products: Product[], syncRemote = true): void {
  cachedProducts = [...products].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
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
    features: p.features,
    sort_order: p.sortOrder || 0
  }));
  if (syncRemote) syncAdminDatabase('save-products', records);
}

export async function fetchProductsFromSupabase(): Promise<Product[]> {
  if (!isSupabaseConfigured || !supabase) return getStoredProducts();
  try {
    const { data, error } = await supabase.from('products').select('*').order('sort_order', { ascending: true });
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
      features: Array.isArray(p.features) ? p.features : [],
      sortOrder: Number(p.sort_order) || 0
    }));

    mapped.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
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
      status: o.status || 'Pending',
      deliveredCredentials: Array.isArray(o.delivered_credentials) ? o.delivered_credentials : []
    };
  });
}

export async function fetchOrdersFromSupabase(): Promise<OrderPayload[]> {
  if (!isSupabaseConfigured || !supabase) return getStoredOrders();
  try {
    const headers = getAdminAuthHeaders();
    const response = await fetch('/api/admin/database?resource=orders', {
      headers,
      credentials: 'include'
    });
    if (!response.ok) {
      // 401 means the admin session expired or was never established.
      // Return current session state instead of silently masking the error.
      console.warn('Admin orders fetch failed with status', response.status);
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

// --- STORAGE / DIGITAL CREDENTIALS INVENTORY ---
export interface ProductStorageItem {
  id: string;
  product_id: string;
  type: 'link' | 'account' | 'key' | 'text';
  link?: string;
  username?: string;
  password?: string;
  notes?: string;
  is_used: boolean;
  order_id?: string;
  used_at?: string;
  created_at?: string;
}

const DEFAULT_STORAGE_ITEMS: ProductStorageItem[] = [
  { id: 'demo-chatgpt', product_id: 'chatgpt-plus', type: 'account', link: 'https://chatgpt.com', username: 'demo.anyai@store.com', password: 'AnyAiPass2025!', notes: 'Log in at chatgpt.com with provided email and password. Do not modify account settings.', is_used: false },
  { id: 'demo-gemini', product_id: 'gemini-pro', type: 'account', link: 'https://gemini.google.com', username: 'demo.anyai@store.com', password: 'AnyAiPass2025!', notes: 'Access Google Gemini Advanced with full 1M context. Enjoy your AI tools!', is_used: false },
  { id: 'demo-claude', product_id: 'claude-pro', type: 'account', link: 'https://claude.ai', username: 'demo.anyai@store.com', password: 'AnyAiPass2025!', notes: 'Log in at claude.ai with provided credentials to access Claude 3.5 Sonnet & Artifacts.', is_used: false },
  { id: 'demo-perplexity', product_id: 'perplexity-pro', type: 'account', link: 'https://perplexity.ai', username: 'demo.anyai@store.com', password: 'AnyAiPass2025!', notes: 'Full Perplexity Pro AI Search with unlimited queries and model selection.', is_used: false },
  { id: 'demo-canva', product_id: 'canva-pro', type: 'account', link: 'https://canva.com', username: 'demo.anyai@store.com', password: 'AnyAiPass2025!', notes: 'Log in at canva.com to access full Magic Studio and Pro asset library.', is_used: false },
  { id: 'demo-capcut', product_id: 'capcut-pro', type: 'account', link: 'https://capcut.com', username: 'demo.anyai@store.com', password: 'AnyAiPass2025!', notes: 'Log in on CapCut PC or Mobile to unlock 4K export and Pro transitions.', is_used: false },
  { id: 'demo-copilot', product_id: 'copilot-pro', type: 'account', link: 'https://copilot.microsoft.com', username: 'demo.anyai@store.com', password: 'AnyAiPass2025!', notes: 'Microsoft Copilot Pro subscription active for Office & GPT-4 Turbo reasoning.', is_used: false },
  { id: 'demo-youtube', product_id: 'youtube-premium', type: 'account', link: 'https://youtube.com/premium', username: 'demo.anyai@store.com', password: 'AnyAiPass2025!', notes: 'Ad-free streaming, YouTube Music, and background playback active.', is_used: false },
  { id: 'demo-midjourney', product_id: 'midjourney-v6', type: 'account', link: 'https://midjourney.com', username: 'demo.anyai@store.com', password: 'AnyAiPass2025!', notes: 'Log in via Midjourney/Discord to generate photorealistic v6 art.', is_used: false },
  { id: 'demo-notion', product_id: 'notion-ai', type: 'account', link: 'https://notion.so', username: 'demo.anyai@store.com', password: 'AnyAiPass2025!', notes: 'Notion AI Workspace active. Enjoy automated AI document summarization.', is_used: false },
];

let sessionStorageItems: ProductStorageItem[] = [...DEFAULT_STORAGE_ITEMS];

export function getStoredStorage(): ProductStorageItem[] {
  return sessionStorageItems.length > 0 ? sessionStorageItems : DEFAULT_STORAGE_ITEMS;
}

export function saveStoredStorage(items: ProductStorageItem[], syncRemote = true): void {
  sessionStorageItems = [...items];
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('ai_store_storage_updated'));
  }
  if (syncRemote) {
    const payload = items.map(item => ({
      id: item.id,
      product_id: item.product_id,
      type: item.type,
      link: item.link || null,
      username: item.username || null,
      password: item.password || null,
      notes: item.notes || null,
      is_used: item.is_used,
      order_id: item.order_id || null,
      used_at: item.used_at || null
    }));
    syncAdminDatabase('save-storage-items', payload);
  }
}

export async function fetchStorageFromSupabase(): Promise<ProductStorageItem[]> {
  if (!isSupabaseConfigured) return getStoredStorage();
  try {
    const headers = getAdminAuthHeaders();
    const response = await fetch('/api/admin/database?resource=storage', {
      headers,
      credentials: 'include'
    });
    if (!response.ok) return getStoredStorage();
    const { data } = await response.json();
    if (!data) return [];
    const mapped: ProductStorageItem[] = data.map((item: any) => ({
      id: item.id,
      product_id: item.product_id,
      type: item.type || 'link',
      link: item.link || undefined,
      username: item.username || undefined,
      password: item.password || undefined,
      notes: item.notes || undefined,
      is_used: Boolean(item.is_used),
      order_id: item.order_id || undefined,
      used_at: item.used_at || undefined,
      created_at: item.created_at || undefined
    }));
    sessionStorageItems = mapped;
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('ai_store_storage_updated'));
    }
    return mapped;
  } catch (err) {
    console.error('Error fetching storage from Supabase:', err);
    return getStoredStorage();
  }
}

export async function addStorageItems(newItems: Omit<ProductStorageItem, 'id' | 'is_used' | 'created_at'>[]): Promise<{ success: boolean; error?: string }> {
  const current = getStoredStorage();
  const prepared: ProductStorageItem[] = newItems.map(item => ({
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `stor_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    product_id: item.product_id,
    type: item.type,
    link: item.link,
    username: item.username,
    password: item.password,
    notes: item.notes,
    is_used: false,
    created_at: new Date().toISOString()
  }));

  const updated = [...prepared, ...current];
  saveStoredStorage(updated, true);
  return { success: true };
}

export async function deleteStorageItem(id: string): Promise<{ success: boolean; error?: string }> {
  const current = getStoredStorage();
  const filtered = current.filter(item => item.id !== id);
  sessionStorageItems = filtered;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('ai_store_storage_updated'));
  }
  return syncAdminDatabase('delete-storage-item', { id });
}

// --- VISITORS ---
export interface VisitorRecord {
  telegramId: number;
  username?: string;
  first_name: string;
  last_name?: string;
  lastActive: string;
  hasOrdered: boolean;
  email?: string;
  isWebVisitor?: boolean;
}

export function getStoredVisitors(): VisitorRecord[] {
  return sessionVisitors;
}

export function recordVisitor(
  user: { id: number; username?: string; first_name: string; last_name?: string; isWebVisitor?: boolean; email?: string }, 
  hasOrdered = false
): void {
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
      hasOrdered: hasOrdered || updated[existingIndex].hasOrdered,
      email: user.email || updated[existingIndex].email,
      isWebVisitor: user.isWebVisitor ?? updated[existingIndex].isWebVisitor
    };
  } else {
    updated = [
      {
        telegramId: user.id,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        lastActive: now,
        hasOrdered,
        email: user.email,
        isWebVisitor: user.isWebVisitor
      },
      ...visitors
    ];
  }
  sessionVisitors = updated;
  window.dispatchEvent(new Event('ai_store_visitors_updated'));

  void fetch('/api/visitors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user, hasOrdered, isWebVisitor: user.isWebVisitor, email: user.email })
  }).catch(err => console.error('Visitor sync error:', err));
}

export async function fetchVisitorsFromSupabase(): Promise<VisitorRecord[]> {
  if (!isSupabaseConfigured || !supabase) return getStoredVisitors();
  try {
    const headers = getAdminAuthHeaders();
    const response = await fetch('/api/admin/database?resource=visitors', {
      headers,
      credentials: 'include'
    });
    if (!response.ok) {
      return getStoredVisitors();
    }
    const { data } = await response.json();
    if (!data || data.length === 0) {
      return [];
    }
    const mapped: VisitorRecord[] = data.map((v: any) => {
      const idNum = Number(v.telegram_id);
      const isWeb = idNum >= 8000000000 || idNum === 987654321 || !v.username;
      return {
        telegramId: idNum,
        username: v.username || undefined,
        first_name: v.first_name || (isWeb ? 'Website Visitor' : 'Customer'),
        last_name: v.last_name || undefined,
        lastActive: v.last_active_at || new Date().toISOString(),
        hasOrdered: Boolean(v.has_ordered),
        isWebVisitor: isWeb
      };
    });
    sessionVisitors = mapped;
    window.dispatchEvent(new Event('ai_store_visitors_updated'));
    return mapped;
  } catch (err) {
    console.error('Error fetching visitors from Supabase:', err);
    return getStoredVisitors();
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
    const headers = getAdminAuthHeaders();
    const response = await fetch('/api/admin/database?resource=credentials', {
      headers,
      credentials: 'include'
    });
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

export async function updateOrderStatus(
  orderId: string,
  status: OrderPayload['status'],
  existingOrder?: Partial<OrderPayload>
): Promise<{ success: boolean; error?: string }> {
  // Persist to DB FIRST before touching local state. The server handles
  // credential claiming and sends back the final status + delivered
  // credentials, so we never need to speculatively modify local state.
  const dbResult = await syncAdminDatabase('update-order-status', {
    orderId,
    status,
    telegramUser: existingOrder?.telegramUser,
    deliveryEmail: existingOrder?.deliveryEmail,
    total: existingOrder?.total
  });

  if (!dbResult.success) {
    // DB sync failed — do NOT update local state so the UI stays accurate.
    return dbResult;
  }

  // DB sync succeeded — now update local session state to match.
  let updatedOrder: OrderPayload | undefined;
  sessionOrders = sessionOrders.map(order => {
    if (order.orderId === orderId) {
      updatedOrder = { ...order, ...existingOrder, status };
      return updatedOrder;
    }
    return order;
  });

  if (!updatedOrder && existingOrder) {
    updatedOrder = {
      orderId,
      status,
      telegramUser: existingOrder.telegramUser || { id: 987654321, first_name: 'Customer' },
      items: existingOrder.items || [],
      subtotal: existingOrder.subtotal || 0,
      total: existingOrder.total || 0,
      paymentMethod: existingOrder.paymentMethod || { id: 'binance', name: 'Payment', accountName: '', accountId: '' },
      timestamp: existingOrder.timestamp || new Date().toISOString(),
      deliveryEmail: existingOrder.deliveryEmail
    };
    sessionOrders = [updatedOrder, ...sessionOrders];
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('ai_store_orders_updated'));
  }

  // Re-fetch from DB to get server-assigned delivered credentials etc.
  fetchOrdersFromSupabase();

  return dbResult;
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
