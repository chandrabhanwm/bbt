import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Clock } from 'lucide-react';
import { playClick, playUnlock } from '../utils/audio';
import { Business } from '../types';

interface AreaCardProps {
  businesses: Business[];
  progress: number; // 0 to 100%
  cash: number;
  districtName: string;
  districtIncome: number;
  districtStars: number;
  /** Returns whether the claim actually succeeded (false if still on
   *  cooldown — shouldn't normally happen since the button disables
   *  itself, but the source of truth stays in App.tsx either way). */
  onClaimDailyBoost: () => boolean;
  /** null = never claimed yet, so the boost is immediately available. */
  lastDailyBoostClaimAt: number | null;
}

const BRANDS = [
  'Basti Cola Co. 🥤',
  'Chaiwala Crypto Coins 🪙',
  'Auto rickshaw Racing Pro 🛺',
  'Gully Cricket Manager 🏏',
  'Samosa Delivery Express 🥟'
];

const DAILY_BOOST_REWARD = 2000;
const DAILY_BOOST_COOLDOWN_MS = 24 * 60 * 60 * 1000;

/**
 * A single thin strip instead of two stacked cards — the street view is
 * the hero of the home screen now, so this chrome stays out of its way.
 * Left: Daily Income Boost (flat ₹2,000, once per 24 hours, watch-ad
 * gated). Right: area completion.
 */
export const AreaCard: React.FC<AreaCardProps> = ({
  businesses,
  progress,
  districtName,
  districtIncome,
  districtStars,
  onClaimDailyBoost,
  lastDailyBoostClaimAt,
}) => {
  const [showAdModal, setShowAdModal] = useState(false);
  const [adCountdown, setAdCountdown] = useState(8);
  const [adBrand, setAdBrand] = useState('Basti Cola Co.');
  const [justClaimed, setJustClaimed] = useState(false);
  // Recomputed periodically (not every second — this is a once-a-day
  // gate, it doesn't need per-second precision) so the "available in
  // Xh Ym" countdown stays roughly accurate without its own fast timer.
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (showAdModal) {
      interval = setInterval(() => {
        setAdCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            handleAdComplete();
            return 8;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showAdModal]);

  const msRemaining = lastDailyBoostClaimAt != null
    ? Math.max(0, (lastDailyBoostClaimAt + DAILY_BOOST_COOLDOWN_MS) - now)
    : 0;
  const onCooldown = msRemaining > 0;

  const handleStartAd = () => {
    if (onCooldown) return;
    playClick();
    setAdBrand(BRANDS[Math.floor(Math.random() * BRANDS.length)]);
    setAdCountdown(8);
    setShowAdModal(true);
  };

  const handleAdComplete = () => {
    setShowAdModal(false);
    const succeeded = onClaimDailyBoost();
    if (succeeded) {
      playUnlock();
      setJustClaimed(true);
      setTimeout(() => setJustClaimed(false), 2500);
    }
  };

const GOLD = 'var(--color-premium-gold-400)';
const GREEN = 'var(--color-premium-green-500)';
const TEXT_SECONDARY = 'var(--color-premium-text-secondary)';

  const builtCount = businesses ? businesses.filter((b) => b.level > 0).length : 0;

  const formatRemaining = (ms: number) => {
    const totalMinutes = Math.ceil(ms / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  return (
    <div id="area-card" className="w-full select-none">
      <div
        className="glossy-3d relative flex items-center gap-3 rounded-2xl px-3 py-2.5"
      >
        {/* Left: Daily Income Boost — available, on cooldown, or just claimed */}
        {justClaimed ? (
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--color-premium-green-500)' }}>
              <Zap size={16} color="var(--color-premium-text-inverse)" fill="var(--color-premium-text-inverse)" />
            </div>
            <div>
              <div className="text-[12px] font-bold whitespace-nowrap" style={{ color: 'var(--color-premium-green-500)' }}>+₹{DAILY_BOOST_REWARD.toLocaleString('en-IN')} Collected!</div>
              <div className="text-[10px] font-medium" style={{ color: TEXT_SECONDARY }}>Come back tomorrow</div>
            </div>
          </div>
        ) : (
          <motion.button
            whileTap={onCooldown ? undefined : { scale: 0.95 }}
            onClick={handleStartAd}
            disabled={onCooldown}
            className="flex items-center gap-2 flex-shrink-0"
            style={{ cursor: onCooldown ? 'default' : 'pointer', opacity: onCooldown ? 0.6 : 1 }}
          >
            <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: GOLD }}>
              <Zap size={16} color="var(--color-premium-text-inverse)" fill="var(--color-premium-text-inverse)" />
            </div>
            <div className="text-left">
              <div className="text-[12px] font-bold text-white whitespace-nowrap">Daily Income Boost</div>
              <div className="text-[10px] font-medium" style={{ color: TEXT_SECONDARY }}>
                {onCooldown ? `Available in ${formatRemaining(msRemaining)}` : `Watch ad for +₹${DAILY_BOOST_REWARD.toLocaleString('en-IN')}`}
              </div>
            </div>
          </motion.button>
        )}

        {/* Middle: district shop progress */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wide" style={{ color: 'var(--color-premium-text-secondary)' }}>
            <span>{districtName} · {builtCount}/8 SHOPS</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full h-[5px] rounded-full mt-1 overflow-hidden" style={{ backgroundColor: 'var(--color-premium-track)' }}>
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: GOLD }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
          <div className="text-[9px] font-semibold mt-1" style={{ color: GREEN }}>
            District Income: ₹{Math.round(districtIncome).toLocaleString('en-IN')}/min
          </div>
        </div>
      </div>

      {/* Simulated video ad modal — same mechanic as before, now rewards
          the flat Daily Boost instead of a temporary income multiplier */}
      <AnimatePresence>
        {showAdModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 select-none">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-sm bg-slate-900 border-2 border-slate-700 rounded-3xl overflow-hidden aspect-[9/16] shadow-2xl flex flex-col justify-between"
            >
              <div className="p-4 bg-gradient-to-b from-black/80 to-transparent flex justify-between items-center relative z-10">
                <div className="flex items-center gap-1.5">
                  <div className="px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 text-[9px] font-bold tracking-wide uppercase">
                    Sponsored
                  </div>
                  <span className="text-[10px] text-slate-300 font-bold">{adBrand}</span>
                </div>
                <div className="px-2.5 py-1 rounded-full bg-black/60 border border-slate-800 text-[10px] font-mono font-bold text-amber-400 flex items-center gap-1">
                  <Clock size={11} className="animate-spin" />
                  <span>Reward in {adCountdown}s</span>
                </div>
              </div>

              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-950">
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-white/5 to-transparent bg-[size:100%_4px] opacity-10"></div>
                <motion.div
                  animate={{ scale: [1, 1.12, 1], rotate: [0, 5, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                  className="w-28 h-28 rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-indigo-600 p-0.5 flex items-center justify-center shadow-2xl mb-6"
                >
                  <div className="w-full h-full bg-slate-900 rounded-full flex flex-col items-center justify-center">
                    <span className="text-4xl filter drop-shadow">⚡️</span>
                  </div>
                </motion.div>
                <h2 className="font-display font-bold text-lg text-white leading-tight uppercase tracking-wide">
                  Become the Basti Kingpin!
                </h2>
                <p className="text-xs text-slate-400 mt-2.5 max-w-[240px] leading-relaxed font-medium">
                  Boost your progress! Build stores, leverage upgrades, and outperform rivals.
                </p>
                <div className="w-48 h-1.5 bg-slate-800 rounded-full mt-6 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-amber-400 to-yellow-300 rounded-full"
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 8, ease: 'linear' }}
                  />
                </div>
              </div>

              <div className="p-4 bg-gradient-to-t from-black/80 to-transparent text-center relative z-10">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                  Thank you for supporting Basti Business Tycoon!
                </span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
