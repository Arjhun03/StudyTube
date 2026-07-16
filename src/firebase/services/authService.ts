import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
  type UserCredential,
} from 'firebase/auth';
import { auth, authPersistenceReady } from '../config/firebase';
import { normalizeFirebaseError } from '../errors/firebaseError';
import { userRepository } from '../repositories/userRepository';
import type { AuthCredentials, SignUpCredentials } from '../types';

export class AuthService {
  async signUpWithEmail({ email, password, displayName }: SignUpCredentials): Promise<UserCredential> {
    try {
      await authPersistenceReady;
      const credential = await createUserWithEmailAndPassword(auth, email, password);

      if (displayName.trim()) {
        await updateProfile(credential.user, { displayName: displayName.trim() });
      }

      await sendEmailVerification(credential.user);
      await userRepository.upsertFromAuthUser(credential.user);
      return credential;
    } catch (error) {
      throw normalizeFirebaseError(error);
    }
  }

  async signInWithEmail({ email, password }: AuthCredentials): Promise<UserCredential> {
    try {
      await authPersistenceReady;
      const credential = await signInWithEmailAndPassword(auth, email, password);
      await userRepository.upsertFromAuthUser(credential.user);
      return credential;
    } catch (error) {
      throw normalizeFirebaseError(error);
    }
  }

  async signInWithGoogle(): Promise<UserCredential> {
    try {
      await authPersistenceReady;
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const credential = await signInWithPopup(auth, provider);
      await userRepository.upsertFromAuthUser(credential.user);
      return credential;
    } catch (error) {
      throw normalizeFirebaseError(error);
    }
  }

  async sendPasswordReset(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      throw normalizeFirebaseError(error);
    }
  }

  async resendEmailVerification(user: User): Promise<void> {
    try {
      await sendEmailVerification(user);
    } catch (error) {
      throw normalizeFirebaseError(error);
    }
  }

  async refreshEmailVerification(user: User): Promise<boolean> {
    try {
      await user.reload();
      await userRepository.syncEmailVerification(user);
      return user.emailVerified;
    } catch (error) {
      throw normalizeFirebaseError(error);
    }
  }

  async logout(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error) {
      throw normalizeFirebaseError(error);
    }
  }
}

export const authService = new AuthService();
