'use client';

import { usePathname } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Don't wrap login page with AdminLayout
  if (pathname === '/admin') {
    return <>{children}</>;
  }
  
  return <AdminLayout>{children}</AdminLayout>;
}
