import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';

// Database storage location
const DB_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}
const DB_PATH = path.join(DB_DIR, 'insight.db');

export const db = new DatabaseSync(DB_PATH);

// Initialize schema
export function initDatabase() {
  db.exec('PRAGMA foreign_keys = ON;');
  
  // 1. SELLER / USER Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS sellers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT,
      business_domain TEXT NOT NULL DEFAULT 'Kirana / Grocery',
      custom_domain TEXT,
      city TEXT DEFAULT 'Lucknow',
      state TEXT DEFAULT 'Uttar Pradesh',
      country TEXT DEFAULT 'India',
      currency TEXT DEFAULT 'INR',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // 2. PRODUCT Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      cost_price REAL NOT NULL,
      selling_price REAL NOT NULL,
      current_stock INTEGER NOT NULL,
      reorder_threshold INTEGER NOT NULL DEFAULT 10,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
  `);

  // 3. SALE Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS sales (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      selling_price_at_sale REAL NOT NULL,
      cost_price_at_sale REAL NOT NULL,
      total_amount REAL NOT NULL,
      profit REAL NOT NULL,
      sale_date TEXT NOT NULL,
      invoice_no TEXT,
      notes TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_sales_product_id ON sales(product_id);
    CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(sale_date);
  `);

  // 4. FORECAST Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS forecasts (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      sales_velocity REAL NOT NULL,
      estimated_days_until_stockout REAL,
      estimated_stockout_date TEXT,
      recommended_reorder_date TEXT,
      recommended_reorder_quantity INTEGER,
      forecast_metadata TEXT,
      generated_at TEXT NOT NULL,
      FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_forecasts_product ON forecasts(product_id);
  `);

  // 5. TREND DATA Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS trend_data (
      id TEXT PRIMARY KEY,
      business_domain TEXT NOT NULL,
      product_category TEXT,
      keywords_used TEXT NOT NULL,
      geographic_region TEXT NOT NULL DEFAULT 'IN',
      trend_value REAL NOT NULL,
      trend_direction TEXT NOT NULL,
      time_period TEXT NOT NULL,
      retrieved_at TEXT NOT NULL
    );
  `);

  // 6. CODEY CHAT Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS codey_chats (
      id TEXT PRIMARY KEY,
      seller_id TEXT,
      role TEXT NOT NULL,
      message TEXT NOT NULL,
      context_used TEXT,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_codey_created ON codey_chats(created_at);
  `);

  // Check if seller exists, otherwise create default demo profile
  const existingSeller = db.prepare('SELECT id FROM sellers LIMIT 1').get();
  if (!existingSeller) {
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO sellers (id, name, email, business_domain, custom_domain, city, state, country, currency, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'seller_default_1',
      'Sharma General Store',
      'sharma.retail@example.in',
      'Kirana / Grocery',
      null,
      'Lucknow',
      'Uttar Pradesh',
      'India',
      'INR',
      now,
      now
    );
  }
}
