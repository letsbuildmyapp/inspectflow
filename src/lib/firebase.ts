// Firebase initialization — reads VITE_USE_EMULATOR=true to point at local emulators.
// All public Firebase config is fine in VITE_* (it's identifier, not secret).
// IMPORTANT: secrets (Anthropic key, etc) live in functions/.env, never VITE_*.
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, type Auth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, type Firestore } from 'firebase/firestore';
import { getStorage, connectStorageEmulator, type FirebaseStorage } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator, type Functions } from 'firebase/functions';

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'demo-key',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'inspectflow-demo.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'inspectflow-demo',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'inspectflow-demo.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '0',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:0:web:0',
};

export const useEmulator = import.meta.env.VITE_USE_EMULATOR === 'true';
export const useMockBackend = import.meta.env.VITE_USE_MOCK !== 'false'; // default ON for local demo

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let functions: Functions | null = null;

export function getFirebase() {
  if (!app) {
    app = getApps()[0] || initializeApp(config);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    functions = getFunctions(app);
    if (useEmulator) {
      try {
        connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
        connectFirestoreEmulator(db, '127.0.0.1', 8080);
        connectStorageEmulator(storage, '127.0.0.1', 9199);
        connectFunctionsEmulator(functions, '127.0.0.1', 5001);
      } catch (e) {
        console.warn('Emulator connect failed', e);
      }
    }
  }
  return { app: app!, auth: auth!, db: db!, storage: storage!, functions: functions! };
}
