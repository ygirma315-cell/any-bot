'use client';

import React, { useState, useEffect } from 'react';
import { Search, Sparkles } from 'lucide-react';
import { Product } from '@/config/products';
import { ProductCard } from './ProductCard';
import { getStoredProducts, getStoredCategories, fetchProductsFromSupabase, fetchCategoriesFromSupabase } from '@/lib/store';
import { triggerHaptic } from '@/lib/telegram';

interface ProductGridProps {
  cart: { product: Product; quantity: number }[];
  onAddToCart: (product: Product) => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({ cart, onAddToCart }) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  const loadData = () => {
    setProducts(getStoredProducts());
    setCategories(getStoredCategories());

    fetchProductsFromSupabase().then((data) => {
      if (data && data.length > 0) setProducts(data);
    });
    fetchCategoriesFromSupabase().then((data) => {
      if (data && data.length > 0) setCategories(data);
    });
  };

  useEffect(() => {
    loadData();

    const handleUpdate = () => loadData();
    window.addEventListener('ai_store_products_updated', handleUpdate);
    window.addEventListener('ai_store_categories_updated', handleUpdate);

    return () => {
      window.removeEventListener('ai_store_products_updated', handleUpdate);
      window.removeEventListener('ai_store_categories_updated', handleUpdate);
    };
  }, []);


  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.shortDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'All' ||
      p.category.toLowerCase().trim() === selectedCategory.toLowerCase().trim();

    return matchesSearch && matchesCategory;
  });

  const getCartQuantity = (productId: string) => {
    const found = cart.find((item) => item.product.id === productId);
    return found ? found.quantity : 0;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-5 pb-28">
      {/* Top Search & Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input Bar */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search ChatGPT, Gemini, Claude, Cursor, Office..."
            className="w-full pl-10 pr-4 py-2.5 bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-xs transition-all"
          />
        </div>

        {/* Category Pills Filter Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar no-scrollbar scroll-smooth">
          {categories.map((cat) => {
            const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
            return (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setSelectedCategory(cat);
                }}
                className={`shrink-0 text-[11px] font-bold px-3.5 py-2 rounded-xl transition-all duration-200 border ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm scale-105'
                    : 'bg-white/90 text-slate-600 border-slate-200/80 hover:bg-slate-50 hover:text-slate-900 shadow-xs'
                }`}
              >
                {cat === 'All' ? '⚡ All AI' : cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Multi-Column Responsive Product Grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3 sm:gap-4 pb-8">
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
        <div className="text-center py-16 bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/80 p-8 space-y-2">
          <Sparkles className="w-8 h-8 text-indigo-400 mx-auto animate-pulse" />
          <p className="text-sm font-bold text-slate-800">No products found in this category</p>
          <p className="text-xs text-slate-500">Try selecting another category pill or clearing your search query.</p>
        </div>
      )}
    </div>
  );
};
