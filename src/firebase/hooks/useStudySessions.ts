import { useCallback } from 'react';
import { firestoreService } from '../services/firestoreService';
import { useFirestoreCollection } from './useFirestoreCollection';
import type { StudySession } from '../../types';

export const useStudySessions = (userId?: string) => {
  const subscribe = useCallback(
    (onNext: (items: StudySession[]) => void, onError: (error: string) => void) => {
      if (!userId) {
        return () => undefined;
      }
      return firestoreService.listenToStudySessions(userId, onNext, onError);
    },
    [userId],
  );

  return useFirestoreCollection<StudySession>(userId ? subscribe : null);
};
