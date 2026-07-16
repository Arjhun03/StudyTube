import { createContext } from 'react';
import type { User } from 'firebase/auth';
import type { AuthCredentials, SignUpCredentials } from '../firebase/types';
import type { UserProfile, UserRole } from '../types';

export interface AuthContextType {
  currentUser: User | null;
  profile: UserProfile | null;
  role: UserRole | null;
  loading: boolean;
  initialized: boolean;
  error: string | null;
  isEmailVerified: boolean;
  signIn: (credentials: AuthCredentials) => Promise<void>;
  signUp: (credentials: SignUpCredentials) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  refreshEmailVerification: () => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
