import React from 'react';
import { motion } from 'motion/react';
import { Award, Medal, CircleDollarSign, TrendingUp, Sparkles, Star, ShieldCheck } from 'lucide-react';
import { PlayerStats, Business } from '../types';

interface ProfileTabProps {
  stats: PlayerStats;
  businesses: Business[];
  avatarEmoji: string;
  playerName: string;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({
  stats,
  businesses,
  avatarEmoji,
  playerName
}) => {
  const ownedCount = businesses.filter((b) => b.level > 0).length;
  const totalLevels = businesses.reduce((acc, b) => acc + b.level, 0);

  // Compute list of dynamic milestones/trophies
  const achievements = [
    {
      id: 'tea_stall_boss',
      title: 'Tea Stall Maharaja ☕',
      desc: 'Upgrade your first Tea Stall to Level 5 or higher.',
      unlocked: (businesses.find((b) => b.id === 'tea_stall')?.level ?? 0) >= 5,
      progress: Math.min(100, Math.round(((businesses.find((b) => b.id === 'tea_stall')?.level ?? 0) / 5) * 100)),
      badgeClass: 'from-[var(--color-marigold-400)] to-[var(--color-marigold-600)] border-[var(--color-marigold-300)]'
    },
    {
      id: 'market_unlocked',
      title: 'Gully Monopolist 🏬',
      desc: 'Buy and establish ownership of at least 5 different shops.',
      unlocked: ownedCount >= 5,
      progress: Math.min(100, Math.round((ownedCount / 5) * 100)),
      badgeClass: 'from-[var(--color-money-400)] to-[var(--color-money-600)] border-[var(--color-money-300)]'
    },
    {
      id: 'double_boost',
      title: 'Marketing Genius ⚡',
      desc: 'Activate the Sponsor Double Income (2X Ad Boost) mechanism.',
      unlocked: stats.activeDoubleProfit,
      progress: stats.activeDoubleProfit ? 100 : 0,
      badgeClass: 'from-[var(--color-brass-400)] to-[var(--color-brass-600)] border-[var(--color-brass-400)]'
    },
    {
      id: 'wealth_builder',
      title: 'Basti Crorepati 💰',
      desc: 'Accumulate more than ₹1,50,000 in raw cash.',
      unlocked: stats.cash >= 150000,
      progress: Math.min(100, Math.round((stats.cash / 150000) * 100)),
      badgeClass: 'from-[var(--color-rose-400)] to-[var(--color-rose-500)] border-[var(--color-rose-400)]'
    }
  ];

  return (
    <div id="profile-tab" className="p-4 space-y-4 pb-28 select-none">
      
      {/* Dynamic Profile Cover Card */}
      <div className="relative overflow-hidden rounded-3xl court-card p-5 flex items-center gap-4">
        {/* Background ambient mesh */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-marigold-400)]/10 rounded-full blur-xl pointer-events-none"></div>

        {/* Big Avatar Shell */}
        <div className="relative flex-shrink-0">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--color-marigold-400)] to-[var(--color-marigold-600)] flex items-center justify-center text-4xl border-2 border-[var(--color-marigold-300)]/50 shadow-md">
            {avatarEmoji}
          </div>
          <div className="absolute -bottom-1 -right-1 bg-[var(--color-money-500)] text-slate-950 rounded-full p-0.5 border border-white">
            <ShieldCheck size={11} className="fill-current text-white" />
          </div>
        </div>

        <div>
          <h3 className="font-display font-extrabold text-sm text-slate-800 tracking-tight flex items-center gap-1.5">
            <span>{playerName}</span>
            <span className="text-amber-400 text-xs">👑</span>
          </h3>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider leading-none mt-1">
            Basti Market Tycoon · Lvl {stats.level}
          </p>
          <div className="mt-2.5 flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-[var(--color-court-border)]">
            <Star size={11} className="text-[var(--color-marigold-500)] fill-current animate-pulse" />
            <span className="text-[9px] font-mono font-bold text-slate-600">
              Rank position: <span className="text-[var(--color-marigold-600)]">#{stats.rank}</span> in Basti
            </span>
          </div>
        </div>
      </div>

      {/* TYCOON CONQUEST STATISTICS PANEL */}
      <h3 className="font-display font-extrabold text-xs text-slate-500 uppercase tracking-widest px-1">
        Tycoon Conquest Statistics
      </h3>
      <div className="grid grid-cols-2 gap-3">
        
        {/* Stat 1 */}
        <div className="court-card p-3 rounded-2xl flex flex-col justify-center">
          <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-widest leading-none">Total Shops Owned</span>
          <span className="font-mono font-extrabold text-sm text-slate-700 mt-2.5 flex items-center gap-1.5">
            <span>🏬</span> {ownedCount} / {businesses.length}
          </span>
        </div>

        {/* Stat 2 */}
        <div className="court-card p-3 rounded-2xl flex flex-col justify-center">
          <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-widest leading-none">Upgrade Levels Bought</span>
          <span className="font-mono font-extrabold text-sm text-slate-700 mt-2.5 flex items-center gap-1.5">
            <span>🛠️</span> {totalLevels} Levels
          </span>
        </div>

        {/* Stat 3 */}
        <div className="court-card p-3 rounded-2xl flex flex-col justify-center">
          <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-widest leading-none">Market Income Stream</span>
          <span className="font-mono font-extrabold text-sm text-[var(--color-money-600)] mt-2.5 flex items-center gap-1.5">
            <TrendingUp size={14} /> +₹{Math.round(stats.profitPerMin).toLocaleString('en-IN')}/min
          </span>
        </div>

        {/* Stat 4 */}
        <div className="court-card p-3 rounded-2xl flex flex-col justify-center">
          <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-widest leading-none">Ad Revenue multiplier</span>
          <span className="font-mono font-extrabold text-sm text-[var(--color-money-600)] mt-2.5 flex items-center gap-1.5">
            <span>⚡</span> {stats.activeDoubleProfit ? '2.0X Boost ACTIVE' : '1.0X standard'}
          </span>
        </div>

      </div>

      {/* TROPHIES & MEDALS */}
      <h3 className="font-display font-extrabold text-xs text-slate-500 uppercase tracking-widest px-1 pt-1 flex items-center gap-1.5">
        <Award size={14} className="text-[var(--color-marigold-500)]" />
        Tycoon Badges & Trophies
      </h3>
      <div className="space-y-3">
        
        {achievements.map((ach) => (
          <div
            key={ach.id}
            className={`relative rounded-2xl p-3 border transition-all flex items-center gap-3.5 ${
              ach.unlocked
                ? 'court-card'
                : 'bg-white/50 border-[var(--color-court-border)]/60 opacity-60 shadow-2xs'
            }`}
          >
            {/* Medal Icon Badge */}
            <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br border flex items-center justify-center text-xl shadow-md ${
              ach.unlocked
                ? ach.badgeClass
                : 'from-slate-100 to-slate-200 border-slate-200 text-slate-400'
            }`}>
              <Medal size={22} className={ach.unlocked ? 'text-white' : 'text-slate-400'} />
            </div>

            {/* Achievement text body */}
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center">
                <h4 className={`font-display font-extrabold text-[11px] ${ach.unlocked ? 'text-slate-800' : 'text-slate-400'}`}>
                  {ach.title}
                </h4>
                {ach.unlocked && (
                  <span className="text-[8px] font-display font-extrabold text-[var(--color-money-600)] bg-[var(--color-money-500)]/10 px-2 py-0.5 rounded-full border border-[var(--color-money-500)]/20 uppercase tracking-wider">
                    Unlocked
                  </span>
                )}
              </div>
              <p className="text-[9.5px] text-slate-500 leading-snug mt-1 font-semibold">
                {ach.desc}
              </p>

              {/* Progress gauge inside badge */}
              <div className="w-full h-1 bg-slate-100 border border-slate-200/40 rounded-full mt-2 overflow-hidden">
                <div className={`h-full ${ach.unlocked ? 'bg-gradient-to-r from-[var(--color-marigold-400)] to-[var(--color-marigold-300)]' : 'bg-slate-300'}`} style={{ width: `${ach.progress}%` }} />
              </div>
            </div>

          </div>
        ))}

      </div>

    </div>
  );
};
