import React from 'react';
import { motion } from 'motion/react';
import { MapPin, Lock, Unlock, Sparkles, Building2, HelpCircle, CheckCircle2 } from 'lucide-react';
import { playClick } from '../utils/audio';

interface CityTabProps {
  playerCash: number;
  currentProgress: number;
}

export const CityTab: React.FC<CityTabProps> = ({ playerCash, currentProgress }) => {
  
  const areas = [
    {
      id: 'gandhi_nagar',
      name: 'Gandhi Nagar Market',
      status: 'unlocked',
      description: 'The energetic baseline trade street of Basti, packed with local stalls and shopping complexes.',
      unlockedAt: 'Default Area',
      cost: 0,
      activeProgress: currentProgress,
      businesses: '8 Trade Shops',
      emoji: '📍',
      color: 'from-emerald-500 to-teal-600',
      illustration: 'market'
    },
    {
      id: 'pakke_bazar',
      name: 'Pakke Bazar Complex',
      status: playerCash >= 1000000 ? 'unlockable' : 'locked',
      description: 'Sleek administrative blocks, luxury boutique shops, and a massive multi-cuisine food plaza.',
      unlockedAt: '₹10,00,000 Cash',
      cost: 1000000,
      activeProgress: 0,
      businesses: '12 Boutique Complexes',
      emoji: '🏢',
      color: 'from-indigo-500 to-purple-600',
      illustration: 'complex'
    },
    {
      id: 'vip_district',
      name: 'VIP Club District',
      status: 'locked',
      description: 'Exclusive 5-star hotels, luxury casinos, high-end lounges, and expensive neon golf courses.',
      unlockedAt: '₹50,00,000 Cash',
      cost: 5000000,
      activeProgress: 0,
      businesses: '15 Elite Lounges',
      emoji: '🎰',
      color: 'from-rose-500 to-pink-600',
      illustration: 'club'
    },
    {
      id: 'airport_hub',
      name: 'Basti Airport Junction',
      status: 'locked',
      description: 'Mega aviation logistics, cargo warehouse networks, duty-free malls, and executive helicopter pads.',
      unlockedAt: '₹2,00,00,000 Cash',
      cost: 20000000,
      activeProgress: 0,
      businesses: '20 Aviation Gates',
      emoji: '✈️',
      color: 'from-amber-500 to-orange-600',
      illustration: 'airport'
    }
  ] as const;

  return (
    <div id="city-tab" className="p-4 space-y-4 pb-28 select-none">
      
      {/* City Map Banner */}
      <div className="relative overflow-hidden rounded-3xl toy-card p-5 text-center">
        <div className="absolute top-0 left-0 w-24 h-24 bg-[var(--color-marigold-400)]/10 rounded-full blur-xl pointer-events-none"></div>
        <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-[var(--color-money-400)]/10 rounded-full blur-xl pointer-events-none"></div>

        <h3 className="font-display font-extrabold text-sm text-slate-800 uppercase tracking-wider flex items-center justify-center gap-2">
          <Sparkles className="text-[var(--color-marigold-500)] animate-pulse" size={16} />
          Basti Metropolitan Roadmap
        </h3>
        <p className="text-[10px] text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed font-semibold">
          Expand your empire across new specialized districts. Accumulate raw funds in Gandhi Nagar to unlock massive city sectors.
        </p>
      </div>

      {/* ROADMAP NODES LIST */}
      <div className="space-y-4 relative">
        
        {/* Continuous connector line */}
        <div className="absolute left-9 top-8 bottom-8 w-[3px] bg-[var(--color-ink-700)/25] pointer-events-none"></div>

        {areas.map((area, idx) => {
          const isUnlocked = area.status === 'unlocked';
          const isUnlockable = area.status === 'unlockable';
          const lockStateColor = isUnlocked
            ? 'toy-card'
            : isUnlockable
            ? 'border-[var(--color-marigold-400)] bg-white shadow-md glow-marigold'
            : 'border-[var(--color-ink-700)/25] bg-white/60 backdrop-blur-md opacity-70';

          return (
            <div
              key={area.id}
              className={`relative rounded-3xl p-4 border transition-all duration-300 flex gap-4 ${lockStateColor}`}
            >
              {/* Connector Pin Node indicator */}
              <div className="flex flex-col items-center flex-shrink-0 z-10">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                  isUnlocked
                    ? 'bg-[var(--color-money-500)] border-[var(--color-money-400)] text-slate-950'
                    : isUnlockable
                    ? 'bg-[var(--color-marigold-400)] border-[var(--color-marigold-300)] text-slate-950 animate-bounce'
                    : 'bg-slate-100 border-slate-200 text-slate-400'
                }`}>
                  {isUnlocked ? <Unlock size={14} /> : <Lock size={14} />}
                </div>
                <div className="text-[9px] font-mono font-extrabold text-slate-400 mt-2">
                  Z-{idx + 1}
                </div>
              </div>

              {/* Node Body Content */}
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-display font-extrabold text-xs text-slate-800 tracking-tight flex items-center gap-1">
                      <span>{area.emoji}</span>
                      <span>{area.name}</span>
                    </h4>
                    
                    {/* Status badge */}
                    {isUnlocked ? (
                      <span className="px-2 py-0.5 rounded-full bg-[var(--color-money-500)]/10 text-[8px] font-extrabold uppercase text-[var(--color-money-600)] border border-[var(--color-money-500)]/20">
                        Active area
                      </span>
                    ) : isUnlockable ? (
                      <span className="px-2 py-0.5 rounded-full bg-[var(--color-marigold-400)]/15 text-[8px] font-extrabold uppercase text-[var(--color-marigold-600)] border border-[var(--color-marigold-400)]/25 animate-pulse">
                        Ready to buy
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[8px] font-semibold uppercase text-slate-400 border border-slate-200/60">
                        Locked
                      </span>
                    )}
                  </div>

                  <p className="text-[10px] text-slate-500 leading-relaxed mt-1.5 font-semibold">
                    {area.description}
                  </p>
                </div>

                {/* Foot indicators */}
                <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between gap-1 flex-wrap">
                  
                  <div className="text-[9px] text-slate-400 font-bold flex items-center gap-1">
                    <Building2 size={11} className="text-slate-400" />
                    <span>Houses: <span className="text-slate-600 font-semibold">{area.businesses}</span></span>
                  </div>

                  {isUnlocked ? (
                    <div className="w-24 text-right">
                      <div className="flex justify-between text-[8px] font-bold text-slate-400">
                        <span>Area Completion</span>
                        <span>{Math.round(area.activeProgress)}%</span>
                      </div>
                      <div className="w-full h-1 bg-slate-100 border border-slate-200/40 rounded-full mt-0.5 overflow-hidden">
                        <div className="h-full bg-[var(--color-money-500)]" style={{ width: `${area.activeProgress}%` }} />
                      </div>
                    </div>
                  ) : (
                    <div className="text-[9px] font-mono font-extrabold text-[var(--color-marigold-600)] bg-[var(--color-marigold-400)]/10 px-2 py-0.5 rounded border border-[var(--color-marigold-400)]/25">
                      Reqs: {area.unlockedAt}
                    </div>
                  )}

                </div>

              </div>

            </div>
          );
        })}

      </div>

    </div>
  );
};
