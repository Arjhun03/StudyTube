export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: UserRole;
  emailVerified: boolean;
  providerIds: string[];
  createdAt?: FirebaseDate;
  updatedAt?: FirebaseDate;
  lastLoginAt?: FirebaseDate;
}

export interface StudySession {
  id: string;
  userId: string;
  title: string;
  videoUrl?: string;
  transcript?: string;
  summary?: string;
  transcriptPath?: string;
  createdAt: FirebaseDate;
  updatedAt?: FirebaseDate;
}

export type UserRole = 'student' | 'admin';

export type FirebaseDate = string | Date | { seconds: number; nanoseconds: number } | null;

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: FirebaseDate;
}

export interface UploadResult {
  path: string;
  downloadURL: string;
  fullPath: string;
}
