'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { adminApi } from '@/lib/api';

const STATUS_STYLE: Record<string, string> = {
  available:   'bg-green-50  text-green-700  border-green-200',
  occupied:    'bg-red-50    text-red-700    border-red-200',
  reserved:    'bg-blue-50   text-blue-700   border-blue-200',
  maintenance: 'bg-gray-100  text-gray-500   border-gray-200',
};
const STATUS_DOT: Record<string, string> = {
  available: 'bg-green-500', occupied: 'bg-red-500', reserved: 'bg-blue-500', maintenance: 'bg-gray-400',
};

export default function TablesPage() {
  const { staff, token } = useAuthStore();
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ tableNumber: '', section: 'main', capacity: '4' });
  const [saving, setSaving] = useState(false);
  const [qrModal, setQrModal] = useState<any>(null);

  const load = async () => {
    if (!staff?.restaurantId || !token) return;
    const data: any = await adminApi.getTables(staff.restaurantId, token);
    setTables(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [staff, token]);

  const createTable = async () => {
    if (!staff?.restaurantId || !token || !form.tableNumber) return;
    setSaving(true);
    try {
      await adminApi.createTable(staff.restaurantId, { ...form, capacity: parseInt(form.capacity) }, token);
      setForm({ tableNumber: '', section: 'main', capacity: '4' });
      setShowForm(false);
      await load();
    } finally { setSaving(false); }
  };

  const updateStatus = async (id: string, status: string) => {
    if (!staff?.restaurantId || !token) return;
    await adminApi.updateTableStatus(staff.restaurantId, id, status, token);
    await load();
  };

  const deleteTable = async (id: string) => {
    if (!staff?.restaurantId || !token || !confirm('Delete this table?')) return;
    await adminApi.deleteTable(staff.restaurantId, id, token);
    await load();
  };

  const regenerateQR = async (id: string) => {
    if (!staff?.restaurantId || !token) return;
    const updated: any = await adminApi.regenerateQR(staff.restaurantId, id, token);
    setQrModal(updated);
    await load();
  };

  const sections = Array.from(new Set(tables.map((t) => t.section)));
  const occupied = tables.filter((t) => t.status === 'occupied').length;

  return (
    <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-black text-gray-900">Tables</h1>
            <p className="text-gray-400 text-xs mt-0.5">{occupied}/{tables.length} occupied</p>
          </div>
          <button onClick={() => setShowForm(true)} className="btn-primary">+ Add Table</button>
        </div>

        {/* Summary bar */}
        {!loading && tables.length > 0 && (
          <div className="grid grid-cols-4 gap-3 mb-6">
            {['available', 'occupied', 'reserved', 'maintenance'].map((s) => {
              const count = tables.filter((t) => t.status === s).length;
              return (
                <div key={s} className="card p-4 flex flex-col items-center justify-center text-center gap-1">
                  <p className="text-3xl font-black text-gray-900 leading-none">{count}</p>
                  <p className="text-xs text-gray-400 capitalize leading-none">{s}</p>
                </div>
              );
            })}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {[...Array(8)].map((_, i) => <div key={i} className="skeleton h-44" />)}
          </div>
        ) : (
          sections.map((section) => (
            <div key={section} className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest capitalize">{section}</h2>
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-xs text-gray-300">{tables.filter((t) => t.section === section).length} tables</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {tables.filter((t) => t.section === section).map((table) => (
                  <div key={table.id} className={`card p-4 border-2 ${table.status === 'occupied' ? 'border-red-200 bg-red-50/30' : 'border-transparent'}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-2xl font-black text-gray-900">T{table.tableNumber}</p>
                        <p className="text-xs text-gray-400">{table.capacity} seats</p>
                      </div>
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold border ${STATUS_STYLE[table.status]}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[table.status]}`} />
                        {table.status}
                      </div>
                    </div>

                    <select value={table.status} onChange={(e) => updateStatus(table.id, e.target.value)}
                      className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 mb-3 focus:outline-none focus:ring-1 focus:ring-orange-400 bg-white">
                      <option value="available">Available</option>
                      <option value="occupied">Occupied</option>
                      <option value="reserved">Reserved</option>
                      <option value="maintenance">Maintenance</option>
                    </select>

                    <div className="flex gap-1">
                      <button onClick={() => setQrModal(table)} className="flex-1 text-xs bg-blue-50 text-blue-600 py-1.5 rounded-lg hover:bg-blue-100 font-semibold">QR</button>
                      <button onClick={() => regenerateQR(table.id)} className="flex-1 text-xs bg-gray-50 text-gray-500 py-1.5 rounded-lg hover:bg-gray-100 font-semibold">↻</button>
                      <button onClick={() => deleteTable(table.id)} className="text-xs bg-red-50 text-red-400 px-2 py-1.5 rounded-lg hover:bg-red-100">✕</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}

        {showForm && (
          <div className="modal-overlay">
            <div className="modal max-w-sm p-6">
              <h2 className="font-black text-gray-900 text-lg mb-5">Add New Table</h2>
              <div className="space-y-3">
                <div><label className="label">Table Number</label><input value={form.tableNumber} onChange={(e) => setForm((f) => ({ ...f, tableNumber: e.target.value }))} placeholder="e.g. 9" className="input" /></div>
                <div><label className="label">Section</label>
                  <select value={form.section} onChange={(e) => setForm((f) => ({ ...f, section: e.target.value }))} className="input">
                    <option value="main">Main Hall</option>
                    <option value="outdoor">Outdoor</option>
                    <option value="bar">Bar</option>
                    <option value="private">Private</option>
                  </select>
                </div>
                <div><label className="label">Capacity</label><input value={form.capacity} onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))} type="number" min="1" className="input" /></div>
              </div>
              <div className="flex gap-2 mt-5">
                <button onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={createTable} disabled={saving} className="btn-primary flex-1">{saving ? 'Creating...' : 'Create Table'}</button>
              </div>
            </div>
          </div>
        )}

        {qrModal && (
          <div className="modal-overlay">
            <div className="modal max-w-sm p-6 text-center">
              <h2 className="font-black text-gray-900 text-lg mb-1">Table {qrModal.tableNumber}</h2>
              <p className="text-gray-400 text-sm mb-5">Print and place on the table</p>
              {qrModal.qrCodeUrl && <img src={qrModal.qrCodeUrl} alt="QR" className="w-52 h-52 mx-auto mb-4 rounded-2xl border border-gray-100" />}
              <p className="text-xs text-gray-300 mb-5 break-all font-mono">{qrModal.qrCode}</p>
              <button onClick={() => setQrModal(null)} className="btn-primary w-full">Close</button>
            </div>
          </div>
        )}
      </div>
  );
}
