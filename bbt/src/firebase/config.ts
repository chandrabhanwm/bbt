import { initializeApp } from 'firebase/app';
import {
  getAuth, signInAnonymously, onAuthStateChanged, type User,
  GoogleAuthProvider, linkWithPopup, signInWithCredential,
  type AuthCredential,
} from 'firebase/auth';
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

/**
 * Links the player's current anonymous session to a real Google account,
 * so their progress can follow them to any device from now on.
 *
 * Two genuinely different outcomes are possible, and this handles both
 * explicitly rather than treating them the same:
 *
 * - First time this Google account has ever been used with the game:
 *   the current anonymous progress gets permanently attached to it.
 *   `switchedAccount: false` — the player's UID doesn't change, they
 *   just gained a permanent identity on top of what they already had.
 *
 * - This Google account was already used before, on a different device
 *   or session: Firebase refuses to link (an account can't be attached
 *   to two different saves), so instead this signs the player INTO
 *   that existing, established account. `switchedAccount: true` — the
 *   player's UID changes to that other account's, and whatever
 *   progress existed only in THIS anonymous session (if it had
 *   diverged) is not merged in. The caller should tell the player this
 *   happened, not silently swap their save out from under them.
 */
export async function linkWithGoogle(): Promise<{ success: boolean; switchedAccount: boolean; error: string | null }> {
  const provider = new GoogleAuthProvider();
  const currentUser = auth.currentUser;
  if (!currentUser) {
    return { success: false, switchedAccount: false, error: 'Not signed in yet — try again in a moment.' };
  }
  try {
    await linkWithPopup(currentUser, provider);
    return { success: true, switchedAccount: false, error: null };
  } catch (err: any) {
    if (err.code === 'auth/credential-already-in-use') {
      try {
        const credential: AuthCredential = GoogleAuthProvider.credentialFromError(err)!;
        await signInWithCredential(auth, credential);
        return { success: true, switchedAccount: true, error: null };
      } catch (switchErr: any) {
        return { success: false, switchedAccount: false, error: `${switchErr.code || 'unknown'}: ${switchErr.message || String(switchErr)}` };
      }
    }
    return { success: false, switchedAccount: false, error: `${err.code || 'unknown'}: ${err.message || String(err)}` };
  }
}
