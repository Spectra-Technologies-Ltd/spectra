'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

/**
 * Minimal SSE (Server-Sent Events) client for the BastionOS realtime stream.
 * - Connects once per page load via a module singleton (EventSource carries
 *   cookies automatically since the API is same-origin/proxied).
 * - Auto-reconnects with capped backoff.
 * - Dispatches typed events to subscribers; components use `useRealtimeEvent`.
 */

type EventHandler = (payload: any) => void;

type Status = 'connecting' | 'live' | 'offline';

let source: EventSource | null = null;
let status: Status = 'connecting';
let retryDelay = 1000;
const handlers = new Map<string, Set<EventHandler>>();
const statusListeners = new Set<(s: Status) => void>();

function setStatus(next: Status) {
  status = next;
  statusListeners.forEach((fn) => fn(next));
}

function connect() {
  if (source || typeof window === 'undefined') return;

  // Use the same base the axios client uses; when NEXT_PUBLIC_API_URL is set
  // the stream is cross-origin, so credentials must be sent explicitly.
  const base = process.env.NEXT_PUBLIC_API_URL || '/api/v1';
  source = new EventSource(`${base}/realtime/stream`, {
    withCredentials: true,
  });
  setStatus('connecting');

  source.onopen = () => {
    retryDelay = 1000;
    setStatus('live');
  };

  source.onmessage = (event) => {
    try {
      const { event: name, data } = JSON.parse(event.data);
      const set = handlers.get(name);
      if (set) set.forEach((fn) => fn(data));
    } catch {
      // malformed frame — ignore
    }
  };

  source.onerror = () => {
    setStatus('offline');
    // EventSource auto-reconnects, but we close and re-open with backoff to
    // guarantee a fresh stream (avoids stuck zombie connections).
    source?.close();
    source = null;
    if (typeof window !== 'undefined') {
      setTimeout(connect, retryDelay);
      retryDelay = Math.min(retryDelay * 2, 30000);
    }
  };
}

export function useRealtimeEvent(event: string, handler: EventHandler | null) {
  const handlerRef = useRef<EventHandler | null>(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    connect();

    if (!handlers.has(event)) handlers.set(event, new Set());
    const set = handlers.get(event)!;

    const wrapped: EventHandler = (payload) => handlerRef.current?.(payload);
    set.add(wrapped);

    return () => {
      set.delete(wrapped);
      if (set.size === 0) handlers.delete(event);
    };
  }, [event]);
}

/** Connection state for the LIVE pill in the top bar. */
export function useRealtimeStatus(): Status {
  const [current, setCurrent] = useState<Status>(status);
  useEffect(() => {
    const fn = (s: Status) => setCurrent(s);
    statusListeners.add(fn);
    if (typeof window !== 'undefined' && !source) connect();
    return () => {
      statusListeners.delete(fn);
    };
  }, []);
  return current;
}

/** Imperative subscribe for non-hook code (e.g. react-query invalidation). */
export function onRealtimeEvent(event: string, handler: EventHandler): () => void {
  if (typeof window === 'undefined') return () => {};
  connect();
  if (!handlers.has(event)) handlers.set(event, new Set());
  handlers.get(event)!.add(handler);
  return () => {
    handlers.get(event)?.delete(handler);
  };
}

export { useCallback };
