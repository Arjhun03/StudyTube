import { useEffect, useState } from 'react';
import type { Unsubscribe } from 'firebase/firestore';
import { getFirebaseErrorMessage } from '../errors/firebaseError';
import type { FirebaseOperationState } from '../types';

export const useFirestoreDocument = <T,>(
  subscribe: ((onNext: (item: T | null) => void, onError: (error: string) => void) => Unsubscribe) | null,
) => {
  const [state, setState] = useState<FirebaseOperationState<T>>({
    data: null,
    loading: Boolean(subscribe),
    error: null,
  });

  useEffect(() => {
    if (!subscribe) {
      setState({ data: null, loading: false, error: null });
      return undefined;
    }

    setState((current) => ({ ...current, loading: true, error: null }));

    try {
      return subscribe(
        (item) => setState({ data: item, loading: false, error: null }),
        (error) => setState((current) => ({ ...current, loading: false, error })),
      );
    } catch (error) {
      setState((current) => ({ ...current, loading: false, error: getFirebaseErrorMessage(error) }));
      return undefined;
    }
  }, [subscribe]);

  return state;
};
