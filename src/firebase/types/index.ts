import type React from 'react';
import type { User } from 'firebase/auth';
import type { UserProfile, UserRole } from '../../types';

export interface AuthState {
  currentUser: User | null;
  profile: UserProfile | null;
  role: UserRole | null;
  loading: boolean;
  initialized: boolean;
  error: string | null;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface SignUpCredentials extends AuthCredentials {
  displayName: string;
}

export interface RouteGuardProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requireEmailVerified?: boolean;
  redirectTo?: string;
}

export interface FirebaseOperationState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}
