'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { adminApi } from '@/lib/api';

const ROLES = ['owner', 'manager', 'chef', 'waiter', 'cashier'];
const ROLE_STYLE: Record<string, string> = {
  owner:   'bg-purple-50 text-purple-700 border-purple-200',
  manager: 'bg-blue-50   text-blue-700   border-blue-200',
  chef:    'bg-orange-50 text-orange-700 border-orange-200',
  waiter:  'bg-teal-50   text-teal-700   border-teal-200',
  cashier: 'bg-green-50  text-green-700  border-green-200',
};

export default function StaffPage() {
  const { staff: me, token } = useAuthStore();
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', role: 'waiter', password: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!me?.restaurantId || !token) return;
    const data: any = await adminApi.getStaff(me.restaurantId, token);
    setStaff(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [me, token]);

  const createStaff = async () => {
    if (!me?.restaurantId || !token || !form.name || !form.email || !form.password) return;
    setSaving(true);
    try { await adminApi.createStaff(me.restaurantId, form, token); setForm({ name: '', email: '', phone: '', role: 'waiter', password: '' }); setShowForm(false); await load(); }
    finally { setSaving(false); }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    if (!me?.restaurantId || !token) return;
    await adminApi.updateStaff(me.restaurantId, id, { isActive: !isActive }, token);
    await load();
  };

  const activeCount = staff.filter((s) => s.isActive).length;

  return (
    <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-black text-gray-900">Staff</h1>
            <p className="text-gray-400 text-xs mt-0.5">{activeCount} active · {staff.length} total</p>
          </div>
          <button onClick={() => setShowForm(true)} className="btn-primary">+ Add Staff</button>
        </div>

        {/* Role breakdown */}
        {!loading && staff.length > 0 && (
          <div className="flex gap-2 mb-5 flex-wrap">
            {ROLES.map((role) => {
              const count = staff.filter((s) => s.role === role).length;
              if (!count) return null;
              return (
                <div key={role} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${ROLE_STYLE[role]}`}>
                  {role} <span className="font-black">{count}</span>
                </div>
              );
            })}
          </div>
        )}

        {loading ? (
          <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="skeleton h-20" />)}</div>
        ) : staff.length === 0 ? (
          <div className="card py-16 text-center">
            <div className="text-4xl mb-3">👥</div>
            <p className="text-gray-400">No staff members yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {staff.map((member) => (
              <div key={member.id} className={`card p-4 flex items-center gap-4 ${!member.isActive ? 'opacity-60' : ''}`}>
                <div className="w-11 h-11 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl flex items-center justify-center text-white font-black text-lg flex-shrink-0">
                  {member.name[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-bold text-gray-900">{member.name}</span>
                    <span className={`badge border ${ROLE_STYLE[member.role] || 'bg-gray-50 text-gray-500 border-gray-200'}`}>{member.role}</span>
                    {!member.isActive && <span className="badge bg-red-50 text-red-500 border border-red-200">Inactive</span>}
                  </div>
                  <p className="text-xs text-gray-400">{member.email} · {member.phone}</p>
                  {member.lastLoginAt && <p className="text-xs text-gray-300 mt-0.5">Last login {new Date(member.lastLoginAt).toLocaleDateString()}</p>}
                </div>
                <button onClick={() => toggleActive(member.id, member.isActive)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all flex-shrink-0 ${member.isActive ? 'bg-red-50 text-red-500 hover:bg-red-100 border border-red-200' : 'bg-green-50 text-green-600 hover:bg-green-100 border border-green-200'}`}>
                  {member.isActive ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            ))}
          </div>
        )}

        {showForm && (
          <div className="modal-overlay">
            <div className="modal max-w-md p-6">
              <h2 className="font-black text-gray-900 text-lg mb-5">Add Staff Member</h2>
              <div className="space-y-3">
                <div><label className="label">Full Name *</label><input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="John Doe" className="input" /></div>
                <div><label className="label">Email *</label><input value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} type="email" placeholder="john@restaurant.com" className="input" /></div>
                <div><label className="label">Phone</label><input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+91 98765 43210" className="input" /></div>
                <div><label className="label">Role</label>
                  <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} className="input">
                    {ROLES.map((r) => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                  </select>
                </div>
                <div><label className="label">Password *</label><input value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} type="password" placeholder="Min 8 characters" className="input" /></div>
              </div>
              <div className="flex gap-2 mt-5">
                <button onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={createStaff} disabled={saving} className="btn-primary flex-1">{saving ? 'Creating...' : 'Add Staff'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
  );
}
