'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Product } from '@/config/products';
import { 
  ArrowUp, 
  ArrowDown, 
  Check, 
  X, 
  Sparkles, 
  GripVertical, 
  Layers 
} from 'lucide-react';

interface ProductSortModalProps {
  isOpen: boolean;
  products: Product[];
  onSave: (reordered: Product[]) => void;
  onClose: () => void;
}

export const ProductSortModal: React.FC<ProductSortModalProps> = ({
  isOpen,
  products,
  onSave,
  onClose
}) => {
  const [items, setItems] = useState<Product[]>([]);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      const sorted = [...products].sort((a, b) => (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0));
      setItems(sorted);
    }
  }, [isOpen, products]);

  if (!isOpen) return null;

  const moveUp = (index: number) => {
    if (index === 0) return;
    const next = [...items];
    const temp = next[index - 1];
    next[index - 1] = next[index];
    next[index] = temp;
    setItems(next);
  };

  const moveDown = (index: number) => {
    if (index === items.length - 1) return;
    const next = [...items];
    const temp = next[index + 1];
    next[index + 1] = next[index];
    next[index] = temp;
    setItems(next);
  };

  const handleSave = () => {
    setIsSaving(true);
    const updated = items.map((prod, index) => ({
      ...prod,
      sortOrder: index + 1
    }));
    onSave(updated);
    setIsSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col animate-scaleUp">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
          <div>
            <h2 className="heading-font text-base font-black text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-orange-600" />
              <span>Sort &amp; Rank Store Products</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Reorder how products appear from top to bottom on the store
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Product Reorder List */}
        <div className="p-4 sm:p-5 overflow-y-auto custom-scrollbar space-y-2 flex-1">
          {items.map((prod, index) => {
            const isFirst = index === 0;
            const isLast = index === items.length - 1;

            return (
              <div
                key={prod.id}
                className="p-3 bg-white hover:bg-slate-50/80 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between gap-3 transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Position Badge */}
                  <div className="w-7 h-7 rounded-xl bg-orange-50 border border-orange-200/80 text-orange-600 text-xs font-black flex items-center justify-center shrink-0">
                    #{index + 1}
                  </div>

                  {/* Product Logo & Name */}
                  <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-200 p-1 flex items-center justify-center shrink-0">
                    <Image
                      src={prod.logoPath || '/assets/products/chatgpt.png'}
                      alt={prod.name}
                      width={28}
                      height={28}
                      className="object-contain w-full h-full"
                    />
                  </div>

                  <div className="min-w-0">
                    <h4 className="text-xs font-black text-slate-900 truncate">{prod.name}</h4>
                    <p className="text-[10.5px] text-slate-500 font-semibold">{prod.category} &bull; ${prod.price.toFixed(2)}</p>
                  </div>
                </div>

                {/* Move Up / Move Down Buttons */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    disabled={isFirst}
                    onClick={() => moveUp(index)}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-30 text-slate-700 transition"
                    title="Move up"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    disabled={isLast}
                    onClick={() => moveDown(index)}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-30 text-slate-700 transition"
                    title="Move down"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/80 flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-extrabold text-xs rounded-xl transition"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSave}
            className="flex-1 py-2.5 bg-[#FF6B00] hover:bg-[#E66000] text-white font-extrabold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Save Order</span>
          </button>
        </div>

      </div>
    </div>
  );
};
