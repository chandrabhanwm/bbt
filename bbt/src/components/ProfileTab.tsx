import React from 'react';
import { motion } from 'motion/react';
import { Award, Settings as SettingsIcon, ChevronRight, Fingerprint } from 'lucide-react';
import { PlayerStats, Business } from '../types';
import { CoinIcon } from './CoinIcon';
import { formatCash } from '../utils/formatCash';
import { playClick } from '../utils/audio';

interface ProfileTabProps {
  stats: PlayerStats;
  /** Current district's businesses — same scope as before, used only for
   *  the existing achievement conditions and per-district stat cards. */
  businesses: Business[];
  avatarEmoji: string;
  playerName: string;
  /** Empire-wide totals, for the new Empire Summary section only. */
  totalBusinessesOwned?: number;
  totalDistrictsOwned?: number;
  /** Wiring only — no visual change. Opens the Settings screen using the
   *  same showSettings state App.tsx already owns. */
  onOpenSettings?: () => void;
}

/**
 * Same deterministic display-only Player ID as the Header uses. Header.tsx
 * is frozen, so this small pure function is duplicated here rather than
 * exported from a locked file — it's not persisted, not game logic, just
 * a render-time label derived from the existing player name.
 */
function derivePlayerId(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  const digits = 100000 + (hash % 900000);
  return `BST-${digits}`;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({
  stats,
  businesses,
  avatarEmoji,
  playerName,
  totalBusinessesOwned,
  totalDistrictsOwned,
  onOpenSettings,
}) => {
  // Identical to before — same conditions, same thresholds, same progress
  // math. Only the visual presentation below has changed.
  const ownedCount = businesses.filter((b) => b.level > 0).length;
  const totalLevels = businesses.reduce((acc, b) => acc + b.level, 0);

  const achievements = [
    {
      id: 'tea_stall_boss',
      title: 'Tea Stall Maharaja',
      desc: 'Upgrade your first Tea Stall to Level 5 or higher.',
      unlocked: (businesses.find((b) => b.id === 'tea_stall')?.level ?? 0) >= 5,
      progress: Math.min(100, Math.round(((businesses.find((b) => b.id === 'tea_stall')?.level ?? 0) / 5) * 100)),
    },
    {
      id: 'market_unlocked',
      title: 'Gully Monopolist',
      desc: 'Buy and establish ownership of at least 5 different shops.',
      unlocked: ownedCount >= 5,
      progress: Math.min(100, Math.round((ownedCount / 5) * 100)),
    },
    {
      id: 'double_boost',
      title: 'Marketing Genius',
      desc: 'Activate the Sponsor Double Income (2X Ad Boost) mechanism.',
      unlocked: stats.activeDoubleProfit,
      progress: stats.activeDoubleProfit ? 100 : 0,
    },
    {
      id: 'wealth_builder',
      title: 'Basti Crorepati',
      desc: 'Accumulate more than ₹1,50,000 in raw cash.',
      unlocked: stats.cash >= 150000,
      progress: Math.min(100, Math.round((stats.cash / 150000) * 100)),
    }
  ];

  const xpPct = Math.min(100, Math.round((stats.xp / Math.max(1, stats.nextLevelXp)) * 100));
  const playerId = derivePlayerId(playerName);

  return (
    <div id="profile-tab" className="p-4 space-y-4 pb-28 select-none" style={{ backgroundColor: 'var(--color-premium-bg)' }}>

      {/* Hero — same avatar-ring / XP-bar language as the Header */}
      <div
        className="rounded-2xl p-4 flex items-center gap-4"
        style={{ backgroundColor: 'var(--color-premium-surface)', border: '1.5px solid var(--color-premium-border-strong)' }}
      >
        <div className="relative w-16 h-16 flex-shrink-0">
          <div
            className="w-full h-full rounded-full flex items-center justify-center text-3xl"
            style={{ backgroundColor: 'var(--color-premium-elevated)', border: '2px solid var(--color-premium-gold-400)' }}
          >
            {avatarEmoji}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-[15px] truncate" style={{ color: 'var(--color-premium-text)' }}>
            {playerName}
          </h3>
          <div className="text-[10px] font-semibold mt-0.5" style={{ color: 'var(--color-premium-gold-400)' }}>
            Level {stats.level} · {xpPct}%
          </div>
          <div className="w-full h-1 rounded-full mt-1.5 overflow-hidden" style={{ backgroundColor: 'var(--color-premium-track)' }}>
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: 'var(--color-premium-gold-400)' }}
              initial={{ width: 0 }}
              animate={{ width: `${xpPct}%` }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            />
          </div>
          <div className="flex items-center gap-1 mt-1.5">
            <Fingerprint size={10} color="var(--color-premium-text-secondary)" />
            <span className="text-[9.5px] font-medium" style={{ color: 'var(--color-premium-text-secondary)' }}>
              ID <span className="font-bold" style={{ color: 'var(--color-premium-text)' }}>{playerId}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Empire Summary — empire-wide totals, reusing existing computed values */}
      <SectionLabel>Empire Summary</SectionLabel>
      <div className="grid grid-cols-2 gap-3">
        <SummaryTile label="Net Worth" value={formatCash(stats.cash)} money />
        <SummaryTile label="Passive Income" value={`${formatCash(stats.profitPerMin)}/min`} money />
        <SummaryTile label="Businesses Owned" value={`${totalBusinessesOwned ?? ownedCount}`} />
        <SummaryTile label="Districts Owned" value={`${totalDistrictsOwned ?? 1}`} />
      </div>

      {/* Statistics — same stat-card language, same per-district values as before */}
      <SectionLabel>Statistics</SectionLabel>
      <div className="grid grid-cols-2 gap-3">
        <SummaryTile label="Shops Owned (District)" value={`${ownedCount} / ${businesses.length}`} />
        <SummaryTile label="Upgrade Levels Bought" value={`${totalLevels}`} />
        <SummaryTile label="Market Income Stream" value={`${formatCash(stats.profitPerMin)}/min`} money />
        <SummaryTile label="Ad Revenue Multiplier" value={stats.activeDoubleProfit ? '2.0x Active' : '1.0x Standard'} />
      </div>

      {/* Achievements — minimal single icon, no colorful badges */}
      <SectionLabel icon={<Award size={13} color="var(--color-premium-gold-400)" />}>Achievements</SectionLabel>
      <div className="space-y-2.5">
        {achievements.map((ach) => (
          <div
            key={ach.id}
            className="rounded-2xl p-3 flex items-center gap-3"
            style={{
              backgroundColor: 'var(--color-premium-surface)',
              border: `1.5px solid ${ach.unlocked ? 'var(--color-premium-gold-400)' : 'var(--color-premium-border)'}`,
              opacity: ach.unlocked ? 1 : 0.6,
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: 'var(--color-premium-elevated)', border: '1.5px solid var(--color-premium-border)' }}
            >
              <Award size={17} color={ach.unlocked ? 'var(--color-premium-gold-400)' : 'var(--color-premium-text-secondary)'} strokeWidth={1.75} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center gap-2">
                <h4 className="font-bold text-[11px] truncate" style={{ color: ach.unlocked ? 'var(--color-premium-text)' : 'var(--color-premium-text-secondary)' }}>
                  {ach.title}
                </h4>
                {ach.unlocked && (
                  <span
                    className="text-[8px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: 'var(--color-premium-elevated)', color: 'var(--color-premium-green-500)', border: '1px solid var(--color-premium-green-500)' }}
                  >
                    Unlocked
                  </span>
                )}
              </div>
              <p className="text-[9.5px] leading-snug mt-1" style={{ color: 'var(--color-premium-text-secondary)' }}>
                {ach.desc}
              </p>
              <div className="w-full h-1 rounded-full mt-2 overflow-hidden" style={{ backgroundColor: 'var(--color-premium-track)' }}>
                <div
                  className="h-full rounded-full"
                  style={{ width: `${ach.progress}%`, backgroundColor: ach.unlocked ? 'var(--color-premium-gold-400)' : 'var(--color-premium-border-strong)' }}
                />
              </div>
            </div>
          </div>
        ))}
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

const SummaryTile: React.FC<{ label: string; value: string; money?: boolean }> = ({ label, value, money }) => (
  <div
    className="rounded-2xl p-3 flex flex-col justify-center"
    style={{ backgroundColor: 'var(--color-premium-surface)', border: '1.5px solid var(--color-premium-border)' }}
  >
    <span className="text-[8.5px] font-bold uppercase tracking-widest leading-none" style={{ color: 'var(--color-premium-text-secondary)' }}>
      {label}
    </span>
    <span
      className="font-bold text-[13px] mt-2.5 flex items-center gap-1.5"
      style={{ color: money ? 'var(--color-premium-green-500)' : 'var(--color-premium-text)' }}
    >
      {money && <CoinIcon className="w-3.5 h-3.5" premium />}
      {value}
    </span>
  </div>
);
