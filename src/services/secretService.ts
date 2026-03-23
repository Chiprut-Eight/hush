import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
  type Timestamp,
  type Firestore,
} from 'firebase/firestore';
import { db as _db } from '../config/firebase';
import { encodeGeoHash, getGeoHashRange, FEED_RADIUS_METERS } from './geoService';

function getDb(): Firestore {
  if (!_db) throw new Error('Firebase not configured');
  return _db;
}

// Re-export as db for compatibility, all functions below should use getDb()
const db = _db!;

export type SecretType = 'regular' | 'group';
export type SecretContentType = 'text' | 'voice';

export interface Secret {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorTierLevel: number;
  creatorTierColor: string;
  type: SecretType;
  contentType: SecretContentType;
  textContent?: string;
  audioUrl?: string;
  audioDuration?: number;
  lat: number;
  lng: number;
  geoHash: string;
  likes: number;
  dislikes: number;
  listens: number;
  likedBy: string[];
  dislikedBy: string[];
  // Group secret fields
  requiredUsers?: number;
  timeWindowMinutes?: number;
  currentPresent?: string[];
  // Moderation
  reportCount: number;
  hasContentWarning: boolean;
  // Saved
  savedBy: string[];
  // Timestamps
  createdAt: Date;
  lastListenedAt: Date | null;
}

export interface CreateSecretInput {
  creatorId: string;
  creatorName: string;
  creatorTierLevel: number;
  creatorTierColor: string;
  type: SecretType;
  contentType: SecretContentType;
  textContent?: string;
  audioUrl?: string;
  audioDuration?: number;
  lat: number;
  lng: number;
  requiredUsers?: number;
  timeWindowMinutes?: number;
}

export async function createSecret(input: CreateSecretInput): Promise<string> {
  const geoHash = encodeGeoHash(input.lat, input.lng);
  
  const secretData: any = {
    creatorId: input.creatorId,
    creatorName: input.creatorName,
    creatorTierLevel: input.creatorTierLevel,
    creatorTierColor: input.creatorTierColor,
    type: input.type,
    contentType: input.contentType,
    lat: input.lat,
    lng: input.lng,
    geoHash,
    likes: 0,
    dislikes: 0,
    listens: 0,
    likedBy: [],
    dislikedBy: [],
    currentPresent: [],
    reportCount: 0,
    hasContentWarning: false,
    savedBy: [],
    createdAt: serverTimestamp(),
    lastListenedAt: null,
  };

  if (input.textContent !== undefined) secretData.textContent = input.textContent;
  if (input.audioUrl !== undefined) secretData.audioUrl = input.audioUrl;
  if (input.audioDuration !== undefined) secretData.audioDuration = input.audioDuration;
  if (input.requiredUsers !== undefined) secretData.requiredUsers = input.requiredUsers;
  if (input.timeWindowMinutes !== undefined) secretData.timeWindowMinutes = input.timeWindowMinutes;

  const docRef = await addDoc(collection(db, 'secrets'), secretData);

  // Increment user's totalPublished
  const userRef = doc(db, 'users', input.creatorId);
  await updateDoc(userRef, {
    totalPublished: increment(1),
    distinguishedCount: increment(1),
  });

  return docRef.id;
}

export async function getSecretsNearby(
  lat: number,
  lng: number,
  radiusMeters: number = FEED_RADIUS_METERS
): Promise<Secret[]> {
  const range = getGeoHashRange(lat, lng, radiusMeters);
  const q = query(
    collection(db, 'secrets'),
    where('geoHash', '>=', range.lower),
    where('geoHash', '<=', range.upper),
    orderBy('geoHash'),
    limit(50)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
      lastListenedAt: (data.lastListenedAt as Timestamp)?.toDate() || null,
    } as Secret;
  });
}

export async function likeSecret(secretId: string, userId: string): Promise<void> {
  const secretRef = doc(db, 'secrets', secretId);
  await updateDoc(secretRef, {
    likes: increment(1),
    likedBy: arrayUnion(userId),
    dislikedBy: arrayRemove(userId),
  });
}

export async function dislikeSecret(secretId: string, userId: string): Promise<void> {
  const secretRef = doc(db, 'secrets', secretId);
  await updateDoc(secretRef, {
    dislikes: increment(1),
    dislikedBy: arrayUnion(userId),
    likedBy: arrayRemove(userId),
  });
}

export async function removeLike(secretId: string, userId: string): Promise<void> {
  const secretRef = doc(db, 'secrets', secretId);
  await updateDoc(secretRef, {
    likes: increment(-1),
    likedBy: arrayRemove(userId),
  });
}

export async function removeDislike(secretId: string, userId: string): Promise<void> {
  const secretRef = doc(db, 'secrets', secretId);
  await updateDoc(secretRef, {
    dislikes: increment(-1),
    dislikedBy: arrayRemove(userId),
  });
}

export async function recordListen(secretId: string): Promise<void> {
  const secretRef = doc(db, 'secrets', secretId);
  await updateDoc(secretRef, {
    listens: increment(1),
    lastListenedAt: serverTimestamp(),
  });
}

export async function saveSecret(secretId: string, userId: string): Promise<void> {
  // Add to user's saved list
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    savedSecretIds: arrayUnion(secretId),
  });
  // Mark on secret
  const secretRef = doc(db, 'secrets', secretId);
  await updateDoc(secretRef, {
    savedBy: arrayUnion(userId),
  });
}

export async function unsaveSecret(secretId: string, userId: string): Promise<void> {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    savedSecretIds: arrayRemove(secretId),
  });
  const secretRef = doc(db, 'secrets', secretId);
  await updateDoc(secretRef, {
    savedBy: arrayRemove(userId),
  });
}

export async function reportSecret(secretId: string, userId: string): Promise<void> {
  const secretRef = doc(db, 'secrets', secretId);
  await updateDoc(secretRef, {
    reportCount: increment(1),
  });
  // Create a report document
  await addDoc(collection(db, 'reports'), {
    secretId,
    reporterId: userId,
    createdAt: serverTimestamp(),
    status: 'pending',
  });
}

export async function joinGroupSecret(secretId: string, userId: string): Promise<void> {
  const secretRef = doc(db, 'secrets', secretId);
  await updateDoc(secretRef, {
    currentPresent: arrayUnion(userId),
  });
}

export async function leaveGroupSecret(secretId: string, userId: string): Promise<void> {
  const secretRef = doc(db, 'secrets', secretId);
  await updateDoc(secretRef, {
    currentPresent: arrayRemove(userId),
  });
}

export async function getSecretById(secretId: string): Promise<Secret | null> {
  const secretRef = doc(db, 'secrets', secretId);
  const secretSnap = await getDoc(secretRef);
  if (!secretSnap.exists()) return null;
  const data = secretSnap.data();
  return {
    id: secretSnap.id,
    ...data,
    createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
    lastListenedAt: (data.lastListenedAt as Timestamp)?.toDate() || null,
  } as Secret;
}

export async function getUserSecrets(userId: string): Promise<Secret[]> {
  const q = query(
    collection(db, 'secrets'),
    where('creatorId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(100)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
      lastListenedAt: (data.lastListenedAt as Timestamp)?.toDate() || null,
    } as Secret;
  });
}

export async function getSavedSecrets(secretIds: string[]): Promise<Secret[]> {
  if (secretIds.length === 0) return [];
  // Firestore 'in' query supports max 30 items
  const chunks: string[][] = [];
  for (let i = 0; i < secretIds.length; i += 30) {
    chunks.push(secretIds.slice(i, i + 30));
  }
  const results: Secret[] = [];
  for (const chunk of chunks) {
    const q = query(
      collection(db, 'secrets'),
      where('__name__', 'in', chunk)
    );
    const snapshot = await getDocs(q);
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      results.push({
        id: doc.id,
        ...data,
        createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
        lastListenedAt: (data.lastListenedAt as Timestamp)?.toDate() || null,
      } as Secret);
    });
  }
  return results;
}
