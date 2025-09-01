// Simple global event bus for cross-store notifications
// Usage:
//   import { events } from '@/utils/events';
//   const off = events.on('nutrition:changed', () => { ... });
//   events.emit('nutrition:changed', payload);
//   off(); // to unsubscribe

export type EventKey = 'nutrition:changed' | 'measurements:changed' | 'analytics:track';

export type EventPayloads = {
  'nutrition:changed': { date?: string } | void;
  'measurements:changed': { goalId?: string } | void;
  'analytics:track': { event: string; props?: Record<string, any> };
};

type Listener = (payload: any) => void;

class EventBus {
  private listeners: Partial<Record<EventKey, Set<Listener>>> = {};

  on(key: EventKey, handler: Listener): () => void {
    if (!this.listeners[key]) this.listeners[key] = new Set<Listener>();
    this.listeners[key]!.add(handler);
    return () => this.off(key, handler);
  }

  off(key: EventKey, handler: Listener) {
    this.listeners[key]?.delete(handler);
  }

  emit<K extends EventKey>(key: K, payload: EventPayloads[K]) {
    const set = this.listeners[key];
    if (!set) return;
    for (const fn of set) {
      try { fn(payload); } catch { /* ignore */ }
    }
  }
}

export const events = new EventBus();
