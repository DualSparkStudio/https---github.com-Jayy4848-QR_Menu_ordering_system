'use client';

import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNotificationStore, type OrderNotification } from './notificationStore';

interface ToastItem {
  id: string;
  notification: OrderNotification;
  exiting: boolean;
}

interface NotificationToastProps {
  onViewOrders?: () => void;
}

export function NotificationToast({ onViewOrders }: NotificationToastProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const notifications = useNotificationStore((s) => s.notifications);
  const markAsRead = useNotificationStore((s) => s.markAsRead);
  const [lastSeenId, setLastSeenId] = useState<string | null>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (notifications.length === 0) return;
    const latest = notifications[0];
    if (!latest || latest.id === lastSeenId || latest.read) return;

    setLastSeenId(latest.id);

    const toastItem: ToastItem = { id: latest.id, notification: latest, exiting: false };

    setToasts((prev) => {
      if (prev.some((t) => t.id === latest.id)) return prev;
      return [toastItem, ...prev].slice(0, 3);
    });

    // Auto-dismiss after 2 seconds
    const timer = setTimeout(() => dismissToast(latest.id), 2000);
    return () => clearTimeout(timer);
  }, [notifications, lastSeenId]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 300);
  }, []);

  const handleClick = useCallback((id: string) => {
    markAsRead(id);
    dismissToast(id);
    onViewOrders?.();
  }, [markAsRead, dismissToast, onViewOrders]);

  if (!mounted || toasts.length === 0) return null;

  return createPortal(
    <div
      className="fixed top-4 right-4 z-[99999] flex flex-col gap-2"
      style={{ maxWidth: 'min(360px, calc(100vw - 32px))' }}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          style={{
            animation: toast.exiting
              ? 'toast-out 0.3s ease-in forwards'
              : 'toast-in 0.35s ease-out forwards',
          }}
        >
          <div
            className="bg-white rounded-xl overflow-hidden"
            style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08)' }}
          >
            {/* Orange accent bar */}
            <div className="h-[3px] bg-gradient-to-r from-orange-500 to-amber-400" />

            <div className="flex items-start gap-3 px-4 py-3">
              {/* Icon */}
              <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center text-base flex-shrink-0">
                🔔
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handleClick(toast.id)}>
                <p className="text-sm font-bold text-gray-900 truncate">{toast.notification.title}</p>
                <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">{toast.notification.message}</p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="bg-gray-100 text-gray-600 text-[10px] font-semibold px-1.5 py-0.5 rounded">
                    T-{toast.notification.tableNumber}
                  </span>
                  <span className="bg-green-50 text-green-700 text-[10px] font-bold px-1.5 py-0.5 rounded">
                    ₹{toast.notification.totalAmount?.toFixed?.(0) ?? toast.notification.totalAmount}
                  </span>
                </div>
              </div>

              {/* Close button — stops propagation so it doesn't trigger handleClick */}
              <button
                onClick={(e) => { e.stopPropagation(); e.preventDefault(); dismissToast(toast.id); }}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all flex-shrink-0 -mt-0.5 -mr-1"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>,
    document.body,
  );
}
