import { FirebaseError } from 'firebase/app';

const authMessages: Record<string, string> = {
  'auth/email-already-in-use': 'This email is already registered. Try signing in instead.',
  'auth/invalid-credential': 'Invalid email or password.',
  'auth/user-not-found': 'No account was found for this email.',
  'auth/wrong-password': 'Invalid email or password.',
  'auth/weak-password': 'Password must be at least 6 characters.',
  'auth/popup-closed-by-user': 'Google sign-in was closed before it finished.',
  'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
  'auth/network-request-failed': 'Network error. Check your connection and try again.',
  'auth/requires-recent-login': 'Please sign in again before making this change.',
};

const firestoreMessages: Record<string, string> = {
  'permission-denied': 'You do not have permission to access this data.',
  unavailable: 'Firebase is temporarily unavailable. Your offline data may still be shown.',
  'not-found': 'The requested record could not be found.',
  'already-exists': 'This record already exists.',
};

export class AppFirebaseError extends Error {
  readonly code?: string;
  readonly originalError: unknown;

  constructor(message: string, code?: string, originalError?: unknown) {
    super(message);
    this.name = 'AppFirebaseError';
    this.code = code;
    this.originalError = originalError;
  }
}

export const getFirebaseErrorMessage = (error: unknown): string => {
  if (error instanceof AppFirebaseError) {
    return error.message;
  }

  if (error instanceof FirebaseError) {
    return authMessages[error.code] ?? firestoreMessages[error.code] ?? error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Something went wrong. Please try again.';
};

export const normalizeFirebaseError = (error: unknown): AppFirebaseError => {
  if (error instanceof AppFirebaseError) {
    return error;
  }

  if (error instanceof FirebaseError) {
    return new AppFirebaseError(getFirebaseErrorMessage(error), error.code, error);
  }

  return new AppFirebaseError(getFirebaseErrorMessage(error), undefined, error);
};
