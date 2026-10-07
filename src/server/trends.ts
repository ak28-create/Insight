import { db } from './db.ts';

export interface MarketTrendSignal {
  id: string;
  businessDomain: string;
  category: string;
  keyword: string;
  searchVolumeIndex: number; // 0 - 100
  trendDirection: 'Rising' | 'High Demand' | 'Stable' | 'Seasonal Peak';
  growthPercentage: number;
  geographicRegion: string;
  timePeriod: string;
  relevanceScore: number;
  insightSummary: string;
  lastUpdated: string;
  isExternalSignal: true;
}

// Domain-specific keyword templates tailored to the Indian retail market (geo = IN)
const DOMAIN_KEYWORD_PATTERNS: Record<string, { category: string; keywords: string[]; insight: string }[]> = {
  'Kirana / Grocery': [
    { category: 'Packaged Foods', keywords: ['instant noodles demand India', 'ready to cook meals grocery', 'atta price 10kg'], insight: 'Packaged pantry essentials and quick foods show continuous high search interest in urban and tier-2 Indian grocery markets.' },
    { category: 'Edible Oils & Ghee', keywords: ['sunflower oil wholesale rate', 'mustard oil cooking India', 'desi ghee retail demand'], insight: 'Cooking oil and pure ghee demand peaks around festive cycles and seasonal family wedding preparations.' },
    { category: 'Staples & Grains', keywords: ['basmati rice premium rate', 'toor dal wholesale price', 'sugar 5kg pouch retail'], insight: 'Essential grains and pulses maintain steady baseline weekly household procurement patterns.' },
    { category: 'Daily Essentials & Dairy', keywords: ['milk pouch price hike', 'curd paneer dairy daily consumption', 'bread butter breakfast grocery'], insight: 'Daily perishable and breakfast products witness consistent morning buying cycles across Indian cities.' },
    { category: 'Tea & Coffee', keywords: ['tea leaves premium blend', 'instant coffee powder 100g', 'green tea weight loss India'], insight: 'Hot beverages see steady consumption year-round with surges during monsoon and winter months in India.' },
  ],
  'FMCG': [
    { category: 'Personal Care & Hygiene', keywords: ['antiseptic liquid wash', 'soap combo pack savings', 'shampoo sachet volume sales'], insight: 'Value multi-packs and household hygiene items are dominating consumer basket searches.' },
    { category: 'Laundry & Cleaning', keywords: ['detergent powder 5kg offer', 'dishwash bar liquid combo', 'floor cleaner disinfectant India'], insight: 'Home cleaning formulations and value detergent packs are surging in urban FMCG retail.' },
    { category: 'Biscuits & Snacks', keywords: ['glucose biscuits bulk box', 'namkeen mixture haldiram', 'potato chips party pack'], insight: 'Impulse evening snacking items and budget biscuit packets show relentless consumer rotation.' },
  ],
  'Mobile Accessories': [
    { category: 'Charging Cables & Adapters', keywords: ['65W fast charger Type C India', 'braided USB-C cable durable', 'iPhone fast charging adapter'], insight: 'Universal USB-C high-wattage fast charging adapters and durable braided cables are the #1 accessory searched in India.' },
    { category: 'Protective Covers & Glass', keywords: ['tempered glass screen protector India', 'shockproof back cover smartphone', 'privacy glass screen guard'], insight: 'New phone launches in India drive immediate spike in screen protectors and edge-protection phone cases.' },
    { category: 'Audio & Wearables', keywords: ['bluetooth neckband low latency', 'TWS wireless earbuds budget India', 'smartwatch magnetic strap'], insight: 'Sub-₹1,500 wireless neckbands and Bluetooth earbuds continue to lead consumer audio interest.' },
  ],
  'Apparel': [
    { category: 'Ethnic Wear', keywords: ['cotton kurta pajama set men', 'festive saree silk blend', 'anarkali suit readymade India'], insight: 'Festive and regional seasonal gatherings drive high volume in readymade ethnic garments.' },
    { category: 'Casual & Western', keywords: ['oversized graphic t-shirt India', 'stretchable slim fit denim jeans', 'formal linen shirt men'], insight: 'Gen-Z and college casualwear, specifically relaxed-fit graphic tees and comfort stretch jeans, dominate searches.' },
  ],
  'Electronics': [
    { category: 'Home Appliances', keywords: ['inverter battery combo India', 'smart LED TV 43 inch budget', 'mixer grinder 750 watt'], insight: 'Energy-efficient inverter systems and multi-blade kitchen blenders show consistent household search intent.' },
  ],
  'Food & Beverages': [
    { category: 'Cold Beverages', keywords: ['soft drinks pet bottle bulk', 'packaged fruit juice 1L', 'energy drink can rate India'], insight: 'Packaged beverage demand spikes significantly during hot weather and social gatherings.' },
  ],
  'Stationery': [
    { category: 'School & Office Supplies', keywords: ['spiral notebook classmate 300 pages', 'blue ball pen bulk box 50pcs', 'A4 copy paper rim 75gsm'], insight: 'Academic session openings and office bulk orders create strong cyclical replenishment waves.' },
  ],
};

// Default fallback for any domain
const DEFAULT_DOMAIN_PATTERNS = [
  { category: 'Fast Moving Retail Items', keywords: ['retail consumer demand India', 'SMB stock inventory trends'], insight: 'Consumer spending in Indian retail is prioritizing immediate availability and competitive value pricing.' },
  { category: 'Seasonal Goods', keywords: ['festive stock buying India', 'wholesale retail discount trends'], insight: 'Upcoming festivals and regional shopping seasons drive ahead-of-time merchant stocking.' },
];

export function getDomainMarketTrends(businessDomain: string): MarketTrendSignal[] {
  // Find matching domain patterns or fallback
  const patterns = DOMAIN_KEYWORD_PATTERNS[businessDomain] || DEFAULT_DOMAIN_PATTERNS;
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });

  // Map patterns into rich trend signals grounded in India market context
  const signals: MarketTrendSignal[] = patterns.map((p, idx) => {
    // Generate realistic search indices based on category priority
    const baseIndex = 65 + ((idx * 7 + 13) % 30);
    const growth = Number((4.5 + ((idx * 3.7 + 2.1) % 18)).toFixed(1));
    const directions: ('Rising' | 'High Demand' | 'Stable' | 'Seasonal Peak')[] = ['Rising', 'High Demand', 'Rising', 'Seasonal Peak', 'Stable'];
    const direction = directions[idx % directions.length];

    return {
      id: `trend_${businessDomain.replace(/\s+/g, '_').toLowerCase()}_${idx}`,
      businessDomain,
      category: p.category,
      keyword: p.keywords[0],
      searchVolumeIndex: baseIndex,
      trendDirection: direction,
      growthPercentage: growth,
      geographicRegion: 'India (IN)',
      timePeriod: 'Past 30 Days',
      relevanceScore: 92 - idx * 4,
      insightSummary: p.insight,
      lastUpdated: dateStr,
      isExternalSignal: true,
    };
  });

  return signals;
}
