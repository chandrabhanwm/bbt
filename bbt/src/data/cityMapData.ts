/**
 * City Map data model.
 *
 * This is the single source of truth for the City Map screen. Adding a new
 * district or city later means editing this file only — CityMapScreen,
 * DistrictNode, and RoadPath all render purely from this data and never
 * hardcode positions or connections.
 */

export type DistrictStatus = 'locked' | 'unlocked' | 'completed';

export type UnlockRequirementType = 'always' | 'net_worth' | 'district_completed' | 'player_level';

export interface UnlockRequirement {
  type: UnlockRequirementType;
  /** Cash threshold for 'net_worth', or level number for 'player_level'. */
  value?: number;
  /** District id that must be completed, for 'district_completed'. */
  districtId?: string;
  /** Human-readable label for locked-district messaging, e.g. "₹5,00,000 Net Worth". */
  label: string;
}

export interface District {
  id: string;
  name: string;
  /** Lucide icon name, resolved to a component in DistrictNode. */
  icon: DistrictIconName;
  /** Display emoji for headers/labels, e.g. "🏁" for Badeban. */
  emoji: string;
  /** Position in an abstract map coordinate space (not pixels/screen space). */
  x: number;
  y: number;
  /**
   * Base/initial unlock state — true only for the starting district.
   * This is NOT the live unlock status once the progression engine is
   * running; DistrictContext's isDistrictUnlocked() is the source of
   * truth at runtime. Kept here as the seed value and as a fallback.
   */
  unlocked: boolean;
  completed: boolean;
  /** Short flavor text shown in the district preview/details. */
  description: string;
  /** What it takes to unlock this district. Omitted/'always' for districts
   *  that start unlocked. */
  unlockRequirement?: UnlockRequirement;
}

export type DistrictIconName =
  | 'train'
  | 'factory'
  | 'building'
  | 'hospital'
  | 'bus'
  | 'store'
  | 'trees'
  | 'landmark'
  | 'shopping-bag'
  | 'flag';

export interface Road {
  id: string;
  from: string;
  to: string;
}

export interface City {
  id: string;
  name: string;
  districts: District[];
  roads: Road[];
}

// Unlock thresholds below are a reasonable starting progression curve, not
// numbers you specified beyond the one net-worth example — easy to retune,
// since every district reads from exactly one field here. Ordered roughly
// by road distance from Badeban so district_completed chains follow
// adjacent roads rather than jumping across the map.
const districts: District[] = [
  { id: 'railway_station', name: 'Railway Station', icon: 'train', emoji: '🚂', x: 50, y: 50, unlocked: false, completed: false, description: 'A busy platform where every train brings new customers through Basti.', unlockRequirement: { type: 'net_worth', value: 25000000, label: '₹2,50,00,000 Net Worth' } },
  { id: 'plastic_complex', name: 'Plastic Complex', icon: 'factory', emoji: '🏭', x: 340, y: 50, unlocked: false, completed: false, description: 'The industrial belt powering packaging and manufacturing for the whole city.', unlockRequirement: { type: 'net_worth', value: 30000000, label: '₹3,00,00,000 Net Worth' } },
  { id: 'purani_basti', name: 'Purani Basti', icon: 'building', emoji: '🚧', x: 50, y: 150, unlocked: false, completed: false, description: 'The old market — heritage crafts and recipes passed down for generations.', unlockRequirement: { type: 'district_completed', districtId: 'bus_stand', label: 'Complete Bus Stand' } },
  { id: 'district_hospital', name: 'District Hospital', icon: 'hospital', emoji: '🏥', x: 300, y: 150, unlocked: false, completed: false, description: 'The city\'s medical hub, from the corner pharmacy to the super-specialty wing.', unlockRequirement: { type: 'net_worth', value: 15000000, label: '₹1,50,00,000 Net Worth' } },
  { id: 'bus_stand', name: 'Bus Stand', icon: 'bus', emoji: '🚌', x: 195, y: 250, unlocked: false, completed: false, description: 'Basti\'s transit hub — dhabas, taxis, and travelers passing through all day.', unlockRequirement: { type: 'net_worth', value: 8000000, label: '₹80,00,000 Net Worth' } },
  { id: 'pakke_bazar', name: 'Pakke Bazar', icon: 'store', emoji: '🛍️', x: 195, y: 340, unlocked: false, completed: false, description: 'The paved retail strip — fashion, electronics, and Basti\'s biggest mall.', unlockRequirement: { type: 'player_level', value: 10, label: 'Player Level 10' } },
  { id: 'company_bagh', name: 'Company Bagh', icon: 'trees', emoji: '🌳', x: 195, y: 430, unlocked: false, completed: false, description: 'A leafy park district built for families, food, and weekend leisure.', unlockRequirement: { type: 'district_completed', districtId: 'katra', label: 'Complete Katra' } },
  { id: 'court_area', name: 'Court Area', icon: 'landmark', emoji: '⚖️', x: 50, y: 520, unlocked: false, completed: false, description: 'Where Basti\'s legal business gets done, one photocopy at a time.', unlockRequirement: { type: 'net_worth', value: 3000000, label: '₹30,00,000 Net Worth' } },
  { id: 'katra', name: 'Katra', icon: 'shopping-bag', emoji: '🏘️', x: 195, y: 520, unlocked: false, completed: false, description: 'A wholesale hub — fresh produce, textiles, and the shops that supply the rest of the city.', unlockRequirement: { type: 'net_worth', value: 500000, label: '₹5,00,000 Net Worth' } },
  { id: 'badeban', name: 'Badeban', icon: 'flag', emoji: '🏁', x: 340, y: 520, unlocked: true, completed: false, description: 'The entry market where every Basti business empire begins.', unlockRequirement: { type: 'always', label: 'Starting district' } },
];

const roads: Road[] = [
  { id: 'road_railway_purani', from: 'railway_station', to: 'purani_basti' },
  { id: 'road_plastic_hospital', from: 'plastic_complex', to: 'district_hospital' },
  { id: 'road_purani_hospital', from: 'purani_basti', to: 'district_hospital' },
  { id: 'road_purani_busstand', from: 'purani_basti', to: 'bus_stand' },
  { id: 'road_hospital_busstand', from: 'district_hospital', to: 'bus_stand' },
  { id: 'road_busstand_pakke', from: 'bus_stand', to: 'pakke_bazar' },
  { id: 'road_pakke_companybagh', from: 'pakke_bazar', to: 'company_bagh' },
  { id: 'road_companybagh_katra', from: 'company_bagh', to: 'katra' },
  { id: 'road_court_katra', from: 'court_area', to: 'katra' },
  { id: 'road_katra_badeban', from: 'katra', to: 'badeban' },
];

export const bastiCity: City = {
  id: 'basti',
  name: 'Basti',
  districts,
  roads,
};

export function getDistrict(city: City, id: string): District | undefined {
  return city.districts.find((d) => d.id === id);
}

/** A road counts as "alive" if either end is unlocked — the frontier road
 *  leading toward the next district glows and carries traffic, inviting
 *  the player toward it, while everything further out stays dim.
 *  isUnlocked is injected so callers can use live/dynamic unlock status
 *  (from DistrictContext) rather than the static seed flag on District. */
export function isRoadActive(city: City, road: Road, isUnlocked: (districtId: string) => boolean): boolean {
  const from = getDistrict(city, road.from);
  const to = getDistrict(city, road.to);
  if (!from || !to) return false;
  return isUnlocked(from.id) || isUnlocked(to.id);
}
