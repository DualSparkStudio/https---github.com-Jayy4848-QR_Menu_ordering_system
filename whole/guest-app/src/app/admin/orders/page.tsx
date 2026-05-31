'use client';

// Admin orders page
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { adminApi } from '@/lib/api';
import {
  ORDER_FILTERS,
  FILTER_LABELS,
  STATUS_OPTIONS,
  STATUS_COLORS,
  ORDER_TO_ITEM_STATUS,
  TIME_CONSTANTS,
} from '../../../../../shared/constants';
import {
  getOrderAge,
  isDelayedOrder,
  isNewOrder,
  hasRecentItems,
  getActiveOrdersCount,
  getItemStatusFromOrderStatus,
} from '../../../../../shared/orderUtils';
import {
  initializeNotifications,
  notifyNewOrder,
  notifyOrderUpdate,
} from '../../../../../shared/notificationUtils';
import { openThermalBill, getBillImageFromStorage } from '@/lib/thermalBill';

export default function OrdersPage() {
  const { staff, token, isAuthenticated, hydrated } = useAuthStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      window.location.href = '/admin';
    }
  }, [isAuthenticated, hydrated]);

  const load = async () => {
    if (!staff?.restaurantId || !token) { setLoading(false); return; }
    try {
      const data: any = await adminApi.getOrders(staff.restaurantId, token, filter ? { status: filter } : {});
      
      // Check for new orders (compare with previous state)
      if (orders.length > 0 && data.length > orders.length) {
        const newOrders = data.filter((newOrder: any) => 
          !orders.some(oldOrder => oldOrder.id === newOrder.id)
        );
        
        // Show browser notification for new orders
        if (newOrders.length > 0) {
          newOrders.forEach((order: any) => {
            notifyNewOrder(
              order.orderNumber?.slice(-6) || order.orderNumber,
              order.table?.tableNumber || 'Unknown'
            );
          });
        }
      }
      
      setOrders(data);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filter, staff, token]);
  useEffect(() => {
    // Initialize notifications on mount
    initializeNotifications();
    
    // Reduced polling interval for faster updates
    const t = setInterval(load, TIME_CONSTANTS.POLLING_INTERVAL);
    return () => clearInterval(t);
  }, [filter, staff, token]);

  const updateStatus = async (id: string, newStatus: string) => {
    if (!token) return;
    setUpdating(id);
    try { 
      await adminApi.updateOrderStatus(id, newStatus, token); 
      
      // If order status is changed, update all items to match
      const order = orders.find(o => o.id === id);
      if (order && order.items) {
        const itemStatus = getItemStatusFromOrderStatus(newStatus);
        
        // Update all items to match the order status
        await Promise.all(
          order.items.map((item: any) => 
            adminApi.updateItemStatus(item.id, itemStatus, token)
          )
        );
      }
      
      await load(); 
    } finally { 
      setUpdating(null); 
    }
  };

  const markPaid = async (id: string) => {
    if (!token) return;
    setUpdating(id);
    try { await adminApi.markAsPaid(id, token); await load(); } finally { setUpdating(null); }
  };

  const printBill = (order: any) => {
    if (!order.restaurant) {
      alert('Unable to load restaurant details. Please refresh.');
      return;
    }
    const { image, label } = staff?.restaurantId
      ? getBillImageFromStorage(staff.restaurantId)
      : { image: null, label: 'Scan to Pay' };
    openThermalBill({
      order,
      billImage: image,
      billImageLabel: label,
      logoUrl: order.restaurant?.logo || null,
      autoPrint: false,
    });
  };


  const activeCount = orders.filter((o) => ['pending', 'confirmed', 'preparing', 'ready'].includes(o.status)).length;

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!hydrated || !isAuthenticated) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-black text-gray-900">Orders</h1>
          <p className="text-gray-400 text-xs mt-0.5">
            {activeCount > 0 ? <span className="text-orange-500 font-semibold">{activeCount} active</span> : 'No active orders'}
            {' '}· {lastRefresh.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <button onClick={load} className="btn-secondary text-xs">↻ Refresh</button>
      </div>

      <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1">
        {ORDER_FILTERS.map((f) => {
          const count = f ? orders.filter((o) => o.status === f).length : orders.length;
          return (
            <button key={f} onClick={() => setFilter(f)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${filter === f ? 'bg-orange-500 text-white' : 'bg-white border border-gray-200 text-gray-500 hover:border-orange-300'}`}>
              {FILTER_LABELS[f]}
              {count > 0 && <span className={`px-1.5 py-0.5 rounded-full text-xs ${filter === f ? 'bg-white/20' : 'bg-gray-100 text-gray-500'}`}>{count}</span>}
            </button>
          );
        })}
      </div>

      {orders.length === 0 ? (
        <div className="card py-20 text-center">
          <div className="text-5xl mb-3">📋</div>
          <p className="text-gray-400 font-medium">No orders found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const age = getOrderAge(order.createdAt);
            const isUrgent = isDelayedOrder(order.createdAt, order.status);
            const isNew = isNewOrder(order.createdAt);
            const hasRecent = hasRecentItems(order);
            
            // Determine card background color - MEDIUM FADED COLORS WITH MATCHING BORDERS
            let cardBgColor = '#ffffff'; // white
            let borderColor = '#e5e7eb'; // gray-200
            let innerBorderColor = '#e5e7eb'; // for inner elements
            if (isUrgent) {
              cardBgColor = '#fecaca'; // red-200 (medium/faded)
              borderColor = '#fecaca'; // same as background for main card
              innerBorderColor = '#fca5a5'; // slightly darker red for inner borders
            } else if (isNew) {
              cardBgColor = '#bbf7d0'; // green-200 (medium/faded)
              borderColor = '#bbf7d0'; // same as background for main card
              innerBorderColor = '#86efac'; // slightly darker green for inner borders
            } else if (hasRecent && !isNew) {
              cardBgColor = '#bfdbfe'; // blue-200 (medium/faded)
              borderColor = '#bfdbfe'; // same as background for main card
              innerBorderColor = '#93c5fd'; // slightly darker blue for inner borders
            }
            
            return (
              <div key={order.id} className="rounded-2xl overflow-hidden border-2 shadow-sm" style={{ backgroundColor: cardBgColor, borderColor: borderColor }}>
                <div className="flex flex-col sm:flex-row sm:items-start gap-4 p-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="font-black text-gray-900 text-sm">#{order.orderNumber?.slice(-10)}</span>
                      <span className={`badge badge-${order.status}`}>{order.status}</span>
                      <span className={`badge ${order.paymentStatus === 'completed' ? 'badge-paid' : 'badge-unpaid'}`}>
                        {order.paymentStatus === 'completed' ? '✓ Paid' : 'Unpaid'}
                      </span>
                      {isUrgent && <span className="badge bg-red-100 text-red-700 border border-red-300 font-bold">⚠ {age}m DELAYED</span>}
                      {isNew && <span className="badge bg-green-100 text-green-700 border border-green-300 font-bold">🆕 NEW</span>}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400 mb-2 flex-wrap">
                      <span>Table {order.table?.tableNumber}</span>
                      <span className="capitalize">· {order.table?.section}</span>
                      {order.guestName && <span>· {order.guestName}</span>}
                      <span>· {new Date(order.createdAt).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="space-y-2">
                      {order.items?.map((item: any) => {
                        const itemAge = getOrderAge(item.createdAt);
                        const isNewItem = itemAge < TIME_CONSTANTS.RECENT_ITEM_THRESHOLD && !isNew; // New item in existing order
                        const isPendingItem = item.status === 'pending';
                        
                        // Items always inherit order card colors
                        let itemBgColor = cardBgColor;
                        let itemBorderColor = isNewItem ? '#60a5fa' : innerBorderColor;
                        
                        return (
                          <div key={item.id} className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg p-3 border-2" style={{ backgroundColor: itemBgColor, borderColor: itemBorderColor }}>
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              {isNewItem && <span className="text-blue-500 text-sm flex-shrink-0">🆕</span>}
                              {isPendingItem && <span className="text-amber-600 text-sm flex-shrink-0 font-bold">⚠️</span>}
                              <span className="text-gray-400 text-sm flex-shrink-0">×{item.quantity}</span>
                              <span className="flex-1 text-gray-700 text-sm font-medium">{item.menuItem?.name}</span>
                            </div>
                            <select
                              value={item.status || 'pending'}
                              onChange={(e) => {
                                if (!token) return;
                                const newStatus = e.target.value;
                                setUpdating(item.id);
                                
                                // Optimistic update - update UI immediately
                                setOrders(prevOrders => 
                                  prevOrders.map(o => 
                                    o.id === order.id 
                                      ? {
                                          ...o,
                                          items: o.items.map((i: any) => 
                                            i.id === item.id ? { ...i, status: newStatus } : i
                                          )
                                        }
                                      : o
                                  )
                                );
                                
                                // Then update backend
                                adminApi.updateItemStatus(item.id, newStatus, token)
                                  .catch(() => load()) // Reload on error to revert
                                  .finally(() => setUpdating(null));
                              }}
                              disabled={updating === item.id}
                              className={`text-xs px-3 py-1.5 rounded-lg border cursor-pointer focus:outline-none focus:border-orange-400 disabled:opacity-50 w-full sm:w-auto font-semibold ${STATUS_COLORS[item.status || 'pending']}`}
                              style={{ backgroundColor: itemBgColor, borderColor: itemBorderColor }}
                            >
                              {STATUS_OPTIONS.map((s) => (
                                <option key={s.value} value={s.value} className="text-gray-700">{s.label}</option>
                              ))}
                            </select>
                          </div>
                        );
                      })}
                    </div>
                    {order.specialInstructions && (
                      <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-1.5 mt-2">
                        📝 {order.specialInstructions}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 flex-shrink-0">
                    <p className="font-black text-gray-900 text-lg">₹{order.totalAmount?.toFixed(0)}</p>
                    <div className="flex gap-1.5 flex-wrap justify-end items-center">
                      <button onClick={() => printBill(order)} className="text-xs px-3 py-2 rounded-xl border font-semibold transition-all hover:opacity-80" style={{ backgroundColor: cardBgColor, borderColor: innerBorderColor }}>🖨️ Bill</button>
                      {order.status === 'completed' && order.paymentStatus !== 'completed' && (
                        <button onClick={() => markPaid(order.id)} disabled={updating === order.id}
                          className="text-xs font-semibold px-3 py-2 rounded-xl bg-green-500 text-white hover:bg-green-600 transition-all disabled:opacity-50">
                          💰 Mark Paid
                        </button>
                      )}
                      <select value={order.status} disabled={updating === order.id}
                        onChange={(e) => updateStatus(order.id, e.target.value)}
                        className={`text-xs font-semibold px-3 py-2 rounded-xl border cursor-pointer focus:outline-none focus:border-orange-400 transition-all disabled:opacity-50 ${STATUS_COLORS[order.status]}`}
                        style={{ backgroundColor: cardBgColor, borderColor: innerBorderColor }}>
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s.value} value={s.value} className="text-gray-700">{s.label}</option>
                        ))}
                      </select>
                      {updating === order.id && <div className="w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
