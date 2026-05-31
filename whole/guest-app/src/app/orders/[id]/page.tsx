'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import Link from 'next/link';
import { initializeNotifications, showNotification } from '../../../../../shared/notificationUtils';

const STEPS = [
  { key: 'pending',   label: 'Order Placed',  icon: '📋', desc: 'We received your order' },
  { key: 'confirmed', label: 'Confirmed',      icon: '✅', desc: 'Kitchen is on it' },
  { key: 'preparing', label: 'Preparing',      icon: '👨‍🍳', desc: 'Being cooked fresh' },
  { key: 'ready',     label: 'Ready',          icon: '🔔', desc: 'On its way to you' },
  { key: 'served',    label: 'Served',         icon: '🍽️', desc: 'Enjoy your meal!' },
  { key: 'completed', label: 'Completed',      icon: '✨', desc: 'Thank you!' },
];

function Confetti() {
  const pieces = useRef(Array.from({ length: 40 }, (_, i) => ({
    id: i, x: Math.random() * 100, delay: Math.random() * 2,
    size: Math.random() * 6 + 4,
    color: ['#f97316','#f59e0b','#10b981','#3b82f6','#8b5cf6','#ec4899'][Math.floor(Math.random() * 6)],
  })));
  return (
    <>
      <style>{`@keyframes fall { 0% { transform: translateY(-20px) rotate(0deg); opacity:1; } 100% { transform: translateY(110vh) rotate(720deg); opacity:0; } }`}</style>
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {pieces.current.map((p) => (
          <div key={p.id} style={{ position: 'absolute', left: `${p.x}%`, top: '-20px', width: p.size, height: p.size, background: p.color, borderRadius: Math.random() > 0.5 ? '50%' : '2px', animation: `fall ${1.5 + Math.random()}s ${p.delay}s ease-in forwards` }} />
        ))}
      </div>
    </>
  );
}

function OrderContent() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const isNew = searchParams.get('new') === '1';
  const isPaid = searchParams.get('paid') === '1';

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showCelebration, setShowCelebration] = useState(isNew);
  const [lastStatus, setLastStatus] = useState<string | null>(null);
  const [lastPaymentStatus, setLastPaymentStatus] = useState<string | null>(null);
  const hasNotifiedRef = useRef(false);

  // Fallback polling with notification tracking
  useEffect(() => {
    let pollInterval: NodeJS.Timeout;

    const pollOrder = async () => {
      try {
        const updatedOrder: any = await api.getOrder(id);
        
        // Check if order is completed AND paid - redirect to home
        if (updatedOrder.status === 'completed' && updatedOrder.paymentStatus === 'completed') {
          console.log('🎉 Order completed and paid (polling) - redirecting to home...');
          
          // Show notification only once
          if (!hasNotifiedRef.current) {
            hasNotifiedRef.current = true;
            
            try {
              showNotification({
                title: 'Payment Completed!',
                body: 'Thank you for dining with us!',
                icon: '/icon.png',
                vibrate: [200, 100, 200],
              });
            } catch (err) {
              console.error('Notification failed:', err);
            }
            
            // Vibrate
            if ('vibrate' in navigator) {
              navigator.vibrate([200, 100, 200, 100, 200]);
            }
          }
          
          // Redirect to home
          router.push('/');
          return;
        }
        
        setOrder(updatedOrder);
        setLastStatus(updatedOrder.status);
        setLastPaymentStatus(updatedOrder.paymentStatus);
        if (loading) setLoading(false);
      } catch (err) {
        console.error('Poll error:', err);
      }
    };

    // Poll every 5 seconds
    pollInterval = setInterval(pollOrder, 5000);

    // Initialize notifications
    initializeNotifications();

    return () => {
      clearInterval(pollInterval);
    };
  }, [id, loading]);

  // Fallback: initial load
  useEffect(() => {
    const load = async () => {
      try {
        const data: any = await api.getOrder(id);
        setOrder(data);
        setLastStatus(data.status);
        if (isNew) setShowConfetti(true);
      } catch {
        router.push('/');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  useEffect(() => { if (showConfetti) { const t = setTimeout(() => setShowConfetti(false), 3500); return () => clearTimeout(t); } }, [showConfetti]);
  useEffect(() => { if (showCelebration) { const t = setTimeout(() => setShowCelebration(false), 3000); return () => clearTimeout(t); } }, [showCelebration]);

  if (loading) return (
    <div className="min-h-screen hero-bg flex items-center justify-center">
      <div className="text-center">
        <div className="relative w-14 h-14 mx-auto mb-4">
          <div className="absolute inset-0 rounded-full border-4 border-orange-200" />
          <div className="absolute inset-0 rounded-full border-4 border-orange-500 border-t-transparent animate-spin" />
        </div>
        <p className="text-stone-400 text-sm">Loading your order...</p>
      </div>
    </div>
  );

  if (!order) return null;

  const stepIndex = STEPS.findIndex((s) => s.key === order.status);
  const currentStep = STEPS[Math.max(0, stepIndex)];
  const isCancelled = order.status === 'cancelled';
  const isCompleted = order.status === 'completed';
  const isPaidOrder = order.paymentStatus === 'completed';
  const cgstPct = order.restaurant?.cgstPercentage ?? 0;
  const sgstPct = order.restaurant?.sgstPercentage ?? 0;
  const orderSubtotal = order.subtotal || 0;
  const displayCgst = (order.cgstAmount || 0) > 0 ? order.cgstAmount : (orderSubtotal * cgstPct) / 100;
  const displaySgst = (order.sgstAmount || 0) > 0 ? order.sgstAmount : (orderSubtotal * sgstPct) / 100;

  return (
    <div className="min-h-screen bg-[#fff8f3]">
      {showConfetti && <Confetti />}

      {showCelebration && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={() => setShowCelebration(false)}>
          <div className="text-center bounce-in px-6">
            <div className="text-8xl mb-5 animate-bounce">🎉</div>
            <h1 className="text-4xl font-black text-white mb-2 drop-shadow-lg">Order Placed!</h1>
            <p className="text-white/80 text-lg drop-shadow">{isPaid ? '✅ Payment successful!' : 'Your order is confirmed'}</p>
            <p className="text-white/50 text-sm mt-2">Tap anywhere to continue</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-xl border-b border-orange-100 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link href={`/menu?table=${order.table?.qrCode || order.table?.tableNumber}`} className="w-9 h-9 bg-orange-50 border border-orange-200 rounded-xl flex items-center justify-center text-orange-500">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </Link>
          <div>
            <h1 className="font-black text-stone-900 text-lg leading-tight">#{order.orderNumber}</h1>
            <p className="text-stone-400 text-xs">Table {order.table?.tableNumber} · {order.table?.section}</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {isPaidOrder && <span className="bg-green-50 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full border border-green-200">✓ Paid</span>}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${isCancelled ? 'bg-red-50 text-red-600 border border-red-200' : isCompleted ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-orange-50 text-orange-600 border border-orange-200'}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${isCancelled ? 'bg-red-500' : isCompleted ? 'bg-green-500' : 'bg-orange-500 pulse-dot'}`} />
              {order.status}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-5 pb-10 space-y-4">
        {/* Confirmation banner */}
        {!isCancelled && !isCompleted && (
          <div className="card p-6 text-center border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 shadow-lg shadow-orange-100 slide-up">
            <div className="text-5xl mb-3">{currentStep.icon}</div>
            <h2 className="text-2xl font-black text-stone-900 mb-1">{currentStep.label}</h2>
            <p className="text-stone-500 text-sm">{currentStep.desc}</p>
          </div>
        )}

        {/* Completed order banner */}
        {isCompleted && !isCancelled && (
          <div className="card p-6 text-center border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg shadow-green-100 slide-up">
            <div className="text-5xl mb-3">✨</div>
            <h2 className="text-2xl font-black text-stone-900 mb-1">Order Completed!</h2>
            <p className="text-stone-500 text-sm">Hope you enjoyed your meal</p>
          </div>
        )}

        {/* Status tracker */}
        {!isCancelled && (
          <div className="card p-5 shadow-sm shadow-orange-50">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 rounded-2xl bg-orange-50 border-2 border-orange-200 flex items-center justify-center text-3xl flex-shrink-0">{currentStep.icon}</div>
              <div className="flex-1">
                <h3 className="font-black text-stone-900 text-xl">{currentStep.label}</h3>
                <p className="text-stone-400 text-sm">{currentStep.desc}</p>
              </div>
              <div className="text-right">
                <p className="text-stone-300 text-xs">Est. time</p>
                <p className="text-orange-500 font-bold text-sm">
                  {order.estimatedTime ? `~${order.estimatedTime} min` : '—'}
                </p>
              </div>
            </div>
            <div className="flex items-center">
              {STEPS.map((step, i) => (
                <div key={step.key} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center gap-1">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-black transition-all ${i < stepIndex ? 'bg-orange-500 text-white shadow-md shadow-orange-200' : i === stepIndex ? 'bg-orange-500 text-white ring-4 ring-orange-200 shadow-md shadow-orange-200' : 'bg-orange-50 text-stone-300 border-2 border-orange-100'}`}>
                      {i < stepIndex ? '✓' : <span className="text-base">{step.icon}</span>}
                    </div>
                    <span className={`text-[10px] font-semibold text-center leading-tight ${i <= stepIndex ? 'text-orange-500' : 'text-stone-300'}`}>{step.label.split(' ')[0]}</span>
                  </div>
                  {i < STEPS.length - 1 && <div className={`flex-1 h-1 mb-4 mx-1 rounded-full transition-all ${i < stepIndex ? 'bg-orange-500' : 'bg-orange-100'}`} />}
                </div>
              ))}
            </div>
          </div>
        )}

        {isCancelled && (
          <div className="card p-6 text-center border-2 border-red-200 bg-red-50">
            <div className="text-5xl mb-3">❌</div>
            <h3 className="font-black text-stone-900 text-xl mb-1">Order Cancelled</h3>
            <p className="text-stone-400 text-sm">Please contact staff for assistance</p>
          </div>
        )}

        {/* Items */}
        <div className="card overflow-hidden shadow-sm shadow-orange-50">
          <div className="px-5 py-3.5 border-b border-orange-50 flex items-center justify-between">
            <h3 className="font-bold text-stone-400 text-xs uppercase tracking-wider">Order Items</h3>
            <span className="text-stone-300 text-xs">{order.items?.length} items</span>
          </div>
          {order.items?.map((item: any, idx: number) => (
            <div key={item.id} className={`flex items-center gap-3 px-5 py-3.5 ${idx < order.items.length - 1 ? 'border-b border-orange-50' : ''}`}>
              {item.menuItem?.image
                ? <img src={item.menuItem.image} alt={item.menuItem.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                : <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-xl flex-shrink-0">🍽️</div>
              }
              <div className="flex-1 min-w-0">
                <p className="text-stone-900 font-semibold text-sm">{item.menuItem?.name}</p>
                {item.specialInstructions && <p className="text-stone-400 text-xs mt-0.5">{item.specialInstructions}</p>}
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-stone-400 text-xs">×{item.quantity}</p>
                <p className="text-orange-500 font-bold text-sm">₹{((item.price || 0) * (item.quantity || 1)).toFixed(0)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Bill */}
        <div className="card p-5 shadow-sm shadow-orange-50">
          {/* Bill Details */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-stone-400 text-xs uppercase tracking-wider">Bill Summary</h3>
            <span className="text-stone-400 text-xs">#{order.orderNumber}</span>
          </div>
          
          <div className="space-y-2.5">
            <div className="flex justify-between text-sm"><span className="text-stone-500">Subtotal</span><span className="text-stone-900 font-medium">₹{(order.subtotal || 0).toFixed(2)}</span></div>
            {(order.taxAmount || 0) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Tax ({order.restaurant?.taxPercentage || 0}%)</span>
                <span className="text-stone-900 font-medium">₹{(order.taxAmount || 0).toFixed(2)}</span>
              </div>
            )}
            {(order.serviceCharge || 0) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Service Charge ({order.restaurant?.serviceChargePercentage || 0}%)</span>
                <span className="text-stone-900 font-medium">₹{(order.serviceCharge || 0).toFixed(2)}</span>
              </div>
            )}
            {(displayCgst > 0 || cgstPct > 0) && (
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">CGST ({cgstPct}%)</span>
                <span className="text-stone-900 font-medium">₹{displayCgst.toFixed(2)}</span>
              </div>
            )}
            {(displaySgst > 0 || sgstPct > 0) && (
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">SGST ({sgstPct}%)</span>
                <span className="text-stone-900 font-medium">₹{displaySgst.toFixed(2)}</span>
              </div>
            )}
            {(order.discountAmount || 0) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-green-600 font-semibold">Discount {order.couponCode && `(${order.couponCode})`}</span>
                <span className="text-green-600 font-semibold">−₹{(order.discountAmount || 0).toFixed(2)}</span>
              </div>
            )}
          </div>
          
          <div className="border-t-2 border-orange-200 mt-3 pt-3 flex justify-between items-center">
            <span className="font-bold text-stone-900 text-lg">Total Amount</span>
            <span className="font-black text-orange-500 text-2xl">₹{(order.totalAmount || 0).toFixed(2)}</span>
          </div>
          
          <div className="mt-3 flex items-center justify-between">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${isPaidOrder ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
              {isPaidOrder ? '✓ Paid' : '⏳ Pay at table'}
            </span>
            <span className="text-stone-400 text-xs">
              {new Date(order.createdAt).toLocaleString('en-IN', { 
                day: '2-digit', 
                month: 'short', 
                year: 'numeric',
                hour: '2-digit', 
                minute: '2-digit'
              })}
            </span>
          </div>
        </div>

        {/* Actions */}
        {!isPaidOrder && (
          <div className="grid grid-cols-1 gap-3 pb-4">
            <Link href={`/menu?table=${order.table?.qrCode || order.table?.tableNumber}`} className="card border-2 border-orange-200 text-orange-600 font-bold py-4 rounded-2xl text-center text-sm hover:bg-orange-50 transition-all flex items-center justify-center gap-2">
              🍽️ Order More
            </Link>
          </div>
        )}
        
        {isPaidOrder && (
          <div className="card p-5 text-center border-2 border-green-200 bg-green-50">
            <div className="text-3xl mb-2">✅</div>
            <p className="text-green-700 font-bold text-sm">Order completed and paid</p>
            <p className="text-green-600 text-xs mt-1">Thank you for dining with us!</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OrderPage() {
  return (
    <Suspense fallback={<div className="min-h-screen hero-bg flex items-center justify-center"><div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <OrderContent />
    </Suspense>
  );
}
