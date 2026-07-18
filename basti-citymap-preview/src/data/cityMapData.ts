/**
 * City Map data model.
 *
 * This is the single source of truth for the City Map screen. Adding a new
 * district or city later means editing this file only — CityMapScreen,
 * DistrictNode, and RoadPath all render purely from this data and never
 * hardcode positions or connections.
 */

export type DistrictStatus = 'locked' | 'unlocked' | 'completed';

export interface District {
  id: string;
  name: string;
  /** Lucide icon name, resolved to a component in DistrictNode. */
  icon: DistrictIconName;
  /** Position in an abstract map coordinate space (not pixels/screen space). */
  x: number;
  y: number;
  unlocked: boolean;
  completed: boolean;
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
  | 'flag'
  | 'toll-booth';

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

const districts: District[] = [
  { id: 'railway_station', name: 'Railway Station', icon: 'train', x: 220, y: 90, unlocked: false, completed: false },
  { id: 'plastic_complex', name: 'Plastic Complex', icon: 'factory', x: 620, y: 90, unlocked: false, completed: false },
  { id: 'purani_basti', name: 'Purani Basti', icon: 'building', x: 220, y: 270, unlocked: false, completed: false },
  { id: 'district_hospital', name: 'District Hospital', icon: 'hospital', x: 560, y: 270, unlocked: false, completed: false },
  { id: 'bus_stand', name: 'Bus Stand', icon: 'bus', x: 390, y: 450, unlocked: false, completed: false },
  { id: 'pakke_bazar', name: 'Pakke Bazar', icon: 'store', x: 390, y: 630, unlocked: false, completed: false },
  { id: 'company_bagh', name: 'Company Bagh', icon: 'trees', x: 390, y: 810, unlocked: false, completed: false },
  { id: 'court_area', name: 'Court Area', icon: 'landmark', x: 200, y: 990, unlocked: false, completed: false },
  { id: 'katra', name: 'Katra', icon: 'shopping-bag', x: 390, y: 990, unlocked: false, completed: false },
  { id: 'badeban', name: 'Badeban', icon: 'flag', x: 580, y: 990, unlocked: true, completed: false },
  { id: 'toll_plaza', name: 'Toll Plaza', icon: 'toll-booth', x: 390, y: 1170, unlocked: false, completed: false },
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
  { id: 'road_katra_tollplaza', from: 'katra', to: 'toll_plaza' },
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
 *  the player toward it, while everything further out stays dim. */
export function isRoadActive(city: City, road: Road): boolean {
  const from = getDistrict(city, road.from);
  const to = getDistrict(city, road.to);
  return Boolean(from?.unlocked || to?.unlocked);
}
