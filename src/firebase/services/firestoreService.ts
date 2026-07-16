import type { ChatMessage, StudySession, UserProfile } from '../../types';
import type { Flashcard, QuizQuestion } from '../../services/ai';
import { normalizeFirebaseError } from '../errors/firebaseError';
import { sessionRepository } from '../repositories/sessionRepository';
import { userRepository } from '../repositories/userRepository';

export class FirestoreService {
  getUserProfile(uid: string): Promise<UserProfile | null> {
    return userRepository.findById(uid);
  }

  listenToUserProfile(
    uid: string,
    onNext: (profile: UserProfile | null) => void,
    onError?: (error: string) => void,
  ) {
    return userRepository.listenById(uid, onNext, onError);
  }

  createStudySession(userId: string, videoUrl: string, title: string, summary = ''): Promise<string> {
    return sessionRepository.createSession(userId, videoUrl, title, summary);
  }

  updateStudySession(sessionId: string, data: Partial<StudySession>): Promise<void> {
    return sessionRepository.updateSession(sessionId, data);
  }

  deleteStudySession(sessionId: string): Promise<void> {
    return sessionRepository.deleteSession(sessionId);
  }

  getStudySession(sessionId: string): Promise<StudySession | null> {
    return sessionRepository.findById(sessionId);
  }

  listStudySessions(userId: string): Promise<StudySession[]> {
    return sessionRepository.listByUser(userId);
  }

  listenToStudySessions(
    userId: string,
    onNext: (sessions: StudySession[]) => void,
    onError?: (error: string) => void,
  ) {
    return sessionRepository.listenByUser(userId, onNext, onError);
  }

  saveGeneratedQuiz(sessionId: string, questions: QuizQuestion[]): Promise<void> {
    return sessionRepository.saveQuiz(sessionId, questions);
  }

  saveGeneratedFlashcards(sessionId: string, cards: Flashcard[]): Promise<void> {
    return sessionRepository.saveFlashcards(sessionId, cards);
  }

  addChatMessage(sessionId: string, role: ChatMessage['role'], content: string): Promise<void> {
    return sessionRepository.addChatMessage(sessionId, role, content);
  }

  getChatHistory(sessionId: string): Promise<ChatMessage[]> {
    return sessionRepository.getChatHistory(sessionId);
  }

  getErrorMessage(error: unknown): string {
    return normalizeFirebaseError(error).message;
  }
}

export const firestoreService = new FirestoreService();
