export interface SellerProfile {
  id: string;
  name: string;
  email: string;
  business_domain: string;
  custom_domain?: string | null;
  city: string;
  state: string;
  country: string;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  cost_price: number;
  selling_price: number;
  current_stock: number;
  reorder_threshold: number;
  sales_velocity?: number | null;
  estimated_days_until_stockout?: number | null;
  recommended_reorder_date?: string | null;
  recommended_reorder_quantity?: number | null;
  created_at: string;
  updated_at: string;
}

export interface Sale {
  id: string;
  product_id: string;
  product_name?: string;
  product_category?: string;
  quantity: number;
  selling_price_at_sale: number;
  cost_price_at_sale: number;
  total_amount: number;
  profit: number;
  sale_date: string;
  invoice_no?: string;
  notes?: string;
  created_at: string;
}

export interface HeroProduct {
  rank: number;
  productId: string;
  name: string;
  category: string;
  unitsSold: number;
  revenue: number;
  profit: number;
  profitMarginPercent: number;
  revenueContributionPercent: number;
  profitContributionPercent: number;
  heroScore: number;
}

export interface AnalyticsData {
  totalSales: number;
  totalProfit: number;
  totalUnitsSold: number;
  profitMarginPercent: number;
  totalProductsCount: number;
  lowStockCount: number;
  expectedStockoutCount: number;
  heroProducts: HeroProduct[];
  categoryBreakdown: {
    category: string;
    revenue: number;
    profit: number;
    unitsSold: number;
    productCount: number;
    profitMarginPercent: number;
  }[];
  salesTrendDaily: {
    date: string;
    formattedDate: string;
    revenue: number;
    profit: number;
    unitsSold: number;
    transactionCount: number;
  }[];
  salesTrendWeekly: {
    week: string;
    startDate: string;
    revenue: number;
    profit: number;
    unitsSold: number;
  }[];
  salesTrendMonthly: {
    month: string;
    formattedMonth: string;
    revenue: number;
    profit: number;
    unitsSold: number;
  }[];
  hasSales: boolean;
  hasProducts: boolean;
  messages: {
    products?: string;
    sales?: string;
    hero?: string;
  };
}

export interface ProductForecast {
  productId: string;
  productName: string;
  category: string;
  currentStock: number;
  reorderThreshold: number;
  sellingPrice: number;
  costPrice: number;
  totalUnitsSoldHistorical: number;
  historicalDaysCount: number;
  salesVelocity: number;
  velocityPeriodDays: number;
  estimatedDaysUntilStockout: number | null;
  estimatedStockoutDate: string | null;
  recommendedReorderDate: string | null;
  recommendedReorderQuantity: number | null;
  riskLevel: 'CRITICAL' | 'WARNING' | 'LOW_STOCK' | 'HEALTHY' | 'INSUFFICIENT_DATA';
  statusMessage: string;
  methodology: string;
  hasEnoughHistory: boolean;
  leadTimeDays: number;
}

export interface MarketTrendSignal {
  id: string;
  businessDomain: string;
  category: string;
  keyword: string;
  searchVolumeIndex: number;
  trendDirection: 'Rising' | 'High Demand' | 'Stable' | 'Seasonal Peak';
  growthPercentage: number;
  geographicRegion: string;
  timePeriod: string;
  relevanceScore: number;
  insightSummary: string;
  lastUpdated: string;
  isExternalSignal: true;
}

export interface CodeyMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  contextSummary?: {
    businessName: string;
    businessDomain: string;
    totalProducts: number;
    totalSalesInr: string;
    totalProfitInr: string;
    lowStockCount: number;
    criticalStockoutCount: number;
    heroProductsCount: number;
  };
}
