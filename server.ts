import express, { type Request, type Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { initDatabase, db } from './src/server/db.ts';
import { calculateProductForecast, getAllForecasts } from './src/server/forecasting.ts';
import { getAnalytics } from './src/server/analytics.ts';
import { getDomainMarketTrends } from './src/server/trends.ts';
import { askCodey } from './src/server/codey.ts';
import { seedDatabase } from './src/server/seed.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.DEFAULT_APP_PORT || process.env.PORT || '3000', 10);
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json());

// Initialize SQLite database schema
initDatabase();

// Check if any products exist; if not, automatically seed with Indian retail demo data
const prodCheck = db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number };
if (!prodCheck || prodCheck.count === 0) {
  console.log('No existing products found. Seeding initial Indian SMB retail demo data...');
  seedDatabase('Kirana / Grocery', false);
}

// -------------------------------------------------------------
// 1. BUSINESS PROFILE API
// -------------------------------------------------------------
app.get('/api/profile', (req: Request, res: Response) => {
  try {
    const seller = db.prepare('SELECT * FROM sellers LIMIT 1').get();
    if (!seller) {
      return res.status(404).json({ error: 'Seller profile not found' });
    }
    res.json(seller);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/profile', (req: Request, res: Response) => {
  try {
    const { name, business_domain, custom_domain, city, state } = req.body;
    if (!name || !business_domain) {
      return res.status(400).json({ error: 'Store name and business domain are required' });
    }

    const nowIso = new Date().toISOString();
    const existing = db.prepare('SELECT id FROM sellers LIMIT 1').get() as { id: string } | undefined;
    
    if (existing) {
      db.prepare(`
        UPDATE sellers
        SET name = ?, business_domain = ?, custom_domain = ?, city = ?, state = ?, updated_at = ?
        WHERE id = ?
      `).run(
        name,
        business_domain,
        custom_domain || null,
        city || 'Lucknow',
        state || 'Uttar Pradesh',
        nowIso,
        existing.id
      );
    } else {
      db.prepare(`
        INSERT INTO sellers (id, name, email, business_domain, custom_domain, city, state, country, currency, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        'seller_default_1',
        name,
        'retail@insight.in',
        business_domain,
        custom_domain || null,
        city || 'Lucknow',
        state || 'Uttar Pradesh',
        'India',
        'INR',
        nowIso,
        nowIso
      );
    }

    const updated = db.prepare('SELECT * FROM sellers LIMIT 1').get();
    res.json({ success: true, profile: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 2. PRODUCT MANAGEMENT API
// -------------------------------------------------------------
app.get('/api/products', (req: Request, res: Response) => {
  try {
    const products = db.prepare(`
      SELECT p.*, f.sales_velocity, f.estimated_days_until_stockout, f.recommended_reorder_date, f.recommended_reorder_quantity
      FROM products p
      LEFT JOIN forecasts f ON p.id = f.product_id
      ORDER BY p.name ASC
    `).all();
    res.json(products);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/products/:id', (req: Request, res: Response) => {
  try {
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    const forecast = calculateProductForecast(req.params.id);
    res.json({ ...product, forecast });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/products', (req: Request, res: Response) => {
  try {
    const { name, category, cost_price, selling_price, current_stock, reorder_threshold } = req.body;
    if (!name || !category || cost_price === undefined || selling_price === undefined || current_stock === undefined) {
      return res.status(400).json({ error: 'Missing required product fields (name, category, cost_price, selling_price, current_stock)' });
    }

    const costNum = Number(cost_price);
    const sellNum = Number(selling_price);
    const stockNum = parseInt(current_stock, 10);
    const thresholdNum = reorder_threshold !== undefined ? parseInt(reorder_threshold, 10) : 10;

    if (isNaN(costNum) || isNaN(sellNum) || isNaN(stockNum) || costNum < 0 || sellNum < 0 || stockNum < 0) {
      return res.status(400).json({ error: 'Prices and stock quantities must be valid non-negative numbers' });
    }

    const id = `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const nowIso = new Date().toISOString();

    db.prepare(`
      INSERT INTO products (id, name, category, cost_price, selling_price, current_stock, reorder_threshold, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, name.trim(), category.trim(), costNum, sellNum, stockNum, thresholdNum, nowIso, nowIso);

    // Initial forecast computation
    const forecast = calculateProductForecast(id);
    const newProduct = db.prepare('SELECT * FROM products WHERE id = ?').get(id);

    res.status(201).json({ success: true, product: { ...newProduct, forecast } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/products/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const { name, category, cost_price, selling_price, current_stock, reorder_threshold } = req.body;
    const costNum = cost_price !== undefined ? Number(cost_price) : (existing as any).cost_price;
    const sellNum = selling_price !== undefined ? Number(selling_price) : (existing as any).selling_price;
    const stockNum = current_stock !== undefined ? parseInt(current_stock, 10) : (existing as any).current_stock;
    const thresholdNum = reorder_threshold !== undefined ? parseInt(reorder_threshold, 10) : (existing as any).reorder_threshold;
    const nowIso = new Date().toISOString();

    db.prepare(`
      UPDATE products
      SET name = ?, category = ?, cost_price = ?, selling_price = ?, current_stock = ?, reorder_threshold = ?, updated_at = ?
      WHERE id = ?
    `).run(
      name ? name.trim() : (existing as any).name,
      category ? category.trim() : (existing as any).category,
      costNum,
      sellNum,
      stockNum,
      thresholdNum,
      nowIso,
      id
    );

    const forecast = calculateProductForecast(id);
    const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    res.json({ success: true, product: { ...updated, forecast } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/products/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Delete associated forecasts and sales
    db.prepare('DELETE FROM forecasts WHERE product_id = ?').run(id);
    db.prepare('DELETE FROM sales WHERE product_id = ?').run(id);
    db.prepare('DELETE FROM products WHERE id = ?').run(id);

    res.json({ success: true, message: `Product ${id} deleted successfully` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 3. SALES MANAGEMENT API
// -------------------------------------------------------------
app.get('/api/sales', (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string, 10) || 50;
    const offset = parseInt(req.query.offset as string, 10) || 0;
    const productId = req.query.productId as string;

    let query = `
      SELECT s.*, p.name as product_name, p.category as product_category
      FROM sales s
      JOIN products p ON s.product_id = p.id
    `;
    const params: any[] = [];

    if (productId) {
      query += ' WHERE s.product_id = ? ';
      params.push(productId);
    }

    query += ' ORDER BY s.sale_date DESC LIMIT ? OFFSET ? ';
    params.push(limit, offset);

    const sales = db.prepare(query).all(...params);
    const totalCount = db.prepare('SELECT COUNT(*) as count FROM sales').get() as { count: number };

    res.json({ sales, total: totalCount ? totalCount.count : 0 });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/sales', (req: Request, res: Response) => {
  try {
    const { product_id, quantity, sale_date, notes } = req.body;
    if (!product_id || quantity === undefined) {
      return res.status(400).json({ error: 'product_id and quantity are required' });
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({ error: 'Quantity must be a positive integer greater than zero' });
    }

    // Fetch product to validate stock and capture historical prices
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(product_id) as {
      id: string;
      name: string;
      category: string;
      cost_price: number;
      selling_price: number;
      current_stock: number;
    } | undefined;

    if (!product) {
      return res.status(404).json({ error: `Product with ID ${product_id} not found` });
    }

    // Prevent invalid sales: cannot sell more than currently available stock
    if (product.current_stock < qty) {
      return res.status(400).json({
        error: `Insufficient stock for "${product.name}". Available: ${product.current_stock} units, requested: ${qty} units.`,
        availableStock: product.current_stock,
      });
    }

    // Capture exact historical transaction prices
    const sellingPriceAtSale = product.selling_price;
    const costPriceAtSale = product.cost_price;
    const totalAmount = Number((sellingPriceAtSale * qty).toFixed(2));
    const profit = Number(((sellingPriceAtSale - costPriceAtSale) * qty).toFixed(2));

    const saleDateStr = sale_date ? new Date(sale_date).toISOString() : new Date().toISOString();
    const saleId = `sale_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const invoiceNo = `INV-${Date.now().toString().slice(-6)}`;
    const nowIso = new Date().toISOString();

    // Decrease stock in product record
    const updatedStock = product.current_stock - qty;
    db.prepare(`
      UPDATE products
      SET current_stock = ?, updated_at = ?
      WHERE id = ?
    `).run(updatedStock, nowIso, product.id);

    // Record the sale
    db.prepare(`
      INSERT INTO sales (id, product_id, quantity, selling_price_at_sale, cost_price_at_sale, total_amount, profit, sale_date, invoice_no, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      saleId,
      product.id,
      qty,
      sellingPriceAtSale,
      costPriceAtSale,
      totalAmount,
      profit,
      saleDateStr,
      invoiceNo,
      notes || 'Store POS transaction',
      nowIso
    );

    // Trigger re-forecasting for this product with the new transaction data
    const updatedForecast = calculateProductForecast(product.id);

    res.status(201).json({
      success: true,
      sale: {
        id: saleId,
        productId: product.id,
        productName: product.name,
        quantity: qty,
        sellingPriceAtSale,
        costPriceAtSale,
        totalAmount,
        profit,
        saleDate: saleDateStr,
        invoiceNo,
        remainingStock: updatedStock,
      },
      forecast: updatedForecast,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 4. ANALYTICS & HERO PRODUCTS API
// -------------------------------------------------------------
app.get('/api/analytics', (req: Request, res: Response) => {
  try {
    const period = (req.query.period as any) || 'all';
    const analytics = getAnalytics(period);
    res.json(analytics);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 5. DEMAND FORECASTING API
// -------------------------------------------------------------
app.get('/api/forecast', (req: Request, res: Response) => {
  try {
    const forecasts = getAllForecasts();
    res.json(forecasts);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/forecast/:id', (req: Request, res: Response) => {
  try {
    const forecast = calculateProductForecast(req.params.id);
    res.json(forecast);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 6. DOMAIN-SPECIFIC INDIA TRENDS API
// -------------------------------------------------------------
app.get('/api/trends', (req: Request, res: Response) => {
  try {
    const seller = db.prepare('SELECT business_domain FROM sellers LIMIT 1').get() as { business_domain: string } | undefined;
    const domain = (req.query.domain as string) || seller?.business_domain || 'Kirana / Grocery';
    const trends = getDomainMarketTrends(domain);
    res.json({
      businessDomain: domain,
      region: 'India (IN)',
      signals: trends,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 7. CODEY AI ASSISTANT API
// -------------------------------------------------------------
app.post('/api/codey/chat', async (req: Request, res: Response) => {
  try {
    const { message, history } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'message string is required' });
    }
    const response = await askCodey({ message, history });
    res.json(response);
  } catch (err: any) {
    console.error('Codey chat error:', err);
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 8. DEMO SEED & RESET API
// -------------------------------------------------------------
app.post('/api/seed', (req: Request, res: Response) => {
  try {
    const { domain, clearExisting } = req.body;
    const result = seedDatabase(domain || 'Kirana / Grocery', clearExisting !== false);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/reset', (req: Request, res: Response) => {
  try {
    db.exec('DELETE FROM sales;');
    db.exec('DELETE FROM forecasts;');
    db.exec('DELETE FROM products;');
    db.exec('DELETE FROM codey_chats;');
    res.json({ success: true, message: 'All inventory, sales, and forecast records cleared' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// VITE MIDDLEWARE / STATIC ASSETS
// -------------------------------------------------------------
async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[InSight] Server running at http://0.0.0.0:${PORT} (${isProduction ? 'production' : 'development'})`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
