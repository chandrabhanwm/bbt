import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, TrendingUp, Volume2, VolumeX, Award, ShieldAlert } from 'lucide-react';
import { PlayerStats } from '../types';
import { playClick, toggleMute, getMutedState } from '../utils/audio';
import { useCountUp } from '../utils/useCountUp';

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

export const BanknoteIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 32 24" className={`${className} inline-block`} fill="none">
    <rect x="2" y="6" width="22" height="12" rx="2" fill="#0E9968" />
    <rect x="2" y="6" width="22" height="12" rx="2" fill="#17BE86" stroke="#0E9968" strokeWidth="1" />
    <circle cx="13" cy="12" r="3" fill="#9EF3D4" stroke="#0E9968" strokeWidth="1" />
    <rect x="6" y="2" width="22" height="12" rx="2" fill="#0E9968" />
    <rect x="6" y="2" width="22" height="12" rx="2" fill="#2FDBA0" stroke="#0E9968" strokeWidth="1" />
    <circle cx="17" cy="8" r="3" fill="#CFF8E7" stroke="#0E9968" strokeWidth="1" />
  </svg>
);

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

  // Brief wallet glow whenever cash jumps by a meaningful (non-tick) amount —
  // this is the signature "cha-ching" feedback tying every purchase/reward together.
  useEffect(() => {
    const delta = stats.cash - prevCashRef.current;
    if (delta > 50) {
      setFlashWallet(true);
      const t = setTimeout(() => setFlashWallet(false), 600);
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
    <header className="sticky top-0 z-40 w-full p-3 pt-4 vault-card border-b rounded-b-3xl select-none">

      {/* Topmost Mute Toggle, clean & compact */}
      <div className="flex justify-end mb-2.5 px-1">
        <button
          onClick={handleMuteToggle}
          className="flex items-center justify-center p-1 rounded-full bg-[var(--color-vault-700)] hover:bg-[var(--color-vault-border)] border border-[var(--color-vault-border)] transition-colors cursor-pointer"
          title={isMuted ? "Unmute sounds" : "Mute sounds"}
        >
          {isMuted ? <VolumeX size={12} className="text-rose-400" /> : <Volume2 size={12} className="text-[var(--color-money-400)]" />}
        </button>
      </div>

      {/* Main stats layout in 4 balanced visual columns */}
      <div className="grid grid-cols-12 gap-2 items-stretch">

        {/* Column 1: Profile (Avatar with level ring + name) */}
        <div className="col-span-3 flex items-center gap-1.5 bg-[var(--color-vault-900)] border border-[var(--color-vault-border)] rounded-xl p-1.5 shadow-sm">
          <button
            onClick={() => { playClick(); setShowAvatarPicker(true); }}
            className="flex-shrink-0 relative w-9 h-9 cursor-pointer group"
            title="Change avatar"
          >
            {/* Level progress ring */}
            <svg viewBox="0 0 36 36" className="absolute inset-0 w-full h-full -rotate-90">
              <circle cx="18" cy="18" r="16" fill="none" stroke="var(--color-vault-700)" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="16" fill="none"
                stroke="var(--color-marigold-400)" strokeWidth="3" strokeLinecap="round"
                strokeDasharray={`${xpPct * 1.005} 100.5`}
                style={{ transition: 'stroke-dasharray 0.4s ease-out' }}
              />
            </svg>
            <div className="absolute inset-[3px] rounded-full bg-[var(--color-marigold-400)] flex items-center justify-center shadow-md group-active:scale-90 transition-transform">
              <span className="text-base leading-none">{avatarEmoji}</span>
            </div>
          </button>

          <div className="flex-1 min-w-0">
            {editingName ? (
              <input
                type="text"
                value={tempName}
                maxLength={10}
                onChange={(e) => setTempName(e.target.value)}
                className="bg-[var(--color-vault-700)] border border-[var(--color-marigold-500)] rounded px-1 py-0.5 text-[9px] font-bold text-white outline-none w-14"
                onBlur={handleSaveName}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                autoFocus
              />
            ) : (
              <div
                onClick={() => { playClick(); setEditingName(true); }}
                className="flex flex-col cursor-pointer group"
              >
                <span className="font-display font-bold text-[10px] text-white tracking-tight truncate max-w-[55px] group-hover:text-[var(--color-marigold-300)] uppercase">
                  {playerName}
                </span>
                <span className="text-[7.5px] text-[var(--color-marigold-400)] font-bold leading-none mt-0.5">
                  Lvl {stats.level} · {xpPct}%
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Column 2: Cash Balance display — the wallet, with count-up + flash */}
        <div className={`col-span-4 bg-[var(--color-vault-900)] border border-[var(--color-vault-border)] rounded-xl p-1.5 flex flex-col justify-between shadow-sm relative ${flashWallet ? 'animate-wallet-flash' : ''}`}>
          <div className="flex items-center gap-1">
            <BanknoteIcon className="w-4 h-3 flex-shrink-0" />
            <span className="text-[7px] font-display font-bold text-slate-400 uppercase tracking-wide truncate">Cash</span>
          </div>
          <motion.div
            className="text-[12px] font-display font-bold text-[var(--color-money-400)] tracking-tight truncate mt-0.5"
            animate={flashWallet ? { scale: [1, 1.08, 1] } : {}}
            transition={{ duration: 0.35 }}
          >
            ₹{Math.floor(displayCash).toLocaleString('en-IN')}
          </motion.div>
        </div>

        {/* Column 3: Profit Rate display */}
        <div className="col-span-3 bg-[var(--color-vault-900)] border border-[var(--color-vault-border)] rounded-xl p-1.5 flex flex-col justify-between shadow-sm">
          <div className="flex items-center gap-1">
            <TrendingUp size={11} className="text-[var(--color-money-400)] flex-shrink-0" />
            <span className="text-[6.5px] font-display font-bold text-slate-400 uppercase tracking-wide truncate">Per min</span>
          </div>
          <span className="text-[10px] font-display font-bold text-[var(--color-money-400)] tracking-tight truncate mt-0.5">
            ₹{Math.round(stats.profitPerMin).toLocaleString('en-IN')}
          </span>
        </div>

        {/* Column 4: Leaderboard Rank display */}
        <div className="col-span-2 bg-[var(--color-vault-900)] border border-[var(--color-vault-border)] rounded-xl p-1.5 flex flex-col justify-between shadow-sm">
          <div className="flex items-center gap-1">
            <Trophy size={11} className="text-[var(--color-marigold-400)] flex-shrink-0" />
            <span className="text-[7px] font-display font-bold text-slate-400 uppercase tracking-wide truncate">Rank</span>
          </div>
          <span className="text-[10px] font-display font-bold text-[var(--color-marigold-400)] tracking-tight truncate mt-0.5">
            #{stats.rank.toLocaleString('en-IN')}
          </span>
        </div>

      </div>

      {/* AVATAR SELECTOR MODAL / BOTTOM SHEET OVERLAY */}
      <AnimatePresence>
        {showAvatarPicker && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#0f172a]/40 backdrop-blur-xs p-4">
            <div className="absolute inset-0" onClick={() => { playClick(); setShowAvatarPicker(false); }}></div>

            <motion.div
              initial={{ y: 200, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 200, opacity: 0 }}
              className="relative w-full max-w-sm court-card rounded-3xl p-5 z-10 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[var(--color-marigold-400)] via-[var(--color-brass-400)] to-[var(--color-marigold-400)]"></div>

              <div className="flex justify-between items-center mb-4">
                <h3 className="font-display font-bold text-base text-slate-800 flex items-center gap-2">
                  <Award className="text-[var(--color-marigold-500)]" size={18} />
                  Choose your persona
                </h3>
                <button
                  onClick={() => { playClick(); setShowAvatarPicker(false); }}
                  className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 flex items-center justify-center font-bold font-mono text-sm cursor-pointer"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-4 gap-3.5 py-2">
                {AVATAR_OPTIONS.map((opt) => (
                  <button
                    key={opt.emoji}
                    onClick={() => selectAvatar(opt.emoji)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-2xl bg-white border transition-all hover:border-[var(--color-marigold-400)]/60 cursor-pointer active:scale-95 ${avatarEmoji === opt.emoji ? 'border-[var(--color-marigold-400)] glow-marigold' : 'border-[var(--color-court-border)]'}`}
                  >
                    <span className="text-3xl filter drop-shadow">{opt.emoji}</span>
                    <span className="text-[7px] text-slate-500 text-center font-bold mt-1.5 leading-none max-w-[65px] truncate">
                      {opt.label}
                    </span>
                  </button>
                ))}
              </div>

              <div className="mt-3 p-3 rounded-xl bg-white border border-[var(--color-court-border)] flex items-center gap-2.5">
                <ShieldAlert size={15} className="text-[var(--color-marigold-500)] flex-shrink-0" />
                <span className="text-[10px] text-slate-500 leading-snug">
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
