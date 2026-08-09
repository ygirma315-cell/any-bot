'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Info, Plus, Check, ShieldCheck, ArrowLeft } from 'lucide-react';
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
        <div className="card-face p-3.5 flex flex-col justify-between border border-slate-200/80 shadow-sm rounded-2xl relative overflow-hidden group hover:shadow-md transition-all duration-300 bg-white/90 backdrop-blur-md">
          
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

              {cartQuantity > 0 && (
                <span className="text-[10px] font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200/60">
                  {cartQuantity} in cart
                </span>
              )}
            </div>

            {/* Product Title & Description */}
            <h3 className="heading-font text-xs font-bold text-slate-900 leading-tight mb-1 line-clamp-1">
              {product.name}
            </h3>
            <p className="text-[10.5px] text-slate-500 line-clamp-2 leading-snug mb-2.5">
              {product.shortDescription}
            </p>
          </div>

          {/* Bottom Section: Price, Warranty & Action Buttons */}
          <div className="mt-auto">
            {/* Warranty Badge */}
            <div className="flex items-center gap-1 text-[10.5px] font-semibold text-emerald-700 bg-emerald-50/90 px-2 py-0.5 rounded-lg border border-emerald-200/60 mb-2.5">
              <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
              <span className="truncate">{product.warranty}</span>
            </div>

            {/* Price */}
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-baseline gap-0.5">
                <span className="text-[11px] font-semibold text-slate-500">{product.currency}</span>
                <span className="text-base font-extrabold text-slate-900">{product.price}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={handleFlip}
                className="py-1.5 px-2 rounded-full text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200/80 flex items-center justify-center gap-1 transition-all"
              >
                <Info className="w-3 h-3 text-slate-500" />
                <span>Info</span>
              </button>

              <button
                type="button"
                onClick={handleAdd}
                className={`btn-pill btn-pill-primary text-[11px] py-1.5 px-2 font-bold flex justify-center transition-all ${
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
        {/* Tapping anywhere on the back face flips it back smoothly! Overflow is hidden (no scrolling) */}
        <div
          onClick={handleFlip}
          className="card-face card-face-back p-3 flex flex-col justify-between border border-indigo-200/80 shadow-md rounded-2xl bg-white/95 backdrop-blur-md cursor-pointer select-none overflow-hidden"
        >
          <div>
            {/* Top Bar: Fixed Back Button & Warranty Badge */}
            <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-100">
              <button
                type="button"
                onClick={handleFlip}
                className="py-0.5 px-2 rounded-full text-[10px] font-bold bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 border border-slate-200 flex items-center gap-1 transition-all shadow-xs"
              >
                <ArrowLeft className="w-3 h-3 text-slate-600" />
                <span>Back</span>
              </button>

              <span className="text-[9.5px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200/60">
                🛡 {product.warrantyDays}D Warranty
              </span>
            </div>

            <h4 className="heading-font text-xs font-bold text-slate-900 mb-0.5 truncate">
              {product.name}
            </h4>
            <p className="text-[10px] text-slate-600 leading-tight mb-2 line-clamp-2">
              {product.fullDescription}
            </p>

            <div className="space-y-1">
              <p className="text-[9.5px] font-bold text-slate-700 uppercase tracking-tight">Terms & Rules:</p>
              {product.features.slice(0, 3).map((feat, idx) => (
                <div key={idx} className="flex items-start gap-1 text-[9.5px] text-slate-600 leading-tight">
                  <span className="text-emerald-500 font-bold">•</span>
                  <span className="line-clamp-1">{feat}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-1.5 border-t border-slate-100 text-center">
            <span className="text-[9.5px] font-medium text-indigo-600">
              👆 Tap card to return
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
