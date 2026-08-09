'use client';

import React from 'react';
import Image from 'next/image';
import { ShoppingBag, Plus, Minus, Trash2, ShieldCheck, ArrowRight, Sparkles, FileText } from 'lucide-react';
import { Product } from '@/config/products';
import { triggerHaptic } from '@/lib/telegram';

interface OrderItem {
  product: Product;
  quantity: number;
}

interface OrderScreenProps {
  cart: OrderItem[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onProceedToPayment: () => void;
  onBrowseServices: () => void;
}

export const OrderScreen: React.FC<OrderScreenProps> = ({
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToPayment,
  onBrowseServices
}) => {
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const total = subtotal;

  if (cart.length === 0) {
    return (
      <div className="px-4 py-12 flex flex-col items-center justify-center text-center space-y-5 min-h-[60vh]">
        {/* Empty State Vector Illustration */}
        <div className="relative w-28 h-28 rounded-3xl bg-gradient-to-tr from-slate-100 via-indigo-50 to-purple-50 p-[2px] shadow-sm flex items-center justify-center">
          <div className="w-full h-full bg-white rounded-[22px] flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-radial from-indigo-500/10 to-transparent" />
            <ShoppingBag className="w-12 h-12 text-slate-300 relative z-10" />
            <Sparkles className="w-5 h-5 text-indigo-400 absolute top-4 right-4 animate-pulse" />
          </div>
        </div>

        <div>
          <h2 className="heading-font text-lg font-bold text-slate-900">Your order is empty</h2>
          <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1 leading-relaxed">
            Choose a premium digital AI service to get started with instant delivery.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            onBrowseServices();
          }}
          className="btn-pill btn-pill-action px-6 py-3 text-xs font-bold shadow-md hover:shadow-lg transition-all"
        >
          <ShoppingBag className="w-4 h-4 text-indigo-400" />
          <span>Browse Services</span>
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 space-y-4 pb-12">
      {/* Header Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="heading-font text-lg font-bold text-slate-900">YOUR ORDER</h2>
          <p className="text-xs text-slate-500">Review selected services & rules before checkout</p>
        </div>
        <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
          {cart.reduce((sum, item) => sum + item.quantity, 0)} Items
        </span>
      </div>

      {/* Cart Items List */}
      <div className="space-y-3">
        {cart.map(({ product, quantity }) => (
          <div
            key={product.id}
            className="p-3.5 bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-xs space-y-3 transition-all hover:shadow-md"
          >
            {/* Top row: Logo, Info & Quantity controls */}
            <div className="flex items-center justify-between gap-3">
              {/* Logo */}
              <div className="w-12 h-12 relative rounded-xl bg-white p-1 border border-slate-100 shadow-xs flex items-center justify-center shrink-0">
                <Image
                  src={product.logoPath}
                  alt={product.name}
                  width={40}
                  height={40}
                  className="object-contain w-full h-full"
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="heading-font text-xs font-bold text-slate-900 truncate">
                  {product.name}
                </h3>
                <p className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1 mt-0.5">
                  <ShieldCheck className="w-3 h-3" />
                  <span>{product.warranty}</span>
                </p>
                <p className="text-xs font-extrabold text-slate-900 mt-1">
                  {product.currency}{product.price.toFixed(2)}{' '}
                  <span className="text-[10px] font-normal text-slate-400">each</span>
                </p>
              </div>

              {/* Quantity Controls & Remove */}
              <div className="flex flex-col items-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    onRemoveItem(product.id);
                  }}
                  className="text-slate-400 hover:text-rose-500 p-1 transition-colors"
                  title="Remove item"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                <div className="flex items-center gap-2 bg-slate-100/90 rounded-lg p-1 border border-slate-200/60">
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      onUpdateQuantity(product.id, -1);
                    }}
                    className="w-5 h-5 rounded-md bg-white text-slate-700 flex items-center justify-center text-xs font-bold shadow-xs hover:bg-slate-50"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-xs font-bold text-slate-900 px-1">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      onUpdateQuantity(product.id, 1);
                    }}
                    className="w-5 h-5 rounded-md bg-white text-slate-700 flex items-center justify-center text-xs font-bold shadow-xs hover:bg-slate-50"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* Rules & Regulations Section */}
            <div className="pt-2.5 border-t border-slate-100 bg-indigo-50/40 p-2.5 rounded-xl space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-indigo-900 uppercase tracking-tight flex items-center gap-1">
                  <FileText className="w-3 h-3 text-indigo-600" /> Rules & Service Terms:
                </span>
                <span className="text-[9.5px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/50">
                  {product.warrantyDays} Days Guarantee
                </span>
              </div>
              <div className="space-y-0.5">
                {product.features.map((rule, idx) => (
                  <p key={idx} className="text-[10.5px] text-slate-600 flex items-start gap-1">
                    <span className="text-indigo-500 font-bold">•</span>
                    <span>{rule}</span>
                  </p>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Calculation Box */}
      <div className="p-4 bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between text-xs text-slate-600">
          <span>Subtotal</span>
          <span className="font-semibold text-slate-900">${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between text-xs text-slate-600">
          <span>Instant Service Delivery</span>
          <span className="font-semibold text-emerald-600">FREE</span>
        </div>
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-sm">
          <span className="font-bold text-slate-900">TOTAL</span>
          <span className="heading-font text-lg font-extrabold text-indigo-600">${total.toFixed(2)}</span>
        </div>
      </div>

      {/* Action Button */}
      <button
        type="button"
        onClick={() => {
          triggerHaptic('medium');
          onProceedToPayment();
        }}
        className="btn-pill btn-pill-primary w-full py-3.5 text-xs font-bold shadow-md hover:shadow-lg flex items-center justify-center gap-2"
      >
        <span>Continue to Payment</span>
        <ArrowRight className="w-4 h-4 text-indigo-600" />
      </button>
    </div>
  );
};
