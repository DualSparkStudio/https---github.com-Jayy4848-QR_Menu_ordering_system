'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { adminApi } from '@/lib/api';

export default function CouponsPage() {
  const { staff, token } = useAuthStore();
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code: '', description: '', discountType: 'percentage', discountValue: '', minOrderValue: '', maxDiscount: '', usageLimit: '', expiresAt: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!staff?.restaurantId || !token) return;
    const data: any = await adminApi.getCoupons(staff.restaurantId, token);
    setCoupons(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [staff, token]);

  const createCoupon = async () => {
    if (!staff?.restaurantId || !token || !form.code || !form.discountValue) return;
    setSaving(true);
    try {
      await adminApi.createCoupon(staff.restaurantId, { ...form, discountValue: parseFloat(form.discountValue), minOrderValue: form.minOrderValue ? parseFloat(form.minOrderValue) : 0, maxDiscount: form.maxDiscount ? parseFloat(form.maxDiscount) : undefined, usageLimit: form.usageLimit ? parseInt(form.usageLimit) : undefined, expiresAt: form.expiresAt || undefined }, token);
      setForm({ code: '', description: '', discountType: 'percentage', discountValue: '', minOrderValue: '', maxDiscount: '', usageLimit: '', expiresAt: '' });
      setShowForm(false); await load();
    } finally { setSaving(false); }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-black text-gray-900">Coupons</h1>
            <p className="text-gray-400 text-xs mt-0.5">{coupons.filter((c) => c.isActive).length} active</p>
          </div>
          <button onClick={() => setShowForm(true)} className="btn-primary">+ Create Coupon</button>
        </div>

        {loading ? (
          <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="skeleton h-20" />)}</div>
        ) : coupons.length === 0 ? (
          <div className="card py-16 text-center">
            <div className="text-4xl mb-3">🎟️</div>
            <p className="text-gray-400">No coupons yet</p>
            <button onClick={() => setShowForm(true)} className="btn-primary mt-4 text-sm">Create first coupon</button>
          </div>
        ) : (
          <div className="space-y-2">
            {coupons.map((coupon) => (
              <div key={coupon.id} className={`card p-4 flex items-center gap-4 ${!coupon.isActive ? 'opacity-60' : ''}`}>
                <div className="w-12 h-12 bg-orange-50 border border-orange-200 rounded-xl flex items-center justify-center text-xl flex-shrink-0">🎟️</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-black text-gray-900 font-mono tracking-wider">{coupon.code}</span>
                    <span className={`badge border ${coupon.isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>
                      {coupon.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                    <span className="font-semibold text-gray-600">
                      {coupon.discountType === 'percentage' ? `${coupon.discountValue}% off` : `₹${coupon.discountValue} off`}
                    </span>
                    {coupon.minOrderValue > 0 && <span>Min ₹{coupon.minOrderValue}</span>}
                    {coupon.maxDiscount && <span>Max ₹{coupon.maxDiscount}</span>}
                    {coupon.usageLimit && <span>{coupon.usedCount}/{coupon.usageLimit} used</span>}
                    {coupon.expiresAt && <span>Expires {new Date(coupon.expiresAt).toLocaleDateString()}</span>}
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => adminApi.toggleCoupon(staff!.restaurantId, coupon.id, token!).then(load)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-semibold border transition-all ${coupon.isActive ? 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100' : 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100'}`}>
                    {coupon.isActive ? 'Disable' : 'Enable'}
                  </button>
                  <button onClick={() => { if (confirm('Delete coupon?')) adminApi.deleteCoupon(staff!.restaurantId, coupon.id, token!).then(load); }}
                    className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-400 border border-red-200 hover:bg-red-100 font-semibold">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {showForm && (
          <div className="modal-overlay">
            <div className="modal max-w-md p-6">
              <h2 className="font-black text-gray-900 text-lg mb-5">Create Coupon</h2>
              <div className="space-y-3">
                <div><label className="label">Code *</label><input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="SAVE20" className="input font-mono tracking-widest" /></div>
                <div><label className="label">Description</label><input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="20% off on first order" className="input" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="label">Type</label>
                    <select value={form.discountType} onChange={(e) => setForm((f) => ({ ...f, discountType: e.target.value }))} className="input">
                      <option value="percentage">Percentage %</option>
                      <option value="fixed">Fixed ₹</option>
                    </select>
                  </div>
                  <div><label className="label">Value *</label><input value={form.discountValue} onChange={(e) => setForm((f) => ({ ...f, discountValue: e.target.value }))} type="number" min="0" placeholder="20" className="input" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="label">Min Order ₹</label><input value={form.minOrderValue} onChange={(e) => setForm((f) => ({ ...f, minOrderValue: e.target.value }))} type="number" placeholder="200" className="input" /></div>
                  <div><label className="label">Max Discount ₹</label><input value={form.maxDiscount} onChange={(e) => setForm((f) => ({ ...f, maxDiscount: e.target.value }))} type="number" placeholder="150" className="input" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="label">Usage Limit</label><input value={form.usageLimit} onChange={(e) => setForm((f) => ({ ...f, usageLimit: e.target.value }))} type="number" placeholder="100" className="input" /></div>
                  <div><label className="label">Expires</label><input value={form.expiresAt} onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))} type="date" className="input" /></div>
                </div>
              </div>
              <div className="flex gap-2 mt-5">
                <button onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={createCoupon} disabled={saving} className="btn-primary flex-1">{saving ? 'Creating...' : 'Create'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
  );
}
