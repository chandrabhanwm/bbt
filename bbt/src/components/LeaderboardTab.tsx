import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, TrendingUp, Users } from 'lucide-react';
import { LeaderboardUser } from '../types';
import { CoinIcon } from './CoinIcon';
import { formatCash } from '../utils/formatCash';

interface LeaderboardTabProps {
  playerCash: number;
  playerRank: number;
  playerLevel: number;
  playerAvatar: string;
  playerName: string;
  /** Display-only — not used by sorting/ranking, which is still cash-based. */
  playerDistrictsOwned?: number;
  playerPassiveIncome?: number;
}

// Static flavor content, same pattern/spirit as the original template —
// districtsOwned/passiveIncome are plain descriptive numbers, not computed
// by any formula, exactly like the existing cash/level fields already were.
const RIVAL_TEMPLATES = [
  { name: 'Ambani Junior', cash: 50000000, level: 99, avatarEmoji: '👳‍♂️', rank: 1, districtsOwned: 9, passiveIncome: 850000 },
  { name: 'Crorepati Samosawala', cash: 25000000, level: 85, avatarEmoji: '👨‍🍳', rank: 2, districtsOwned: 8, passiveIncome: 420000 },
  { name: 'Basti Gold King', cash: 10000000, level: 72, avatarEmoji: '🤑', rank: 3, districtsOwned: 6, passiveIncome: 180000 },
  { name: 'Kanpur Gutka Kingpin', cash: 1500000, level: 45, avatarEmoji: '🧔', rank: 4, districtsOwned: 4, passiveIncome: 65000 },
  { name: 'VIP Gym Owner', cash: 800000, level: 32, avatarEmoji: '💪', rank: 5, districtsOwned: 3, passiveIncome: 32000 },
  { name: 'Rickshaw Rental Union', cash: 300000, level: 24, avatarEmoji: '👳', rank: 6, districtsOwned: 2, passiveIncome: 12000 },
  { name: 'Gully Cricket Captain', cash: 180000, level: 18, avatarEmoji: '👦', rank: 7, districtsOwned: 2, passiveIncome: 7500 },
  { name: 'Local Pan Shop Boss', cash: 95000, level: 10, avatarEmoji: '👨', rank: 9, districtsOwned: 1, passiveIncome: 3200 },
  { name: 'Basti Gali Cycle Mechanic', cash: 45000, level: 6, avatarEmoji: '👴', rank: 10, districtsOwned: 1, passiveIncome: 1500 }
];

export const LeaderboardTab: React.FC<LeaderboardTabProps> = ({
  playerCash,
  playerRank,
  playerLevel,
  playerAvatar,
  playerName,
  playerDistrictsOwned,
  playerPassiveIncome,
}) => {
  const [rivals, setRivals] = useState<LeaderboardUser[]>([]);

  // Construct competitive list, sorting real-time cash balance — identical
  // logic to before, untouched.
  useEffect(() => {
    // Generate slightly ticking rival balances to simulate active gameplay rivals
    const activeRivals = RIVAL_TEMPLATES.map(r => ({
      ...r,
      // Add a tiny random tick to emulate passive earnings for rivals
      cash: r.cash + Math.floor(Math.random() * 2000 - 1000)
    }));

    const playerObj: LeaderboardUser = {
      name: playerName,
      cash: playerCash,
      level: playerLevel,
      avatarEmoji: playerAvatar,
      isPlayer: true,
      rank: playerRank,
      districtsOwned: playerDistrictsOwned,
      passiveIncome: playerPassiveIncome,
    };

    // Merge, sort, and re-assign rankings
    const combined = [...activeRivals, playerObj].sort((a, b) => b.cash - a.cash);

    // Assign ranked index list
    const rankedList = combined.map((user, idx) => ({
      ...user,
      rank: idx + 1
    }));

    setRivals(rankedList);
  }, [playerCash, playerLevel, playerAvatar, playerName, playerRank, playerDistrictsOwned, playerPassiveIncome]);

  const topThree = rivals.slice(0, 3);
  const remaining = rivals.slice(3);

  return (
    <div id="leaderboard-tab" className="p-4 space-y-4 pb-28 select-none" style={{ backgroundColor: 'var(--color-premium-bg)' }}>

      {/* Title — same premium pill language as Header/City Map, title adapted for this screen */}
      <div
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold"
        style={{ backgroundColor: 'var(--color-premium-surface)', border: '1.5px solid var(--color-premium-border-strong)', color: 'var(--color-premium-text)' }}
      >
        <TrendingUp size={12} color="var(--color-premium-gold-400)" />
        <span>Empire Rankings</span>
      </div>

      {rivals.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {/* Top 3 spotlight */}
          <div className="grid grid-cols-3 gap-2.5">
            {topThree.map((user, i) => (
              <motion.div
                key={user.name}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: 'easeOut', delay: i * 0.05 }}
              >
                <SpotlightCard user={user} />
              </motion.div>
            ))}
          </div>

          {/* Remaining rankings — clean list, thin separators */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{ backgroundColor: 'var(--color-premium-surface)', border: '1.5px solid var(--color-premium-border)' }}
          >
            {remaining.map((user, i) => (
              <RankRow key={user.name} user={user} isLast={i === remaining.length - 1} />
            ))}
          </div>

          <div
            className="p-3 rounded-2xl flex gap-2.5 items-center"
            style={{ backgroundColor: 'var(--color-premium-surface)', border: '1.5px solid var(--color-premium-border)' }}
          >
            <ShieldAlert size={16} color="var(--color-premium-gold-400)" className="flex-shrink-0" />
            <span className="text-[9.5px] font-medium leading-snug" style={{ color: 'var(--color-premium-text-secondary)' }}>
              Rank placement automatically realigns every 3 seconds as cash ticks upwards.
            </span>
          </div>
        </>
      )}
    </div>
  );
};

const SpotlightCard: React.FC<{ user: LeaderboardUser }> = ({ user }) => (
  <div
    className="rounded-2xl p-2.5 flex flex-col items-center text-center"
    style={{
      backgroundColor: 'var(--color-premium-surface)',
      border: `1.5px solid ${user.isPlayer ? 'var(--color-premium-gold-400)' : 'var(--color-premium-border)'}`,
    }}
  >
    <div className="relative w-10 h-10 mb-1.5">
      <div
        className="w-full h-full rounded-full flex items-center justify-center text-lg"
        style={{ backgroundColor: 'var(--color-premium-elevated)', border: '1.5px solid var(--color-premium-border-strong)' }}
      >
        {user.avatarEmoji}
      </div>
      <div
        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold"
        style={{ backgroundColor: 'var(--color-premium-gold-400)', color: 'var(--color-premium-text-inverse)' }}
      >
        {user.rank}
      </div>
    </div>

    <span className="text-[10.5px] font-bold leading-tight truncate w-full" style={{ color: 'var(--color-premium-text)' }}>
      {user.name}
    </span>
    {user.isPlayer && (
      <span className="text-[8px] font-bold mt-0.5" style={{ color: 'var(--color-premium-gold-400)' }}>YOU</span>
    )}

    <div className="flex items-center gap-1 mt-1.5 font-bold text-[11px]" style={{ color: 'var(--color-premium-green-500)' }}>
      <CoinIcon className="w-3 h-3" premium />
      {formatCash(user.cash)}
    </div>

    <div className="w-full mt-1.5 pt-1.5 flex flex-col gap-0.5" style={{ borderTop: '1px solid var(--color-premium-border)' }}>
      <div className="flex items-center justify-between text-[8px]">
        <span style={{ color: 'var(--color-premium-text-secondary)' }}>Districts</span>
        <span className="font-bold" style={{ color: 'var(--color-premium-text)' }}>{user.districtsOwned ?? '—'}</span>
      </div>
      <div className="flex items-center justify-between text-[8px]">
        <span style={{ color: 'var(--color-premium-text-secondary)' }}>Income</span>
        <span className="font-bold" style={{ color: 'var(--color-premium-green-500)' }}>
          {user.passiveIncome != null ? `${formatCash(user.passiveIncome)}/min` : '—'}
        </span>
      </div>
    </div>
  </div>
);

const RankRow: React.FC<{ user: LeaderboardUser; isLast: boolean }> = ({ user, isLast }) => (
  <div
    className={`flex items-center gap-3 px-3 py-2.5 ${user.isPlayer ? 'bg-[var(--color-premium-gold-400)]/[0.06]' : ''}`}
    style={{
      borderBottom: isLast ? 'none' : '1px solid var(--color-premium-border)',
      borderLeft: user.isPlayer ? '2.5px solid var(--color-premium-gold-400)' : '2.5px solid transparent',
    }}
  >
    <span className="w-5 text-center text-[11px] font-bold flex-shrink-0" style={{ color: 'var(--color-premium-text-secondary)' }}>
      {user.rank}
    </span>

    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-base flex-shrink-0"
      style={{ backgroundColor: 'var(--color-premium-elevated)', border: '1.5px solid var(--color-premium-border)' }}
    >
      {user.avatarEmoji}
    </div>

    <div className="flex-1 min-w-0">
      <span className="text-[11.5px] font-bold truncate block" style={{ color: user.isPlayer ? 'var(--color-premium-gold-400)' : 'var(--color-premium-text)' }}>
        {user.name}{user.isPlayer ? ' (You)' : ''}
      </span>
    </div>

    <div className="text-right flex-shrink-0">
      <div className="flex items-center justify-end gap-1 font-bold text-[11px]" style={{ color: 'var(--color-premium-green-500)' }}>
        <CoinIcon className="w-3 h-3" premium />
        {formatCash(user.cash)}
      </div>
      {user.passiveIncome != null && (
        <div className="text-[8px] font-medium mt-0.5" style={{ color: 'var(--color-premium-text-secondary)' }}>
          {formatCash(user.passiveIncome)}/min
        </div>
      )}
    </div>
  </div>
);

const EmptyState: React.FC = () => (
  <div
    className="rounded-2xl p-8 flex flex-col items-center text-center"
    style={{ backgroundColor: 'var(--color-premium-surface)', border: '1.5px solid var(--color-premium-border)' }}
  >
    <Users size={28} color="var(--color-premium-text-secondary)" strokeWidth={1.5} />
    <span className="text-[13px] font-bold mt-3" style={{ color: 'var(--color-premium-text)' }}>
      Rankings unavailable
    </span>
    <span className="text-[11px] font-medium mt-1 max-w-[220px]" style={{ color: 'var(--color-premium-text-secondary)' }}>
      Check back shortly — the rich list is being recalculated.
    </span>
  </div>
);
