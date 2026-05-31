'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { adminApi } from '@/lib/api';

const F = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div><label className="label">{label}</label>{children}</div>
);

const BILL_IMAGE_MAX_BYTES = 500 * 1024; // 500 KB

export default function SettingsPage() {
  const { staff, token } = useAuthStore();
  const [restaurant, setRestaurant] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [billImage, setBillImage] = useState<string | null>(null);
  const [billImageLabel, setBillImageLabel] = useState('Scan to Pay');
  const [billImageError, setBillImageError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const billImageKey = staff?.restaurantId ? `billImage_${staff.restaurantId}` : null;
  const billImageLabelKey = staff?.restaurantId ? `billImageLabel_${staff.restaurantId}` : null;

  useEffect(() => {
    if (!staff?.restaurantId || !token) return;
    adminApi.getRestaurant(staff.restaurantId, token).then((data: any) => {
      setRestaurant(data);
      setForm({
        name: data.name,
        description: data.description || '',
        phone: data.phone,
        email: data.email,
        address: data.address,
        taxPercentage: data.taxPercentage,
        serviceChargePercentage: data.serviceChargePercentage,
        cgstPercentage: data.cgstPercentage ?? 0,
        sgstPercentage: data.sgstPercentage ?? 0,
        isOpen: data.isOpen,
      });
    });
    setBillImage(localStorage.getItem(`billImage_${staff.restaurantId}`));
    setBillImageLabel(localStorage.getItem(`billImageLabel_${staff.restaurantId}`) || 'Scan to Pay');
  }, [staff, token]);

  const handleBillImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBillImageError('');
    if (!file.type.startsWith('image/')) {
      setBillImageError('Please choose an image file (PNG, JPG, etc.).');
      return;
    }
    if (file.size > BILL_IMAGE_MAX_BYTES) {
      setBillImageError('Image must be 500 KB or smaller.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setBillImage(reader.result as string);
    reader.onerror = () => setBillImageError('Could not read the image file.');
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const clearBillImage = () => {
    setBillImage(null);
    setBillImageError('');
  };

  const saveBillImageSettings = () => {
    if (!billImageKey || !billImageLabelKey) return;
    if (billImage) {
      localStorage.setItem(billImageKey, billImage);
    } else {
      localStorage.removeItem(billImageKey);
    }
    localStorage.setItem(billImageLabelKey, billImageLabel.trim() || 'Scan to Pay');
  };

  const save = async () => {
    if (!staff?.restaurantId || !token) return;
    setSaving(true);
    try {
      await adminApi.updateRestaurant(staff.restaurantId, form, token);
      saveBillImageSettings();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  if (!restaurant) {
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="skeleton h-12" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-black text-gray-900">Settings</h1>
        <p className="text-gray-400 text-xs mt-0.5">Restaurant profile & configuration</p>
      </div>

      <div className="space-y-4">
        <div className="card p-5">
          <h2 className="font-bold text-gray-700 text-sm mb-4 uppercase tracking-wider">Basic Info</h2>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <F label="Restaurant Name">
                <input value={form.name || ''} onChange={(e) => setForm((f: any) => ({ ...f, name: e.target.value }))} className="input" />
              </F>
              <F label="Phone">
                <input value={form.phone || ''} onChange={(e) => setForm((f: any) => ({ ...f, phone: e.target.value }))} className="input" />
              </F>
            </div>
            <F label="Email">
              <input value={form.email || ''} onChange={(e) => setForm((f: any) => ({ ...f, email: e.target.value }))} type="email" className="input" />
            </F>
            <F label="Address">
              <input value={form.address || ''} onChange={(e) => setForm((f: any) => ({ ...f, address: e.target.value }))} className="input" />
            </F>
            <F label="Description">
              <textarea value={form.description || ''} onChange={(e) => setForm((f: any) => ({ ...f, description: e.target.value }))} rows={2} className="input resize-none" />
            </F>
          </div>
        </div>

        <div className="card p-5">
          <h2 className="font-bold text-gray-700 text-sm mb-4 uppercase tracking-wider">Pricing & Taxes</h2>
          <div className="grid grid-cols-2 gap-3">
            <F label="Tax (%)">
              <input value={form.taxPercentage ?? 0} onChange={(e) => setForm((f: any) => ({ ...f, taxPercentage: parseFloat(e.target.value) || 0 }))} type="number" min="0" max="100" step="0.5" className="input" />
            </F>
            <F label="Service Charge (%)">
              <input value={form.serviceChargePercentage ?? 0} onChange={(e) => setForm((f: any) => ({ ...f, serviceChargePercentage: parseFloat(e.target.value) || 0 }))} type="number" min="0" max="100" step="0.5" className="input" />
            </F>
            <F label="CGST (%)">
              <input value={form.cgstPercentage ?? 0} onChange={(e) => setForm((f: any) => ({ ...f, cgstPercentage: parseFloat(e.target.value) || 0 }))} type="number" min="0" max="100" step="0.5" className="input" />
            </F>
            <F label="SGST (%)">
              <input value={form.sgstPercentage ?? 0} onChange={(e) => setForm((f: any) => ({ ...f, sgstPercentage: parseFloat(e.target.value) || 0 }))} type="number" min="0" max="100" step="0.5" className="input" />
            </F>
          </div>
        </div>

        <div className="card p-5">
          <h2 className="font-bold text-gray-700 text-sm mb-1 uppercase tracking-wider">Printed Bill</h2>
          <p className="text-xs text-gray-400 mb-4">Image shown at the bottom of bills printed from Admin → Orders (e.g. UPI QR).</p>
          <div className="space-y-3">
            <F label="Caption (optional)">
              <input
                value={billImageLabel}
                onChange={(e) => setBillImageLabel(e.target.value)}
                placeholder="Scan to Pay"
                className="input"
              />
            </F>
            <F label="Footer image">
              <input
                type="file"
                accept="image/*"
                onChange={handleBillImageChange}
                className="input file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-600 hover:file:bg-orange-100"
              />
            </F>
            {billImageError && <p className="text-red-600 text-xs">{billImageError}</p>}
            {billImage ? (
              <div className="flex flex-col items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-xs font-semibold text-gray-500">{billImageLabel || 'Scan to Pay'}</p>
                <img src={billImage} alt="Bill footer preview" className="w-40 h-40 object-contain border border-gray-200 rounded-lg bg-white" />
                <button type="button" onClick={clearBillImage} className="text-xs text-red-600 font-semibold hover:underline">
                  Remove image
                </button>
              </div>
            ) : (
              <p className="text-xs text-gray-400">No image set. Bills will print without a footer image.</p>
            )}
          </div>
        </div>

        <div className="card p-5">
          <h2 className="font-bold text-gray-700 text-sm mb-4 uppercase tracking-wider">Restaurant Status</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900">Accept Orders</p>
              <p className="text-xs text-gray-400 mt-0.5">Toggle to open or close your restaurant for new orders</p>
            </div>
            <button
              onClick={() => setForm((f: any) => ({ ...f, isOpen: !f.isOpen }))}
              className={`relative w-14 h-7 rounded-full transition-all ${form.isOpen ? 'bg-green-500' : 'bg-gray-200'}`}
            >
              <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-all ${form.isOpen ? 'left-7' : 'left-0.5'}`} />
            </button>
          </div>
          <div className={`mt-3 flex items-center gap-2 text-sm font-semibold ${form.isOpen ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-2 h-2 rounded-full ${form.isOpen ? 'bg-green-500 live-dot' : 'bg-gray-300'}`} />
            {form.isOpen ? 'Restaurant is Open' : 'Restaurant is Closed'}
          </div>
        </div>

        {saved && (
          <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-3 text-sm flex items-center gap-2">
            <span>✓</span> Settings saved successfully
          </div>
        )}

        <button onClick={save} disabled={saving} className="btn-primary w-full py-3.5 text-base">
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
