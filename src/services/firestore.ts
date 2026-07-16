import type { ChatMessage, StudySession } from '../types';
import type { Flashcard, QuizQuestion } from './ai';
import { firestoreService } from '../firebase/services/firestoreService';
import { userRepository } from '../firebase/repositories/userRepository';
import { serverTimestamp } from 'firebase/firestore';

export const createUserProfile = async (
  uid: string,
  email: string | null,
  displayName: string | null,
  photoURL: string | null,
): Promise<void> => {
  await userRepository.set(uid, {
    uid,
    email,
    displayName,
    photoURL,
    role: 'student',
    emailVerified: false,
    providerIds: [],
    createdAt: serverTimestamp(),
  });
};

export const createStudySession = (
  userId: string,
  videoUrl: string,
  title: string,
  summary = '',
): Promise<string> => firestoreService.createStudySession(userId, videoUrl, title, summary);

export const getStudySession = (
  sessionId: string,
): Promise<StudySession | null> => firestoreService.getStudySession(sessionId);

export const saveGeneratedQuiz = (
  sessionId: string,
  questions: QuizQuestion[],
): Promise<void> => firestoreService.saveGeneratedQuiz(sessionId, questions);

export const saveGeneratedFlashcards = (
  sessionId: string,
  cards: Flashcard[],
): Promise<void> => firestoreService.saveGeneratedFlashcards(sessionId, cards);

export const addChatMessage = (
  sessionId: string,
  role: ChatMessage['role'],
  content: string,
): Promise<void> => firestoreService.addChatMessage(sessionId, role, content);

export const getChatHistory = (
  sessionId: string,
): Promise<ChatMessage[]> => firestoreService.getChatHistory(sessionId);
