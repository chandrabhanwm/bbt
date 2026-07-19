import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, TrendingUp, Settings, Volume2, VolumeX, Award, ShieldAlert, Fingerprint } from 'lucide-react';
import { PlayerStats } from '../types';
import { playClick, toggleMute, getMutedState } from '../utils/audio';
import { useCountUp } from '../utils/useCountUp';
import { formatCash } from '../utils/formatCash';

// Same props contract as before — App.tsx's call site needs no changes.
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

/**
 * A stable, display-only "Player ID" derived from the player's name.
 * Not persisted, not new state — recomputed on render from the existing
 * playerName prop, purely to fill the ID slot the dashboard layout calls
 * for without inventing any backend concept of player IDs.
 */
function derivePlayerId(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  const digits = 100000 + (hash % 900000);
  return `BST-${digits}`;
}

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
  const [incomePulse, setIncomePulse] = useState(false);
  const prevProfitRef = useRef(stats.profitPerMin);

  const displayCash = useCountUp(stats.cash);
  const xpPct = Math.min(100, Math.round((stats.xp / Math.max(1, stats.nextLevelXp)) * 100));
  const playerId = derivePlayerId(playerName);

  // A soft, brief pulse on the income row only — the cash card itself
  // just rolls smoothly (useCountUp) with no bounce. Kept restrained
  // (200ms, ease-out) per the "no flashy effects" rule.
  useEffect(() => {
    if (stats.profitPerMin > prevProfitRef.current) {
      setIncomePulse(true);
      const t = setTimeout(() => setIncomePulse(false), 200);
      prevProfitRef.current = stats.profitPerMin;
      return () => clearTimeout(t);
    }
    prevProfitRef.current = stats.profitPerMin;
  }, [stats.profitPerMin]);

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
      className="sticky top-0 z-40 w-full px-5 pb-5 bg-[var(--color-premium-bg)] border-b border-[var(--color-premium-border-subtle)] select-none"
      style={{ paddingTop: 'calc(16px + env(safe-area-inset-top, 0px))' }}
    >
      {/* ============ ROW 1 — Profile ============ */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => { playClick(); setShowAvatarPicker(true); }}
          className="flex-shrink-0 relative w-12 h-12 cursor-pointer"
          title="Change avatar"
        >
          <div className="absolute inset-0 rounded-full p-[1.5px]" style={{ background: 'linear-gradient(135deg, var(--color-premium-gold-400), var(--color-premium-gold-600))' }}>
            <div className="w-full h-full rounded-full bg-[var(--color-premium-bg)]" />
          </div>
          <div className="absolute inset-[3px] rounded-full bg-[var(--color-premium-surface)] border border-[var(--color-premium-border)] flex items-center justify-center overflow-hidden">
            <span className="text-xl leading-none">{avatarEmoji}</span>
          </div>
        </button>

        <div className="flex-1 min-w-0">
          {editingName ? (
            <input
              type="text"
              value={tempName}
              maxLength={14}
              onChange={(e) => setTempName(e.target.value)}
              className="bg-[var(--color-premium-surface)] border border-[var(--color-premium-gold-400)] rounded-md px-2 py-1 text-[15px] font-semibold text-[var(--color-premium-text)] outline-none w-40"
              onBlur={handleSaveName}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
              autoFocus
            />
          ) : (
            <div onClick={() => { playClick(); setEditingName(true); }} className="cursor-pointer">
              <div className="flex items-center gap-2">
                <span className="text-[18px] font-semibold text-[var(--color-premium-text)] tracking-tight truncate max-w-[140px]">
                  {playerName}
                </span>
                <span className="flex-shrink-0 px-2 py-[1px] rounded-full text-[10px] font-bold tracking-wide bg-[var(--color-premium-gold-400)]/12 text-[var(--color-premium-gold-400)] border border-[var(--color-premium-gold-400)]/30">
                  LVL {stats.level}
                </span>
              </div>
              {/* XP bar — thin, 4px, animated width */}
              <div className="w-32 h-1 rounded-full bg-[var(--color-premium-border)] mt-1.5 overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg, var(--color-premium-gold-600), var(--color-premium-gold-400))' }}
                  initial={false}
                  animate={{ width: `${xpPct}%` }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                />
              </div>
            </div>
          )}
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          onClick={() => { /* settings screen not built yet — placeholder, no navigation added */ playClick(); }}
          className="flex-shrink-0 w-10 h-10 rounded-full bg-[var(--color-premium-surface)] border border-[var(--color-premium-border)] flex items-center justify-center cursor-pointer"
          title="Settings"
        >
          <Settings size={17} className="text-[var(--color-premium-text-secondary)]" />
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          onClick={handleMuteToggle}
          className="flex-shrink-0 w-10 h-10 rounded-full bg-[var(--color-premium-surface)] border border-[var(--color-premium-border)] flex items-center justify-center cursor-pointer"
          title={isMuted ? 'Unmute sounds' : 'Mute sounds'}
        >
          {isMuted
            ? <VolumeX size={17} className="text-[var(--color-premium-red-400)]" />
            : <Volume2 size={17} className="text-[var(--color-premium-text-secondary)]" />}
        </motion.button>
      </div>

      {/* ============ ROW 2 — Cash balance (hero) ============ */}
      <div className="mt-5 rounded-2xl bg-[var(--color-premium-surface)] border border-[var(--color-premium-border)] shadow-premium-card px-5 py-4">
        <span className="text-[12px] font-medium tracking-[0.08em] text-[var(--color-premium-text-secondary)] uppercase">
          Cash Balance
        </span>
        <div
          className="text-[36px] font-bold tracking-tight mt-1 leading-none"
          style={{
            color: 'var(--color-premium-green-500)',
            fontVariantNumeric: 'tabular-nums',
            textShadow: '0 0 24px rgba(34, 197, 94, 0.22)',
          }}
        >
          {formatCash(displayCash)}
        </div>
      </div>

      {/* ============ ROW 3 — Empire income ============ */}
      <motion.div
        className="flex items-center gap-1.5 mt-4 pl-1"
        animate={incomePulse ? { opacity: [1, 0.55, 1] } : {}}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        <TrendingUp size={14} className="text-[var(--color-premium-green-500)]" />
        <span className="text-[12px] font-medium text-[var(--color-premium-text-secondary)]">Empire Income</span>
        <span className="text-[15px] font-medium text-[var(--color-premium-green-500)]" style={{ fontVariantNumeric: 'tabular-nums' }}>
          {formatCash(stats.profitPerMin)}<span className="text-[var(--color-premium-text-secondary)] font-normal">/min</span>
        </span>
      </motion.div>

      {/* ============ ROW 4 — Rank + Player ID ============ */}
      <div className="flex items-center gap-2 mt-4 pl-1">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--color-premium-elevated)] border border-[var(--color-premium-border-subtle)]">
          <Trophy size={12} className="text-[var(--color-premium-gold-400)]" />
          <span className="text-[12px] font-medium text-[var(--color-premium-text-secondary)]">
            Rank <span className="text-[var(--color-premium-text)] font-semibold">#{stats.rank.toLocaleString('en-IN')}</span>
          </span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--color-premium-elevated)] border border-[var(--color-premium-border-subtle)]">
          <Fingerprint size={12} className="text-[var(--color-premium-text-secondary)]" />
          <span className="text-[12px] font-medium text-[var(--color-premium-text-secondary)]">
            ID <span className="text-[var(--color-premium-text)] font-semibold">{playerId}</span>
          </span>
        </div>
      </div>

      {/* ============ AVATAR SELECTOR ============ */}
      <AnimatePresence>
        {showAvatarPicker && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="absolute inset-0" onClick={() => { playClick(); setShowAvatarPicker(false); }}></div>

            <motion.div
              initial={{ y: 200, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 200, opacity: 0 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-sm rounded-2xl p-6 z-10 bg-[var(--color-premium-surface)] border border-[var(--color-premium-border)] shadow-premium-dialog"
            >
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-[18px] font-semibold text-[var(--color-premium-text)] flex items-center gap-2">
                  <Award size={18} className="text-[var(--color-premium-gold-400)]" />
                  Choose your persona
                </h3>
                <button
                  onClick={() => { playClick(); setShowAvatarPicker(false); }}
                  className="w-8 h-8 rounded-full bg-[var(--color-premium-elevated)] border border-[var(--color-premium-border)] text-[var(--color-premium-text-secondary)] flex items-center justify-center text-sm cursor-pointer"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-4 gap-3">
                {AVATAR_OPTIONS.map((opt) => (
                  <motion.button
                    key={opt.emoji}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => selectAvatar(opt.emoji)}
                    className={`flex flex-col items-center justify-center py-3 rounded-xl bg-[var(--color-premium-elevated)] border transition-colors cursor-pointer ${
                      avatarEmoji === opt.emoji ? 'border-[var(--color-premium-gold-400)]' : 'border-[var(--color-premium-border-subtle)]'
                    }`}
                  >
                    <span className="text-2xl leading-none">{opt.emoji}</span>
                    <span className="text-[9px] text-[var(--color-premium-text-secondary)] text-center font-medium mt-1.5 leading-none max-w-[60px] truncate">
                      {opt.label}
                    </span>
                  </motion.button>
                ))}
              </div>

              <div className="mt-4 p-3 rounded-xl bg-[var(--color-premium-elevated)] border border-[var(--color-premium-border-subtle)] flex items-center gap-2.5">
                <ShieldAlert size={15} className="text-[var(--color-premium-gold-400)] flex-shrink-0" />
                <span className="text-[12px] text-[var(--color-premium-text-secondary)] leading-snug">
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
