import React, { useState } from 'react';
import {
  Train, Factory, Building2, Hospital, Bus, Store, Trees, Landmark,
  ShoppingBag, Flag, Lock, Check, LucideIcon
} from 'lucide-react';
import { District, DistrictIconName } from '../../data/cityMapData';
import { DistrictProgressSummary } from '../../utils/districtProgress';

export const DISTRICT_ICONS: Record<DistrictIconName, LucideIcon> = {
  train: Train,
  factory: Factory,
  building: Building2,
  hospital: Hospital,
  bus: Bus,
  store: Store,
  trees: Trees,
  landmark: Landmark,
  'shopping-bag': ShoppingBag,
  flag: Flag,
};

interface DistrictNodeProps {
  district: District;
  onSelect: (district: District) => void;
  /** Live unlock status. Falls back to district.unlocked (static) if omitted. */
  unlocked?: boolean;
  /** Live completion/stars. Falls back to district.completed (static) if omitted. */
  progress?: DistrictProgressSummary;
}

/**
 * A single premium information node on the city map — a real illustrated
 * 3D icon (Microsoft's open-source Fluent Emoji set, chosen per district's
 * actual theme — a train for Railway Station, a factory for Plastic
 * Complex, and so on — not a generic storefront reused everywhere), name,
 * income, completion %, and unlock status. Falls back to the original
 * small line-icon if a given district's image ever fails to load, so nothing
 * breaks if a future district is added without art yet.
 */
export const DistrictNode: React.FC<DistrictNodeProps> = ({ district, onSelect, unlocked, progress }) => {
  const [iconFailed, setIconFailed] = useState(false);
  const FallbackIcon = DISTRICT_ICONS[district.icon];
  const isUnlocked = unlocked ?? district.unlocked;
  const isCompleted = progress?.completed ?? district.completed;
  const income = progress?.income ?? 0;
  const completionPercent = progress?.completionPercent ?? 0;
  const status = isCompleted ? 'completed' : isUnlocked ? 'unlocked' : 'locked';

  const borderColor =
    status === 'completed' ? 'var(--color-premium-green-500)' :
    status === 'unlocked' ? 'var(--color-premium-gold-400)' :
    'var(--color-premium-border-strong)';

  const iconColor = status === 'locked' ? 'var(--color-premium-text-secondary)' : 'var(--color-premium-text)';

  return (
    <g
      transform={`translate(${district.x}, ${district.y})`}
      onClick={() => onSelect(district)}
      className="cursor-pointer"
      role="button"
      aria-label={`${district.name} — ${status}`}
    >
      {/* Soft neutral elevation shadow — not a colored glow */}
      <ellipse cx="0" cy="4" rx="30" ry="7" fill="var(--color-premium-shadow-neutral)" opacity="0.24" />

      {/* Main node disc — enlarged to give the illustrated icon real room.
          Border transitions smoothly (not a snap) when status changes —
          same "road lights up" principle as RoadPath. */}
      <circle
        r="32"
        fill="var(--color-premium-surface)"
        stroke={borderColor}
        strokeWidth={status === 'locked' ? 1.5 : 2}
        style={{ transition: 'stroke 0.7s ease, stroke-width 0.7s ease' }}
      />

      {/* Illustrated 3D district icon, or the original line-icon as a
          fallback if this district's art fails to load */}
      <foreignObject x="-11" y="-11" width="22" height="22" style={{ pointerEvents: 'none' }}>
        <div className="w-full h-full flex items-center justify-center">
          {iconFailed ? (
            <FallbackIcon size={14} strokeWidth={1.75} color={iconColor} />
          ) : (
            <img
              src={`/assets/district-icons/${district.id}.png`}
              alt=""
              className="w-full h-full object-contain"
              style={{ opacity: status === 'locked' ? 0.82 : 1, filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.4))' }}
              onError={() => setIconFailed(true)}
            />
          )}
        </div>
      </foreignObject>

      {/* Lock indicator for locked districts */}
      {status === 'locked' && (
        <g transform="translate(21, -21)">
          <circle r="8" fill="var(--color-premium-bg)" stroke="var(--color-premium-border)" strokeWidth="1" />
          <foreignObject x="-5" y="-5" width="10" height="10">
            <div className="w-full h-full flex items-center justify-center">
              <Lock size={7} color="var(--color-premium-text-secondary)" strokeWidth={2.5} />
            </div>
          </foreignObject>
        </g>
      )}

      {/* Elegant checkmark for completed districts */}
      {status === 'completed' && (
        <g transform="translate(21, -21)">
          <circle r="8" fill="var(--color-premium-green-500)" />
          <foreignObject x="-5" y="-5" width="10" height="10">
            <div className="w-full h-full flex items-center justify-center">
              <Check size={7} color="var(--color-premium-text-inverse)" strokeWidth={3} />
            </div>
          </foreignObject>
        </g>
      )}

      {/* Name label */}
      <g transform="translate(0, 46)">
        <rect
          x={-(district.name.length * 3.1 + 7)}
          y="-8.5"
          width={district.name.length * 6.2 + 14}
          height="17"
          rx="8.5"
          fill="var(--color-premium-surface)"
          stroke="var(--color-premium-border)"
          strokeWidth="1"
        />
        <text
          textAnchor="middle"
          y="3.5"
          fontSize="9"
          fontWeight="600"
          fill={status === 'locked' ? 'var(--color-premium-text-secondary)' : 'var(--color-premium-text)'}
          fontFamily="Inter, sans-serif"
        >
          {district.name}
        </text>
      </g>

      {/* Compact income / completion readout — only shown once a district
          is reachable enough to have real numbers worth displaying */}
      {status !== 'locked' && (
        <g transform="translate(0, 66)">
          <text textAnchor="middle" fontSize="7.5" fontWeight="600" fill="var(--color-premium-green-500)" fontFamily="Inter, sans-serif">
            ₹{Math.round(income).toLocaleString('en-IN')}/min
          </text>
          <text textAnchor="middle" y="10" fontSize="7" fontWeight="500" fill="var(--color-premium-text-secondary)" fontFamily="Inter, sans-serif">
            {completionPercent}% complete
          </text>
        </g>
      )}
    </g>
  );
};
