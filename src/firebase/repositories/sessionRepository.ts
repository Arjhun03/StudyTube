import { addDoc, collection, doc, getDocs, orderBy, query, serverTimestamp, where, writeBatch } from 'firebase/firestore';
import type { ChatMessage, StudySession } from '../../types';
import type { Flashcard, QuizQuestion } from '../../services/ai';
import { db, isMockMode } from '../config/firebase';
import { normalizeFirebaseError } from '../errors/firebaseError';
import { FirestoreRepository } from './firestoreRepository';

// ---------------------------------------------------------------------------
// Helpers for mock subcollection storage
// Each subcollection is stored under its own localStorage key:
//   mock_db_sessions__<sessionId>__quizzes
//   mock_db_sessions__<sessionId>__flashcards
//   mock_db_sessions__<sessionId>__chats
// ---------------------------------------------------------------------------

const subKey = (sessionId: string, sub: string) =>
  `mock_db_sessions__${sessionId}__${sub}`;

type MockRecord = Record<string, unknown> & { id: string };

const toMillis = (value: StudySession['createdAt'] | undefined): number => {
  if (!value) return 0;
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'string') {
    const parsed = new Date(value).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  if (typeof value.seconds !== 'number') return 0;
  return value.seconds * 1000;
};

const sortNewestFirst = (sessions: StudySession[]): StudySession[] =>
  [...sessions].sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));

const readSub = (sessionId: string, sub: string): MockRecord[] => {
  try {
    return JSON.parse(localStorage.getItem(subKey(sessionId, sub)) ?? '[]') as MockRecord[];
  } catch {
    return [];
  }
};

const writeSub = (sessionId: string, sub: string, docs: MockRecord[]): void =>
  localStorage.setItem(subKey(sessionId, sub), JSON.stringify(docs));

const mockId = () => `mock_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
const mockTs = () => ({ seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 });

// ---------------------------------------------------------------------------

export class SessionRepository extends FirestoreRepository<StudySession> {
  constructor() {
    super('sessions');
  }

  async createSession(userId: string, videoUrl: string, title: string, summary = ''): Promise<string> {
    return this.create({ userId, videoUrl, title, summary, transcriptPath: '' });
  }

  async updateSession(sessionId: string, data: Partial<StudySession>): Promise<void> {
    await this.update(sessionId, data);
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.delete(sessionId);
  }

  async listByUser(userId: string): Promise<StudySession[]> {
    const sessions = await this.findMany(where('userId', '==', userId));
    return sortNewestFirst(sessions);
  }

  listenByUser(
    userId: string,
    onNext: (sessions: StudySession[]) => void,
    onError?: (error: string) => void,
  ) {
    return this.listenMany(
      [where('userId', '==', userId)],
      (sessions) => onNext(sortNewestFirst(sessions)),
      onError,
    );
  }

  // -------------------------------------------------------------------------
  // Quiz
  // -------------------------------------------------------------------------
  async saveQuiz(sessionId: string, questions: QuizQuestion[]): Promise<void> {
    if (isMockMode()) {
      const existing = readSub(sessionId, 'quizzes');
      const next = questions.map((q) => ({ ...q, id: mockId(), createdAt: mockTs() }));
      writeSub(sessionId, 'quizzes', [...existing, ...next]);
      return;
    }
    try {
      const batch = writeBatch(db);
      const col = collection(db, 'sessions', sessionId, 'quizzes');
      questions.forEach((q) => batch.set(doc(col), { ...q, createdAt: serverTimestamp() }));
      await batch.commit();
    } catch (error) {
      throw normalizeFirebaseError(error);
    }
  }

  // -------------------------------------------------------------------------
  // Flashcards
  // -------------------------------------------------------------------------
  async saveFlashcards(sessionId: string, cards: Flashcard[]): Promise<void> {
    if (isMockMode()) {
      const existing = readSub(sessionId, 'flashcards');
      const next = cards.map((c) => ({ ...c, id: mockId(), createdAt: mockTs() }));
      writeSub(sessionId, 'flashcards', [...existing, ...next]);
      return;
    }
    try {
      const batch = writeBatch(db);
      const col = collection(db, 'sessions', sessionId, 'flashcards');
      cards.forEach((c) => batch.set(doc(col), { ...c, createdAt: serverTimestamp() }));
      await batch.commit();
    } catch (error) {
      throw normalizeFirebaseError(error);
    }
  }

  // -------------------------------------------------------------------------
  // Chat messages
  // -------------------------------------------------------------------------
  async addChatMessage(sessionId: string, role: ChatMessage['role'], content: string): Promise<void> {
    if (isMockMode()) {
      const existing = readSub(sessionId, 'chats');
      writeSub(sessionId, 'chats', [
        ...existing,
        { id: mockId(), role, content, createdAt: mockTs() },
      ]);
      return;
    }
    try {
      const col = collection(db, 'sessions', sessionId, 'chats');
      await addDoc(col, { role, content, createdAt: serverTimestamp() });
    } catch (error) {
      throw normalizeFirebaseError(error);
    }
  }

  async getChatHistory(sessionId: string): Promise<ChatMessage[]> {
    if (isMockMode()) {
      return readSub(sessionId, 'chats') as unknown as ChatMessage[];
    }
    try {
      const col = collection(db, 'sessions', sessionId, 'chats');
      const snapshot = await getDocs(query(col, orderBy('createdAt', 'asc')));
      return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as ChatMessage);
    } catch (error) {
      throw normalizeFirebaseError(error);
    }
  }
}

export const sessionRepository = new SessionRepository();
