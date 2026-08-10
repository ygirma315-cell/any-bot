import { Product, PRODUCTS } from '@/config/products';
import { OrderPayload } from '@/lib/bot';

const PRODUCTS_KEY = 'buy_ai_store_products';
const CATEGORIES_KEY = 'buy_ai_store_categories';
const ORDERS_KEY = 'buy_ai_store_orders';

export const DEFAULT_CATEGORIES = [
  'All',
  'AI Assistants',
  'AI Search & Knowledge',
  'AI Design & Video',
  'Media & Streaming'
];

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

export function saveStoredProducts(products: Product[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
    window.dispatchEvent(new Event('ai_store_products_updated'));
  } catch (e) {
    console.error('Error saving products:', e);
  }
}

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

export function saveStoredCategories(categories: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
    window.dispatchEvent(new Event('ai_store_categories_updated'));
  } catch (e) {
    console.error('Error saving categories:', e);
  }
}

export function getStoredOrders(): OrderPayload[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    return raw ? JSON.parse(raw) : [];
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

const VISITORS_KEY = 'buy_ai_store_visitors';
const ADMIN_PASSWORD_KEY = 'buy_ai_store_admin_password';

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
  } catch (e) {
    console.error('Error recording visitor:', e);
  }
}

export function getOnlineUsers24hCount(): number {
  const visitors = getStoredVisitors();
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return visitors.filter(v => new Date(v.lastActive) >= cutoff).length;
}

export function getStoredAdminPassword(): string {
  if (typeof window === 'undefined') return 'admin123';
  try {
    return localStorage.getItem(ADMIN_PASSWORD_KEY) || 'admin123';
  } catch {
    return 'admin123';
  }
}

export function saveStoredAdminPassword(password: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ADMIN_PASSWORD_KEY, password);
    window.dispatchEvent(new Event('ai_store_admin_password_updated'));
  } catch (e) {
    console.error('Error saving admin password:', e);
  }
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
}

