'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Product } from '@/config/products';
import { 
  getStoredProducts, saveStoredProducts, getStoredCategories, 
  saveStoredCategories, getStoredOrders, getStoredVisitors, getOnlineUsers24hCount,
  fetchProductsFromSupabase, fetchCategoriesFromSupabase, fetchOrdersFromSupabase
} from '@/lib/store';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

import { ProductEditorModal } from './ProductEditorModal';
import { AdminOrdersView } from './AdminOrdersView';
import { AdminCategoriesView } from './AdminCategoriesView';
import { AdminUsersView } from './AdminUsersView';
import { AdminSettingsView } from './AdminSettingsView';
import { 
  Package, ShoppingBag, LogOut, Plus, Edit, Trash2, ShieldCheck, ShieldAlert, 
  Tag, ExternalLink, Sparkles, FolderPlus, Layers, Bell, UserCheck, 
  ArrowUpRight, Edit2, X, Users, Settings, Grid, Home, Store, Activity, Menu,
  RefreshCw, Check
} from 'lucide-react';

interface AdminDashboardProps {
  onLogout: () => void;
}

type TabType = 'dashboard' | 'orders' | 'products' | 'categories' | 'users' | 'settings';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [ordersCount, setOrdersCount] = useState<number>(0);
  const [pendingOrdersCount, setPendingOrdersCount] = useState<number>(0);
  const [visitorsCount, setVisitorsCount] = useState<number>(0);
  const [online24hCount, setOnline24hCount] = useState<number>(0);

  // Modal state
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Touch swipe left to close sidebar handler
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const currentX = e.touches[0].clientX;
    const diffX = touchStartX - currentX;
    if (diffX > 50) {
      setIsSidebarOpen(false);
      setTouchStartX(null);
    }
  };

  const handleTouchEnd = () => {
    setTouchStartX(null);
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  // Refresh State & Banner Toast
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [headerToast, setHeaderToast] = useState<string | null>(null);

  const refreshData = () => {
    setIsRefreshing(true);
    const prods = getStoredProducts();
    const cats = getStoredCategories();
    const ords = getStoredOrders();
    const vists = getStoredVisitors();
    const onlineCount = getOnlineUsers24hCount();

    setProducts(prods);
    setCategories(cats);
    setOrdersCount(ords.length);
    setPendingOrdersCount(ords.filter(o => o.status === 'Pending' || o.status === 'Payment Submitted').length);
    setVisitorsCount(vists.length);
    setOnline24hCount(onlineCount);

    Promise.all([
      fetchProductsFromSupabase().then(p => { if (p && p.length > 0) setProducts(p); }),
      fetchCategoriesFromSupabase().then(c => { if (c && c.length > 0) setCategories(c); }),
      fetchOrdersFromSupabase().then(o => {
        if (o) {
          setOrdersCount(o.length);
          setPendingOrdersCount(o.filter(item => item.status === 'Pending' || item.status === 'Payment Submitted').length);
        }
      })
    ]).finally(() => {
      setTimeout(() => setIsRefreshing(false), 500);
    });
  };

  const handleManualRefresh = () => {
    refreshData();
    setHeaderToast('⚡ Store data refreshed from Supabase DB!');
    setTimeout(() => setHeaderToast(null), 3500);
  };


  useEffect(() => {
    refreshData();
    const handleProductsUpdate = () => refreshData();
    const handleOrdersUpdate = () => refreshData();
    const handleVisitorsUpdate = () => refreshData();

    window.addEventListener('ai_store_products_updated', handleProductsUpdate);
    window.addEventListener('ai_store_categories_updated', handleOrdersUpdate);
    window.addEventListener('ai_store_orders_updated', handleOrdersUpdate);
    window.addEventListener('ai_store_visitors_updated', handleVisitorsUpdate);

    return () => {
      window.removeEventListener('ai_store_products_updated', handleProductsUpdate);
      window.removeEventListener('ai_store_categories_updated', handleOrdersUpdate);
      window.removeEventListener('ai_store_orders_updated', handleOrdersUpdate);
      window.removeEventListener('ai_store_visitors_updated', handleVisitorsUpdate);
    };
  }, []);

  const handleSaveProduct = (updatedProduct: Product) => {
    const existingIndex = products.findIndex((p) => p.id === updatedProduct.id);
    let updatedProducts: Product[];
    if (existingIndex >= 0) {
      updatedProducts = [...products];
      updatedProducts[existingIndex] = updatedProduct;
    } else {
      updatedProducts = [updatedProduct, ...products];
    }

    saveStoredProducts(updatedProducts);

    if (updatedProduct.category && !categories.includes(updatedProduct.category)) {
      const updatedCategories = [...categories, updatedProduct.category];
      saveStoredCategories(updatedCategories);
    }

    setIsEditorOpen(false);
    setEditingProduct(null);
  };

  const handleDeleteProduct = (productId: string) => {
    if (confirm('Are you sure you want to delete this product from store?')) {
      const updated = products.filter((p) => p.id !== productId);
      saveStoredProducts(updated);
      if (isSupabaseConfigured && supabase) {
        Promise.resolve(supabase.from('products').delete().eq('id', productId)).catch((err: unknown) => console.error('Supabase delete error:', err));
      }
    }
  };


  return (
    <div className="min-h-screen w-full bg-[#F6F8FB] text-slate-900 flex font-sans overflow-x-hidden relative">
      
      {/* Dark Mobile Backdrop Overlay - Click outside on black space to close sidebar */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-35 bg-slate-950/60 backdrop-blur-xs md:hidden animate-fadeIn"
          title="Click to close sidebar menu"
        />
      )}

      {/* ==================== LEFT SIDEBAR NAVIGATION ==================== */}
      <aside
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-slate-900 text-white flex flex-col justify-between border-r border-slate-800 transition-all duration-300 transform shadow-2xl md:shadow-none overflow-y-auto custom-scrollbar ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-5 space-y-6">
          {/* Logo & Brand Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500 p-0.5 shadow-md flex items-center justify-center shrink-0 overflow-hidden">
                <Image
                  src="/assets/buy_ai_store_logo.png"
                  alt="AnyAi Store Logo"
                  width={38}
                  height={38}
                  className="object-cover w-full h-full rounded-lg"
                />
              </div>
              <div>
                <h1 className="heading-font text-sm font-black tracking-tight text-white">
                  AnyAi STORE
                </h1>
                <span className="text-[10px] font-extrabold text-orange-400 uppercase tracking-widest">
                  Admin Panel
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links Menu */}
          <nav className="space-y-1 pt-2">
            {/* 1. Dashboard */}
            <button
              type="button"
              onClick={() => handleTabChange('dashboard')}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-extrabold transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-[#FF6B00] text-white shadow-md'
                  : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <Home className="w-4 h-4 shrink-0" />
              <span>Dashboard</span>
            </button>

            {/* 2. Orders */}
            <button
              type="button"
              onClick={() => handleTabChange('orders')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-extrabold transition-all ${
                activeTab === 'orders'
                  ? 'bg-[#FF6B00] text-white shadow-md'
                  : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-4 h-4 shrink-0" />
                <span>Orders</span>
              </div>
              {pendingOrdersCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black">
                  {pendingOrdersCount}
                </span>
              )}
            </button>

            {/* 3. Products */}
            <button
              type="button"
              onClick={() => handleTabChange('products')}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-extrabold transition-all ${
                activeTab === 'products'
                  ? 'bg-[#FF6B00] text-white shadow-md'
                  : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <Package className="w-4 h-4 shrink-0" />
              <span>Products</span>
            </button>

            {/* 4. Categories */}
            <button
              type="button"
              onClick={() => handleTabChange('categories')}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-extrabold transition-all ${
                activeTab === 'categories'
                  ? 'bg-[#FF6B00] text-white shadow-md'
                  : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <Grid className="w-4 h-4 shrink-0" />
              <span>Categories</span>
            </button>

            {/* 5. Online Users & Visitors */}
            <button
              type="button"
              onClick={() => handleTabChange('users')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-extrabold transition-all ${
                activeTab === 'users'
                  ? 'bg-[#FF6B00] text-white shadow-md'
                  : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4 shrink-0" />
                <span>Online Users</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-300 border border-purple-400/30 text-[10px] font-black">
                {online24hCount} online
              </span>
            </button>

            {/* 6. Settings */}
            <button
              type="button"
              onClick={() => handleTabChange('settings')}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-extrabold transition-all ${
                activeTab === 'settings'
                  ? 'bg-[#FF6B00] text-white shadow-md'
                  : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <Settings className="w-4 h-4 shrink-0" />
              <span>Settings</span>
            </button>

            {/* 7. Direct Link to Main Store Page */}
            <div className="pt-4 border-t border-slate-800/80">
              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-extrabold bg-slate-800 hover:bg-slate-700 text-orange-400 border border-slate-700 transition-all"
              >
                <Store className="w-4 h-4 text-orange-400 shrink-0" />
                <span>Main Store Page</span>
                <ExternalLink className="w-3.5 h-3.5 ml-auto text-slate-400" />
              </a>
            </div>
          </nav>
        </div>

        {/* Sidebar Footer User Info & Logout */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#FF6B00] text-white font-black text-xs flex items-center justify-center shadow-xs">
              A
            </div>
            <div className="text-left leading-tight min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">Administrator</p>
              <p className="text-[10px] text-slate-400 font-semibold truncate">Store Manager</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="w-full py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-bold transition-all flex items-center justify-center gap-2"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Panel View Shell */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-[0_2px_10px_rgba(15,23,42,0.02)] shrink-0">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors md:hidden"
              title="Toggle sidebar navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="heading-font text-sm sm:text-base font-extrabold text-slate-900 capitalize truncate">
              {activeTab === 'users' ? 'Online Users & Visitor Analytics' : activeTab} Page
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Top Refresh Button */}
            <button
              type="button"
              disabled={isRefreshing}
              onClick={handleManualRefresh}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200/80 text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs shrink-0"
              title="Refresh products, orders, categories & visitors from Supabase DB"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-orange-600 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isRefreshing ? 'Refreshing...' : 'Refresh Data'}</span>
            </button>

            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 sm:px-3.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-[#FF6B00] border border-orange-100 text-xs font-extrabold transition-all flex items-center gap-1.5 shrink-0"
            >
              <Store className="w-4 h-4 text-[#FF6B00]" />
              <span className="hidden sm:inline">Main Store Page</span>
              <ExternalLink className="w-3.5 h-3.5 text-[#FF6B00]" />
            </a>
          </div>
        </header>

        {/* Refresh Toast Banner */}
        {headerToast && (
          <div className="bg-slate-900 text-white text-xs font-bold py-2 px-4 px-8 text-center flex items-center justify-center gap-2 animate-fadeIn border-b border-slate-800">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>{headerToast}</span>
          </div>
        )}

        {/* Content Body Area - Fully Scrollable on all devices */}
        <main className="p-4 sm:p-8 flex-1 overflow-y-auto custom-scrollbar pb-32">
          
          {/* ==================== 1. DASHBOARD PAGE ==================== */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-fadeIn pb-12">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">Dashboard Overview</h2>
                  <p className="text-xs text-slate-500 font-medium">Click any metric card below to jump directly to its specific page.</p>
                </div>
              </div>

              {/* 5 Interactive Clickable Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Stat 1: Total Products -> Navigates to 'products' */}
                <div
                  onClick={() => setActiveTab('products')}
                  className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_10px_rgba(15,23,42,0.04)] space-y-3 cursor-pointer hover:border-[#FF6B00] hover:shadow-md transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#FF6B00] group-hover:scale-105 transition-transform">
                      <Package className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-extrabold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-100 flex items-center gap-0.5">
                      View Products <ArrowUpRight className="w-3 h-3" />
                    </span>
                  </div>
                  <div>
                    <span className="text-[10.5px] font-bold text-slate-400 tracking-wider uppercase block">TOTAL PRODUCTS</span>
                    <p className="heading-font text-2xl font-black text-slate-900 mt-0.5">{products.length}</p>
                    <p className="text-[11px] text-slate-500 font-semibold mt-1">Configured store items</p>
                  </div>
                </div>

                {/* Stat 2: Total Categories -> Navigates to 'categories' */}
                <div
                  onClick={() => setActiveTab('categories')}
                  className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_10px_rgba(15,23,42,0.04)] space-y-3 cursor-pointer hover:border-blue-500 hover:shadow-md transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-105 transition-transform">
                      <Grid className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 flex items-center gap-0.5">
                      View Categories <ArrowUpRight className="w-3 h-3" />
                    </span>
                  </div>
                  <div>
                    <span className="text-[10.5px] font-bold text-slate-400 tracking-wider uppercase block">CATEGORIES</span>
                    <p className="heading-font text-2xl font-black text-slate-900 mt-0.5">{categories.length}</p>
                    <p className="text-[11px] text-slate-500 font-semibold mt-1">Active categories</p>
                  </div>
                </div>

                {/* Stat 3: Orders -> Navigates to 'orders' */}
                <div
                  onClick={() => setActiveTab('orders')}
                  className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_10px_rgba(15,23,42,0.04)] space-y-3 cursor-pointer hover:border-amber-500 hover:shadow-md transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 group-hover:scale-105 transition-transform">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-extrabold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100 flex items-center gap-0.5">
                      View Orders <ArrowUpRight className="w-3 h-3" />
                    </span>
                  </div>
                  <div>
                    <span className="text-[10.5px] font-bold text-slate-400 tracking-wider uppercase block">TOTAL ORDERS</span>
                    <p className="heading-font text-2xl font-black text-slate-900 mt-0.5">{ordersCount}</p>
                    <p className="text-[11px] text-amber-600 font-bold mt-1">{pendingOrdersCount} pending verification</p>
                  </div>
                </div>

                {/* Stat 4: Online Users (24h) -> Navigates to 'users' */}
                <div
                  onClick={() => setActiveTab('users')}
                  className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_10px_rgba(15,23,42,0.04)] space-y-3 cursor-pointer hover:border-purple-500 hover:shadow-md transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 group-hover:scale-105 transition-transform">
                      <Users className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-extrabold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100 flex items-center gap-0.5">
                      View Users <ArrowUpRight className="w-3 h-3" />
                    </span>
                  </div>
                  <div>
                    <span className="text-[10.5px] font-bold text-slate-400 tracking-wider uppercase block">ONLINE USERS (24H)</span>
                    <p className="heading-font text-2xl font-black text-slate-900 mt-0.5">{online24hCount}</p>
                    <p className="text-[11px] text-purple-600 font-semibold mt-1">Visitors in last 24h ({visitorsCount} total)</p>
                  </div>
                </div>
              </div>

              {/* Quick Actions Panel */}
              <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_10px_rgba(15,23,42,0.04)] space-y-4">
                <h3 className="text-sm font-extrabold text-slate-900">Quick Operations</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingProduct(null);
                      setIsEditorOpen(true);
                    }}
                    className="p-4 rounded-xl bg-orange-50 hover:bg-orange-100 border border-orange-200 text-[#FF6B00] font-extrabold text-xs flex items-center justify-center gap-2 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Add New Product</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('categories')}
                    className="p-4 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-extrabold text-xs flex items-center justify-center gap-2 transition-all"
                  >
                    <Grid className="w-4 h-4" />
                    <span>Manage Categories</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('orders')}
                    className="p-4 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 font-extrabold text-xs flex items-center justify-center gap-2 transition-all"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>View Orders</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ==================== 2. ORDERS PAGE ==================== */}
          {activeTab === 'orders' && <AdminOrdersView />}

          {/* ==================== 3. PRODUCTS PAGE ==================== */}
          {activeTab === 'products' && (
            <div className="space-y-6 animate-fadeIn pb-12">
              <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_10px_rgba(15,23,42,0.04)] space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900">Store Products Table</h2>
                    <p className="text-xs text-slate-500 font-medium">Full view of prices, warranty status, stock, and actions per product</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingProduct(null);
                      setIsEditorOpen(true);
                    }}
                    className="px-4 py-2 bg-[#FF6B00] hover:bg-[#E66000] text-white text-xs font-extrabold rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Add Product</span>
                  </button>
                </div>

                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr className="border-b border-slate-100 text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="py-3 px-3">PRODUCT</th>
                        <th className="py-3 px-3">CATEGORY</th>
                        <th className="py-3 px-3">PRICE</th>
                        <th className="py-3 px-3">WARRANTY</th>
                        <th className="py-3 px-3">STATUS</th>
                        <th className="py-3 px-3">STOCK</th>
                        <th className="py-3 px-3 text-right">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-medium">
                      {products.map((prod) => {
                        const isWarrantyActive = prod.isWarranty !== false;

                        return (
                          <tr key={prod.id} className="hover:bg-slate-50/80 transition-colors">
                            {/* Product Logo & Title */}
                            <td className="py-3.5 px-3">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200/80 p-1 flex items-center justify-center shrink-0">
                                  <Image
                                    src={prod.logoPath || '/assets/products/chatgpt.png'}
                                    alt={prod.name}
                                    width={32}
                                    height={32}
                                    className="object-contain w-full h-full"
                                  />
                                </div>
                                <div>
                                  <p className="font-bold text-slate-900">{prod.name}</p>
                                  <p className="text-[11px] text-slate-400 line-clamp-1">{prod.shortDescription}</p>
                                </div>
                              </div>
                            </td>

                            {/* Category */}
                            <td className="py-3.5 px-3">
                              <span className="inline-block text-[11px] font-extrabold text-orange-600 bg-orange-50 border border-orange-100 px-2.5 py-1 rounded-lg">
                                {prod.category}
                              </span>
                            </td>

                            {/* Price */}
                            <td className="py-3.5 px-3 font-extrabold text-emerald-600">
                              {prod.currency || '$'}{prod.price.toFixed(2)}
                            </td>

                            {/* Warranty */}
                            <td className="py-3.5 px-3">
                              {isWarrantyActive ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>{prod.warranty || 'Warranty Included'}</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-100">
                                  <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                                  <span>No Warranty</span>
                                </span>
                              )}
                            </td>

                            {/* Status */}
                            <td className="py-3.5 px-3">
                              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-600">
                                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                <span>Active</span>
                              </span>
                            </td>

                            {/* Stock */}
                            <td className="py-3.5 px-3 text-slate-700 font-semibold">
                              {prod.stock} in stock
                            </td>

                            {/* Actions */}
                            <td className="py-3.5 px-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingProduct(prod);
                                    setIsEditorOpen(true);
                                  }}
                                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:text-orange-600 hover:bg-orange-50 transition-colors text-xs font-bold flex items-center gap-1"
                                >
                                  <Edit className="w-3.5 h-3.5 text-orange-500" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteProduct(prod.id)}
                                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors text-xs font-bold flex items-center gap-1"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Delete</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ==================== 4. CATEGORIES PAGE ==================== */}
          {activeTab === 'categories' && (
            <AdminCategoriesView
              categories={categories}
              products={products}
              onRefresh={refreshData}
            />
          )}

          {/* ==================== 5. USERS & ONLINE ACTIVITY PAGE ==================== */}
          {activeTab === 'users' && (
            <AdminUsersView
              visitors={getStoredVisitors()}
              onlineCount24h={online24hCount}
            />
          )}

          {/* ==================== 6. SETTINGS PAGE ==================== */}
          {activeTab === 'settings' && <AdminSettingsView />}

        </main>
      </div>

      {/* Editor Modal */}
      {isEditorOpen && (
        <ProductEditorModal
          product={editingProduct}
          categories={categories}
          onSave={handleSaveProduct}
          onClose={() => {
            setIsEditorOpen(false);
            setEditingProduct(null);
          }}
        />
      )}
    </div>
  );
};
