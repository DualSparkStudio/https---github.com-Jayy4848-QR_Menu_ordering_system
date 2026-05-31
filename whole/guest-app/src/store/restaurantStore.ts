import { create } from 'zustand';
import { api } from '@/lib/api';

export interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  image?: string;
  displayOrder: number;
  items: MenuItem[];
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  image?: string;
  basePrice: number;
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  spiceLevel: number;
  allergens?: string;
  calories?: number;
  isAvailable: boolean;
  isFeatured: boolean;
  preparationTime: number;
  variants: any[];
  category?: { id: string; name: string };
}

export interface Table {
  id: string;
  tableNumber: string;
  section: string;
  capacity: number;
  status: string;
  qrCode: string;
}

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  banner?: string;
  currency: string;
  taxPercentage: number;
  serviceChargePercentage: number;
  cgstPercentage: number;
  sgstPercentage: number;
  isOpen: boolean;
  phone: string;
  address: string;
}

interface RestaurantStore {
  restaurant: Restaurant | null;
  table: Table | null;
  categories: Category[];
  loading: boolean;
  error: string | null;
  lastFetch: number;
  categoriesCache: Record<string, { data: Category[]; timestamp: number }>;

  setRestaurant: (r: Restaurant) => void;
  setTable: (t: Table) => void;
  fetchByQR: (qrCode: string) => Promise<void>;
  fetchCategories: (restaurantId: string) => Promise<void>;
  setError: (e: string | null) => void;
}

const CACHE_DURATION = 60000; // 1 minute cache (reduced for faster updates)
const STORAGE_KEY = 'menu-cache';

// Load cache from localStorage
const loadCacheFromStorage = (): Record<string, { data: Category[]; timestamp: number }> => {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

// Save cache to localStorage
const saveCacheToStorage = (cache: Record<string, { data: Category[]; timestamp: number }>) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // Ignore storage errors
  }
};

export const useRestaurantStore = create<RestaurantStore>((set, get) => ({
  restaurant: null,
  table: null,
  categories: [],
  loading: false,
  error: null,
  lastFetch: 0,
  categoriesCache: loadCacheFromStorage(),

  setRestaurant: (restaurant) => set({ restaurant }),
  setTable: (table) => set({ table }),
  setError: (error) => set({ error }),

  fetchByQR: async (code: string) => {
    const now = Date.now();

    set({ loading: true, error: null });
    try {
      const BASE = process.env.NEXT_PUBLIC_API_URL || '/api';
      // Detect if it's a UUID (QR code) or a plain table number
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(code);
      const url = isUUID ? `${BASE}/tables/qr/${code}?v=${now}` : `${BASE}/tables/number/${code}?v=${now}`;
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Table not found');
      }
      const data: any = await res.json();
      set({ table: data, restaurant: data.restaurant, loading: false, lastFetch: now });
    } catch (e: any) {
      set({ error: e.message || 'Table not found', loading: false });
    }
  },

  fetchCategories: async (restaurantId: string) => {
    const now = Date.now();
    const { categoriesCache } = get();
    
    // Check cache first - serve stale data immediately while fetching fresh
    const cached = categoriesCache[restaurantId];
    if (cached) {
      // Serve cached data immediately
      set({ categories: cached.data, loading: false });
      
      // If cache is fresh enough, don't fetch
      if (now - cached.timestamp < CACHE_DURATION) {
        return;
      }
    } else {
      set({ loading: true });
    }

    // Fetch fresh data in background
    try {
      const categories: any = await api.getCategories(restaurantId);
      const newCache = {
        ...categoriesCache,
        [restaurantId]: { data: categories, timestamp: now }
      };
      set({ 
        categories, 
        loading: false,
        categoriesCache: newCache
      });
      saveCacheToStorage(newCache);
    } catch (e: any) {
      // If we have cached data, keep using it even on error
      if (!cached) {
        set({ error: e.message, loading: false });
      }
    }
  },
}));
