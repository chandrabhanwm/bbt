import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, PanInfo } from 'motion/react';
import { Clock, Gift } from 'lucide-react';
import { RewardCard } from '../types';
import { formatCash } from '../utils/formatCash';
import { CoinIcon } from './CoinIcon';
import { playClick, playUnlock } from '../utils/audio';

interface DailyRewardCardsProps {
  cards: RewardCard[];
  lastCardsResetAt: number;
  onScratch: (index: number) => void;
  onClaim: (index: number) => void;
}

const CARD_RESET_MS = 24 * 60 * 60 * 1000;
const SWIPE_THRESHOLD = 40; // px of drag distance before we treat it as a scratch

const BRANDS = [
  'Basti Cola Co. 🥤',
  'Chaiwala Crypto Coins 🪙',
  'Auto rickshaw Racing Pro 🛺',
  'Gully Cricket Manager 🏏',
  'Samosa Delivery Express 🥟'
];

const GOLD = 'var(--color-premium-gold-400)';
const GREEN = 'var(--color-premium-green-500)';
const TEXT_SECONDARY = 'var(--color-premium-text-secondary)';

/**
 * Three independent Daily Reward Cards, replacing the old flat Daily
 * Income Boost strip. Swipe (a real drag gesture, not a tap) to scratch —
 * free, instant, no ad — which reveals the value already generated at
 * the last reset. Claiming that value is what's ad-gated, per card,
 * whenever the player wants, in any order. One shared countdown for the
 * whole row; unclaimed value simply expires at reset, same rule as the
 * claim pool's 3-hour cap.
 *
 * The reveal itself is a triggered animation (Option B from the design
 * discussion), not real pixel-level scratch tracking — deliberately, to
 * avoid taking on canvas + real-time pointer-path complexity this app has
 * no other precedent for, for a difference players won't perceive.
 */
export const DailyRewardCards: React.FC<DailyRewardCardsProps> = ({ cards, lastCardsResetAt, onScratch, onClaim }) => {
  const [now, setNow] = useState(() => Date.now());
  const [adCardIndex, setAdCardIndex] = useState<number | null>(null);
  const [adCountdown, setAdCountdown] = useState(6);
  const [adBrand, setAdBrand] = useState('Basti Cola Co.');

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (adCardIndex !== null) {
      interval = setInterval(() => {
        setAdCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            const idx = adCardIndex;
            setAdCardIndex(null);
            if (idx !== null) {
              playUnlock();
              onClaim(idx);
            }
            return 6;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [adCardIndex]);

  const msRemaining = Math.max(0, (lastCardsResetAt + CARD_RESET_MS) - now);
  const totalMinutes = Math.ceil(msRemaining / 60000);
  const hoursLeft = Math.floor(totalMinutes / 60);
  const minsLeft = totalMinutes % 60;

  const handleSwipe = (index: number, info: PanInfo) => {
    if (cards[index].scratched) return;
    const distance = Math.abs(info.offset.x) + Math.abs(info.offset.y);
    if (distance >= SWIPE_THRESHOLD) {
      playClick();
      onScratch(index);
    }
  };

  const handleWatchAd = (index: number) => {
    playClick();
    setAdBrand(BRANDS[Math.floor(Math.random() * BRANDS.length)]);
    setAdCountdown(6);
    setAdCardIndex(index);
  };

  return (
    <div className="w-full select-none">
      <div className="flex items-center justify-between px-1 mb-2">
        <div className="flex items-center gap-1.5">
          <Gift size={13} color={GOLD} />
          <span className="text-[11px] font-bold" style={{ color: 'var(--color-premium-text)' }}>Your Daily Reward Cards</span>
        </div>
        <span className="text-[9px] font-semibold" style={{ color: TEXT_SECONDARY }}>
          resets in {hoursLeft}h {minsLeft}m
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {cards.map((card, index) => (
          <div key={index} className="glossy-3d rounded-2xl overflow-hidden relative" style={{ minHeight: '108px' }}>
            <AnimatePresence mode="wait">
              {!card.scratched ? (
                <motion.div
                  key="unscratched"
                  drag
                  dragElastic={0.25}
                  dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                  onDragEnd={(_, info) => handleSwipe(index, info)}
                  whileTap={{ scale: 0.97 }}
                  className="absolute inset-0 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing"
                  style={{
                    background: 'repeating-linear-gradient(45deg, var(--color-premium-elevated), var(--color-premium-elevated) 8px, var(--color-premium-track) 8px, var(--color-premium-track) 16px)',
                  }}
                >
                  <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: TEXT_SECONDARY }}>
                    Swipe to
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-widest mt-0.5" style={{ color: TEXT_SECONDARY }}>
                    Scratch
                  </span>
                </motion.div>
              ) : (
                <motion.div
                  key="revealed"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0 flex flex-col items-center justify-center p-2 gap-1.5"
                >
                  <CoinIcon className="w-6 h-6" premium />
                  <span className="font-bold text-[13px]" style={{ color: GREEN }}>
                    {formatCash(card.value)}
                  </span>

                  {card.claimed ? (
                    <span className="text-[8.5px] font-bold uppercase tracking-wide" style={{ color: TEXT_SECONDARY }}>
                      ✓ Claimed
                    </span>
                  ) : (
                    <button
                      onClick={() => handleWatchAd(index)}
                      className="px-2 py-1.5 rounded-lg text-[8.5px] font-bold cursor-pointer"
                      style={{ backgroundColor: GOLD, color: 'var(--color-premium-text-inverse)' }}
                    >
                      Watch ad to collect
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* Simulated video ad — same mechanic reused across the app */}
      <AnimatePresence>
        {adCardIndex !== null && (
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
                <motion.div
                  animate={{ scale: [1, 1.12, 1], rotate: [0, 5, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                  className="w-28 h-28 rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-indigo-600 p-0.5 flex items-center justify-center shadow-2xl mb-6"
                >
                  <div className="w-full h-full bg-slate-900 rounded-full flex flex-col items-center justify-center">
                    <span className="text-4xl filter drop-shadow">🎁</span>
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
                    transition={{ duration: 6, ease: 'linear' }}
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
