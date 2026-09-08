import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  addDoc,
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  updateDoc,
  serverTimestamp,
  FirestoreError
} from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with Database ID if configured
export const db = getFirestore(
  app, 
  firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
    ? firebaseConfig.firestoreDatabaseId 
    : undefined
);

export const auth = getAuth(app);

export function handleFirestoreError(error: unknown, operation: string, path: string) {
  const err = error as FirestoreError;
  console.error(`[FIRESTORE ERROR] ${operation} at ${path}:`, err);
  if (err?.code === 'permission-denied') {
    throw new Error(JSON.stringify({
      code: 'PERMISSION_DENIED',
      message: `Access denied to ${path}. Insufficient permissions for ${operation}.`,
      operation,
      path
    }));
  }
  throw error;
}
