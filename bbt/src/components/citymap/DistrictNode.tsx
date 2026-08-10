import React, { useState } from 'react';
import { motion } from 'motion/react';
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
  /** True for the one district the player is actually playing in right
   *  now — gets its own distinct "You are here" badge, separate from
   *  the unlocked/completed glow states. */
  isCurrent?: boolean;
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
export const DistrictNode: React.FC<DistrictNodeProps> = ({ district, onSelect, unlocked, progress, isCurrent = false }) => {
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

  // Size hierarchy — the one district the player is actually in reads as
  // visibly the most prominent thing on the whole map; locked districts
  // (not relevant yet) sit smaller and quieter. An earlier version gave
  // every node the exact same size regardless of relevance, which is
  // part of why the whole map read as flat and undifferentiated.
  const nodeRadius = isCurrent ? 46 : status === 'locked' ? 24 : 32;

  return (
    <g
      transform={`translate(${district.x}, ${district.y})`}
      onClick={() => onSelect(district)}
      className="cursor-pointer"
      role="button"
      aria-label={`${district.name} — ${status}`}
    >
      {/* Rotating beacon — a genuine spotlight behind the current node,
          not just a bigger glow. SVG can't use a CSS conic-gradient
          directly, so this achieves the same "rays radiating outward"
          effect with a ring of thin tapered spokes, rotated slowly as a
          group — the same idea as the light rays used in the big
          full-screen celebrations, adapted to SVG. */}
      {isCurrent && (
        <motion.g
          animate={{ rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
          style={{ transformOrigin: '0px 0px' }}
        >
          {Array.from({ length: 10 }).map((_, i) => (
            <rect
              key={i}
              x={-2} y={-(nodeRadius + 34)} width={4} height={26}
              rx={2}
              fill="var(--color-premium-gold-400)"
              opacity={0.28}
              transform={`rotate(${i * 36})`}
            />
          ))}
        </motion.g>
      )}

      {/* Sparkle celebration — small twinkling points around a fully
          completed district, playing continuously rather than only at
          the moment of completion, so a finished district keeps
          reading as a genuine, ongoing achievement every time the
          player looks at the map, not just once. */}
      {status === 'completed' && (
        <>
          {[
            { angle: 20, dist: nodeRadius + 14, delay: 0 },
            { angle: 160, dist: nodeRadius + 10, delay: 0.6 },
            { angle: 260, dist: nodeRadius + 16, delay: 1.1 },
          ].map((s, i) => {
            const rad = (s.angle * Math.PI) / 180;
            return (
              <motion.text
                key={i}
                x={Math.cos(rad) * s.dist}
                y={Math.sin(rad) * s.dist}
                fontSize={10}
                textAnchor="middle"
                animate={{ opacity: [0, 1, 0], scale: [0.6, 1.1, 0.6] }}
                transition={{ duration: 1.8, repeat: Infinity, delay: s.delay, ease: 'easeInOut' }}
                style={{ transformOrigin: `${Math.cos(rad) * s.dist}px ${Math.sin(rad) * s.dist}px` }}
              >
                ✨
              </motion.text>
            );
          })}
        </>
      )}

      {/* "You are here" — the one district the player is actually
          playing in right now. Sits above the node, distinct from the
          completion glow and lock icon, so it reads at a glance as
          "this is where you are," not "this is done" or "this is
          locked." */}
      {isCurrent && (
        <g transform="translate(0, -50)">
          <motion.g
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          >
            <rect x="-32" y="-10" width="64" height="18" rx="9" fill="var(--color-premium-gold-400)" />
            <text textAnchor="middle" y="3" fontSize="9" fontWeight="700" fill="var(--color-premium-text-inverse)" fontFamily="Inter, sans-serif">
              YOU ARE HERE
            </text>
            <polygon points="-4,8 4,8 0,15" fill="var(--color-premium-gold-400)" />
          </motion.g>
        </g>
      )}

      {/* Platform base — a soft, dark elevated ellipse the node visually
          "sits on," reinforcing that this is a physical place on a
          terrain, not a flat icon floating in empty space. Distinct from
          the neutral elevation shadow below (locked-only, much fainter);
          this one is present under every node regardless of status. */}
      <ellipse cx="0" cy={nodeRadius * 0.82} rx={nodeRadius * 0.85} ry={nodeRadius * 0.22} fill="#000000" opacity="0.35" style={{ filter: 'blur(2px)' }} />

      {/* Neutral elevation shadow — kept for locked districts only, where
          there's no progress yet to glow about. */}
      {status === 'locked' && (
        <ellipse cx="0" cy="4" rx="30" ry="7" fill="var(--color-premium-shadow-neutral)" opacity="0.24" />
      )}

      {/* Completion-based colored glow — the actual new piece here. Was
          previously always a neutral shadow regardless of progress;
          now an unlocked district's glow genuinely reflects how close
          it is to completion (dim early, warm and bright as it nears
          100%), and a completed district gets a steady full green glow
          matching its status color. */}
      {status !== 'locked' && (
        <circle
          r={nodeRadius + 6 + (status === 'completed' ? 6 : Math.round((completionPercent / 100) * 6))}
          fill={status === 'completed' ? 'var(--color-premium-green-500)' : 'var(--color-premium-gold-400)'}
          opacity={status === 'completed' ? 0.28 : 0.08 + (completionPercent / 100) * 0.22}
          style={{ transition: 'r 0.7s ease, opacity 0.7s ease' }}
        />
      )}

      {/* Main node disc — a real embossed dome now (radial gradient
          fill lighter at the upper-left, darker toward the edge, plus a
          thin inner highlight ring) rather than one flat fill color, so
          it reads as a physical raised platform rather than a flat
          painted circle. Border transitions smoothly (not a snap) when
          status changes — same "road lights up" principle as RoadPath.
          Uses the dynamic nodeRadius so the current district's larger
          size and a locked district's smaller size both actually apply
          here, not just to the glow/shadow around it. */}
      <defs>
        <radialGradient id={`node-fill-${district.id}`} cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="var(--color-premium-elevated)" />
          <stop offset="100%" stopColor="var(--color-premium-surface)" />
        </radialGradient>
      </defs>
      <circle
        r={nodeRadius}
        fill={`url(#node-fill-${district.id})`}
        stroke={borderColor}
        strokeWidth={status === 'locked' ? 1.5 : 2}
        style={{ transition: 'stroke 0.7s ease, stroke-width 0.7s ease, r 0.4s ease' }}
      />
      <circle
        r={nodeRadius - 2}
        fill="none"
        stroke="rgba(255,255,255,0.18)"
        strokeWidth="1"
        style={{ transition: 'r 0.4s ease' }}
      />

      {/* Illustrated 3D district icon, or the original line-icon as a
          fallback if this district's art fails to load */}
      <foreignObject x={-nodeRadius * 0.34} y={-nodeRadius * 0.34} width={nodeRadius * 0.69} height={nodeRadius * 0.69} style={{ pointerEvents: 'none' }}>
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
        <g transform={`translate(${nodeRadius * 0.66}, ${-nodeRadius * 0.66})`}>
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
        <g transform={`translate(${nodeRadius * 0.66}, ${-nodeRadius * 0.66})`}>
          <circle r="8" fill="var(--color-premium-green-500)" />
          <foreignObject x="-5" y="-5" width="10" height="10">
            <div className="w-full h-full flex items-center justify-center">
              <Check size={7} color="var(--color-premium-text-inverse)" strokeWidth={3} />
            </div>
          </foreignObject>
        </g>
      )}

      {/* Name label */}
      <g transform="translate(0, 51)">
        <rect
          x={-(district.name.length * 5.7 + 12)}
          y="-15.5"
          width={district.name.length * 11.4 + 24}
          height="31"
          rx="15"
          fill="var(--color-premium-surface)"
          stroke="var(--color-premium-border)"
          strokeWidth="1"
        />
        <text
          textAnchor="middle"
          y="6"
          fontSize="17"
          fontWeight="700"
          fill={status === 'locked' ? 'var(--color-premium-text-secondary)' : '#ffffff'}
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
