'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import { useRestaurantStore } from '@/store/restaurantStore';
import { useOrderStore } from '@/store/orderStore';
import { api } from '@/lib/api';
import Link from 'next/link';
import { showNotification } from '../../../../shared/notificationUtils';
import { calculateOrderTotals } from '../../../../shared/orderUtils';

declare global { interface Window { Razorpay: any; } }

// Move Section component outside to prevent re-creation on every render
const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="card p-5 shadow-sm shadow-orange-50">
    <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-4">{title}</h3>
    {children}
  </div>
);

export default function CartPage() {
  const router = useRouter();
  const { cart, updateQuantity, clearCart, getTotal, tableId, restaurantId, setActiveSession, sessionId } = useCartStore();
  const { restaurant, table } = useRestaurantStore();
  const { setCurrentOrder } = useOrderStore();

  const [instructions, setInstructions] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showMergeNotice, setShowMergeNotice] = useState(false);
  const [existingOrders, setExistingOrders] = useState<any[]>([]);
  const [loadingExisting, setLoadingExisting] = useState(true);

  const subtotal = getTotal();
  const cgstPct = restaurant?.cgstPercentage ?? 0;
  const sgstPct = restaurant?.sgstPercentage ?? 0;
  const { taxAmount: tax, serviceCharge, cgstAmount, sgstAmount, totalAmount: total } = calculateOrderTotals(
    subtotal,
    restaurant?.taxPercentage ?? 0,
    restaurant?.serviceChargePercentage ?? 0,
    couponDiscount,
    cgstPct,
    sgstPct
  );
  const currency = '₹';

  // Calculate existing order total
  const existingTotal = existingOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
  const grandTotal = total + existingTotal;

  // Load existing orders on mount
  useEffect(() => {
    const loadExistingOrders = async () => {
      if (!tableId || !sessionId) return;
      setLoadingExisting(true);
      try {
        const orders: any = await api.getActiveOrders(tableId, sessionId);
        setExistingOrders(orders);
      } catch (err) {
        console.error('Failed to load existing orders:', err);
        setExistingOrders([]);
      } finally {
        setLoadingExisting(false);
      }
    };
    loadExistingOrders();
  }, [tableId, sessionId]);

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    // OPTIMISTIC UPDATE - Update UI instantly
    updateQuantity(itemId, newQuantity);
  };

  const applyCoupon = async () => {
    if (!couponCode.trim() || !restaurantId || !tableId) return;
    const currentSubtotal = getTotal();
    if (currentSubtotal <= 0) {
      setCouponError('Add items to your cart first.');
      return;
    }
    setValidatingCoupon(true);
    setCouponError('');
    try {
      const result: any = await api.validateCoupon(restaurantId, couponCode, currentSubtotal, tableId);
      const discount =
        result?.discountAmount ??
        result?.discount ??
        result?.coupon?.discountAmount ??
        0;
      const amount = Number(discount);
      if (!Number.isFinite(amount) || amount <= 0) {
        setCouponError('Coupon discount value is 0. Please check the coupon configuration.');
        setCouponDiscount(0);
        setCouponApplied(false);
        return;
      }
      setCouponDiscount(amount);
      setCouponApplied(true);
    } catch (e: any) { 
      setCouponError(e.message); 
      setCouponDiscount(0); 
      setCouponApplied(false); 
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleCouponChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase();
    setCouponCode(val);
    setCouponDiscount(0);
    setCouponApplied(false);
    setCouponError('');
  };

  const createPayload = () => ({
    items: cart.map((i) => ({ menuItemId: i.id, quantity: i.quantity })),
    guestCount: 1,
    specialInstructions: instructions || undefined,
    couponCode: couponApplied ? couponCode : undefined,
    sessionId: sessionId,
  });

  const handlePayLater = async () => {
    if (!tableId || !restaurantId) { setError('Session expired. Please scan QR again.'); return; }
    setLoading(true); setError('');
    try {
      const order: any = await api.createOrder(restaurantId, tableId, createPayload());
      setCurrentOrder(order);
      setActiveSession(true);
      
      // Show browser notification (non-blocking, ignore errors)
      try {
        await showNotification({
          title: '🎉 Order Placed!',
          body: `Order #${order.orderNumber?.slice(-6)} has been placed successfully`,
          icon: '/icon.png',
        });
      } catch (notifErr) {
        console.error('Notification failed:', notifErr);
      }
      
      // Navigate to order details page first
      router.push(`/orders/${order.id}?new=1`);
      
      // Clear cart after navigation starts (prevents empty cart UI from showing)
      setTimeout(() => clearCart(), 50);
    } catch (e: any) { 
      setError(e.message); 
      setLoading(false); 
    }
  };

  if (cart.length === 0 && !loading) return (
    <div className="min-h-screen hero-bg flex flex-col items-center justify-center p-6">
      <div className="card p-10 max-w-sm w-full text-center shadow-lg shadow-orange-100">
        <div className="text-6xl mb-4">🛒</div>
        <h2 className="text-xl font-black text-stone-900 mb-2">Cart is empty</h2>
        <p className="text-stone-400 mb-6 text-sm">Add some delicious items from the menu</p>
        <Link href={`/menu?table=${table?.qrCode || table?.tableNumber || ''}`} className="btn-primary block text-center">Browse Menu</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fff8f3] pb-44">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-xl border-b border-orange-100 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link href={`/menu?table=${table?.qrCode || table?.tableNumber || ''}`} className="w-9 h-9 bg-orange-50 border border-orange-200 rounded-xl flex items-center justify-center text-orange-500">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </Link>
          <h1 className="font-black text-stone-900 text-xl">Your Order</h1>
          <span className="ml-auto text-stone-400 text-sm">{cart.reduce((s, i) => s + i.quantity, 0)} items</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-4 space-y-4">
        {/* Merge notice */}
        {showMergeNotice && (
          <div className="bg-blue-50 border-2 border-blue-200 text-blue-700 rounded-2xl p-4 text-sm flex items-start gap-3 animate-bounce">
            <span className="text-2xl">ℹ️</span>
            <div>
              <p className="font-bold mb-1">Items Added to Existing Order</p>
              <p className="text-xs text-blue-600">Your new items were added to your active order instead of creating a new one.</p>
            </div>
          </div>
        )}

        {/* Cart items */}
        <div className="card overflow-hidden shadow-sm shadow-orange-50">
          {cart.map((item, idx) => (
            <div key={item.id} className={`flex items-center gap-3 p-4 ${idx < cart.length - 1 ? 'border-b border-orange-50' : ''}`}>
              {item.image
                ? <img src={item.image} alt={item.name} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                : <div className="w-14 h-14 rounded-xl bg-orange-50 flex items-center justify-center text-2xl flex-shrink-0">🍽️</div>
              }
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className={item.isVegetarian ? 'veg-dot' : 'non-veg-dot'} />
                  <span className="font-semibold text-stone-900 text-sm truncate">{item.name}</span>
                </div>
                <span className="text-orange-500 font-bold text-sm">{currency} {((item.basePrice || 0) * (item.quantity || 1)).toFixed(0)}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => handleQuantityChange(item.id, item.quantity - 1)} className="qty-btn bg-orange-50 text-orange-500 border border-orange-200 hover:bg-orange-100">−</button>
                <span className="w-6 text-center font-black text-stone-900 text-sm">{item.quantity}</span>
                <button onClick={() => handleQuantityChange(item.id, item.quantity + 1)} className="qty-btn bg-orange-500 text-white hover:bg-orange-600">+</button>
              </div>
            </div>
          ))}
        </div>

        {/* Existing Orders Preview */}
        {loadingExisting ? (
          <div className="card p-5 shadow-sm shadow-blue-50 border-2 border-blue-100">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-blue-500 text-xl">ℹ️</span>
              <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider">Loading existing orders...</h3>
            </div>
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="bg-blue-50 rounded-xl p-3 border border-blue-100 animate-pulse">
                  <div className="h-4 bg-blue-200 rounded w-1/3 mb-2"></div>
                  <div className="h-3 bg-blue-200 rounded w-2/3 mb-1"></div>
                  <div className="h-3 bg-blue-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        ) : existingOrders.length > 0 && (
          <div className="card p-5 shadow-sm shadow-blue-50 border-2 border-blue-100">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-blue-500 text-xl">ℹ️</span>
              <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider">Existing Orders</h3>
            </div>
            <div className="space-y-3">
              {existingOrders.map((order: any) => (
                <div key={order.id} className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-blue-900">#{order.orderNumber?.slice(-10)}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      order.status === 'pending' ? 'bg-orange-100 text-orange-600' :
                      order.status === 'confirmed' ? 'bg-blue-100 text-blue-600' :
                      order.status === 'preparing' ? 'bg-purple-100 text-purple-600' :
                      order.status === 'ready' ? 'bg-green-100 text-green-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="space-y-1 mb-2">
                    {order.items?.slice(0, 3).map((item: any) => (
                      <div key={item.id} className="flex items-center justify-between text-xs">
                        <span className="text-blue-700">×{item.quantity} {item.menuItem?.name}</span>
                        <span className="text-blue-600 font-medium">{currency}{((item.price || 0) * (item.quantity || 1)).toFixed(0)}</span>
                      </div>
                    ))}
                    {order.items?.length > 3 && (
                      <p className="text-xs text-blue-500">+{order.items.length - 3} more items</p>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-blue-200">
                    <span className="text-xs text-blue-600 font-semibold">Order Total</span>
                    <span className="text-sm text-blue-700 font-black">{currency}{(order.totalAmount || 0).toFixed(0)}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t-2 border-blue-200 flex items-center justify-between">
              <span className="text-sm font-bold text-blue-900">Existing Orders Total</span>
              <span className="text-lg font-black text-blue-600">{currency}{existingTotal.toFixed(0)}</span>
            </div>
          </div>
        )}

        {/* Coupon */}
        <Section title="Coupon Code">
          <div className="flex gap-2">
            <input 
              value={couponCode} 
              onChange={handleCouponChange}
              placeholder="e.g. WELCOME20" 
              className="input-field flex-1 font-mono tracking-widest" 
              disabled={validatingCoupon}
            />
            <button onClick={applyCoupon} disabled={validatingCoupon || !couponCode.trim()} className="btn-secondary px-5 font-bold disabled:opacity-50">
              {validatingCoupon ? '...' : 'Apply'}
            </button>
          </div>
          {couponError && <p className="text-red-500 text-xs mt-2">{couponError}</p>}
          {couponApplied && (
            <div className="flex items-center gap-2 mt-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
              <span className="text-green-500">🎉</span>
              <p className="text-green-600 text-xs font-semibold">Saving {currency} {couponDiscount.toFixed(0)}!</p>
            </div>
          )}
        </Section>

        {/* Bill */}
        <div className="card p-5 shadow-sm shadow-orange-50">
          <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-4">Bill Summary</h3>
          <div className="space-y-2.5">
            <div className="flex justify-between text-sm"><span className="text-stone-500">Subtotal</span><span className="text-stone-900 font-medium">{currency}{subtotal.toFixed(2)}</span></div>
            {tax > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Tax ({restaurant?.taxPercentage || 0}%)</span>
                <span className="text-stone-900 font-medium">{currency}{tax.toFixed(2)}</span>
              </div>
            )}
            {serviceCharge > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Service Charge ({restaurant?.serviceChargePercentage || 0}%)</span>
                <span className="text-stone-900 font-medium">{currency}{serviceCharge.toFixed(2)}</span>
              </div>
            )}
            {(cgstAmount > 0 || cgstPct > 0) && (
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">CGST ({cgstPct}%)</span>
                <span className="text-stone-900 font-medium">{currency}{cgstAmount.toFixed(2)}</span>
              </div>
            )}
            {(sgstAmount > 0 || sgstPct > 0) && (
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">SGST ({sgstPct}%)</span>
                <span className="text-stone-900 font-medium">{currency}{sgstAmount.toFixed(2)}</span>
              </div>
            )}
            {couponDiscount > 0 && (
              <>
                <div className="flex justify-between text-sm border-t border-orange-100 pt-2">
                  <span className="text-stone-500 font-medium">Subtotal before discount</span>
                  <span className="text-stone-900 font-medium">{currency}{(total + couponDiscount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-green-600 font-semibold">Discount {couponCode && `(${couponCode})`}</span>
                  <span className="text-green-600 font-semibold">−{currency}{couponDiscount.toFixed(2)}</span>
                </div>
              </>
            )}
            <div className="border-t-2 border-orange-200 pt-3 flex justify-between items-center">
              <span className="font-bold text-stone-900 text-lg">New Order Total</span>
              <span className="font-black text-orange-500 text-2xl">{currency}{total.toFixed(2)}</span>
            </div>
            {existingOrders.length > 0 && (
              <>
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-orange-100">
                  <span className="text-blue-600 font-semibold text-sm">+ Existing Orders</span>
                  <span className="text-blue-600 font-bold text-lg">{currency}{existingTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center mt-3 pt-3 border-t-2 border-orange-300 bg-orange-50 -mx-5 px-5 py-3 rounded-b-2xl">
                  <span className="font-black text-stone-900 text-xl">Grand Total</span>
                  <span className="font-black text-orange-600 text-3xl">{currency}{grandTotal.toFixed(2)}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl p-4 text-sm flex items-start gap-2"><span>⚠️</span><span>{error}</span></div>}
      </div>

      {/* Place order */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-orange-100 p-4">
        <div className="max-w-2xl mx-auto space-y-2">
          {existingOrders.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-3 py-2 text-xs text-blue-700 flex items-center gap-2">
              <span>ℹ️</span>
              <span>Your new items will be added to existing order</span>
            </div>
          )}
          <div className="flex items-center justify-between text-sm px-1">
            <span className="text-stone-400">{cart.reduce((s, i) => s + i.quantity, 0)} new items</span>
            <div className="flex items-center gap-2">
              {existingOrders.length > 0 && (
                <>
                  <span className="text-blue-500 font-semibold text-sm">+{currency}{existingTotal.toFixed(0)}</span>
                  <span className="text-stone-300">=</span>
                </>
              )}
              <span className="text-orange-500 font-black text-lg">{currency} {(existingOrders.length > 0 ? grandTotal : total).toFixed(0)}</span>
            </div>
          </div>
          <button onClick={handlePayLater} disabled={loading || loadingExisting}
            className="btn-primary w-full flex items-center justify-center gap-3 text-lg disabled:opacity-60 disabled:cursor-not-allowed">
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                <span>Placing order...</span>
              </>
            ) : loadingExisting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                <span>Loading orders...</span>
              </>
            ) : (
              <>
                <span>🍽️</span>
                <span>Place Order</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
