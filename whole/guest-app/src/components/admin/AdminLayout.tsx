'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { useOrderNotifications } from '../../../../shared/useOrderNotifications';
import { NotificationBell } from '../../../../shared/NotificationBell';
import { NotificationToast } from '../../../../shared/NotificationToast';

const NAV = [
  { href: '/admin/dashboard', label: 'Dashboard',  emoji: '📊' },
  { href: '/admin/orders',    label: 'Orders',     emoji: '📋' },
  { href: '/admin/menu',      label: 'Menu',       emoji: '🍽️' },
  { href: '/admin/tables',    label: 'Tables',     emoji: '🪑' },
  { href: '/admin/qrcodes',   label: 'QR Codes',   emoji: '📱' },
  { href: '/admin/coupons',   label: 'Coupons',    emoji: '🎟️' },
  { href: '/admin/settings',  label: 'Settings',   emoji: '⚙️' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { staff, token, logout, isAuthenticated, hydrated } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // ── Order Notification System ──
  useOrderNotifications({
    restaurantId: staff?.restaurantId,
    enabled: isAuthenticated && !!staff?.restaurantId,
  });

  const navigateToOrders = () => {
    router.push('/admin/orders');
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Only redirect after hydration is complete
    if (hydrated && !isAuthenticated) {
      router.replace('/admin');
    }
  }, [isAuthenticated, hydrated, router]);

  // Show spinner while checking auth / redirecting or while hydrating
  if (!mounted || !hydrated || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#f8f9fb] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8f9fb]">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg flex items-center justify-center text-base">🍽️</div>
          <div>
            <p className="text-gray-900 font-bold text-sm leading-tight">ForkAdmin</p>
            <p className="text-gray-400 text-xs capitalize">{staff?.role}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {/* Mobile Notification Bell */}
          <div className="[&_svg]:!text-gray-500 [&_button]:hover:!bg-gray-100">
            <NotificationBell onViewOrders={navigateToOrders} />
          </div>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-lg">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`sidebar flex flex-col transition-all duration-300 ${collapsed ? 'w-[68px]' : 'w-[220px]'} flex-shrink-0 lg:relative fixed inset-y-0 left-0 z-40 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        {/* Logo */}
        <div className={`flex items-center gap-3 px-4 py-5 border-b border-white/5 ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg flex items-center justify-center text-base flex-shrink-0">🍽️</div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-white font-bold text-sm leading-tight truncate">ForkAdmin</p>
              <p className="text-white/30 text-xs capitalize truncate">{staff?.role}</p>
            </div>
          )}
          {/* Desktop Notification Bell */}
          {!collapsed && (
            <NotificationBell onViewOrders={navigateToOrders} />
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link key={item.href} href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`nav-item ${active ? 'active' : ''} ${collapsed ? 'justify-center px-2' : ''}`}
                title={collapsed ? item.label : undefined}
              >
                <span className="text-base flex-shrink-0">{item.emoji}</span>
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User + collapse */}
        <div className="border-t border-white/5 p-3 space-y-2">
          {!collapsed && (
            <div className="flex items-center gap-2.5 px-2 py-1.5">
              <div className="w-7 h-7 bg-orange-500/20 rounded-full flex items-center justify-center text-orange-400 font-bold text-xs flex-shrink-0">
                {staff?.name?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white/70 text-xs font-medium truncate">{staff?.name}</p>
                <p className="text-white/25 text-xs truncate">{staff?.email}</p>
              </div>
            </div>
          )}
          <button onClick={() => { logout(); router.push('/admin'); setMobileMenuOpen(false); }}
            className={`nav-item w-full text-red-400/60 hover:text-red-400 hover:bg-red-500/10 ${collapsed ? 'justify-center px-2' : ''}`}
            title={collapsed ? 'Sign out' : undefined}
          >
            <span className="text-base">🚪</span>
            {!collapsed && <span>Sign out</span>}
          </button>
          <button onClick={() => setCollapsed(!collapsed)}
            className="nav-item w-full justify-center text-white/20 hover:text-white/50 hidden lg:flex"
          >
            <span className="text-sm">{collapsed ? '→' : '←'}</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto min-w-0 pt-16 lg:pt-0">
        {children}
      </main>

      {/* Notification Toasts — render at layout level for all pages */}
      <NotificationToast onViewOrders={navigateToOrders} />
    </div>
  );
}
