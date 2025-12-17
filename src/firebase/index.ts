import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

function initializeFirebase() {
  const apps = getApps();
  const app = apps.length ? apps[0] : initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const firestore = getFirestore(app);

  return { app, auth, firestore };
}

export { initializeFirebase };

export * from './provider';
export { useUser } from './auth/use-user';
export { useCollection } from './firestore/use-collection';

// This is a new file that will provide a client-side context for Firebase.
export { FirebaseClientProvider } from './client-provider';
