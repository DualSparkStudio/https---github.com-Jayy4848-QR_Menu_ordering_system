'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { adminApi } from '@/lib/api';
import Link from 'next/link';

export default function DashboardPage() {
  const { staff, token } = useAuthStore();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  const load = async () => {
    if (!staff?.restaurantId || !token) return;
    const [s, o]: any = await Promise.all([
      adminApi.getDashboard(staff.restaurantId, token),
      adminApi.getOrders(staff.restaurantId, token, {}),
    ]);
    setStats(s);
    setRecentOrders(o.slice(0, 5));
    setLoading(false);
  };

  useEffect(() => { load(); }, [staff, token]);
  useEffect(() => { const t = setInterval(load, 30000); return () => clearInterval(t); }, [staff, token]);

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const STATUS_DOT: Record<string, string> = {
    pending: 'bg-amber-400', confirmed: 'bg-blue-400', preparing: 'bg-orange-400',
    ready: 'bg-purple-400', served: 'bg-teal-400', completed: 'bg-green-400', cancelled: 'bg-red-400',
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-7">
          <div>
            <h1 className="text-2xl font-black text-gray-900">{greeting}, {staff?.name?.split(' ')[0]} 👋</h1>
            <p className="text-gray-400 text-sm mt-0.5">{now.toLocaleDateString('en', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-700 px-3 py-1.5 rounded-full text-xs font-semibold">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full live-dot" />
              Live
            </div>
            <button onClick={load} className="btn-secondary text-xs px-3 py-1.5">↻ Refresh</button>
          </div>
        </div>

        {/* Stat cards */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-28" />)}
          </div>
        ) : stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              {
                label: 'Tables', value: `${stats.tables.occupied}/${stats.tables.total}`,
                sub: `${stats.tables.available} available`, icon: '🪑',
                accent: 'from-blue-500 to-blue-600', light: 'bg-blue-50 text-blue-600',
                bar: stats.tables.total > 0 ? (stats.tables.occupied / stats.tables.total) * 100 : 0,
              },
              {
                label: "Today's Orders", value: stats.orders.today,
                sub: `${stats.orders.pending} pending`, icon: '📋',
                accent: 'from-orange-500 to-amber-500', light: 'bg-orange-50 text-orange-600',
                bar: null,
              },
              {
                label: "Today's Revenue", value: `₹${(stats.revenue.today || 0).toFixed(0)}`,
                sub: `Total ₹${(stats.revenue.total || 0).toFixed(0)}`, icon: '💰',
                accent: 'from-green-500 to-emerald-500', light: 'bg-green-50 text-green-600',
                bar: null,
              },
              {
                label: 'Avg Rating', value: `${stats.ratings.food}/5`,
                sub: `Service ${stats.ratings.service}/5`, icon: '⭐',
                accent: 'from-amber-400 to-yellow-500', light: 'bg-amber-50 text-amber-600',
                bar: (stats.ratings.food / 5) * 100,
              },
            ].map((card) => (
              <div key={card.label} className="card p-5 relative overflow-hidden group hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{card.label}</p>
                  <div className={`w-9 h-9 rounded-xl ${card.light} flex items-center justify-center text-lg`}>{card.icon}</div>
                </div>
                <p className="text-3xl font-black text-gray-900 mb-1">{card.value}</p>
                <p className="text-xs text-gray-400">{card.sub}</p>
                {card.bar !== null && (
                  <div className="mt-3 h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full bg-gradient-to-r ${card.accent} rounded-full transition-all`} style={{ width: `${card.bar}%` }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Recent orders */}
          <div className="lg:col-span-2 card">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
              <h2 className="font-bold text-gray-900">Recent Orders</h2>
              <Link href="/admin/orders" className="text-orange-500 text-xs font-semibold hover:text-orange-600">View all →</Link>
            </div>
            {recentOrders.length === 0 ? (
              <div className="py-12 text-center text-gray-300">
                <div className="text-4xl mb-2">📋</div>
                <p className="text-sm">No orders yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/50 transition-colors">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT[order.status] || 'bg-gray-300'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 text-sm">#{order.orderNumber?.slice(-8)}</span>
                        <span className="text-gray-400 text-xs">Table {order.table?.tableNumber}</span>
                      </div>
                      <p className="text-xs text-gray-400 truncate">{order.items?.map((i: any) => i.menuItem?.name).join(', ')}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-gray-900 text-sm">₹{order.totalAmount?.toFixed(0)}</p>
                      <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <span className={`badge badge-${order.status} flex-shrink-0`}>{order.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick actions + waiter calls */}
          <div className="space-y-4">
            <div className="card p-5">
              <h2 className="font-bold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { href: '/admin/orders', label: 'Orders', icon: '📋', color: 'bg-orange-50 hover:bg-orange-100 text-orange-700' },
                  { href: '/admin/tables', label: 'Tables', icon: '🪑', color: 'bg-blue-50 hover:bg-blue-100 text-blue-700' },
                  { href: '/admin/menu', label: 'Menu', icon: '🍽️', color: 'bg-green-50 hover:bg-green-100 text-green-700' },
                  { href: '/admin/coupons', label: 'Coupons', icon: '🎟️', color: 'bg-purple-50 hover:bg-purple-100 text-purple-700' },
                ].map((a) => (
                  <Link key={a.href} href={a.href} className={`${a.color} rounded-xl p-3 flex flex-col items-center gap-1.5 transition-all`}>
                    <span className="text-xl">{a.icon}</span>
                    <span className="text-xs font-semibold">{a.label}</span>
                  </Link>
                ))}
              </div>
            </div>

            {stats && (
              <div className="card p-5">
                <h2 className="font-bold text-gray-900 mb-4">Live Status</h2>
                <div className="space-y-3">
                  {[
                    { label: 'Pending Orders', value: stats.orders.pending, color: 'text-amber-600', bg: 'bg-amber-50' },
                    { label: 'Waiter Calls', value: stats.waiterCalls.pending, color: 'text-red-600', bg: 'bg-red-50' },
                    { label: 'Tables Free', value: stats.tables.available, color: 'text-green-600', bg: 'bg-green-50' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">{item.label}</span>
                      <span className={`${item.bg} ${item.color} font-bold text-sm px-3 py-1 rounded-full`}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
  );
}
