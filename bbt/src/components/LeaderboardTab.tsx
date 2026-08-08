import React, { useState, useEffect } from 'react';
import { Users, Store, TrendingUp as UpgradeIcon, Wallet, Gift } from 'lucide-react';
import { LeaderboardEntry } from '../services/SaveService';
import { formatCash } from '../utils/formatCash';
import { playClick } from '../utils/audio';
import { formatCooldownClock } from '../utils/cooldown';

/** A more compact net-worth format specifically for this table's subtitle
 *  line — formatCash's own full comma-grouped digits ("₹18,20,000") ran
 *  long enough to wrap onto a second line in this tighter row layout.
 *  Abbreviates in the same K/L/Cr tiers used elsewhere in the app. */
function formatCompactNetWorth(amount: number): string {
  const value = Math.max(0, amount);
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `₹${Math.round(value / 1000)}K`;
  return `₹${Math.floor(value)}`;
}

interface LeaderboardTabProps {
  /** Real players, fetched from Firestore — replaces the old hardcoded
   *  fictional rival list entirely. */
  leaderboard: Array<LeaderboardEntry & { uid: string }>;
  /** This player's own uid, to highlight their row if they're in the list. */
  myUid: string | null;
  /** This player's real rank, which may place them outside the fetched
   *  top list entirely — shown separately below if so. */
  myRank: number | null;
  playerName: string;
  playerAvatar: string;
  playerNetWorth: number;
  /** The player's own current income/min — the primary ranking value for
   *  the Overall tab. */
  playerProfitPerMin: number;
  /** Distinct businesses actually owned right now (level > 0) — NOT the
   *  cumulative buy+upgrade action counter. See
   *  getDistinctBusinessesOwnedCount for why these are genuinely
   *  different numbers. */
  playerDistinctBusinessesOwned: number;
  playerLevel: number;
  /** Weekly contest — same real-player-fetch pattern as the overall
   *  leaderboard above, just ordered by weeklyPoints instead of net
   *  worth. */
  weeklyContestBoard: Array<LeaderboardEntry & { uid: string }>;
  myWeeklyRank: number | null;
  myWeeklyPoints: number;
  /** Real wall-clock ms timestamp of the last leaderboard fetch — drives
   *  the visible "updating in Xm" countdown, so a 15-minute refresh
   *  interval reads as "on its own schedule" rather than "stale/broken." */
  lastLeaderboardFetchAt: number;
}

export const LeaderboardTab: React.FC<LeaderboardTabProps> = ({
  leaderboard,
  myUid,
  myRank,
  playerName,
  playerAvatar,
  playerNetWorth,
  playerProfitPerMin,
  playerDistinctBusinessesOwned,
  playerLevel,
  weeklyContestBoard,
  myWeeklyRank,
  myWeeklyPoints,
  lastLeaderboardFetchAt,
}) => {
  const [view, setView] = useState<'overall' | 'weekly'>('overall');

  // A plain re-render tick, once a second — this is what makes the
  // "updating in Xm" countdown clock actually drain live, the same
  // pattern already used for the scratch-card and Profit cooldowns.
  const [, forceTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => forceTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const LEADERBOARD_REFRESH_MS = 15 * 60 * 1000;
  const msSinceLastFetch = Date.now() - lastLeaderboardFetchAt;
  const msUntilNextFetch = Math.max(0, LEADERBOARD_REFRESH_MS - msSinceLastFetch);
  const secondsUntilNextFetch = Math.ceil(msUntilNextFetch / 1000);

  const activeBoard = view === 'overall' ? leaderboard : weeklyContestBoard;
  const amInTopList = myUid !== null && activeBoard.some((e) => e.uid === myUid);
  const myActiveRank = view === 'overall' ? myRank : myWeeklyRank;

  // A player's own row should always show their real, current name,
  // avatar, and live stats — not whatever was last fetched from
  // Firestore up to a few minutes ago. Without this, renaming yourself
  // (or a business you just bought) shows up instantly on Home/Portfolio
  // (which read live state) but could lag on the leaderboard until the
  // next periodic fetch, which reads as a sync bug even though nothing
  // is actually broken underneath.
  const withLiveSelf = (entry: LeaderboardEntry & { uid: string }) =>
    entry.uid === myUid
      ? {
          ...entry, playerName, avatarEmoji: playerAvatar, netWorth: playerNetWorth,
          profitPerMin: playerProfitPerMin, distinctBusinessesOwned: playerDistinctBusinessesOwned,
          level: playerLevel, weeklyPoints: myWeeklyPoints,
        }
      : entry;

  return (
    <div id="leaderboard-tab" className="p-4 space-y-4 pb-28 select-none" style={{ backgroundColor: 'var(--color-premium-bg)' }}>

      {/* Overall / Weekly Contest toggle */}
      <div className="flex rounded-2xl p-1" style={{ backgroundColor: 'var(--color-premium-elevated)' }}>
        {(['overall', 'weekly'] as const).map((v) => (
          <button
            key={v}
            onClick={() => { playClick(); setView(v); }}
            className="flex-1 py-2 rounded-xl text-[11.5px] font-bold cursor-pointer"
            style={{
              backgroundColor: view === v ? 'var(--color-premium-gold-400)' : 'transparent',
              color: view === v ? 'var(--color-premium-text-inverse)' : 'var(--color-premium-text-secondary)',
            }}
          >
            {v === 'overall' ? 'Overall' : 'Points'}
          </button>
        ))}
      </div>

      {/* A clear text countdown to the next real refresh — makes the
          15-minute interval read as "on its own schedule," not as
          stale or broken. */}
      <div
        className="flex items-center gap-2.5 rounded-2xl px-3 py-2.5"
        style={{ backgroundColor: 'var(--color-premium-surface)', border: '1px solid var(--color-premium-border)' }}
      >
        <div>
          <div className="text-[10.5px] font-bold" style={{ color: 'var(--color-premium-text)' }}>
            Leaderboard updates in {formatCooldownClock(secondsUntilNextFetch)}
          </div>
          <div className="text-[9px]" style={{ color: 'var(--color-premium-text-secondary)' }}>
            Rankings refresh automatically every 15 minutes.
          </div>
        </div>
      </div>

      {view === 'weekly' && <HowToEarnRow />}

      {activeBoard.length === 0 ? (
        <EmptyState />
      ) : (
        <LeaderboardTable
          entries={activeBoard.map(withLiveSelf)}
          myUid={myUid}
          amInTopList={amInTopList}
          myActiveRank={myActiveRank}
          valueType={view === 'overall' ? 'cash' : 'points'}
          myOwnRowFallback={{
            uid: myUid ?? 'me', playerName, avatarEmoji: playerAvatar, netWorth: playerNetWorth,
            profitPerMin: playerProfitPerMin, level: playerLevel, updatedAt: Date.now(), weeklyPoints: myWeeklyPoints,
            currentDistrictId: '', totalPlayTimeSeconds: 0, adsWatchedCount: 0, businessesBoughtCount: 0,
            poolClaimsCount: 0, distinctBusinessesOwned: playerDistinctBusinessesOwned,
          }}
        />
      )}
    </div>
  );
};

const HowToEarnRow: React.FC = () => {
  const items = [
    { icon: Store, label: 'Buy', color: '#c96b3f' },
    { icon: UpgradeIcon, label: 'Upgrade', color: '#4a90d9' },
    { icon: Wallet, label: 'Claim', color: '#f2c14e' },
    { icon: Gift, label: 'Scratch card', color: '#e05a9e' },
    { icon: Users, label: 'Refer a friend', color: '#5ac97a' },
  ];
  return (
    <div className="rounded-2xl p-3" style={{ backgroundColor: 'var(--color-premium-surface)', border: '1px solid var(--color-premium-border)' }}>
      <div className="text-[10.5px] font-bold mb-2" style={{ color: 'var(--color-premium-text)' }}>
        Every one of these earns +10 points
      </div>
      <div className="grid grid-cols-5 gap-1.5">
        {items.map(({ icon: Icon, label, color }) => (
          <div key={label} className="rounded-xl py-2 flex flex-col items-center gap-1" style={{ backgroundColor: 'var(--color-premium-elevated)' }}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: `${color}22` }}>
              <Icon size={14} color={color} />
            </div>
            <span className="text-[7px] font-bold text-center leading-tight" style={{ color: 'var(--color-premium-text)' }}>{label}</span>
            <span className="text-[9.5px] font-bold" style={{ color: 'var(--color-premium-green-500)' }}>+10</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const MEDALS = ['🥇', '🥈', '🥉'];

/** A single, unified table — header row plus every ranked player, top to
 *  bottom — replacing the earlier "top 3 as separate spotlight cards,
 *  everyone else as a plain list" split. Matches the requested reference
 *  layout: RK / Player / Businesses / ₹ per min as four aligned columns,
 *  with the current player's own row visually called out (gold name,
 *  left accent bar) wherever it actually falls in the ranking. */
const LeaderboardTable: React.FC<{
  entries: Array<LeaderboardEntry & { uid: string }>;
  myUid: string | null;
  amInTopList: boolean;
  myActiveRank: number | null;
  valueType: 'cash' | 'points';
  myOwnRowFallback: LeaderboardEntry & { uid: string };
}> = ({ entries, myUid, amInTopList, myActiveRank, valueType, myOwnRowFallback }) => {
  // If the player isn't in the fetched top list, their own row is
  // appended at the bottom with their real rank — real players can be
  // ranked far below the top list shown above, and they still deserve
  // to see where they stand, not be silently omitted.
  const rows = !amInTopList && myActiveRank !== null
    ? [...entries.map((e, i) => ({ entry: e, rank: i + 1 })), { entry: myOwnRowFallback, rank: myActiveRank }]
    : entries.map((e, i) => ({ entry: e, rank: i + 1 }));

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ backgroundColor: 'var(--color-premium-surface)', border: '1.5px solid var(--color-premium-border)' }}
    >
      {/* Column header */}
      <div
        className="flex items-center gap-3 px-3 py-2.5"
        style={{ backgroundColor: 'var(--color-premium-elevated)', borderBottom: '1px solid var(--color-premium-border)' }}
      >
        <span className="w-7 text-center text-[9px] font-bold tracking-wide flex-shrink-0" style={{ color: 'var(--color-premium-text-secondary)' }}>RK</span>
        <span className="flex-1 text-[9px] font-bold tracking-wide" style={{ color: 'var(--color-premium-text-secondary)' }}>PLAYER</span>
        {valueType === 'cash' && (
          <span className="w-16 text-center text-[9px] font-bold tracking-wide flex-shrink-0" style={{ color: 'var(--color-premium-text-secondary)' }}>BUSINESSES</span>
        )}
        <span className="w-20 text-right text-[9px] font-bold tracking-wide flex-shrink-0" style={{ color: 'var(--color-premium-text-secondary)' }}>
          {valueType === 'cash' ? '₹/MIN' : 'POINTS'}
        </span>
      </div>

      {rows.map(({ entry, rank }, i) => {
        const isMe = entry.uid === myUid;
        const isLast = i === rows.length - 1;
        return (
          <div
            key={entry.uid + '-' + rank}
            className="flex items-center gap-3 px-3 py-3"
            style={{
              backgroundColor: isMe ? 'rgba(212,167,44,0.07)' : undefined,
              borderBottom: isLast ? 'none' : '1px solid var(--color-premium-border)',
              borderLeft: isMe ? '3px solid var(--color-premium-gold-400)' : '3px solid transparent',
            }}
          >
            {/* Rank — a medal for the actual top 3 positions, plain "#N"
                text otherwise. Uses the real rank number, not the row's
                position in this particular list, so this stays correct
                even for the appended below-the-fold "my rank" row. */}
            <span className="w-7 text-center text-[15px] flex-shrink-0" style={{ color: 'var(--color-premium-text-secondary)' }}>
              {rank <= 3 ? MEDALS[rank - 1] : <span className="text-[11px] font-bold">#{rank}</span>}
            </span>

            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-base flex-shrink-0"
              style={{ backgroundColor: 'var(--color-premium-elevated)', border: '1.5px solid var(--color-premium-border)' }}
            >
              {entry.avatarEmoji}
            </div>

            <div className="flex-1 min-w-0">
              <span className="text-[12.5px] font-bold truncate block" style={{ color: isMe ? 'var(--color-premium-gold-400)' : 'var(--color-premium-text)' }}>
                {isMe ? 'You' : entry.playerName}
              </span>
              <span className="text-[9px] font-medium whitespace-nowrap" style={{ color: 'var(--color-premium-text-secondary)' }}>
                {formatCompactNetWorth(entry.netWorth)} net worth
              </span>
            </div>

            {valueType === 'cash' && (
              <span className="w-16 text-center text-[13px] font-bold flex-shrink-0" style={{ color: 'var(--color-premium-text)' }}>
                {entry.distinctBusinessesOwned}
              </span>
            )}

            <span
              className="w-20 text-right text-[12.5px] font-bold flex-shrink-0"
              style={{ color: valueType === 'cash' ? 'var(--color-premium-green-500)' : 'var(--color-premium-gold-400)' }}
            >
              {valueType === 'cash' ? `₹${entry.profitPerMin.toLocaleString('en-IN')}` : `${entry.weeklyPoints} pts`}
            </span>
          </div>
        );
      })}
    </div>
  );
};

const EmptyState: React.FC = () => (
  <div
    className="rounded-2xl p-8 flex flex-col items-center text-center"
    style={{ backgroundColor: 'var(--color-premium-surface)', border: '1.5px solid var(--color-premium-border)' }}
  >
    <Users size={28} color="var(--color-premium-text-secondary)" strokeWidth={1.5} />
    <span className="text-[13px] font-bold mt-3" style={{ color: 'var(--color-premium-text)' }}>
      Rankings loading
    </span>
    <span className="text-[11px] font-medium mt-1 max-w-[220px]" style={{ color: 'var(--color-premium-text-secondary)' }}>
      Give it a moment — real player rankings are being fetched.
    </span>
  </div>
);
