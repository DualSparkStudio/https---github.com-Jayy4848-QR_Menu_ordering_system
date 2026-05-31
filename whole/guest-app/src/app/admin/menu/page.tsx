'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { adminApi } from '@/lib/api';

const SPICE = ['None', 'Mild 🌶', 'Medium 🌶🌶', 'Hot 🌶🌶🌶'];

export default function MenuPage() {
  const { staff, token } = useAuthStore();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showCatForm, setShowCatForm] = useState(false);
  const [showItemForm, setShowItemForm] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [catForm, setCatForm] = useState({ name: '', description: '', icon: '' });
  const [itemForm, setItemForm] = useState({ categoryId: '', name: '', description: '', basePrice: '', image: '', isVegetarian: false, isVegan: false, isFeatured: false, preparationTime: '15', spiceLevel: '0', calories: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!staff?.restaurantId || !token) return;
    const data: any = await adminApi.getCategories(staff.restaurantId, token);
    setCategories(data);
    if (!activeCategory && data.length) setActiveCategory(data[0].id);
    setLoading(false);
  };

  useEffect(() => { load(); }, [staff, token]);

  const saveCategory = async () => {
    if (!staff?.restaurantId || !token || !catForm.name) return;
    setSaving(true);
    try { await adminApi.createCategory(staff.restaurantId, catForm, token); setCatForm({ name: '', description: '', icon: '' }); setShowCatForm(false); await load(); }
    finally { setSaving(false); }
  };

  const saveItem = async () => {
    if (!staff?.restaurantId || !token || !itemForm.name || !itemForm.basePrice) return;
    setSaving(true);
    try {
      const data = { ...itemForm, basePrice: parseFloat(itemForm.basePrice), spiceLevel: parseInt(itemForm.spiceLevel), preparationTime: parseInt(itemForm.preparationTime), calories: itemForm.calories ? parseInt(itemForm.calories) : undefined, categoryId: itemForm.categoryId || activeCategory };
      if (editItem) await adminApi.updateMenuItem(staff.restaurantId, editItem.id, data, token);
      else await adminApi.createMenuItem(staff.restaurantId, data, token);
      setItemForm({ categoryId: '', name: '', description: '', basePrice: '', image: '', isVegetarian: false, isVegan: false, isFeatured: false, preparationTime: '15', spiceLevel: '0', calories: '' });
      setShowItemForm(false); setEditItem(null); await load();
    } finally { setSaving(false); }
  };

  const startEdit = (item: any) => {
    setEditItem(item);
    setItemForm({ categoryId: item.categoryId, name: item.name, description: item.description || '', basePrice: item.basePrice.toString(), image: item.image || '', isVegetarian: item.isVegetarian, isVegan: item.isVegan, isFeatured: item.isFeatured, preparationTime: item.preparationTime.toString(), spiceLevel: item.spiceLevel.toString(), calories: item.calories?.toString() || '' });
    setShowItemForm(true);
  };

  const activeItems = categories.find((c) => c.id === activeCategory)?.items || [];
  const totalItems = categories.reduce((s: number, c: any) => s + c.items.length, 0);

  return (
    <>
      <div className="flex flex-col lg:flex-row h-full">
        {/* Category sidebar */}
        <div className="w-full lg:w-52 flex-shrink-0 border-b lg:border-b-0 lg:border-r border-gray-100 bg-white flex flex-col">
          <div className="p-4 border-b border-gray-50">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-bold text-gray-900 text-sm">Categories</h2>
              <button onClick={() => setShowCatForm(true)} className="w-6 h-6 bg-orange-500 text-white rounded-lg flex items-center justify-center text-sm font-bold hover:bg-orange-600">+</button>
            </div>
            <p className="text-xs text-gray-400">{totalItems} items total</p>
          </div>
          <div className="flex lg:flex-col overflow-x-auto lg:overflow-x-visible lg:overflow-y-auto p-2 space-x-0.5 lg:space-x-0 lg:space-y-0.5">
            {categories.map((cat) => (
              <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                className={`flex-shrink-0 lg:w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all whitespace-nowrap lg:whitespace-normal ${activeCategory === cat.id ? 'bg-orange-50 text-orange-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                <span className="text-sm font-medium truncate">{cat.icon && `${cat.icon} `}{cat.name}</span>
                <span className="text-xs text-gray-300 flex-shrink-0 ml-1">{cat.items.length}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Items area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <h1 className="text-xl font-black text-gray-900">
                {categories.find((c) => c.id === activeCategory)?.icon} {categories.find((c) => c.id === activeCategory)?.name || 'Menu'}
              </h1>
              <p className="text-gray-400 text-xs mt-0.5">{activeItems.length} items</p>
            </div>
            <button onClick={() => { setEditItem(null); setShowItemForm(true); }} className="btn-primary">+ Add Item</button>
          </div>

          {loading ? (
            <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="skeleton h-20" />)}</div>
          ) : activeItems.length === 0 ? (
            <div className="card py-16 text-center">
              <div className="text-4xl mb-3">🍽️</div>
              <p className="text-gray-400 font-medium">No items yet</p>
              <button onClick={() => setShowItemForm(true)} className="btn-primary mt-4 text-sm">Add first item</button>
            </div>
          ) : (
            <div className="space-y-2">
              {activeItems.map((item: any) => (
                <div key={item.id} className="card p-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:shadow-md transition-all">
                  {item.image
                    ? <img src={item.image} alt={item.name} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                    : <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center text-2xl flex-shrink-0">🍽️</div>
                  }
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className={`w-2.5 h-2.5 rounded-sm border-2 flex-shrink-0 ${item.isVegetarian ? 'border-green-600 bg-green-500' : 'border-red-600 bg-red-500'}`} />
                      <span className="font-bold text-gray-900 text-sm">{item.name}</span>
                      {item.isFeatured && <span className="badge bg-amber-50 text-amber-700 border border-amber-200">⭐ Featured</span>}
                      {item.spiceLevel > 0 && <span className="text-xs text-gray-400">{SPICE[item.spiceLevel]}</span>}
                    </div>
                    <p className="text-xs text-gray-400 truncate mb-1">{item.description}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                      <span className="font-bold text-gray-900">₹{item.basePrice}</span>
                      {item.calories && <span>{item.calories} cal</span>}
                      <span>~{item.preparationTime}min</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap sm:flex-shrink-0">
                    <button onClick={() => adminApi.toggleItemAvailability(staff!.restaurantId, item.id, token!).then(load)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all ${item.isAvailable ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-400 border border-gray-200'}`}>
                      {item.isAvailable ? '● On' : '○ Off'}
                    </button>
                    <button onClick={() => startEdit(item)} className="btn-ghost text-xs">Edit</button>
                    <button onClick={() => { if (confirm('Delete?')) adminApi.deleteMenuItem(staff!.restaurantId, item.id, token!).then(load); }} className="text-xs text-red-400 hover:text-red-600 px-2 py-1.5 rounded-lg hover:bg-red-50 transition-all">✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showCatForm && (
        <div className="modal-overlay">
          <div className="modal max-w-sm p-6">
            <h2 className="font-black text-gray-900 text-lg mb-5">New Category</h2>
            <div className="space-y-3">
              <div><label className="label">Name *</label><input value={catForm.name} onChange={(e) => setCatForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Starters" className="input" /></div>
              <div><label className="label">Icon Emoji</label><input value={catForm.icon} onChange={(e) => setCatForm((f) => ({ ...f, icon: e.target.value }))} placeholder="🥗" className="input" /></div>
              <div><label className="label">Description</label><input value={catForm.description} onChange={(e) => setCatForm((f) => ({ ...f, description: e.target.value }))} placeholder="Optional" className="input" /></div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowCatForm(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={saveCategory} disabled={saving} className="btn-primary flex-1">{saving ? 'Saving...' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}

      {showItemForm && (
        <div className="modal-overlay">
          <div className="modal max-w-lg p-6 overflow-y-auto max-h-[90vh]">
            <h2 className="font-black text-gray-900 text-lg mb-5">{editItem ? 'Edit Item' : 'New Menu Item'}</h2>
            <div className="space-y-3">
              <div><label className="label">Category</label>
                <select value={itemForm.categoryId || activeCategory || ''} onChange={(e) => setItemForm((f) => ({ ...f, categoryId: e.target.value }))} className="input">
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                </select>
              </div>
              <div><label className="label">Name *</label><input value={itemForm.name} onChange={(e) => setItemForm((f) => ({ ...f, name: e.target.value }))} placeholder="Dish name" className="input" /></div>
              <div><label className="label">Description</label><textarea value={itemForm.description} onChange={(e) => setItemForm((f) => ({ ...f, description: e.target.value }))} rows={2} className="input resize-none" /></div>
              <div><label className="label">Image URL</label><input value={itemForm.image} onChange={(e) => setItemForm((f) => ({ ...f, image: e.target.value }))} placeholder="https://..." className="input" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Price (₹) *</label><input value={itemForm.basePrice} onChange={(e) => setItemForm((f) => ({ ...f, basePrice: e.target.value }))} type="number" min="0" className="input" /></div>
                <div><label className="label">Calories</label><input value={itemForm.calories} onChange={(e) => setItemForm((f) => ({ ...f, calories: e.target.value }))} type="number" className="input" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Prep Time (min)</label><input value={itemForm.preparationTime} onChange={(e) => setItemForm((f) => ({ ...f, preparationTime: e.target.value }))} type="number" min="1" className="input" /></div>
                <div><label className="label">Spice Level</label>
                  <select value={itemForm.spiceLevel} onChange={(e) => setItemForm((f) => ({ ...f, spiceLevel: e.target.value }))} className="input">
                    {SPICE.map((s, i) => <option key={i} value={i}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-5 pt-1">
                {[['isVegetarian', '🥦 Veg'], ['isVegan', '🌱 Vegan'], ['isFeatured', "⭐ Featured"]].map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={(itemForm as any)[key]} onChange={(e) => setItemForm((f) => ({ ...f, [key]: e.target.checked }))} className="w-4 h-4 accent-orange-500 rounded" />
                    <span className="text-sm text-gray-600 font-medium">{label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => { setShowItemForm(false); setEditItem(null); }} className="btn-secondary flex-1">Cancel</button>
              <button onClick={saveItem} disabled={saving} className="btn-primary flex-1">{saving ? 'Saving...' : editItem ? 'Update' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
