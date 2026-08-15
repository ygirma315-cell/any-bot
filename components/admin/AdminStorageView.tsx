import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Product } from '@/config/products';
import { 
  ProductStorageItem, 
  getStoredStorage, 
  fetchStorageFromSupabase, 
  addStorageItems, 
  deleteStorageItem,
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
  UserCheck
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
          // Format: user:pass or user|pass or user,pass or whitespace
          const parts = line.split(/[:|,\t ]+/);
          const username = parts[0]?.trim() || '';
          const password = parts.slice(1).join(':').trim() || '';
          if (username) {
            itemsToAdd.push({
              product_id: selectedProductForAdd.id,
              type: 'account',
              username,
              password,
              notes: 'Bulk imported'
            });
          }
        } else if (itemType === 'link') {
          itemsToAdd.push({
            product_id: selectedProductForAdd.id,
            type: 'link',
            link: line,
            notes: 'Direct link'
          });
        } else if (itemType === 'key') {
          itemsToAdd.push({
            product_id: selectedProductForAdd.id,
            type: 'key',
            password: line,
            notes: 'License key'
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
            notes: row.notes?.trim()
          });
        } else if (itemType === 'link' && row.link?.trim()) {
          itemsToAdd.push({
            product_id: selectedProductForAdd.id,
            type: 'link',
            link: row.link?.trim(),
            notes: row.notes?.trim()
          });
        } else if (itemType === 'key' && row.password?.trim()) {
          itemsToAdd.push({
            product_id: selectedProductForAdd.id,
            type: 'key',
            password: row.password?.trim(),
            notes: row.notes?.trim()
          });
        } else if (itemType === 'text' && row.notes?.trim()) {
          itemsToAdd.push({
            product_id: selectedProductForAdd.id,
            type: 'text',
            notes: row.notes?.trim()
          });
        }
      }
    }

    if (itemsToAdd.length === 0) {
      alert('Please fill in valid credentials before saving.');
      setIsSaving(false);
      return;
    }

    await addStorageItems(itemsToAdd);

    // Sync product stock if option checked
    if (syncStock) {
      const allProducts = getStoredProducts();
      const allStorage = getStoredStorage();
      const availableCount = allStorage.filter(s => s.product_id === selectedProductForAdd.id && !s.is_used).length;
      
      const updatedProducts = allProducts.map(p => {
        if (p.id === selectedProductForAdd.id) {
          return { ...p, stock: availableCount, available: availableCount > 0 };
        }
        return p;
      });
      saveStoredProducts(updatedProducts, true);
      if (onRefreshProducts) onRefreshProducts();
    }

    await loadStorage();
    setIsSaving(false);
    setIsAddModalOpen(false);
  };

  const handleDeleteItem = async (id: string, prodId: string) => {
    if (!confirm('Are you sure you want to delete this credential item?')) return;
    await deleteStorageItem(id);
    await loadStorage();
  };

  // Metrics
  const totalAvailable = storageItems.filter(i => !i.is_used).length;
  const totalDelivered = storageItems.filter(i => i.is_used).length;
  const lowStockCount = products.filter(p => {
    const avail = storageItems.filter(i => i.product_id === p.id && !i.is_used).length;
    return avail > 0 && avail <= 3;
  }).length;
  const outOfStockCount = products.filter(p => {
    const avail = storageItems.filter(i => i.product_id === p.id && !i.is_used).length;
    return avail === 0;
  }).length;

  // Filtered Products
  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];
  const filteredProducts = products.filter(p => {
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2.5 tracking-tight">
            <Database className="w-6 h-6 text-orange-500" />
            Product Storage & Digital Credential Inventory
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Store usernames, passwords, license keys, and direct links for automated customer delivery on order approval.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadStorage}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-2 border border-slate-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => openAddModal()}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-orange-500/20 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            + Add Credentials
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Available In Stock</div>
          <div className="text-2xl font-black text-emerald-400 flex items-center gap-2">
            {totalAvailable}
            <ShieldCheck className="w-5 h-5 text-emerald-500 opacity-80" />
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Ready for automated delivery</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Delivered to Users</div>
          <div className="text-2xl font-black text-blue-400 flex items-center gap-2">
            {totalDelivered}
            <UserCheck className="w-5 h-5 text-blue-500 opacity-80" />
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Claimed by approved orders</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Low Stock Alert</div>
          <div className="text-2xl font-black text-amber-400 flex items-center gap-2">
            {lowStockCount}
            <AlertCircle className="w-5 h-5 text-amber-500 opacity-80" />
          </div>
          <div className="text-[11px] text-slate-500 mt-1">&le; 3 items remaining</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Out of Stock</div>
          <div className="text-2xl font-black text-red-400 flex items-center gap-2">
            {outOfStockCount}
            <Package className="w-5 h-5 text-red-500 opacity-80" />
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Needs credential refill</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center gap-4 justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search products in storage..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                  : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product Storage Accordion List */}
      <div className="space-y-4">
        {filteredProducts.map(product => {
          const productCreds = storageItems.filter(i => i.product_id === product.id);
          const availableCreds = productCreds.filter(i => !i.is_used);
          const usedCreds = productCreds.filter(i => i.is_used);
          const isExpanded = expandedProductId === product.id;

          return (
            <div
              key={product.id}
              className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-lg transition-all"
            >
              {/* Product Header Row */}
              <div className="p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-slate-950 p-2 border border-slate-800 relative flex items-center justify-center flex-shrink-0">
                    <Image
                      src={product.logoPath}
                      alt={product.name}
                      width={32}
                      height={32}
                      className="object-contain"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white tracking-tight">{product.name}</h3>
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                        {product.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                      <span>Price: <strong className="text-white">${product.price.toFixed(2)}</strong></span>
                      <span>&bull;</span>
                      <span>Warranty: <strong className="text-emerald-400">{product.warranty || 'Included'}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Badges & Actions */}
                <div className="flex items-center gap-3 self-end sm:self-center">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-xl text-xs font-bold border ${
                      availableCreds.length > 3 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                        : availableCreds.length > 0 
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : 'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}>
                      {availableCreds.length} Available
                    </span>

                    <span className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                      {usedCreds.length} Delivered
                    </span>
                  </div>

                  <button
                    onClick={() => openAddModal(product)}
                    className="px-3 py-1.5 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border border-orange-500/30 text-xs font-bold flex items-center gap-1.5 transition active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add
                  </button>

                  <button
                    onClick={() => setExpandedProductId(isExpanded ? null : product.id)}
                    className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Stored Credentials List / Table */}
              {isExpanded && (
                <div className="border-t border-slate-800/80 bg-slate-950/40 p-4 md:p-5">
                  {productCreds.length === 0 ? (
                    <div className="text-center py-6 text-slate-500 text-xs">
                      No stored credentials yet for this product. Click <strong>&ldquo;+ Add Credentials&rdquo;</strong> to add links or login accounts.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="text-slate-400 border-b border-slate-800">
                            <th className="pb-2.5 font-semibold">Type</th>
                            <th className="pb-2.5 font-semibold">Credentials / Link</th>
                            <th className="pb-2.5 font-semibold">Notes</th>
                            <th className="pb-2.5 font-semibold">Status</th>
                            <th className="pb-2.5 font-semibold text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {productCreds.map(item => (
                            <tr key={item.id} className="hover:bg-slate-800/30 transition">
                              {/* Type */}
                              <td className="py-3 pr-3">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono text-[11px] uppercase">
                                  {item.type === 'account' && <Lock className="w-3 h-3 text-orange-400" />}
                                  {item.type === 'link' && <LinkIcon className="w-3 h-3 text-blue-400" />}
                                  {item.type === 'key' && <Key className="w-3 h-3 text-amber-400" />}
                                  {item.type === 'text' && <FileText className="w-3 h-3 text-purple-400" />}
                                  {item.type}
                                </span>
                              </td>

                              {/* Details */}
                              <td className="py-3 pr-3 font-mono">
                                {item.type === 'account' && (
                                  <div className="space-y-1">
                                    {item.username && (
                                      <div className="flex items-center gap-1.5 text-slate-200">
                                        <span className="text-slate-500 text-[10px]">USER:</span>
                                        <code>{item.username}</code>
                                        <button
                                          onClick={() => handleCopy(item.username!, `u_${item.id}`)}
                                          className="text-slate-500 hover:text-white"
                                        >
                                          {copiedId === `u_${item.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                        </button>
                                      </div>
                                    )}
                                    {item.password && (
                                      <div className="flex items-center gap-1.5 text-slate-200">
                                        <span className="text-slate-500 text-[10px]">PASS:</span>
                                        <code>{visiblePasswords[item.id] ? item.password : '••••••••••••'}</code>
                                        <button
                                          onClick={() => togglePasswordVisibility(item.id)}
                                          className="text-slate-500 hover:text-white"
                                        >
                                          {visiblePasswords[item.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                        </button>
                                        <button
                                          onClick={() => handleCopy(item.password!, `p_${item.id}`)}
                                          className="text-slate-500 hover:text-white"
                                        >
                                          {copiedId === `p_${item.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {item.type === 'link' && item.link && (
                                  <div className="flex items-center gap-2">
                                    <a
                                      href={item.link}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-blue-400 hover:underline max-w-[200px] truncate inline-block"
                                    >
                                      {item.link}
                                    </a>
                                    <button
                                      onClick={() => handleCopy(item.link!, `l_${item.id}`)}
                                      className="text-slate-500 hover:text-white"
                                    >
                                      {copiedId === `l_${item.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                    </button>
                                  </div>
                                )}

                                {item.type === 'key' && item.password && (
                                  <div className="flex items-center gap-2">
                                    <code className="text-amber-300">{visiblePasswords[item.id] ? item.password : '••••••••-••••-••••'}</code>
                                    <button
                                      onClick={() => togglePasswordVisibility(item.id)}
                                      className="text-slate-500 hover:text-white"
                                    >
                                      {visiblePasswords[item.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                    </button>
                                    <button
                                      onClick={() => handleCopy(item.password!, `k_${item.id}`)}
                                      className="text-slate-500 hover:text-white"
                                    >
                                      {copiedId === `k_${item.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                    </button>
                                  </div>
                                )}

                                {item.type === 'text' && (
                                  <span className="text-slate-300 italic">{item.notes || 'Instruction note'}</span>
                                )}
                              </td>

                              {/* Notes */}
                              <td className="py-3 pr-3 text-slate-400">
                                {item.notes || '-'}
                              </td>

                              {/* Status */}
                              <td className="py-3 pr-3">
                                {item.is_used ? (
                                  <div className="space-y-0.5">
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-bold border border-blue-500/20">
                                      Delivered
                                    </span>
                                    {item.order_id && (
                                      <div className="text-[10px] text-slate-500 font-mono">
                                        {item.order_id}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                                    Available
                                  </span>
                                )}
                              </td>

                              {/* Action */}
                              <td className="py-3 text-right">
                                <button
                                  onClick={() => handleDeleteItem(item.id, product.id)}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition"
                                  title="Delete Credential"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Credentials Modal */}
      {isAddModalOpen && selectedProductForAdd && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                  <Database className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Add Credentials / Links</h3>
                  <p className="text-xs text-slate-400">Add digital inventory for automated customer delivery.</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold px-2 py-1"
              >
                &times;
              </button>
            </div>

            {/* Product Selector */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">Target Product</label>
              <select
                value={selectedProductForAdd.id}
                onChange={e => {
                  const prod = products.find(p => p.id === e.target.value);
                  if (prod) setSelectedProductForAdd(prod);
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
              >
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.category})</option>
                ))}
              </select>
            </div>

            {/* Type Selector */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">Inventory Type</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'account', label: 'Account Login', icon: Lock },
                  { id: 'link', label: 'Access Link', icon: LinkIcon },
                  { id: 'key', label: 'License Key', icon: Key },
                  { id: 'text', label: 'Instructions', icon: FileText }
                ].map(t => {
                  const Icon = t.icon;
                  const isSelected = itemType === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setItemType(t.id as any);
                        setItemRows(prev => prev.map(r => ({ ...r, type: t.id as any })));
                      }}
                      className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                        isSelected 
                          ? 'bg-orange-500/20 border-orange-500 text-orange-300 shadow-sm' 
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mode Switch: Form vs Bulk */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-semibold text-slate-400">Input Mode:</span>
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setBulkMode(false)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    !bulkMode ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Form Rows
                </button>
                <button
                  type="button"
                  onClick={() => setBulkMode(true)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    bulkMode ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Bulk Paste
                </button>
              </div>
            </div>

            {/* Inputs: Form vs Bulk */}
            {bulkMode ? (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 block">
                  Paste Items (One per line)
                </label>
                <textarea
                  rows={6}
                  value={bulkText}
                  onChange={e => setBulkText(e.target.value)}
                  placeholder={
                    itemType === 'account'
                      ? 'username:password\nuser2@gmail.com:pass123\nuser3:secretpass'
                      : itemType === 'link'
                      ? 'https://app.chatgpt.com/share/invite1\nhttps://app.chatgpt.com/share/invite2'
                      : 'KEY-12345-ABCDE\nKEY-67890-FGHIJ'
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-orange-500"
                />
                <p className="text-[11px] text-slate-500">
                  {itemType === 'account' 
                    ? 'Format: username:password or username|password per line.' 
                    : 'Each non-empty line will be created as a separate credential.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {itemRows.map((row, idx) => (
                  <div key={idx} className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2.5 relative">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                      <span>Item #{idx + 1}</span>
                      {itemRows.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeRow(idx)}
                          className="text-red-400 hover:text-red-300"
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
                          className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                        />
                        <input
                          type="text"
                          placeholder="Password"
                          value={row.password || ''}
                          onChange={e => updateRow(idx, 'password', e.target.value)}
                          className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                        />
                      </div>
                    )}

                    {itemType === 'link' && (
                      <input
                        type="url"
                        placeholder="https://..."
                        value={row.link || ''}
                        onChange={e => updateRow(idx, 'link', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                      />
                    )}

                    {itemType === 'key' && (
                      <input
                        type="text"
                        placeholder="License / Activation Key"
                        value={row.password || ''}
                        onChange={e => updateRow(idx, 'password', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-orange-500"
                      />
                    )}

                    <input
                      type="text"
                      placeholder="Optional notes or instructions for the buyer..."
                      value={row.notes || ''}
                      onChange={e => updateRow(idx, 'notes', e.target.value)}
                      className="w-full bg-slate-900/60 border border-slate-800/80 rounded-lg px-3 py-1.5 text-[11px] text-slate-300 placeholder-slate-600 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addRow}
                  className="w-full py-2 border border-dashed border-slate-800 hover:border-orange-500/50 rounded-xl text-xs text-orange-400 font-bold flex items-center justify-center gap-1.5 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  + Add More Credentials
                </button>
              </div>
            )}

            {/* Sync Stock Toggle */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
              <input
                type="checkbox"
                id="syncStockToggle"
                checked={syncStock}
                onChange={e => setSyncStock(e.target.checked)}
                className="rounded border-slate-800 text-orange-500 focus:ring-0"
              />
              <label htmlFor="syncStockToggle" className="text-xs text-slate-300 font-semibold cursor-pointer">
                Automatically update product stock quantity to match available storage count
              </label>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveItems}
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold shadow-lg shadow-orange-500/20 transition active:scale-95 flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Save &amp; Store Credentials
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
