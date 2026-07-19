import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Gift, Film, Flame, Clock, Star } from 'lucide-react';
import { playClick, playUnlock } from '../utils/audio';
import { Business } from '../types';

interface AreaCardProps {
  businesses: Business[];
  progress: number; // 0 to 100%
  cash: number;
  districtName: string;
  districtIncome: number;
  districtStars: number;
  onDoubleProfitToggle: (active: boolean) => void;
  activeDoubleProfit: boolean;
  doubleProfitTimeRemaining: number;
}

const BRANDS = [
  'Basti Cola Co. 🥤',
  'Chaiwala Crypto Coins 🪙',
  'Auto rickshaw Racing Pro 🛺',
  'Gully Cricket Manager 🏏',
  'Samosa Delivery Express 🥟'
];

/**
 * A single thin strip instead of two stacked cards — the street view is
 * the hero of the home screen now, so this chrome stays out of its way.
 * Left: watch-ad double-profit toggle. Right: area completion.
 */
export const AreaCard: React.FC<AreaCardProps> = ({
  businesses,
  progress,
  districtName,
  districtIncome,
  districtStars,
  onDoubleProfitToggle,
  activeDoubleProfit,
  doubleProfitTimeRemaining,
}) => {
  const [showAdModal, setShowAdModal] = useState(false);
  const [adCountdown, setAdCountdown] = useState(8);
  const [adBrand, setAdBrand] = useState('Basti Cola Co.');

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

  const handleStartAd = () => {
    playClick();
    setAdBrand(BRANDS[Math.floor(Math.random() * BRANDS.length)]);
    setAdCountdown(8);
    setShowAdModal(true);
  };

  const handleAdComplete = () => {
    setShowAdModal(false);
    onDoubleProfitToggle(true);
    playUnlock();
  };

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const builtCount = businesses ? businesses.filter((b) => b.level > 0).length : 0;

  return (
    <div id="area-card" className="w-full select-none">
      <div className="relative flex items-center gap-2 rounded-2xl toy-card px-3 py-2">
        {/* Ad boost toggle */}
        {activeDoubleProfit ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[var(--color-money-400)]/20 border-2 border-[var(--color-money-500)] text-[10px] font-display font-bold text-[var(--color-money-600)]">
            <Flame size={13} className="text-[var(--color-marigold-500)] fill-current" />
            <span>2X</span>
            <span className="opacity-70 flex items-center gap-0.5"><Clock size={9} />{formatTime(doubleProfitTimeRemaining)}</span>
          </div>
        ) : (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleStartAd}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-b from-[var(--color-marigold-300)] to-[var(--color-marigold-500)] border-2 border-[var(--color-ink-900)] text-[10px] font-display font-bold text-[var(--color-ink-900)] cursor-pointer shadow-[0_3px_0_var(--color-ink-900)] active:shadow-none active:translate-y-[3px] transition-all"
          >
            <Gift size={13} />
            <span>2X Ad</span>
          </motion.button>
        )}

        {/* Divider */}
        <div className="w-px h-6 bg-[var(--color-ink-700)]/20" />

        {/* Area progress, compact */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between text-[9px] font-bold text-[var(--color-ink-700)]/70 uppercase tracking-wide">
            <span>{districtName} · {builtCount}/8 shops</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full h-2 bg-white rounded-full border border-[var(--color-ink-700)]/25 mt-1 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-[var(--color-money-400)] to-[var(--color-money-600)] rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[8px] font-bold text-[var(--color-money-600)]">
              District Income: ₹{Math.round(districtIncome).toLocaleString('en-IN')}/min
            </span>
            <span className="flex items-center gap-[1px]">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={9}
                  className={i < districtStars ? 'text-[var(--color-marigold-500)] fill-current' : 'text-[var(--color-ink-700)]/20'}
                />
              ))}
            </span>
          </div>
        </div>
      </div>

      {/* Simulated video ad modal — unchanged behavior, still a full takeover */}
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
