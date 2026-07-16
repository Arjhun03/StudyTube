import { useCallback, useState } from 'react';
import type { UploadResult } from '../../types';
import { getFirebaseErrorMessage } from '../errors/firebaseError';
import { storageService } from '../services/storageService';

export const useStorageUpload = () => {
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(async (userId: string, file: File, customPath?: string) => {
    setLoading(true);
    setError(null);
    setProgress(0);

    try {
      const uploadResult = await storageService.uploadUserAsset(userId, file, customPath);
      setResult(uploadResult);
      setProgress(100);
      return uploadResult;
    } catch (err) {
      setError(getFirebaseErrorMessage(err));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { upload, progress, result, loading, error };
};
