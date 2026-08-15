'use client';

import React, { useState } from 'react';
import { Product } from '@/config/products';
import { getStoredCategories, saveStoredCategories, saveStoredProducts, syncAdminDatabase } from '@/lib/store';
import { FolderPlus, Tag, Edit2, Trash2, Check, X, Layers, AlertCircle } from 'lucide-react';


interface AdminCategoriesViewProps {
  categories: string[];
  products: Product[];
  onRefresh: () => void;
}

export const AdminCategoriesView: React.FC<AdminCategoriesViewProps> = ({
  categories,
  products,
  onRefresh
}) => {
  const [newCategoryInput, setNewCategoryInput] = useState<string>('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [renameInput, setRenameInput] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const MAX_CATEGORY_LENGTH = 22;

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const trimmed = newCategoryInput.trim();
    if (!trimmed) {
      setErrorMsg('Category name cannot be empty.');
      return;
    }
    const cleanName = trimmed.slice(0, MAX_CATEGORY_LENGTH);
    if (categories.includes(cleanName)) {
      setErrorMsg('Category already exists.');
      return;
    }

    const updated = [...categories, cleanName];
    saveStoredCategories(updated);
    setNewCategoryInput('');
    onRefresh();
  };

  const handleStartRename = (cat: string) => {
    setEditingCategory(cat);
    setRenameInput(cat);
    setErrorMsg('');
  };

  const handleSaveRename = (oldName: string) => {
    setErrorMsg('');
    const trimmed = renameInput.trim();
    if (!trimmed) {
      setErrorMsg('Category name cannot be empty.');
      return;
    }
    const cleanName = trimmed.slice(0, MAX_CATEGORY_LENGTH);
    if (cleanName !== oldName && categories.includes(cleanName)) {
      setErrorMsg('Category name already exists.');
      return;
    }

    const updatedCats = categories.map(c => c === oldName ? cleanName : c);
    saveStoredCategories(updatedCats);

    const updatedProds = products.map(p => p.category === oldName ? { ...p, category: cleanName } : p);
    saveStoredProducts(updatedProds);

    setEditingCategory(null);
    setRenameInput('');
    onRefresh();
  };

  const handleDeleteCategory = (catToDelete: string) => {
    if (catToDelete === 'All') {
      alert('The default "All" category cannot be deleted.');
      return;
    }

    const linkedProducts = products.filter(p => p.category === catToDelete);
    if (linkedProducts.length > 0) {
      if (!confirm(`Warning: Category "${catToDelete}" contains ${linkedProducts.length} product(s). Are you sure you want to delete it?`)) {
        return;
      }
    } else {
      if (!confirm(`Delete category "${catToDelete}"?`)) return;
    }

    const updatedCats = categories.filter(c => c !== catToDelete);
    saveStoredCategories(updatedCats);
    syncAdminDatabase('delete-category', { name: catToDelete });
    onRefresh();
  };


  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header & Add Category Card */}
      <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_10px_rgba(15,23,42,0.04)] space-y-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#FF6B00]" />
            Category Management
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Add new categories or edit existing ones. Names are limited to 22 characters to preserve UI layout.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Add Category Form */}
        <form onSubmit={handleAddCategory} className="flex flex-col sm:flex-row items-stretch gap-3">
          <div className="flex-1 relative">
            <Tag className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              maxLength={MAX_CATEGORY_LENGTH}
              value={newCategoryInput}
              onChange={(e) => setNewCategoryInput(e.target.value)}
              placeholder="Enter new category name (Max 22 chars)..."
              className="w-full pl-10 pr-16 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#FF6B00] focus:bg-white"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-extrabold text-slate-400">
              {newCategoryInput.length}/{MAX_CATEGORY_LENGTH}
            </span>
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 bg-[#FF6B00] hover:bg-[#E66000] text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 shrink-0"
          >
            <FolderPlus className="w-4 h-4" />
            <span>+ Add Category</span>
          </button>
        </form>
      </div>

      {/* Categories Table & List */}
      <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_10px_rgba(15,23,42,0.04)] space-y-4">
        <h3 className="text-sm font-extrabold text-slate-900">Configured Store Categories</h3>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[500px]">
            <thead>
              <tr className="border-b border-slate-100 text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-3">CATEGORY NAME</th>
                <th className="py-3 px-3">PRODUCTS COUNT</th>
                <th className="py-3 px-3">STATUS</th>
                <th className="py-3 px-3 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium">
              {categories.map((cat) => {
                const count = products.filter(p => p.category === cat).length;
                const isEditing = editingCategory === cat;

                return (
                  <tr key={cat} className="hover:bg-slate-50/80 transition-colors">
                    {/* Category Name Column */}
                    <td className="py-3.5 px-3">
                      {isEditing ? (
                        <div className="flex items-center gap-2 relative max-w-xs">
                          <input
                            type="text"
                            maxLength={MAX_CATEGORY_LENGTH}
                            value={renameInput}
                            onChange={(e) => setRenameInput(e.target.value)}
                            className="w-full px-3 py-1.5 bg-white border border-[#FF6B00] rounded-lg text-xs font-bold text-slate-900 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveRename(cat)}
                            className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                            title="Save rename"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingCategory(null)}
                            className="p-1.5 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors"
                            title="Cancel"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Tag className="w-4 h-4 text-orange-500 shrink-0" />
                          <span className="font-extrabold text-slate-900">{cat}</span>
                          {cat === 'All' && (
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">Default</span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Associated Products Count */}
                    <td className="py-3.5 px-3">
                      <span className="inline-block text-[11px] font-black text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-md min-w-[28px] text-center">
                        {count}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-3">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-600">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span>Active</span>
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-3 text-right">
                      {cat !== 'All' && !isEditing && (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleStartRename(cat)}
                            className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:text-orange-600 hover:bg-orange-50 transition-colors text-xs font-bold flex items-center gap-1"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-orange-500" />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(cat)}
                            className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors text-xs font-bold flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
