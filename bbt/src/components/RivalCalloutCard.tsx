import React from 'react';
import { motion } from 'motion/react';
import { LeaderboardEntry } from '../services/SaveService';

interface RivalCalloutCardProps {
  leaderboard: Array<LeaderboardEntry & { uid: string }>;
  myRank: number | null;
  myProfitPerMin: number;
  myAvatar: string;
}

/**
 * Rebuilt with an actual head-to-head identity — researched against
 * how competitive mobile games (Clash Royale, Coin Master's raid
 * targeting) treat this exact pattern: two real avatars facing off,
 * not an abstract "here's a stat" card. The whole psychological point
 * of a rival callout is making the leaderboard feel like a specific
 * person to beat, not a number — so the specific person has to
 * actually be visible, not represented by a generic icon.
 */
export const RivalCalloutCard: React.FC<RivalCalloutCardProps> = ({ leaderboard, myRank, myProfitPerMin, myAvatar }) => {
  if (myRank === null || myRank <= 1) return null;

  const rival = leaderboard[myRank - 2];
  if (!rival) return null;

  const gap = rival.profitPerMin - myProfitPerMin;
  if (gap <= 0) return null;

  // How close I am to them, as a fill fraction — this is what turns
  // "230/min behind" from a bare number into something with visible
  // momentum, the same reasoning behind every progress-bar-driven
  // competitive UI.
  const closeness = Math.max(0.08, Math.min(0.95, myProfitPerMin / rival.profitPerMin));

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-3.5 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #3D1A4A 0%, #6B1F3D 55%, #8A1F2E 100%)',
        boxShadow: '0 8px 20px rgba(120,20,50,0.35), inset 0 1.5px 0 rgba(255,255,255,0.18)',
      }}
    >
      <motion.div
        className="absolute -left-8 -bottom-8 w-32 h-32 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(255,60,90,0.35), transparent 70%)' }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0.9, 0.6] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative flex items-center justify-between">
        {/* Me */}
        <div className="flex flex-col items-center gap-1 w-16">
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center text-xl"
            style={{ backgroundColor: 'rgba(255,255,255,0.12)', border: '2px solid rgba(255,255,255,0.5)' }}
          >
            {myAvatar}
          </div>
          <span className="text-[9px] font-bold text-white/85">You</span>
        </div>

        {/* VS badge */}
        <motion.div
          className="flex flex-col items-center gap-0.5 px-2"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          <div
            className="px-2.5 py-1 rounded-full font-black text-[11px]"
            style={{ backgroundColor: '#FFD700', color: '#3D1A4A', boxShadow: '0 2px 8px rgba(255,215,0,0.5)' }}
          >
            VS
          </div>
          <span className="text-[8.5px] font-bold text-white/70 whitespace-nowrap">₹{gap.toLocaleString('en-IN')}/min</span>
        </motion.div>

        {/* Rival */}
        <div className="flex flex-col items-center gap-1 w-16">
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center text-xl"
            style={{ backgroundColor: 'rgba(255,255,255,0.12)', border: '2px solid #FF6B6B' }}
          >
            {rival.avatarEmoji}
          </div>
          <span className="text-[9px] font-bold truncate max-w-[64px] text-white/85">{rival.playerName}</span>
        </div>
      </div>

      <div className="relative mt-3">
        <div className="text-[10px] font-bold text-white/90 mb-1.5 text-center">
          Beat {rival.playerName} for <span style={{ color: '#FFD700' }}>#{myRank - 1}</span>
        </div>
        <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #FFD700, #FFA500)' }}
            initial={{ width: 0 }}
            animate={{ width: `${closeness * 100}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </div>
      </div>
    </motion.div>
  );
};
