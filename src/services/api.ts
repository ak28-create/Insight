import {
  SellerProfile,
  Product,
  Sale,
  AnalyticsData,
  ProductForecast,
  MarketTrendSignal,
} from '../types';

export const api = {
  // 1. Profile
  async getProfile(): Promise<SellerProfile> {
    const res = await fetch('/api/profile');
    if (!res.ok) throw new Error('Failed to load profile');
    return res.json();
  },

  async updateProfile(data: Partial<SellerProfile>): Promise<{ success: boolean; profile: SellerProfile }> {
    const res = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to update profile' }));
      throw new Error(err.error || 'Failed to update profile');
    }
    return res.json();
  },

  // 2. Products
  async getProducts(): Promise<Product[]> {
    const res = await fetch('/api/products');
    if (!res.ok) throw new Error('Failed to fetch products');
    return res.json();
  },

  async getProduct(id: string): Promise<Product & { forecast: ProductForecast }> {
    const res = await fetch(`/api/products/${id}`);
    if (!res.ok) throw new Error('Product not found');
    return res.json();
  },

  async createProduct(data: {
    name: string;
    category: string;
    cost_price: number;
    selling_price: number;
    current_stock: number;
    reorder_threshold?: number;
  }): Promise<{ success: boolean; product: Product }> {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to create product' }));
      throw new Error(err.error || 'Failed to create product');
    }
    return res.json();
  },

  async updateProduct(id: string, data: Partial<Product>): Promise<{ success: boolean; product: Product }> {
    const res = await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to update product' }));
      throw new Error(err.error || 'Failed to update product');
    }
    return res.json();
  },

  async deleteProduct(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/products/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to delete product' }));
      throw new Error(err.error || 'Failed to delete product');
    }
    return res.json();
  },

  // 3. Sales
  async getSales(limit: number = 50, offset: number = 0, productId?: string): Promise<{ sales: Sale[]; total: number }> {
    let url = `/api/sales?limit=${limit}&offset=${offset}`;
    if (productId) url += `&productId=${productId}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch sales');
    return res.json();
  },

  async recordSale(data: {
    product_id: string;
    quantity: number;
    sale_date?: string;
    notes?: string;
  }): Promise<{ success: boolean; sale: any; forecast: ProductForecast }> {
    const res = await fetch('/api/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to record sale' }));
      throw new Error(err.error || 'Failed to record sale');
    }
    return res.json();
  },

  // 4. Analytics
  async getAnalytics(period: 'all' | 'today' | '7d' | '30d' | '90d' | '1y' = 'all'): Promise<AnalyticsData> {
    const res = await fetch(`/api/analytics?period=${period}`);
    if (!res.ok) throw new Error('Failed to fetch analytics');
    return res.json();
  },

  // 5. Forecast
  async getForecasts(): Promise<ProductForecast[]> {
    const res = await fetch('/api/forecast');
    if (!res.ok) throw new Error('Failed to fetch forecasts');
    return res.json();
  },

  // 6. Trends
  async getTrends(domain?: string): Promise<{ businessDomain: string; region: string; signals: MarketTrendSignal[] }> {
    const url = domain ? `/api/trends?domain=${encodeURIComponent(domain)}` : '/api/trends';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch market trends');
    return res.json();
  },

  // 7. Codey
  async askCodey(message: string, history?: any[]): Promise<{
    reply: string;
    contextSummary: any;
  }> {
    const res = await fetch('/api/codey/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Codey service unavailable' }));
      throw new Error(err.error || 'Codey service unavailable');
    }
    return res.json();
  },

  // 8. Seed / Reset
  async seedDemo(domain: string = 'Kirana / Grocery', clearExisting: boolean = true) {
    const res = await fetch('/api/seed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain, clearExisting }),
    });
    if (!res.ok) throw new Error('Failed to seed demo data');
    return res.json();
  },

  async resetData() {
    const res = await fetch('/api/reset', { method: 'POST' });
    if (!res.ok) throw new Error('Failed to reset data');
    return res.json();
  },
};
