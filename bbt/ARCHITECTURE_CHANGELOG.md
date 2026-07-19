# Architecture Changelog — Progression Engine (Slice 1)

**Scope:** Runtime unlock engine, unlock requirement evaluation, locked-district
messaging, district income display, district progress (stars/completion/level),
completed district map states.

**Explicitly out of scope this slice:** business field renames, `maxLevel`
enforcement, `unlockLevel` gating, events/achievements/leaderboards/VIP (per
original instructions — reserved for later slices).

---

## Files changed

### New files

| File | Purpose |
|---|---|
| `src/utils/districtProgress.ts` | Pure functions deriving income, completion %, stars, "district level," and completed status **from a district's `Business[]`**. No new persisted state — everything here is computed on read from data that was already being saved. |

### Modified files

| File | Why it changed |
|---|---|
| `src/data/cityMapData.ts` | Added `UnlockRequirement` type and an `unlockRequirement` field per district (all three types — `net_worth`, `player_level`, `district_completed` — are represented). `isRoadActive()` signature changed to accept an `isUnlocked(id)` checker function instead of reading `district.unlocked` directly, so road "aliveness" can reflect live state. **The old `unlocked`/`completed` fields on `District` were not removed** — see Deprecated Fields below. |
| `src/context/DistrictContext.tsx` | Added a second persisted map (unlock status per district), plus `isDistrictUnlocked()` and `unlockDistrict()`. `setCurrentDistrict()` now checks the dynamic map instead of the static seed flag. Functions wrapped in `useCallback` for stable references (avoids re-firing consumer effects every render). |
| `src/App.tsx` | Added the evaluator `useEffect` (the actual progression engine) that re-checks every locked district's requirement whenever cash, level, or any district's business data changes. Added `currentDistrictProgress` / `districtProgressMap` (`useMemo`'d) and passed them to `AreaCard` / `CityMapScreen`. No existing handler (`handleUpgrade`, `handleReward`, `handleDoubleProfit`, the passive-income tick) was modified. |
| `src/components/AreaCard.tsx` | Added a "District Income: ₹X/min" line and a 5-star row under the existing progress bar. Two new required props (`districtIncome`, `districtStars`); everything else unchanged. |
| `src/components/citymap/CityMapScreen.tsx` | Accepts two new **optional** props, `isDistrictUnlocked` and `districtProgress`. If omitted, falls back to the old static-flag behavior — so it still works standalone/undropped-in. Locked-district toast now shows the actual requirement label instead of the word "locked." |
| `src/components/citymap/DistrictNode.tsx` | Accepts two new **optional** props, `unlocked` and `progress`, with the same static-flag fallback pattern. Completed districts now render a green checkmark badge (was a star icon) and a 5-star row under the name plaque. |

---

## New data structures

```ts
// src/data/cityMapData.ts
type UnlockRequirementType = 'always' | 'net_worth' | 'district_completed' | 'player_level';

interface UnlockRequirement {
  type: UnlockRequirementType;
  value?: number;       // cash threshold (net_worth) or level number (player_level)
  districtId?: string;  // required district id (district_completed)
  label: string;        // precomputed human-readable string for UI, e.g. "₹5,00,000 Net Worth"
}
```

```ts
// src/utils/districtProgress.ts
interface DistrictProgressSummary {
  income: number;
  businessesOwned: number;
  businessesTotal: number;
  completionPercent: number;
  completed: boolean;
  stars: number;          // 0–5, floor(completionPercent / 20)
  districtLevel: number;  // sum of every business's level in the district
}
```

**New localStorage key:** `basti_unlocked_districts` — `Record<districtId, boolean>`,
seeded once from each district's static `unlocked` flag, then grown by
`unlockDistrict()`. Once a district is unlocked it stays unlocked (no
re-locking if net worth drops back down).

All other existing localStorage keys (`basti_businesses_by_district`,
`basti_stats`, `basti_avatar`, `basti_player_name`, `basti_current_district`)
are unchanged in shape and location.

---

## Deprecated fields

| Field | Status | Notes |
|---|---|---|
| `District.unlocked` (static) | **Soft-deprecated, not removed** | No longer the runtime source of truth — `DistrictContext.isDistrictUnlocked()` is. Still read as a **fallback seed value** (initial map seeding) and by any component that doesn't receive the new dynamic props. Safe to leave in place; do not delete without first confirming nothing still relies on the fallback path (`CityMapScreen`/`DistrictNode` both have one). |
| `District.completed` (static) | **Vestigial** | Always `false` in seed data and never written to. Live completion now comes from `DistrictProgressSummary.completed`. Low-risk to remove in a future slice, but left in place this time per "don't rename/remove fields unless necessary." |

Nothing on the `Business` type changed. No fields there are deprecated.

---

## Future migration notes

- **If/when `District.unlocked`/`completed` are removed:** first grep for the
  two fallback usages (`?? district.unlocked` in `CityMapScreen.tsx` and
  `DistrictNode.tsx`) and decide what those components should do if no
  dynamic props are passed — currently they degrade gracefully to "always
  locked/incomplete" rather than crashing, which is probably fine to keep
  as the safety default even after the static fields go away.
- **Net Worth currently equals `stats.cash`** (liquid cash only), not
  cash + asset value of owned businesses. This was a deliberate
  simplification to keep this slice contained. If "true" net worth
  (including business asset value) is wanted later, the only change needed
  is inside the `net_worth` branch of the evaluator effect in `App.tsx` —
  the requirement data shape doesn't need to change.
- **Completion rule is currently "all businesses purchased"** (Option A from
  the spec), implemented in `isDistrictCompleted()`. Switching to "all
  businesses max upgraded" (Option B) is a one-function change in
  `districtProgress.ts` — but requires a real `maxLevel` concept to exist
  on `Business` first (intentionally not added this slice).
- **Unlock requirement values are placeholder pacing**, not tuned/final
  numbers — expect these to change as real game economy balancing happens.
  They're centralized in one array in `cityMapData.ts`, so retuning is
  low-risk.
- **The evaluator effect re-runs roughly once per second** (it depends on
  `stats.cash`, which ticks every second from passive income). The check
  itself is cheap (≤11 districts, simple comparisons), so this wasn't
  optimized further — worth revisiting if the district count grows into
  the hundreds as mentioned in the long-term goal.
- **Toll Plaza has an `unlockRequirement` but no entry in
  `districtBusinesses.ts`** — it's a real node on the map with no economy
  data yet. If it becomes reachable before data is added, its district
  screen will render zero businesses rather than error (handled by
  `buildBusinessesForDistrict` returning `[]` for unknown ids), but it
  shouldn't be reachable yet since its `net_worth` threshold is high enough
  that other districts unlock first in practice.

---

**Verified before delivery:** `tsc --noEmit` clean, `npm run build` clean,
and a full code-level trace confirming buy/upgrade/income/reward
collection/district switching/persistence/navigation all still route
through the exact same functions as before this slice — this work only
added new effects and new *optional* props alongside them.
