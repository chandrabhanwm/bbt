import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Lock, ShoppingCart, ArrowUpCircle } from 'lucide-react';
import { Business } from '../types';
import { playClick, playUpgrade, playUnlock, playError } from '../utils/audio';
import { CoinBurst } from './FX';

interface BusinessCardProps {
  business: Business;
  cash: number;
  onUpgrade: (id: string) => void;
  index: number;
}

const BanknoteIcon: React.FC<{ className?: string; gray?: boolean }> = ({ className = "w-4 h-4", gray = false }) => (
  <svg viewBox="0 0 32 24" className={`${className} inline-block`} fill="none">
    <rect x="2" y="6" width="22" height="12" rx="2" fill={gray ? "#334155" : "#047857"} />
    <rect x="2" y="6" width="22" height="12" rx="2" fill={gray ? "#475569" : "#10b981"} stroke={gray ? "#334155" : "#047857"} strokeWidth="1" />
    <circle cx="13" cy="12" r="3" fill={gray ? "#64748b" : "#6ee7b7"} stroke={gray ? "#334155" : "#047857"} strokeWidth="1" />
    <rect x="6" y="2" width="22" height="12" rx="2" fill={gray ? "#1e293b" : "#059669"} />
    <rect x="6" y="2" width="22" height="12" rx="2" fill={gray ? "#475569" : "#34d399"} stroke={gray ? "#1e293b" : "#059669"} strokeWidth="1" />
    <circle cx="17" cy="8" r="3" fill={gray ? "#cbd5e1" : "#a7f3d0"} stroke={gray ? "#1e293b" : "#059669"} strokeWidth="1" />
  </svg>
);

export const BusinessCard: React.FC<BusinessCardProps> = ({
  business,
  cash,
  onUpgrade,
  index
}) => {
  const isLocked = business.level === 0;
  const isAffordable = cash >= business.cost;
  const [showBurst, setShowBurst] = useState(false);
  const [pop, setPop] = useState(false);

  // Milestone ring: every 10 levels is a full lap, giving a sense of steady climb
  const milestonePct = ((business.level % 10) / 10) * 100;

  const handleAction = () => {
    if (!isAffordable) {
      playError();
      return;
    }
    if (isLocked) {
      playUnlock();
    } else {
      playUpgrade();
    }
    onUpgrade(business.id);
    setPop(true);
    setShowBurst(true);
    setTimeout(() => setPop(false), 380);
    setTimeout(() => setShowBurst(false), 1000);
  };

  const buttonStyle = isLocked
    ? (isAffordable
        ? 'bg-gradient-to-b from-[var(--color-marigold-300)] via-[var(--color-marigold-400)] to-[var(--color-marigold-500)] hover:brightness-110 text-slate-950 shadow-[0_4px_12px_rgba(245,158,11,0.3),inset_0_1px_1px_rgba(255,255,255,0.4)] border-b-[3px] border-[var(--color-marigold-600)] active:border-b-0 active:translate-y-[3px] cursor-pointer'
        : 'bg-[var(--color-vault-700)] text-slate-500 border border-[var(--color-vault-border)] cursor-not-allowed opacity-50')
    : (isAffordable
        ? 'bg-gradient-to-b from-[var(--color-money-300)] via-[var(--color-money-400)] to-[var(--color-money-500)] hover:brightness-110 text-slate-950 shadow-[0_4px_14px_rgba(23,190,134,0.35),inset_0_1px_2px_rgba(255,255,255,0.4)] border-b-[3px] border-[var(--color-money-600)] active:border-b-0 active:translate-y-[3px] cursor-pointer'
        : 'bg-[var(--color-vault-700)] text-slate-500 border border-[var(--color-vault-border)] cursor-not-allowed opacity-50');

  return (
    <div
      className={`relative rounded-2xl p-3.5 vault-card transition-all duration-300 flex items-center justify-between gap-3.5 hover:border-[var(--color-marigold-500)]/40 overflow-hidden group ${pop ? 'animate-juicy-pop' : ''}`}
    >
      {/* Real Glass Diagonal Specular Glare */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.02] to-white/[0.08] pointer-events-none" />
      {/* Specular Top highlight ridge */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />

      {showBurst && <CoinBurst />}

      {/* LEFT COLUMN: Shop Illustration Thumbnail with custom base, level-ring & index badge */}
      <div className="relative w-16 h-16 bg-[var(--color-vault-950)] rounded-xl border border-[var(--color-vault-border)] flex items-center justify-center flex-shrink-0 shadow-inner overflow-visible">
        {!isLocked && (
          <svg viewBox="0 0 64 64" className="absolute -inset-1 w-[68px] h-[68px]">
            <circle cx="32" cy="32" r="30" fill="none" stroke="var(--color-vault-700)" strokeWidth="2.5" />
            <circle
              cx="32" cy="32" r="30" fill="none"
              stroke="var(--color-marigold-400)" strokeWidth="2.5" strokeLinecap="round"
              strokeDasharray={`${milestonePct * 1.885} 188.5`}
              transform="rotate(-90 32 32)"
              style={{ transition: 'stroke-dasharray 0.4s ease-out' }}
            />
          </svg>
        )}
        <div className={`w-14 h-14 transition-all duration-300 ${isLocked ? 'opacity-35 filter grayscale brightness-75' : ''}`}>
          <MiniShopSVG business={business} index={index} />
        </div>

        {/* Level Pin Badge (3D Gold gloss theme) */}
        <div className={`absolute -top-1.5 -left-1.5 flex items-center justify-center w-5.5 h-5.5 rounded-full font-display font-bold text-[9.5px] shadow-lg border transition-all duration-300 ${
          isLocked
            ? 'bg-[var(--color-vault-700)] border-[var(--color-vault-border)] text-slate-400'
            : 'bg-gradient-to-br from-[var(--color-marigold-400)] to-[var(--color-marigold-600)] border-[var(--color-marigold-300)] text-slate-950'
        }`}>
          {index + 1}
        </div>
      </div>

      {/* CENTER COLUMN: Name, level, description, and profit rate */}
      <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
        <h4 className="font-display font-bold text-[13px] text-white leading-tight uppercase tracking-wider group-hover:text-[var(--color-marigold-400)] transition-colors">
          {business.name}
        </h4>

        {/* Helper description text, shown clearly */}
        <p className="text-[9.5px] text-slate-400 font-medium leading-relaxed group-hover:text-slate-300 transition-colors">
          {business.description}
        </p>

        <div className="flex items-center gap-1.5 mt-0.5">
          {/* Profit rate badge */}
          <div className="flex items-center gap-1 bg-[var(--color-vault-950)] px-2 py-0.5 rounded border border-[var(--color-vault-border)]/60">
            <BanknoteIcon className="w-3.5 h-2.5" gray={isLocked} />
            <span className="text-[7.5px] font-bold text-slate-500 uppercase tracking-wider">Profit:</span>
            <span className={`text-[10px] font-display font-bold tracking-tight ${isLocked ? 'text-slate-500' : 'text-[var(--color-money-400)]'}`}>
              ₹{isLocked ? (business.baseProfitPerMin).toLocaleString('en-IN') : (business.profitPerMin).toLocaleString('en-IN')}
              <span className="text-[8px] text-slate-500 font-sans font-normal lowercase tracking-normal"> /min</span>
            </span>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Action Button Column with Level Badge on top */}
      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        {/* Level / Lock indicator placed just above upgrade button top side */}
        {isLocked ? (
          <span className="px-2 py-0.5 rounded bg-[var(--color-vault-700)] text-[8px] font-bold text-slate-400 uppercase tracking-widest border border-[var(--color-vault-border)] leading-none shadow-sm">
            Locked
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded bg-gradient-to-r from-[var(--color-money-500)]/20 to-[var(--color-money-400)]/5 text-[8.5px] font-bold text-[var(--color-money-400)] uppercase tracking-widest border border-[var(--color-money-500)]/30 leading-none shadow-sm">
            Level {business.level}
          </span>
        )}

        {/* Upgrade / Buy Button with cost integrated inside */}
        <motion.button
          whileTap={isAffordable ? { scale: 0.95 } : {}}
          onClick={handleAction}
          className={`relative py-2 px-3.5 rounded-xl font-display font-bold uppercase tracking-wider flex flex-col items-center justify-center gap-0.5 cursor-pointer min-w-[105px] min-h-[44px] transition-all ${buttonStyle} ${isAffordable && isLocked ? 'animate-shimmer' : ''}`}
          disabled={!isAffordable}
        >
          {isLocked ? (
            isAffordable ? (
              <>
                <div className="flex items-center gap-1">
                  <ShoppingCart size={11} className="fill-current" />
                  <span className="text-[10px] font-extrabold tracking-wide">BUY</span>
                </div>
                <span className="text-[9.5px] font-mono font-extrabold tracking-tight text-slate-950 mt-0.5">
                  ₹{(business.cost).toLocaleString('en-IN')}
                </span>
              </>
            ) : (
              <>
                <div className="flex items-center gap-1 opacity-70">
                  <Lock size={11} />
                  <span className="text-[10px] font-extrabold tracking-wide">BUY</span>
                </div>
                <span className="text-[9.5px] font-mono font-extrabold tracking-tight text-slate-400 mt-0.5">
                  ₹{(business.cost).toLocaleString('en-IN')}
                </span>
              </>
            )
          ) : (
            isAffordable ? (
              <>
                <div className="flex items-center gap-1">
                  <ArrowUpCircle size={11} />
                  <span className="text-[10px] font-extrabold tracking-wide">UPGRADE</span>
                </div>
                <span className="text-[9.5px] font-mono font-extrabold tracking-tight text-slate-950 mt-0.5">
                  ₹{(business.cost).toLocaleString('en-IN')}
                </span>
              </>
            ) : (
              <>
                <div className="flex items-center gap-1 opacity-70">
                  <ArrowUpCircle size={11} />
                  <span className="text-[10px] font-extrabold tracking-wide">UPGRADE</span>
                </div>
                <span className="text-[9.5px] font-mono font-extrabold tracking-tight text-slate-400 mt-0.5">
                  ₹{(business.cost).toLocaleString('en-IN')}
                </span>
              </>
            )
          )}
        </motion.button>
      </div>

    </div>
  );
};

// --------------------------------------------------------------------------------------------------
// MINI-SHOP VECTOR RENDERER
// Draws custom, highly relevant, gorgeous vector illustrations for each shop type
// --------------------------------------------------------------------------------------------------
const MiniShopSVG: React.FC<{ business: Business; index: number }> = ({ business, index }) => {
  const accent = business.themeColor;
  
  switch (business.id) {
    case 'tea_stall':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
          <circle cx="50" cy="50" r="45" fill="url(#glossyTea)" />
          <defs>
            <radialGradient id="glossyTea" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#047857" stopOpacity="0.1" />
            </radialGradient>
          </defs>
          {/* Wood Counter */}
          <rect x="15" y="65" width="70" height="18" rx="3" fill="#7c2d12" />
          <rect x="12" y="60" width="76" height="5" fill="#9a3412" rx="1" />
          {/* Gas burner stove */}
          <rect x="22" y="50" width="22" height="10" fill="#334155" rx="1.5" />
          <circle cx="33" cy="48" r="2.5" fill="#ef4444" />
          {/* Boiling kettle */}
          <path d="M25,50 L41,50 L39,36 L27,36 Z" fill="#94a3b8" />
          <path d="M29,36 C29,31 37,31 37,36" fill="none" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M41,40 L46,35" fill="none" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
          {/* Steaming Smoke */}
          <path d="M33,28 Q35,23 31,18 T35,10" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
          {/* Indian Chai glasses */}
          <rect x="52" y="52" width="7" height="9" fill="#e2e8f0" opacity="0.8" rx="1" />
          <rect x="53" y="55" width="5" height="4" fill="#f59e0b" opacity="0.9" />
          <rect x="63" y="52" width="7" height="9" fill="#e2e8f0" opacity="0.8" rx="1" />
          <rect x="64" y="55" width="5" height="4" fill="#f59e0b" opacity="0.9" />
          {/* Floating emoji */}
          <text x="74" y="32" fontSize="22" textAnchor="middle" className="filter drop-shadow-md">☕</text>
        </svg>
      );

    case 'bakery':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
          <circle cx="50" cy="50" r="45" fill="url(#glossyBakery)" />
          <defs>
            <radialGradient id="glossyBakery" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#b45309" stopOpacity="0.1" />
            </radialGradient>
          </defs>
          {/* Dark Glass Bakery Front */}
          <rect x="16" y="44" width="68" height="42" fill="#0f172a" rx="4" stroke="#d97706" strokeWidth="2" />
          {/* Counter rack shelves */}
          <line x1="20" y1="62" x2="80" y2="62" stroke="#7c2d12" strokeWidth="2" />
          <line x1="20" y1="74" x2="80" y2="74" stroke="#7c2d12" strokeWidth="2" />
          {/* Display buns & croissants inside */}
          <circle cx="30" cy="54" r="4" fill="#ea580c" />
          <path d="M46,51 C42,51 40,57 46,57 C52,57 50,51 46,51" fill="#f59e0b" />
          <rect x="60" y="51" width="8" height="6" fill="#fbbf24" rx="1" />
          <circle cx="64" cy="50" r="2.5" fill="#ef4444" />
          {/* Bakery Orange-White Awning */}
          <path d="M12,32 L88,32 L80,44 L20,44 Z" fill="#ea580c" />
          <path d="M20,32 L30,32 L26,44 L16,44 Z" fill="#ffffff" />
          <path d="M40,32 L50,32 L46,44 L36,44 Z" fill="#ffffff" />
          <path d="M60,32 L72,32 L68,44 L58,44 Z" fill="#ffffff" />
          {/* Floating emoji */}
          <text x="50" y="22" fontSize="22" textAnchor="middle" className="filter drop-shadow-md">🍞</text>
        </svg>
      );

    case 'clothing':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
          <circle cx="50" cy="50" r="45" fill="url(#glossyClothing)" />
          <defs>
            <radialGradient id="glossyClothing" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.1" />
            </radialGradient>
          </defs>
          {/* Store window layout */}
          <rect x="16" y="38" width="68" height="48" fill="#030712" rx="4" stroke="#2563eb" strokeWidth="2" />
          {/* Clothing racks */}
          <line x1="22" y1="52" x2="54" y2="52" stroke="#64748b" strokeWidth="1.5" />
          {/* Hanging items */}
          <path d="M28,52 L28,68" stroke="#ef4444" strokeWidth="4.5" strokeLinecap="round" />
          <path d="M38,52 L38,70" stroke="#3b82f6" strokeWidth="4.5" strokeLinecap="round" />
          <path d="M48,52 L48,65" stroke="#10b981" strokeWidth="4.5" strokeLinecap="round" />
          {/* Mannequin wearing pink apparel */}
          <line x1="68" y1="48" x2="68" y2="78" stroke="#475569" strokeWidth="2" />
          <line x1="62" y1="78" x2="74" y2="78" stroke="#475569" strokeWidth="2.5" />
          <path d="M60,54 L76,54 L72,66 L64,66 Z" fill="#ec4899" rx="1.5" />
          {/* Floating emoji */}
          <text x="50" y="21" fontSize="22" textAnchor="middle" className="filter drop-shadow-md">👕</text>
        </svg>
      );

    case 'medical':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
          <circle cx="50" cy="50" r="45" fill="url(#glossyMedical)" />
          <defs>
            <radialGradient id="glossyMedical" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#22c55e" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#15803d" stopOpacity="0.1" />
            </radialGradient>
          </defs>
          {/* Medical glass counter */}
          <rect x="16" y="40" width="68" height="46" fill="#022c16" rx="4" stroke="#10b981" strokeWidth="2" />
          {/* Pharmacy Cabinets */}
          <line x1="20" y1="55" x2="80" y2="55" stroke="#047857" strokeWidth="1.5" />
          <line x1="20" y1="70" x2="80" y2="70" stroke="#047857" strokeWidth="1.5" />
          {/* Colorful medicine bottles */}
          <rect x="25" y="45" width="6" height="10" fill="#38bdf8" rx="1" />
          <rect x="34" y="47" width="5" height="8" fill="#f43f5e" rx="1" />
          <rect x="44" y="59" width="7" height="11" fill="#eab308" rx="1" />
          <rect x="54" y="61" width="6" height="9" fill="#ffffff" rx="1" />
          {/* Neon Medical Cross Sign */}
          <rect x="66" y="46" width="11" height="4" fill="#10b981" rx="0.5" />
          <rect x="69.5" y="42.5" width="4" height="11" fill="#10b981" rx="0.5" />
          {/* Floating emoji */}
          <text x="50" y="21" fontSize="22" textAnchor="middle" className="filter drop-shadow-md">💊</text>
        </svg>
      );

    case 'restaurant':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
          <circle cx="50" cy="50" r="45" fill="url(#glossyRest)" />
          <defs>
            <radialGradient id="glossyRest" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#b91c1c" stopOpacity="0.1" />
            </radialGradient>
          </defs>
          {/* Restaurant interior table booth */}
          <rect x="16" y="45" width="68" height="41" fill="#2d0202" rx="4" stroke="#f43f5e" strokeWidth="2" />
          {/* Table */}
          <rect x="26" y="66" width="48" height="18" fill="#7c2d12" rx="2" />
          {/* Dining curry plate */}
          <circle cx="38" cy="62" r="6.5" fill="#f8fafc" />
          <circle cx="38" cy="62" r="4" fill="#d97706" />
          {/* Spoons / Cutlery */}
          <line x1="47" y1="60" x2="47" y2="65" stroke="#94a3b8" strokeWidth="1.5" />
          {/* Wine glass */}
          <path d="M54,56 L58,56 L57,63 L55,63 Z" fill="#38bdf8" />
          {/* Hanging modern warm lantern */}
          <line x1="50" y1="45" x2="50" y2="49" stroke="#f43f5e" strokeWidth="2.5" />
          <polygon points="45,49 55,49 53,55 47,55" fill="#fbbf24" />
          {/* Floating curry bowl emoji */}
          <text x="74" y="32" fontSize="21" textAnchor="middle" className="filter drop-shadow-md">🍛</text>
        </svg>
      );

    case 'mobile_shop':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
          <circle cx="50" cy="50" r="45" fill="url(#glossyMobile)" />
          <defs>
            <radialGradient id="glossyMobile" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#4338ca" stopOpacity="0.1" />
            </radialGradient>
          </defs>
          {/* Cyberpunk display glass stand */}
          <rect x="16" y="40" width="68" height="46" fill="#020617" rx="4" stroke="#818cf8" strokeWidth="2.5" />
          {/* Cyber glow neon horizontal display bars */}
          <line x1="20" y1="55" x2="80" y2="55" stroke="#4f46e5" strokeWidth="1.5" />
          <line x1="20" y1="71" x2="80" y2="71" stroke="#4f46e5" strokeWidth="1.5" />
          {/* Interactive neon phone models */}
          <rect x="25" y="44" width="7" height="11" fill="#1e1b4b" stroke="#38bdf8" strokeWidth="1" rx="1" />
          <circle cx="28.5" cy="52" r="0.5" fill="#38bdf8" />
          
          <rect x="37" y="44" width="7" height="11" fill="#1e1b4b" stroke="#34d399" strokeWidth="1" rx="1" />
          <circle cx="40.5" cy="52" r="0.5" fill="#34d399" />
          
          <rect x="52" y="60" width="8" height="11" fill="#1e1b4b" stroke="#f43f5e" strokeWidth="1" rx="1" />
          <circle cx="56" cy="68" r="0.5" fill="#f43f5e" />
          
          <rect x="66" y="60" width="8" height="11" fill="#1e1b4b" stroke="#fbbf24" strokeWidth="1" rx="1" />
          <circle cx="70" cy="68" r="0.5" fill="#fbbf24" />
          {/* Floating phone emoji */}
          <text x="50" y="21" fontSize="22" textAnchor="middle" className="filter drop-shadow-md">📱</text>
        </svg>
      );

    case 'jewellery':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
          <circle cx="50" cy="50" r="45" fill="url(#glossyJewel)" />
          <defs>
            <radialGradient id="glossyJewel" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#eab308" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#a16207" stopOpacity="0.1" />
            </radialGradient>
          </defs>
          {/* Royal gold & dark red vault casing */}
          <rect x="16" y="45" width="68" height="41" fill="#1e0505" rx="4" stroke="#fbbf24" strokeWidth="2.5" />
          {/* Central Pedestal glass arch */}
          <path d="M36,70 A14,14 0 0,1 64,70 Z" fill="none" stroke="#22d3ee" strokeWidth="1.5" strokeDasharray="2,2" />
          <rect x="45" y="68" width="10" height="14" fill="#b45309" rx="1.5" />
          {/* High-carat shining diamond */}
          <polygon points="50,57 55,62 50,67 45,62" fill="#38bdf8" />
          <circle cx="50" cy="62" r="1.5" fill="#ffffff" />
          {/* Gold bars on left shelf */}
          <line x1="22" y1="56" x2="32" y2="56" stroke="#fbbf24" strokeWidth="2.5" />
          <line x1="24" y1="52" x2="30" y2="52" stroke="#fbbf24" strokeWidth="2" />
          {/* Floating emoji */}
          <text x="74" y="32" fontSize="21" textAnchor="middle" className="filter drop-shadow-md">💍</text>
        </svg>
      );

    case 'shopping_complex':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
          <circle cx="50" cy="50" r="45" fill="url(#glossyComplex)" />
          <defs>
            <radialGradient id="glossyComplex" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ec4899" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#be185d" stopOpacity="0.1" />
            </radialGradient>
          </defs>
          {/* Grand multistory modern glass plaza mall */}
          <rect x="24" y="34" width="52" height="53" fill="#1e1b4b" rx="2" stroke="#f472b6" strokeWidth="2.5" />
          {/* High-end Neon Windows Matrix */}
          <rect x="30" y="41" width="11" height="11" fill="#22d3ee" opacity="0.6" rx="1.5" />
          <rect x="44" y="41" width="12" height="11" fill="#22d3ee" opacity="0.6" rx="1.5" />
          <rect x="59" y="41" width="11" height="11" fill="#22d3ee" opacity="0.6" rx="1.5" />
          
          <rect x="30" y="56" width="11" height="11" fill="#22d3ee" opacity="0.6" rx="1.5" />
          <rect x="44" y="56" width="12" height="11" fill="#22d3ee" opacity="0.6" rx="1.5" />
          <rect x="59" y="56" width="11" height="11" fill="#22d3ee" opacity="0.6" rx="1.5" />
          {/* Mall Glass entrance door */}
          <rect x="43" y="71" width="14" height="16" fill="#f43f5e" rx="1" />
          {/* Grand dome design arch on rooftop */}
          <path d="M34,34 A16,16 0 0,1 66,34 Z" fill="none" stroke="#ec4899" strokeWidth="2" />
          {/* Floating complex emoji */}
          <text x="50" y="19" fontSize="21" textAnchor="middle" className="filter drop-shadow-md">🏬</text>
        </svg>
      );

    default:
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
          <circle cx="50" cy="50" r="42" fill={accent} opacity="0.1" />
          <polygon points="15,65 50,45 85,65 50,85" fill="#cbd5e1" opacity="0.6" />
          <polygon points="28,60 50,71 50,44 28,33" fill={accent} />
          <polygon points="50,71 72,60 72,33 50,44" fill={accent} opacity="0.8" />
          <polygon points="28,33 50,44 72,33 50,22" fill="#ffffff" opacity="0.25" />
          <text x="50" y="52" fontSize="28" textAnchor="middle" dominantBaseline="middle" className="filter drop-shadow-md">
            {business.emoji}
          </text>
        </svg>
      );
  }
};
