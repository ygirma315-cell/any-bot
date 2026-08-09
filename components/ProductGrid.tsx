'use client';

import React, { useState } from 'react';
import { Search, Sparkles, SlidersHorizontal } from 'lucide-react';
import { PRODUCTS, Product } from '@/config/products';
import { ProductCard } from './ProductCard';
import { triggerHaptic } from '@/lib/telegram';

interface ProductGridProps {
  cart: { product: Product; quantity: number }[];
  onAddToCart: (product: Product) => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({ cart, onAddToCart }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories = ['All', 'AI Chatbot', 'AI Reasoning', 'AI Search', 'Design & AI', 'Video & AI', 'Entertainment', 'AI Art', 'AI Workspace'];

  const filteredProducts = PRODUCTS.filter((p) => {
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.shortDescription.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCartQuantity = (productId: string) => {
    const found = cart.find((item) => item.product.id === productId);
    return found ? found.quantity : 0;
  };

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Banner / Store Greeting */}
      <div className="relative rounded-2xl p-4 bg-gradient-to-r from-blue-900/90 via-indigo-900/90 to-purple-900/90 text-white shadow-md overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-xl pointer-events-none" />
        
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/15 backdrop-blur-sm text-[10px] font-semibold text-blue-200 mb-1.5 border border-white/10">
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>Instant AI Subscriptions</span>
            </div>
            <h2 className="heading-font text-lg font-bold text-white leading-tight">
              Available AI Services
            </h2>
            <p className="text-xs text-indigo-100/90 mt-0.5">
              Select any plan & receive instant warranty.
            </p>
          </div>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search ChatGPT, Gemini, Claude..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200/80 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-xs transition-all"
        />
      </div>

      {/* Horizontal Category Selector */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar -mx-1 px-1">
        {categories.map((cat) => {
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => {
                triggerHaptic('light');
                setSelectedCategory(cat);
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* 2-Column Mobile Product Grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 pb-8">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={onAddToCart}
              cartQuantity={getCartQuantity(product.id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 p-6">
          <p className="text-sm font-semibold text-slate-700">No products found</p>
          <p className="text-xs text-slate-500 mt-1">Try adjusting your search query or filter.</p>
        </div>
      )}
    </div>
  );
};
