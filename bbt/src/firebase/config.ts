import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, type User } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your real project config, from the Firebase console.
const firebaseConfig = {
  apiKey: "AIzaSyCRJ3KgiZFIibSREqPOg6hBEbJFT4zHhe4",
  authDomain: "basti-business-tycoon.firebaseapp.com",
  projectId: "basti-business-tycoon",
  storageBucket: "basti-business-tycoon.firebasestorage.app",
  messagingSenderId: "425730951767",
  appId: "1:425730951767:web:d2c45511dcbc143b097112"
};

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);

/**
 * Signs the player in anonymously — silent, no signup screen, no email/
 * password. Firebase assigns a persistent UID tied to this browser/
 * device, which is what cloud saves and the leaderboard key off of.
 *
 * Returns { uid, error } — error is null on success, or the actual
 * Firebase error message on failure (Anonymous Auth not yet enabled in
 * the console, no network, wrong config, etc.). Callers decide whether
 * to surface that error to the player; the game itself keeps working
 * from local storage regardless of what this returns.
 */
export function ensureSignedIn(): Promise<{ uid: string | null; error: string | null }> {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
      unsubscribe();
      if (user) {
        resolve({ uid: user.uid, error: null });
        return;
      }
      signInAnonymously(auth)
        .then((cred) => resolve({ uid: cred.user.uid, error: null }))
        .catch((err) => resolve({ uid: null, error: `${err.code || 'unknown'}: ${err.message || String(err)}` }));
    });
  });
}
