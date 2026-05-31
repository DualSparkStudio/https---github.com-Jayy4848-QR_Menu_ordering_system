'use client';

import { useState } from 'react';
import { useCartStore } from '@/store/cartStore';
import { api } from '@/lib/api';
import Link from 'next/link';

const CALLS = [
  { type: 'waiter',  icon: '🙋', label: 'Call Waiter',   desc: 'Need assistance at your table',  color: 'border-blue-200   bg-blue-50   hover:bg-blue-100' },
  { type: 'bill',    icon: '🧾', label: 'Request Bill',  desc: 'Ready to pay and leave',          color: 'border-green-200  bg-green-50  hover:bg-green-100' },
  { type: 'water',   icon: '💧', label: 'Water Please',  desc: 'Need water refill',               color: 'border-cyan-200   bg-cyan-50   hover:bg-cyan-100' },
  { type: 'napkins', icon: '🧻', label: 'Napkins',       desc: 'Need extra napkins',              color: 'border-yellow-200 bg-yellow-50 hover:bg-yellow-100' },
  { type: 'other',   icon: '💬', label: 'Other Request', desc: 'Something else',                  color: 'border-purple-200 bg-purple-50 hover:bg-purple-100' },
];

export default function WaiterPage() {
  const { tableId, restaurantId } = useCartStore();
  const [selected, setSelected] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const send = async () => {
    if (!selected || !tableId || !restaurantId) { setError('Session expired. Please scan QR again.'); return; }
    setLoading(true);
    try { await api.callWaiter(restaurantId, tableId, { type: selected, note: note || undefined }); setSuccess(true); }
    catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };

  if (success) return (
    <div className="min-h-screen hero-bg flex flex-col items-center justify-center p-6">
      <div className="card p-10 max-w-sm w-full text-center shadow-xl shadow-orange-100 bounce-in">
        <div className="w-20 h-20 bg-green-50 border-2 border-green-200 rounded-full flex items-center justify-center text-4xl mx-auto mb-5">✅</div>
        <h2 className="text-2xl font-black text-stone-900 mb-2">Request Sent!</h2>
        <p className="text-stone-400 mb-8">A staff member will be with you shortly.</p>
        <Link href="/menu" className="btn-primary block text-center">Back to Menu</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fff8f3] pb-32">
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-xl border-b border-orange-100 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link href="/menu" className="w-9 h-9 bg-orange-50 border border-orange-200 rounded-xl flex items-center justify-center text-orange-500">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </Link>
          <h1 className="font-black text-stone-900 text-xl">Need Something?</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-6 space-y-3">
        <p className="text-stone-400 text-sm mb-2">Select what you need and we'll send someone right away</p>

        {CALLS.map((c) => (
          <button key={c.type} onClick={() => setSelected(c.type)}
            className={`w-full border-2 rounded-2xl p-4 flex items-center gap-4 text-left transition-all active:scale-[0.98] ${c.color} ${selected === c.type ? 'ring-2 ring-orange-500 ring-offset-1 scale-[1.01]' : ''}`}>
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 shadow-sm">{c.icon}</div>
            <div className="flex-1">
              <p className="font-bold text-stone-900">{c.label}</p>
              <p className="text-stone-400 text-sm">{c.desc}</p>
            </div>
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${selected === c.type ? 'border-orange-500 bg-orange-500' : 'border-stone-300'}`}>
              {selected === c.type && <span className="text-white text-xs font-black">✓</span>}
            </div>
          </button>
        ))}

        {selected === 'other' && (
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Describe what you need..." rows={3} className="input-field resize-none slide-up" />
        )}

        {error && <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl p-4 text-sm">{error}</div>}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-orange-100 p-4">
        <div className="max-w-2xl mx-auto">
          <button onClick={send} disabled={!selected || loading}
            className="btn-primary w-full flex items-center justify-center gap-3 text-lg disabled:opacity-40">
            {loading ? <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <span>🔔</span>}
            {loading ? 'Sending...' : 'Send Request'}
          </button>
        </div>
      </div>
    </div>
  );
}
