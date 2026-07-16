import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported, type Analytics } from 'firebase/analytics';
import { browserLocalPersistence, getAuth, setPersistence } from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  getFirestore,
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

/**
 * Returns true when the app is running with placeholder/mock env vars.
 * All Firebase SDK calls are skipped in mock mode — no real network requests.
 */
export const isMockMode = (): boolean => {
  const key = import.meta.env.VITE_FIREBASE_API_KEY as string | undefined;
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined;
  // If both a real API key and real project ID are present, use real Firebase
  if (projectId && projectId.includes('-') && key && key.startsWith('AIza')) return false;
  return !key || key.startsWith('mock') || key.includes('here') || key === '';
};

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);

export const analyticsReady: Promise<Analytics | null> = isSupported()
  .then((supported) => (supported ? getAnalytics(app) : null))
  .catch(() => null);

export const auth = getAuth(app);

// Only set persistence when using real Firebase – avoids network probes in mock mode
export const authPersistenceReady: Promise<void> = isMockMode()
  ? Promise.resolve()
  : setPersistence(auth, browserLocalPersistence);

// Use persistent local cache only when a real project is wired up.
// In mock mode, fall back to a plain in-memory Firestore instance to
// avoid the IndexedDB / network errors that produce the "unavailable" message.
export const db = isMockMode()
  ? getFirestore(app)
  : initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    });

export const storage = getStorage(app);

export default app;
