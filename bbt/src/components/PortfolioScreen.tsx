import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Award, Settings as SettingsIcon, ChevronRight, ChevronDown, Fingerprint, Zap, Sparkles, LogOut, Lock } from 'lucide-react';
import { progressionConfig } from '../config/progressionConfig';
import { PlayerStats, Business } from '../types';
import { bastiCity } from '../data/cityMapData';
import { getDistrictProgress, getEmpireTotalInvested } from '../utils/districtProgress';
import { derivePlayerId } from '../utils/playerIdentity';
import { PRESTIGE_BADGES, getTotalLevelSum } from '../data/prestigeBadges';
import { getLegacyStatus } from '../utils/legacy';
import { CoinIcon } from './CoinIcon';
import { formatCash } from '../utils/formatCash';
import { playClick, playUnlock } from '../utils/audio';
import { getCooldownRemainingSeconds, CLAIM_COOLDOWN_MS, formatCooldownClock } from '../utils/cooldown';
import { todayDateString } from '../utils/weeklyContest';
import { logAnalyticsEvent } from '../firebase/config';
import { CountdownClock } from './CountdownClock';
import { SimulatedAdModal } from './SimulatedAdModal';
interface PortfolioScreenProps {
  stats: PlayerStats;
  businessesByDistrict: Record<string, Business[]>;
  avatarEmoji: string;
  playerName: string;
  playerEmail?: string | null;
  onSignOut: () => void;
  onOpenSettings?: () => void;
  /** Returns the claimed amount, so the UI can show "+₹X Collected!" and
   *  offer to double that exact amount. */
  onClaimPool: () => number;
  onDoubleClaim: (amount: number) => boolean;
  /** Switches the Home tab to the given district and navigates there. */
  onManageDistrict: (districtId: string) => void;
  onEstablishLegacy: () => void;
}

const GOLD = 'var(--color-premium-gold-400)';
const GREEN = 'var(--color-premium-green-500)';
const TEXT_SECONDARY = 'var(--color-premium-text-secondary)';
// Hidden for now, per request — flip to true to bring the Legacy card
// back. Not removed since this may return later.
const SHOW_LEGACY = false;

export const PortfolioScreen: React.FC<PortfolioScreenProps> = ({
  stats,
  businessesByDistrict,
  avatarEmoji,
  playerName,
  playerEmail,
  onSignOut,
  onOpenSettings,
  onClaimPool,
  onDoubleClaim,
  onManageDistrict,
  onEstablishLegacy,
}) => {
  const [expandedDistrict, setExpandedDistrict] = useState<string | null>(null);
  const [claimState, setClaimState] = useState<'idle' | 'collected' | 'claimed' | 'cooldown' | 'doubleCapped'>('idle');
  const [cooldownSecondsRemaining, setCooldownSecondsRemaining] = useState(0);
  const [cooldownTotalSeconds, setCooldownTotalSeconds] = useState(CLAIM_COOLDOWN_MS / 1000);
  const [lastClaimedAmount, setLastClaimedAmount] = useState(0);

  const xpPct = Math.min(100, Math.round((stats.xp / Math.max(1, stats.nextLevelXp)) * 100));
  const playerId = derivePlayerId(playerName);

  // Prestige badges replace the old achievement list entirely — a
  // single, unbounded (well, 0-480, but not artificially small)
  // progress number instead of 27 separate flags, and every threshold
  // genuinely earnable, unlike an XP-based system would have been (see
  // prestigeBadges.ts for the full reasoning on why total level sum was
  // chosen over XP).
  const totalLevelSum = getTotalLevelSum(businessesByDistrict);

  // Districts with at least one owned business, with their real progress
  const districtsOwned = bastiCity.districts
    .map((d) => ({ district: d, progress: getDistrictProgress(businessesByDistrict[d.id] ?? []) }))
    .filter((entry) => entry.progress.businessesOwned > 0);

  const totalBusinessesOwned = districtsOwned.reduce((sum, e) => sum + e.progress.businessesOwned, 0);
  const totalBusinessesPossible = bastiCity.districts.length * 8;
  const netWorth = stats.cash + getEmpireTotalInvested(businessesByDistrict);
  const legacyStatus = getLegacyStatus(netWorth, stats.legacyCount);

  const poolCap = stats.profitPerMin * progressionConfig.poolCapMinutes; // shared with App.tsx's own cap — single source of truth now
  const poolPct = poolCap > 0 ? Math.min(100, Math.round((stats.poolCash / poolCap) * 100)) : 0;

  const handleClaim = () => {
    const doubleCooldownSeconds = getCooldownRemainingSeconds(stats.lastProfitDoubleClaimAt);
    if (doubleCooldownSeconds > 0) {
      playClick();
      setCooldownSecondsRemaining(doubleCooldownSeconds);
      setCooldownTotalSeconds(CLAIM_COOLDOWN_MS / 1000);
      setClaimState('cooldown');
      setTimeout(() => setClaimState((cur) => (cur === 'cooldown' ? 'idle' : cur)), 1800);
      return;
    }
    // The genuine 2-hour cooldown between any two pool claims — checked
    // here explicitly so the UI can show the actual real countdown,
    // rather than silently doing nothing when there'd otherwise be
    // something in the pool to claim. Skipped entirely for the very
    // first claim since this cooldown was introduced.
    const poolCooldownSeconds = stats.hasClaimedSincePoolCooldown
      ? getCooldownRemainingSeconds(stats.lastPoolClaimAt, progressionConfig.poolClaimCooldownMinutes * 60000)
      : 0;
    if (poolCooldownSeconds > 0 && stats.poolCash > 0) {
      playClick();
      setCooldownSecondsRemaining(poolCooldownSeconds);
      setCooldownTotalSeconds(progressionConfig.poolClaimCooldownMinutes * 60);
      setClaimState('cooldown');
      setTimeout(() => setClaimState((cur) => (cur === 'cooldown' ? 'idle' : cur)), 1800);
      return;
    }
    playClick();
    const amount = onClaimPool();
    setLastClaimedAmount(amount);
    setClaimState('collected');
  };

  const [adOpen, setAdOpen] = useState(false);
  const [adCountdown, setAdCountdown] = useState(6);

  const handleDouble = () => {
    playClick();
    setAdCountdown(6);
    setAdOpen(true);
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (adOpen) {
      interval = setInterval(() => {
        setAdCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setAdOpen(false);
            playUnlock();
            const wasDoubled = onDoubleClaim(lastClaimedAmount);
            if (wasDoubled) logAnalyticsEvent('ad_watched', { source: 'portfolio_double_claim' });
            setClaimState(wasDoubled ? 'claimed' : 'doubleCapped');
            setTimeout(() => setClaimState('idle'), 2000);
            return 6;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [adOpen]);

  const dismissOffer = () => setClaimState('idle');

  return (
    <div id="portfolio-tab" className="p-4 space-y-4 pb-28 select-none" style={{ backgroundColor: 'var(--color-premium-bg)' }}>

      {/* Hero — same avatar-ring / XP-bar language as the Header, now a
          genuine gold gradient identity card instead of a flat neutral
          surface, matching the standard already proven on the Home
          cards rather than leaving this screen on the old template. */}
      <div
        className="rounded-2xl p-4 flex items-center gap-4 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #8A6B1F 0%, #5C4310 60%, #3D2C0A 100%)',
          boxShadow: '0 8px 20px rgba(150,110,20,0.3), inset 0 1.5px 0 rgba(255,255,255,0.15)',
        }}
      >
        <motion.div
          className="absolute -left-8 -top-8 w-32 h-32 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(255,215,0,0.35), transparent 70%)' }}
          animate={{ opacity: [0.5, 0.9, 0.5] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="relative w-16 h-16 flex-shrink-0">
          <div
            className="w-full h-full rounded-full flex items-center justify-center text-3xl"
            style={{ backgroundColor: '#2A1F08', border: '2.5px solid #FFD700', boxShadow: '0 0 14px rgba(255,215,0,0.6)' }}
          >
            {avatarEmoji}
          </div>
        </div>

        <div className="relative flex-1 min-w-0">
          <h3 className="font-bold text-[15px] truncate text-white">
            {playerName}
          </h3>
          <div className="text-[10px] font-bold mt-0.5" style={{ color: '#FFD700' }}>
            Level {stats.level} · {xpPct}%
          </div>
          <div className="w-full h-1.5 rounded-full mt-1.5 overflow-hidden" style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}>
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: '#FFD700' }}
              initial={{ width: 0 }}
              animate={{ width: `${xpPct}%` }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            />
          </div>
          <div className="flex items-center gap-1 mt-1.5 justify-between">
            <div className="flex items-center gap-1 min-w-0">
              <Fingerprint size={10} color="rgba(255,255,255,0.6)" className="flex-shrink-0" />
              <span className="text-[9.5px] font-medium truncate text-white/70">
                {playerEmail || `ID ${playerId}`}
              </span>
            </div>
            <button
              onClick={onSignOut}
              className="flex items-center gap-1 flex-shrink-0 ml-2 cursor-pointer"
            >
              <LogOut size={10} color="#FF8A8A" />
              <span className="text-[9.5px] font-semibold" style={{ color: '#FF8A8A' }}>
                Sign Out
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Empire stats — three genuinely distinct identities (gold for
          money, teal for businesses, purple for territory) instead of
          three identical neutral cards differing only in their text,
          matching the same tier-color logic already used elsewhere. */}
      <div className="grid grid-cols-3 gap-2.5">
        <BottomStat label="Net Worth" value={formatCash(netWorth)} accentHex="#FFD700" money />
        <BottomStat label="Businesses" value={`${totalBusinessesOwned} / ${totalBusinessesPossible}`} accentHex="#3DE8DC" />
        <BottomStat label="Districts" value={`${districtsOwned.length} / ${bastiCity.districts.length}`} accentHex="#C061FF" />
      </div>

      {/* Combined Income + Claim Pool — a genuine emerald identity for
          the income/money moment, replacing the neutral glossy-3d
          shell that looked identical to every other card on the app. */}
      <div
        className="rounded-2xl p-3 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #1F6B4A 0%, #14442F 100%)',
          boxShadow: '0 6px 16px rgba(20,100,70,0.3), inset 0 1.5px 0 rgba(255,255,255,0.12)',
        }}
      >
        <span className="text-[9px] font-bold uppercase tracking-widest text-white/70">
          Combined Income
        </span>
        <div className="flex items-center gap-1.5 mt-0.5">
          <CoinIcon className="w-3.5 h-3.5" premium />
          <span className="font-bold text-[18px]" style={{ color: '#5AE89A' }}>
            {formatCash(stats.profitPerMin)}<span className="text-[11px] text-white/60">/min</span>
          </span>
        </div>

        <div className="rounded-xl p-2.5 mt-2.5" style={{ backgroundColor: 'rgba(0,0,0,0.25)' }}>
          <AnimatePresence mode="wait">
            {claimState === 'idle' && (
              <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-[9px] font-bold uppercase tracking-wide" style={{ color: TEXT_SECONDARY }}>Ready to Collect</span>
                    <div className="font-bold text-[16px] mt-0.5 flex items-center gap-1" style={{ color: GREEN }}>
                      <CoinIcon className="w-3.5 h-3.5" premium />
                      {formatCash(stats.poolCash)}
                    </div>
                  </div>
                  <button
                    onClick={handleClaim}
                    disabled={stats.poolCash <= 0}
                    className="flex-shrink-0 px-4 py-2 rounded-xl font-bold text-[12px] cursor-pointer"
                    style={{
                      backgroundColor: stats.poolCash > 0 ? GOLD : 'var(--color-premium-track)',
                      color: stats.poolCash > 0 ? 'var(--color-premium-text-inverse)' : TEXT_SECONDARY,
                    }}
                  >
                    Claim
                  </button>
                </div>
                <div className="w-full h-[5px] rounded-full mt-2.5 overflow-hidden" style={{ backgroundColor: 'var(--color-premium-track)' }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: GOLD }}
                    animate={{ width: `${poolPct}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <span className="text-[8.5px] font-medium mt-1 block" style={{ color: TEXT_SECONDARY }}>
                  Caps at {progressionConfig.poolCapMinutes / 60} hours of income — keep checking in so nothing goes to waste
                </span>
              </motion.div>
            )}

            {claimState === 'collected' && (
              <motion.div key="collected" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="text-center py-1">
                <div className="text-[13px] font-bold flex items-center justify-center gap-1.5" style={{ color: GREEN }}>
                  + {formatCash(lastClaimedAmount)} <span>✓</span>
                </div>
                <div className="font-bold text-[17px] mt-0.5" style={{ color: GREEN }}>Collected!</div>

                {(stats.dailyDoubleClaimDate === todayDateString() ? stats.dailyDoubleClaimCount : 0) >= progressionConfig.doubleClaimCapPerDay ? (
                  <div className="text-[10.5px] font-semibold mt-3" style={{ color: TEXT_SECONDARY }}>
                    Max {progressionConfig.doubleClaimCapPerDay} daily doubles already used — resets tomorrow.
                  </div>
                ) : (
                  <button
                    onClick={handleDouble}
                    className="w-full mt-3 py-2.5 rounded-xl font-bold text-[12px] flex items-center justify-center gap-1.5 cursor-pointer"
                    style={{ backgroundColor: GOLD, color: 'var(--color-premium-text-inverse)' }}
                  >
                    <Sparkles size={13} />
                    Boost Profit +{formatCash(Math.round(lastClaimedAmount * progressionConfig.doubleClaimBonusPercent))} (+50%)
                  </button>
                )}
                <button onClick={dismissOffer} className="text-[9.5px] font-semibold mt-2 cursor-pointer" style={{ color: TEXT_SECONDARY }}>
                  No thanks
                </button>
              </motion.div>
            )}

            {claimState === 'claimed' && (
              <motion.div key="claimed" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="text-center py-2.5">
                <div className="font-bold text-[15px] flex items-center justify-center gap-1.5" style={{ color: GREEN }}>
                  <Zap size={15} fill={GREEN} />
                  Boosted! +{formatCash(Math.round(lastClaimedAmount * progressionConfig.doubleClaimBonusPercent))}
                </div>
              </motion.div>
            )}

            {claimState === 'cooldown' && (
              <motion.div key="cooldown" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="text-center py-2 flex flex-col items-center">
                <CountdownClock secondsRemaining={cooldownSecondsRemaining} totalSeconds={cooldownTotalSeconds} size={60} />
                <div className="font-bold text-[13px] mt-2" style={{ color: 'var(--color-premium-text)' }}>
                  Please wait
                </div>
                <div className="text-[9.5px] mt-1" style={{ color: TEXT_SECONDARY }}>
                  {cooldownTotalSeconds > 60
                    ? `The pool refills on its own timer — ${formatCooldownClock(cooldownSecondsRemaining)} remaining.`
                    : 'A short cooldown after doubling your last claim.'}
                </div>
              </motion.div>
            )}

            {claimState === 'doubleCapped' && (
              <motion.div key="doubleCapped" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="text-center py-2.5">
                <div className="font-bold text-[13px]" style={{ color: 'var(--color-premium-text)' }}>
                  Today's Double bonus is used up
                </div>
                <div className="text-[9.5px] mt-1" style={{ color: TEXT_SECONDARY }}>
                  You've claimed {formatCash(lastClaimedAmount)} — Double resets tomorrow.
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Legacy — the voluntary reset. Shows current permanent bonus,
          and either the next reset's requirement (not yet eligible) or
          a real call-to-action with the actual point preview
          (eligible right now). Hidden for now (SHOW_LEGACY = false,
          defined at the top of this file) — not removed, just not
          shown, so it's a one-line flip to bring back later. */}
      {SHOW_LEGACY && (
      <div className="glossy-3d rounded-2xl p-3.5">
        <div className="flex items-center gap-1.5">
          <span className="text-base leading-none">🌟</span>
          <span className="text-[12px] font-bold" style={{ color: 'var(--color-premium-text)' }}>Legacy</span>
        </div>
        <div className="flex items-center gap-3 mt-1.5">
          <div>
            <div className="text-[8px] font-bold uppercase tracking-wide" style={{ color: TEXT_SECONDARY }}>Legacy Points</div>
            <div className="font-bold text-[15px]" style={{ color: GOLD }}>{stats.legacyPoints}</div>
          </div>
          <div>
            <div className="text-[8px] font-bold uppercase tracking-wide" style={{ color: TEXT_SECONDARY }}>Permanent Bonus</div>
            <div className="font-bold text-[15px]" style={{ color: GREEN }}>+{stats.legacyPoints}% income</div>
          </div>
        </div>

        <div className="rounded-xl p-3 mt-3" style={{ backgroundColor: 'var(--color-premium-elevated)' }}>
          {legacyStatus.eligible ? (
            <>
              <p className="text-[10.5px] leading-relaxed" style={{ color: 'var(--color-premium-text)' }}>
                You've proven your business empire. Restart from the beginning and carry your experience forward.
              </p>
              <button
                onClick={onEstablishLegacy}
                className="w-full mt-2.5 py-2.5 rounded-xl font-bold text-[12px] cursor-pointer"
                style={{ backgroundColor: GOLD, color: 'var(--color-premium-text-inverse)' }}
              >
                🌟 Establish Your Legacy — +{legacyStatus.previewPoints} LP
              </button>
            </>
          ) : (
            <p className="text-[10.5px] leading-relaxed" style={{ color: TEXT_SECONDARY }}>
              Reach <span className="font-bold" style={{ color: GOLD }}>{legacyStatus.minRequiredLabel}</span> net worth to unlock your next Legacy reset.
            </p>
          )}
        </div>
      </div>
      )}

      {/* Districts Owned In — expandable per-district business breakdown */}
      <SectionLabel>Districts Owned In</SectionLabel>
      <div className="space-y-2.5">
        {districtsOwned.length === 0 && (
          <p className="text-[10.5px] px-1" style={{ color: TEXT_SECONDARY }}>
            You don't own any businesses yet — head to Home to get started.
          </p>
        )}
        {districtsOwned.map(({ district, progress }) => {
          const isExpanded = expandedDistrict === district.id;
          const businesses = businessesByDistrict[district.id] ?? [];
          const owned = businesses.filter((b) => b.level > 0);
          const isFullyComplete = progress.completionPercent >= 100;
          const rowAccent = isFullyComplete ? '#FFD700' : '#3DE8DC';

          return (
            <div
              key={district.id}
              className="rounded-2xl overflow-hidden"
              style={{
                background: `linear-gradient(160deg, ${rowAccent}22 0%, var(--color-premium-surface) 70%)`,
                border: `1.5px solid ${rowAccent}66`,
              }}
            >
              <button
                onClick={() => { playClick(); setExpandedDistrict(isExpanded ? null : district.id); }}
                className="w-full p-3.5 flex items-center gap-3 cursor-pointer"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
                  style={{ background: `linear-gradient(180deg, ${rowAccent}55, var(--color-premium-elevated))`, border: `1.5px solid ${rowAccent}` }}
                >
                  {district.emoji}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <h4 className="font-bold text-[12.5px] truncate" style={{ color: 'var(--color-premium-text)' }}>{district.name}</h4>
                  <span className="text-[9.5px]" style={{ color: TEXT_SECONDARY }}>
                    {progress.businessesOwned}/8 shops · {progress.completionPercent}% complete
                  </span>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className="font-bold text-[12px]" style={{ color: GREEN }}>{formatCash(progress.income)}/min</span>
                  <ChevronDown size={14} color={TEXT_SECONDARY} style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </div>
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-3.5 pb-3.5 space-y-2">
                      {owned.map((b) => (
                        <div key={b.id} className="flex items-center gap-2 text-[11px]">
                          <span className="text-sm flex-shrink-0">{b.emoji}</span>
                          <span className="flex-1 min-w-0 truncate" style={{ color: 'var(--color-premium-text)' }}>
                            {b.name} · Lvl {b.level}
                          </span>
                          <span className="font-semibold flex-shrink-0" style={{ color: GREEN }}>
                            {formatCash(b.profitPerMin)}/min
                          </span>
                        </div>
                      ))}
                      <button
                        onClick={() => onManageDistrict(district.id)}
                        className="w-full mt-1.5 py-2 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer"
                        style={{ backgroundColor: 'var(--color-premium-elevated)', color: GOLD }}
                      >
                        Manage in {district.name} <ChevronRight size={13} />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Prestige badges — replaces the old 27-achievement list entirely.
          Every badge is always shown, not just earned ones — locked
          badges stay visible but grayed out with a progress bar, so a
          player can see exactly what's next and feel the pull toward
          completing the set, the same "trophy case" reasoning behind
          keeping locked achievements visible before. */}
      <SectionLabel icon={<Award size={13} color="var(--color-premium-gold-400)" />}>Prestige Badges</SectionLabel>
      <div className="space-y-2.5">
        {(() => {
          // Escalating tier colors across the 16 badges — copper through
          // diamond — the same color-progression language already used
          // for business levels elsewhere in the app, so an early badge
          // and a late one read as genuinely different tiers of
          // achievement, not the same gold card repeated 16 times.
          const TIER_COLORS = ['#D68A4C', '#E0A040', '#E8E8E8', '#FFD700', '#3DE8DC', '#C061FF'];
          const nextBadgeThreshold = PRESTIGE_BADGES.find((b) => totalLevelSum < b.threshold)?.threshold;

          return PRESTIGE_BADGES.map((badge, i) => {
            const unlocked = totalLevelSum >= badge.threshold;
            const progress = Math.min(100, Math.round((totalLevelSum / badge.threshold) * 100));
            const isNextUp = badge.threshold === nextBadgeThreshold;
            const tierColor = TIER_COLORS[Math.min(i, TIER_COLORS.length - 1)];

            return (
              <div
                key={badge.threshold}
                className="rounded-2xl p-3 flex items-center gap-3 relative overflow-hidden"
                style={
                  unlocked
                    ? {
                        background: `linear-gradient(135deg, ${tierColor}45 0%, var(--color-premium-surface) 70%)`,
                        border: `1.5px solid ${tierColor}`,
                        boxShadow: `0 4px 14px ${tierColor}33, inset 0 1px 0 rgba(255,255,255,0.15)`,
                      }
                    : isNextUp
                    ? { backgroundColor: 'var(--color-premium-surface)', border: `1.5px solid ${tierColor}66` }
                    : { backgroundColor: 'var(--color-premium-elevated)', border: '1.5px solid var(--color-premium-border)', opacity: 0.55 }
                }
              >
                {unlocked && (
                  <motion.div
                    className="absolute -right-4 -top-4 w-16 h-16 rounded-full pointer-events-none"
                    style={{ background: `radial-gradient(circle, ${tierColor}55, transparent 70%)` }}
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  />
                )}

                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-[18px] relative"
                  style={
                    unlocked
                      ? { background: `linear-gradient(180deg, ${tierColor}dd, ${tierColor}88)`, boxShadow: `0 0 10px ${tierColor}88` }
                      : { backgroundColor: 'var(--color-premium-elevated)', border: '1.5px solid var(--color-premium-border)' }
                  }
                >
                  {unlocked ? badge.icon : <Lock size={14} color="var(--color-premium-text-secondary)" />}
                </div>

                <div className="flex-1 min-w-0 relative">
                  <div className="flex justify-between items-center gap-2">
                    <h4 className="font-bold text-[11px] truncate" style={{ color: unlocked ? '#fff' : 'var(--color-premium-text-secondary)' }}>
                      {badge.name}
                    </h4>
                    {unlocked ? (
                      <span
                        className="text-[8px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: tierColor, color: '#1a130e' }}
                      >
                        Unlocked
                      </span>
                    ) : isNextUp ? (
                      <span
                        className="text-[8px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: 'transparent', color: tierColor, border: `1px solid ${tierColor}` }}
                      >
                        Next Up
                      </span>
                    ) : null}
                  </div>
                  <p className="text-[9.5px] leading-snug mt-1" style={{ color: unlocked ? 'rgba(255,255,255,0.75)' : 'var(--color-premium-text-secondary)' }}>
                    {badge.threshold === 480
                      ? 'Fully master every business in every district.'
                      : `Reach ${badge.threshold} total business levels across Basti.`}
                  </p>
                  <div className="w-full h-1.5 rounded-full mt-2 overflow-hidden" style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: unlocked ? tierColor : isNextUp ? tierColor : 'var(--color-premium-border-strong)' }}
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              </div>
            );
          });
        })()}
      </div>


      {/* Settings shortcut — navigates to the Settings screen */}
      <button
        onClick={() => { playClick(); onOpenSettings?.(); }}
        className="w-full rounded-2xl p-3.5 flex items-center gap-3 cursor-pointer"
        style={{ backgroundColor: 'var(--color-premium-surface)', border: '1.5px solid var(--color-premium-border)' }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: 'var(--color-premium-elevated)', border: '1.5px solid var(--color-premium-border)' }}
        >
          <SettingsIcon size={16} color="var(--color-premium-text-secondary)" />
        </div>
        <span className="flex-1 text-left font-bold text-[12px]" style={{ color: 'var(--color-premium-text)' }}>
          Settings
        </span>
        <ChevronRight size={16} color="var(--color-premium-text-secondary)" />
      </button>

      <SimulatedAdModal isOpen={adOpen} countdown={adCountdown} />
    </div>
  );
};

const SectionLabel: React.FC<{ children: React.ReactNode; icon?: React.ReactNode }> = ({ children, icon }) => (
  <div className="flex items-center gap-1.5 px-1 pt-1">
    {icon}
    <h3 className="text-[10.5px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-premium-text-secondary)' }}>
      {children}
    </h3>
  </div>
);

const BottomStat: React.FC<{ label: string; value: string; accentHex: string; money?: boolean }> = ({ label, value, accentHex, money }) => (
  <div
    className="rounded-2xl p-3 flex flex-col items-center text-center relative overflow-hidden"
    style={{
      background: `linear-gradient(160deg, ${accentHex}33 0%, var(--color-premium-surface) 75%)`,
      border: `1.5px solid ${accentHex}88`,
      boxShadow: `0 3px 10px ${accentHex}22`,
    }}
  >
    <span className="text-[7.5px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-premium-text-secondary)' }}>
      {label}
    </span>
    <span
      className="font-bold text-[13px] mt-1 flex items-center gap-1"
      style={{ color: money ? accentHex : 'var(--color-premium-text)' }}
    >
      {money && <CoinIcon className="w-3 h-3" premium />}
      {value}
    </span>
  </div>
);
