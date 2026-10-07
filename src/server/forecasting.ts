import { db } from './db.ts';

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
  salesVelocity: number; // units sold per day
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

export function calculateProductForecast(productId: string): ProductForecast {
  const product = db.prepare(`
    SELECT id, name, category, cost_price, selling_price, current_stock, reorder_threshold
    FROM products
    WHERE id = ?
  `).get(productId) as {
    id: string;
    name: string;
    category: string;
    cost_price: number;
    selling_price: number;
    current_stock: number;
    reorder_threshold: number;
  } | undefined;

  if (!product) {
    throw new Error(`Product with ID ${productId} not found`);
  }

  // Retrieve sales history ordered by date
  const salesHistory = db.prepare(`
    SELECT quantity, sale_date
    FROM sales
    WHERE product_id = ?
    ORDER BY sale_date ASC
  `).all(productId) as { quantity: number; sale_date: string }[];

  const now = new Date();
  const leadTimeDays = 3; // Standard Indian SMB supplier replenishment lead time

  if (!salesHistory || salesHistory.length < 2) {
    return {
      productId: product.id,
      productName: product.name,
      category: product.category,
      currentStock: product.current_stock,
      reorderThreshold: product.reorder_threshold,
      sellingPrice: product.selling_price,
      costPrice: product.cost_price,
      totalUnitsSoldHistorical: salesHistory.reduce((sum, s) => sum + s.quantity, 0),
      historicalDaysCount: salesHistory.length,
      salesVelocity: 0,
      velocityPeriodDays: 30,
      estimatedDaysUntilStockout: null,
      estimatedStockoutDate: null,
      recommendedReorderDate: null,
      recommendedReorderQuantity: null,
      riskLevel: product.current_stock <= product.reorder_threshold ? 'LOW_STOCK' : 'INSUFFICIENT_DATA',
      statusMessage: 'Not enough historical sales data to generate a reliable forecast yet. Record at least a few sales across multiple days.',
      methodology: 'Awaiting sufficient transaction history (minimum 2 distinct sales records).',
      hasEnoughHistory: false,
      leadTimeDays,
    };
  }

  // Calculate earliest and latest sale date to determine historical span
  const firstSaleDate = new Date(salesHistory[0].sale_date);
  const lastSaleDate = new Date(salesHistory[salesHistory.length - 1].sale_date);
  const timeSpanDays = Math.max(1, Math.round((lastSaleDate.getTime() - firstSaleDate.getTime()) / (1000 * 60 * 60 * 24)));

  // If time span is less than 3 days, declare insufficient history
  if (timeSpanDays < 3 && salesHistory.length < 5) {
    return {
      productId: product.id,
      productName: product.name,
      category: product.category,
      currentStock: product.current_stock,
      reorderThreshold: product.reorder_threshold,
      sellingPrice: product.selling_price,
      costPrice: product.cost_price,
      totalUnitsSoldHistorical: salesHistory.reduce((sum, s) => sum + s.quantity, 0),
      historicalDaysCount: timeSpanDays,
      salesVelocity: 0,
      velocityPeriodDays: timeSpanDays,
      estimatedDaysUntilStockout: null,
      estimatedStockoutDate: null,
      recommendedReorderDate: null,
      recommendedReorderQuantity: null,
      riskLevel: product.current_stock <= product.reorder_threshold ? 'LOW_STOCK' : 'INSUFFICIENT_DATA',
      statusMessage: 'Not enough historical sales data to generate a reliable forecast yet. Sales span is too brief.',
      methodology: 'Time-window threshold not met (requires at least 3-5 days of observation).',
      hasEnoughHistory: false,
      leadTimeDays,
    };
  }

  // Aggregate sales by day over the past 30 days and 60 days
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const recentSales = salesHistory.filter(s => new Date(s.sale_date) >= thirtyDaysAgo);
  
  let salesVelocity = 0;
  let methodology = '';

  if (recentSales.length > 0) {
    // 30-day velocity with exponential smoothing weighting more recent days
    const totalRecentUnits = recentSales.reduce((sum, s) => sum + s.quantity, 0);
    const effectiveDays = Math.min(30, Math.max(7, timeSpanDays));
    const simpleVelocity = totalRecentUnits / effectiveDays;
    
    // Weighted moving average: last 7 days vs older days
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last7DaysSales = salesHistory.filter(s => new Date(s.sale_date) >= sevenDaysAgo);
    const last7Units = last7DaysSales.reduce((sum, s) => sum + s.quantity, 0);
    const velocity7d = last7Units / 7;

    // Blend: 60% recent 7-day velocity + 40% 30-day velocity
    salesVelocity = Number((0.6 * velocity7d + 0.4 * simpleVelocity).toFixed(2));
    methodology = 'Exponentially weighted moving average (60% 7-day short-term velocity + 40% 30-day baseline trend).';
  } else {
    // Fall back to entire history average
    const totalUnits = salesHistory.reduce((sum, s) => sum + s.quantity, 0);
    salesVelocity = Number((totalUnits / timeSpanDays).toFixed(2));
    methodology = 'Full historical window daily average velocity.';
  }

  // Minimum floor if sales exist but velocity is very tiny
  if (salesVelocity <= 0.05) {
    salesVelocity = 0.05;
  }

  // Calculate days until stockout
  let estimatedDaysUntilStockout: number | null = null;
  let estimatedStockoutDate: string | null = null;
  let recommendedReorderDate: string | null = null;
  let recommendedReorderQuantity: number | null = null;

  estimatedDaysUntilStockout = Number((product.current_stock / salesVelocity).toFixed(1));
  
  const stockoutDateObj = new Date(now.getTime() + estimatedDaysUntilStockout * 24 * 60 * 60 * 1000);
  estimatedStockoutDate = stockoutDateObj.toISOString().split('T')[0];

  // Reorder date considering supplier lead time
  const reorderDateObj = new Date(stockoutDateObj.getTime() - leadTimeDays * 24 * 60 * 60 * 1000);
  recommendedReorderDate = reorderDateObj.toISOString().split('T')[0];

  // Recommended reorder quantity: target 21 days buffer + safety stock (3 days) - current stock
  const targetBufferDays = 21;
  const safetyStock = Math.ceil(leadTimeDays * salesVelocity);
  const targetStock = Math.ceil((targetBufferDays * salesVelocity) + safetyStock);
  recommendedReorderQuantity = Math.max(1, targetStock - product.current_stock);

  // Determine Risk Level
  let riskLevel: ProductForecast['riskLevel'] = 'HEALTHY';
  let statusMessage = 'Stock levels are currently healthy and well-managed.';

  if (product.current_stock === 0) {
    riskLevel = 'CRITICAL';
    statusMessage = 'CRITICAL: Product is completely out of stock. Restock immediately.';
  } else if (estimatedDaysUntilStockout <= 3) {
    riskLevel = 'CRITICAL';
    statusMessage = `CRITICAL: Estimated stockout in ${estimatedDaysUntilStockout} days! Restock urgently before supply disruption.`;
  } else if (estimatedDaysUntilStockout <= 7 || product.current_stock <= product.reorder_threshold) {
    riskLevel = 'WARNING';
    statusMessage = `WARNING: Stock approaching low threshold. Estimated stockout in ${estimatedDaysUntilStockout} days.`;
  } else if (product.current_stock <= product.reorder_threshold * 1.2) {
    riskLevel = 'LOW_STOCK';
    statusMessage = `Low stock notice: Current stock is close to reorder threshold (${product.reorder_threshold} units).`;
  }

  // Update or insert into forecast table
  const forecastId = `fc_${product.id}`;
  const nowIso = now.toISOString();
  db.prepare(`
    INSERT INTO forecasts (
      id, product_id, sales_velocity, estimated_days_until_stockout,
      estimated_stockout_date, recommended_reorder_date, recommended_reorder_quantity,
      forecast_metadata, generated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      sales_velocity = excluded.sales_velocity,
      estimated_days_until_stockout = excluded.estimated_days_until_stockout,
      estimated_stockout_date = excluded.estimated_stockout_date,
      recommended_reorder_date = excluded.recommended_reorder_date,
      recommended_reorder_quantity = excluded.recommended_reorder_quantity,
      forecast_metadata = excluded.forecast_metadata,
      generated_at = excluded.generated_at
  `).run(
    forecastId,
    product.id,
    salesVelocity,
    estimatedDaysUntilStockout,
    estimatedStockoutDate,
    recommendedReorderDate,
    recommendedReorderQuantity,
    JSON.stringify({ riskLevel, methodology, leadTimeDays }),
    nowIso
  );

  return {
    productId: product.id,
    productName: product.name,
    category: product.category,
    currentStock: product.current_stock,
    reorderThreshold: product.reorder_threshold,
    sellingPrice: product.selling_price,
    costPrice: product.cost_price,
    totalUnitsSoldHistorical: salesHistory.reduce((sum, s) => sum + s.quantity, 0),
    historicalDaysCount: timeSpanDays,
    salesVelocity,
    velocityPeriodDays: 30,
    estimatedDaysUntilStockout,
    estimatedStockoutDate,
    recommendedReorderDate,
    recommendedReorderQuantity,
    riskLevel,
    statusMessage,
    methodology,
    hasEnoughHistory: true,
    leadTimeDays,
  };
}

export function getAllForecasts(): ProductForecast[] {
  const products = db.prepare('SELECT id FROM products ORDER BY name ASC').all() as { id: string }[];
  return products.map(p => calculateProductForecast(p.id));
}
