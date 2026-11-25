import { useEffect, useState } from 'react';
import {
  getCachedMediaUrlSync,
  isFirestoreMediaPointer,
  resolveFirestoreMediaUrl,
} from '../services/firebaseService';

/**
 * Resolves any media URL string for browser rendering (`<img>` / `<video>`):
 *  - Inline `data:...` Data URLs, `http(s)://...`, and `/images/...` paths resolve synchronously.
 *  - `firestore-media://{assetId}` strings are reassembled from Cloud Firestore chunks
 *    and cached in memory + Browser Cache API.
 */
export function useResolvedMediaUrl(url: string | undefined | null): string {
  const [resolvedUrl, setResolvedUrl] = useState<string>(() => getCachedMediaUrlSync(url));

  useEffect(() => {
    if (!url) {
      setResolvedUrl('');
      return;
    }

    if (!isFirestoreMediaPointer(url)) {
      setResolvedUrl(url);
      return;
    }

    const cached = getCachedMediaUrlSync(url);
    if (cached) {
      setResolvedUrl(cached);
      return;
    }

    let cancelled = false;
    resolveFirestoreMediaUrl(url)
      .then((nextUrl) => {
        if (!cancelled) {
          setResolvedUrl(nextUrl);
        }
      })
      .catch((err) => {
        console.error('Failed to resolve Firestore media asset:', err);
        if (!cancelled) {
          setResolvedUrl('');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [url]);

  return resolvedUrl;
}
