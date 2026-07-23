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
 * Returns the UID once signed in, or null if it fails for any reason
 * (Anonymous Auth not yet enabled in the console, no network, etc.) —
 * callers should treat null as "cloud features unavailable right now,"
 * not as an error to surface to the player. The game keeps working from
 * local storage regardless.
 */
export function ensureSignedIn(): Promise<string | null> {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
      unsubscribe();
      if (user) {
        resolve(user.uid);
        return;
      }
      signInAnonymously(auth)
        .then((cred) => resolve(cred.user.uid))
        .catch(() => resolve(null));
    });
  });
}
