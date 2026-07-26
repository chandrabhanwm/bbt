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

    if (uid && hadNoLocalSaveAtBoot) {
      // Genuinely fresh device/browser, no local save — safe to check
      // for a cloud save and restore it if one exists. This can only
      // ever improve on "blank fresh-player state," never lose real
      // progress, since there was none to lose in this specific case.
      SaveService.cloudLoad(uid).then((cloudSave) => {
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
        } else {
          // Genuinely brand new — no local save, no cloud save either.
          // This is the one, safe moment to pull the real name from
          // their Google account, since there's no existing name
          // (typed or otherwise) to overwrite. Also the exact, correct
          // moment to signal a real welcome celebration — this can only
          // ever fire once per account, ever.
          const googleName = auth.currentUser?.displayName;
          if (googleName) setPlayerName(googleName);
          setIsBrandNewPlayer(true);
        }
      });
    }

    if (uid) {
      SaveService.cloudSave(uid, latestSaveDataRef.current).then(() => {});
      const { businessesByDistrict: bbd, stats: currentStats, avatarEmoji: emoji, playerName: name } = latestSaveDataRef.current;
      const netWorth = currentStats.cash + getEmpireTotalInvested(bbd);
      SaveService.updateLeaderboardEntry(uid, { playerName: name, avatarEmoji: emoji, netWorth, level: currentStats.level, updatedAt: Date.now() });
      SaveService.fetchTopLeaderboard(50).then(setRealLeaderboard);
      SaveService.fetchMyRank(netWorth).then(setMyRealRank);
    }
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
