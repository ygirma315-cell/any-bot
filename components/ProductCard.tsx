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
    <div className="card-flip-scene min-h-[290px]">
      <div className={`card-flip-inner min-h-[290px] ${isFlipped ? 'is-flipped' : ''}`}>
        
        {/* ==================== FRONT FACE ==================== */}
        <div className="card-face p-3.5 flex flex-col justify-between border border-slate-200/70 shadow-sm rounded-2xl relative overflow-hidden group hover:shadow-md transition-all duration-300">
          
          {/* Subtle Ambient Accent Glow Reflection */}
          <div
            className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl pointer-events-none opacity-40 transition-opacity"
            style={{ background: product.accentColor }}
          />

          <div>
            {/* Header: Category Badge & Logo */}
            <div className="flex items-start justify-between gap-1 mb-2.5">
              <div className="w-11 h-11 relative rounded-xl overflow-hidden shadow-xs border border-slate-100 bg-slate-50 flex items-center justify-center p-1">
                <Image
                  src={product.logoPath}
                  alt={product.name}
                  width={40}
                  height={40}
                  className="object-contain w-full h-full"
                />
              </div>

              <span className="text-[10px] font-bold text-slate-600 bg-slate-100/80 px-2 py-0.5 rounded-full border border-slate-200/50">
                {product.category}
              </span>
            </div>

            {/* Product Title & Description */}
            <h3 className="heading-font text-sm font-bold text-slate-900 leading-tight mb-1 line-clamp-1">
              {product.name}
            </h3>
            <p className="text-[11px] text-slate-500 line-clamp-2 leading-snug mb-3">
              {product.shortDescription}
            </p>
          </div>

          {/* Bottom Section: Price, Warranty & Action Buttons */}
          <div className="mt-auto">
            {/* Warranty Badge */}
            <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50/90 px-2 py-1 rounded-lg border border-emerald-200/60 mb-3">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="truncate">{product.warranty}</span>
            </div>

            {/* Price & Quantity Badge */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-baseline gap-0.5">
                <span className="text-xs font-semibold text-slate-500">{product.currency}</span>
                <span className="text-lg font-extrabold text-slate-900">{product.price}</span>
              </div>

              {cartQuantity > 0 && (
                <span className="text-[10px] font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200/60">
                  {cartQuantity} in cart
                </span>
              )}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={handleFlip}
                className="btn-pill text-[11px] py-1.5 px-2 bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 flex justify-center"
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
        <div className="card-face card-face-back p-3.5 flex flex-col justify-between border border-indigo-200/80 shadow-md rounded-2xl bg-white">
          <div>
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                Product Details
              </span>
              <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                🛡 {product.warrantyDays} Days Warranty
              </span>
            </div>

            <h4 className="heading-font text-xs font-bold text-slate-900 mb-1">
              {product.name}
            </h4>
            <p className="text-[11px] text-slate-600 leading-normal mb-3">
              {product.fullDescription}
            </p>

            <div className="space-y-1.5 mb-3">
              <p className="text-[10px] font-bold text-slate-700 uppercase tracking-tight">Terms & Rules:</p>
              {product.features.map((feat, idx) => (
                <div key={idx} className="flex items-start gap-1.5 text-[10.5px] text-slate-600">
                  <span className="text-emerald-500 font-bold">•</span>
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleFlip}
            className="btn-pill text-[11px] py-1.5 px-3 bg-slate-900 text-white border-none w-full justify-center mt-2 hover:bg-slate-800"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>Back to Card</span>
          </button>
        </div>

      </div>
    </div>
  );
};
