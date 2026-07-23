/**
 * The Phase 1 economy fix — replaces flat linear profit growth
 * (`level * baseProfitPerMin`) with a universal tiered compounding curve,
 * identical for every business (Tea Stall through the wedding hall).
 * Business identity (different curves per business) is explicitly
 * deferred to a later phase, informed by real player data — this is
 * the single, simple rule every business follows for now.
 *
 * Levels 1–10:  +10% per level (compounding) — strong early growth
 * Levels 11–25: +5% per level  — moderate growth, this is where "maybe
 *               buy the Bakery instead" starts to make sense
 * Levels 26+:   +2% per level  — a real soft cap, but never fully flat
 *
 * A level-0 (never purchased) business earns nothing. Level 1 starts at
 * exactly baseProfitPerMin — the tiers only change the RATE of growth
 * from there, not the starting point.
 */
export function calculateTieredProfit(baseProfitPerMin: number, level: number): number {
  if (level <= 0) return 0;
  let profit = baseProfitPerMin; // level 1 baseline
  for (let l = 2; l <= level; l++) {
    const rate = l <= 10 ? 1.10 : l <= 25 ? 1.05 : 1.02;
    profit *= rate;
  }
  return Math.round(profit);
}
