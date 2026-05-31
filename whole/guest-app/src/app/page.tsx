'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tableInput, setTableInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    const table = searchParams.get('table');
    if (table) { setLoading(true); router.push(`/menu?table=${table}`); }
  }, [searchParams, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = tableInput.trim();
    if (!code) { setError('Please enter your table number'); return; }
    setLoading(true);
    router.push(`/menu?table=${code}`);
  };

  if (loading) return (
    <div className="min-h-screen hero-bg flex items-center justify-center">
      <div className="text-center slide-up">
        <div className="relative w-20 h-20 mx-auto mb-5">
          <div className="absolute inset-0 rounded-full border-4 border-orange-200" />
          <div className="absolute inset-0 rounded-full border-4 border-orange-500 border-t-transparent animate-spin" />
          <div className="absolute inset-3 rounded-full bg-orange-50 flex items-center justify-center text-2xl">🍽️</div>
        </div>
        <p className="text-stone-600 font-semibold">Loading your menu...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen hero-bg flex flex-col">
      {/* Decorative */}
      <div className="fixed top-0 right-0 w-72 h-72 bg-orange-100 rounded-full blur-3xl opacity-60 pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-64 h-64 bg-amber-100 rounded-full blur-3xl opacity-40 pointer-events-none" />

      <div className="flex-1 flex flex-col items-center justify-center px-5 py-12 relative z-10">
        {/* Brand */}
        <div className="text-center mb-10 slide-up">
          <div className="relative inline-block mb-5">
            <div className="w-24 h-24 rounded-3xl gradient-orange flex items-center justify-center text-5xl shadow-xl shadow-orange-200">
              🍽️
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full pulse-dot" />
            </div>
          </div>
          <h1 className="text-4xl font-black text-stone-900 mb-2">
            Scan & <span className="gradient-text">Order</span>
          </h1>
          <p className="text-stone-500 text-base max-w-xs mx-auto leading-relaxed">
            Scan the QR code on your table or enter your table number to start ordering
          </p>
        </div>

        {/* Card */}
        <div className="w-full max-w-sm slide-up" style={{ animationDelay: '0.1s' }}>
          {!scanning ? (
            <div className="card p-6 shadow-lg shadow-orange-100">
              {/* QR scan button */}
              <button onClick={() => setScanning(true)}
                className="w-full btn-primary flex items-center justify-center gap-3 mb-5">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z" />
                </svg>
                <span className="text-lg">Scan QR Code</span>
              </button>

              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px bg-orange-100" />
                <span className="text-stone-400 text-xs font-semibold">OR</span>
                <div className="flex-1 h-px bg-orange-100" />
              </div>

              <form onSubmit={handleSubmit}>
                <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Table Number</label>
                <input
                  value={tableInput}
                  onChange={(e) => { setTableInput(e.target.value); setError(''); }}
                  placeholder="e.g. 1, 2, 3..."
                  className="input-field text-center text-2xl font-black tracking-widest mb-3"
                  autoComplete="off"
                />
                {error && <p className="text-red-500 text-xs mb-3 text-center">{error}</p>}
                <button type="submit" disabled={!tableInput.trim()}
                  className="w-full btn-secondary font-bold text-base disabled:opacity-40">
                  Go to Menu →
                </button>
              </form>
            </div>
          ) : (
            <QRScannerView
              onResult={(code) => { setScanning(false); router.push(`/menu?table=${code}`); }}
              onClose={() => setScanning(false)}
            />
          )}
        </div>

        {/* Features */}
        <div className="flex gap-8 mt-8 slide-up" style={{ animationDelay: '0.2s' }}>
          {[['⚡', 'Instant Order'], ['🍽️', 'Table Service']].map(([icon, label]) => (
            <div key={label} className="text-center">
              <div className="text-xl mb-1">{icon}</div>
              <p className="text-stone-400 text-xs font-semibold">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function QRScannerView({ onResult, onClose }: { onResult: (code: string) => void; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [camError, setCamError] = useState('');
  const [manualCode, setManualCode] = useState('');

  useEffect(() => {
    let stream: MediaStream | null = null;
    let interval: NodeJS.Timeout;
    const start = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
        if ('BarcodeDetector' in window) {
          const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
          interval = setInterval(async () => {
            if (videoRef.current?.readyState === 4) {
              const codes = await detector.detect(videoRef.current).catch(() => []);
              if (codes.length) {
                const raw = codes[0].rawValue as string;
                const match = raw.match(/[?&]table=([^&]+)/);
                onResult(match ? match[1] : raw);
              }
            }
          }, 500);
        }
      } catch { setCamError('Camera access denied. Enter table number below.'); }
    };
    start();
    return () => { clearInterval(interval); stream?.getTracks().forEach((t) => t.stop()); };
  }, [onResult]);

  return (
    <div className="card overflow-hidden shadow-xl shadow-orange-100 bounce-in">
      <div className="relative">
        <video ref={videoRef} className="w-full aspect-square object-cover" playsInline muted />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-52 h-52">
            {['tl', 'tr', 'bl', 'br'].map((pos) => (
              <div key={pos} className={`absolute w-10 h-10 border-orange-500 ${
                pos === 'tl' ? 'top-0 left-0 border-t-4 border-l-4 rounded-tl-xl' :
                pos === 'tr' ? 'top-0 right-0 border-t-4 border-r-4 rounded-tr-xl' :
                pos === 'bl' ? 'bottom-0 left-0 border-b-4 border-l-4 rounded-bl-xl' :
                'bottom-0 right-0 border-b-4 border-r-4 rounded-br-xl'
              }`} />
            ))}
            <div className="absolute left-2 right-2 h-0.5 bg-orange-500/60 top-1/2 animate-pulse" />
          </div>
        </div>
        <button onClick={onClose} className="absolute top-3 right-3 w-9 h-9 bg-white/80 rounded-full flex items-center justify-center text-stone-600 shadow-sm">✕</button>
      </div>
      <div className="p-4 bg-white">
        {camError ? <p className="text-red-500 text-sm text-center mb-3">{camError}</p>
          : <p className="text-stone-400 text-sm text-center mb-3">Point camera at the QR code on your table</p>}
        <form onSubmit={(e) => { e.preventDefault(); if (manualCode.trim()) onResult(manualCode.trim()); }} className="flex gap-2">
          <input value={manualCode} onChange={(e) => setManualCode(e.target.value)} placeholder="Or type table number" className="input-field flex-1 py-2.5 text-sm" />
          <button type="submit" className="bg-orange-500 text-white px-4 rounded-xl font-bold text-sm hover:bg-orange-600">Go</button>
        </form>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen hero-bg flex items-center justify-center"><div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <HomeContent />
    </Suspense>
  );
}
