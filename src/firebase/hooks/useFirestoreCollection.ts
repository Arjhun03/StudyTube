import { useEffect, useState } from 'react';
import type { Unsubscribe } from 'firebase/firestore';
import { getFirebaseErrorMessage } from '../errors/firebaseError';

export const useFirestoreCollection = <T,>(
  subscribe: ((onNext: (items: T[]) => void, onError: (error: string) => void) => Unsubscribe) | null,
) => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(Boolean(subscribe));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!subscribe) {
      setData([]);
      setLoading(false);
      setError(null);
      return undefined;
    }

    setLoading(true);
    setError(null);

    try {
      return subscribe(
        (items) => {
          setData(items);
          setLoading(false);
        },
        (message) => {
          setError(message);
          setLoading(false);
        },
      );
    } catch (err) {
      setError(getFirebaseErrorMessage(err));
      setLoading(false);
      return undefined;
    }
  }, [subscribe]);

  return { data, loading, error };
};
