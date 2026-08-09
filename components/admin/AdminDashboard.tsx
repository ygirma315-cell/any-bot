'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Product } from '@/config/products';
import { getStoredProducts, saveStoredProducts, getStoredCategories, saveStoredCategories, getStoredOrders } from '@/lib/store';
import { ProductEditorModal } from './ProductEditorModal';
import { AdminOrdersView } from './AdminOrdersView';
import { Package, ShoppingBag, LogOut, Plus, Edit, Trash2, ShieldCheck, ShieldAlert, Tag, ExternalLink, Sparkles, FolderPlus } from 'lucide-react';

interface AdminDashboardProps {
  onLogout: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<'products' | 'orders'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [ordersCount, setOrdersCount] = useState<number>(0);
  const [pendingOrdersCount, setPendingOrdersCount] = useState<number>(0);

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
    window.addEventListener('ai_store_orders_updated', handleOrdersUpdate);

    return () => {
      window.removeEventListener('ai_store_products_updated', handleProductsUpdate);
      window.removeEventListener('ai_store_orders_updated', handleOrdersUpdate);
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

    // Also check if product has a category not in list
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

  const handleAddCategory = () => {
    if (!newCategoryInput.trim()) return;
    const catName = newCategoryInput.trim();
    if (!categories.includes(catName)) {
      const updatedCats = [...categories, catName];
      saveStoredCategories(updatedCats);
    }
    setNewCategoryInput('');
    setShowAddCategory(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Header Bar */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12 rounded-2xl bg-white p-1 border border-slate-700 shadow-md flex items-center justify-center shrink-0">
            <Image
              src="/assets/buy_ai_store_logo.png"
              alt="AnyAi Store Logo"
              width={48}
              height={48}
              className="object-cover w-full h-full rounded-xl"
            />
          </div>
          <div>
            <h1 className="heading-font text-lg font-black tracking-tight text-white flex items-center gap-2">
              AnyAi STORE ADMIN
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                v2.0 Live
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Manage AI Categories, Products, Prices & Order Approval
            </p>
          </div>
        </div>

        {/* Header Stats & Quick Actions */}
        <div className="flex items-center gap-3">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <span>View Main Site</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            type="button"
            onClick={onLogout}
            className="px-3.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Metrics Summary Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Total Products</span>
          <p className="heading-font text-2xl font-black text-white">{products.length}</p>
        </div>

        <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Categories</span>
          <p className="heading-font text-2xl font-black text-indigo-400">{categories.length}</p>
        </div>

        <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Pending Orders</span>
          <p className="heading-font text-2xl font-black text-amber-400 flex items-center gap-2">
            {pendingOrdersCount}
            {pendingOrdersCount > 0 && <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />}
          </p>
        </div>

        <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Total Orders</span>
          <p className="heading-font text-2xl font-black text-emerald-400">{ordersCount}</p>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 border ${
            activeTab === 'products'
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg'
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Products & Categories ({products.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 border relative ${
            activeTab === 'orders'
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg'
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Orders Navigation</span>
          {pendingOrdersCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px]">
              {pendingOrdersCount}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: PRODUCTS & CATEGORIES MANAGEMENT */}
      {activeTab === 'products' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Action Bar & Add Category */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-slate-900/80 rounded-2xl border border-slate-800">
            <div>
              <h2 className="heading-font text-base font-bold text-white">Product Catalog & Category Controls</h2>
              <p className="text-xs text-slate-400">Add or edit products, warranty status (Green vs Red logo), and prices.</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAddCategory(!showAddCategory)}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <FolderPlus className="w-4 h-4 text-indigo-400" />
                <span>+ Category</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEditingProduct(null);
                  setIsEditorOpen(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold shadow-lg transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Product</span>
              </button>
            </div>
          </div>

          {/* Add Category Drawer */}
          {showAddCategory && (
            <div className="p-4 bg-slate-900 border border-indigo-500/40 rounded-2xl flex items-center gap-3 animate-fadeIn">
              <input
                type="text"
                value={newCategoryInput}
                onChange={(e) => setNewCategoryInput(e.target.value)}
                placeholder="Enter new category name (e.g. AI Coding, Video Tools)..."
                className="flex-1 p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={handleAddCategory}
                className="px-4 py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-500"
              >
                Save Category
              </button>
            </div>
          )}

          {/* Category List Tags */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-xs font-bold text-slate-400 shrink-0">Active Categories:</span>
            {categories.map((cat) => (
              <span
                key={cat}
                className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-indigo-300 text-xs font-semibold shrink-0 flex items-center gap-1"
              >
                <Tag className="w-3 h-3 text-indigo-400" />
                <span>{cat}</span>
              </span>
            ))}
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((prod) => {
              const isWarrantyActive = prod.isWarranty !== false;

              return (
                <div
                  key={prod.id}
                  className="p-4 bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 space-y-3 relative overflow-hidden flex flex-col justify-between hover:border-slate-700 transition-all shadow-md"
                >
                  <div>
                    {/* Top Row: Category & Action Buttons */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10.5px] font-bold text-indigo-400 bg-indigo-950/60 px-2.5 py-0.5 rounded-md border border-indigo-800/50">
                        {prod.category}
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingProduct(prod);
                            setIsEditorOpen(true);
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                          title="Edit product"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(prod.id)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/50 text-slate-400 hover:text-rose-400 transition-colors"
                          title="Delete product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Product Name & Description */}
                    <h3 className="heading-font text-sm font-extrabold text-white line-clamp-1 mb-1">
                      {prod.name}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">
                      {prod.shortDescription}
                    </p>
                  </div>

                  {/* Bottom Row: Price, Stock & Warranty Badge */}
                  <div className="pt-3 border-t border-slate-800 space-y-2.5 mt-auto">
                    {/* Warranty Logo / Badge (Green for Warranty, Red for No Warranty) */}
                    {isWarrantyActive ? (
                      <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-800/60">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate">{prod.warranty || 'Warranty Included'}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-[11px] font-bold text-rose-400 bg-rose-950/40 px-2.5 py-1 rounded-lg border border-rose-800/60">
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span className="truncate">No Warranty</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="text-sm font-black text-emerald-400">
                        {prod.currency || '$'}{prod.price.toFixed(2)}
                      </div>
                      <span className="text-[11px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md">
                        {prod.stock} in Stock
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: ORDERS NAVIGATION */}
      {activeTab === 'orders' && <AdminOrdersView />}

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
