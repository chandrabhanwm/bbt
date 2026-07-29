import { initializeApp } from 'firebase/app';
import {
  getAuth, onAuthStateChanged, type User,
  GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your real project config, from the Firebase console.
const firebaseConfig = {
  apiKey: "AIzaSyB8c9xxp0LFxLLCi4tj7LQIq-enryFhzqA",
  authDomain: "bbtgame.firebaseapp.com",
  projectId: "bbtgame",
  storageBucket: "bbtgame.firebasestorage.app",
  messagingSenderId: "297331653172",
  appId: "1:297331653172:web:95b3a85d74323c1deda861"
};

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);

/**
 * Required-login model — a deliberate product decision, not the original
 * silent-anonymous-start design. Every player must sign in with a real
 * Google account before playing at all. Anonymous Auth has been removed
 * from the Firebase console entirely, so there's no anonymous fallback
 * to fall back to — this is now a genuine gate, not an optional upgrade.
 */

/** Subscribes to real-time auth state — the top-level login gate uses
 *  this to know whether to show the login screen, a loading state, or
 *  the actual game. Returns an unsubscribe function. */
export function subscribeToAuthChanges(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

/** True specifically for an installed, standalone PWA — checked two
 *  ways since no single API covers every browser: the standard
 *  `display-mode: standalone` media query, and iOS Safari's own
 *  `navigator.standalone` flag (not covered by the media query there).
 *  This is the exact context where popup-based OAuth is known to be
 *  unreliable — Apple's WebView sandboxing in standalone mode frequently
 *  blocks or silently hangs popup windows, which doesn't reliably throw
 *  a catchable error to fall back from. Detecting this proactively and
 *  using redirect from the start is more robust than waiting for popup
 *  to visibly fail. */
function isStandalonePWA(): boolean {
  const matchesDisplayMode = window.matchMedia?.('(display-mode: standalone)').matches ?? false;
  const iosStandalone = (window.navigator as any).standalone === true;
  return matchesDisplayMode || iosStandalone;
}

/** Opens the real Google sign-in popup. Returns the signed-in user's UID
 *  on success, or an error message on failure (popup blocked/closed, no
 *  network, etc.) — the login screen surfaces this directly, since
 *  there's no silent fallback to quietly continue on.
 *
 *  For an installed standalone PWA, uses signInWithRedirect instead of
 *  a popup from the start (see isStandalonePWA above for why) — this
 *  navigates the whole page away and back, so it never "returns" a uid
 *  directly the way popup does; the caller's onAuthStateChanged
 *  subscription picks up the signed-in state once the page reloads
 *  after the redirect completes. Regular (non-PWA) sign-in also falls
 *  back to redirect if the popup itself fails, covering desktop/mobile
 *  browsers that block popups outright. */
export async function signInWithGoogle(): Promise<{ uid: string | null; error: string | null }> {
  const provider = new GoogleAuthProvider();

  if (isStandalonePWA()) {
    try {
      await signInWithRedirect(auth, provider);
      // Never actually reached in a real browser — the page navigates
      // away before this resolves. Kept only so the function's return
      // type stays consistent for TypeScript.
      return { uid: null, error: null };
    } catch (err: any) {
      return { uid: null, error: `${err.code || 'unknown'}: ${err.message || String(err)}` };
    }
  }

  try {
    const cred = await signInWithPopup(auth, provider);
    return { uid: cred.user.uid, error: null };
  } catch (err: any) {
    // Popup blocked, closed, or otherwise failed to complete — fall
    // back to redirect rather than surface a dead-end error, covering
    // the regular-browser popup-blocked case the same way the PWA case
    // is covered above.
    const popupFailureCodes = ['auth/popup-blocked', 'auth/popup-closed-by-user', 'auth/cancelled-popup-request'];
    if (popupFailureCodes.includes(err.code)) {
      try {
        await signInWithRedirect(auth, provider);
        return { uid: null, error: null };
      } catch (redirectErr: any) {
        return { uid: null, error: `${redirectErr.code || 'unknown'}: ${redirectErr.message || String(redirectErr)}` };
      }
    }
    return { uid: null, error: `${err.code || 'unknown'}: ${err.message || String(err)}` };
  }
}

/** Checked once at app startup, alongside subscribeToAuthChanges —
 *  completes the sign-in flow after a redirect-based sign-in brings the
 *  player back to the app, and surfaces any error that happened during
 *  that redirect (the auth state listener alone would pick up a
 *  *successful* redirect sign-in either way, but this is what actually
 *  reports a failure back, and is Firebase's own recommended pattern
 *  for redirect-based auth). */
export async function checkRedirectResult(): Promise<{ error: string | null }> {
  try {
    await getRedirectResult(auth);
    return { error: null };
  } catch (err: any) {
    return { error: `${err.code || 'unknown'}: ${err.message || String(err)}` };
  }
}

/** Signs the current player out — for a future "switch account" or
 *  "log out" option in Settings. Not wired into any UI yet, but the
 *  natural counterpart to a required-login model. */
export async function signOutUser(): Promise<void> {
  await signOut(auth);
}
