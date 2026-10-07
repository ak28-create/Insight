import { db } from './db.ts';
import { calculateProductForecast } from './forecasting.ts';

interface SeedProduct {
  id: string;
  name: string;
  category: string;
  cost_price: number;
  selling_price: number;
  current_stock: number;
  reorder_threshold: number;
  daily_sales_avg: number; // target velocity for realistic simulation
  variance: number;
}

export const INDIAN_RETAIL_SEEDS: Record<string, {
  storeName: string;
  domain: string;
  city: string;
  state: string;
  products: SeedProduct[];
}> = {
  'Kirana / Grocery': {
    storeName: 'Sharma General Store',
    domain: 'Kirana / Grocery',
    city: 'Lucknow',
    state: 'Uttar Pradesh',
    products: [
      { id: 'p_kirana_01', name: 'Aashirvaad Superior MP Sharbati Atta 5kg', category: 'Staples & Grains', cost_price: 235, selling_price: 275, current_stock: 38, reorder_threshold: 15, daily_sales_avg: 3.2, variance: 1.2 },
      { id: 'p_kirana_02', name: 'Tata Salt Vacuum Evaporated 1kg', category: 'Staples & Grains', cost_price: 22, selling_price: 28, current_stock: 82, reorder_threshold: 25, daily_sales_avg: 4.8, variance: 1.5 },
      { id: 'p_kirana_03', name: 'Fortune Sunlite Refined Sunflower Oil 1L', category: 'Edible Oils & Ghee', cost_price: 138, selling_price: 162, current_stock: 24, reorder_threshold: 12, daily_sales_avg: 2.1, variance: 0.8 },
      { id: 'p_kirana_04', name: 'Amul Taaza Homogenised Toned Milk 1L', category: 'Dairy & Daily Essentials', cost_price: 54, selling_price: 64, current_stock: 7, reorder_threshold: 20, daily_sales_avg: 5.6, variance: 1.8 }, // Imminent stockout!
      { id: 'p_kirana_05', name: 'Parle-G Original Gluco Biscuits 250g', category: 'Biscuits & Snacks', cost_price: 24, selling_price: 30, current_stock: 105, reorder_threshold: 30, daily_sales_avg: 7.4, variance: 2.2 }, // Hero product!
      { id: 'p_kirana_06', name: 'Maggi 2-Minute Masala Instant Noodles 70g', category: 'Packaged Foods', cost_price: 11.5, selling_price: 14, current_stock: 130, reorder_threshold: 40, daily_sales_avg: 8.5, variance: 2.5 }, // Hero product!
      { id: 'p_kirana_07', name: 'Britannia 100% Whole Wheat Bread 400g', category: 'Dairy & Daily Essentials', cost_price: 38, selling_price: 45, current_stock: 5, reorder_threshold: 15, daily_sales_avg: 3.8, variance: 1.1 }, // Approaching stockout!
      { id: 'p_kirana_08', name: 'Tata Tea Gold Rich Taste 500g', category: 'Tea & Coffee', cost_price: 285, selling_price: 340, current_stock: 22, reorder_threshold: 10, daily_sales_avg: 1.4, variance: 0.6 },
      { id: 'p_kirana_09', name: 'Surf Excel Easy Wash Detergent Powder 1kg', category: 'Household & Cleaning', cost_price: 125, selling_price: 148, current_stock: 28, reorder_threshold: 12, daily_sales_avg: 1.9, variance: 0.7 },
      { id: 'p_kirana_10', name: 'Dettol Original Antiseptic Liquid 250ml', category: 'Personal Care', cost_price: 122, selling_price: 142, current_stock: 18, reorder_threshold: 10, daily_sales_avg: 1.1, variance: 0.5 },
      { id: 'p_kirana_11', name: 'Coca-Cola Original Taste Pet Bottle 750ml', category: 'Food & Beverages', cost_price: 35, selling_price: 45, current_stock: 4, reorder_threshold: 15, daily_sales_avg: 3.5, variance: 1.4 }, // Critical alert!
      { id: 'p_kirana_12', name: 'Lays Classic Salted Potato Chips 50g', category: 'Biscuits & Snacks', cost_price: 16, selling_price: 20, current_stock: 62, reorder_threshold: 25, daily_sales_avg: 4.2, variance: 1.6 },
      { id: 'p_kirana_13', name: 'Cadbury Dairy Milk Silk Chocolate 60g', category: 'Packaged Foods', cost_price: 72, selling_price: 90, current_stock: 25, reorder_threshold: 10, daily_sales_avg: 1.7, variance: 0.8 },
      { id: 'p_kirana_14', name: 'Haldiram Nagpur Aloo Bhujia 400g', category: 'Biscuits & Snacks', cost_price: 95, selling_price: 115, current_stock: 35, reorder_threshold: 15, daily_sales_avg: 2.3, variance: 0.9 },
      { id: 'p_kirana_15', name: 'Vim Lemon Dishwash Bar 300g', category: 'Household & Cleaning', cost_price: 26, selling_price: 32, current_stock: 50, reorder_threshold: 20, daily_sales_avg: 3.1, variance: 1.0 },
    ],
  },
  'Mobile Accessories': {
    storeName: 'Gupta Mobile Zone',
    domain: 'Mobile Accessories',
    city: 'Jaipur',
    state: 'Rajasthan',
    products: [
      { id: 'p_mob_01', name: '65W Vooc Super Fast USB-C Cable 1.5m', category: 'Cables & Adapters', cost_price: 180, selling_price: 399, current_stock: 45, reorder_threshold: 15, daily_sales_avg: 3.8, variance: 1.2 },
      { id: 'p_mob_02', name: '20W PD Fast Charging Wall Adapter', category: 'Cables & Adapters', cost_price: 240, selling_price: 549, current_stock: 28, reorder_threshold: 12, daily_sales_avg: 2.9, variance: 1.0 },
      { id: 'p_mob_03', name: '9D Edge-to-Edge Tempered Glass Protector', category: 'Screen Protectors', cost_price: 45, selling_price: 199, current_stock: 85, reorder_threshold: 25, daily_sales_avg: 6.2, variance: 2.0 },
      { id: 'p_mob_04', name: 'Transparent Shockproof Air-Cushion Case', category: 'Phone Cases', cost_price: 60, selling_price: 249, current_stock: 6, reorder_threshold: 20, daily_sales_avg: 4.1, variance: 1.5 }, // Low stock!
      { id: 'p_mob_05', name: 'BassPro Magnetic Wireless Neckband Earphone', category: 'Audio & Wearables', cost_price: 480, selling_price: 899, current_stock: 14, reorder_threshold: 8, daily_sales_avg: 1.6, variance: 0.8 },
      { id: 'p_mob_06', name: '10000mAh Dual-Port Power Bank', category: 'Power Banks', cost_price: 590, selling_price: 1099, current_stock: 9, reorder_threshold: 5, daily_sales_avg: 1.1, variance: 0.6 },
    ],
  },
  'Apparel': {
    storeName: 'Kalyan Fashion & Sarees',
    domain: 'Apparel',
    city: 'Surat',
    state: 'Gujarat',
    products: [
      { id: 'p_app_01', name: 'Pure Cotton Printed Kurta for Men', category: 'Ethnic Wear', cost_price: 380, selling_price: 799, current_stock: 22, reorder_threshold: 10, daily_sales_avg: 2.2, variance: 0.9 },
      { id: 'p_app_02', name: 'Oversized Bio-Washed Graphic T-Shirt', category: 'Casual Wear', cost_price: 220, selling_price: 499, current_stock: 45, reorder_threshold: 15, daily_sales_avg: 4.1, variance: 1.5 },
      { id: 'p_app_03', name: 'Stretchable Slim-Fit Dark Blue Denim Jeans', category: 'Bottom Wear', cost_price: 520, selling_price: 1199, current_stock: 18, reorder_threshold: 8, daily_sales_avg: 1.8, variance: 0.7 },
      { id: 'p_app_04', name: 'Banarasi Soft Silk Saree with Blouse Piece', category: 'Ethnic Wear', cost_price: 850, selling_price: 1899, current_stock: 12, reorder_threshold: 5, daily_sales_avg: 1.2, variance: 0.6 },
    ],
  },
};

export function seedDatabase(domainKey: string = 'Kirana / Grocery', clearExisting: boolean = true) {
  const seedConfig = INDIAN_RETAIL_SEEDS[domainKey] || INDIAN_RETAIL_SEEDS['Kirana / Grocery'];

  if (clearExisting) {
    db.exec('DELETE FROM sales;');
    db.exec('DELETE FROM forecasts;');
    db.exec('DELETE FROM products;');
    db.exec('DELETE FROM sellers;');
    db.exec('DELETE FROM codey_chats;');
  }

  const now = new Date();
  const nowIso = now.toISOString();

  // 1. Insert or update Seller
  db.prepare(`
    INSERT INTO sellers (id, name, email, business_domain, custom_domain, city, state, country, currency, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      email = excluded.email,
      business_domain = excluded.business_domain,
      custom_domain = excluded.custom_domain,
      city = excluded.city,
      state = excluded.state,
      country = excluded.country,
      currency = excluded.currency,
      updated_at = excluded.updated_at
  `).run(
    'seller_default_1',
    seedConfig.storeName,
    'store.owner@retail-insight.in',
    seedConfig.domain,
    null,
    seedConfig.city,
    seedConfig.state,
    'India',
    'INR',
    nowIso,
    nowIso
  );

  // 2. Insert Products
  const insertProductStmt = db.prepare(`
    INSERT OR REPLACE INTO products (id, name, category, cost_price, selling_price, current_stock, reorder_threshold, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const prod of seedConfig.products) {
    insertProductStmt.run(
      prod.id,
      prod.name,
      prod.category,
      prod.cost_price,
      prod.selling_price,
      prod.current_stock,
      prod.reorder_threshold,
      nowIso,
      nowIso
    );
  }

  // 3. Generate 180 days of realistic Indian retail sales history
  const insertSaleStmt = db.prepare(`
    INSERT INTO sales (id, product_id, quantity, selling_price_at_sale, cost_price_at_sale, total_amount, profit, sale_date, invoice_no, notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let saleCounter = 1000;
  const daysOfHistory = 180; // 6 months of historical transactions

  for (let dayOffset = daysOfHistory; dayOffset >= 0; dayOffset--) {
    const saleDateObj = new Date(now.getTime() - dayOffset * 24 * 60 * 60 * 1000);
    const dayOfWeek = saleDateObj.getDay(); // 0 = Sunday, 6 = Saturday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const weekendMultiplier = isWeekend ? 1.35 : 1.0; // Higher retail footfall on Indian weekends

    for (const prod of seedConfig.products) {
      // Calculate realistic random daily sales based on product sales velocity
      // Add slight seasonal/weekly wave
      const baseChance = Math.min(0.95, prod.daily_sales_avg / 3);
      if (Math.random() < baseChance) {
        // Random variance
        const rawUnits = Math.max(1, Math.round((prod.daily_sales_avg + (Math.random() - 0.5) * prod.variance * 2) * weekendMultiplier));
        const quantity = Math.max(1, Math.min(rawUnits, 15));

        // Slight historical price shift simulation (within realistic 2%)
        const sellingPriceAtSale = prod.selling_price;
        const costPriceAtSale = prod.cost_price;
        const totalAmount = Number((sellingPriceAtSale * quantity).toFixed(2));
        const profit = Number(((sellingPriceAtSale - costPriceAtSale) * quantity).toFixed(2));

        // Distribute transaction times realistically between 9:00 AM and 9:30 PM IST
        const hour = 9 + Math.floor(Math.random() * 12);
        const minute = Math.floor(Math.random() * 60);
        saleDateObj.setHours(hour, minute, 0, 0);

        saleCounter++;
        const saleId = `sale_${saleCounter}`;
        const invoiceNo = `INV-2026-${saleCounter}`;

        insertSaleStmt.run(
          saleId,
          prod.id,
          quantity,
          sellingPriceAtSale,
          costPriceAtSale,
          totalAmount,
          profit,
          saleDateObj.toISOString(),
          invoiceNo,
          'Counter POS Transaction',
          saleDateObj.toISOString()
        );
      }
    }
  }

  // 4. Run forecasting algorithm across all seeded products to generate initial forecast table
  for (const prod of seedConfig.products) {
    calculateProductForecast(prod.id);
  }

  console.log(`Successfully seeded database with ${seedConfig.products.length} products and 180 days of realistic sales for ${seedConfig.storeName} (${seedConfig.domain})`);
  return {
    success: true,
    storeName: seedConfig.storeName,
    domain: seedConfig.domain,
    productsCount: seedConfig.products.length,
    historyDays: daysOfHistory,
  };
}
