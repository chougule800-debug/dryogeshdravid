import { useState, useRef, useEffect } from 'react';
import { subscribeSupabaseCollection } from '../services/supabaseService';

export interface SupabaseCollectionState<T> {
  data: T[];
  loading: boolean;
  error: string | null;
}

export function useSupabaseCollection<T extends { id: string }>(
  table: string,
  orderBy?: { column: string; ascending?: boolean }
): SupabaseCollectionState<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const onDataRef = useRef<(items: T[]) => void>(() => {});
  const onErrorRef = useRef<(msg: string) => void>(() => {});

  onDataRef.current = (items: T[]) => {
    setData(items || []);
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
      (items) => onDataRef.current(items || []),
      (msg) => onErrorRef.current(msg),
      orderBy
    );
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [table, orderBy]);

  return { data, loading, error };
}