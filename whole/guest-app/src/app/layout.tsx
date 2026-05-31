import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'QR Menu — Order at your table',
  description: 'Scan, browse and order from your table',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* DNS Prefetch & Preconnect for faster connections */}
        <link rel="dns-prefetch" href="https://chnzfuszszkoaginjfwzi.supabase.co" />
        <link rel="preconnect" href="https://chnzfuszszkoaginjfwzi.supabase.co" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Preload critical resources */}
        <link rel="preload" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" as="style" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
        
        {/* Async load non-critical scripts */}
        <script src="https://checkout.razorpay.com/v1/checkout.js" async defer></script>
      </head>
      <body className="min-h-screen bg-[#fff8f3]">{children}</body>
    </html>
  );
}
