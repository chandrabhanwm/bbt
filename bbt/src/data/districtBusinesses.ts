import { Business } from '../types';
import { districtUsesStrategyLayer, getStrategyLevelData, getStrategyDistrictL1Cost } from '../utils/strategyEngine';

/**
 * Raw property data for every district, exactly as given: id, display name,
 * emoji, buy price, and income/min. Nothing here is invented — only the
 * *mechanical* fields needed to plug into the existing upgrade system
 * (cost multiplier, unlock gate, theme color) are derived, using the same
 * pattern the original Badeban-era Gandhi Nagar data already used.
 */

export interface DistrictPropertySeed {
  id: string;
  name: string;
  emoji: string;
  baseCost: number;
  baseProfitPerMin: number;
  description: string;
}

export interface DistrictEconomy {
  /** Matches a district id in cityMapData.ts */
  districtId: string;
  label: string;
  properties: DistrictPropertySeed[];
}

export const districtEconomies: DistrictEconomy[] = [
  {
    districtId: 'badeban',
    label: 'Badeban — Entry Market',
    properties: [
      { id: 'tea_stall', name: 'Chai Corner', emoji: '☕', baseCost: 12500, baseProfitPerMin: 278, description: 'Hot kadak chai for the whole market.' },
      { id: 'kirana_store', name: 'Kirana Store', emoji: '🛒', baseCost: 25000, baseProfitPerMin: 455, description: 'Daily groceries and household basics.' },
      { id: 'dairy_shop', name: 'Book Depot', emoji: '📚', baseCost: 50000, baseProfitPerMin: 714, description: 'Textbooks, novels, and stationery for students and shopkeepers alike.' },
      { id: 'bakery', name: 'Photo Studio', emoji: '📷', baseCost: 100000, baseProfitPerMin: 1111, description: 'Passport photos, portraits, and prints while you wait.' },
      { id: 'bike_repair', name: 'Automobile Shop', emoji: '🔧', baseCost: 200000, baseProfitPerMin: 1667, description: 'Spare parts and servicing for cars and two-wheelers alike.' },
      { id: 'medical', name: 'Shah Medical Store', emoji: '💊', baseCost: 375000, baseProfitPerMin: 2344, description: 'Medicines and essentials, open late.' },
      { id: 'restaurant', name: 'Tiles/Marbles Shop', emoji: '🧱', baseCost: 750000, baseProfitPerMin: 3409, description: 'Flooring tiles and marble slabs for homes and shops.' },
      { id: 'budget_lodge', name: 'Marriage Hall', emoji: '💒', baseCost: 1500000, baseProfitPerMin: 5000, description: 'A grand venue for weddings and community functions.' },
    ],
  },
  {
    districtId: 'katra',
    label: 'Katra — Wholesale & Local Commerce',
    properties: [
      { id: 'vegetable_market', name: 'Chaat Corner', emoji: '🥘', baseCost: 20000, baseProfitPerMin: 419, description: 'Golgappe, tikki, and chaat for the evening crowd.' },
      { id: 'fruit_shop', name: 'Stationary Store', emoji: '✏️', baseCost: 45000, baseProfitPerMin: 772, description: 'Notebooks, pens, and school supplies in bulk.' },
      { id: 'general_store', name: 'Beauty Parlour', emoji: '💇', baseCost: 87500, baseProfitPerMin: 1179, description: 'Haircuts, styling, and bridal packages.' },
      { id: 'footwear_shop', name: 'Travel Agency', emoji: '✈️', baseCost: 175000, baseProfitPerMin: 1834, description: 'Tickets, tours, and travel bookings for every budget.' },
      { id: 'garment_store', name: 'Hardware Store', emoji: '🔨', baseCost: 350000, baseProfitPerMin: 2752, description: 'Tools, fittings, and building supplies.' },
      { id: 'mini_bank', name: 'Furniture House', emoji: '🛋️', baseCost: 750000, baseProfitPerMin: 4422, description: 'Beds, sofas, and furniture for every home.' },
      { id: 'shopping_complex_katra', name: 'Computer Institute', emoji: '💻', baseCost: 2000000, baseProfitPerMin: 8576, description: 'Courses and training for the district\'s students.' },
      { id: 'commercial_plaza', name: 'Mega Mart', emoji: '🛍️', baseCost: 4500000, baseProfitPerMin: 14151, description: 'A one-stop retail destination for the whole district.' },
    ],
  },
  {
    districtId: 'company_bagh',
    label: 'Company Bagh — Family & Lifestyle',
    properties: [
      { id: 'ice_cream_parlour', name: 'Juice Corner', emoji: '🧃', baseCost: 62500, baseProfitPerMin: 1177, description: 'Fresh juices and shakes by the park gate.' },
      { id: 'cafe', name: 'Dairy Shop', emoji: '🥛', baseCost: 150000, baseProfitPerMin: 2311, description: 'Fresh milk, curd, and paneer every morning.' },
      { id: 'nursery', name: 'Ice Cream Parlour', emoji: '🍦', baseCost: 375000, baseProfitPerMin: 4540, description: 'Cold treats for evening strolls in the park.' },
      { id: 'kids_zone', name: 'Vegetable Market', emoji: '🥬', baseCost: 1000000, baseProfitPerMin: 9416, description: 'Fresh produce sold by the crate.' },
      { id: 'food_court', name: 'Fruit Market', emoji: '🍎', baseCost: 2000000, baseProfitPerMin: 14124, description: 'Seasonal fruit, sold fast at fair prices.' },
      { id: 'gym', name: 'Bank ATM', emoji: '🏧', baseCost: 5000000, baseProfitPerMin: 26483, description: 'Round-the-clock cash access for the whole park area.' },
      { id: 'mini_cinema', name: 'School', emoji: '🏫', baseCost: 12500000, baseProfitPerMin: 48151, description: 'Classrooms and courses for the neighborhood\'s children.' },
      { id: 'premium_hotel', name: 'Premium Hotel', emoji: '🏨', baseCost: 30000000, baseProfitPerMin: 84746, description: 'The best address near the park.' },
    ],
  },
  {
    districtId: 'pakke_bazar',
    label: 'Pakke Bazar — Retail Hub',
    properties: [
      { id: 'ladies_fashion', name: 'Cosmetics Store', emoji: '💄', baseCost: 75000, baseProfitPerMin: 1344, description: 'Beauty essentials and gift sets.' },
      { id: 'cosmetics', name: 'Sweet & Bakery', emoji: '🍰', baseCost: 187500, baseProfitPerMin: 2749, description: 'Fresh sweets, cakes, and bakery treats.' },
      { id: 'mobile_shop', name: 'Footwear Shop', emoji: '👞', baseCost: 500000, baseProfitPerMin: 5760, description: 'Shoes and sandals for every budget.' },
      { id: 'electronics', name: 'Mobile Shop', emoji: '📱', baseCost: 1250000, baseProfitPerMin: 11201, description: 'Latest phones and quick repairs.' },
      { id: 'watch_store', name: 'Royal Restaurant', emoji: '🍽', baseCost: 3000000, baseProfitPerMin: 20161, description: 'Fine dining in the heart of the bazaar.' },
      { id: 'jewellery', name: 'Electronics Store', emoji: '💻', baseCost: 7500000, baseProfitPerMin: 37802, description: 'Laptops, TVs, and home appliances.' },
      { id: 'department_store', name: 'Jewellery Store', emoji: '💍', baseCost: 18750000, baseProfitPerMin: 68732, description: 'Gold and silver, hallmarked and trusted.' },
      { id: 'luxury_mall', name: 'Fashion Mall', emoji: '🏬', baseCost: 50000000, baseProfitPerMin: 134409, description: 'Basti\'s biggest fashion destination.' },
    ],
  },
  {
    districtId: 'bus_stand',
    label: 'Bus Stand — High Traffic',
    properties: [
      { id: 'bus_cafe', name: 'Fastfood Corner', emoji: '🍔', baseCost: 87500, baseProfitPerMin: 1507, description: 'Quick bites between departures.' },
      { id: 'dhaba', name: 'Book Store', emoji: '📚', baseCost: 225000, baseProfitPerMin: 3171, description: 'Novels and magazines for the long journey ahead.' },
      { id: 'luggage_store', name: 'Highway Dhaba', emoji: '🍛', baseCost: 625000, baseProfitPerMin: 6921, description: 'Hearty meals for travelers on the move.' },
      { id: 'taxi_stand', name: 'Taxi Stand', emoji: '🚖', baseCost: 1500000, baseProfitPerMin: 12920, description: 'Rides to anywhere in Basti.' },
      { id: 'petrol_pump', name: 'Premium Hotel', emoji: '🏨', baseCost: 3750000, baseProfitPerMin: 24225, description: 'A bed for the overnight traveler.' },
      { id: 'transit_hotel', name: 'Petrol Pump', emoji: '⛽', baseCost: 10000000, baseProfitPerMin: 48450, description: 'Fuel for the whole transport hub.' },
      { id: 'bus_depot', name: 'Bank', emoji: '🏦', baseCost: 25000000, baseProfitPerMin: 88090, description: 'Savings, loans, and cash counters for the transport hub.' },
      { id: 'transport_terminal', name: 'Luxury Mall', emoji: '🏬', baseCost: 75000000, baseProfitPerMin: 193798, description: 'Basti\'s biggest shopping destination near the terminal.' },
    ],
  },
  {
    districtId: 'district_hospital',
    label: 'District Hospital',
    properties: [
      { id: 'pharmacy', name: 'Ambulance Service', emoji: '🚑', baseCost: 100000, baseProfitPerMin: 1671, description: 'Fast response, day or night.' },
      { id: 'diagnostic_lab', name: 'Surgical Store', emoji: '🩹', baseCost: 250000, baseProfitPerMin: 3418, description: 'Surgical equipment and medical supplies.' },
      { id: 'dental_clinic', name: 'Pharmacy', emoji: '💊', baseCost: 625000, baseProfitPerMin: 6713, description: 'Prescriptions filled around the clock.' },
      { id: 'optical_store', name: 'Diagnostic Lab', emoji: '🩺', baseCost: 1500000, baseProfitPerMin: 12531, description: 'Tests and scans, results same day.' },
      { id: 'ambulance_service', name: 'Dental Clinic', emoji: '🦷', baseCost: 3750000, baseProfitPerMin: 23496, description: 'Checkups and treatment chairs, always full.' },
      { id: 'private_hospital', name: 'Blood Bank', emoji: '🩸', baseCost: 10000000, baseProfitPerMin: 46992, description: 'Safe storage and supply for every blood type, day or night.' },
      { id: 'medical_research_center', name: 'Medical Research Center', emoji: '🧬', baseCost: 25000000, baseProfitPerMin: 85441, description: 'Studies and trials backed by the district.' },
      { id: 'super_specialty_hospital', name: 'Super Specialty Hospital', emoji: '❤️', baseCost: 75000000, baseProfitPerMin: 187970, description: 'The region\'s top-tier medical center.' },
    ],
  },
  {
    districtId: 'plastic_complex',
    label: 'Plastic Complex — Industrial Area',
    properties: [
      { id: 'plastic_unit', name: 'Plastic Unit', emoji: '🧱', baseCost: 250000, baseProfitPerMin: 3968, description: 'Molding and small plastic goods.' },
      { id: 'packaging_factory', name: 'Packaging Factory', emoji: '📦', baseCost: 750000, baseProfitPerMin: 9740, description: 'Boxes and wrap for every shop in Basti.' },
      { id: 'warehouse', name: 'Warehouse', emoji: '🚚', baseCost: 2000000, baseProfitPerMin: 20408, description: 'Storage and dispatch at scale.' },
      { id: 'manufacturing_plant', name: 'Manufacturing Plant', emoji: '🏭', baseCost: 5000000, baseProfitPerMin: 39683, description: 'Round-the-clock production lines.' },
      { id: 'industrial_workshop', name: 'Industrial Workshop', emoji: '⚙️', baseCost: 12500000, baseProfitPerMin: 74405, description: 'Custom parts and heavy repairs.' },
      { id: 'logistics_hub', name: 'Logistics Hub', emoji: '🚛', baseCost: 30000000, baseProfitPerMin: 133929, description: 'Freight moving in and out daily.' },
      { id: 'industrial_park', name: 'Industrial Park', emoji: '🏢', baseCost: 75000000, baseProfitPerMin: 243506, description: 'Multiple factories sharing infrastructure.' },
      { id: 'mega_industrial_estate', name: 'Mega Industrial Estate', emoji: '🌐', baseCost: 200000000, baseProfitPerMin: 476190, description: 'Basti\'s largest industrial footprint.' },
    ],
  },
  {
    districtId: 'railway_station',
    label: 'Railway Station',
    properties: [
      { id: 'platform_tea_stall', name: 'Platform Tea Stall', emoji: '☕', baseCost: 150000, baseProfitPerMin: 2415, description: 'Chai through the window, every stop.' },
      { id: 'book_stall', name: 'Book Stall', emoji: '📚', baseCost: 450000, baseProfitPerMin: 5929, description: 'Paperbacks and newspapers for the journey.' },
      { id: 'food_plaza', name: 'Food Plaza', emoji: '🍱', baseCost: 1250000, baseProfitPerMin: 12940, description: 'Quick meals between trains.' },
      { id: 'gift_shop', name: 'Gift Shop', emoji: '🎁', baseCost: 3000000, baseProfitPerMin: 24155, description: 'Souvenirs and last-minute gifts.' },
      { id: 'cab_booking', name: 'Cab Booking', emoji: '🚖', baseCost: 7500000, baseProfitPerMin: 45290, description: 'Rides booked the moment you arrive.' },
      { id: 'railway_hotel', name: 'Railway Hotel', emoji: '🏨', baseCost: 20000000, baseProfitPerMin: 90580, description: 'A room steps from the platform.' },
      { id: 'cargo_terminal', name: 'Cargo Terminal', emoji: '🚉', baseCost: 50000000, baseProfitPerMin: 164690, description: 'Freight loaded onto every outbound train.' },
      { id: 'railway_commercial_hub', name: 'Railway Commercial Hub', emoji: '🚄', baseCost: 125000000, baseProfitPerMin: 301932, description: 'A small city built around the station.' },
    ],
  },
  {
    districtId: 'court_area',
    label: 'Court Area',
    properties: [
      { id: 'photocopy_shop', name: 'Photocopy Shop', emoji: '📑', baseCost: 37500, baseProfitPerMin: 744, description: 'Copies and stamp paper, no queue.' },
      { id: 'typing_center', name: 'Typing Center', emoji: '🖨️', baseCost: 87500, baseProfitPerMin: 1420, description: 'Affidavits and applications typed fast.' },
      { id: 'law_book_store', name: 'Law Book Store', emoji: '📚', baseCost: 200000, baseProfitPerMin: 2551, description: 'Reference texts for every case.' },
      { id: 'lawyers_cafe', name: "Lawyers' Café", emoji: '☕', baseCost: 450000, baseProfitPerMin: 4464, description: 'Where cases get discussed over chai.' },
      { id: 'legal_consultancy', name: 'Legal Consultancy', emoji: '🏢', baseCost: 1000000, baseProfitPerMin: 7440, description: 'Advice for businesses and individuals.' },
      { id: 'corporate_law_office', name: 'Corporate Law Office', emoji: '🏛️', baseCost: 2000000, baseProfitPerMin: 11161, description: 'Contracts and compliance for big clients.' },
      { id: 'arbitration_center', name: 'Arbitration Center', emoji: '⚖️', baseCost: 5000000, baseProfitPerMin: 20292, description: 'Disputes settled outside the courtroom.' },
      { id: 'legal_business_tower', name: 'Legal Business Tower', emoji: '🏢', baseCost: 11250000, baseProfitPerMin: 33482, description: 'Basti\'s tallest address for law firms.' },
    ],
  },
  {
    districtId: 'purani_basti',
    label: 'Purani Basti — Old Market',
    properties: [
      { id: 'sweet_shop', name: 'Sweet Shop', emoji: '🫓', baseCost: 125000, baseProfitPerMin: 2042, description: 'Milk sweets from a century-old recipe.' },
      { id: 'spice_store', name: 'Spice Store', emoji: '🥣', baseCost: 375000, baseProfitPerMin: 5013, description: 'Ground fresh, sold by the sack.' },
      { id: 'handicraft_shop', name: 'Handicraft Shop', emoji: '🪔', baseCost: 1000000, baseProfitPerMin: 10504, description: 'Handmade pottery, brass, and lamps.' },
      { id: 'textile_shop', name: 'Textile Shop', emoji: '🧵', baseCost: 2000000, baseProfitPerMin: 16340, description: 'Bolts of cloth from local weavers.' },
      { id: 'antique_store', name: 'Antique Store', emoji: '🏺', baseCost: 5000000, baseProfitPerMin: 30637, description: 'Old Basti\'s treasures, carefully kept.' },
      { id: 'heritage_restaurant', name: 'Heritage Restaurant', emoji: '🍛', baseCost: 15000000, baseProfitPerMin: 68934, description: 'Recipes passed down four generations.' },
      { id: 'heritage_market', name: 'Heritage Market', emoji: '🏛️', baseCost: 37500000, baseProfitPerMin: 125334, description: 'A living museum you can shop in.' },
      { id: 'cultural_plaza', name: 'Cultural Plaza', emoji: '🎭', baseCost: 100000000, baseProfitPerMin: 245098, description: 'Festivals and shows, year-round.' },
    ],
  },
];

export function getDistrictEconomy(districtId: string): DistrictEconomy | undefined {
  return districtEconomies.find((d) => d.districtId === districtId);
}

/** Total cost to buy every business in a district once each (Level 1) —
 *  used by the pool's dynamic ceiling, which scales as a percentage of
 *  the player's CURRENT district cost rather than one flat rupee amount
 *  for the whole game. Verified via simulation: a flat ceiling works for
 *  early, cheap districts but becomes trivially easy to hit within
 *  minutes once profitPerMin grows in later districts — scaling the
 *  ceiling to the current district's own cost keeps it meaningful at
 *  every stage instead of only the first one. */
export function getDistrictTotalCost(districtId: string): number {
  if (districtUsesStrategyLayer(districtId)) return getStrategyDistrictL1Cost(districtId);
  const economy = getDistrictEconomy(districtId);
  if (!economy) return 0;
  return economy.properties.reduce((sum, p) => sum + p.baseCost, 0);
}

// Position-based theme colors, reused from the original tier palette so
// every district's property list reads consistently regardless of which
// district it belongs to.
const TIER_THEME: { color: string; gradient: string }[] = [
  { color: '#10b981', gradient: 'from-emerald-500 to-emerald-600' },
  { color: '#f59e0b', gradient: 'from-amber-500 to-amber-600' },
  { color: '#3b82f6', gradient: 'from-blue-500 to-blue-600' },
  { color: '#22c55e', gradient: 'from-green-500 to-green-600' },
  { color: '#ef4444', gradient: 'from-red-500 to-red-600' },
  { color: '#6366f1', gradient: 'from-indigo-500 to-indigo-600' },
  { color: '#eab308', gradient: 'from-yellow-400 to-amber-500' },
  { color: '#ec4899', gradient: 'from-pink-500 to-rose-600' },
];

/**
 * Converts a district's raw property list into the exact Business[] shape
 * the rest of the app (StreetView, ShopDetailSheet, App.tsx's game loop)
 * already knows how to render and upgrade. Only the first property starts
 * unlocked (level 1); the rest gate open at ~1.5x the previous property's
 * price, mirroring the original Badeban-era unlock curve.
 */
export function buildBusinessesForDistrict(districtId: string): Business[] {
  const economy = getDistrictEconomy(districtId);
  if (!economy) return [];
  const usesStrategyLayer = districtUsesStrategyLayer(districtId);

  return economy.properties.map((p, i) => {
    const theme = TIER_THEME[i % TIER_THEME.length];
    const isFirst = i === 0;
    const prevBaseCost = i > 0 ? economy.properties[i - 1].baseCost : 0;

    // Strategy-layer districts: the real buy cost and L1 income come from
    // the fixed level tables, not baseCost/baseProfitPerMin (which are
    // kept on the seed only for districts still on the legacy formula).
    const strategyData = usesStrategyLayer ? getStrategyLevelData(districtId, p.id) : null;
    const initialCost = strategyData ? strategyData.buyCost : p.baseCost;
    const initialProfit = strategyData ? strategyData.income[0] : p.baseProfitPerMin;

    return {
      id: p.id,
      name: p.name,
      emoji: p.emoji,
      cost: initialCost,
      baseCost: p.baseCost,
      costMultiplier: 1.15 + i * 0.035,
      profitPerMin: initialProfit,
      baseProfitPerMin: p.baseProfitPerMin,
      unlockAt: isFirst ? 0 : Math.round(prevBaseCost * 1.5),
      // "Moment Zero" — no business anywhere is pre-owned. Every
      // business, in every district, starts genuinely unowned and only
      // ever counts toward profit once the player actually buys it.
      // Originally this was scoped to Badeban's Tea Stall alone,
      // leaving every other district's first business pre-owned at
      // level 1 — that mismatch is exactly what let phantom,
      // never-purchased profit feed the pool for every new player,
      // regardless of district lock status. This is now a genuinely
      // progressive economy: reaching or unlocking a district means
      // nothing on its own; only ownership does.
      level: 0,
      status: 'locked',
      description: p.description,
      themeColor: theme.color,
      gradient: theme.gradient,
      maxLevel: usesStrategyLayer ? 6 : undefined,
    };
  });
}
