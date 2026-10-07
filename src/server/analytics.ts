import { db } from './db.ts';

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

export interface AnalyticsSummary {
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
    formattedDate: string; // DD/MM/YYYY
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
    month: string; // YYYY-MM
    formattedMonth: string; // e.g. "Jul 2026"
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

export function getAnalytics(dateFilter: 'all' | 'today' | '7d' | '30d' | '90d' | '1y' = 'all'): AnalyticsSummary {
  // Check products count
  const productCountRow = db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number };
  const totalProductsCount = productCountRow ? productCountRow.count : 0;

  // Check sales count
  const salesCountRow = db.prepare('SELECT COUNT(*) as count FROM sales').get() as { count: number };
  const totalSalesCount = salesCountRow ? salesCountRow.count : 0;

  if (totalProductsCount === 0) {
    return {
      totalSales: 0,
      totalProfit: 0,
      totalUnitsSold: 0,
      profitMarginPercent: 0,
      totalProductsCount: 0,
      lowStockCount: 0,
      expectedStockoutCount: 0,
      heroProducts: [],
      categoryBreakdown: [],
      salesTrendDaily: [],
      salesTrendWeekly: [],
      salesTrendMonthly: [],
      hasSales: false,
      hasProducts: false,
      messages: {
        products: 'No products added yet.',
        sales: 'Record your first sale to start generating sales analytics.',
        hero: 'Hero product insights will appear after sufficient sales data is available.',
      },
    };
  }

  if (totalSalesCount === 0) {
    // Products exist, but no sales
    const lowStockRow = db.prepare(`
      SELECT COUNT(*) as count FROM products WHERE current_stock <= reorder_threshold
    `).get() as { count: number };

    return {
      totalSales: 0,
      totalProfit: 0,
      totalUnitsSold: 0,
      profitMarginPercent: 0,
      totalProductsCount,
      lowStockCount: lowStockRow ? lowStockRow.count : 0,
      expectedStockoutCount: 0,
      heroProducts: [],
      categoryBreakdown: [],
      salesTrendDaily: [],
      salesTrendWeekly: [],
      salesTrendMonthly: [],
      hasSales: false,
      hasProducts: true,
      messages: {
        sales: 'Record your first sale to start generating sales analytics.',
        hero: 'Hero product insights will appear after sufficient sales data is available.',
      },
    };
  }

  // Date boundary calculation for filtering
  let dateFilterClause = '';
  const now = new Date();
  if (dateFilter === 'today') {
    const todayStr = now.toISOString().split('T')[0];
    dateFilterClause = `WHERE sale_date >= '${todayStr}'`;
  } else if (dateFilter === '7d') {
    const d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    dateFilterClause = `WHERE sale_date >= '${d}'`;
  } else if (dateFilter === '30d') {
    const d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    dateFilterClause = `WHERE sale_date >= '${d}'`;
  } else if (dateFilter === '90d') {
    const d = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    dateFilterClause = `WHERE sale_date >= '${d}'`;
  } else if (dateFilter === '1y') {
    const d = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    dateFilterClause = `WHERE sale_date >= '${d}'`;
  }

  // Overall totals
  const overallTotals = db.prepare(`
    SELECT
      COALESCE(SUM(total_amount), 0) as total_revenue,
      COALESCE(SUM(profit), 0) as total_profit,
      COALESCE(SUM(quantity), 0) as total_units
    FROM sales
    ${dateFilterClause}
  `).get() as { total_revenue: number; total_profit: number; total_units: number };

  const totalSales = Number(overallTotals.total_revenue.toFixed(2));
  const totalProfit = Number(overallTotals.total_profit.toFixed(2));
  const totalUnitsSold = overallTotals.total_units;
  const profitMarginPercent = totalSales > 0 ? Number(((totalProfit / totalSales) * 100).toFixed(1)) : 0;

  // Low stock products count
  const lowStockRow = db.prepare(`
    SELECT COUNT(*) as count FROM products WHERE current_stock <= reorder_threshold
  `).get() as { count: number };
  const lowStockCount = lowStockRow ? lowStockRow.count : 0;

  // Expected stockouts (from forecasts table or calculated)
  const stockoutRow = db.prepare(`
    SELECT COUNT(*) as count FROM forecasts
    WHERE estimated_days_until_stockout IS NOT NULL AND estimated_days_until_stockout <= 7
  `).get() as { count: number };
  const expectedStockoutCount = stockoutRow ? stockoutRow.count : 0;

  // 1. HERO PRODUCT DETECTION
  // Primary factors: Revenue contribution + Profit contribution, supported by units sold
  const productPerformance = db.prepare(`
    SELECT
      p.id as product_id,
      p.name,
      p.category,
      SUM(s.quantity) as units_sold,
      SUM(s.total_amount) as revenue,
      SUM(s.profit) as profit
    FROM sales s
    JOIN products p ON s.product_id = p.id
    ${dateFilterClause}
    GROUP BY p.id, p.name, p.category
    ORDER BY revenue DESC
  `).all() as {
    product_id: string;
    name: string;
    category: string;
    units_sold: number;
    revenue: number;
    profit: number;
  }[];

  const maxRevenue = productPerformance.length > 0 ? Math.max(...productPerformance.map(p => p.revenue)) : 1;
  const maxProfit = productPerformance.length > 0 ? Math.max(...productPerformance.map(p => p.profit)) : 1;

  // Calculate composite hero score: 55% normalized revenue + 45% normalized profit
  const rankedHeroProducts = productPerformance.map(p => {
    const revNorm = maxRevenue > 0 ? p.revenue / maxRevenue : 0;
    const profNorm = maxProfit > 0 ? Math.max(0, p.profit) / maxProfit : 0;
    const heroScore = Number((revNorm * 0.55 + profNorm * 0.45).toFixed(3));
    const profitMargin = p.revenue > 0 ? Number(((p.profit / p.revenue) * 100).toFixed(1)) : 0;
    const revenueContr = totalSales > 0 ? Number(((p.revenue / totalSales) * 100).toFixed(1)) : 0;
    const profitContr = totalProfit > 0 ? Number(((p.profit / totalProfit) * 100).toFixed(1)) : 0;

    return {
      rank: 0,
      productId: p.product_id,
      name: p.name,
      category: p.category,
      unitsSold: p.units_sold,
      revenue: Number(p.revenue.toFixed(2)),
      profit: Number(p.profit.toFixed(2)),
      profitMarginPercent: profitMargin,
      revenueContributionPercent: revenueContr,
      profitContributionPercent: profitContr,
      heroScore,
    };
  });

  rankedHeroProducts.sort((a, b) => b.heroScore - a.heroScore);
  rankedHeroProducts.forEach((item, idx) => {
    item.rank = idx + 1;
  });

  // 2. CATEGORY BREAKDOWN
  const categoryRows = db.prepare(`
    SELECT
      p.category,
      SUM(s.total_amount) as revenue,
      SUM(s.profit) as profit,
      SUM(s.quantity) as units_sold,
      COUNT(DISTINCT p.id) as product_count
    FROM sales s
    JOIN products p ON s.product_id = p.id
    ${dateFilterClause}
    GROUP BY p.category
    ORDER BY revenue DESC
  `).all() as {
    category: string;
    revenue: number;
    profit: number;
    units_sold: number;
    product_count: number;
  }[];

  const categoryBreakdown = categoryRows.map(c => ({
    category: c.category,
    revenue: Number(c.revenue.toFixed(2)),
    profit: Number(c.profit.toFixed(2)),
    unitsSold: c.units_sold,
    productCount: c.product_count,
    profitMarginPercent: c.revenue > 0 ? Number(((c.profit / c.revenue) * 100).toFixed(1)) : 0,
  }));

  // 3. DAILY SALES TREND
  const dailyRows = db.prepare(`
    SELECT
      SUBSTR(sale_date, 1, 10) as day_date,
      SUM(total_amount) as revenue,
      SUM(profit) as profit,
      SUM(quantity) as units_sold,
      COUNT(id) as transaction_count
    FROM sales
    ${dateFilterClause}
    GROUP BY day_date
    ORDER BY day_date ASC
  `).all() as {
    day_date: string;
    revenue: number;
    profit: number;
    units_sold: number;
    transaction_count: number;
  }[];

  const salesTrendDaily = dailyRows.map(d => {
    const parts = d.day_date.split('-');
    const formatted = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : d.day_date;
    return {
      date: d.day_date,
      formattedDate: formatted,
      revenue: Number(d.revenue.toFixed(2)),
      profit: Number(d.profit.toFixed(2)),
      unitsSold: d.units_sold,
      transactionCount: d.transaction_count,
    };
  });

  // 4. WEEKLY SALES TREND
  const weeklyRows = db.prepare(`
    SELECT
      STRFTIME('%Y-W%W', sale_date) as week_str,
      MIN(SUBSTR(sale_date, 1, 10)) as start_date,
      SUM(total_amount) as revenue,
      SUM(profit) as profit,
      SUM(quantity) as units_sold
    FROM sales
    ${dateFilterClause}
    GROUP BY week_str
    ORDER BY week_str ASC
  `).all() as {
    week_str: string;
    start_date: string;
    revenue: number;
    profit: number;
    units_sold: number;
  }[];

  const salesTrendWeekly = weeklyRows.map(w => ({
    week: w.week_str,
    startDate: w.start_date,
    revenue: Number(w.revenue.toFixed(2)),
    profit: Number(w.profit.toFixed(2)),
    unitsSold: w.units_sold,
  }));

  // 5. MONTHLY SALES TREND
  const monthlyRows = db.prepare(`
    SELECT
      SUBSTR(sale_date, 1, 7) as month_str,
      SUM(total_amount) as revenue,
      SUM(profit) as profit,
      SUM(quantity) as units_sold
    FROM sales
    ${dateFilterClause}
    GROUP BY month_str
    ORDER BY month_str ASC
  `).all() as {
    month_str: string;
    revenue: number;
    profit: number;
    units_sold: number;
  }[];

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const salesTrendMonthly = monthlyRows.map(m => {
    const [y, mon] = m.month_str.split('-');
    const monIdx = parseInt(mon, 10) - 1;
    const formattedMonth = `${monthNames[monIdx] || mon} ${y}`;
    return {
      month: m.month_str,
      formattedMonth,
      revenue: Number(m.revenue.toFixed(2)),
      profit: Number(m.profit.toFixed(2)),
      unitsSold: m.units_sold,
    };
  });

  return {
    totalSales,
    totalProfit,
    totalUnitsSold,
    profitMarginPercent,
    totalProductsCount,
    lowStockCount,
    expectedStockoutCount,
    heroProducts: rankedHeroProducts.slice(0, 10),
    categoryBreakdown,
    salesTrendDaily,
    salesTrendWeekly,
    salesTrendMonthly,
    hasSales: true,
    hasProducts: true,
    messages: {},
  };
}
