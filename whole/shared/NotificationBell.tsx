'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNotificationStore, playNotificationSound, type OrderNotification } from './notificationStore';

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 10) return 'Just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

interface NotificationBellProps {
  onViewOrders?: () => void;
}

/* ═══════════════════════════════════════════════════════════════════════════
   RIGHT-SIDE DRAWER PANEL (rendered via Portal into document.body)
   ═══════════════════════════════════════════════════════════════════════════ */
function NotificationDrawer({
  onClose,
  onViewOrders,
}: {
  onClose: () => void;
  onViewOrders?: () => void;
}) {
  const {
    notifications,
    unreadCount,
    soundEnabled,
    markAsRead,
    markAllAsRead,
    clearAll,
    toggleSound,
    addNotification,
  } = useNotificationStore();

  const [closing, setClosing] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick((v) => v + 1), 30000);
    return () => clearInterval(t);
  }, []);

  // ESC key to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const handleClose = () => {
    setClosing(true);
    setTimeout(onClose, 280);
  };

  const handleNotificationClick = (notif: OrderNotification) => {
    markAsRead(notif.id);
    handleClose();
    onViewOrders?.();
  };

  const handleTestSound = () => {
    playNotificationSound();
    addNotification({
      type: 'new_order',
      title: 'Test Order',
      message: 'This is a test notification to verify sound & display.',
      orderNumber: 'TEST-001',
      tableNumber: '1',
      totalAmount: 450,
      itemCount: 3,
    });
  };

  return createPortal(
    <div className="fixed inset-0 z-[99998]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 transition-opacity duration-300"
        style={{ opacity: closing ? 0 : 1 }}
        onClick={handleClose}
      />

      {/* ── Drawer Panel (slides in from RIGHT) ── */}
      <div
        className="absolute top-0 right-0 bottom-0 w-[420px] max-w-[90vw] bg-white shadow-2xl flex flex-col"
        style={{
          transform: closing ? 'translateX(100%)' : 'translateX(0)',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '-8px 0 40px rgba(0,0,0,0.12)',
        }}
      >
        {/* ── Header ── */}
        <div className="px-5 pt-5 pb-4 border-b border-gray-100" style={{ background: 'linear-gradient(135deg, #fff7ed 0%, #fffbeb 50%, #ffffff 100%)' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center shadow-md shadow-orange-500/20">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Notifications</h2>
                <p className="text-xs text-gray-500">
                  {unreadCount > 0 ? `${unreadCount} new` : 'All caught up'}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Action pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={toggleSound}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                soundEnabled
                  ? 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100'
                  : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100'
              }`}
            >
              {soundEnabled ? '🔔 Sound On' : '🔕 Sound Off'}
            </button>
            <button
              onClick={handleTestSound}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 transition-all"
            >
              🔊 Test
            </button>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-50 text-green-600 border border-green-200 hover:bg-green-100 transition-all"
              >
                ✓ Read all
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={clearAll}
                className="ml-auto px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* ── Notification List ── */}
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-8">
              <div className="w-20 h-20 mb-5 bg-gray-50 rounded-2xl flex items-center justify-center">
                <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-gray-800 mb-1.5">No notifications</h3>
              <p className="text-sm text-gray-400 text-center leading-relaxed mb-6">
                New order alerts will appear here in real-time
              </p>
              <button
                onClick={handleTestSound}
                className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-bold rounded-xl hover:shadow-lg hover:shadow-orange-500/25 active:scale-[0.98] transition-all"
              >
                🔊 Test Notification
              </button>
            </div>
          ) : (
            <div>
              {notifications.map((notif, i) => (
                <button
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`w-full text-left px-5 py-4 transition-all hover:bg-orange-50/50 group border-b border-gray-50 ${
                    !notif.read ? 'bg-orange-50/30' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-base flex-shrink-0 ${
                      notif.type === 'new_order'
                        ? 'bg-gradient-to-br from-orange-100 to-amber-50'
                        : 'bg-gradient-to-br from-blue-100 to-cyan-50'
                    }`}>
                      {notif.type === 'new_order' ? '🆕' : '📝'}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                          {notif.title}
                          {!notif.read && <span className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0" />}
                        </span>
                        <span className="text-[11px] text-gray-400 flex-shrink-0">{timeAgo(notif.timestamp)}</span>
                      </div>
                      <p className="text-xs text-gray-500 mb-2">{notif.message}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="bg-gray-100 text-gray-700 text-[11px] font-semibold px-2 py-0.5 rounded-md">
                          🪑 Table {notif.tableNumber}
                        </span>
                        <span className="bg-gray-100 text-gray-700 text-[11px] font-semibold px-2 py-0.5 rounded-md">
                          🍽️ {notif.itemCount} items
                        </span>
                        <span className="bg-green-50 text-green-700 text-[11px] font-bold px-2 py-0.5 rounded-md">
                          ₹{notif.totalAmount?.toFixed?.(0) ?? notif.totalAmount}
                        </span>
                        <span className="ml-auto text-[11px] text-orange-500 opacity-0 group-hover:opacity-100 font-semibold transition-opacity">
                          View order →
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        {notifications.length > 0 && onViewOrders && (
          <div className="border-t border-gray-100 px-5 py-3 bg-gray-50/50">
            <button
              onClick={() => { handleClose(); setTimeout(() => onViewOrders(), 300); }}
              className="w-full py-2.5 text-center text-sm font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl hover:shadow-lg hover:shadow-orange-500/20 active:scale-[0.98] transition-all"
            >
              📋 View All Orders
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   BELL BUTTON
   ═══════════════════════════════════════════════════════════════════════════ */
export function NotificationBell({ onViewOrders }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const { unreadCount } = useNotificationStore();

  const handleBellClick = () => {
    setOpen(true);
    // Unlock AudioContext on user interaction
    if (typeof window !== 'undefined') {
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        ctx.resume().then(() => ctx.close());
      } catch {}
    }
  };

  return (
    <>
      <button
        id="notification-bell"
        onClick={handleBellClick}
        className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 hover:bg-orange-500/30 border border-white/10 hover:border-orange-400/40 transition-all group"
        title="Notifications"
        style={{ minWidth: '36px' }}
      >
        <svg
          className="w-[18px] h-[18px] text-orange-400 group-hover:text-orange-300 transition-colors"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>

        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full notification-badge-pulse shadow-lg shadow-red-500/30">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && <NotificationDrawer onClose={() => setOpen(false)} onViewOrders={onViewOrders} />}
    </>
  );
}
