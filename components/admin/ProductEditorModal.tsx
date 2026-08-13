'use client';

import React, { useState, useEffect } from 'react';
import { Product } from '@/config/products';
import { ShieldCheck, ShieldAlert, X, Plus, Trash2, Check, AlertCircle } from 'lucide-react';

interface ProductEditorModalProps {
  product: Product | null; // null for creating new
  categories: string[];
  defaultSortOrder?: number;
  onSave: (product: Product) => void;
  onClose: () => void;
}

export const ProductEditorModal: React.FC<ProductEditorModalProps> = ({
  product,
  categories,
  defaultSortOrder = 1,
  onSave,
  onClose
}) => {
  const [id, setId] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [category, setCategory] = useState<string>('AI Assistants');
  const [customCategory, setCustomCategory] = useState<string>('');
  const [price, setPrice] = useState<number>(5.0);
  const [stock, setStock] = useState<number>(10);
  const [sortOrder, setSortOrder] = useState<number>(1);
  const [shortDescription, setShortDescription] = useState<string>('');
  const [fullDescription, setFullDescription] = useState<string>('');
  
  // Warranty settings
  const [isWarranty, setIsWarranty] = useState<boolean>(true);
  const [warrantyDays, setWarrantyDays] = useState<number>(30);

  // Features list
  const [features, setFeatures] = useState<string[]>(['Full account access', 'Replacement guarantee']);

  // Character limit constants
  const MAX_NAME_LENGTH = 35;
  const MAX_SHORT_DESC_LENGTH = 75;
  const MAX_FULL_DESC_LENGTH = 200;
  const MAX_FEATURE_LENGTH = 50;

  useEffect(() => {
    if (product) {
      setId(product.id);
      setName(product.name);
      setCategory(product.category || 'AI Assistants');
      setPrice(product.price);
      setStock(product.stock);
      setSortOrder(Number(product.sortOrder) || 1);
      setShortDescription(product.shortDescription);
      setFullDescription(product.fullDescription);
      setIsWarranty(product.isWarranty !== false);
      setWarrantyDays(product.warrantyDays || 30);
      setFeatures(product.features || []);
    } else {
      setId(`prod-${Date.now().toString().slice(-6)}`);
      setSortOrder(defaultSortOrder);
    }
  }, [product, defaultSortOrder]);

  const handleAddFeature = () => {
    if (features.length < 4) {
      setFeatures([...features, '']);
    }
  };

  const handleUpdateFeature = (index: number, val: string) => {
    const next = [...features];
    next[index] = val.slice(0, MAX_FEATURE_LENGTH);
    setFeatures(next);
  };

  const handleRemoveFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter a product name.');
      return;
    }

    const finalCategory = category === 'NEW_CATEGORY' ? customCategory.trim() || 'Custom Category' : category;

    const updatedProduct: Product = {
      id: id || `prod-${Date.now()}`,
      name: name.trim().slice(0, MAX_NAME_LENGTH),
      shortDescription: shortDescription.trim().slice(0, MAX_SHORT_DESC_LENGTH),
      fullDescription: fullDescription.trim().slice(0, MAX_FULL_DESC_LENGTH),
      price: Number(price),
      currency: '$',
      isWarranty,
      warranty: isWarranty ? `${Number(warrantyDays)} Days Warranty` : 'No Warranty',
      warrantyDays: isWarranty ? Number(warrantyDays) : 0,
      available: stock > 0,
      stock: Number(stock),
      sortOrder: Number(sortOrder) || 0,
      category: finalCategory,
      logoPath: product?.logoPath || '/assets/products/chatgpt.png',
      accentColor: product?.accentColor || 'rgba(249, 115, 22, 0.4)',
      features: features.filter((f) => f.trim().length > 0)
    };

    onSave(updatedProduct);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200/90 rounded-3xl w-full max-w-lg p-6 text-slate-900 shadow-2xl space-y-5 my-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="heading-font text-lg font-black text-slate-900 flex items-center gap-2">
            {product ? '✏️ Edit Product' : '➕ Add New Product'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Category Selector */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Product Category <span className="text-rose-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/20"
            >
              {categories.filter(c => c !== 'All').map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
              <option value="NEW_CATEGORY">+ Create New Category...</option>
            </select>

            {category === 'NEW_CATEGORY' && (
              <div className="mt-2 relative">
                <input
                  type="text"
                  maxLength={22}
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="Enter new category name (Max 22 chars)"
                  className="w-full p-2.5 pr-16 bg-white border border-[#FF6B00] rounded-xl text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/20"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                  {customCategory.length}/22
                </span>
              </div>
            )}
          </div>

          {/* Product Name (With Character Limit) */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-bold text-slate-700">
                Product Title / Name <span className="text-rose-500">*</span>
              </label>
              <span className={`text-[10px] font-bold ${name.length >= MAX_NAME_LENGTH ? 'text-rose-500' : 'text-slate-400'}`}>
                {name.length}/{MAX_NAME_LENGTH} chars
              </span>
            </div>
            <input
              type="text"
              maxLength={MAX_NAME_LENGTH}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. ChatGPT Plus 1-Month"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/20"
            />
          </div>

          {/* Price, Stock & Sort Position Row */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Price ($ USD) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-orange-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Stock Quantity
              </label>
              <input
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-orange-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Sort Position (#)
              </label>
              <input
                type="number"
                min="1"
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-orange-500 focus:bg-white"
              />
              <p className="text-[10px] text-slate-400 font-semibold mt-1">Position on store page (1 = first)</p>
            </div>
          </div>

          {/* Short Description (With Limit) */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-bold text-slate-700">
                Short Description (Card Subtitle)
              </label>
              <span className={`text-[10px] font-bold ${shortDescription.length >= MAX_SHORT_DESC_LENGTH ? 'text-rose-500' : 'text-slate-400'}`}>
                {shortDescription.length}/{MAX_SHORT_DESC_LENGTH} chars
              </span>
            </div>
            <input
              type="text"
              maxLength={MAX_SHORT_DESC_LENGTH}
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="e.g. GPT-4o, DALL·E 3, Canvas & Voice Mode"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:border-orange-500 focus:bg-white"
            />
          </div>

          {/* Full Description (With Limit) */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-bold text-slate-700">
                Full Info / Details (Flipped Card View)
              </label>
              <span className={`text-[10px] font-bold ${fullDescription.length >= MAX_FULL_DESC_LENGTH ? 'text-rose-500' : 'text-slate-400'}`}>
                {fullDescription.length}/{MAX_FULL_DESC_LENGTH} chars
              </span>
            </div>
            <textarea
              rows={3}
              maxLength={MAX_FULL_DESC_LENGTH}
              value={fullDescription}
              onChange={(e) => setFullDescription(e.target.value)}
              placeholder="Provide full description for customer..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:border-orange-500 focus:bg-white custom-scrollbar"
            />
          </div>

          {/* Warranty Configuration Section */}
          <div className="p-3.5 bg-orange-50/50 rounded-2xl border border-orange-200/80 space-y-3">
            <label className="font-extrabold text-orange-950 block uppercase tracking-wide">
              🛡️ Warranty Configuration
            </label>

            {/* Choice: Warranty vs No Warranty */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsWarranty(true)}
                className={`p-3 rounded-xl border font-extrabold flex items-center justify-center gap-2 transition-all ${
                  isWarranty
                    ? 'bg-emerald-500 text-white border-emerald-600 shadow-md scale-102'
                    : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Warranty</span>
              </button>

              <button
                type="button"
                onClick={() => setIsWarranty(false)}
                className={`p-3 rounded-xl border font-extrabold flex items-center justify-center gap-2 transition-all ${
                  !isWarranty
                    ? 'bg-rose-500 text-white border-rose-600 shadow-md scale-102'
                    : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800'
                }`}
              >
                <ShieldAlert className="w-4 h-4" />
                <span>No Warranty</span>
              </button>
            </div>

            {/* If Warranty is chosen, render duration number input */}
            {isWarranty ? (
              <div className="space-y-2 pt-2 border-t border-orange-200/60 animate-fadeIn">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Warranty Duration (Days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={warrantyDays}
                    onChange={(e) => setWarrantyDays(Number(e.target.value))}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs font-bold focus:outline-none focus:border-orange-500"
                  />
                </div>
                {/* Live Logo Badge Preview */}
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px]">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Preview Badge: <strong>{warrantyDays} Days Warranty</strong> (Green Badge)</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] animate-fadeIn">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Preview Badge: <strong>No Warranty</strong> (Red Badge)</span>
              </div>
            )}
          </div>

          {/* Features / Service Rules (Max 4 items) */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="font-bold text-slate-700">
                Service Rules / Features (Max 4 items)
              </label>
              {features.length < 4 && (
                <button
                  type="button"
                  onClick={handleAddFeature}
                  className="text-[11px] font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Rule
                </button>
              )}
            </div>

            {features.map((feat, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  maxLength={MAX_FEATURE_LENGTH}
                  value={feat}
                  onChange={(e) => handleUpdateFeature(idx, e.target.value)}
                  placeholder={`Rule #${idx + 1}`}
                  className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs font-semibold"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveFeature(idx)}
                  className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Submit Action Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-[#FF6B00] hover:bg-[#E66000] text-white font-bold text-xs rounded-xl shadow-xs hover:shadow-md flex items-center justify-center gap-1.5 transition-all"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Save Product</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
