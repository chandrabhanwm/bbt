import React from 'react';
import { motion } from 'motion/react';
import {
  Train, Factory, Building2, Hospital, Bus, Store, Trees, Landmark,
  ShoppingBag, Flag, ParkingMeter, Lock, Star, LucideIcon
} from 'lucide-react';
import { District, DistrictIconName } from '../../data/cityMapData';

const ICONS: Record<DistrictIconName, LucideIcon> = {
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
  'toll-booth': ParkingMeter,
};

interface DistrictNodeProps {
  district: District;
  onSelect: (district: District) => void;
}

/**
 * A single district pin on the city map. Purely presentational + one
 * onSelect callback — every visual rule (unlocked/locked/completed) is
 * derived from the district's own data, so dropping a new district into
 * cityMapData.ts is all that's needed to add another one of these.
 */
export const DistrictNode: React.FC<DistrictNodeProps> = ({ district, onSelect }) => {
  const Icon = ICONS[district.icon];
  const status = district.completed ? 'completed' : district.unlocked ? 'unlocked' : 'locked';

  const ringColor =
    status === 'completed' ? 'var(--color-brass-400)' :
    status === 'unlocked' ? 'var(--color-money-500)' :
    '#9a9284';

  const fillGradientId = `districtFill-${district.id}`;

  return (
    <g
      transform={`translate(${district.x}, ${district.y})`}
      onClick={() => onSelect(district)}
      className="cursor-pointer"
      role="button"
      aria-label={`${district.name} — ${status}`}
    >
      {/* Outer pulse ring for unlocked districts — the "come tap me" cue */}
      {status === 'unlocked' && (
        <circle r="42" fill="none" stroke={ringColor} strokeWidth="2" opacity="0.5">
          <animate attributeName="r" values="34;46;34" dur="2.4s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.55;0;0.55" dur="2.4s" repeatCount="indefinite" />
        </circle>
      )}

      {/* Base shadow disc, grounds the node on the map */}
      <ellipse cx="0" cy="30" rx="26" ry="7" fill="#2E1B0C" opacity="0.18" />

      <defs>
        <radialGradient id={fillGradientId} cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor={status === 'locked' ? '#E4DFD3' : '#FFFFFF'} />
          <stop offset="100%" stopColor={status === 'locked' ? '#C9C2B2' : 'var(--color-parchment-100)'} />
        </radialGradient>
      </defs>

      {/* Main node disc */}
      <motion.circle
        whileTap={district.unlocked ? { scale: 0.92 } : {}}
        r="30"
        fill={`url(#${fillGradientId})`}
        stroke={ringColor}
        strokeWidth={status === 'completed' ? 4 : 3}
        style={{ filter: status === 'locked' ? 'grayscale(0.6)' : undefined }}
      />

      {/* Icon */}
      <foreignObject x="-13" y="-13" width="26" height="26" style={{ pointerEvents: 'none' }}>
        <div className="w-full h-full flex items-center justify-center">
          <Icon
            size={18}
            strokeWidth={2.4}
            color={status === 'locked' ? '#7d766c' : 'var(--color-ink-900)'}
          />
        </div>
      </foreignObject>

      {/* Lock badge for locked districts */}
      {status === 'locked' && (
        <g transform="translate(18, -18)">
          <circle r="10" fill="#7d766c" stroke="#FFFFFF" strokeWidth="1.5" />
          <foreignObject x="-6" y="-6" width="12" height="12">
            <div className="w-full h-full flex items-center justify-center">
              <Lock size={9} color="#FFFFFF" strokeWidth={3} />
            </div>
          </foreignObject>
        </g>
      )}

      {/* Gold star badge for completed districts */}
      {status === 'completed' && (
        <g transform="translate(18, -18)">
          <circle r="10" fill="var(--color-brass-400)" stroke="#FFFFFF" strokeWidth="1.5" />
          <foreignObject x="-6" y="-6" width="12" height="12">
            <div className="w-full h-full flex items-center justify-center">
              <Star size={9} color="var(--color-ink-900)" strokeWidth={3} fill="var(--color-ink-900)" />
            </div>
          </foreignObject>
        </g>
      )}

      {/* Name label on a small outlined plaque */}
      <g transform="translate(0, 46)">
        <rect
          x={-(district.name.length * 3.1 + 8)}
          y="-9"
          width={district.name.length * 6.2 + 16}
          height="18"
          rx="9"
          fill={status === 'locked' ? 'rgba(46,27,12,0.55)' : 'var(--color-ink-900)'}
        />
        <text
          textAnchor="middle"
          y="3.5"
          fontSize="9.5"
          fontWeight="700"
          fill={status === 'locked' ? '#d8d2c5' : 'var(--color-parchment-100)'}
          fontFamily="Baloo 2, Inter, sans-serif"
        >
          {district.name}
        </text>
      </g>
    </g>
  );
};
