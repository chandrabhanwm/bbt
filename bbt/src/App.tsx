/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Landmark, Sparkles, RotateCcw, Lock } from 'lucide-react';
import { Business, PlayerStats } from './types';
import { Header } from './components/Header';
import { AreaCard } from './components/AreaCard';
import { StreetView } from './components/StreetView';
import { ShopDetailSheet } from './components/ShopDetailSheet';
import { BottomNavigation } from './components/BottomNavigation';
import { LeaderboardTab } from './components/LeaderboardTab';
import { CityMapScreen } from './components/citymap/CityMapScreen';
import { ProfileTab } from './components/ProfileTab';
import { Confetti } from './components/FX';
import { DistrictSummaryCard } from './components/DistrictSummaryCard';
import { buildBusinessesForDistrict, districtEconomies } from './data/districtBusinesses';
import { bastiCity, getDistrict } from './data/cityMapData';
import { DistrictProvider, useDistrict } from './context/DistrictContext';
import { getDistrictProgress, isDistrictCompleted } from './utils/districtProgress';
import { progressionConfig } from './config/progressionConfig';
import { playClick, playUnlock, playLevelUp } from './utils/audio';

const LEVEL_UP_CASH_BONUS = 1000;

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
  const { currentDistrictId, setCurrentDistrict, isDistrictUnlocked, unlockDistrict, isDistrictRewarded, markDistrictRewarded } = useDistrict();
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
  // before, so handleUpgrade/handleReward/etc. below don't need to change
  // at all. Only what these two names point to has changed.
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
      return JSON.parse(saved);
    }
    return {
      cash: 100000, // Starts with exact ₹1,00,000!
      profitPerMin: 100, // Tea Stall Level 1 yields ₹100/min
      rank: 25421, // Starts at rank #25,421
      level: 1,
      xp: 0,
      nextLevelXp: 120,
      activeDoubleProfit: false,
      doubleProfitTimeRemaining: 0
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
  const [levelUpMessage, setLevelUpMessage] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [districtCompletedMessage, setDistrictCompletedMessage] = useState<string | null>(null);
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

  // GAME LOOP (Passive Income ticks every 1 second)
  useEffect(() => {
    const tickInterval = setInterval(() => {
      setStats((prev) => {
        // Calculate passive profit per second
        const multiplier = prev.activeDoubleProfit ? 2 : 1;
        const profitPerSec = (prev.profitPerMin * multiplier) / 60;
        
        // Decrement double income multiplier time if active
        let newDoubleProfitTime = prev.doubleProfitTimeRemaining;
        let isDoubleActive = prev.activeDoubleProfit;

        if (isDoubleActive && newDoubleProfitTime > 0) {
          newDoubleProfitTime -= 1;
          if (newDoubleProfitTime === 0) {
            isDoubleActive = false;
          }
        }

        // Live progressive ranking climber algorithm
        // Players climb ranks dynamically as cash balance increases
        const baselineRank = 25421;
        const rankGained = Math.floor(prev.cash / 120);
        const nextRank = Math.max(12, baselineRank - rankGained);

        return {
          ...prev,
          cash: prev.cash + profitPerSec,
          rank: nextRank,
          activeDoubleProfit: isDoubleActive,
          doubleProfitTimeRemaining: newDoubleProfitTime
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
        return sum + (b.level * b.baseProfitPerMin);
      }, 0);
      return grandTotal + districtTotal;
    }, 0);

    setStats((prev) => ({
      ...prev,
      profitPerMin: totalProfit
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

      setStats((prev) => ({ ...prev, cash: prev.cash + progressionConfig.completionReward }));
      playLevelUp();
      setDistrictCompletedMessage(`${district.emoji} ${district.name} — District Completed!`);
      setShowConfetti(true);
      setCelebratingDistrictId(district.id);
      setTimeout(() => setDistrictCompletedMessage(null), progressionConfig.celebrationDurationMs);
      setTimeout(() => setShowConfetti(false), Math.min(1300, progressionConfig.celebrationDurationMs));
      setTimeout(() => setCelebratingDistrictId(null), progressionConfig.completionRoadPulseDurationMs);
    });
  }, [businessesByDistrict, isDistrictRewarded, markDistrictRewarded]);

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

  // REWARD/COIN COLLECT EVENT
  const handleReward = (amount: number) => {
    setStats((prev) => ({
      ...prev,
      cash: prev.cash + amount,
      xp: prev.xp + 15 // Tapping rewards gives bonus XP
    }));
    triggerXpGain(15);
  };

  // AD SPONSOR DOUBLE PROFIT
  const handleDoubleProfit = (active: boolean) => {
    setStats((prev) => ({
      ...prev,
      activeDoubleProfit: active,
      doubleProfitTimeRemaining: active ? 600 : 0 // 10 minutes in seconds
    }));
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
          setLevelUpMessage(`LEVEL UP! You reached Level ${currentLvl}! 🎉`);
          setShowConfetti(true);
          setTimeout(() => setLevelUpMessage(null), 3500);
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
        const nextProfit = Math.round(b.baseProfitPerMin * newLvl);

        setStats((statsPrev) => ({
          ...statsPrev,
          cash: statsPrev.cash - b.cost
        }));
        triggerXpGain(isUnlocking ? 45 : 20);

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
    if (confirm("Are you sure you want to rebuild your empire from scratch? This resets your cash to ₹1,00,000.")) {
      setBusinessesByDistrict(seedAllDistricts());
      cashRef.current = 100000;
      setStats({
        cash: 100000,
        profitPerMin: 100,
        rank: 25421,
        level: 1,
        xp: 0,
        nextLevelXp: 120,
        activeDoubleProfit: false,
        doubleProfitTimeRemaining: 0
      });
      setCurrentDistrict('badeban');
      setPreviewDistrictId(null);
      setActiveTab('home');
    }
  };

  // Calculate current area completion percentage (based on levels of businesses, capped at 100%)
  const totalPotentialLevels = businesses.length * 10; // e.g. level 10 is area master
  const currentAccumulatedLevels = businesses.reduce((acc, b) => acc + Math.min(10, b.level), 0);
  const areaProgress = Math.min(100, (currentAccumulatedLevels / totalPotentialLevels) * 100);

  // LOCKED DISTRICT PREVIEW MODE: what the Home screen actually *displays*
  // can differ from currentDistrictId (the real, playable district) when
  // previewing a locked one. handleUpgrade/handleReward/setBusinesses above
  // are untouched and still only ever act on currentDistrictId — preview
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

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#faf6f0] via-[#f4e7d3] to-[#e6d3b4] text-slate-800 flex flex-col items-center justify-center p-0 md:p-6 select-none overflow-hidden relative font-sans">
      
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
        <div className="p-4 rounded-3xl bg-white/70 backdrop-blur-md border border-amber-200/50 shadow-md space-y-2.5 pointer-events-auto">
          <div className="text-[10px] text-amber-800 font-bold uppercase tracking-widest">
            Dev/UI Quick Cheat
          </div>
          <button 
            onClick={() => { playUnlock(); cashRef.current += 500000; setStats(prev => ({ ...prev, cash: prev.cash + 500000 })); }}
            className="w-full py-2 px-3 rounded-xl bg-[var(--color-money-500)]/10 border border-[var(--color-money-500)]/25 text-[10px] font-bold text-[var(--color-money-600)] hover:bg-[var(--color-money-500)]/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Sparkles size={11} />
            <span>Inject +₹5,00,000 Cash</span>
          </button>
          <button 
            onClick={handleResetProgress}
            className="w-full py-2 px-3 rounded-xl bg-[var(--color-rose-400)]/10 border border-[var(--color-rose-400)]/25 text-[10px] font-bold text-[var(--color-rose-500)] hover:bg-[var(--color-rose-400)]/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <RotateCcw size={11} />
            <span>Reset Game Progress</span>
          </button>
        </div>
      </div>

      {/* HIGH-FIDELITY MOBILE DEVICE MOCKUP FRAME CONTAINER (WARM TEAKWOOD FRAME) */}
      <div className="relative w-full h-screen md:h-[880px] md:max-w-[420px] bg-[var(--color-ink-900)] md:rounded-[42px] md:border-[10px] md:border-[#523318] md:shadow-[0_24px_64px_rgba(82,51,24,0.45)] flex flex-col overflow-hidden">
        
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
        />

        {/* 2. DYNAMIC MAIN TAB SCREEN COMPOSITIONS (Scrollable) */}
        <div className="flex-1 overflow-y-auto no-scrollbar bg-[var(--color-parchment-200)] relative pb-28">
          
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="h-full"
            >
              {activeTab === 'home' && (
                <div className="h-full flex flex-col gap-3 p-3 pb-2">
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
                  />

                  {isPreviewMode ? (
                    /* Preview mode: no ad-boost control (nothing claimable while
                       merely browsing a locked district) — just a clear indicator
                       and the unlock requirement, reusing the same toy-card style. */
                    <div className="toy-card rounded-2xl px-3.5 py-2.5 flex items-center gap-2.5">
                      <Lock size={16} className="text-[var(--color-ink-700)]/60 flex-shrink-0" />
                      <div className="min-w-0">
                        <span className="block text-[10px] font-display font-bold text-[var(--color-ink-900)] uppercase tracking-wide">
                          🔒 Preview Mode — Browsing Only
                        </span>
                        {displayedDistrictMeta?.unlockRequirement && (
                          <span className="block text-[9px] text-[var(--color-ink-700)]/70 mt-0.5">
                            Unlock requirement: <span className="font-bold">{displayedDistrictMeta.unlockRequirement.label}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Compact HUD strip: ad boost + area progress — unchanged from before */
                    <AreaCard
                      businesses={businesses}
                      progress={areaProgress}
                      cash={stats.cash}
                      districtName={currentDistrictMeta?.name ?? 'Unknown District'}
                      districtIncome={currentDistrictProgress.income}
                      districtStars={currentDistrictProgress.stars}
                      onDoubleProfitToggle={handleDoubleProfit}
                      activeDoubleProfit={stats.activeDoubleProfit}
                      doubleProfitTimeRemaining={stats.doubleProfitTimeRemaining}
                    />
                  )}

                  {/* The market IS the game now — tap a shop to open its detail sheet.
                      Same StreetView component either way; readOnly gates interaction. */}
                  <div className="flex-1 min-h-0">
                    <StreetView
                      businesses={displayedBusinesses}
                      cash={stats.cash}
                      districtLabel={`${displayedDistrictMeta?.emoji ?? ''} ${displayedDistrictMeta?.name ?? 'Unknown District'}`.trim()}
                      onSelectShop={setSelectedShopId}
                      onReward={isPreviewMode ? () => {} : handleReward}
                      readOnly={isPreviewMode}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'city' && (
                <div className="h-full">
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
                />
              )}

              {activeTab === 'profile' && (
                <ProfileTab 
                  stats={stats} 
                  businesses={businesses} 
                  avatarEmoji={avatarEmoji}
                  playerName={playerName}
                />
              )}
            </motion.div>
          </AnimatePresence>

        </div>

        {/* 3. STICKY FLOATING BOTTOM SELECTION TABS BAR */}
        <BottomNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* 3b. SHOP DETAIL BOTTOM SHEET — tap a shop in the street to open this */}
        <ShopDetailSheet
          business={displayedBusinesses.find(b => b.id === selectedShopId) ?? null}
          index={displayedBusinesses.findIndex(b => b.id === selectedShopId)}
          cash={stats.cash}
          onUpgrade={isPreviewMode ? () => {} : handleUpgrade}
          onClose={() => setSelectedShopId(null)}
          readOnly={isPreviewMode}
        />

        {/* 4. LEVEL UP FANFARE LIGHTBOX POPUP MESSAGE */}
        <AnimatePresence>
          {levelUpMessage && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="absolute inset-x-8 top-1/3 z-50 p-5 toy-card border-[3px] border-[var(--color-ink-900)] rounded-3xl text-center flex flex-col items-center overflow-visible"
            >
              {showConfetti && <Confetti />}

              {/* Spinning light beams behind */}
              <div className="absolute inset-0 bg-[var(--color-marigold-400)]/5 rounded-3xl pointer-events-none animate-pulse"></div>

              <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[var(--color-marigold-400)] to-[var(--color-marigold-300)] flex items-center justify-center text-3xl shadow-lg border border-white/20 mb-3 animate-bounce">
                👑
              </div>
              <h2 className="font-display font-extrabold text-base text-[var(--color-marigold-600)] uppercase tracking-widest">
                Level Up!
              </h2>
              <p className="text-[11px] text-slate-800 font-medium leading-relaxed mt-2">
                {levelUpMessage}
              </p>
              <div className="mt-3.5 text-[9px] text-[var(--color-money-600)] font-bold uppercase tracking-wider">
                Earned +₹{LEVEL_UP_CASH_BONUS.toLocaleString('en-IN')} bonus cash
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 4b. DISTRICT COMPLETED CELEBRATION — same pattern as the level-up fanfare above */}
        <AnimatePresence>
          {districtCompletedMessage && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="absolute inset-x-8 top-1/3 z-50 p-5 toy-card border-[3px] border-[var(--color-brass-400)] rounded-3xl text-center flex flex-col items-center overflow-visible"
            >
              {showConfetti && <Confetti />}

              <div className="absolute inset-0 bg-[var(--color-brass-400)]/10 rounded-3xl pointer-events-none animate-pulse"></div>

              <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[var(--color-brass-400)] to-[var(--color-brass-600)] flex items-center justify-center text-3xl shadow-lg border border-white/20 mb-3 animate-bounce">
                🏆
              </div>
              <h2 className="font-display font-extrabold text-base text-[var(--color-brass-600)] uppercase tracking-widest">
                District Completed!
              </h2>
              <p className="text-[11px] text-slate-800 font-medium leading-relaxed mt-2">
                {districtCompletedMessage}
              </p>
              <div className="mt-3.5 text-[9px] text-[var(--color-money-600)] font-bold uppercase tracking-wider">
                Earned +₹{progressionConfig.completionReward.toLocaleString('en-IN')} completion bonus
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* Small dev cheat code panel for mobile users */}
      <div className="mt-4 flex gap-2 justify-center items-center md:hidden p-2.5 rounded-2xl bg-white/80 border border-slate-200/60 shadow-sm backdrop-blur-md">
        <button 
          onClick={() => { playUnlock(); cashRef.current += 100000; setStats(prev => ({ ...prev, cash: prev.cash + 100000 })); }}
          className="px-3 py-1.5 bg-[var(--color-money-500)]/10 border border-[var(--color-money-500)]/25 rounded-lg text-[9px] font-bold text-[var(--color-money-600)] flex items-center gap-1 cursor-pointer"
        >
          <span>💵 Cheat +₹1L</span>
        </button>
        <button 
          onClick={handleResetProgress}
          className="px-3 py-1.5 bg-[var(--color-rose-400)]/10 border border-[var(--color-rose-400)]/25 rounded-lg text-[9px] font-bold text-[var(--color-rose-500)] flex items-center gap-1 cursor-pointer"
        >
          <span>🔄 Reset</span>
        </button>
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
