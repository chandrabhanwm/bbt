import { Business, PlayerStats } from '../types';
import { db } from '../firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';

/**
 * The complete shape of a player's save data — every piece of state that
 * currently lives scattered across 7 separate localStorage keys in two
 * different files (App.tsx and DistrictContext.tsx), unified into one
 * coherent object.
 *
 * This is Phase 2's actual foundation: a single SaveService interface
 * that today reads/writes localStorage, and later — once a real Firebase
 * project exists — reads/writes Firestore instead, keyed by the
 * authenticated player's UID. Every component that needs to load or save
 * game state goes through this service, not localStorage directly, so
 * that swap touches one file when it happens, not a rewrite across the
 * whole app.
 */
export interface GameSave {
  businessesByDistrict: Record<string, Business[]>;
  stats: PlayerStats;
  avatarEmoji: string;
  playerName: string;
  currentDistrictId: string;
  unlockedDistricts: Record<string, boolean>;
  rewardedDistricts: Record<string, boolean>;
}

const STORAGE_KEY = 'basti_game_save_v1';

/**
 * SaveService — the one place game state actually gets persisted.
 *
 * TODAY: backed by a single localStorage key (all 7 pieces of save data
 * combined into one JSON blob, rather than 7 separate keys — simpler to
 * reason about, and a more natural shape for what Firestore will
 * eventually store as one document per player anyway).
 *
 * LATER, once real Firebase credentials exist: this same interface
 * (load/save/subscribe) gets a second implementation backed by
 * Firestore — reading/writing a document at `users/{uid}/save`, using
 * the UID from Firebase Anonymous Auth. Every caller in the app stays
 * exactly the same; only the inside of these three functions changes.
 */
export const SaveService = {
  /** Loads the current save, or null if none exists yet (a genuinely
   *  new player). Synchronous today (localStorage); will become async
   *  once backed by a real network call to Firestore — callers should
   *  already treat this as if it might be async, to avoid a second
   *  refactor later. */
  async load(): Promise<GameSave | null> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as GameSave;
    } catch {
      return null;
    }
  },

  /** Persists the full save. Today, one synchronous localStorage write;
   *  later, a Firestore document write scoped to the authenticated
   *  player's UID. Kept as one call rather than 7 separate ones so a
   *  future network-backed implementation can batch this into a single
   *  request instead of 7 round-trips. */
  async save(data: GameSave): Promise<void> {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Storage full or unavailable — silently no-op for now, matching
      // how localStorage failures have always been handled elsewhere in
      // this app. Worth real error surfacing once this is network-backed
      // and a failed save actually means lost progress, not just a
      // same-device write that'll likely succeed next tick anyway.
    }
  },

  /** One-time migration from the old scattered-key format (7 separate
   *  localStorage entries) into the new unified shape. Called once on
   *  load if the new unified key doesn't exist yet but old keys do —
   *  this is what lets every existing player's progress survive this
   *  refactor instead of silently resetting them to a fresh save. */
  migrateFromLegacyKeys(): GameSave | null {
    const businessesRaw = localStorage.getItem('basti_businesses_by_district');
    const statsRaw = localStorage.getItem('basti_stats');
    if (!businessesRaw || !statsRaw) return null; // nothing meaningful to migrate

    try {
      return {
        businessesByDistrict: JSON.parse(businessesRaw),
        stats: JSON.parse(statsRaw),
        avatarEmoji: localStorage.getItem('basti_avatar') || '😎',
        playerName: localStorage.getItem('basti_player_name') || 'SmartTycoon',
        currentDistrictId: localStorage.getItem('basti_current_district') || 'badeban',
        unlockedDistricts: JSON.parse(localStorage.getItem('basti_unlocked_districts') || '{}'),
        rewardedDistricts: JSON.parse(localStorage.getItem('basti_rewarded_districts') || '{}'),
      };
    } catch {
      return null;
    }
  },

  /** Real Firestore-backed cloud save, scoped to the player's anonymous
   *  UID — one document per player at `saves/{uid}`. This is genuinely
   *  new, live infrastructure (a real Firebase project now exists), but
   *  it's called opportunistically, in the background, from App.tsx —
   *  never something the app's own instant local boot waits on. If this
   *  fails for any reason (Anonymous Auth or Firestore not yet enabled
   *  in the console, no network, a security-rules issue), the game
   *  keeps working from local storage exactly as it always has; this
   *  method's caller is expected to swallow errors, not surface them as
   *  if local play were broken. */
  async cloudSave(uid: string, data: GameSave): Promise<boolean> {
    try {
      await setDoc(doc(db, 'saves', uid), data);
      return true;
    } catch {
      return false;
    }
  },

  /** Real Firestore read for the same document. Returns null on any
   *  failure (including "no save exists yet for this UID," which is the
   *  normal case for a genuinely new player) — same "never breaks local
   *  play" contract as cloudSave above. */
  async cloudLoad(uid: string): Promise<GameSave | null> {
    try {
      const snap = await getDoc(doc(db, 'saves', uid));
      if (!snap.exists()) return null;
      return snap.data() as GameSave;
    } catch {
      return null;
    }
  },
};
