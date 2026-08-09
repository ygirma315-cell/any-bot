'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Info, Plus, Check, ShieldCheck } from 'lucide-react';
import { Product } from '@/config/products';
import { triggerHaptic } from '@/lib/telegram';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  cartQuantity: number;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart, cartQuantity }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAddedAnim, setIsAddedAnim] = useState(false);

  const handleFlip = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('light');
    setIsFlipped(!isFlipped);
  };

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('medium');
    onAddToCart(product);
    setIsAddedAnim(true);
    setTimeout(() => setIsAddedAnim(false), 900);
  };

  return (
    <div className="card-flip-scene min-h-[275px]">
      <div className={`card-flip-inner min-h-[275px] ${isFlipped ? 'is-flipped' : ''}`}>
        
        {/* ==================== FRONT FACE ==================== */}
        <div className="card-face p-3.5 flex flex-col justify-between border border-slate-200/80 shadow-xs rounded-2xl relative overflow-hidden group hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 bg-white/90 backdrop-blur-md">
          
          {/* Subtle Ambient Accent Glow Reflection */}
          <div
            className="absolute top-0 right-0 w-28 h-28 rounded-full blur-2xl pointer-events-none opacity-50 transition-opacity"
            style={{ background: product.accentColor }}
          />

          <div>
            {/* Header: Product Logo */}
            <div className="flex items-center justify-between mb-2">
              <div className="w-11 h-11 relative rounded-xl overflow-hidden shadow-xs border border-slate-100 bg-white flex items-center justify-center p-1.5 shrink-0">
                <Image
                  src={product.logoPath}
                  alt={product.name}
                  width={38}
                  height={38}
                  className="object-contain w-full h-full"
                />
              </div>
            </div>

            {/* Product Title & Description */}
            <h3 className="heading-font text-xs font-bold text-slate-900 leading-tight mb-1 line-clamp-1">
              {product.name}
            </h3>
            <p className="text-[10.5px] text-slate-500 line-clamp-2 leading-snug mb-2.5">
              {product.shortDescription}
            </p>
          </div>

          {/* Bottom Section: Price, Stock, Warranty & Action Buttons */}
          <div className="mt-auto">
            {/* Warranty Badge */}
            <div className="flex items-center gap-1 text-[10.5px] font-semibold text-emerald-700 bg-emerald-50/90 px-2 py-0.5 rounded-lg border border-emerald-200/60 mb-2.5">
              <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
              <span className="truncate">{product.warranty}</span>
            </div>

            {/* Price (Green) & Stock Tag (Red) */}
            <div className="flex items-center justify-between mb-2.5">
              {/* Green Price Tag */}
              <div className="flex items-baseline gap-0.5">
                <span className="text-[11px] font-bold text-emerald-600">{product.currency}</span>
                <span className="text-base font-extrabold text-emerald-600">{product.price}</span>
              </div>

              {/* Red Stock Tag */}
              <span className="text-[9.5px] font-extrabold text-rose-700 bg-rose-50/90 px-2 py-0.5 rounded-full border border-rose-200/70 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                <span>{product.stock} Stock</span>
              </span>
            </div>

            {/* Action Buttons with Rotating RGB Borders */}
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={handleFlip}
                className="btn-rgb-border text-[11px] py-1.5 px-2 font-bold"
              >
                <Info className="w-3 h-3 text-indigo-600" />
                <span>Info</span>
              </button>

              <button
                type="button"
                onClick={handleAdd}
                className={`btn-rgb-border text-[11px] py-1.5 px-2 font-extrabold transition-all ${
                  isAddedAnim ? 'scale-95 bg-emerald-600 text-white' : ''
                }`}
              >
                {isAddedAnim ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span>Added</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3 h-3 text-indigo-600" />
                    <span>Add</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ==================== BACK FACE (INFO) ==================== */}
        {/* Tapping anywhere flips back. Overflow is hidden (no internal scrolling). Text is bold & high contrast */}
        <div
          onClick={handleFlip}
          className="card-face card-face-back p-3.5 flex flex-col justify-between border border-indigo-200/80 shadow-md rounded-2xl bg-white/95 backdrop-blur-md cursor-pointer select-none overflow-hidden"
        >
          <div>
            {/* Top Bar: Warranty Badge Aligned Right (Removed Back Button per request) */}
            <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                Info & Terms
              </span>
              <span className="text-[9.5px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                🛡 {product.warrantyDays}D Warranty
              </span>
            </div>

            {/* Product Name (Bold) */}
            <h4 className="heading-font text-xs font-extrabold text-slate-900 mb-1 truncate">
              {product.name}
            </h4>

            {/* Description (Bolder text for high legibility) */}
            <p className="text-[10.5px] font-semibold text-slate-800 leading-snug mb-2.5 line-clamp-2">
              {product.fullDescription}
            </p>

            {/* Terms & Rules (Bold List) */}
            <div className="space-y-1">
              <p className="text-[10px] font-extrabold text-slate-900 uppercase tracking-tight">Terms & Rules:</p>
              {product.features.slice(0, 3).map((feat, idx) => (
                <div key={idx} className="flex items-start gap-1 text-[10px] font-semibold text-slate-700 leading-tight">
                  <span className="text-emerald-500 font-extrabold">•</span>
                  <span className="line-clamp-1">{feat}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-1.5 border-t border-slate-100 text-center">
            <span className="text-[10px] font-bold text-indigo-600 flex items-center justify-center gap-1">
              👆 Tap card to return
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
