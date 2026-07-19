/**
 * Pure presentation mapping: business id -> category badge label + color.
 * This is NOT part of the Business data model (types.ts / districtBusinesses.ts)
 * — it exists only so the business grid card can show a category chip like
 * the reference design calls for, without adding a field to the real
 * economy data or touching any gameplay value.
 *
 * Colors here are a deliberate, hand-matched palette to the reference
 * screenshot's badge colors — eyeballed, not pixel-sampled, and NOT routed
 * through the frozen premium design system tokens (that system's "gold
 * sparingly" rule directly conflicts with this reference's much heavier
 * gold usage). Flagged here explicitly rather than silently overridden.
 */

export interface CategoryPresentation {
  label: string;
  badgeBg: string;
  badgeText: string;
}

export const businessCategoryPresentation: Record<string, CategoryPresentation> = {
  tea_stall: { label: 'FOOD & BEVERAGE', badgeBg: 'rgba(139,90,43,0.92)', badgeText: '#F5E6C8' },
  restaurant: { label: 'FOOD & BEVERAGE', badgeBg: 'rgba(139,90,43,0.92)', badgeText: '#F5E6C8' },
  kirana_store: { label: 'GROCERY', badgeBg: 'rgba(37,99,235,0.92)', badgeText: '#FFFFFF' },
  dairy_shop: { label: 'DAIRY', badgeBg: 'rgba(22,163,74,0.92)', badgeText: '#FFFFFF' },
  bakery: { label: 'BAKERY', badgeBg: 'rgba(194,101,11,0.92)', badgeText: '#FFFFFF' },
  bike_repair: { label: 'AUTOMOTIVE', badgeBg: 'rgba(75,85,99,0.92)', badgeText: '#FFFFFF' },
  medical: { label: 'HEALTHCARE', badgeBg: 'rgba(22,163,74,0.92)', badgeText: '#FFFFFF' },
  budget_lodge: { label: 'HOSPITALITY', badgeBg: 'rgba(124,58,237,0.92)', badgeText: '#FFFFFF' },
};

const DEFAULT_CATEGORY: CategoryPresentation = {
  label: 'GENERAL',
  badgeBg: 'rgba(75,85,99,0.92)',
  badgeText: '#FFFFFF',
};

export function getBusinessCategory(businessId: string): CategoryPresentation {
  return businessCategoryPresentation[businessId] ?? DEFAULT_CATEGORY;
}
