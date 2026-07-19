import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Trophy, ShieldAlert, Award, Star, Flame, ArrowUp } from 'lucide-react';
import { PlayerStats, LeaderboardUser } from '../types';

interface LeaderboardTabProps {
  playerCash: number;
  playerRank: number;
  playerLevel: number;
  playerAvatar: string;
  playerName: string;
}

const RIVAL_TEMPLATES = [
  { name: 'Ambani Junior 👑', cash: 50000000, level: 99, avatarEmoji: '👳‍♂️', rank: 1 },
  { name: 'Crorepati Samosawala 🥟', cash: 25000000, level: 85, avatarEmoji: '👨‍🍳', rank: 2 },
  { name: 'Basti Gold King 💍', cash: 10000000, level: 72, avatarEmoji: '🤑', rank: 3 },
  { name: 'Kanpur Gutka Kingpin 🍂', cash: 1500000, level: 45, avatarEmoji: '🧔', rank: 4 },
  { name: 'VIP Gym Owner 🏋️‍♂️', cash: 800000, level: 32, avatarEmoji: '💪', rank: 5 },
  { name: 'Rickshaw Rental Union 🛺', cash: 300000, level: 24, avatarEmoji: '👳', rank: 6 },
  { name: 'Gully Cricket Captain 🏏', cash: 180000, level: 18, avatarEmoji: '👦', rank: 7 },
  { name: 'Local Pan Shop Boss 🍃', cash: 95000, level: 10, avatarEmoji: '👨', rank: 9 },
  { name: 'Basti Gali Cycle Mechanic 🚲', cash: 45000, level: 6, avatarEmoji: '👴', rank: 10 }
];

export const LeaderboardTab: React.FC<LeaderboardTabProps> = ({
  playerCash,
  playerRank,
  playerLevel,
  playerAvatar,
  playerName
}) => {
  const [rivals, setRivals] = useState<LeaderboardUser[]>([]);

  // Construct competitive list, sorting real-time cash balance
  useEffect(() => {
    // Generate slightly ticking rival balances to simulate active gameplay rivals
    const activeRivals = RIVAL_TEMPLATES.map(r => ({
      ...r,
      // Add a tiny random tick to emulate passive earnings for rivals
      cash: r.cash + Math.floor(Math.random() * 2000 - 1000)
    }));

    const playerObj: LeaderboardUser = {
      name: `${playerName} (You)`,
      cash: playerCash,
      level: playerLevel,
      avatarEmoji: playerAvatar,
      isPlayer: true,
      rank: playerRank
    };

    // Merge, sort, and re-assign rankings
    const combined = [...activeRivals, playerObj].sort((a, b) => b.cash - a.cash);
    
    // Assign ranked index list
    const rankedList = combined.map((user, idx) => ({
      ...user,
      rank: idx + 1
    }));

    setRivals(rankedList);
  }, [playerCash, playerLevel, playerAvatar, playerName, playerRank]);

  // Find user's rank inside the list
  const playerPosition = rivals.findIndex(r => r.isPlayer);

  return (
    <div id="leaderboard-tab" className="p-4 space-y-4 pb-28 select-none">
      
      {/* Trophy Spotlight Frame */}
      <div className="relative overflow-hidden rounded-3xl toy-card p-5 text-center">
        <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--color-marigold-400)]/10 rounded-full blur-xl pointer-events-none"></div>
        <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-[var(--color-money-400)]/10 rounded-full blur-xl pointer-events-none"></div>

        <motion.div
          animate={{ scale: [1, 1.08, 1], rotate: [0, 5, -5, 0] }}
          transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
          className="mx-auto w-12 h-12 rounded-full bg-gradient-to-tr from-[var(--color-marigold-300)] to-[var(--color-marigold-600)] flex items-center justify-center shadow-lg"
        >
          <Trophy className="text-white fill-current" size={24} />
        </motion.div>

        <h3 className="font-display font-extrabold text-sm text-slate-800 uppercase mt-3 tracking-wider">
          Basti Rich List
        </h3>
        <p className="text-[10px] text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed font-semibold">
          Rivals earn passive cash too! Climb high to claim the legendary <span className="text-[var(--color-marigold-600)] font-bold">Basti Maharaja Golden Crown</span>.
        </p>

        {/* Player competitive highlight */}
        <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-white border border-[var(--color-ink-700)/25] rounded-full">
          <Star size={11} className="text-yellow-500 fill-current" />
          <span className="text-[10px] font-bold text-slate-600">
            Your position: <span className="text-[var(--color-marigold-600)] font-mono">Rank #{playerPosition !== -1 ? playerPosition + 1 : playerRank}</span>
          </span>
        </div>
      </div>

      {/* RIVALRY COMPETITIVE HIGH SCORE BOARD */}
      <div className="space-y-2 toy-card rounded-3xl p-2.5">
        
        {rivals.map((user) => {
          const isTop3 = user.rank <= 3;
          const podiumColor = user.rank === 1
            ? 'from-[var(--color-marigold-300)] to-[var(--color-marigold-500)] border-[var(--color-marigold-300)] text-slate-950 shadow-[0_0_10px_rgba(255,168,61,0.3)]'
            : user.rank === 2
            ? 'from-slate-200 to-slate-300 border-slate-150 text-slate-800'
            : 'from-[var(--color-brass-600)] to-[var(--color-brass-400)] border-[var(--color-brass-400)] text-amber-950';

          return (
            <div
              key={user.name}
              className={`relative rounded-2xl p-3 flex items-center justify-between gap-3 border transition-all ${
                user.isPlayer
                  ? 'bg-[var(--color-marigold-400)]/10 border-[var(--color-marigold-400)]/50 shadow-xs'
                  : 'bg-white/90 border-slate-100 shadow-2xs'
              }`}
            >
              
              {/* Podium rank designation */}
              <div className="flex items-center gap-3">
                
                {isTop3 ? (
                  <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${podiumColor} border font-display font-extrabold text-xs flex items-center justify-center shadow-xs`}>
                    {user.rank}
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full bg-slate-50 border border-slate-200 font-mono text-slate-400 text-[10px] font-bold flex items-center justify-center">
                    {user.rank}
                  </div>
                )}

                {/* Avatar */}
                <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-center text-xl shadow-xs">
                  {user.avatarEmoji}
                </div>

                {/* Name & Title */}
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className={`font-display font-extrabold text-xs ${user.isPlayer ? 'text-[var(--color-marigold-600)]' : 'text-slate-800'}`}>
                      {user.name}
                    </span>
                    {user.rank === 1 && (
                      <span className="text-[10px]" title="Current Maharaja">👑</span>
                    )}
                  </div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-none mt-0.5">
                    LEVEL {user.level} · Basti Elite
                  </div>
                </div>

              </div>

              {/* Cash pile */}
              <div className="text-right">
                <div className="flex items-center justify-end gap-1 font-mono font-extrabold text-xs text-emerald-600">
                  <span>₹</span>
                  <span>{Math.floor(user.cash).toLocaleString('en-IN')}</span>
                </div>
                
                {/* Visual earning rating indicator */}
                {user.isPlayer ? (
                  <span className="text-[8.5px] text-[var(--color-marigold-600)] font-bold tracking-wider uppercase flex items-center justify-end gap-0.5 mt-0.5">
                    <Flame size={9} className="animate-pulse" /> Live climbing
                  </span>
                ) : (
                  <span className="text-[8.5px] text-slate-400 font-medium tracking-wider uppercase flex items-center justify-end gap-0.5 mt-0.5">
                    <ArrowUp size={8} /> Active
                  </span>
                )}
              </div>

            </div>
          );
        })}

      </div>

      <div className="p-3 bg-white border border-[var(--color-ink-700)/25] rounded-2xl flex gap-2.5 items-center">
        <ShieldAlert size={16} className="text-[var(--color-marigold-500)] flex-shrink-0" />
        <span className="text-[9.5px] text-slate-500 font-semibold leading-snug">
          Rank placement automatically realigns every 3 seconds as cash ticks upwards. Become a billionaire to reach Rank #1!
        </span>
      </div>

    </div>
  );
};
