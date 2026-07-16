import { useCallback, useState } from 'react';
import { getFirebaseErrorMessage } from '../errors/firebaseError';
import type { FirebaseOperationState } from '../types';

export const useAsync = <T,>() => {
  const [state, setState] = useState<FirebaseOperationState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(async (operation: () => Promise<T>): Promise<T> => {
    setState((current) => ({ ...current, loading: true, error: null }));
    try {
      const data = await operation();
      setState({ data, loading: false, error: null });
      return data;
    } catch (error) {
      const message = getFirebaseErrorMessage(error);
      setState((current) => ({ ...current, loading: false, error: message }));
      throw error;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return { ...state, execute, reset };
};
