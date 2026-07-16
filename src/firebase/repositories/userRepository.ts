import { serverTimestamp } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import type { UserProfile, UserRole } from '../../types';
import { FirestoreRepository } from './firestoreRepository';

export class UserRepository extends FirestoreRepository<UserProfile> {
  constructor() {
    super('users');
  }

  async upsertFromAuthUser(user: User, role: UserRole = 'student'): Promise<void> {
    const existingProfile = await this.findById(user.uid);
    const profileData = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      emailVerified: user.emailVerified,
      providerIds: user.providerData.map((provider) => provider.providerId),
      role: existingProfile?.role ?? role,
      lastLoginAt: serverTimestamp(),
      ...(!existingProfile ? { createdAt: serverTimestamp() } : {}),
    };

    await this.set(user.uid, profileData);
  }

  async syncEmailVerification(user: User): Promise<void> {
    await this.set(user.uid, {
      emailVerified: user.emailVerified,
      updatedAt: serverTimestamp(),
    });
  }
}

export const userRepository = new UserRepository();
