import { useEffect, useRef, useState } from 'react';
import { Business, PlayerStats } from '../types';
import { auth } from '../firebase/config';
import { SaveService, GameSave, LeaderboardEntry } from '../services/SaveService';
import { getEmpireTotalInvested } from '../utils/districtProgress';

interface UseCloudSyncParams {
  /** True only for a genuinely fresh device/browser with no local save
   *  for this account — gates whether a cloud restore is attempted. */
  hadNoLocalSaveAtBoot: boolean;
  businessesByDistrict: Record<string, Business[]>;
  stats: PlayerStats;
  avatarEmoji: string;
  playerName: string;
  currentDistrictId: string;
  unlockedDistrictsMap: Record<string, boolean>;
  rewardedDistrictsMap: Record<string, boolean>;
  setBusinessesByDistrict: (v: Record<string, Business[]>) => void;
  setStats: (v: PlayerStats) => void;
  setAvatarEmoji: (v: string) => void;
  setPlayerName: (v: string) => void;
  restoreDistrictState: (data: { currentDistrictId: string; unlockedDistricts: Record<string, boolean>; rewardedDistricts: Record<string, boolean> }) => void;
}

/**
 * Everything related to Firebase cloud save and the real leaderboard —
 * pulled out of App.tsx as its own domain, per the Phase 0 architecture
 * cleanup. Behavior preserved exactly as it was; this is a relocation,
 * not a rewrite.
 *
 * Covers: the sign-in-time restore-if-fresh + immediate first push, and
 * the periodic (every 10s) save + leaderboard sync loop.
 */
export function useCloudSync(params: UseCloudSyncParams) {
  const {
    hadNoLocalSaveAtBoot, businessesByDistrict, stats, avatarEmoji, playerName,
    currentDistrictId, unlockedDistrictsMap, rewardedDistrictsMap,
    setBusinessesByDistrict, setStats, setAvatarEmoji, setPlayerName, restoreDistrictState,
  } = params;

  const cloudUidRef = useRef<string | null>(null);

  // Ref always holds the latest save-relevant data, kept fresh on every
  // render — this is what both the immediate first save (right after
  // sign-in, below) and the periodic interval (further below) actually
  // read, rather than closing over stale values from whenever they were
  // first created.
  const latestSaveDataRef = useRef<GameSave>({
    businessesByDistrict, stats, avatarEmoji, playerName, currentDistrictId,
    unlockedDistricts: unlockedDistrictsMap, rewardedDistricts: rewardedDistrictsMap, savedAt: Date.now(),
  });
  latestSaveDataRef.current = {
    businessesByDistrict, stats, avatarEmoji, playerName, currentDistrictId,
    unlockedDistricts: unlockedDistrictsMap, rewardedDistricts: rewardedDistrictsMap, savedAt: Date.now(),
  };

  const [realLeaderboard, setRealLeaderboard] = useState<Array<LeaderboardEntry & { uid: string }>>([]);
  const [myRealRank, setMyRealRank] = useState<number | null>(null);
  const [isBrandNewPlayer, setIsBrandNewPlayer] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const uid = auth.currentUser?.uid ?? null;
    cloudUidRef.current = uid;
    if (!uid) return;

    // Runs as a proper sequence, not two independent fire-and-forget
    // calls — this is the actual fix for a real race condition that was
    // here before: the restore-check and the "push current state"
    // write used to fire in the same tick, with no guarantee which
    // network call would complete first. That meant it was possible
    // for stale in-memory state to get written straight to a
    // brand-new account's cloud document before the check had even
    // confirmed whether that account was new. Now the push genuinely
    // cannot happen until the check has resolved first.
    (async () => {
      if (hadNoLocalSaveAtBoot) {
        // Genuinely fresh device/browser, no local save — safe to check
        // for a cloud save and restore it if one exists. This can only
        // ever improve on "blank fresh-player state," never lose real
        // progress, since there was none to lose in this specific case.
        const cloudSave = await SaveService.cloudLoad(uid);
        if (cancelled) return;
        if (cloudSave) {
          setBusinessesByDistrict(cloudSave.businessesByDistrict);
          setStats(cloudSave.stats);
          setAvatarEmoji(cloudSave.avatarEmoji);
          setPlayerName(cloudSave.playerName);
          restoreDistrictState({
            currentDistrictId: cloudSave.currentDistrictId,
            unlockedDistricts: cloudSave.unlockedDistricts,
            rewardedDistricts: cloudSave.rewardedDistricts,
          });
          // A real restore happened — do NOT push latestSaveDataRef
          // below, since it still reflects the pre-restore in-memory
          // state at this exact instant, not what was just restored.
          // The regular periodic sync (further below) will push the
          // real, restored state on its own next cycle.
          return;
        } else {
          // Genuinely brand new — confirmed by the check above, not
          // assumed. Safe to pull the real name from their Google
          // account, and to fire the one-time welcome celebration.
          const googleName = auth.currentUser?.displayName;
          if (googleName) setPlayerName(googleName);
          setIsBrandNewPlayer(true);
        }
      }

      if (cancelled) return;
      // Either there was already a local save for this account (no
      // restore needed), or the check above confirmed this is a
      // genuinely new account with nothing to restore — either way,
      // it's now actually safe to push the current state.
      SaveService.cloudSave(uid, latestSaveDataRef.current).then(() => {});
      const { businessesByDistrict: bbd, stats: currentStats, avatarEmoji: emoji, playerName: name } = latestSaveDataRef.current;
      const netWorth = currentStats.cash + getEmpireTotalInvested(bbd);
      SaveService.updateLeaderboardEntry(uid, { playerName: name, avatarEmoji: emoji, netWorth, level: currentStats.level, updatedAt: Date.now() });
      SaveService.fetchTopLeaderboard(50).then(setRealLeaderboard);
      SaveService.fetchMyRank(netWorth).then(setMyRealRank);
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const uid = cloudUidRef.current;
      if (!uid) return; // not signed in yet (or Firebase unavailable) — local save already happened, nothing lost
      SaveService.cloudSave(uid, latestSaveDataRef.current).then(() => {});

      // Real leaderboard sync — push this player's own entry, then
      // refresh the real top list and this player's real rank.
      // Deliberately only pushes name/avatar/net worth/level, never the
      // full save (see LeaderboardEntry in SaveService for why).
      const { businessesByDistrict: bbd, stats: currentStats, avatarEmoji: emoji, playerName: name } = latestSaveDataRef.current;
      const netWorth = currentStats.cash + getEmpireTotalInvested(bbd);
      SaveService.updateLeaderboardEntry(uid, {
        playerName: name,
        avatarEmoji: emoji,
        netWorth,
        level: currentStats.level,
        updatedAt: Date.now(),
      });
      SaveService.fetchTopLeaderboard(50).then(setRealLeaderboard);
      SaveService.fetchMyRank(netWorth).then(setMyRealRank);
    }, 10000); // every 10 seconds, genuinely — not reset by every small change in between
    return () => clearInterval(interval);
  }, []);

  return { cloudUidRef, realLeaderboard, myRealRank, isBrandNewPlayer };
}
