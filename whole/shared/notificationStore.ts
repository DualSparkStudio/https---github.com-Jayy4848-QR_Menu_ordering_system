'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface OrderNotification {
  id: string;
  type: 'new_order' | 'order_updated';
  title: string;
  message: string;
  orderNumber: string;
  tableNumber: string;
  totalAmount: number;
  itemCount: number;
  timestamp: number;
  read: boolean;
}

interface NotificationStoreState {
  notifications: OrderNotification[];
  soundEnabled: boolean;
  unreadCount: number;

  addNotification: (notification: Omit<OrderNotification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  toggleSound: () => void;
}

// ─── Sound Player (Web Audio API) ────────────────────────────────────────────

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch {
      console.warn('Web Audio API not supported');
      return null;
    }
  }
  return audioContext;
}

/**
 * Play a pleasant two-tone notification chime using Web Audio API.
 * Works on all devices without needing an audio file.
 */
export function playNotificationSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  // Resume context if suspended (required after user interaction on mobile)
  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  const now = ctx.currentTime;

  // ── Tone 1: C5 (523 Hz) ──
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(523.25, now);
  gain1.gain.setValueAtTime(0, now);
  gain1.gain.linearRampToValueAtTime(0.3, now + 0.02);
  gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
  osc1.connect(gain1);
  gain1.connect(ctx.destination);
  osc1.start(now);
  osc1.stop(now + 0.35);

  // ── Tone 2: E5 (659 Hz) ──
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(659.25, now + 0.15);
  gain2.gain.setValueAtTime(0, now + 0.15);
  gain2.gain.linearRampToValueAtTime(0.3, now + 0.17);
  gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
  osc2.connect(gain2);
  gain2.connect(ctx.destination);
  osc2.start(now + 0.15);
  osc2.stop(now + 0.55);

  // ── Tone 3: G5 (784 Hz) ── higher resolution chime
  const osc3 = ctx.createOscillator();
  const gain3 = ctx.createGain();
  osc3.type = 'sine';
  osc3.frequency.setValueAtTime(783.99, now + 0.3);
  gain3.gain.setValueAtTime(0, now + 0.3);
  gain3.gain.linearRampToValueAtTime(0.25, now + 0.32);
  gain3.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
  osc3.connect(gain3);
  gain3.connect(ctx.destination);
  osc3.start(now + 0.3);
  osc3.stop(now + 0.85);
}

// ─── Store ───────────────────────────────────────────────────────────────────

const MAX_NOTIFICATIONS = 50;

export const useNotificationStore = create<NotificationStoreState>()(
  persist(
    (set, get) => ({
      notifications: [],
      soundEnabled: true,
      unreadCount: 0,

      addNotification: (notif) => {
        const newNotif: OrderNotification = {
          ...notif,
          id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          timestamp: Date.now(),
          read: false,
        };

        set((state) => {
          const updated = [newNotif, ...state.notifications].slice(0, MAX_NOTIFICATIONS);
          return {
            notifications: updated,
            unreadCount: updated.filter((n) => !n.read).length,
          };
        });

        // Play sound if enabled
        if (get().soundEnabled) {
          playNotificationSound();
        }
      },

      markAsRead: (id) =>
        set((state) => {
          const updated = state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n,
          );
          return {
            notifications: updated,
            unreadCount: updated.filter((n) => !n.read).length,
          };
        }),

      markAllAsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
          unreadCount: 0,
        })),

      removeNotification: (id) =>
        set((state) => {
          const updated = state.notifications.filter((n) => n.id !== id);
          return {
            notifications: updated,
            unreadCount: updated.filter((n) => !n.read).length,
          };
        }),

      clearAll: () => set({ notifications: [], unreadCount: 0 }),

      toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
    }),
    {
      name: 'admin-notifications',
      partialize: (state) => ({
        soundEnabled: state.soundEnabled,
        // Don't persist notifications — they are session-only
      }),
    },
  ),
);
