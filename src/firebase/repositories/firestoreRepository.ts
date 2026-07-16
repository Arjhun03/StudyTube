import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
  type Firestore,
  type QueryConstraint,
  type Unsubscribe,
} from 'firebase/firestore';
import { db, isMockMode } from '../config/firebase';
import { normalizeFirebaseError } from '../errors/firebaseError';

export type RepositoryListener<T> = (items: T[]) => void;
export type DocumentListener<T> = (item: T | null) => void;
export type RepositoryErrorListener = (error: string) => void;
export type FirestoreWriteData = Record<string, unknown>;

// ---------------------------------------------------------------------------
// Lightweight localStorage mock store
// ---------------------------------------------------------------------------

/** Returns a stable storage key per collection */
const storeKey = (col: string) => `mock_db_${col}`;

type MockDoc = Record<string, unknown> & { id: string };

const readCollection = (col: string): MockDoc[] => {
  try {
    return JSON.parse(localStorage.getItem(storeKey(col)) ?? '[]') as MockDoc[];
  } catch {
    return [];
  }
};

const writeCollection = (col: string, docs: MockDoc[]): void => {
  localStorage.setItem(storeKey(col), JSON.stringify(docs));
};

const mockTimestamp = () => ({ seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 });

/** Generates a short random id */
const mockId = () => `mock_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

/**
 * Very small subset of QueryConstraint interpretation.
 * Supports where(field, '==', value), orderBy(field, dir), and limit(n).
 */
const applyConstraints = (docs: MockDoc[], constraints: QueryConstraint[]): MockDoc[] => {
  let result = [...docs];

  for (const constraint of constraints) {
    // @ts-expect-error — accessing internal Firestore constraint fields
    const type: string = constraint.type ?? constraint._type ?? '';
    // @ts-expect-error
    const field: string = constraint._field?.segments?.join('.') ?? constraint.field ?? '';
    // @ts-expect-error
    const value: unknown = constraint._value ?? constraint.value;
    // @ts-expect-error
    const direction: string = constraint._direction ?? constraint.direction ?? 'asc';
    // @ts-expect-error
    const limitVal: number = constraint._limit ?? constraint.limit ?? 0;

    if (type === 'where') {
      result = result.filter((d) => {
        const parts = field.split('.');
        let cur: unknown = d;
        for (const p of parts) cur = (cur as Record<string, unknown>)?.[p];
        return cur === value;
      });
    } else if (type === 'orderBy') {
      result.sort((a, b) => {
        const av = (a[field] as { seconds?: number } | null)?.seconds ?? a[field];
        const bv = (b[field] as { seconds?: number } | null)?.seconds ?? b[field];
        if (av == null) return 1;
        if (bv == null) return -1;
        return direction === 'desc'
          ? (bv as number) - (av as number)
          : (av as number) - (bv as number);
      });
    } else if (type === 'limit') {
      result = result.slice(0, limitVal);
    }
  }

  return result;
};

// ---------------------------------------------------------------------------
// Repository
// ---------------------------------------------------------------------------

export class FirestoreRepository<T extends object> {
  protected readonly database: Firestore;
  protected readonly collectionName: string;

  constructor(collectionName: string, database: Firestore = db) {
    this.collectionName = collectionName;
    this.database = database;
  }

  protected collectionRef() {
    return collection(this.database, this.collectionName);
  }

  protected docRef(id: string) {
    return doc(this.database, this.collectionName, id);
  }

  protected fromDoc(snapshot: DocumentData): T {
    return { id: snapshot.id, ...snapshot.data() } as unknown as T;
  }

  // -------------------------------------------------------------------------
  // CREATE
  // -------------------------------------------------------------------------
  async create(data: FirestoreWriteData): Promise<string> {
    if (isMockMode()) {
      const id = mockId();
      const docs = readCollection(this.collectionName);
      const record: MockDoc = { ...data, id, createdAt: mockTimestamp(), updatedAt: mockTimestamp() };
      writeCollection(this.collectionName, [...docs, record]);
      return id;
    }
    try {
      const docRef = await addDoc(this.collectionRef(), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      throw normalizeFirebaseError(error);
    }
  }

  // -------------------------------------------------------------------------
  // SET (upsert)
  // -------------------------------------------------------------------------
  async set(id: string, data: FirestoreWriteData, merge = true): Promise<void> {
    if (isMockMode()) {
      const docs = readCollection(this.collectionName);
      const existing = docs.find((d) => d.id === id) ?? {};
      const updated: MockDoc = merge
        ? { ...existing, ...data, id, updatedAt: mockTimestamp() }
        : { ...data, id, updatedAt: mockTimestamp() };
      const next = docs.filter((d) => d.id !== id);
      writeCollection(this.collectionName, [...next, updated]);
      return;
    }
    try {
      await setDoc(this.docRef(id), { ...data, updatedAt: serverTimestamp() }, { merge });
    } catch (error) {
      throw normalizeFirebaseError(error);
    }
  }

  // -------------------------------------------------------------------------
  // UPDATE
  // -------------------------------------------------------------------------
  async update(id: string, data: FirestoreWriteData): Promise<void> {
    if (isMockMode()) {
      return this.set(id, data);
    }
    try {
      await updateDoc(this.docRef(id), { ...data, updatedAt: serverTimestamp() });
    } catch (error) {
      throw normalizeFirebaseError(error);
    }
  }

  // -------------------------------------------------------------------------
  // DELETE
  // -------------------------------------------------------------------------
  async delete(id: string): Promise<void> {
    if (isMockMode()) {
      const docs = readCollection(this.collectionName);
      writeCollection(this.collectionName, docs.filter((d) => d.id !== id));
      return;
    }
    try {
      await deleteDoc(this.docRef(id));
    } catch (error) {
      throw normalizeFirebaseError(error);
    }
  }

  // -------------------------------------------------------------------------
  // FIND BY ID
  // -------------------------------------------------------------------------
  async findById(id: string): Promise<T | null> {
    if (isMockMode()) {
      const found = readCollection(this.collectionName).find((d) => d.id === id);
      return found ? (found as unknown as T) : null;
    }
    try {
      const snapshot = await getDoc(this.docRef(id));
      return snapshot.exists() ? this.fromDoc(snapshot) : null;
    } catch (error) {
      throw normalizeFirebaseError(error);
    }
  }

  // -------------------------------------------------------------------------
  // FIND MANY (with constraints)
  // -------------------------------------------------------------------------
  async findMany(...constraints: QueryConstraint[]): Promise<T[]> {
    if (isMockMode()) {
      const all = readCollection(this.collectionName);
      return applyConstraints(all, constraints) as unknown as T[];
    }
    try {
      const snapshot = await getDocs(query(this.collectionRef(), ...constraints));
      return snapshot.docs.map((item) => this.fromDoc(item));
    } catch (error) {
      throw normalizeFirebaseError(error);
    }
  }

  // -------------------------------------------------------------------------
  // LISTEN BY ID (real-time)
  // -------------------------------------------------------------------------
  listenById(
    id: string,
    onNext: DocumentListener<T>,
    onError?: RepositoryErrorListener,
  ): Unsubscribe {
    if (isMockMode()) {
      // Emit once immediately, then no subsequent updates (storage events not wired)
      const found = readCollection(this.collectionName).find((d) => d.id === id);
      onNext(found ? (found as unknown as T) : null);
      return () => undefined;
    }
    return onSnapshot(
      this.docRef(id),
      (snapshot) => onNext(snapshot.exists() ? this.fromDoc(snapshot) : null),
      (error) => onError?.(normalizeFirebaseError(error).message),
    );
  }

  // -------------------------------------------------------------------------
  // LISTEN MANY (real-time)
  // -------------------------------------------------------------------------
  listenMany(
    constraints: QueryConstraint[],
    onNext: RepositoryListener<T>,
    onError?: RepositoryErrorListener,
  ): Unsubscribe {
    if (isMockMode()) {
      const all = readCollection(this.collectionName);
      onNext(applyConstraints(all, constraints) as unknown as T[]);
      return () => undefined;
    }
    return onSnapshot(
      query(this.collectionRef(), ...constraints),
      (snapshot) => onNext(snapshot.docs.map((item) => this.fromDoc(item))),
      (error) => onError?.(normalizeFirebaseError(error).message),
    );
  }
}

export { limit, orderBy, query, serverTimestamp, where, writeBatch };
