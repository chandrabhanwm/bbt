import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Lock, Gift, Film, Flame, Clock } from 'lucide-react';
import { playClick, playUnlock } from '../utils/audio';
import { Business } from '../types';

interface AreaCardProps {
  businesses: Business[];
  progress: number; // 0 to 100%
  cash: number;
  onDoubleProfitToggle: (active: boolean) => void;
  activeDoubleProfit: boolean;
  doubleProfitTimeRemaining: number;
}

const BanknoteIcon: React.FC<{ className?: string; gray?: boolean }> = ({ className = "w-4 h-4", gray = false }) => (
  <svg viewBox="0 0 32 24" className={`${className} inline-block`} fill="none">
    <rect x="2" y="6" width="22" height="12" rx="2" fill={gray ? "#334155" : "#047857"} />
    <rect x="2" y="6" width="22" height="12" rx="2" fill={gray ? "#475569" : "#10b981"} stroke={gray ? "#334155" : "#047857"} strokeWidth="1" />
    <circle cx="13" cy="12" r="3" fill={gray ? "#64748b" : "#6ee7b7"} stroke={gray ? "#334155" : "#047857"} strokeWidth="1" />
    <rect x="6" y="2" width="22" height="12" rx="2" fill={gray ? "#059669" : "#059669"} />
    <rect x="6" y="2" width="22" height="12" rx="2" fill={gray ? "#475569" : "#34d399"} stroke={gray ? "#1e293b" : "#059669"} strokeWidth="1" />
    <circle cx="17" cy="8" r="3" fill={gray ? "#cbd5e1" : "#a7f3d0"} stroke={gray ? "#1e293b" : "#059669"} strokeWidth="1" />
  </svg>
);

export const AreaCard: React.FC<AreaCardProps> = ({
  businesses,
  progress,
  cash,
  onDoubleProfitToggle,
  activeDoubleProfit,
  doubleProfitTimeRemaining,
}) => {
  const [showAdModal, setShowAdModal] = useState(false);
  const [adCountdown, setAdCountdown] = useState(8); // short 8s fun ad simulation
  const [adBrand, setAdBrand] = useState('Basti Cola Co.');

  // Ad brands list to cycle through
  const BRANDS = [
    'Basti Cola Co. 🥤',
    'Chaiwala Crypto Coins 🪙',
    'Auto rickshaw Racing Pro 🛺',
    'Gully Cricket Manager 🏏',
    'Samosa Delivery Express 🥟'
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (showAdModal) {
      interval = setInterval(() => {
        setAdCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            handleAdComplete();
            return 8;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showAdModal]);

  const handleStartAd = () => {
    playClick();
    // Randomize brand
    setAdBrand(BRANDS[Math.floor(Math.random() * BRANDS.length)]);
    setAdCountdown(8);
    setShowAdModal(true);
  };

  const handleAdComplete = () => {
    setShowAdModal(false);
    onDoubleProfitToggle(true);
    playUnlock();
  };

  // Convert seconds to MM:SS
  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate actual businesses built
  const builtCount = businesses ? businesses.filter(b => b.level > 0).length : 0;

  return (
    <div id="area-card" className="flex flex-col gap-3.5 select-none w-full">
      
      {/* 1. AD BOOST BANNER (Sleek Horizontal banner style instead of a full card) */}
      <div className="relative overflow-hidden rounded-2xl vault-card px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group">
        {/* Real Glass Diagonal Specular Glare */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />

        <div className="flex items-center gap-3 relative z-10">
          <div className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--color-marigold-300)] via-[var(--color-marigold-400)] to-[var(--color-marigold-500)] text-slate-950 shadow-md">
            {activeDoubleProfit ? (
              <Flame size={18} className="text-slate-950 animate-pulse fill-current" />
            ) : (
              <Gift size={18} className="text-slate-950 fill-current animate-bounce" style={{ animationDuration: '3s' }} />
            )}
          </div>
          
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-display font-extrabold text-xs text-white uppercase tracking-wider">
                Double Market Income
              </h4>
              {activeDoubleProfit && (
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-money-400)] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-money-500)]"></span>
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-300 font-medium leading-tight mt-1">
              {activeDoubleProfit 
                ? "Your businesses are generating 2X profits right now!" 
                : "Watch a short sponsor ad to double your profits instantly!"}
            </p>
          </div>
        </div>

        {/* Action Button / Active Countdown */}
        <div className="flex-shrink-0 relative z-10 flex items-center sm:justify-end">
          {activeDoubleProfit ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--color-vault-950)]/90 border border-[var(--color-money-500)]/40 text-[10px] font-mono font-extrabold text-[var(--color-money-400)] shadow-sm">
              <span className="animate-pulse flex items-center gap-1">
                <Flame size={12} className="text-orange-400 fill-current animate-bounce" />
                <span>2X ACTIVE</span>
              </span>
              <span className="w-[1px] h-3 bg-[var(--color-vault-border)]" />
              <span className="flex items-center gap-1 text-[var(--color-money-300)]">
                <Clock size={11} className="text-[var(--color-money-400)]" />
                {formatTime(doubleProfitTimeRemaining)}
              </span>
            </div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleStartAd}
              className="flex items-center justify-center gap-1.5 py-1.5 px-4 bg-gradient-to-b from-[var(--color-marigold-300)] via-[var(--color-marigold-400)] to-[var(--color-marigold-500)] hover:brightness-110 text-slate-950 font-display font-extrabold text-[9.5px] uppercase tracking-wider rounded-xl shadow-[0_4px_12px_rgba(255,168,61,0.3)] border-b-[2px] border-[var(--color-marigold-600)] cursor-pointer active:border-b-0 active:translate-y-[2px]"
            >
              <Film size={11} className="text-slate-950 fill-current" />
              <span>Watch Ad ▶</span>
            </motion.button>
          )}
        </div>
      </div>

      {/* 2. AREA PROGRESS CARD (Redesigned to gorgeous Premium Dark Glossy style) */}
      <div className="relative overflow-hidden rounded-3xl vault-card p-4.5 flex justify-between group min-h-[145px]">
        
        {/* Real Glass Diagonal Specular Glare */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.02] to-white/[0.08] pointer-events-none" />
        {/* Specular Top highlight ridge */}
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />

        {/* Left Part: Text and Progress */}
        <div className="flex-1 flex flex-col justify-between relative z-10">
          <div>
            <div className="flex items-center justify-between pr-2">
              <div className="flex items-center gap-1.5">
                <MapPin size={15} className="text-rose-500 animate-pulse" />
                <h3 className="font-display font-extrabold text-[13px] tracking-tight text-white uppercase">
                  Gandhi Nagar Market
                </h3>
              </div>
              <span className="text-[10px] font-mono font-extrabold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-lg border border-emerald-500/20 shadow-sm">
                {builtCount} / 8 Built
              </span>
            </div>
            
            {/* Real-time Progressive Level Gauge */}
            <div className="mt-3.5">
              <div className="flex justify-between items-center text-[9.5px] font-bold text-slate-400">
                <span>Market Completion Progress</span>
                <span className="text-emerald-400 font-mono font-extrabold text-[10px]">
                  {Math.round(progress)}%
                </span>
              </div>
              
              {/* Solid Progress Bar with glow */}
              <div className="w-full h-2.5 bg-[var(--color-vault-950)] rounded-full mt-2 overflow-hidden border border-[var(--color-vault-border)]/60">
                <motion.div 
                  className="h-full bg-gradient-to-r from-[var(--color-money-400)] to-[var(--color-money-600)] rounded-full shadow-[0_0_8px_rgba(23,190,134,0.4)]"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>

              {/* Segmented display */}
              <div className="flex gap-1 mt-2">
                {[...Array(8)].map((_, i) => (
                  <div 
                    key={i} 
                    className={`h-2 flex-1 rounded-sm transition-all duration-500 ${
                      i < builtCount
                        ? 'bg-gradient-to-b from-[var(--color-money-400)] to-[var(--color-money-500)] shadow-[0_0_6px_rgba(23,190,134,0.4)]'
                        : 'bg-[var(--color-vault-950)] border border-[var(--color-vault-border)]/50'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Next Locked Milestone Area */}
          <div className="mt-3.5 flex items-center justify-between gap-1.5 p-1.5 rounded-xl bg-[var(--color-vault-950)]/90 border border-[var(--color-vault-border)]/60">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="w-4.5 h-4.5 rounded-lg bg-[var(--color-vault-950)] flex items-center justify-center border border-[var(--color-vault-border)]">
                <Lock size={9.5} className="text-slate-400" />
              </div>
              <div className="min-w-0">
                <div className="text-[6.5px] font-bold text-slate-500 uppercase tracking-wider leading-none">NEXT AREA</div>
                <div className="text-[9px] font-display font-extrabold text-white truncate mt-0.5 uppercase tracking-wide">
                  Pakke Bazar
                </div>
              </div>
            </div>
            <div className="text-[8.5px] font-mono font-bold text-[var(--color-marigold-400)] bg-[var(--color-marigold-500)]/10 px-2 py-0.5 rounded border border-[var(--color-marigold-500)]/30 whitespace-nowrap">
              Unlock at ₹10,00,000 Cash
            </div>
          </div>
        </div>

        {/* Right Part: Beautiful Illustrated Archway Gate Vector */}
        <div className="w-[85px] flex-shrink-0 flex items-center justify-center relative pointer-events-none select-none ml-2">
          <div className="absolute w-12 h-12 bg-[var(--color-marigold-400)]/10 rounded-full blur-xl animate-pulse"></div>
          <svg viewBox="0 0 100 110" className="w-full h-auto drop-shadow-md">
            {/* Gateway Base Pillars */}
            <rect x="15" y="80" width="12" height="15" fill="#64748b" rx="1" />
            <rect x="73" y="80" width="12" height="15" fill="#64748b" rx="1" />
            <rect x="17" y="40" width="8" height="42" fill="#94a3b8" />
            <rect x="75" y="40" width="8" height="42" fill="#94a3b8" />
            
            {/* Pillar Tops */}
            <rect x="14" y="36" width="14" height="4" fill="#475569" rx="0.5" />
            <rect x="72" y="36" width="14" height="4" fill="#475569" rx="0.5" />
            
            {/* Grand Arch Curve */}
            <path d="M21,38 A29,29 0 0,1 79,38" fill="none" stroke="#475569" strokeWidth="6" />
            <path d="M21,38 A29,29 0 0,1 79,38" fill="none" stroke="#6366f1" strokeWidth="3" />
            
            {/* Hanging Market Board Sign */}
            <rect x="30" y="34" width="40" height="12" fill="#fbbf24" stroke="#d97706" strokeWidth="1" rx="2" />
            <line x1="36" y1="34" x2="36" y2="30" stroke="#475569" strokeWidth="1" />
            <line x1="64" y1="34" x2="64" y2="30" stroke="#475569" strokeWidth="1" />
            <text x="50" y="41.5" fill="#78350f" fontSize="5" fontWeight="900" textAnchor="middle">
              GANDHI NAGAR
            </text>
            
            {/* Decorative Gold Crest on Top Center */}
            <polygon points="50,14 56,22 44,22" fill="#fbbf24" stroke="#d97706" strokeWidth="0.5" />
            <circle cx="50" cy="22" r="3" fill="#ef4444" />
            
            {/* Ground pathway */}
            <polygon points="5,95 95,95 75,108 25,108" fill="#cbd5e1" opacity="0.5" />
          </svg>
        </div>

      </div>

      {/* 3. SIMULATED VIDEO AD MODAL PLAYER OVERLAY */}
      <AnimatePresence>
        {showAdModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 select-none">
            
            {/* Video Canvas Container */}
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-sm bg-slate-900 border-2 border-slate-700 rounded-3xl overflow-hidden aspect-[9/16] shadow-2xl flex flex-col justify-between"
            >
              
              {/* Top Ad Strip */}
              <div className="p-4 bg-gradient-to-b from-black/80 to-transparent flex justify-between items-center relative z-10">
                <div className="flex items-center gap-1.5">
                  <div className="px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 text-[9px] font-extrabold tracking-wide uppercase">
                    SPONSORED AD
                  </div>
                  <span className="text-[10px] text-slate-300 font-bold">{adBrand}</span>
                </div>
                
                {/* Disabled skip lock */}
                <div className="px-2.5 py-1 rounded-full bg-black/60 border border-slate-800 text-[10px] font-mono font-extrabold text-amber-400 flex items-center gap-1">
                  <Clock size={11} className="animate-spin" />
                  <span>Reward in {adCountdown}s</span>
                </div>
              </div>

              {/* Central Dynamic Playback Showcase */}
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-950">
                
                {/* Retro CRT Screen Scanlines */}
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-white/5 to-transparent bg-[size:100%_4px] opacity-10"></div>
                
                {/* Floating graphic */}
                <motion.div 
                  animate={{ 
                    scale: [1, 1.12, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                  className="w-28 h-28 rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-indigo-600 p-0.5 flex items-center justify-center shadow-2xl glow-yellow mb-6"
                >
                  <div className="w-full h-full bg-slate-900 rounded-full flex flex-col items-center justify-center">
                    <span className="text-4xl filter drop-shadow">⚡️</span>
                  </div>
                </motion.div>

                <h2 className="font-display font-extrabold text-lg text-white leading-tight uppercase tracking-wide">
                  BECOME THE BASTI KINGPIN!
                </h2>
                <p className="text-xs text-slate-400 mt-2.5 max-w-[240px] leading-relaxed font-medium">
                  Boost your progress! Build stores, leverage upgrades, and outperform rivals.
                </p>

                {/* Progress ticker */}
                <div className="w-48 h-1.5 bg-slate-800 rounded-full mt-6 overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-amber-400 to-yellow-300 rounded-full"
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 8, ease: 'linear' }}
                  />
                </div>
              </div>

              {/* Bottom sponsor callout */}
              <div className="p-4 bg-gradient-to-t from-black/80 to-transparent text-center relative z-10">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                  Thank you for supporting Basti Business Tycoon!
                </span>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
