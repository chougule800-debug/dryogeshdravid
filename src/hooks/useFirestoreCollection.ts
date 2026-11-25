import { useEffect, useRef, useState } from 'react';
import {
  CollectionOrderBy,
  subscribeFirestoreCollection,
} from '../services/firebaseService';

export interface FirestoreCollectionState<T> {
  data: T[];
  loading: boolean;
  error: string | null;
}

export function useFirestoreCollection<T extends { id: string }>(
  collectionName: string,
  orderBy?: CollectionOrderBy,
  limitCount?: number
): FirestoreCollectionState<T> {
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

  const orderField = orderBy?.field ?? orderBy?.column;
  const orderAsc = orderBy?.ascending;

  useEffect(() => {
    setLoading(true);
    setError(null);

    const unsubscribe = subscribeFirestoreCollection<T>(
      collectionName,
      (items) => onDataRef.current(items || []),
      (msg) => onErrorRef.current(msg),
      {
        orderBy: orderField ? { field: orderField, ascending: orderAsc } : undefined,
        limitCount,
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [collectionName, orderField, orderAsc, limitCount]);

  return { data, loading, error };
}
