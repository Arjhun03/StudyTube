import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
  uploadBytesResumable,
  type UploadTask,
  type UploadTaskSnapshot,
} from 'firebase/storage';
import type { UploadResult } from '../../types';
import { storage } from '../config/firebase';
import { normalizeFirebaseError } from '../errors/firebaseError';

export class StorageService {
  userAssetPath(userId: string, fileName: string): string {
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    return `user_assets/${userId}/${Date.now()}-${safeName}`;
  }

  async uploadUserAsset(userId: string, file: File, customPath?: string): Promise<UploadResult> {
    try {
      const path = customPath ?? this.userAssetPath(userId, file.name);
      const storageRef = ref(storage, path);
      const snapshot = await uploadBytes(storageRef, file, {
        contentType: file.type,
        customMetadata: { ownerId: userId },
      });
      const downloadURL = await getDownloadURL(snapshot.ref);
      return { path, downloadURL, fullPath: snapshot.ref.fullPath };
    } catch (error) {
      throw normalizeFirebaseError(error);
    }
  }

  uploadUserAssetResumable(
    userId: string,
    file: File,
    onProgress: (progress: number, snapshot: UploadTaskSnapshot) => void,
    customPath?: string,
  ): UploadTask {
    const path = customPath ?? this.userAssetPath(userId, file.name);
    const task = uploadBytesResumable(ref(storage, path), file, {
      contentType: file.type,
      customMetadata: { ownerId: userId },
    });

    task.on('state_changed', (snapshot) => {
      const progress = snapshot.totalBytes > 0 ? (snapshot.bytesTransferred / snapshot.totalBytes) * 100 : 0;
      onProgress(progress, snapshot);
    });

    return task;
  }

  async getDownloadURL(path: string): Promise<string> {
    try {
      return await getDownloadURL(ref(storage, path));
    } catch (error) {
      throw normalizeFirebaseError(error);
    }
  }

  async deleteFile(path: string): Promise<void> {
    try {
      await deleteObject(ref(storage, path));
    } catch (error) {
      throw normalizeFirebaseError(error);
    }
  }
}

export const storageService = new StorageService();
