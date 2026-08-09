'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Product } from '@/config/products';
import { getStoredProducts, saveStoredProducts, getStoredCategories, saveStoredCategories, getStoredOrders } from '@/lib/store';
import { ProductEditorModal } from './ProductEditorModal';
import { AdminOrdersView } from './AdminOrdersView';
import { Package, ShoppingBag, LogOut, Plus, Edit, Trash2, ShieldCheck, ShieldAlert, Tag, ExternalLink, Sparkles, FolderPlus, Layers, Store } from 'lucide-react';

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
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto">
      {/* Top Header Bar */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 sm:p-5 bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-3xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12 rounded-2xl bg-white p-1 border border-slate-200 shadow-xs flex items-center justify-center shrink-0">
            <Image
              src="/assets/buy_ai_store_logo.png"
              alt="AnyAi Store Logo"
              width={48}
              height={48}
              className="object-cover w-full h-full rounded-xl"
            />
          </div>
          <div>
            <h1 className="heading-font text-lg font-black tracking-tight text-slate-900 flex items-center gap-2">
              AnyAi STORE ADMIN
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-200">
                Orange Theme
              </span>
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Manage AI Categories, Products, Prices & Order Approval
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-3">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <span>View Main Site</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
          </a>

          <button
            type="button"
            onClick={onLogout}
            className="px-3.5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Metrics Summary Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="p-4 bg-white/95 rounded-2xl border border-slate-200/90 shadow-xs space-y-1">
          <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wide">Total Products</span>
          <p className="heading-font text-2xl font-black text-slate-900">{products.length}</p>
        </div>

        <div className="p-4 bg-white/95 rounded-2xl border border-slate-200/90 shadow-xs space-y-1">
          <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wide">Categories</span>
          <p className="heading-font text-2xl font-black text-orange-600">{categories.length}</p>
        </div>

        <div className="p-4 bg-white/95 rounded-2xl border border-slate-200/90 shadow-xs space-y-1">
          <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wide">Pending Orders</span>
          <p className="heading-font text-2xl font-black text-amber-600 flex items-center gap-2">
            {pendingOrdersCount}
            {pendingOrdersCount > 0 && <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />}
          </p>
        </div>

        <div className="p-4 bg-white/95 rounded-2xl border border-slate-200/90 shadow-xs space-y-1">
          <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wide">Total Orders</span>
          <p className="heading-font text-2xl font-black text-emerald-600">{ordersCount}</p>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 border ${
            activeTab === 'products'
              ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white border-orange-500 shadow-md shadow-orange-500/20'
              : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Products & Categories ({products.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 border relative ${
            activeTab === 'orders'
              ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white border-orange-500 shadow-md shadow-orange-500/20'
              : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-slate-50'
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
        <div className="space-y-6 animate-fadeIn pb-12">
          {/* Action Bar & Add Category */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-white/95 rounded-2xl border border-slate-200/90 shadow-xs">
            <div>
              <h2 className="heading-font text-base font-extrabold text-slate-900">Product Catalog & Category Controls</h2>
              <p className="text-xs text-slate-500 font-medium">Edit categories, title limits, price, and warranty badges (Green vs Red logo).</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAddCategory(!showAddCategory)}
                className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <FolderPlus className="w-4 h-4 text-orange-600" />
                <span>+ Category</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEditingProduct(null);
                  setIsEditorOpen(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white text-xs font-black shadow-md shadow-orange-500/20 transition-all flex items-center gap-2 transform active:scale-95"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Add Product</span>
              </button>
            </div>
          </div>

          {/* Add Category Drawer */}
          {showAddCategory && (
            <div className="p-4 bg-white border border-orange-300 rounded-2xl flex items-center gap-3 shadow-md animate-fadeIn">
              <input
                type="text"
                value={newCategoryInput}
                onChange={(e) => setNewCategoryInput(e.target.value)}
                placeholder="Enter new category name (e.g. AI Coding, Video Tools)..."
                className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-none focus:border-orange-500 focus:bg-white"
              />
              <button
                type="button"
                onClick={handleAddCategory}
                className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-xs"
              >
                Save Category
              </button>
            </div>
          )}

          {/* Category List Tags */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-xs font-bold text-slate-500 shrink-0">Active Categories:</span>
            {categories.map((cat) => (
              <span
                key={cat}
                className="px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-xs font-bold shrink-0 flex items-center gap-1 shadow-2xs"
              >
                <Tag className="w-3 h-3 text-orange-500" />
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
                  className="p-4 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 space-y-3 relative overflow-hidden flex flex-col justify-between hover:shadow-md hover:border-orange-200 transition-all"
                >
                  <div>
                    {/* Top Row: Category & Action Buttons */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10.5px] font-extrabold text-orange-700 bg-orange-50 px-2.5 py-0.5 rounded-md border border-orange-200/80">
                        {prod.category}
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingProduct(prod);
                            setIsEditorOpen(true);
                          }}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
                          title="Edit product"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(prod.id)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Delete product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Product Name & Description */}
                    <h3 className="heading-font text-sm font-extrabold text-slate-900 line-clamp-1 mb-1">
                      {prod.name}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-snug mb-3">
                      {prod.shortDescription}
                    </p>
                  </div>

                  {/* Bottom Row: Price, Stock & Warranty Badge */}
                  <div className="pt-3 border-t border-slate-100 space-y-2.5 mt-auto">
                    {/* Warranty Logo / Badge (Green for Warranty, Red for No Warranty) */}
                    {isWarrantyActive ? (
                      <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate">{prod.warranty || 'Warranty Included'}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        <span className="truncate">No Warranty</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="text-sm font-black text-emerald-600">
                        {prod.currency || '$'}{prod.price.toFixed(2)}
                      </div>
                      <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60">
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
