import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, TrendingUp, Award, ShieldAlert, Crown, Banknote } from 'lucide-react';
import { PlayerStats } from '../types';
import { playClick } from '../utils/audio';
import { useCountUp } from '../utils/useCountUp';
import { formatCash } from '../utils/formatCash';
import { CoinIcon } from './CoinIcon';

// Same props contract as before — App.tsx's call site needs no changes.
interface HeaderProps {
  stats: PlayerStats;
  avatarEmoji: string;
  setAvatarEmoji: (emoji: string) => void;
  playerName: string;
  setPlayerName: (name: string) => void;
  /** Bumped by App.tsx on every discrete cash-changing action (a
   *  purchase, a claim, a reward) — never by the continuous per-second
   *  passive tick, which would mean pulsing constantly. */
  cashPulseKey?: number;
}

const AVATAR_OPTIONS = [
  { emoji: '😎', label: 'Basti Bazar Boss' },
  { emoji: '👳', label: 'Dhaba Sethji' },
  { emoji: '👩', label: 'Saree Queen' },
  { emoji: '☕', label: 'Chaiwala Chotu' },
  { emoji: '🍬', label: 'Halwai Bhai' },
  { emoji: '📱', label: 'Mobile Bazar Guru' },
  { emoji: '💍', label: 'Sona Seth' },
  { emoji: '🦁', label: 'Mandal President' }
];

// Colors consumed exclusively from the premium design system —
// var(--color-premium-*), no hardcoded hex anywhere in this component.
const GOLD = 'var(--color-premium-gold-400)';
const GOLD_BRIGHT = 'var(--color-premium-gold-100)';
const GOLD_BORDER = 'var(--color-premium-border-strong)';
const GREEN = 'var(--color-premium-green-500)';
const TEXT_SECONDARY = 'var(--color-premium-text-secondary)';

export const Header: React.FC<HeaderProps> = ({
  stats,
  avatarEmoji,
  setAvatarEmoji,
  playerName,
  setPlayerName,
  cashPulseKey
}) => {
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [editingName, setEditingName] = useState(false);
  // Cash Pill pulse — a brief, one-shot glow whenever cashPulseKey changes
  // (a discrete action), never on the continuous per-second passive tick.
  const [cashPulsing, setCashPulsing] = useState(false);
  const isFirstPulseRender = useRef(true);
  useEffect(() => {
    if (isFirstPulseRender.current) {
      isFirstPulseRender.current = false;
      return;
    }
    setCashPulsing(true);
    const t = setTimeout(() => setCashPulsing(false), 200);
    return () => clearTimeout(t);
  }, [cashPulseKey]);
  const [tempName, setTempName] = useState(playerName);
  const prevCashRef = useRef(stats.cash);

  const displayCash = useCountUp(stats.cash);
  const xpPct = Math.min(100, Math.round((stats.xp / Math.max(1, stats.nextLevelXp)) * 100));

  useEffect(() => {
    prevCashRef.current = stats.cash;
  }, [stats.cash]);

  const selectAvatar = (emoji: string) => {
    setAvatarEmoji(emoji);
    playClick();
    setShowAvatarPicker(false);
  };

  const handleSaveName = () => {
    if (tempName.trim()) {
      setPlayerName(tempName.trim());
    }
    setEditingName(false);
    playClick();
  };

  return (
    <header
      className="sticky top-0 z-40 w-full px-3 pb-3 select-none"
      style={{ backgroundColor: 'var(--color-premium-bg)', paddingTop: 'calc(12px + env(safe-area-inset-top, 0px))' }}
    >
      <div className="flex flex-nowrap items-stretch gap-1.5">
        {/* ============ Identity block ============ */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <button
            onClick={() => { playClick(); setShowAvatarPicker(true); }}
            className="flex-shrink-0 relative w-10 h-10 cursor-pointer before:content-[''] before:absolute before:-inset-1"
            title="Change avatar"
          >
            <div className="w-full h-full rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-premium-surface)', border: `1.5px solid ${GOLD_BORDER}` }}>
              <span className="text-lg leading-none">{avatarEmoji}</span>
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center" style={{ backgroundColor: GOLD }}>
              <Crown size={9} color="var(--color-premium-bg)" fill="var(--color-premium-bg)" />
            </div>
          </button>

          <div className="flex-1 min-w-0">
            {editingName ? (
              <input
                type="text"
                value={tempName}
                maxLength={12}
                onChange={(e) => setTempName(e.target.value)}
                className="bg-[var(--color-premium-surface)] border rounded px-1.5 py-0.5 text-[11px] font-bold text-white outline-none w-24"
                style={{ borderColor: GOLD }}
                onBlur={handleSaveName}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                autoFocus
              />
            ) : (
              <div onClick={() => { playClick(); setEditingName(true); }} className="cursor-pointer">
                <div className="flex items-center gap-1 min-w-0">
                  <span className="text-[11px] font-bold text-white uppercase tracking-wide truncate">
                    {playerName}
                  </span>
                  <Crown size={9} color={GOLD} fill={GOLD} className="flex-shrink-0" />
                </div>
                <div className="text-[9px] font-semibold mt-0.5 whitespace-nowrap" style={{ color: TEXT_SECONDARY }}>
                  Level {stats.level} · {xpPct}%
                </div>
                <div className="w-16 h-[3px] rounded-full mt-1 overflow-hidden" style={{ backgroundColor: 'var(--color-premium-track)' }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: GOLD }}
                    initial={false}
                    animate={{ width: `${xpPct}%` }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                  />
                </div>
                <div className="flex items-center gap-1 mt-1 whitespace-nowrap">
                  <TrendingUp size={10} color={GREEN} />
                  <span className="text-[10px] font-semibold whitespace-nowrap" style={{ color: GREEN }}>
                    ₹{Math.round(stats.profitPerMin).toLocaleString('en-IN')}<span style={{ color: TEXT_SECONDARY, fontWeight: 400 }}> /min</span>
                  </span>
                  {/* Rank, now living inline where the pool ticker used to
                      sit — the pool got promoted to its own bigger pill,
                      Rank moved here in its place. */}
                  <span className="text-[9px] font-semibold whitespace-nowrap ml-1 flex items-center gap-0.5" style={{ color: GOLD }}>
                    · <Trophy size={9} color={GOLD} /> #{stats.rank.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ============ Cash balance pill ============ */}
        <motion.div
          animate={{ scale: cashPulsing ? [1, 1.05, 1] : 1 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="glossy-3d flex-shrink-0 flex flex-col items-center justify-center rounded-xl px-1.5 py-1"
          style={{ boxShadow: cashPulsing ? '0 0 14px rgba(212, 167, 44, 0.5)' : undefined }}
        >
          <span className="text-[7px] font-bold whitespace-nowrap" style={{ color: GOLD }}>CASH BALANCE</span>
          <div className="flex items-center gap-1 mt-0.5">
            <Banknote size={12} color="var(--color-premium-green-500)" />
            <span className="text-[13px] font-bold whitespace-nowrap" style={{ color: GOLD_BRIGHT, fontVariantNumeric: 'tabular-nums' }}>
              {formatCash(displayCash)}
            </span>
          </div>
        </motion.div>

        {/* ============ Pool pill — takes the Rank pill's old spot, now
             bigger, since the pool is the thing meant to draw the eye on
             Home (claiming still only happens on Portfolio) ============ */}
        <div
          className="glossy-3d flex-shrink-0 flex flex-col items-center justify-center rounded-xl px-2 py-1.5"
        >
          <span className="text-[7px] font-bold tracking-wide whitespace-nowrap" style={{ color: GOLD }}>POOL</span>
          <div className="flex items-center gap-1 mt-0.5">
            <CoinIcon className="w-3 h-3" premium />
            <span className="text-[13px] font-bold whitespace-nowrap" style={{ color: 'var(--color-premium-green-500)', fontVariantNumeric: 'tabular-nums' }}>
              {formatCash(stats.poolCash)}
            </span>
          </div>
        </div>
      </div>

      {/* ============ AVATAR SELECTOR ============ */}
      <AnimatePresence>
        {showAvatarPicker && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="absolute inset-0" onClick={() => { playClick(); setShowAvatarPicker(false); }}></div>

            <motion.div
              initial={{ y: 200, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 200, opacity: 0 }}
              className="relative w-full max-w-sm rounded-2xl p-5 z-10 overflow-hidden"
              style={{ backgroundColor: 'var(--color-premium-surface)', border: `1.5px solid ${GOLD_BORDER}` }}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-[16px] font-bold text-white flex items-center gap-2">
                  <Award size={17} color={GOLD} />
                  Choose your persona
                </h3>
                <button
                  onClick={() => { playClick(); setShowAvatarPicker(false); }}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-sm cursor-pointer"
                  style={{ backgroundColor: 'var(--color-premium-elevated)', color: TEXT_SECONDARY }}
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-4 gap-3">
                {AVATAR_OPTIONS.map((opt) => (
                  <button
                    key={opt.emoji}
                    onClick={() => selectAvatar(opt.emoji)}
                    className="flex flex-col items-center justify-center py-2.5 rounded-xl cursor-pointer"
                    style={{
                      backgroundColor: 'var(--color-premium-elevated)',
                      border: `1.5px solid ${avatarEmoji === opt.emoji ? GOLD : 'var(--color-premium-border-subtle)'}`,
                    }}
                  >
                    <span className="text-2xl leading-none">{opt.emoji}</span>
                    <span className="text-[8px] text-center font-medium mt-1.5 leading-none max-w-[60px] truncate" style={{ color: TEXT_SECONDARY }}>
                      {opt.label}
                    </span>
                  </button>
                ))}
              </div>

              <div className="mt-3 p-3 rounded-xl flex items-center gap-2.5" style={{ backgroundColor: 'var(--color-premium-elevated)' }}>
                <ShieldAlert size={15} color={GOLD} className="flex-shrink-0" />
                <span className="text-[11px] leading-snug" style={{ color: TEXT_SECONDARY }}>
                  Your persona shows up on the Basti Rich List for every rival to see.
                </span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </header>
  );
};
