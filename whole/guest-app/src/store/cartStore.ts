import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Generate unique session ID for this device/browser tab
const generateSessionId = () => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export interface CartItem {
  id: string;
  name: string;
  basePrice: number;
  image?: string;
  isVegetarian: boolean;
  quantity: number;
  selectedVariants?: any;
  specialInstructions?: string;
}

interface CartStore {
  cart: CartItem[];
  tableId: string | null;
  restaurantId: string | null;
  hasActiveSession: boolean;
  sessionId: string;
  setContext: (tableId: string, restaurantId: string) => void;
  addToCart: (item: Omit<CartItem, 'quantity'>) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, qty: number) => void;
  updateInstructions: (id: string, instructions: string) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
  setActiveSession: (active: boolean) => void;
  clearSession: () => void;
  initSession: () => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      cart: [],
      tableId: null,
      restaurantId: null,
      hasActiveSession: false,
      sessionId: generateSessionId(),

      initSession: () => {
        const currentSessionId = get().sessionId;
        if (!currentSessionId || currentSessionId === '') {
          set({ sessionId: generateSessionId() });
        }
      },

      setContext: (tableId, restaurantId) => {
        const currentTableId = get().tableId;
        
        // If switching to a different table, clear the cart
        if (currentTableId && currentTableId !== tableId) {
          set({ 
            tableId, 
            restaurantId, 
            cart: [], 
            hasActiveSession: false,
            sessionId: generateSessionId() 
          });
        } else {
          set({ tableId, restaurantId });
        }
      },

      addToCart: (item) =>
        set((state) => {
          const existing = state.cart.find((c) => c.id === item.id);
          if (existing) {
            return { cart: state.cart.map((c) => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c) };
          }
          return { cart: [...state.cart, { ...item, quantity: 1 }] };
        }),

      removeFromCart: (id) => set((state) => ({ cart: state.cart.filter((c) => c.id !== id) })),

      updateQuantity: (id, qty) =>
        set((state) => ({
          cart: qty <= 0
            ? state.cart.filter((c) => c.id !== id)
            : state.cart.map((c) => c.id === id ? { ...c, quantity: qty } : c),
        })),

      updateInstructions: (id, instructions) =>
        set((state) => ({ cart: state.cart.map((c) => c.id === id ? { ...c, specialInstructions: instructions } : c) })),

      clearCart: () => set({ cart: [] }),

      getTotal: () => get().cart.reduce((sum, item) => sum + item.basePrice * item.quantity, 0),

      getItemCount: () => get().cart.reduce((sum, item) => sum + item.quantity, 0),

      setActiveSession: (active) => set({ hasActiveSession: active }),

      clearSession: () => set({ hasActiveSession: false, cart: [], tableId: null, restaurantId: null, sessionId: generateSessionId() }),
    }),
    { name: 'cart-storage' }
  )
);
