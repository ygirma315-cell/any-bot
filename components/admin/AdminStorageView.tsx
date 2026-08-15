'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Product } from '@/config/products';
import { 
  ProductStorageItem, 
  getStoredStorage, 
  fetchStorageFromSupabase, 
  addStorageItems, 
  deleteStorageItem,
  saveStoredStorage,
  saveStoredProducts,
  getStoredProducts
} from '@/lib/store';
import { 
  Database, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  Eye, 
  EyeOff, 
  ExternalLink, 
  Key, 
  ShieldCheck, 
  AlertCircle, 
  Search, 
  Filter, 
  RefreshCw,
  Layers,
  ChevronDown,
  ChevronUp,
  Package,
  FileText,
  Lock,
  Sparkles,
  Link as LinkIcon,
  UserCheck,
  Edit2,
  X
} from 'lucide-react';

interface AdminStorageViewProps {
  products: Product[];
  onRefreshProducts?: () => void;
}

interface NewItemRow {
  type: 'account' | 'link' | 'key' | 'text';
  username?: string;
  password?: string;
  link?: string;
  notes?: string;
}

export const AdminStorageView: React.FC<AdminStorageViewProps> = ({ products, onRefreshProducts }) => {
  const [storageItems, setStorageItems] = useState<ProductStorageItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);

  // Add Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [selectedProductForAdd, setSelectedProductForAdd] = useState<Product | null>(null);
  const [itemType, setItemType] = useState<'account' | 'link' | 'key' | 'text'>('account');
  const [itemRows, setItemRows] = useState<NewItemRow[]>([
    { type: 'account', username: '', password: '', notes: '' }
  ]);
  const [bulkMode, setBulkMode] = useState<boolean>(false);
  const [bulkText, setBulkText] = useState<string>('');
  const [syncStock, setSyncStock] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Edit Single Item Modal State
  const [editingItem, setEditingItem] = useState<ProductStorageItem | null>(null);
  const [editType, setEditType] = useState<'account' | 'link' | 'key' | 'text'>('account');
  const [editUsername, setEditUsername] = useState<string>('');
  const [editPassword, setEditPassword] = useState<string>('');
  const [editLink, setEditLink] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');

  // Visible Passwords & Copied feedback
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadStorage = async () => {
    setLoading(true);
    const data = await fetchStorageFromSupabase();
    setStorageItems(data);
    setLoading(false);
  };

  useEffect(() => {
    loadStorage();
    const handleUpdate = () => {
      setStorageItems(getStoredStorage());
    };
    window.addEventListener('ai_store_storage_updated', handleUpdate);
    return () => window.removeEventListener('ai_store_storage_updated', handleUpdate);
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const openAddModal = (product?: Product) => {
    const target = product || products[0] || null;
    setSelectedProductForAdd(target);
    setItemType('account');
    setItemRows([{ type: 'account', username: '', password: '', notes: '' }]);
    setBulkMode(false);
    setBulkText('');
    setSyncStock(true);
    setIsAddModalOpen(true);
  };

  const openEditModal = (item: ProductStorageItem) => {
    setEditingItem(item);
    setEditType(item.type || 'account');
    setEditUsername(item.username || '');
    setEditPassword(item.password || '');
    setEditLink(item.link || '');
    setEditNotes(item.notes || '');
  };

  const handleSaveEditedItem = () => {
    if (!editingItem) return;

    const current = getStoredStorage();
    const updated = current.map(item => {
      if (item.id === editingItem.id) {
        return {
          ...item,
          type: editType,
          username: editUsername.trim() || undefined,
          password: editPassword.trim() || undefined,
          link: editLink.trim() || undefined,
          notes: editNotes.trim() || undefined
        };
      }
      return item;
    });

    saveStoredStorage(updated, true);
    setStorageItems(updated);
    setEditingItem(null);
  };

  const addRow = () => {
    setItemRows(prev => [...prev, { type: itemType, username: '', password: '', link: '', notes: '' }]);
  };

  const removeRow = (index: number) => {
    if (itemRows.length <= 1) return;
    setItemRows(prev => prev.filter((_, i) => i !== index));
  };

  const updateRow = (index: number, field: keyof NewItemRow, val: string) => {
    setItemRows(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const handleSaveItems = async () => {
    if (!selectedProductForAdd) {
      alert('Please select a product.');
      return;
    }

    setIsSaving(true);
    const itemsToAdd: Omit<ProductStorageItem, 'id' | 'is_used' | 'created_at'>[] = [];

    if (bulkMode) {
      const lines = bulkText.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length === 0) {
        alert('Please enter at least one line of credentials/links.');
        setIsSaving(false);
        return;
      }

      for (const line of lines) {
        if (itemType === 'account') {
          const parts = line.split(/[:|,\t ]+/);
          const username = parts[0]?.trim() || '';
          const password = parts.slice(1).join(':').trim() || '';
          if (username) {
            itemsToAdd.push({
              product_id: selectedProductForAdd.id,
              type: 'account',
              username,
              password,
              notes: 'Log in with provided credentials. Enjoy your subscription!'
            });
          }
        } else if (itemType === 'link') {
          itemsToAdd.push({
            product_id: selectedProductForAdd.id,
            type: 'link',
            link: line,
            notes: 'Open direct access link to use your activated service.'
          });
        } else if (itemType === 'key') {
          itemsToAdd.push({
            product_id: selectedProductForAdd.id,
            type: 'key',
            password: line,
            notes: 'Activate using this license key.'
          });
        } else {
          itemsToAdd.push({
            product_id: selectedProductForAdd.id,
            type: 'text',
            notes: line
          });
        }
      }
    } else {
      for (const row of itemRows) {
        if (itemType === 'account' && (row.username?.trim() || row.password?.trim())) {
          itemsToAdd.push({
            product_id: selectedProductForAdd.id,
            type: 'account',
            username: row.username?.trim(),
            password: row.password?.trim(),
            notes: row.notes?.trim() || 'Log in with provided credentials.'
          });
        } else if (itemType === 'link' && row.link?.trim()) {
          itemsToAdd.push({
            product_id: selectedProductForAdd.id,
            type: 'link',
            link: row.link?.trim(),
            notes: row.notes?.trim() || 'Open direct access link.'
          });
        } else if (itemType === 'key' && row.password?.trim()) {
          itemsToAdd.push({
            product_id: selectedProductForAdd.id,
            type: 'key',
            password: row.password?.trim(),
            notes: row.notes?.trim() || 'Activate with license key.'
          });
        } else if (itemType === 'text' && row.notes?.trim()) {
          itemsToAdd.push({
            product_id: selectedProductForAdd.id,
            type: 'text',
            notes: row.notes.trim()
          });
        }
      }
    }

    if (itemsToAdd.length === 0) {
      alert('No valid items to add.');
      setIsSaving(false);
      return;
    }

    await addStorageItems(itemsToAdd);

    if (syncStock && selectedProductForAdd) {
      const allStored = getStoredStorage();
      const availableForProd = allStored.filter(
        i => i.product_id === selectedProductForAdd.id && !i.is_used
      ).length;

      const currentProds = getStoredProducts();
      const updatedProds = currentProds.map(p => {
        if (p.id === selectedProductForAdd.id) {
          return { ...p, stock: availableForProd, available: availableForProd > 0 };
        }
        return p;
      });
      saveStoredProducts(updatedProds);
      if (onRefreshProducts) onRefreshProducts();
    }

    setIsSaving(false);
    setIsAddModalOpen(false);
    setExpandedProductId(selectedProductForAdd.id);
  };

  const handleDeleteItem = async (itemId: string, productId: string) => {
    if (!confirm('Are you sure you want to delete this storage item?')) return;
    await deleteStorageItem(itemId);

    const allStored = getStoredStorage();
    const availableForProd = allStored.filter(
      i => i.product_id === productId && !i.is_used && i.id !== itemId
    ).length;

    const currentProds = getStoredProducts();
    const updatedProds = currentProds.map(p => {
      if (p.id === productId) {
        return { ...p, stock: availableForProd, available: availableForProd > 0 };
      }
      return p;
    });
    saveStoredProducts(updatedProds);
    if (onRefreshProducts) onRefreshProducts();
  };

  // Filter products by Category & Search query
  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];
  const filteredProducts = products.filter(prod => {
    const matchesCat = selectedCategory === 'All' || prod.category === selectedCategory;
    const matchesSearch = !searchQuery.trim() || 
      prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prod.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const totalItemsCount = storageItems.length;
  const unusedItemsCount = storageItems.filter(i => !i.is_used).length;
  const usedItemsCount = storageItems.filter(i => i.is_used).length;

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Banner & Stats Overview */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="heading-font text-lg font-black text-slate-900 flex items-center gap-2">
              <Database className="w-5 h-5 text-orange-600" />
              <span>Digital Credentials &amp; Stock Inventory</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Manage pre-stocked accounts, access links, and license keys for automatic order delivery
            </p>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto">
            <button
              type="button"
              onClick={loadStorage}
              className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 shrink-0 shadow-xs"
              title="Refresh inventory"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-orange-600' : ''}`} />
            </button>
            <button
              type="button"
              onClick={() => openAddModal()}
              className="flex-1 sm:flex-initial px-4 py-2.5 bg-[#FF6B00] hover:bg-[#E66000] text-white text-xs font-black rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ Add Stock</span>
            </button>
          </div>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Stored</span>
            <p className="heading-font text-xl sm:text-2xl font-black text-slate-900">{totalItemsCount}</p>
            <span className="text-[10px] text-slate-500 font-semibold">In Storage DB</span>
          </div>
          <div className="p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-200/80 space-y-0.5">
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Available Stock</span>
            <p className="heading-font text-xl sm:text-2xl font-black text-emerald-700">{unusedItemsCount}</p>
            <span className="text-[10px] text-emerald-700 font-semibold">Ready for Delivery</span>
          </div>
          <div className="p-3.5 bg-blue-50/70 rounded-2xl border border-blue-200/80 space-y-0.5">
            <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Fulfilled Orders</span>
            <p className="heading-font text-xl sm:text-2xl font-black text-blue-700">{usedItemsCount}</p>
            <span className="text-[10px] text-blue-700 font-semibold">Delivered to Customers</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search product inventory..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-orange-500 font-medium"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto self-stretch sm:self-auto custom-scrollbar pb-1 sm:pb-0">
          {categories.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shrink-0 ${
                selectedCategory === cat
                  ? 'bg-orange-500 text-white border-orange-500 shadow-xs'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products Inventory Accordion Cards */}
      <div className="space-y-3">
        {filteredProducts.map(product => {
          const productStorage = storageItems.filter(i => i.product_id === product.id);
          const availableCount = productStorage.filter(i => !i.is_used).length;
          const usedCount = productStorage.filter(i => i.is_used).length;
          const isExpanded = expandedProductId === product.id;

          return (
            <div
              key={product.id}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden transition-all"
            >
              {/* Product Accordion Header */}
              <div
                onClick={() => setExpandedProductId(isExpanded ? null : product.id)}
                className="p-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/80 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 p-1 flex items-center justify-center shrink-0">
                    <Image
                      src={product.logoPath || '/assets/products/chatgpt.png'}
                      alt={product.name}
                      width={32}
                      height={32}
                      className="object-contain w-full h-full"
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="heading-font text-xs sm:text-sm font-black text-slate-900 truncate">
                        {product.name}
                      </h3>
                      <span className="text-[10px] font-bold text-orange-600 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-md">
                        ${product.price.toFixed(2)}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                        {product.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">{product.shortDescription}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                  {/* Stock Pill */}
                  <span className={`px-2.5 py-1 rounded-full text-xs font-black border flex items-center gap-1 ${
                    availableCount > 0
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}>
                    {availableCount > 0 ? (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{availableCount} in stock</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                        <span>0 stock</span>
                      </>
                    )}
                  </span>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openAddModal(product);
                    }}
                    className="p-1.5 sm:px-3 sm:py-1.5 bg-orange-50 hover:bg-orange-100 text-[#FF6B00] border border-orange-200 text-xs font-black rounded-xl transition flex items-center gap-1"
                    title="Add credentials to this product"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    <span className="hidden sm:inline">Add Stock</span>
                  </button>

                  <div className="p-1 text-slate-400 hover:text-slate-700">
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </div>
              </div>

              {/* Expanded Item List & History View */}
              {isExpanded && (
                <div className="border-t border-slate-100 bg-slate-50/50 p-4 space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black text-slate-600 uppercase tracking-wider">
                      Stored Credentials ({productStorage.length} items • {availableCount} Available • {usedCount} Delivered)
                    </span>
                    <button
                      type="button"
                      onClick={() => openAddModal(product)}
                      className="text-xs font-extrabold text-[#FF6B00] hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add More</span>
                    </button>
                  </div>

                  {productStorage.length === 0 ? (
                    <div className="p-6 bg-white rounded-xl border border-slate-200 text-center space-y-2">
                      <p className="text-xs font-bold text-slate-500">No credentials or access links stored for this product.</p>
                      <button
                        type="button"
                        onClick={() => openAddModal(product)}
                        className="px-4 py-2 bg-[#FF6B00] text-white text-xs font-bold rounded-xl shadow-xs inline-flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Stock Now</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {productStorage.map((item, idx) => {
                        const isPwVisible = visiblePasswords[item.id];
                        return (
                          <div
                            key={item.id}
                            className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-all ${
                              item.is_used
                                ? 'bg-slate-100/60 border-slate-200 text-slate-500'
                                : 'bg-white border-slate-200/90 text-slate-800 shadow-2xs'
                            }`}
                          >
                            <div className="space-y-1.5 min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono text-[10.5px] font-bold text-slate-400">#{idx + 1}</span>
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${
                                  item.is_used
                                    ? 'bg-slate-200 text-slate-700 border-slate-300'
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                }`}>
                                  {item.is_used ? 'DELIVERED / USED' : 'AVAILABLE IN STOCK'}
                                </span>
                                <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border">
                                  {item.type.toUpperCase()}
                                </span>
                                {item.order_id && (
                                  <span className="text-[10px] font-mono text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100">
                                    Order: {item.order_id}
                                  </span>
                                )}
                              </div>

                              {/* Credential Data Display */}
                              <div className="flex items-center gap-2 flex-wrap font-mono text-[11.5px]">
                                {item.username && (
                                  <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
                                    <span className="text-slate-400 font-bold">USER:</span>
                                    <span className="font-bold text-slate-900">{item.username}</span>
                                    <button
                                      type="button"
                                      onClick={() => handleCopy(item.username!, `u_${item.id}`)}
                                      className="text-slate-400 hover:text-slate-700 ml-1"
                                      title="Copy username"
                                    >
                                      {copiedId === `u_${item.id}` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                    </button>
                                  </div>
                                )}

                                {item.password && (
                                  <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
                                    <span className="text-slate-400 font-bold">PASS:</span>
                                    <span className="font-bold text-slate-900">
                                      {isPwVisible ? item.password : '••••••••••••'}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => togglePasswordVisibility(item.id)}
                                      className="text-slate-400 hover:text-slate-700 ml-1"
                                      title="Toggle password view"
                                    >
                                      {isPwVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleCopy(item.password!, `p_${item.id}`)}
                                      className="text-slate-400 hover:text-slate-700"
                                      title="Copy password"
                                    >
                                      {copiedId === `p_${item.id}` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                    </button>
                                  </div>
                                )}

                                {item.link && (
                                  <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
                                    <span className="text-slate-400 font-bold">LINK:</span>
                                    <a
                                      href={item.link.startsWith('http') ? item.link : `https://${item.link}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-blue-600 hover:underline max-w-[180px] truncate"
                                    >
                                      {item.link}
                                    </a>
                                    <button
                                      type="button"
                                      onClick={() => handleCopy(item.link!, `l_${item.id}`)}
                                      className="text-slate-400 hover:text-slate-700 ml-1"
                                      title="Copy link"
                                    >
                                      {copiedId === `l_${item.id}` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                    </button>
                                  </div>
                                )}
                              </div>

                              {/* Instructions & Notes */}
                              {item.notes && (
                                <p className="text-[11px] text-slate-500 font-medium">
                                  <strong className="text-slate-600 font-bold">Instructions:</strong> {item.notes}
                                </p>
                              )}
                            </div>

                            {/* Action Buttons: Edit (Pen) & Delete (Trash) */}
                            <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                              <button
                                type="button"
                                onClick={() => openEditModal(item)}
                                className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                                title="Edit this storage item"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteItem(item.id, product.id)}
                                className="p-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition"
                                title="Delete this storage item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal 1: Add Stock Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col animate-scaleUp">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
              <div>
                <h3 className="heading-font text-base font-black text-slate-900 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-orange-600 stroke-[3]" />
                  <span>Add Stock to Inventory</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium">Add digital credentials, access links, or license keys</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-5 overflow-y-auto custom-scrollbar space-y-4 flex-1 text-xs">
              {/* Product Selector */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Target Product</label>
                <select
                  value={selectedProductForAdd?.id || ''}
                  onChange={(e) => {
                    const found = products.find(p => p.id === e.target.value);
                    setSelectedProductForAdd(found || null);
                  }}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-orange-500"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.category}) - ${p.price.toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Type Switcher */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Credential Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'account', label: '👤 Account (User:Pass)' },
                    { id: 'link', label: '🔗 Direct Link' },
                    { id: 'key', label: '🔑 License Key' }
                  ].map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setItemType(t.id as any)}
                      className={`p-2 rounded-xl border text-xs font-bold transition ${
                        itemType === t.id
                          ? 'bg-orange-500 text-white border-orange-500 shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Single Mode vs Bulk Mode */}
              <div className="flex items-center justify-between pt-1">
                <span className="font-bold text-slate-700">Input Mode:</span>
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setBulkMode(false)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                      !bulkMode ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    Form Rows
                  </button>
                  <button
                    type="button"
                    onClick={() => setBulkMode(true)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                      bulkMode ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    Bulk Paste
                  </button>
                </div>
              </div>

              {/* Bulk Textarea Mode */}
              {bulkMode ? (
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 block">
                    Paste {itemType === 'account' ? 'user:pass (one per line)' : 'one item per line'}:
                  </label>
                  <textarea
                    rows={6}
                    value={bulkText}
                    onChange={e => setBulkText(e.target.value)}
                    placeholder={itemType === 'account' ? 'user1@example.com:password123\nuser2@example.com:password456' : 'https://access.link/token1\nhttps://access.link/token2'}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-900 focus:outline-none focus:border-orange-500 custom-scrollbar"
                  />
                </div>
              ) : (
                /* Form Rows Mode */
                <div className="space-y-2.5">
                  {itemRows.map((row, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Item #{idx + 1}</span>
                        {itemRows.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeRow(idx)}
                            className="text-rose-500 hover:text-rose-700 text-xs font-bold"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      {itemType === 'account' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Username / Email"
                            value={row.username || ''}
                            onChange={e => updateRow(idx, 'username', e.target.value)}
                            className="p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
                          />
                          <input
                            type="text"
                            placeholder="Password"
                            value={row.password || ''}
                            onChange={e => updateRow(idx, 'password', e.target.value)}
                            className="p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
                          />
                        </div>
                      )}

                      {itemType === 'link' && (
                        <input
                          type="text"
                          placeholder="https://direct-access-link.com"
                          value={row.link || ''}
                          onChange={e => updateRow(idx, 'link', e.target.value)}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
                        />
                      )}

                      {itemType === 'key' && (
                        <input
                          type="text"
                          placeholder="LICENSE-KEY-XXXXX"
                          value={row.password || ''}
                          onChange={e => updateRow(idx, 'password', e.target.value)}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900"
                        />
                      )}

                      <input
                        type="text"
                        placeholder="Setup instructions / Notes for customer"
                        value={row.notes || ''}
                        onChange={e => updateRow(idx, 'notes', e.target.value)}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 font-medium"
                      />
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addRow}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Another Row</span>
                  </button>
                </div>
              )}
            </div>

            <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/80 flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="flex-1 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-extrabold text-xs rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={handleSaveItems}
                className="flex-1 py-2.5 bg-[#FF6B00] hover:bg-[#E66000] text-white font-extrabold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>{isSaving ? 'Saving...' : 'Save to Storage'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Edit Single Storage Item Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden my-auto flex flex-col animate-scaleUp">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
              <div>
                <h3 className="heading-font text-base font-black text-slate-900 flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-orange-600" />
                  <span>Edit Storage Item</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium">Update previously saved credentials or instructions</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-3.5 text-xs">
              {/* Type */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Type</label>
                <select
                  value={editType}
                  onChange={e => setEditType(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                >
                  <option value="account">Account (Username &amp; Password)</option>
                  <option value="link">Direct Access Link</option>
                  <option value="key">License Key</option>
                  <option value="text">Custom Instruction Text</option>
                </select>
              </div>

              {/* Username */}
              {(editType === 'account') && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Username / Email</label>
                  <input
                    type="text"
                    value={editUsername}
                    onChange={e => setEditUsername(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white"
                  />
                </div>
              )}

              {/* Password */}
              {(editType === 'account' || editType === 'key') && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    {editType === 'key' ? 'License Key' : 'Password'}
                  </label>
                  <input
                    type="text"
                    value={editPassword}
                    onChange={e => setEditPassword(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white"
                  />
                </div>
              )}

              {/* Link */}
              {editType === 'link' && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Access URL / Link</label>
                  <input
                    type="text"
                    value={editLink}
                    onChange={e => setEditLink(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white"
                  />
                </div>
              )}

              {/* Notes / Instructions */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Setup Instructions / Notes for Customer</label>
                <textarea
                  rows={3}
                  value={editNotes}
                  onChange={e => setEditNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white custom-scrollbar"
                />
              </div>
            </div>

            <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/80 flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="flex-1 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-extrabold text-xs rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEditedItem}
                className="flex-1 py-2.5 bg-[#FF6B00] hover:bg-[#E66000] text-white font-extrabold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
