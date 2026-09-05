import { useState, useRef, useEffect } from 'react';
import { subscribeSupabaseCollection } from '../services/supabaseService';

export interface SupabaseCollectionState<T> {
  data: T[];
  loading: boolean;
  error: string | null;
}

/**
 * Subscribes to a Supabase table (initial fetch + Realtime refetch) and exposes the
 * data as temporary UI state. Supabase is the single source of truth — the UI is a
 * projection of whatever the query returns (including an empty array when the table
 * is empty). No local/hardcoded fallback is applied.
 */
export function useSupabaseCollection<T extends { id: string }>(
  table: string
): SupabaseCollectionState<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const onDataRef = useRef<(items: T[]) => void>(() => {});
  const onErrorRef = useRef<(msg: string) => void>(() => {});

  onDataRef.current = (items: T[]) => {
    setData(items);
    setLoading(false);
    setError(null);
  };
  onErrorRef.current = (msg: string) => {
    setLoading(false);
    setError(msg);
  };

  useEffect(() => {
    setLoading(true);
    setError(null);
    setData([]);

    const unsubscribe = subscribeSupabaseCollection<T>(
      table,
      (items) => onDataRef.current(items),
      (msg) => onErrorRef.current(msg)
    );
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [table]);

  return { data, loading, error };
}
