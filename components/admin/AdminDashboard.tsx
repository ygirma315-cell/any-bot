'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Product } from '@/config/products';
import { getStoredProducts, saveStoredProducts, getStoredCategories, saveStoredCategories, getStoredOrders } from '@/lib/store';
import { ProductEditorModal } from './ProductEditorModal';
import { AdminOrdersView } from './AdminOrdersView';
import { 
  Package, ShoppingBag, LogOut, Plus, Edit, Trash2, ShieldCheck, ShieldAlert, 
  Tag, ExternalLink, Sparkles, FolderPlus, Layers, Search, Bell, UserCheck, 
  ArrowUpRight, Edit2, X, TrendingUp, Users, Settings, Grid
} from 'lucide-react';

interface AdminDashboardProps {
  onLogout: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<'products' | 'orders'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [ordersCount, setOrdersCount] = useState<number>(0);
  const [pendingOrdersCount, setPendingOrdersCount] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal state
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // New category input state
  const [newCategoryInput, setNewCategoryInput] = useState<string>('');
  const [showAddCategory, setShowAddCategory] = useState<boolean>(false);

  const refreshData = () => {
    const prods = getStoredProducts();
    const cats = getStoredCategories();
    const ords = getStoredOrders();

    setProducts(prods);
    setCategories(cats);
    setOrdersCount(ords.length);
    setPendingOrdersCount(ords.filter(o => o.status === 'Pending' || o.status === 'Payment Submitted').length);
  };

  useEffect(() => {
    refreshData();
    const handleProductsUpdate = () => refreshData();
    const handleOrdersUpdate = () => refreshData();

    window.addEventListener('ai_store_products_updated', handleProductsUpdate);
    window.addEventListener('ai_store_categories_updated', handleOrdersUpdate);

    return () => {
      window.removeEventListener('ai_store_products_updated', handleProductsUpdate);
      window.removeEventListener('ai_store_categories_updated', handleOrdersUpdate);
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
    }
  };

  const MAX_CATEGORY_LENGTH = 22;

  const handleAddCategory = () => {
    if (!newCategoryInput.trim()) return;
    const catName = newCategoryInput.trim().slice(0, MAX_CATEGORY_LENGTH);
    if (!categories.includes(catName)) {
      const updatedCats = [...categories, catName];
      saveStoredCategories(updatedCats);
    }
    setNewCategoryInput('');
    setShowAddCategory(false);
  };

  const handleRenameCategory = (oldCategory: string) => {
    if (oldCategory === 'All') return;
    const newName = prompt(`Rename category "${oldCategory}" (Max 22 chars):`, oldCategory);
    if (!newName || !newName.trim() || newName.trim() === oldCategory) return;
    const cleanNewName = newName.trim().slice(0, MAX_CATEGORY_LENGTH);

    const updatedCats = categories.map(c => c === oldCategory ? cleanNewName : c);
    saveStoredCategories(updatedCats);

    const updatedProds = products.map(p => {
      if (p.category === oldCategory) {
        return { ...p, category: cleanNewName };
      }
      return p;
    });
    saveStoredProducts(updatedProds);
  };

  const handleDeleteCategory = (catToDelete: string) => {
    if (catToDelete === 'All') return;
    if (confirm(`Are you sure you want to delete category "${catToDelete}"?`)) {
      const updatedCats = categories.filter(c => c !== catToDelete);
      saveStoredCategories(updatedCats);
    }
  };

  const filteredProducts = products.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen w-full bg-[#F6F8FB] text-slate-900 overflow-y-auto font-sans">
      {/* Top Enterprise Navigation Header */}
      <header className="sticky top-0 z-30 w-full bg-white border-b border-slate-200/80 px-4 sm:px-8 py-3.5 shadow-[0_2px_10px_rgba(15,23,42,0.02)]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Logo & Title */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-xl bg-slate-900 p-0.5 shadow-xs flex items-center justify-center shrink-0 overflow-hidden">
                <Image
                  src="/assets/buy_ai_store_logo.png"
                  alt="AnyAi Store Logo"
                  width={40}
                  height={40}
                  className="object-cover w-full h-full rounded-lg"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="heading-font text-base font-extrabold tracking-tight text-slate-900">
                    AnyAi STORE
                  </h1>
                  <span className="px-2 py-0.5 rounded-full bg-orange-50 text-[#FF6B00] border border-orange-100 font-extrabold text-[10px] tracking-wider uppercase">
                    Admin Panel
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  Manage AI Categories, Products, Prices & Orders
                </p>
              </div>
            </div>

            {/* Mobile Actions */}
            <div className="flex md:hidden items-center gap-2">
              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 text-xs"
                title="View Main Site"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
              <button
                type="button"
                onClick={onLogout}
                className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 text-xs font-bold"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Search Field Bar */}
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products, categories, or orders..."
              className="w-full pl-10 pr-14 py-2 bg-slate-50 border border-slate-200/90 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#FF6B00] focus:bg-white focus:ring-2 focus:ring-[#FF6B00]/20 transition-all shadow-xs"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 bg-slate-200/60 px-1.5 py-0.5 rounded">
              Ctrl /
            </span>
          </div>

          {/* User Account Controls */}
          <div className="hidden md:flex items-center gap-4">
            <div className="relative p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 cursor-pointer">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#FF6B00]" />
            </div>

            <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-black text-xs flex items-center justify-center">
                Y
              </div>
              <div className="text-left leading-tight">
                <p className="text-xs font-bold text-slate-900">Yohannes</p>
                <p className="text-[10px] text-slate-400 font-medium">Administrator</p>
              </div>
            </div>

            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/80 text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <span>Main Site</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            </a>

            <button
              type="button"
              onClick={onLogout}
              className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto p-4 sm:p-8 space-y-6">
        {/* 5 Premium Statistics Cards Row */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Stat 1: Products */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_10px_rgba(15,23,42,0.04)] space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#FF6B00]">
                <Package className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold text-orange-600 flex items-center gap-0.5 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-100">
                <ArrowUpRight className="w-3 h-3" /> 12%
              </span>
            </div>
            <div>
              <span className="text-[10.5px] font-bold text-slate-400 tracking-wider uppercase block">TOTAL PRODUCTS</span>
              <p className="heading-font text-2xl font-black text-slate-900 mt-0.5">{products.length}</p>
              <p className="text-[11px] text-slate-500 font-medium mt-1">Active products</p>
            </div>
          </div>

          {/* Stat 2: Categories */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_10px_rgba(15,23,42,0.04)] space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                <Grid className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold text-blue-600 flex items-center gap-0.5 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                <ArrowUpRight className="w-3 h-3" /> 8%
              </span>
            </div>
            <div>
              <span className="text-[10.5px] font-bold text-slate-400 tracking-wider uppercase block">CATEGORIES</span>
              <p className="heading-font text-2xl font-black text-slate-900 mt-0.5">{categories.length}</p>
              <p className="text-[11px] text-slate-500 font-medium mt-1">Total categories</p>
            </div>
          </div>

          {/* Stat 3: Pending Orders */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_10px_rgba(15,23,42,0.04)] space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold text-amber-600 flex items-center gap-0.5 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
                — 0%
              </span>
            </div>
            <div>
              <span className="text-[10.5px] font-bold text-slate-400 tracking-wider uppercase block">PENDING ORDERS</span>
              <p className="heading-font text-2xl font-black text-slate-900 mt-0.5">{pendingOrdersCount}</p>
              <p className="text-[11px] text-slate-500 font-medium mt-1">Awaiting processing</p>
            </div>
          </div>

          {/* Stat 4: Total Orders */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_10px_rgba(15,23,42,0.04)] space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                <ArrowUpRight className="w-3 h-3" /> 0%
              </span>
            </div>
            <div>
              <span className="text-[10.5px] font-bold text-slate-400 tracking-wider uppercase block">TOTAL ORDERS</span>
              <p className="heading-font text-2xl font-black text-slate-900 mt-0.5">{ordersCount}</p>
              <p className="text-[11px] text-slate-500 font-medium mt-1">Completed orders</p>
            </div>
          </div>

          {/* Stat 5: Registered Users */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_10px_rgba(15,23,42,0.04)] space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
                <Users className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold text-purple-600 flex items-center gap-0.5 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
                <ArrowUpRight className="w-3 h-3" /> 15%
              </span>
            </div>
            <div>
              <span className="text-[10.5px] font-bold text-slate-400 tracking-wider uppercase block">USERS</span>
              <p className="heading-font text-2xl font-black text-slate-900 mt-0.5">18</p>
              <p className="text-[11px] text-slate-500 font-medium mt-1">Registered users</p>
            </div>
          </div>
        </div>

        {/* Clean Segmented Navigation Tabs Bar */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 bg-slate-200/60 p-1.5 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveTab('products')}
            className={`flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
              activeTab === 'products'
                ? 'bg-[#FF6B00] text-white shadow-sm font-extrabold'
                : 'bg-white/80 hover:bg-white text-slate-700 font-semibold'
            }`}
          >
            <div className={`p-2 rounded-lg ${activeTab === 'products' ? 'bg-white/20 text-white' : 'bg-orange-50 text-[#FF6B00]'}`}>
              <Package className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs">Products</p>
              <p className={`text-[10px] ${activeTab === 'products' ? 'text-orange-100' : 'text-slate-400'}`}>View & manage all products</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('products')}
            className="flex items-center gap-3 p-3 rounded-xl bg-white/80 hover:bg-white text-slate-700 font-semibold transition-all text-left"
          >
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Grid className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs">Categories</p>
              <p className="text-[10px] text-slate-400">Manage product categories</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
              activeTab === 'orders'
                ? 'bg-[#FF6B00] text-white shadow-sm font-extrabold'
                : 'bg-white/80 hover:bg-white text-slate-700 font-semibold'
            }`}
          >
            <div className={`p-2 rounded-lg relative ${activeTab === 'orders' ? 'bg-white/20 text-white' : 'bg-amber-50 text-amber-600'}`}>
              <ShoppingBag className="w-4 h-4" />
              {pendingOrdersCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 border border-white" />
              )}
            </div>
            <div>
              <p className="text-xs flex items-center gap-1.5">
                Orders
                {pendingOrdersCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                    {pendingOrdersCount}
                  </span>
                )}
              </p>
              <p className={`text-[10px] ${activeTab === 'orders' ? 'text-orange-100' : 'text-slate-400'}`}>View all customer orders</p>
            </div>
          </button>

          <button
            type="button"
            className="flex items-center gap-3 p-3 rounded-xl bg-white/80 hover:bg-white text-slate-700 font-semibold transition-all text-left opacity-80"
          >
            <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs">Users</p>
              <p className="text-[10px] text-slate-400">Manage user accounts</p>
            </div>
          </button>

          <button
            type="button"
            className="flex items-center gap-3 p-3 rounded-xl bg-white/80 hover:bg-white text-slate-700 font-semibold transition-all text-left opacity-80"
          >
            <div className="p-2 rounded-lg bg-slate-100 text-slate-600">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs">Settings</p>
              <p className="text-[10px] text-slate-400">Store configuration</p>
            </div>
          </button>
        </div>

        {/* TAB 1: PRODUCTS & CATEGORIES MANAGEMENT */}
        {activeTab === 'products' && (
          <div className="space-y-6 animate-fadeIn pb-12">
            {/* Category Management Row */}
            <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_10px_rgba(15,23,42,0.04)] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                    Category Management
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">Tap ✏️ to rename category name or tap ➕ to add a new category</p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddCategory(!showAddCategory)}
                  className="px-3.5 py-2 rounded-xl bg-orange-50 hover:bg-orange-100 text-[#FF6B00] border border-orange-100 text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <FolderPlus className="w-4 h-4" />
                  <span>+ Add Category</span>
                </button>
              </div>

              {/* Add Category Drawer Input */}
              {showAddCategory && (
                <div className="p-3 bg-slate-50 border border-orange-200 rounded-xl flex items-center gap-3 animate-fadeIn">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      maxLength={22}
                      value={newCategoryInput}
                      onChange={(e) => setNewCategoryInput(e.target.value)}
                      placeholder="New category name (Max 22 chars)..."
                      className="w-full p-2 pr-16 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 font-semibold focus:outline-none focus:border-[#FF6B00]"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                      {newCategoryInput.length}/22
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    className="px-4 py-2 bg-[#FF6B00] hover:bg-[#E66000] text-white font-bold text-xs rounded-lg shadow-xs"
                  >
                    Save Category
                  </button>
                </div>
              )}

              {/* Category Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
                {categories.map((cat) => (
                  <div
                    key={cat}
                    className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/90 text-slate-800 text-xs font-bold shrink-0 flex items-center gap-2"
                  >
                    <span className="flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-orange-500" />
                      <span>{cat}</span>
                    </span>

                    {cat !== 'All' && (
                      <div className="flex items-center gap-1 border-l border-slate-200 pl-1.5 ml-0.5">
                        <button
                          type="button"
                          onClick={() => handleRenameCategory(cat)}
                          className="text-slate-500 hover:text-orange-600 p-0.5 rounded transition-colors"
                          title={`Rename category "${cat}"`}
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(cat)}
                          className="text-slate-400 hover:text-rose-600 p-0.5 rounded transition-colors"
                          title={`Delete category "${cat}"`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Products Table Card */}
            <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_10px_rgba(15,23,42,0.04)] space-y-4">
              {/* Table Header Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Recent Products</h3>
                  <p className="text-xs text-slate-500 font-medium">Overview of your latest AI products and services</p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setEditingProduct(null);
                    setIsEditorOpen(true);
                  }}
                  className="px-4 py-2 bg-[#FF6B00] hover:bg-[#E66000] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add Product</span>
                </button>
              </div>

              {/* Products Table */}
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
                    {filteredProducts.map((prod) => {
                      const isWarrantyActive = prod.isWarranty !== false;

                      return (
                        <tr key={prod.id} className="hover:bg-slate-50/80 transition-colors">
                          {/* Product Logo & Name */}
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

                          {/* Category Badge */}
                          <td className="py-3.5 px-3">
                            <span className="inline-block text-[11px] font-extrabold text-orange-600 bg-orange-50 border border-orange-100 px-2.5 py-1 rounded-lg">
                              {prod.category}
                            </span>
                          </td>

                          {/* Price */}
                          <td className="py-3.5 px-3 font-extrabold text-emerald-600">
                            {prod.currency || '$'}{prod.price.toFixed(2)}
                          </td>

                          {/* Warranty Badge */}
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
                          <td className="py-3.5 px-3 text-slate-600 font-semibold">
                            {prod.stock} in stock
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingProduct(prod);
                                  setIsEditorOpen(true);
                                }}
                                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                                title="Edit product"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteProduct(prod.id)}
                                className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                title="Delete product"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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

        {/* TAB 2: ORDERS NAVIGATION */}
        {activeTab === 'orders' && <AdminOrdersView />}
      </main>

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
