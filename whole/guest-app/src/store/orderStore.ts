import { create } from 'zustand';
import { api } from '@/lib/api';

export interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  subtotal: number;
  taxAmount: number;
  serviceCharge: number;
  discountAmount: number;
  items: any[];
  createdAt: string;
  table?: { tableNumber: string };
}

interface OrderStore {
  orders: Order[];
  currentOrder: Order | null;
  loading: boolean;
  error: string | null;

  setCurrentOrder: (order: Order) => void;
  fetchActiveOrders: (tableId: string) => Promise<void>;
  fetchOrder: (id: string) => Promise<void>;
  setError: (e: string | null) => void;
}

export const useOrderStore = create<OrderStore>((set) => ({
  orders: [],
  currentOrder: null,
  loading: false,
  error: null,

  setCurrentOrder: (order) => set({ currentOrder: order }),
  setError: (error) => set({ error }),

  fetchActiveOrders: async (tableId: string) => {
    set({ loading: true });
    try {
      const orders: any = await api.getActiveOrders(tableId);
      set({ orders, loading: false });
    } catch (e: any) {
      set({ error: e.message, loading: false });
    }
  },

  fetchOrder: async (id: string) => {
    set({ loading: true });
    try {
      const order: any = await api.getOrder(id);
      set({ currentOrder: order, loading: false });
    } catch (e: any) {
      set({ error: e.message, loading: false });
    }
  },
}));
