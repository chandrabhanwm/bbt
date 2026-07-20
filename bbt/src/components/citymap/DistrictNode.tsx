import React from 'react';
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
 * A single premium information node on the city map — icon, name, income,
 * completion %, and unlock status. Every visual rule (unlocked/locked/
 * completed) is derived from data passed in (or the district's own static
 * data as a fallback), so dropping a new district into cityMapData.ts is
 * all that's needed to add another one of these. No glow, no decorative
 * badges beyond a plain lock/check indicator — status reads through the
 * border color and the small info line, not through motion or light.
 */
export const DistrictNode: React.FC<DistrictNodeProps> = ({ district, onSelect, unlocked, progress }) => {
  const Icon = DISTRICT_ICONS[district.icon];
  const isUnlocked = unlocked ?? district.unlocked;
  const isCompleted = progress?.completed ?? district.completed;
  const income = progress?.income ?? 0;
  const completionPercent = progress?.completionPercent ?? 0;
  const status = isCompleted ? 'completed' : isUnlocked ? 'unlocked' : 'locked';

  const borderColor =
    status === 'completed' ? 'var(--color-premium-green-500)' :
    status === 'unlocked' ? 'var(--color-premium-gold-400)' :
    'var(--color-premium-border)';

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
      <ellipse cx="0" cy="4" rx="24" ry="6" fill="var(--color-premium-shadow-neutral)" opacity="0.22" />

      {/* Main node disc */}
      <circle
        r="26"
        fill="var(--color-premium-surface)"
        stroke={borderColor}
        strokeWidth={status === 'locked' ? 1.5 : 2}
      />

      {/* Icon */}
      <foreignObject x="-12" y="-12" width="24" height="24" style={{ pointerEvents: 'none' }}>
        <div className="w-full h-full flex items-center justify-center">
          <Icon size={17} strokeWidth={1.75} color={iconColor} />
        </div>
      </foreignObject>

      {/* Lock indicator for locked districts */}
      {status === 'locked' && (
        <g transform="translate(17, -17)">
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
        <g transform="translate(17, -17)">
          <circle r="8" fill="var(--color-premium-green-500)" />
          <foreignObject x="-5" y="-5" width="10" height="10">
            <div className="w-full h-full flex items-center justify-center">
              <Check size={7} color="var(--color-premium-text-inverse)" strokeWidth={3} />
            </div>
          </foreignObject>
        </g>
      )}

      {/* Name label */}
      <g transform="translate(0, 40)">
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
        <g transform="translate(0, 60)">
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
