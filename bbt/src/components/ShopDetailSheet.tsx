import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, ShoppingCart, ArrowUpCircle, X } from 'lucide-react';
import { Business } from '../types';
import { playClick, playUpgrade, playUnlock, playError } from '../utils/audio';
import { MiniShopSVG } from './BusinessCard';
import { CoinIcon } from './CoinIcon';
import { CoinBurst } from './FX';

interface ShopDetailSheetProps {
  business: Business | null;
  index: number;
  cash: number;
  onUpgrade: (id: string) => void;
  onClose: () => void;
  /** Locked-district preview: shows the shop's info (name, icon, buy price,
   *  base income, description) but every action is disabled — no buy, no
   *  upgrade, no collect. onUpgrade is never called in this mode. */
  readOnly?: boolean;
}

/**
 * The core new interaction: tap a shop in the street, see its stats in a
 * sheet, tap Buy/Upgrade, watch it register, sheet closes. This replaces
 * the old duplicate business-card list — the street itself is now the
 * only place you manage your businesses, like Township or Idle Miner Tycoon.
 */
export const ShopDetailSheet: React.FC<ShopDetailSheetProps> = ({ business, index, cash, onUpgrade, onClose, readOnly = false }) => {
  const [showBurst, setShowBurst] = useState(false);
  const [justBought, setJustBought] = useState(false);

  if (!business) return null;

  // In preview mode every shop displays as not-yet-owned, regardless of
  // its real level (a district's first shop is pre-seeded at level 1 for
  // when it's actually unlocked — see StreetView's displayBusinesses note).
  const isLocked = readOnly ? true : business.level === 0;
  const isAffordable = readOnly ? false : cash >= business.cost;

  const handleAction = () => {
    if (readOnly) return; // preview mode: never buys, upgrades, or collects
    if (!isAffordable) {
      playError();
      return;
    }
    isLocked ? playUnlock() : playUpgrade();
    onUpgrade(business.id);
    setShowBurst(true);
    setJustBought(true);
    // Let the player see the coin burst + updated level for a beat, then
    // close the sheet automatically — "tap, see it happen, move on."
    setTimeout(() => {
      onClose();
      setShowBurst(false);
      setJustBought(false);
    }, 550);
  };

  return (
    <AnimatePresence>
      {business && (
        <div className="absolute inset-0 z-50 flex items-end justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#2E1B0C]/50"
            onClick={() => { playClick(); onClose(); }}
          />

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 340, damping: 32 }}
            className="relative w-full rounded-t-[28px] bg-gradient-to-b from-[var(--color-parchment-50)] to-[var(--color-parchment-100)] border-t-[3px] border-x-[3px] border-[var(--color-ink-900)] p-5 pb-7 shadow-[0_-8px_24px_rgba(46,27,12,0.3)]"
          >
            {/* Drag handle */}
            <div className="w-10 h-1.5 rounded-full bg-[var(--color-ink-700)]/30 mx-auto mb-4" />

            <button
              onClick={() => { playClick(); onClose(); }}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white border-2 border-[var(--color-ink-900)] flex items-center justify-center cursor-pointer active:scale-90 transition-transform"
              aria-label="Close"
            >
              <X size={16} className="text-[var(--color-ink-900)]" strokeWidth={3} />
            </button>

            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 flex-shrink-0 bg-white rounded-2xl border-[2.5px] border-[var(--color-ink-900)] flex items-center justify-center overflow-visible">
                {showBurst && <CoinBurst />}
                <div className={`w-16 h-16 ${isLocked ? 'opacity-35 grayscale' : ''}`}>
                  <MiniShopSVG business={business} index={index} />
                </div>
                <div className="absolute -top-2 -left-2 w-7 h-7 rounded-full bg-[var(--color-marigold-400)] border-2 border-[var(--color-ink-900)] flex items-center justify-center font-display font-bold text-xs text-[var(--color-ink-900)]">
                  {index + 1}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-display font-bold text-base text-[var(--color-ink-900)] leading-tight">
                  {business.name}
                </h3>
                <p className="text-[11px] text-[var(--color-ink-700)]/70 font-medium leading-snug mt-1">
                  {business.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-4">
              <div className={`flex-1 rounded-xl border-2 px-3 py-2 flex items-center justify-between ${isLocked ? 'bg-white border-[var(--color-ink-700)]/20' : 'bg-[var(--color-money-400)]/15 border-[var(--color-money-500)]'}`}>
                <span className="text-[10px] font-bold text-[var(--color-ink-700)]/70 uppercase">
                  {readOnly ? 'Buy Price' : isLocked ? 'Not opened yet' : `Level ${business.level}`}
                </span>
                <span className="flex items-center gap-1 font-display font-bold text-sm text-[var(--color-money-600)]">
                  <CoinIcon className="w-4 h-4" />
                  {readOnly
                    ? business.cost.toLocaleString('en-IN')
                    : (isLocked ? business.baseProfitPerMin : business.profitPerMin).toLocaleString('en-IN') + '/min'}
                </span>
              </div>
            </div>

            {readOnly && (
              <div className="flex items-center gap-3 mt-2">
                <div className="flex-1 rounded-xl border-2 bg-white border-[var(--color-ink-700)]/20 px-3 py-2 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[var(--color-ink-700)]/70 uppercase">Base Income</span>
                  <span className="flex items-center gap-1 font-display font-bold text-sm text-[var(--color-money-600)]">
                    <CoinIcon className="w-4 h-4" />
                    {business.baseProfitPerMin.toLocaleString('en-IN')}/min
                  </span>
                </div>
              </div>
            )}

            {readOnly && business.maxLevel !== undefined && (
              <div className="flex items-center gap-3 mt-2">
                <div className="flex-1 rounded-xl border-2 bg-white border-[var(--color-ink-700)]/20 px-3 py-2 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[var(--color-ink-700)]/70 uppercase">Max Potential Income</span>
                  <span className="flex items-center gap-1 font-display font-bold text-sm text-[var(--color-marigold-600)]">
                    <CoinIcon className="w-4 h-4" />
                    {(business.baseProfitPerMin * business.maxLevel).toLocaleString('en-IN')}/min
                  </span>
                </div>
              </div>
            )}

            {readOnly ? (
              <button
                disabled
                className="w-full mt-4 py-3.5 rounded-2xl font-display font-bold text-sm uppercase tracking-wide flex items-center justify-center gap-2 border-[2.5px] border-[var(--color-ink-700)]/25 bg-white text-[var(--color-ink-700)]/50 cursor-not-allowed"
              >
                <Lock size={16} /> Unlock this district first
              </button>
            ) : (
              <>
                <motion.button
                  whileTap={isAffordable ? { scale: 0.96 } : {}}
                  onClick={handleAction}
                  disabled={!isAffordable || justBought}
                  className={`w-full mt-4 py-3.5 rounded-2xl font-display font-bold text-sm uppercase tracking-wide flex items-center justify-center gap-2 border-[2.5px] transition-all ${
                    isAffordable
                      ? isLocked
                        ? 'bg-gradient-to-b from-[var(--color-marigold-300)] to-[var(--color-marigold-500)] border-[var(--color-ink-900)] text-[var(--color-ink-900)] shadow-[0_4px_0_var(--color-ink-900)] active:shadow-none active:translate-y-1'
                        : 'bg-gradient-to-b from-[var(--color-money-300)] to-[var(--color-money-500)] border-[var(--color-ink-900)] text-[var(--color-ink-900)] shadow-[0_4px_0_var(--color-ink-900)] active:shadow-none active:translate-y-1'
                      : 'bg-white border-[var(--color-ink-700)]/25 text-[var(--color-ink-700)]/40 cursor-not-allowed'
                  }`}
                >
                  {isLocked ? <ShoppingCart size={16} /> : <ArrowUpCircle size={16} />}
                  {isLocked ? 'Open shop' : 'Upgrade'} — ₹{business.cost.toLocaleString('en-IN')}
                </motion.button>

                {!isAffordable && (
                  <p className="text-center text-[10px] font-bold text-[var(--color-rose-500)] mt-2">
                    Need ₹{(business.cost - cash).toLocaleString('en-IN')} more
                  </p>
                )}
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
