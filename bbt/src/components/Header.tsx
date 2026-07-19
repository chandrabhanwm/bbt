import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, TrendingUp, Volume2, VolumeX, Award, ShieldAlert } from 'lucide-react';
import { PlayerStats } from '../types';
import { playClick, toggleMute, getMutedState } from '../utils/audio';
import { useCountUp } from '../utils/useCountUp';
import { formatCash } from '../utils/formatCash';
import { CoinIcon } from './CoinIcon';

interface HeaderProps {
  stats: PlayerStats;
  avatarEmoji: string;
  setAvatarEmoji: (emoji: string) => void;
  playerName: string;
  setPlayerName: (name: string) => void;
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

export const Header: React.FC<HeaderProps> = ({
  stats,
  avatarEmoji,
  setAvatarEmoji,
  playerName,
  setPlayerName
}) => {
  const [isMuted, setIsMuted] = useState(getMutedState());
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState(playerName);
  const [flashWallet, setFlashWallet] = useState(false);
  const prevCashRef = useRef(stats.cash);

  const displayCash = useCountUp(stats.cash);
  const xpPct = Math.min(100, Math.round((stats.xp / Math.max(1, stats.nextLevelXp)) * 100));

  // Brief pop whenever cash jumps by a meaningful (non-tick) amount — the
  // signature feedback tying every purchase/reward together.
  useEffect(() => {
    const delta = stats.cash - prevCashRef.current;
    if (delta > 50) {
      setFlashWallet(true);
      const t = setTimeout(() => setFlashWallet(false), 500);
      prevCashRef.current = stats.cash;
      return () => clearTimeout(t);
    }
    prevCashRef.current = stats.cash;
  }, [stats.cash]);

  const handleMuteToggle = () => {
    const muted = toggleMute();
    setIsMuted(muted);
    playClick();
  };

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
      className="sticky top-0 z-40 w-full px-3 pb-2.5 bg-gradient-to-b from-[var(--color-parchment-50)] to-[var(--color-parchment-100)] border-b-[3px] border-[var(--color-ink-900)] select-none"
      style={{ paddingTop: 'calc(0.75rem + env(safe-area-inset-top, 0px))' }}
    >

      <div className="flex items-center gap-2">
        {/* Avatar with level ring — tap to change persona */}
        <button
          onClick={() => { playClick(); setShowAvatarPicker(true); }}
          className="flex-shrink-0 relative w-11 h-11 cursor-pointer group"
          title="Change avatar"
        >
          <svg viewBox="0 0 40 40" className="absolute inset-0 w-full h-full -rotate-90">
            <circle cx="20" cy="20" r="17" fill="none" stroke="var(--color-parchment-300)" strokeWidth="3.5" />
            <circle
              cx="20" cy="20" r="17" fill="none"
              stroke="var(--color-marigold-500)" strokeWidth="3.5" strokeLinecap="round"
              strokeDasharray={`${xpPct * 1.068} 106.8`}
              style={{ transition: 'stroke-dasharray 0.4s ease-out' }}
            />
          </svg>
          <div className="absolute inset-[4px] rounded-full bg-[var(--color-marigold-400)] border-2 border-[var(--color-ink-900)] flex items-center justify-center shadow-sm group-active:scale-90 transition-transform">
            <span className="text-lg leading-none">{avatarEmoji}</span>
          </div>
        </button>

        <div className="flex-shrink-0 min-w-0 w-[72px]">
          {editingName ? (
            <input
              type="text"
              value={tempName}
              maxLength={10}
              onChange={(e) => setTempName(e.target.value)}
              className="bg-white border-2 border-[var(--color-marigold-500)] rounded px-1 py-0.5 text-[9px] font-bold text-[var(--color-ink-900)] outline-none w-16"
              onBlur={handleSaveName}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
              autoFocus
            />
          ) : (
            <div
              onClick={() => { playClick(); setEditingName(true); }}
              className="flex flex-col cursor-pointer group"
            >
              <span className="font-display font-bold text-[10px] text-[var(--color-ink-900)] tracking-tight truncate uppercase">
                {playerName}
              </span>
              <span className="text-[8px] text-[var(--color-marigold-600)] font-bold leading-none mt-0.5">
                Lvl {stats.level} · {xpPct}%
              </span>
            </div>
          )}
        </div>

        {/* CASH — the hero number, thick outlined "toy" treatment */}
        <div className="flex-1 min-w-0 flex items-center justify-center gap-1.5 bg-white rounded-2xl border-[2.5px] border-[var(--color-ink-900)] px-3 py-1.5 shadow-[0_3px_0_var(--color-ink-900)]">
          <CoinIcon className="w-5 h-5 flex-shrink-0" />
          <motion.span
            className="font-display font-bold text-[17px] tracking-tight whitespace-nowrap text-toy-sm"
            style={{ color: 'var(--color-money-500)' }}
            animate={flashWallet ? { scale: [1, 1.12, 1] } : {}}
            transition={{ duration: 0.3 }}
          >
            {formatCash(displayCash)}
          </motion.span>
        </div>

        {/* Rank badge */}
        <div className="flex-shrink-0 flex items-center gap-1 bg-white rounded-xl border-2 border-[var(--color-ink-900)] px-2 py-1.5">
          <Trophy size={12} className="text-[var(--color-marigold-500)]" />
          <span className="text-[10px] font-display font-bold text-[var(--color-ink-900)]">#{stats.rank.toLocaleString('en-IN')}</span>
        </div>

        {/* Mute toggle */}
        <button
          onClick={handleMuteToggle}
          className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-full bg-white border-2 border-[var(--color-ink-900)] cursor-pointer"
          title={isMuted ? "Unmute sounds" : "Mute sounds"}
        >
          {isMuted ? <VolumeX size={12} className="text-[var(--color-rose-500)]" /> : <Volume2 size={12} className="text-[var(--color-money-500)]" />}
        </button>
      </div>

      {/* Profit/min sits below as a small secondary readout, not competing with cash */}
      <div className="flex items-center gap-1 mt-1.5 ml-1">
        <TrendingUp size={11} className="text-[var(--color-money-500)]" />
        <span className="text-[10px] font-bold text-[var(--color-ink-700)]/70">
          ₹{Math.round(stats.profitPerMin).toLocaleString('en-IN')}<span className="opacity-60"> /min</span>
        </span>
      </div>

      {/* AVATAR SELECTOR MODAL / BOTTOM SHEET OVERLAY */}
      <AnimatePresence>
        {showAvatarPicker && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#2E1B0C]/50 backdrop-blur-xs p-4">
            <div className="absolute inset-0" onClick={() => { playClick(); setShowAvatarPicker(false); }}></div>

            <motion.div
              initial={{ y: 200, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 200, opacity: 0 }}
              className="relative w-full max-w-sm toy-card rounded-3xl p-5 z-10 overflow-hidden"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-display font-bold text-base text-[var(--color-ink-900)] flex items-center gap-2">
                  <Award className="text-[var(--color-marigold-500)]" size={18} />
                  Choose your persona
                </h3>
                <button
                  onClick={() => { playClick(); setShowAvatarPicker(false); }}
                  className="w-7 h-7 rounded-full bg-white border-2 border-[var(--color-ink-900)] text-[var(--color-ink-900)] flex items-center justify-center font-bold font-mono text-sm cursor-pointer"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-4 gap-3.5 py-2">
                {AVATAR_OPTIONS.map((opt) => (
                  <button
                    key={opt.emoji}
                    onClick={() => selectAvatar(opt.emoji)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-2xl bg-white border-2 transition-all hover:border-[var(--color-marigold-400)] cursor-pointer active:scale-95 ${avatarEmoji === opt.emoji ? 'border-[var(--color-marigold-500)] glow-marigold' : 'border-[var(--color-ink-700)]/20'}`}
                  >
                    <span className="text-3xl filter drop-shadow">{opt.emoji}</span>
                    <span className="text-[7px] text-[var(--color-ink-700)]/70 text-center font-bold mt-1.5 leading-none max-w-[65px] truncate">
                      {opt.label}
                    </span>
                  </button>
                ))}
              </div>

              <div className="mt-3 p-3 rounded-xl bg-white border-2 border-[var(--color-ink-700)]/20 flex items-center gap-2.5">
                <ShieldAlert size={15} className="text-[var(--color-marigold-500)] flex-shrink-0" />
                <span className="text-[10px] text-[var(--color-ink-700)]/70 leading-snug">
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
