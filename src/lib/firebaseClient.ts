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
import defaultFirebaseConfig from './firebase-applet-config.json';

// Safe browser Firebase client configuration
// Defaults to the project config file with optional environment variable overrides
const env = typeof import.meta !== 'undefined' ? import.meta.env : ({} as any);

export const isFirebaseConfigured = Boolean(
  (env?.VITE_FIREBASE_API_KEY && env.VITE_FIREBASE_API_KEY !== 'dummy') ||
  (defaultFirebaseConfig.apiKey && defaultFirebaseConfig.apiKey !== 'dummy')
);

export const firebaseConfig = {
  apiKey: env?.VITE_FIREBASE_API_KEY || defaultFirebaseConfig.apiKey || 'dummy',
  authDomain: env?.VITE_FIREBASE_AUTH_DOMAIN || defaultFirebaseConfig.authDomain || 'dummy',
  projectId: env?.VITE_FIREBASE_PROJECT_ID || defaultFirebaseConfig.projectId || 'dummy',
  storageBucket: env?.VITE_FIREBASE_STORAGE_BUCKET || defaultFirebaseConfig.storageBucket || 'dummy',
  messagingSenderId: env?.VITE_FIREBASE_MESSAGING_SENDER_ID || defaultFirebaseConfig.messagingSenderId || 'dummy',
  appId: env?.VITE_FIREBASE_APP_ID || defaultFirebaseConfig.appId || 'dummy',
  firestoreDatabaseId: env?.VITE_FIREBASE_DATABASE_ID || defaultFirebaseConfig.firestoreDatabaseId || '(default)'
};

// Initialize Firebase App (singleton pattern across entire client app)
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
