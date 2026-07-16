import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth, isMockMode } from '../config/firebase';
import { getFirebaseErrorMessage } from '../firebase/errors/firebaseError';
import { firestoreService } from '../firebase/services/firestoreService';
import { authService } from '../firebase/services/authService';
import { userRepository } from '../firebase/repositories/userRepository';
import type { AuthCredentials, SignUpCredentials } from '../firebase/types';
import type { UserProfile, UserRole } from '../types';
import { AuthContext, type AuthContextType } from './authContextValue';

// ---------------------------------------------------------------------------
// Mock user store (only used when isMockMode() === true)
// ---------------------------------------------------------------------------
const MOCK_STORE_KEY = 'studytube_mock_users';
const MOCK_SESSION_KEY = 'studytube_mock_session';

interface MockUserRecord {
  uid: string;
  email: string;
  displayName: string;
  password: string;
  photoURL: string | null;
  emailVerified: boolean;
}

const getMockUsers = (): MockUserRecord[] => {
  try { return JSON.parse(localStorage.getItem(MOCK_STORE_KEY) ?? '[]'); }
  catch { return []; }
};

const saveMockUsers = (users: MockUserRecord[]): void =>
  localStorage.setItem(MOCK_STORE_KEY, JSON.stringify(users));

const getMockSession = (): MockUserRecord | null => {
  try { return JSON.parse(localStorage.getItem(MOCK_SESSION_KEY) ?? 'null'); }
  catch { return null; }
};

const setMockSession = (user: MockUserRecord | null): void =>
  localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(user));

/** Build a fake User-like profile from a mock record */
const mockRecordToProfile = (r: MockUserRecord): UserProfile => ({
  uid: r.uid,
  email: r.email,
  displayName: r.displayName,
  photoURL: r.photoURL,
  role: 'student' as UserRole,
  emailVerified: r.emailVerified,
  providerIds: ['password'],
});

// ---------------------------------------------------------------------------
// AuthProvider
// ---------------------------------------------------------------------------
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clearError = useCallback(() => setError(null), []);

  // -------------------------------------------------------------------------
  // Mock mode bootstrap
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!isMockMode()) return;

    const session = getMockSession();
    if (session) {
      setProfile(mockRecordToProfile(session));
      // currentUser stays null in mock mode — ProtectedRoute reads `profile`
    }
    setLoading(false);
    setInitialized(true);
  }, []);

  // -------------------------------------------------------------------------
  // Real Firebase mode bootstrap
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (isMockMode()) return;

    let unsubscribeProfile: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      unsubscribeProfile?.();
      setCurrentUser(user);

      if (!user) {
        setProfile(null);
        setLoading(false);
        setInitialized(true);
        return;
      }

      userRepository.upsertFromAuthUser(user).catch((err) =>
        setError(getFirebaseErrorMessage(err)),
      );

      unsubscribeProfile = firestoreService.listenToUserProfile(
        user.uid,
        (nextProfile) => {
          setProfile(nextProfile);
          setLoading(false);
          setInitialized(true);
        },
        (message) => {
          setError(message);
          setLoading(false);
          setInitialized(true);
        },
      );
    });

    return () => {
      unsubscribeProfile?.();
      unsubscribeAuth();
    };
  }, []);

  // -------------------------------------------------------------------------
  // Action runner
  // -------------------------------------------------------------------------
  const runAuthAction = useCallback(async (action: () => Promise<unknown>) => {
    setLoading(true);
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(getFirebaseErrorMessage(err));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // -------------------------------------------------------------------------
  // MOCK implementations
  // -------------------------------------------------------------------------
  const mockSignIn = useCallback(async ({ email, password }: AuthCredentials) => {
    const users = getMockUsers();
    const found = users.find((u) => u.email === email && u.password === password);
    if (!found) throw new Error('Invalid email or password.');
    setMockSession(found);
    setProfile(mockRecordToProfile(found));
    setCurrentUser({ uid: found.uid, email: found.email, displayName: found.displayName, emailVerified: found.emailVerified } as unknown as User);
  }, []);

  const mockSignUp = useCallback(async ({ email, password, displayName }: SignUpCredentials) => {
    const users = getMockUsers();
    if (users.find((u) => u.email === email)) {
      throw new Error('This email is already registered. Try signing in instead.');
    }
    const record: MockUserRecord = {
      uid: `mock_${Date.now()}`,
      email,
      displayName,
      password,
      photoURL: null,
      emailVerified: false,
    };
    saveMockUsers([...users, record]);
    // Do NOT sign in automatically — stay on auth page so user sees verification message
  }, []);

  const mockSignInWithGoogle = useCallback(async () => {
    const record: MockUserRecord = {
      uid: 'mock_google_user',
      email: 'demo@studytube.ai',
      displayName: 'Demo User',
      password: '',
      photoURL: null,
      emailVerified: true,
    };
    const users = getMockUsers();
    if (!users.find((u) => u.uid === record.uid)) saveMockUsers([...users, record]);
    setMockSession(record);
    setProfile(mockRecordToProfile(record));
    setCurrentUser({ uid: record.uid, email: record.email, displayName: record.displayName, emailVerified: record.emailVerified } as unknown as User);
  }, []);

  const mockForgotPassword = useCallback(async (email: string) => {
    const users = getMockUsers();
    if (!users.find((u) => u.email === email)) {
      throw new Error('No account was found for this email.');
    }
    // In mock mode we simply acknowledge the request without sending anything
  }, []);

  const mockLogout = useCallback(async () => {
    setMockSession(null);
    setProfile(null);
    setCurrentUser(null);
  }, []);

  // -------------------------------------------------------------------------
  // Real implementations
  // -------------------------------------------------------------------------
  const signIn = useCallback(
    (credentials: AuthCredentials) =>
      isMockMode()
        ? runAuthAction(() => mockSignIn(credentials))
        : runAuthAction(() => authService.signInWithEmail(credentials)),
    [runAuthAction, mockSignIn],
  );

  const signUp = useCallback(
    (credentials: SignUpCredentials) =>
      isMockMode()
        ? runAuthAction(() => mockSignUp(credentials))
        : runAuthAction(() => authService.signUpWithEmail(credentials)),
    [runAuthAction, mockSignUp],
  );

  const signInWithGoogle = useCallback(
    () =>
      isMockMode()
        ? runAuthAction(() => mockSignInWithGoogle())
        : runAuthAction(() => authService.signInWithGoogle()),
    [runAuthAction, mockSignInWithGoogle],
  );

  const forgotPassword = useCallback(
    (email: string) =>
      isMockMode()
        ? runAuthAction(() => mockForgotPassword(email))
        : runAuthAction(() => authService.sendPasswordReset(email)),
    [runAuthAction, mockForgotPassword],
  );

  const resendVerificationEmail = useCallback(async () => {
    if (isMockMode()) return; // no-op in mock
    if (!currentUser) throw new Error('You must be signed in to verify your email.');
    await runAuthAction(() => authService.resendEmailVerification(currentUser));
  }, [currentUser, runAuthAction]);

  const refreshEmailVerification = useCallback(async () => {
    if (isMockMode()) return false;
    if (!currentUser) return false;
    let verified = false;
    await runAuthAction(async () => {
      verified = await authService.refreshEmailVerification(currentUser);
    });
    return verified;
  }, [currentUser, runAuthAction]);

  const logout = useCallback(
    () =>
      isMockMode()
        ? runAuthAction(() => mockLogout())
        : runAuthAction(() => authService.logout()),
    [runAuthAction, mockLogout],
  );

  // -------------------------------------------------------------------------
  // Context value
  // -------------------------------------------------------------------------
  const value = useMemo<AuthContextType>(
    () => ({
      currentUser,
      profile,
      role: profile?.role ?? null,
      loading,
      initialized,
      error,
      isEmailVerified: currentUser?.emailVerified ?? profile?.emailVerified ?? false,
      signIn,
      signUp,
      signInWithGoogle,
      forgotPassword,
      resendVerificationEmail,
      refreshEmailVerification,
      logout,
      clearError,
    }),
    [
      currentUser, profile, loading, initialized, error,
      signIn, signUp, signInWithGoogle, forgotPassword,
      resendVerificationEmail, refreshEmailVerification,
      logout, clearError,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
