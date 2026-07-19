import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Star, ArrowRight, X, CheckCircle2, Eye } from 'lucide-react';
import { District } from '../../data/cityMapData';
import { DistrictProgressSummary, getDistrictPotentialIncome } from '../../utils/districtProgress';
import { Business } from '../../types';
import { CoinIcon } from '../CoinIcon';
import { progressionConfig } from '../../config/progressionConfig';
import { playClick } from '../../utils/audio';
import { DISTRICT_ICONS } from './DistrictNode';

interface DistrictDetailSheetProps {
  district: District | null;
  unlocked: boolean;
  progress: DistrictProgressSummary;
  /** The district's businesses — used only to compute potential income for
   *  the locked-district preview. Same Business[] already used everywhere
   *  else; nothing separate is created for preview purposes. */
  businesses: Business[];
  onEnter: (district: District) => void;
  /** Locked districts get this instead of "Enter District" — opens the
   *  read-only preview on the same Home/District screen used for real play. */
  onPreview: (district: District) => void;
  onClose: () => void;
}

type DistrictStatus = 'completed' | 'in_progress' | 'locked';

/**
 * Bottom sheet shown when any City Map node is tapped — locked or
 * unlocked. Mirrors ShopDetailSheet's visual language (same toy-card
 * sheet, same slide-up) rather than inventing a new pattern. The map
 * node itself is untouched; this is purely an overlay on top of it.
 */
export const DistrictDetailSheet: React.FC<DistrictDetailSheetProps> = ({ district, unlocked, progress, businesses, onEnter, onPreview, onClose }) => {
  if (!district) return null;

  const status: DistrictStatus = progress.completed ? 'completed' : unlocked ? 'in_progress' : 'locked';
  const statusLabel: Record<DistrictStatus, string> = {
    completed: 'Completed',
    in_progress: 'In Progress',
    locked: 'Locked',
  };
  const statusColor: Record<DistrictStatus, string> = {
    completed: 'text-[var(--color-money-600)] bg-[var(--color-money-500)]/15 border-[var(--color-money-500)]',
    in_progress: 'text-[var(--color-marigold-600)] bg-[var(--color-marigold-400)]/15 border-[var(--color-marigold-500)]',
    locked: 'text-[var(--color-ink-700)]/70 bg-white border-[var(--color-ink-700)]/25',
  };

  const HeroIcon = DISTRICT_ICONS[district.icon];
  const potentialIncome = getDistrictPotentialIncome(businesses);

  return (
    <AnimatePresence>
      {district && (
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
            className="relative w-full rounded-t-[28px] bg-gradient-to-b from-[var(--color-parchment-50)] to-[var(--color-parchment-100)] border-t-[3px] border-x-[3px] border-[var(--color-ink-900)] p-5 pb-7 max-h-[85vh] overflow-y-auto no-scrollbar"
          >
            <div className="w-10 h-1.5 rounded-full bg-[var(--color-ink-700)]/30 mx-auto mb-4" />

            <button
              onClick={() => { playClick(); onClose(); }}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white border-2 border-[var(--color-ink-900)] flex items-center justify-center cursor-pointer active:scale-90 transition-transform"
              aria-label="Close"
            >
              <X size={16} className="text-[var(--color-ink-900)]" strokeWidth={3} />
            </button>

            {/* "District Image" — a hero badge using the district's own icon/color,
                consistent with the rest of the app's vector-only visual language
                rather than a new bitmap asset pipeline. */}
            <div className="flex justify-center mb-3">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center border-[3px] border-[var(--color-ink-900)] ${status === 'locked' ? 'bg-[#E4DFD3] grayscale' : 'bg-gradient-to-br from-[var(--color-marigold-300)] to-[var(--color-marigold-500)]'}`}>
                <HeroIcon size={28} strokeWidth={2.2} className="text-[var(--color-ink-900)]" />
              </div>
            </div>

            <div className="flex items-center justify-between pr-10">
              <h3 className="font-display font-bold text-base text-[var(--color-ink-900)]">
                {district.emoji} {district.name}
              </h3>
              <span className="flex items-center gap-[1px]">
                {Array.from({ length: progressionConfig.maxStars }).map((_, i) => (
                  <Star
                    key={i}
                    size={13}
                    className={i < progress.stars ? 'text-[var(--color-marigold-500)] fill-current' : 'text-[var(--color-ink-700)]/20'}
                  />
                ))}
              </span>
            </div>

            <p className="text-[10.5px] text-[var(--color-ink-700)]/70 leading-snug mt-1">
              {district.description}
            </p>

            <span className={`inline-flex items-center gap-1 mt-2.5 px-2.5 py-1 rounded-full border-2 text-[9px] font-display font-bold uppercase tracking-wide ${statusColor[status]}`}>
              {status === 'completed' && <CheckCircle2 size={11} />}
              {status === 'locked' && <Lock size={10} />}
              {statusLabel[status]}
            </span>

            {unlocked ? (
              <div className="grid grid-cols-2 gap-2 mt-3.5">
                <div className="rounded-xl bg-white border-2 border-[var(--color-ink-700)]/15 px-3 py-2">
                  <span className="text-[8px] font-bold text-[var(--color-ink-700)]/60 uppercase">Income</span>
                  <div className="flex items-center gap-1 font-display font-bold text-[13px] text-[var(--color-money-600)]">
                    <CoinIcon className="w-3.5 h-3.5" />
                    {Math.round(progress.income).toLocaleString('en-IN')}/min
                  </div>
                </div>
                <div className="rounded-xl bg-white border-2 border-[var(--color-ink-700)]/15 px-3 py-2">
                  <span className="text-[8px] font-bold text-[var(--color-ink-700)]/60 uppercase">Businesses</span>
                  <div className="font-display font-bold text-[13px] text-[var(--color-ink-900)]">
                    {progress.businessesOwned} / {progress.businessesTotal}
                  </div>
                </div>
                <div className="rounded-xl bg-white border-2 border-[var(--color-ink-700)]/15 px-3 py-2">
                  <span className="text-[8px] font-bold text-[var(--color-ink-700)]/60 uppercase">Completion</span>
                  <div className="font-display font-bold text-[13px] text-[var(--color-ink-900)]">
                    {progress.completionPercent}%
                  </div>
                </div>
                <div className="rounded-xl bg-white border-2 border-[var(--color-ink-700)]/15 px-3 py-2">
                  <span className="text-[8px] font-bold text-[var(--color-ink-700)]/60 uppercase">District Level</span>
                  <div className="font-display font-bold text-[13px] text-[var(--color-ink-900)]">
                    {progress.districtLevel}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 mt-3.5">
                <div className="rounded-xl bg-white border-2 border-[var(--color-ink-700)]/15 px-3 py-2">
                  <span className="text-[8px] font-bold text-[var(--color-ink-700)]/60 uppercase">Potential Income</span>
                  <div className="flex items-center gap-1 font-display font-bold text-[13px] text-[var(--color-money-600)]">
                    <CoinIcon className="w-3.5 h-3.5" />
                    {Math.round(potentialIncome).toLocaleString('en-IN')}/min
                  </div>
                </div>
                <div className="rounded-xl bg-white border-2 border-[var(--color-ink-700)]/15 px-3 py-2">
                  <span className="text-[8px] font-bold text-[var(--color-ink-700)]/60 uppercase">Businesses</span>
                  <div className="font-display font-bold text-[13px] text-[var(--color-ink-900)]">
                    {progress.businessesTotal}
                  </div>
                </div>
              </div>
            )}

            {!unlocked && district.unlockRequirement && (
              <div className="mt-3 p-3 rounded-xl bg-white border-2 border-[var(--color-ink-700)]/20 flex items-center gap-2.5">
                <Lock size={15} className="text-[var(--color-ink-700)]/60 flex-shrink-0" />
                <span className="text-[10px] text-[var(--color-ink-700)]/70 leading-snug">
                  Unlock requirement: <span className="font-bold text-[var(--color-ink-900)]">{district.unlockRequirement.label}</span>
                </span>
              </div>
            )}

            {unlocked ? (
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => { playClick(); onEnter(district); }}
                className="w-full mt-4 py-3.5 rounded-2xl font-display font-bold text-sm uppercase tracking-wide flex items-center justify-center gap-2 border-[2.5px] border-[var(--color-ink-900)] bg-gradient-to-b from-[var(--color-marigold-300)] to-[var(--color-marigold-500)] text-[var(--color-ink-900)] shadow-[0_4px_0_var(--color-ink-900)] active:shadow-none active:translate-y-1 transition-all"
              >
                Enter District <ArrowRight size={16} />
              </motion.button>
            ) : (
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => { playClick(); onPreview(district); }}
                className="w-full mt-4 py-3.5 rounded-2xl font-display font-bold text-sm uppercase tracking-wide flex items-center justify-center gap-2 border-[2.5px] border-[var(--color-ink-900)] bg-white text-[var(--color-ink-900)] shadow-[0_4px_0_var(--color-ink-900)] active:shadow-none active:translate-y-1 transition-all"
              >
                <Eye size={16} /> Preview Businesses
              </motion.button>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
