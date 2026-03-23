import {
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
  type Unsubscribe,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../config/firebase';

export type HushUser = {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  tierLevel: number;
  tierSuccesses: number[];
  totalPublished: number;
  distinguishedCount: number;
  savedSecretIds: string[];
  isGhostMode: boolean;
  ghostModeUntil: Date | null;
  createdAt: Date;
};

const googleProvider = new GoogleAuthProvider();
const appleProvider = new OAuthProvider('apple.com');
appleProvider.addScope('email');
appleProvider.addScope('name');

export async function signInWithGoogle(): Promise<User> {
  if (!auth) throw new Error('Firebase not configured');
  const result = await signInWithPopup(auth, googleProvider);
  await ensureUserProfile(result.user);
  return result.user;
}

export async function signInWithApple(): Promise<User> {
  if (!auth) throw new Error('Firebase not configured');
  const result = await signInWithPopup(auth, appleProvider);
  await ensureUserProfile(result.user);
  return result.user;
}

export async function signOut(): Promise<void> {
  if (!auth) return;
  await firebaseSignOut(auth);
}

async function ensureUserProfile(user: User): Promise<void> {
  if (!db) return;
  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    await setDoc(userRef, {
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
      tierLevel: 1,
      tierSuccesses: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      totalPublished: 0,
      distinguishedCount: 0,
      savedSecretIds: [],
      isGhostMode: false,
      ghostModeUntil: null,
      createdAt: serverTimestamp(),
    });
  }
}

export function onAuthChange(callback: (user: User | null) => void): Unsubscribe {
  if (!auth) {
    // If Firebase isn't configured, call with null immediately
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

export async function getUserProfile(uid: string): Promise<HushUser | null> {
  if (!db) return null;
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) return null;
  const data = userSnap.data();
  return {
    ...data,
    ghostModeUntil: data.ghostModeUntil?.toDate() || null,
    createdAt: data.createdAt?.toDate() || new Date(),
  } as HushUser;
}
