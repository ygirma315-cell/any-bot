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
    <div className="card-flip-scene min-h-[300px]">
      <div className={`card-flip-inner min-h-[300px] ${isFlipped ? 'is-flipped' : ''}`}>
        
        {/* ==================== FRONT FACE ==================== */}
        <div className="card-face p-4 flex flex-col justify-between border border-slate-200/80 shadow-xs rounded-2xl relative overflow-hidden group hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 bg-white/90 backdrop-blur-md">
          
          {/* Subtle Ambient Accent Glow Reflection */}
          <div
            className="absolute top-0 right-0 w-28 h-28 rounded-full blur-2xl pointer-events-none opacity-50 transition-opacity"
            style={{ background: product.accentColor }}
          />

          <div>
            {/* Header: Product Logo */}
            <div className="flex items-center justify-between mb-2.5">
              <div className="w-12 h-12 relative rounded-xl overflow-hidden shadow-xs border border-slate-100 bg-white flex items-center justify-center p-1.5 shrink-0">
                <Image
                  src={product.logoPath}
                  alt={product.name}
                  width={40}
                  height={40}
                  className="object-contain w-full h-full"
                />
              </div>
            </div>

            {/* Product Title & Description */}
            <h3 className="heading-font text-xs font-bold text-slate-900 leading-tight mb-1 line-clamp-1">
              {product.name}
            </h3>
            <p className="text-[10.5px] text-slate-500 line-clamp-2 leading-snug mb-3">
              {product.shortDescription}
            </p>
          </div>

          {/* Bottom Section: Price, Stock, Warranty & Action Buttons */}
          <div className="mt-auto">
            {/* Warranty Badge */}
            <div className="flex items-center gap-1 text-[10.5px] font-semibold text-emerald-700 bg-emerald-50/90 px-2 py-1 rounded-lg border border-emerald-200/60 mb-2.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="truncate">{product.warranty}</span>
            </div>

            {/* Price (Green) & Stock Tag (Red) */}
            <div className="flex items-center justify-between mb-3">
              {/* Green Price Tag */}
              <div className="flex items-baseline gap-0.5">
                <span className="text-xs font-bold text-emerald-600">{product.currency}</span>
                <span className="text-lg font-extrabold text-emerald-600">{product.price}</span>
              </div>

              {/* Red Stock Tag */}
              <span className="text-[10px] font-extrabold text-rose-700 bg-rose-50/90 px-2 py-0.5 rounded-full border border-rose-200/70 flex items-center gap-1">
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
        {/* Tapping anywhere flips back. Overflow is hidden. Spacious layout with 300px card height */}
        <div
          onClick={handleFlip}
          className="card-face card-face-back p-4 flex flex-col justify-between border border-indigo-200/80 shadow-md rounded-2xl bg-white/95 backdrop-blur-md cursor-pointer select-none overflow-hidden"
        >
          <div>
            {/* Top Bar: Warranty Badge Aligned Right */}
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                Info & Terms
              </span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                🛡 {product.warrantyDays}D Warranty
              </span>
            </div>

            {/* Product Name */}
            <h4 className="heading-font text-xs font-extrabold text-slate-900 mb-1 truncate">
              {product.name}
            </h4>

            {/* Description (Spacious text with line-clamp-3) */}
            <p className="text-[10.5px] font-semibold text-slate-700 leading-snug mb-3 line-clamp-3">
              {product.fullDescription}
            </p>

            {/* Terms & Rules List */}
            <div className="space-y-1.5">
              <p className="text-[10px] font-extrabold text-slate-900 uppercase tracking-tight">Terms & Rules:</p>
              {product.features.slice(0, 3).map((feat, idx) => (
                <div key={idx} className="flex items-start gap-1 text-[10px] font-semibold text-slate-700 leading-tight">
                  <span className="text-emerald-500 font-extrabold">•</span>
                  <span className="line-clamp-1">{feat}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 text-center">
            <span className="text-[10px] font-bold text-indigo-600 flex items-center justify-center gap-1">
              👆 Tap card to return
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
