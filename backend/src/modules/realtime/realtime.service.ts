import { Injectable, Logger } from '@nestjs/common';

type Listener = (event: string, payload: unknown) => void;

/**
 * In-memory pub/sub bus for realtime events. Services publish domain events
 * (incidents, check-ins, notifications...) and connected SSE clients receive
 * them instantly. Scoped per organization so tenants never see each other's
 * events.
 */
@Injectable()
export class RealtimeService {
  private readonly logger = new Logger(RealtimeService.name);
  private listeners = new Map<string, Set<Listener>>();

  /** Subscribe to events for an organization. Returns an unsubscribe fn. */
  subscribe(organizationId: string, listener: Listener): () => void {
    const key = organizationId || 'default-organization';
    let set = this.listeners.get(key);
    if (!set) {
      set = new Set();
      this.listeners.set(key, set);
    }
    set.add(listener);
    return () => {
      set.delete(listener);
      if (set.size === 0) this.listeners.delete(key);
    };
  }

  /** Broadcast an event to all connected clients of an organization. */
  publish(organizationId: string, event: string, payload: unknown): void {
    const key = organizationId || 'default-organization';
    const set = this.listeners.get(key);
    if (!set || set.size === 0) return;
    const message = JSON.stringify({ event, data: payload });
    this.logger.debug(`[realtime] ${event} → ${set.size} client(s)`);
    for (const listener of set) {
      try {
        listener(event, message);
      } catch (err) {
        this.logger.warn(`Realtime listener error: ${(err as Error).message}`);
      }
    }
  }
}
