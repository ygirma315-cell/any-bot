'use client';

import React, { useState, useEffect } from 'react';
import { Product } from '@/config/products';
import { ShieldCheck, ShieldAlert, X, Plus, Trash2, Check, AlertCircle } from 'lucide-react';

interface ProductEditorModalProps {
  product: Product | null; // null for creating new
  categories: string[];
  onSave: (product: Product) => void;
  onClose: () => void;
}

export const ProductEditorModal: React.FC<ProductEditorModalProps> = ({
  product,
  categories,
  onSave,
  onClose
}) => {
  const [id, setId] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [category, setCategory] = useState<string>('AI Assistants');
  const [customCategory, setCustomCategory] = useState<string>('');
  const [price, setPrice] = useState<number>(5.0);
  const [stock, setStock] = useState<number>(10);
  const [shortDescription, setShortDescription] = useState<string>('');
  const [fullDescription, setFullDescription] = useState<string>('');
  
  // Warranty settings
  const [isWarranty, setIsWarranty] = useState<boolean>(true);
  const [warrantyText, setWarrantyText] = useState<string>('30 Days Warranty');
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
      setShortDescription(product.shortDescription);
      setFullDescription(product.fullDescription);
      setIsWarranty(product.isWarranty !== false);
      setWarrantyText(product.warranty || '30 Days Warranty');
      setWarrantyDays(product.warrantyDays || 30);
      setFeatures(product.features || []);
    } else {
      setId(`prod-${Date.now().toString().slice(-6)}`);
    }
  }, [product]);

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
      warranty: isWarranty ? warrantyText.trim() : 'No Warranty',
      warrantyDays: isWarranty ? Number(warrantyDays) : 0,
      available: stock > 0,
      stock: Number(stock),
      category: finalCategory,
      logoPath: product?.logoPath || '/assets/products/chatgpt.png',
      accentColor: product?.accentColor || 'rgba(99, 102, 241, 0.4)',
      features: features.filter((f) => f.trim().length > 0)
    };

    onSave(updatedProduct);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 text-slate-100 shadow-2xl space-y-5 my-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="heading-font text-lg font-bold text-white flex items-center gap-2">
            {product ? '✏️ Edit Product' : '➕ Add New Product'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Category Selector */}
          <div>
            <label className="font-bold text-slate-300 block mb-1">
              Product Category <span className="text-rose-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium focus:outline-none focus:border-indigo-500"
            >
              {categories.filter(c => c !== 'All').map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
              <option value="NEW_CATEGORY">+ Create New Category...</option>
            </select>

            {category === 'NEW_CATEGORY' && (
              <input
                type="text"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="Enter new category name"
                className="w-full mt-2 p-2.5 bg-slate-800 border border-indigo-500 rounded-xl text-white font-medium focus:outline-none"
              />
            )}
          </div>

          {/* Product Name (With Character Limit) */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-bold text-slate-300">
                Product Title / Name <span className="text-rose-500">*</span>
              </label>
              <span className={`text-[10px] font-bold ${name.length >= MAX_NAME_LENGTH ? 'text-rose-400' : 'text-slate-400'}`}>
                {name.length}/{MAX_NAME_LENGTH} chars
              </span>
            </div>
            <input
              type="text"
              maxLength={MAX_NAME_LENGTH}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. ChatGPT Plus 1-Month"
              className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-semibold focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Price & Stock Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-300 block mb-1">
                Price ($ USD) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-semibold focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-300 block mb-1">
                Stock Quantity
              </label>
              <input
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-semibold focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Short Description (With Limit) */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-bold text-slate-300">
                Short Description (Card Subtitle)
              </label>
              <span className={`text-[10px] font-bold ${shortDescription.length >= MAX_SHORT_DESC_LENGTH ? 'text-rose-400' : 'text-slate-400'}`}>
                {shortDescription.length}/{MAX_SHORT_DESC_LENGTH} chars
              </span>
            </div>
            <input
              type="text"
              maxLength={MAX_SHORT_DESC_LENGTH}
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="e.g. GPT-4o, DALL·E 3, Canvas & Voice Mode"
              className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Full Description (With Limit) */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-bold text-slate-300">
                Full Info / Details (Flipped Card View)
              </label>
              <span className={`text-[10px] font-bold ${fullDescription.length >= MAX_FULL_DESC_LENGTH ? 'text-rose-400' : 'text-slate-400'}`}>
                {fullDescription.length}/{MAX_FULL_DESC_LENGTH} chars
              </span>
            </div>
            <textarea
              rows={3}
              maxLength={MAX_FULL_DESC_LENGTH}
              value={fullDescription}
              onChange={(e) => setFullDescription(e.target.value)}
              placeholder="Provide full description for customer..."
              className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500 custom-scrollbar"
            />
          </div>

          {/* Warranty Configuration Section */}
          <div className="p-3.5 bg-slate-800/80 rounded-2xl border border-slate-700 space-y-3">
            <label className="font-extrabold text-white block uppercase tracking-wide">
              🛡️ Warranty Configuration
            </label>

            {/* Choice: Warranty vs No Warranty */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsWarranty(true)}
                className={`p-3 rounded-xl border font-bold flex items-center justify-center gap-2 transition-all ${
                  isWarranty
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-md'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Warranty</span>
              </button>

              <button
                type="button"
                onClick={() => setIsWarranty(false)}
                className={`p-3 rounded-xl border font-bold flex items-center justify-center gap-2 transition-all ${
                  !isWarranty
                    ? 'bg-rose-500/20 border-rose-500 text-rose-400 shadow-md'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>No Warranty</span>
              </button>
            </div>

            {/* If Warranty is chosen, render duration inputs */}
            {isWarranty ? (
              <div className="space-y-2 pt-2 border-t border-slate-700 animate-fadeIn">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">
                      Warranty Display Text
                    </label>
                    <input
                      type="text"
                      value={warrantyText}
                      onChange={(e) => setWarrantyText(e.target.value)}
                      placeholder="e.g. 30 Days Warranty"
                      className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">
                      Duration Days
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={warrantyDays}
                      onChange={(e) => setWarrantyDays(Number(e.target.value))}
                      className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs"
                    />
                  </div>
                </div>
                {/* Live Logo Badge Preview */}
                <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-900/30 border border-emerald-500/40 text-emerald-300 text-[11px]">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Preview Badge: <strong>{warrantyText || `${warrantyDays} Days Warranty`}</strong> (Green Logo)</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-rose-900/30 border border-rose-500/40 text-rose-300 text-[11px] animate-fadeIn">
                <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Preview Badge: <strong>No Warranty</strong> (Red Logo)</span>
              </div>
            )}
          </div>

          {/* Features / Service Rules (Max 4 items) */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="font-bold text-slate-300">
                Service Rules / Features (Max 4 items)
              </label>
              {features.length < 4 && (
                <button
                  type="button"
                  onClick={handleAddFeature}
                  className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
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
                  className="flex-1 p-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveFeature(idx)}
                  className="p-2 text-slate-400 hover:text-rose-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Submit Action Buttons */}
          <div className="pt-4 border-t border-slate-800 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-lg flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Save Product</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
