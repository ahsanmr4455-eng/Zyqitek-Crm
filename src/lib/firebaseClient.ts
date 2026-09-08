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
import firebaseConfigJson from '../../firebase-applet-config.json';

const getFirebaseConfig = () => {
  return {
    apiKey: firebaseConfigJson?.apiKey || import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSy_placeholder_key",
    authDomain: firebaseConfigJson?.authDomain || import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "applet-placeholder.firebaseapp.com",
    projectId: firebaseConfigJson?.projectId || import.meta.env.VITE_FIREBASE_PROJECT_ID || "applet-placeholder",
    storageBucket: firebaseConfigJson?.storageBucket || import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "applet-placeholder.appspot.com",
    messagingSenderId: firebaseConfigJson?.messagingSenderId || import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1234567890",
    appId: firebaseConfigJson?.appId || import.meta.env.VITE_FIREBASE_APP_ID || "1:1234567890:web:1234567890",
    firestoreDatabaseId: firebaseConfigJson?.firestoreDatabaseId || import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || "(default)"
  };
};

const firebaseConfig = getFirebaseConfig();

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
