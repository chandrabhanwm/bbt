/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Landmark, Lock } from 'lucide-react';
import { Business, PlayerStats, RewardCard } from './types';
import { Header } from './components/Header';
import { DailyRewardCards } from './components/DailyRewardCards';
import { DailyGoalCard } from './components/DailyGoalCard';
import { BusinessGridView } from './components/BusinessGridView';
import { FooterTipBar } from './components/FooterTipBar';
import { ShopDetailSheet } from './components/ShopDetailSheet';
import { BottomNavigation } from './components/BottomNavigation';
import { LeaderboardTab } from './components/LeaderboardTab';
import { CityMapScreen } from './components/citymap/CityMapScreen';
import { PortfolioScreen } from './components/PortfolioScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { Confetti, CoinBurst } from './components/FX';
import { DistrictSummaryCard } from './components/DistrictSummaryCard';
import { buildBusinessesForDistrict, districtEconomies } from './data/districtBusinesses';
import { bastiCity, getDistrict } from './data/cityMapData';
import { DistrictProvider, useDistrict } from './context/DistrictContext';
import { getDistrictProgress, isDistrictCompleted, getDistrictCompletionReward, getEmpireTotalInvested } from './utils/districtProgress';
import { calculateTieredProfit } from './utils/profitCurve';
import { computeAchievements } from './utils/achievements';
import { generateDailyGoal, isDailyGoalComplete } from './utils/dailyGoal';
import { getLegacyStatus, getLegacyIncomeMultiplier } from './utils/legacy';
import { ensureSignedIn } from './firebase/config';
import { SaveService } from './services/SaveService';
import { progressionConfig } from './config/progressionConfig';
import { playClick, playLevelUp, playUnlock } from './utils/audio';
import { formatCash } from './utils/formatCash';

const LEVEL_UP_CASH_BONUS = 1000;
// Claim pool: caps at 3 hours' worth of income, whether the app was
// closed or just left idle without claiming.
const POOL_CAP_MINUTES = 240; // 4 hours — was 3, widened per the "genuine 4-hour check-in window" decision
// Daily Income Boost: flat reward, gated to once per 24 hours.
// Daily Reward Cards: one reward tier per card, with ranges that never
// overlap — small < medium < rare's own floor < rare's jackpot — so a
// scratch always shows a real, visible progression, not three similar-
// looking numbers. Rare's non-jackpot floor sits clearly above medium's
// ceiling specifically so it still feels distinct even without hitting
// the jackpot. Which position gets which tier is reshuffled every reset,
// so the "exciting" card isn't always sitting in the same slot.
const CARD_RESET_COOLDOWN_MS = 24 * 60 * 60 * 1000;

function generateRewardCard(tier: 'small' | 'medium' | 'rare'): RewardCard {
  let value: number;
  if (tier === 'small') {
    value = 200 + Math.floor(Math.random() * 201); // ₹200–₹400
  } else if (tier === 'medium') {
    value = 700 + Math.floor(Math.random() * 401); // ₹700–₹1,100
  } else {
    const isJackpot = Math.random() < 0.12; // 12% chance
    value = isJackpot
      ? 3500 + Math.floor(Math.random() * 2501) // ₹3,500–₹6,000
      : 1400 + Math.floor(Math.random() * 501);   // ₹1,400–₹1,900 — clearly above medium's ₹700–1,100 even without the jackpot
  }
  return { scratched: false, value, claimed: false, tier };
}

function generateFreshRewardCards(): RewardCard[] {
  const cards = [generateRewardCard('small'), generateRewardCard('medium'), generateRewardCard('rare')];
  // Fisher-Yates shuffle — which position holds which tier changes every reset.
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

/** Seeds a fresh businesses-by-district map from scratch — every district
 *  with economy data gets its own independent Business[] the moment the
 *  app first loads, so switching to any of them (once unlocked) just works
 *  with no special-casing. */
function seedAllDistricts(): Record<string, Business[]> {
  const seeded: Record<string, Business[]> = {};
  districtEconomies.forEach((econ) => {
    seeded[econ.districtId] = buildBusinessesForDistrict(econ.districtId);
  });
  return seeded;
}

function AppInner() {
  const { currentDistrictId, setCurrentDistrict, isDistrictUnlocked, unlockDistrict, isDistrictRewarded, markDistrictRewarded, resetDistricts, unlockedDistrictsMap, rewardedDistrictsMap } = useDistrict();
  const currentDistrictMeta = getDistrict(bastiCity, currentDistrictId);

  // STATE DEFINITIONS
  const [businessesByDistrict, setBusinessesByDistrict] = useState<Record<string, Business[]>>(() => {
    const seeded = seedAllDistricts();
    const saved = localStorage.getItem('basti_businesses_by_district');
    if (saved) {
      try {
        return { ...seeded, ...JSON.parse(saved) };
      } catch {
        return seeded;
      }
    }
    // Migrate a pre-District-Engine save (single Badeban array) if present.
    const legacy = localStorage.getItem('basti_businesses');
    if (legacy) {
      try {
        return { ...seeded, badeban: JSON.parse(legacy) };
      } catch {
        return seeded;
      }
    }
    return seeded;
  });

  // The rest of the app only ever reads/writes "businesses" for whichever
  // district is currently loaded — same names, same call signatures as
  // before, so handleUpgrade below doesn't need to change at all. Only
  // what these two names point to has changed.
  const businesses = businessesByDistrict[currentDistrictId] ?? [];
  const setBusinesses = (updater: Business[] | ((prev: Business[]) => Business[])) => {
    setBusinessesByDistrict((prevMap) => {
      const prevForDistrict = prevMap[currentDistrictId] ?? [];
      const next = typeof updater === 'function' ? (updater as (p: Business[]) => Business[])(prevForDistrict) : updater;
      return { ...prevMap, [currentDistrictId]: next };
    });
  };

  const [stats, setStats] = useState<PlayerStats>(() => {
    const saved = localStorage.getItem('basti_stats');
    if (saved) {
      const parsed: PlayerStats = JSON.parse(saved);
      // Recompute poolCash fresh from real elapsed time since last claim,
      // rather than trusting whatever was last saved — this is what makes
      // offline accrual work (the pool keeps growing while the app is
      // closed) and avoids any drift between the stored number and what
      // elapsed time actually justifies. Capped at 3 hours' worth.
      const lastClaimAt = parsed.lastPoolClaimAt ?? Date.now();
      const elapsedMinutes = Math.max(0, (Date.now() - lastClaimAt) / 60000);
      const cappedMinutes = Math.min(elapsedMinutes, POOL_CAP_MINUTES);

      // Reward cards: if 24 hours have passed since the last reset,
      // generate a fresh set — any scratched-but-unclaimed value from the
      // old set simply expires, same one-rule-everywhere principle as the
      // pool cap above.
      const lastCardsReset = parsed.lastCardsResetAt ?? Date.now();
      const cardsExpired = Date.now() - lastCardsReset >= CARD_RESET_COOLDOWN_MS;
      const rewardCards = cardsExpired || !parsed.rewardCards
        ? generateFreshRewardCards()
        : parsed.rewardCards;

      // Daily goal shares the exact same reset moment as the reward cards
      // above — deliberately not a second timer, per the plan.
      const dailyGoal = cardsExpired || !parsed.dailyGoal
        ? generateDailyGoal(currentDistrictId, businessesByDistrict)
        : parsed.dailyGoal;

      return {
        ...parsed,
        poolCash: Math.round((parsed.profitPerMin ?? 0) * cappedMinutes),
        lastPoolClaimAt: lastClaimAt,
        rewardCards,
        lastCardsResetAt: cardsExpired || !parsed.rewardCards ? Date.now() : lastCardsReset,
        dailyGoal,
        // Existing saves predate Moment Zero and, by definition, already
        // have real progress — default both to true so a returning
        // player never sees the first-purchase/first-upgrade celebration
        // fire retroactively. Only a genuinely fresh player (the object
        // below) starts with these false.
        hasMadeFirstPurchase: parsed.hasMadeFirstPurchase ?? true,
        hasMadeFirstUpgrade: parsed.hasMadeFirstUpgrade ?? true,
        unlockedAchievementIds: parsed.unlockedAchievementIds ?? [],
        legacyCount: parsed.legacyCount ?? 0,
        legacyPoints: parsed.legacyPoints ?? 0,
      };
    }
    return {
      cash: 50000, // "Moment Zero" — enough for exactly one real purchase, not a pre-filled empire
      profitPerMin: 0, // Nothing owned yet — Tea Stall is no longer pre-owned, per Moment Zero
      rank: 25421, // Starts at rank #25,421
      level: 1,
      xp: 0,
      nextLevelXp: 120,
      poolCash: 0,
      lastPoolClaimAt: Date.now(),
      rewardCards: generateFreshRewardCards(),
      lastCardsResetAt: Date.now(),
      hasMadeFirstPurchase: false,
      hasMadeFirstUpgrade: false,
      dailyGoal: generateDailyGoal(currentDistrictId, businessesByDistrict),
      unlockedAchievementIds: [],
      legacyCount: 0,
      legacyPoints: 0,
    };
  });

  // Mirrors stats.cash for handleUpgrade's own atomic affordability checks
  // below. Re-synced from committed state on every render via the effect
  // beneath it (covers passive income, rewards, resets, etc.), but
  // handleUpgrade also writes to it directly and synchronously the instant
  // it spends money — so a second rapid tap, arriving before React has
  // re-rendered, still sees the true up-to-the-moment balance rather than
  // a stale render-time value. This is what makes the upgrade check atomic
  // without merging businessesByDistrict and stats into one state object.
  const cashRef = useRef(stats.cash);
  useEffect(() => {
    cashRef.current = stats.cash;
  }, [stats.cash]);

  const [avatarEmoji, setAvatarEmoji] = useState(() => {
    return localStorage.getItem('basti_avatar') || '😎';
  });

  const [playerName, setPlayerName] = useState(() => {
    return localStorage.getItem('basti_player_name') || 'SmartTycoon';
  });

  const [activeTab, setActiveTab] = useState<'home' | 'city' | 'leaderboard' | 'profile'>('home');
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
  // LOCKED DISTRICT PREVIEW MODE: separate from currentDistrictId entirely —
  // browsing a locked district never touches which district is actually
  // "current" for real play. Only set when previewing; App.tsx auto-clears
  // it (and promotes to real play) the moment the district unlocks.
  const [previewDistrictId, setPreviewDistrictId] = useState<string | null>(null);
  // Settings screen visibility. Wired from Profile's settings row. Header
  // currently has no settings icon (dropped when it was rebuilt to match
  // the pixel reference, which only showed a speaker icon) — nothing to
  // wire there without adding a new visual element.
  const [showSettings, setShowSettings] = useState(false);
  // Unified Milestone celebration — level-up, district-completion, and
  // achievement-unlock all drive this ONE state now, instead of three
  // separate near-duplicate modals. Confirmed via direct code inspection
  // that level-up and district-completion were previously two separate,
  // nearly identical implementations differing only in icon/color/text —
  // this consolidates them into one real shared component.
  const [milestone, setMilestone] = useState<{
    icon: string; title: string; message: string; bonusText: string; color: 'gold' | 'green';
  } | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  // Micro Feedback pass: which business just got bought/upgraded, so its
  // grid card can play a one-shot celebrate animation. Cleared shortly
  // after so it never re-triggers on a later re-render.
  const [justUpdatedBusinessId, setJustUpdatedBusinessId] = useState<string | null>(null);

  // Cash Pill pulse — a counter bumped only by discrete actions (a
  // purchase, a claim, a reward), never by the continuous per-second
  // passive tick. Pulsing on every tick would mean pulsing constantly,
  // forever — the opposite of "subtle."
  const [cashPulseKey, setCashPulseKey] = useState(0);
  const triggerCashPulse = () => setCashPulseKey((k) => k + 1);

  // Business News ticker — last 5 events, in-memory only (not persisted,
  // not an achievement log, gone on app close by design). Newest first.
  const [newsEvents, setNewsEvents] = useState<string[]>([]);
  const pushNewsEvent = (message: string) => {
    setNewsEvents((prev) => [message, ...prev].slice(0, 5));
  };

  // Micro Feedback: brief unlock toast — auto-dismisses within the spec's
  // 1–2s window, never longer. Doesn't replace or resemble a new screen,
  // just a small transient banner.
  const [unlockToast, setUnlockToast] = useState<{ name: string; emoji: string } | null>(null);

  // Header pool claim — floating overlay so it works identically on any
  // tab, since the Header (and its Pool pill) is persistent everywhere.
  const [poolClaimUI, setPoolClaimUI] = useState<{ amount: number; state: 'collected' | 'doubled' | 'empty' } | null>(null);
  const [poolClaimAdOpen, setPoolClaimAdOpen] = useState(false);
  const [poolClaimAdCountdown, setPoolClaimAdCountdown] = useState(6);

  // Centralized Milestone dismiss-timer — replaces the 6 separate
  // setTimeout calls that used to live at each trigger site. Pool claim
  // always takes visual priority: the Milestone modal doesn't render
  // while poolClaimUI is showing, and critically, its dismiss countdown
  // doesn't run either — it only starts once the pool card is actually
  // closed, so a milestone triggered mid-claim gets its full celebration
  // time instead of silently expiring while hidden behind the pool card.
  useEffect(() => {
    if (!milestone || poolClaimUI) return;
    const timer = setTimeout(() => setMilestone(null), progressionConfig.celebrationDurationMs);
    return () => clearTimeout(timer);
  }, [milestone, poolClaimUI]);

  const handleHeaderClaimPool = () => {
    const claimed = handleClaimPool();
    if (claimed <= 0) {
      // Nothing to collect yet — still show SOMETHING, so tapping the
      // pill is never silent. Silent-nothing is indistinguishable from
      // a bug, even when the code is technically doing exactly what it
      // should (there's genuinely nothing to claim right now).
      playClick();
      setPoolClaimUI({ amount: 0, state: 'empty' });
      setTimeout(() => setPoolClaimUI((cur) => (cur?.state === 'empty' ? null : cur)), 1800);
      return;
    }
    playClick();
    setPoolClaimUI({ amount: claimed, state: 'collected' });
  };

  const handleHeaderDoubleClaim = () => {
    playClick();
    setPoolClaimAdCountdown(6);
    setPoolClaimAdOpen(true);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (poolClaimAdOpen) {
      interval = setInterval(() => {
        setPoolClaimAdCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setPoolClaimAdOpen(false);
            setPoolClaimUI((cur) => {
              if (!cur) return null;
              handleDoubleClaim(cur.amount);
              playUnlock();
              return { amount: cur.amount, state: 'doubled' };
            });
            setTimeout(() => setPoolClaimUI(null), 2200);
            return 6;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [poolClaimAdOpen]);

  const [celebratingDistrictId, setCelebratingDistrictId] = useState<string | null>(null);

  // Auto-save local storage when state changes
  useEffect(() => {
    localStorage.setItem('basti_businesses_by_district', JSON.stringify(businessesByDistrict));
  }, [businessesByDistrict]);

  useEffect(() => {
    localStorage.setItem('basti_stats', JSON.stringify(stats));
  }, [stats]);

  useEffect(() => {
    localStorage.setItem('basti_avatar', avatarEmoji);
  }, [avatarEmoji]);

  useEffect(() => {
    localStorage.setItem('basti_player_name', playerName);
  }, [playerName]);

  // BACKGROUND CLOUD SYNC — real Firestore now that a real Firebase
  // project exists, but deliberately never something the app's own
  // instant local boot depends on. Signs in anonymously once, then
  // pushes the current save to the cloud whenever it changes, throttled
  // to a few seconds so rapid local updates (the pool ticking, etc.)
  // don't hammer the network with a write on every single change.
  //
  // Deliberately ONE-WAY (push only) for this first pass — this does not
  // pull from the cloud and overwrite local state. Restoring a save
  // from the cloud (e.g. on a new device) is a genuinely separate,
  // higher-stakes feature — it needs a real answer to "which save wins
  // if local and cloud differ," which deserves its own careful, tested
  // pass rather than being bundled in here as an afterthought.
  const cloudUidRef = useRef<string | null>(null);
  const cloudSyncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    let cancelled = false;
    ensureSignedIn().then((uid) => {
      if (!cancelled) cloudUidRef.current = uid;
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (cloudSyncTimeoutRef.current) clearTimeout(cloudSyncTimeoutRef.current);
    cloudSyncTimeoutRef.current = setTimeout(() => {
      const uid = cloudUidRef.current;
      if (!uid) return; // not signed in yet (or Firebase unavailable) — local save already happened above, nothing lost
      SaveService.cloudSave(uid, {
        businessesByDistrict,
        stats,
        avatarEmoji,
        playerName,
        currentDistrictId,
        unlockedDistricts: unlockedDistrictsMap,
        rewardedDistricts: rewardedDistrictsMap,
      });
    }, 4000);
    return () => { if (cloudSyncTimeoutRef.current) clearTimeout(cloudSyncTimeoutRef.current); };
  }, [businessesByDistrict, stats, avatarEmoji, playerName, currentDistrictId, unlockedDistrictsMap, rewardedDistrictsMap]);

  // GAME LOOP (Pool ticks every 1 second; cash is frozen until claimed)
  useEffect(() => {
    const tickInterval = setInterval(() => {
      setStats((prev) => {
        const profitPerSec = prev.profitPerMin / 60;

        // Live progressive ranking climber algorithm
        // Players climb ranks dynamically as cash balance increases
        const baselineRank = 25421;
        const rankGained = Math.floor(prev.cash / 120);
        const nextRank = Math.max(12, baselineRank - rankGained);

        // Pool is now the ONLY thing ticking — cash itself is frozen
        // until the player taps Claim (Header pill or Portfolio). This
        // is a deliberate design change, not a bug: the pool is the live
        // "your business is earning right now" signal, and claiming it
        // is what actually moves cash. Capped at POOL_CAP_MINUTES worth
        // (currently 4 hours) — miss that window and the excess is lost,
        // by design, encouraging a real but forgiving check-in rhythm.
        const poolCap = prev.profitPerMin * POOL_CAP_MINUTES;
        const nextPool = Math.min(poolCap, prev.poolCash + profitPerSec);

        return {
          ...prev,
          rank: nextRank,
          poolCash: nextPool,
        };
      });
    }, 1000);

    return () => clearInterval(tickInterval);
  }, []);

  // Recalculate profit stream when ANY district's business levels change —
  // owning shops in Katra should still earn while you're looking at Badeban.
  useEffect(() => {
    const allDistrictLists: Business[][] = Object.values(businessesByDistrict);
    const totalProfit = allDistrictLists.reduce((grandTotal: number, districtBusinesses: Business[]) => {
      const districtTotal = districtBusinesses.reduce((sum: number, b: Business) => {
        if (b.level === 0) return sum;
        return sum + calculateTieredProfit(b.baseProfitPerMin, b.level);
      }, 0);
      return grandTotal + districtTotal;
    }, 0);

    setStats((prev) => ({
      ...prev,
      profitPerMin: Math.round(totalProfit * getLegacyIncomeMultiplier(prev.legacyPoints))
    }));
  }, [businessesByDistrict]);

  // PROGRESSION ENGINE: auto-evaluate every locked district's
  // unlockRequirement whenever the player's progress changes (cash, level,
  // or another district's completion status). This runs instead of any
  // manual unlock action — once a requirement is met, unlockDistrict()
  // flips it on and it's persisted immediately.
  useEffect(() => {
    bastiCity.districts.forEach((district) => {
      if (isDistrictUnlocked(district.id)) return; // already unlocked, nothing to evaluate

      const req = district.unlockRequirement;
      if (!req || req.type === 'always') return;

      let requirementMet = false;
      if (req.type === 'net_worth') {
        requirementMet = stats.cash >= (req.value ?? Infinity);
      } else if (req.type === 'player_level') {
        requirementMet = stats.level >= (req.value ?? Infinity);
      } else if (req.type === 'district_completed' && req.districtId) {
        requirementMet = isDistrictCompleted(businessesByDistrict[req.districtId] ?? []);
      }

      if (requirementMet) {
        unlockDistrict(district.id);
        pushNewsEvent(`🗺️ ${district.name} unlocked`);
        setUnlockToast({ name: district.name, emoji: district.emoji });
        setTimeout(() => setUnlockToast((cur) => (cur?.name === district.name ? null : cur)), 1800);
      }
    });
  }, [stats.cash, stats.level, businessesByDistrict, isDistrictUnlocked, unlockDistrict]);

  // COMPLETION ENGINE: whenever any district's businesses change, check if
  // it just crossed into "completed" (per progressionConfig.completionRule)
  // and hasn't been rewarded yet. isDistrictRewarded()/markDistrictRewarded()
  // is the guard that makes the bonus grant exactly once, ever, per district
  // — persisted immediately, so it survives a refresh mid-celebration too.
  useEffect(() => {
    bastiCity.districts.forEach((district) => {
      if (isDistrictRewarded(district.id)) return; // already paid out, nothing to do

      const districtBusinesses = businessesByDistrict[district.id] ?? [];
      if (!isDistrictCompleted(districtBusinesses)) return;

      // Mark first (idempotent + synchronous with this check) so a fast
      // double-fire of this effect can never pay the bonus twice.
      markDistrictRewarded(district.id);

      const scaledReward = getDistrictCompletionReward(districtBusinesses);
      setStats((prev) => ({ ...prev, cash: prev.cash + scaledReward }));
      playLevelUp();
      pushNewsEvent(`🎊 ${district.name} completed`);
      setMilestone({
        icon: '🏆',
        title: 'District Completed!',
        message: `${district.emoji} ${district.name} — District Completed!`,
        bonusText: `Earned +₹${scaledReward.toLocaleString('en-IN')} completion bonus`,
        color: 'green',
      });
      setShowConfetti(true);
      setCelebratingDistrictId(district.id);
      setTimeout(() => setShowConfetti(false), Math.min(1300, progressionConfig.celebrationDurationMs));
      setTimeout(() => setCelebratingDistrictId(null), progressionConfig.completionRoadPulseDurationMs);
    });
  }, [businessesByDistrict, isDistrictRewarded, markDistrictRewarded]);

  // NEWS TICKER — completion % and district level milestones. Uses a ref
  // (not state) to remember the last-seen value per district purely so
  // each threshold only ever announces once, the moment it's actually
  // crossed — not a new mechanic, just bookkeeping for the news feed.
  // The very first check for a given district in a session only records
  // a baseline and announces nothing — otherwise a returning player who
  // already has real progress would see old milestones "re-fire" the
  // instant the app opens fresh, since this ref (correctly) isn't
  // persisted across sessions.
  const lastAnnouncedRef = useRef<Record<string, { completion: number; level: number }>>({});
  useEffect(() => {
    bastiCity.districts.forEach((district) => {
      const list = businessesByDistrict[district.id] ?? [];
      if (list.length === 0) return;
      const progress = getDistrictProgress(list);
      const prevSeen = lastAnnouncedRef.current[district.id];

      if (prevSeen) {
        [25, 50, 75, 100].forEach((threshold) => {
          if (prevSeen.completion < threshold && progress.completionPercent >= threshold) {
            pushNewsEvent(`🌟 ${district.name} reached ${threshold}% completion`);
          }
        });
        if (progress.districtLevel > prevSeen.level) {
          pushNewsEvent(`🏆 ${district.name} reached District Level ${progress.districtLevel}`);
        }
      }

      lastAnnouncedRef.current[district.id] = { completion: progress.completionPercent, level: progress.districtLevel };
    });
  }, [businessesByDistrict]);

  // MILESTONE: achievement unlock — global detection, not scoped to
  // whichever screen happens to be open. Previously, achievements were
  // only ever computed inside PortfolioScreen, meaning an unlock that
  // happened while the player was on Home would go completely unnoticed
  // until they next opened Portfolio. This runs continuously instead,
  // same "first check just records a baseline" pattern as the district
  // thresholds above — so a returning player with already-unlocked
  // achievements doesn't get a false celebration the instant the app
  // opens fresh (this ref, like the others, is intentionally not
  // persisted across sessions).
  const seenAchievementIdsRef = useRef<Set<string> | null>(null);
  useEffect(() => {
    const current = computeAchievements(stats, businessesByDistrict);
    const unlockedIds = new Set(current.filter((a) => a.unlocked).map((a) => a.id));

    if (seenAchievementIdsRef.current === null) {
      seenAchievementIdsRef.current = unlockedIds;
      return;
    }

    const newlyUnlocked = current.find((a) => a.unlocked && !seenAchievementIdsRef.current!.has(a.id));
    if (newlyUnlocked) {
      playLevelUp();
      pushNewsEvent(`🏅 ${newlyUnlocked.title} unlocked!`);
      setMilestone({
        icon: '🏅',
        title: 'Achievement Unlocked!',
        message: newlyUnlocked.title,
        bonusText: newlyUnlocked.desc,
        color: 'gold',
      });
      // The actual persistence — permanently records this ID so it
      // survives a future Legacy reset instead of silently re-locking.
      setStats((prev) => ({
        ...prev,
        unlockedAchievementIds: prev.unlockedAchievementIds.includes(newlyUnlocked.id)
          ? prev.unlockedAchievementIds
          : [...prev.unlockedAchievementIds, newlyUnlocked.id],
      }));
    }

    seenAchievementIdsRef.current = unlockedIds;
  }, [stats, businessesByDistrict]);

  // LOCKED DISTRICT PREVIEW MODE: if the district being previewed becomes
  // unlocked while the player is browsing it (e.g. passive income crosses
  // the net-worth threshold mid-preview), seamlessly promote it to the
  // real currentDistrictId and drop out of preview — same screen, same
  // components, it just stops being read-only. setCurrentDistrict() is the
  // same guarded setter as always; this never bypasses the unlock check.
  useEffect(() => {
    if (previewDistrictId && isDistrictUnlocked(previewDistrictId)) {
      setCurrentDistrict(previewDistrictId);
      setPreviewDistrictId(null);
    }
  }, [previewDistrictId, isDistrictUnlocked, setCurrentDistrict]);

  // Leaving the Home tab (e.g. tapping City in the bottom nav) always exits
  // preview mode — returning to the map and re-entering starts fresh.
  useEffect(() => {
    if (activeTab !== 'home' && previewDistrictId) {
      setPreviewDistrictId(null);
    }
  }, [activeTab]);

  // AD SPONSOR DOUBLE PROFIT
  /** Claims the current pool into cash, resets the pool, and returns the
   *  claimed amount so the caller can show "+₹X Collected!" and offer to
   *  double that specific amount. Pure cash mutation lives here, in the
   *  same place as every other stat change; which step of the claim flow
   *  (confirmation, double-offer) is showing is the Portfolio screen's
   *  own local UI state, not something App.tsx needs to track. */
  const handleClaimPool = (): number => {
    const claimed = stats.poolCash;
    if (claimed <= 0) return 0;
    setStats((prev) => {
      const goal = prev.dailyGoal;
      const goalMatches = goal && !goal.claimed && goal.type === 'collect_pool_2' && prev.poolCash > 0;
      return {
        ...prev,
        cash: prev.cash + prev.poolCash,
        poolCash: 0,
        lastPoolClaimAt: Date.now(),
        dailyGoal: goalMatches ? { ...goal, progressCount: goal.progressCount + 1 } : prev.dailyGoal,
      };
    });
    triggerCashPulse();
    return claimed;
  };

  /** Called after the player watches the rewarded ad offered right after
   *  a claim — adds the same amount again, doubling what they just got. */
  const handleDoubleClaim = (amount: number) => {
    setStats((prev) => ({ ...prev, cash: prev.cash + amount }));
    triggerCashPulse();
  };

  /** Free, instant — just flips the card's own scratched flag so the UI
   *  shows the value that was already generated at the last reset. No
   *  cash changes hands here at all; that only happens on claim. */
  const handleScratchCard = (index: number) => {
    setStats((prev) => ({
      ...prev,
      rewardCards: prev.rewardCards.map((c, i) => (i === index ? { ...c, scratched: true } : c)),
    }));
  };

  /** Called after the player watches the rewarded ad for a specific
   *  scratched card — adds that card's own value to cash and marks it
   *  claimed so it can't be claimed twice before the next reset. */
  const handleClaimCard = (index: number) => {
    setStats((prev) => {
      const card = prev.rewardCards[index];
      if (!card || !card.scratched || card.claimed) return prev;
      return {
        ...prev,
        cash: prev.cash + card.value,
        rewardCards: prev.rewardCards.map((c, i) => (i === index ? { ...c, claimed: true } : c)),
      };
    });
    triggerCashPulse();
  };

  /** Daily goal claim — Notable tier only (cash pulse), not the Milestone
   *  celebration. Deliberate: the plan is explicit that a daily win
   *  shouldn't compete with district completion for celebration weight. */
  const handleClaimDailyGoal = () => {
    setStats((prev) => {
      if (!prev.dailyGoal || prev.dailyGoal.claimed) return prev;
      if (!isDailyGoalComplete(prev.dailyGoal, businessesByDistrict)) return prev;
      return {
        ...prev,
        cash: prev.cash + prev.dailyGoal.rewardAmount,
        dailyGoal: { ...prev.dailyGoal, claimed: true },
      };
    });
    triggerCashPulse();
  };

  // DYNAMIC LEVEL UP SYSTEM
  const triggerXpGain = (xpAmount: number) => {
    setStats((prev) => {
      let currentXp = prev.xp + xpAmount;
      let currentLvl = prev.level;
      let nextThreshold = prev.nextLevelXp;
      let cashBonus = 0;
      let leveledUp = false;

      // Handle rolling over multiple thresholds in a single XP gain
      while (currentXp >= nextThreshold) {
        currentXp -= nextThreshold;
        currentLvl += 1;
        cashBonus += LEVEL_UP_CASH_BONUS;
        nextThreshold = Math.round(nextThreshold * 1.5);
        leveledUp = true;
      }

      if (leveledUp) {
        setTimeout(() => {
          playLevelUp();
          setMilestone({
            icon: '👑',
            title: 'Level Up!',
            message: `LEVEL UP! You reached Level ${currentLvl}! 🎉`,
            bonusText: `Earned +₹${LEVEL_UP_CASH_BONUS.toLocaleString('en-IN')} bonus cash`,
            color: 'gold',
          });
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 1300);
        }, 100);
      }

      return {
        ...prev,
        xp: currentXp,
        level: currentLvl,
        nextLevelXp: nextThreshold,
        cash: prev.cash + cashBonus
      };
    });
  };

  // BUY & UPGRADE BUSINESS ACTIONS
  //
  // Previously, the level-up guard read `stats.cash` from this function's
  // render-time closure (stale), while the cash deduction below it used a
  // fresh functional setStats check — an asymmetry that let rapid repeated
  // taps level a business up without the second cash deduction actually
  // succeeding. Fixed by making the affordability decision, the cash
  // deduction, and the level-up all happen from the single functional
  // setBusinesses updater below, using cashRef (always current) instead of
  // the stale closure — so a business now only ever upgrades in the exact
  // same step that payment is confirmed to succeed.
  const handleUpgrade = (id: string) => {
    let purchaseSucceeded = false;

    setBusinesses((prev) => {
      return prev.map((b) => {
        if (b.id !== id) return b;

        // Single source of truth for "can we afford this": cashRef,
        // checked and updated synchronously right here, not the stats
        // closure. `prev` (via the outer .map) is likewise always the
        // true current business state, never a stale snapshot.
        if (cashRef.current < b.cost) {
          return b;
        }

        purchaseSucceeded = true;
        cashRef.current -= b.cost; // deduct immediately so a second rapid
                                    // call sees the post-deduction balance
                                    // even before React re-renders

        const isUnlocking = b.level === 0;
        const newLvl = b.level + 1;
        const nextCost = Math.round(b.baseCost * Math.pow(b.costMultiplier, newLvl));
        const nextProfit = calculateTieredProfit(b.baseProfitPerMin, newLvl);

        if (isUnlocking) {
          pushNewsEvent(`🏪 ${b.name} purchased`);
        } else if (newLvl === 3) {
          pushNewsEvent(`🎉 ${b.name} reached Level 3`);
        } else if (newLvl === 5) {
          pushNewsEvent(`⭐ ${b.name} reached Level 5`);
        } else if (newLvl === 10) {
          pushNewsEvent(`👑 ${b.name} reached Level 10`);
        }

        // "Moment Zero" — the player's very first purchase and very first
        // upgrade each get the full Milestone treatment once, gated by a
        // persisted flag so a returning player never sees this twice.
        // Every purchase/upgrade after this still gets the Notable-tier
        // card animation (below) — this is additional, not instead of.
        if (isUnlocking && !stats.hasMadeFirstPurchase) {
          playLevelUp();
          setMilestone({
            icon: '🏪',
            title: 'Your First Business!',
            message: `${b.name} is now serving ${currentDistrictMeta?.name ?? 'Badeban'}.`,
            bonusText: 'Every empire starts with one shop.',
            color: 'gold',
          });
        } else if (!isUnlocking && !stats.hasMadeFirstUpgrade) {
          playLevelUp();
          setMilestone({
            icon: '📈',
            title: 'Your First Upgrade!',
            message: `${b.name} is now Level ${newLvl} — growing your income.`,
            bonusText: 'Upgrades are how every business becomes worth more.',
            color: 'gold',
          });
        }

        setStats((statsPrev) => {
          const goal = statsPrev.dailyGoal;
          const goalMatchesThisAction =
            goal && !goal.claimed &&
            ((goal.type === 'buy_1' && isUnlocking) || (goal.type === 'upgrade_2' && !isUnlocking));

          return {
            ...statsPrev,
            cash: statsPrev.cash - b.cost,
            hasMadeFirstPurchase: statsPrev.hasMadeFirstPurchase || isUnlocking,
            hasMadeFirstUpgrade: statsPrev.hasMadeFirstUpgrade || !isUnlocking,
            dailyGoal: goalMatchesThisAction ? { ...goal, progressCount: goal.progressCount + 1 } : statsPrev.dailyGoal,
          };
        });
        triggerXpGain(isUnlocking ? 45 : 20);
        triggerCashPulse();
        setJustUpdatedBusinessId(b.id);
        setTimeout(() => setJustUpdatedBusinessId((cur) => (cur === b.id ? null : cur)), 700);

        return {
          ...b,
          level: newLvl,
          cost: nextCost,
          profitPerMin: nextProfit,
          status: 'unlocked'
        };
      });
    });

    return purchaseSucceeded;
  };

  // Reset progress option
  const handleResetProgress = () => {
    playClick();
    if (confirm("Are you sure you want to rebuild your empire from scratch? This resets your cash to ₹50,000.")) {
      setBusinessesByDistrict(seedAllDistricts());
      cashRef.current = 50000;
      setStats({
        cash: 50000,
        profitPerMin: 0,
        rank: 25421,
        level: 1,
        xp: 0,
        nextLevelXp: 120,
        poolCash: 0,
        lastPoolClaimAt: Date.now(),
        rewardCards: generateFreshRewardCards(),
        lastCardsResetAt: Date.now(),
        hasMadeFirstPurchase: false,
        hasMadeFirstUpgrade: false,
        dailyGoal: generateDailyGoal('badeban', seedAllDistricts()),
        unlockedAchievementIds: [],
        legacyCount: 0,
        legacyPoints: 0,
      });
      resetDistricts();
      setPreviewDistrictId(null);
      setActiveTab('home');
    }
  };

  /** Legacy — the voluntary reset. Only actually resets if eligible;
   *  callers (the UI) should already be gating the button on this, but
   *  the check lives here too so it can never be bypassed. Cash,
   *  businesses, district unlock progress, and current daily systems all
   *  reset. Legacy Points, achievements, and lifetime profile stats do
   *  not — that's the entire point of Legacy over the panic-button reset
   *  above. */
  const handleEstablishLegacy = () => {
    const netWorth = stats.cash + getEmpireTotalInvested(businessesByDistrict);
    const status = getLegacyStatus(netWorth, stats.legacyCount);
    if (!status.eligible) return;

    if (!confirm(`Establish your Legacy?\n\nYou'll restart from the beginning with +${status.previewPoints} Legacy Points (permanent +${status.previewPoints}% income, forever). This resets your cash, businesses, and districts — but keeps your achievements and Legacy Points.`)) {
      return;
    }

    playLevelUp();
    setBusinessesByDistrict(seedAllDistricts());
    cashRef.current = 50000;
    setStats((prev) => ({
      ...prev,
      cash: 50000,
      profitPerMin: 0,
      poolCash: 0,
      lastPoolClaimAt: Date.now(),
      hasMadeFirstPurchase: false,
      hasMadeFirstUpgrade: false,
      legacyCount: prev.legacyCount + 1,
      legacyPoints: prev.legacyPoints + status.previewPoints,
      // Deliberately NOT reset: unlockedAchievementIds, dailyGoal,
      // rewardCards, lastCardsResetAt, level, xp, rank — Legacy resets
      // your empire, not your daily systems or your recognition.
    }));
    resetDistricts();
    setPreviewDistrictId(null);
    setActiveTab('home');
    setMilestone({
      icon: '🌟',
      title: 'Legacy Established!',
      message: 'You restart your empire, wiser than before.',
      bonusText: `+${status.previewPoints} Legacy Points — permanent +${status.previewPoints}% income`,
      color: 'gold',
    });
  };

  // LOCKED DISTRICT PREVIEW MODE: what the Home screen actually *displays*
  // can differ from currentDistrictId (the real, playable district) when
  // previewing a locked one. handleUpgrade/setBusinesses above are
  // untouched and still only ever act on currentDistrictId — preview
  // rendering is entirely separate and read-only.
  const isPreviewMode = previewDistrictId !== null;
  const displayedDistrictId = previewDistrictId ?? currentDistrictId;
  const displayedDistrictMeta = getDistrict(bastiCity, displayedDistrictId);
  const displayedBusinesses = businessesByDistrict[displayedDistrictId] ?? [];

  // District progress (income, stars, completion, district level) for the
  // district currently loaded on the Home screen.
  // NOTE: intentionally reads displayedBusinesses (not `businesses`) so this
  // reflects whatever district is actually shown on screen — the real
  // current district during normal play, or the previewed one when a
  // locked district is being browsed. Name kept as-is to avoid touching
  // every call site; only the source data changed.
  const currentDistrictProgress = useMemo(() => getDistrictProgress(displayedBusinesses), [displayedBusinesses]);

  // Same, but for every district at once — this is what feeds the City
  // Map's per-node stats and completed/unlocked visual states.
  const districtProgressMap = useMemo(() => {
    const map: Record<string, ReturnType<typeof getDistrictProgress>> = {};
    bastiCity.districts.forEach((d) => {
      map[d.id] = getDistrictProgress(businessesByDistrict[d.id] ?? []);
    });
    return map;
  }, [businessesByDistrict]);

  // Simple count of districts with at least one owned business — for the
  // Rankings screen's "Districts Owned" display only. Not a new game
  // mechanic, just a derived count over already-persisted business data.
  const playerDistrictsOwned = useMemo(() => {
    const allDistrictLists: Business[][] = Object.values(businessesByDistrict);
    return allDistrictLists.filter((list) => list.some((b) => b.level > 0)).length;
  }, [businessesByDistrict]);

  return (
    <div className="app-shell-height md:min-h-screen w-full bg-gradient-to-br from-[#faf6f0] via-[#f4e7d3] to-[#e6d3b4] text-slate-800 flex flex-col items-center justify-start md:justify-center p-0 md:p-6 select-none overflow-hidden relative font-sans">
      
      {/* Traditional Indian Festive Marigold Garlands draped along the top of screen */}
      <div className="absolute top-0 inset-x-0 h-10 pointer-events-none z-30 hidden md:block overflow-hidden">
        <svg viewBox="0 0 1200 40" className="w-full h-full" fill="none" preserveAspectRatio="none">
          {/* Garland Strings */}
          <path d="M-10,4 Q50,22 110,4 Q170,22 230,4 Q290,22 350,4 Q410,22 470,4 Q530,22 590,4 Q650,22 710,4 Q770,22 830,4 Q890,22 950,4 Q1010,22 1070,4 Q1130,22 1190,4" stroke="#d97706" strokeWidth="1" />
          <path d="M-10,6 Q50,24 110,6 Q170,24 230,6 Q290,24 350,6 Q410,24 470,6 Q530,24 590,6 Q650,24 710,6 Q770,24 830,6 Q890,24 950,6 Q1010,24 1070,6 Q1130,24 1190,6" stroke="#ea580c" strokeWidth="1" />
          
          {/* Individual flowers and mango leaves at wave peaks and troughs */}
          {Array.from({ length: 21 }).map((_, i) => {
            const x = i * 60 - 10;
            const y = i % 2 === 0 ? 5 : 23;
            return (
              <g key={i}>
                {/* Mango Leaf */}
                <path d={`M${x},${y} Q${x-6},${y+15} ${x},${y+22} Q${x+6},${y+15} ${x},${y}`} fill="#166534" />
                {/* Orange/Yellow Marigold fuzzies */}
                <circle cx={x} cy={y} r="8" fill="#f59e0b" className="animate-pulse" style={{ animationDelay: `${i*100}ms` }} />
                <circle cx={x} cy={y} r="6.5" fill="#ea580c" />
                <circle cx={x} cy={y} r="4" fill="#fbbf24" />
                <circle cx={x-3} cy={y-2} r="2.5" fill="#f59e0b" />
                <circle cx={x+3} cy={y+2} r="2.5" fill="#f59e0b" />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Elegant Left Wall Traditional Mandana / Lippan folk art */}
      <div className="absolute left-4 bottom-12 w-80 h-[550px] pointer-events-none hidden xl:flex flex-col justify-end items-start opacity-25">
        <svg viewBox="0 0 300 500" className="w-full h-full text-[#8c3917]" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          {/* Stylized Village tree branch extending */}
          <path d="M0,450 C80,430 180,360 220,240 C230,210 210,180 180,180" strokeWidth="4" />
          <path d="M120,385 C160,350 200,340 230,300" strokeWidth="2.5" strokeDasharray="2,2" />
          <path d="M70,410 C100,360 130,310 110,250" strokeWidth="2" />
          
          {/* Leaves */}
          <path d="M220,240 Q250,220 240,200 Q220,210 220,240" fill="currentColor" />
          <path d="M180,180 Q190,140 170,130 Q160,150 180,180" fill="currentColor" />
          <path d="M230,300 Q260,290 250,270 Q230,280 230,300" fill="currentColor" />
          <path d="M110,250 Q130,220 120,200 Q100,210 110,250" fill="currentColor" />
          
          {/* Hanging Traditional brass lantern */}
          <g transform="translate(180, 180)">
            <line x1="0" y1="0" x2="0" y2="40" strokeWidth="2" />
            {/* Lantern crown */}
            <path d="M-15,40 L15,40 L10,32 L-10,32 Z" fill="currentColor" />
            {/* Glass core */}
            <rect x="-8" y="40" width="16" height="24" rx="4" strokeWidth="2" fill="#fef08a" opacity="0.6" className="animate-pulse" />
            <circle cx="0" cy="52" r="3" fill="#f59e0b" />
            {/* Guard bars */}
            <path d="M-10,40 L-10,64 M10,40 L10,64" strokeWidth="1.5" />
            {/* Base */}
            <rect x="-12" y="64" width="24" height="6" rx="1" fill="currentColor" />
            {/* Hanging tassels */}
            <line x1="-8" y1="70" x2="-8" y2="82" strokeWidth="1" strokeDasharray="2,2" />
            <line x1="0" y1="70" x2="0" y2="86" strokeWidth="1" strokeDasharray="2,2" />
            <line x1="8" y1="70" x2="8" y2="82" strokeWidth="1" strokeDasharray="2,2" />
            <circle cx="-8" cy="84" r="1.5" fill="currentColor" />
            <circle cx="0" cy="88" r="1.5" fill="currentColor" />
            <circle cx="8" cy="84" r="1.5" fill="currentColor" />
          </g>

          {/* Traditional Geometric Mandana concentric circles on the wall */}
          <g transform="translate(80, 200)" className="animate-spin" style={{ animationDuration: '60s' }}>
            <circle cx="0" cy="0" r="50" strokeWidth="1" strokeDasharray="4,4" />
            <circle cx="0" cy="0" r="40" strokeWidth="1.5" />
            <circle cx="0" cy="0" r="28" strokeWidth="1" strokeDasharray="2,2" />
            <circle cx="0" cy="0" r="15" strokeWidth="2" />
          </g>
        </svg>
      </div>

      {/* Elegant Right Wall Traditional Mandana / Lippan folk art */}
      <div className="absolute right-4 bottom-12 w-80 h-[550px] pointer-events-none hidden xl:flex flex-col justify-end items-end opacity-25">
        <svg viewBox="0 0 300 500" className="w-full h-full text-[#8c3917]" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          {/* Right side hanging Marigold strings */}
          <path d="M180,-10 L180,260" strokeWidth="1.5" strokeDasharray="1,2" />
          <path d="M220,-10 L220,180" strokeWidth="1.5" strokeDasharray="1,2" />
          {Array.from({ length: 8 }).map((_, i) => (
            <circle key={i} cx="180" cy={30 + i * 28} r="6" fill="#f59e0b" />
          ))}
          {Array.from({ length: 5 }).map((_, i) => (
            <circle key={i} cx="220" cy={30 + i * 28} r="6" fill="#ea580c" />
          ))}

          {/* Majestic Peacock silhouette sitting on a mud planter */}
          <g transform="translate(100, 320)">
            {/* Planter */}
            <path d="M0,120 L80,120 L70,80 L10,80 Z" fill="none" strokeWidth="2" />
            <path d="M10,80 Q40,65 70,80" strokeWidth="1.5" />
            {/* Plant stems */}
            <path d="M40,80 Q20,30 35,5" strokeWidth="1.5" />
            <path d="M40,80 Q60,40 50,15" strokeWidth="1.5" />
            
            {/* Peacock Body */}
            <path d="M20,60 C0,50 -5,20 15,10 C25,5 35,15 32,30 C30,40 10,42 20,60 Z" fill="currentColor" stroke="none" />
            {/* Crest feathers */}
            <path d="M15,10 Q10,-5 8,-8 M15,10 Q15,-6 15,-10 M15,10 Q20,-5 22,-8" />
            {/* Beak */}
            <path d="M8,12 L0,15" />
            {/* Long flowing tail feathers */}
            <path d="M30,35 C45,55 50,90 40,115 C35,120 25,90 28,60" fill="currentColor" opacity="0.8" />
            <path d="M25,45 C55,65 65,95 55,118" fill="currentColor" opacity="0.6" />
          </g>

          {/* Large gorgeous Concentric Mandana Mandala center */}
          <g transform="translate(150, 150)">
            <circle cx="0" cy="0" r="60" strokeWidth="2" />
            <circle cx="0" cy="0" r="50" strokeWidth="1" strokeDasharray="3,3" />
            <circle cx="0" cy="0" r="35" strokeWidth="1.5" />
            <circle cx="0" cy="0" r="10" fill="currentColor" />
          </g>
        </svg>
      </div>

      {/* Desktop side panel text banner */}
      <div className="absolute top-12 left-12 w-72 pointer-events-none hidden xl:block space-y-4 font-sans">
        <div className="flex items-center gap-2 text-amber-700">
          <Landmark className="animate-spin" style={{ animationDuration: '10s' }} />
          <h1 className="font-display font-extrabold text-xl text-amber-900 tracking-tight uppercase">
            Basti Business
          </h1>
        </div>
        <p className="text-xs text-amber-800 leading-relaxed font-semibold">
          Welcome to the ultimate mobile idle business tycoon. Buy street corners, establish high-yield franchises, double your ad revenues, and outpace regional business moguls live.
        </p>
      </div>

      {/* HIGH-FIDELITY MOBILE DEVICE MOCKUP FRAME CONTAINER (WARM TEAKWOOD FRAME) */}
      <div className="app-shell-height relative w-full md:h-[880px] md:max-w-[420px] bg-[var(--color-ink-900)] md:rounded-[42px] md:border-[10px] md:border-[#523318] md:shadow-[0_24px_64px_rgba(82,51,24,0.45)] flex flex-col overflow-hidden">
        
        {/* Mobile Camera notch and status strip (Visible on desktop mockup shell only) */}
        <div className="hidden md:flex w-full h-8 bg-[#150d0a] justify-between items-center px-6 text-amber-500/80 text-[10px] font-mono font-bold select-none relative border-b border-[var(--color-ink-700)]">
          {/* Simulated Time */}
          <span>9:41 AM</span>
          
          {/* Central Notch speaker capsule */}
          <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-24 h-4 bg-[#24140e] rounded-full flex items-center justify-center border border-[#523318]/20">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-950 ml-auto mr-3 border border-indigo-500/10"></div>
          </div>

          {/* Network and Battery Status indicators */}
          <div className="flex items-center gap-1.5">
            <span>5G</span>
            <span>📶</span>
            <span className="text-emerald-500">100% 🔋</span>
          </div>
        </div>

        {/* 1. STICKY DASHBOARD HEADER */}
        <Header 
          stats={stats} 
          avatarEmoji={avatarEmoji} 
          setAvatarEmoji={setAvatarEmoji} 
          playerName={playerName}
          setPlayerName={setPlayerName}
          cashPulseKey={cashPulseKey}
          onClaimPool={handleHeaderClaimPool}
        />

        {/* 2. DYNAMIC MAIN TAB SCREEN COMPOSITIONS (Scrollable) */}
        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar relative pb-40" style={{ backgroundColor: 'var(--color-premium-bg)' }}>
          
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="min-h-full"
            >
              {activeTab === 'home' && (
                <div className="min-h-full flex flex-col gap-1.5 px-3 pt-1 pb-2">
                  {isPreviewMode ? (
                    /* Preview mode: no ad-boost control (nothing claimable while
                       merely browsing a locked district) — just a clear indicator
                       and the unlock requirement. */
                    <div className="rounded-2xl px-3.5 py-2.5 flex items-center gap-2.5" style={{ backgroundColor: 'var(--color-premium-surface)', border: '1.5px solid var(--color-premium-border-strong)' }}>
                      <Lock size={16} className="flex-shrink-0" color="var(--color-premium-text-secondary)" />
                      <div className="min-w-0">
                        <span className="block text-[10px] font-bold uppercase tracking-wide text-white">
                          🔒 Preview Mode — Browsing Only
                        </span>
                        {displayedDistrictMeta?.unlockRequirement && (
                          <span className="block text-[9px] mt-0.5" style={{ color: 'var(--color-premium-text-secondary)' }}>
                            Unlock requirement: <span className="font-bold" style={{ color: 'var(--color-premium-gold-400)' }}>{displayedDistrictMeta.unlockRequirement.label}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <>
                      <DailyRewardCards
                        cards={stats.rewardCards}
                        onScratch={handleScratchCard}
                        onClaim={handleClaimCard}
                      />
                      {stats.dailyGoal && (
                        <DailyGoalCard
                          goal={stats.dailyGoal}
                          businessesByDistrict={businessesByDistrict}
                          districtName={displayedDistrictMeta?.name}
                          onClaim={handleClaimDailyGoal}
                        />
                      )}
                    </>
                  )}

                  {/* District Summary Card — name, stars, income, businesses, completion, level.
                      Reused as-is for both real play and preview; it's already just a
                      read display of getDistrictProgress(), which is safe either way. */}
                  <DistrictSummaryCard
                    districtEmoji={displayedDistrictMeta?.emoji ?? ''}
                    districtName={displayedDistrictMeta?.name ?? 'Unknown District'}
                    income={currentDistrictProgress.income}
                    businessesOwned={currentDistrictProgress.businessesOwned}
                    businessesTotal={currentDistrictProgress.businessesTotal}
                    completionPercent={currentDistrictProgress.completionPercent}
                    districtLevel={currentDistrictProgress.districtLevel}
                    stars={currentDistrictProgress.stars}
                    celebrating={celebratingDistrictId === currentDistrictId}
                  />

                  {/* Section header — plain sibling now, no bounding card
                      or nested scroll region around it or the grid below.
                      The whole page scrolls as one continuous flow via the
                      outer wrapper's existing overflow-y-auto — the same
                      pattern every reference app in this whole project
                      (Township, Coin Master, real shopping apps) actually
                      uses, rather than nesting a mini-scroll-region inside
                      a bounded card just for the product grid. */}
                  <div className="flex items-center gap-3 py-1">
                    <div className="flex-1 h-px" style={{ background: 'linear-gradient(to left, var(--color-premium-gold-400), transparent)' }} />
                    <span className="text-[14px] font-bold text-white whitespace-nowrap">
                      Businesses in {displayedDistrictMeta?.name ?? 'Unknown District'}
                    </span>
                    <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, var(--color-premium-gold-400), transparent)' }} />
                  </div>

                  <BusinessGridView
                    businesses={displayedBusinesses}
                    onSelectShop={setSelectedShopId}
                    readOnly={isPreviewMode}
                    justUpdatedBusinessId={justUpdatedBusinessId}
                  />

                  <FooterTipBar newsEvents={newsEvents} />
                </div>
              )}

              {activeTab === 'city' && (
                <div className="absolute inset-0">
                  <CityMapScreen
                    districtProgress={districtProgressMap}
                    isDistrictUnlocked={isDistrictUnlocked}
                    businessesByDistrict={businessesByDistrict}
                    celebratingDistrictId={celebratingDistrictId}
                    onPreviewDistrict={(district) => {
                      setPreviewDistrictId(district.id);
                      setActiveTab('home');
                    }}
                    onOpenDistrict={(district) => {
                      setCurrentDistrict(district.id);
                      setActiveTab('home');
                    }}
                  />
                </div>
              )}

              {activeTab === 'leaderboard' && (
                <LeaderboardTab 
                  playerCash={stats.cash} 
                  playerRank={stats.rank} 
                  playerLevel={stats.level}
                  playerAvatar={avatarEmoji}
                  playerName={playerName}
                  playerDistrictsOwned={playerDistrictsOwned}
                  playerPassiveIncome={stats.profitPerMin}
                />
              )}

              {activeTab === 'profile' && (
                <PortfolioScreen
                  stats={stats}
                  businessesByDistrict={businessesByDistrict}
                  avatarEmoji={avatarEmoji}
                  playerName={playerName}
                  onOpenSettings={() => setShowSettings(true)}
                  onClaimPool={handleClaimPool}
                  onDoubleClaim={handleDoubleClaim}
                  onManageDistrict={(districtId) => { setCurrentDistrict(districtId); setActiveTab('home'); }}
                  onEstablishLegacy={handleEstablishLegacy}
                />
              )}
            </motion.div>
          </AnimatePresence>

        </div>

        {/* 3. STICKY FLOATING BOTTOM SELECTION TABS BAR */}
        <BottomNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Settings screen — fully built, currently untriggered (see note
            on showSettings above) */}
        <SettingsScreen
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          playerName={playerName}
          onResetProgress={handleResetProgress}
        />

        {/* 3b. SHOP DETAIL BOTTOM SHEET — tap a shop in the street to open this */}
        <ShopDetailSheet
          business={displayedBusinesses.find(b => b.id === selectedShopId) ?? null}
          index={displayedBusinesses.findIndex(b => b.id === selectedShopId)}
          cash={stats.cash}
          onUpgrade={isPreviewMode ? () => {} : handleUpgrade}
          onClose={() => setSelectedShopId(null)}
          readOnly={isPreviewMode}
        />

        {/* District unlock toast — brief, top-of-screen, auto-dismissing.
            Deliberately not a modal/lightbox like the level-up and
            completion celebrations below — this is meant to be a quick
            "by the way" notice, not a moment that pauses play. */}
        <AnimatePresence>
          {unlockToast && (
            <motion.div
              initial={{ y: -60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -60, opacity: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="absolute top-3 inset-x-4 z-40 rounded-2xl px-4 py-2.5 flex items-center gap-2.5 glossy-3d"
            >
              <span className="text-xl leading-none">{unlockToast.emoji}</span>
              <div>
                <div className="text-[12px] font-bold" style={{ color: 'var(--color-premium-gold-400)' }}>
                  New District Unlocked!
                </div>
                <div className="text-[10px] font-medium" style={{ color: 'var(--color-premium-text)' }}>
                  {unlockToast.name} is now open for business
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header pool claim overlay — genuinely centered via flexbox on
            the wrapper, not the Milestone modal's top-1/3 approximation.
            Includes a dimming backdrop, since this is meant to genuinely
            stop the player and demand a tap, not sit quietly at the edge
            of the screen. */}
        <AnimatePresence>
          {poolClaimUI && (
            <motion.div
              key="pool-claim-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 z-40 flex items-center justify-center p-8"
            >
              <div
                className="absolute inset-0"
                style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
                onClick={() => (poolClaimUI.state === 'collected' || poolClaimUI.state === 'empty') && setPoolClaimUI(null)}
              />
              <motion.div
                initial={{ scale: 0.85, opacity: 0, y: 16 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="relative z-50 w-full max-w-[340px] p-6 rounded-3xl text-center flex flex-col items-center overflow-visible glossy-3d"
              >
                {/* Explicit close button — top right. No auto-dismiss timer
                    anymore; this card stays until the player actually
                    closes it, one way or another. */}
                <button
                  onClick={() => setPoolClaimUI(null)}
                  className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center cursor-pointer"
                  style={{ backgroundColor: 'var(--color-premium-elevated)', color: 'var(--color-premium-text-secondary)' }}
                  aria-label="Close"
                >
                  ✕
                </button>

                {poolClaimUI.state === 'collected' && <CoinBurst count={10} emoji="⭐" />}

                {poolClaimUI.state === 'collected' ? (
                  <>
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-3"
                      style={{ backgroundColor: 'var(--color-premium-elevated)', border: '2px solid var(--color-premium-green-500)' }}
                    >
                      💰
                    </div>
                    <div className="text-[14px] font-bold flex items-center justify-center gap-1.5 flex-wrap" style={{ color: 'var(--color-premium-green-500)' }}>
                      + {formatCash(poolClaimUI.amount)} ✓
                    </div>
                    <div className="font-bold text-[19px] mt-0.5" style={{ color: 'var(--color-premium-green-500)' }}>Collected!</div>
                    <button
                      onClick={handleHeaderDoubleClaim}
                      className="w-full mt-4 py-2.5 rounded-xl font-bold text-[12px] cursor-pointer"
                      style={{ backgroundColor: 'var(--color-premium-gold-400)', color: 'var(--color-premium-text-inverse)' }}
                    >
                      ✨ Double it?
                    </button>
                    <button
                      onClick={() => setPoolClaimUI(null)}
                      className="text-[10px] font-semibold mt-2 cursor-pointer"
                      style={{ color: 'var(--color-premium-text-secondary)' }}
                    >
                      No thanks
                    </button>
                  </>
                ) : poolClaimUI.state === 'empty' ? (
                  <>
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-3"
                      style={{ backgroundColor: 'var(--color-premium-elevated)', border: '2px solid var(--color-premium-border-strong)' }}
                    >
                      ⏳
                    </div>
                    <div className="font-bold text-[15px]" style={{ color: 'var(--color-premium-text)' }}>
                      Nothing to collect yet
                    </div>
                    <div className="text-[10.5px] mt-1" style={{ color: 'var(--color-premium-text-secondary)' }}>
                      Your businesses are still earning — check back soon.
                    </div>
                  </>
                ) : (
                  <>
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-3"
                      style={{ backgroundColor: 'var(--color-premium-elevated)', border: '2px solid var(--color-premium-gold-400)' }}
                    >
                      ⚡
                    </div>
                    <div className="font-bold text-[17px]" style={{ color: 'var(--color-premium-green-500)' }}>
                      Doubled! +{formatCash(poolClaimUI.amount)}
                    </div>
                  </>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Simulated ad for the Header claim's double-up — same reused
            mechanic as every other ad-gated moment in the app. */}
        <AnimatePresence>
          {poolClaimAdOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 select-none">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative w-full max-w-sm bg-slate-900 border-2 border-slate-700 rounded-3xl overflow-hidden aspect-[9/16] shadow-2xl flex flex-col justify-between"
              >
                <div className="p-4 bg-gradient-to-b from-black/80 to-transparent flex justify-between items-center relative z-10">
                  <div className="px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 text-[9px] font-bold tracking-wide uppercase">
                    Sponsored
                  </div>
                  <div className="px-2.5 py-1 rounded-full bg-black/60 border border-slate-800 text-[10px] font-mono font-bold text-amber-400">
                    Reward in {poolClaimAdCountdown}s
                  </div>
                </div>
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-950">
                  <motion.div
                    animate={{ scale: [1, 1.12, 1], rotate: [0, 5, -5, 0] }}
                    transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                    className="w-28 h-28 rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-indigo-600 p-0.5 flex items-center justify-center shadow-2xl mb-6"
                  >
                    <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center">
                      <span className="text-4xl">⚡️</span>
                    </div>
                  </motion.div>
                  <h2 className="font-bold text-lg text-white uppercase tracking-wide">Become the Basti Kingpin!</h2>
                  <div className="w-48 h-1.5 bg-slate-800 rounded-full mt-6 overflow-hidden">
                    <motion.div className="h-full bg-gradient-to-r from-amber-400 to-yellow-300 rounded-full" initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: 6, ease: 'linear' }} />
                  </div>
                </div>
                <div className="p-4 bg-gradient-to-t from-black/80 to-transparent text-center relative z-10">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Thank you for supporting Basti Business Tycoon!</span>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>


        {/* 4. UNIFIED MILESTONE CELEBRATION — level-up, district-completion,
            and achievement-unlock all render through this one component now.
            Previously two separate, nearly-identical modals differing only
            in icon/color/text; consolidated so any future Milestone-tier
            trigger reuses this directly instead of copy-pasting a third. */}
        <AnimatePresence>
          {milestone && !poolClaimUI && (
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="absolute inset-x-8 top-1/3 z-50 p-5 rounded-3xl text-center flex flex-col items-center overflow-visible"
              style={{
                backgroundColor: 'var(--color-premium-surface)',
                border: `2px solid var(--color-premium-${milestone.color === 'gold' ? 'gold-400' : 'green-500'})`,
              }}
            >
              {showConfetti && <Confetti />}

              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-3xl mb-3"
                style={{
                  backgroundColor: 'var(--color-premium-elevated)',
                  border: `2px solid var(--color-premium-${milestone.color === 'gold' ? 'gold-400' : 'green-500'})`,
                }}
              >
                {milestone.icon}
              </div>
              <h2
                className="font-bold text-base uppercase tracking-widest"
                style={{ color: `var(--color-premium-${milestone.color === 'gold' ? 'gold-400' : 'green-500'})` }}
              >
                {milestone.title}
              </h2>
              <p className="text-[11px] font-medium leading-relaxed mt-2" style={{ color: 'var(--color-premium-text)' }}>
                {milestone.message}
              </p>
              <div className="mt-3.5 text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-premium-green-500)' }}>
                {milestone.bonusText}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

    </div>
  );
}

export default function App() {
  return (
    <DistrictProvider>
      <AppInner />
    </DistrictProvider>
  );
}
