import React from 'react';
import { motion } from 'motion/react';
import { Swords } from 'lucide-react';
import { LeaderboardEntry } from '../services/SaveService';

interface RivalCalloutCardProps {
  /** Real leaderboard, top 20 only — see useCloudSync.ts's
   *  fetchTopLeaderboard(20). This card can only ever know about a
   *  rival within that fetched slice. */
  leaderboard: Array<LeaderboardEntry & { uid: string }>;
  /** This player's own real rank — null while still loading, or if it
   *  couldn't be determined yet. */
  myRank: number | null;
  myProfitPerMin: number;
}

/**
 * Turns the leaderboard from something a player checks occasionally
 * into a concrete, ambient target: "beat this specific person, by this
 * specific amount" sitting right in the main Home flow, not buried in a
 * separate tab.
 *
 * Deliberately silent (renders nothing) rather than showing a broken or
 * empty-looking card whenever the data needed isn't actually available:
 * rank #1 has no one above to beat, and any rank beyond the fetched
 * top-20 has a rival this component simply doesn't know about. Showing
 * nothing in those cases is more honest than showing a guess.
 */
export const RivalCalloutCard: React.FC<RivalCalloutCardProps> = ({ leaderboard, myRank, myProfitPerMin }) => {
  if (myRank === null || myRank <= 1) return null;

  // The player one position above me — index myRank-2, since myRank is
  // 1-indexed and this is the entry directly ahead of my own position
  // in the same ranking.
  const rival = leaderboard[myRank - 2];
  if (!rival) return null; // beyond the fetched top-20 — genuinely unknown, stay silent

  const gap = rival.profitPerMin - myProfitPerMin;
  if (gap <= 0) return null; // already ahead of or tied with this entry — nothing to chase

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl px-3 py-2.5 flex items-center gap-2.5"
      style={{
        background: 'linear-gradient(165deg, rgba(255,255,255,0.06) 0%, var(--color-premium-surface) 12%, var(--color-premium-surface) 100%)',
        boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(0,0,0,0.25), 0 6px 14px rgba(0,0,0,0.35)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: 'var(--color-premium-gold-400)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5), inset 0 -1.5px 0 rgba(0,0,0,0.2)' }}
      >
        <Swords size={13} color="var(--color-premium-text-inverse)" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-bold truncate" style={{ color: 'var(--color-premium-text)' }}>
          Beat {rival.playerName}
        </div>
        <div className="text-[9px] font-semibold" style={{ color: 'var(--color-premium-text-secondary)' }}>
          Only <span style={{ color: 'var(--color-premium-green-500)' }}>₹{gap.toLocaleString('en-IN')}/min</span> more to pass them
        </div>
      </div>

      <div
        className="px-2 py-1 rounded-lg font-bold text-[10px] flex-shrink-0"
        style={{ backgroundColor: 'var(--color-premium-elevated)', color: 'var(--color-premium-gold-400)', border: '1px solid var(--color-premium-gold-400)' }}
      >
        #{myRank - 1}
      </div>
    </motion.div>
  );
};
