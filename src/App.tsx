import React, { useState, useEffect, useCallback } from 'react';
import { api } from './services/api';
import {
  SellerProfile,
  Product,
  Sale,
  AnalyticsData,
  ProductForecast,
  MarketTrendSignal,
  CodeyMessage,
} from './types';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { QuickSaleModal } from './components/QuickSaleModal';
import { AddEditProductModal } from './components/AddEditProductModal';
import { DashboardPage } from './pages/DashboardPage';
import { InventoryPage } from './pages/InventoryPage';
import { SalesPage } from './pages/SalesPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { ForecastPage } from './pages/ForecastPage';
import { TrendsPage } from './pages/TrendsPage';
import { CodeyPage } from './pages/CodeyPage';
import { SettingsPage } from './pages/SettingsPage';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [forecasts, setForecasts] = useState<ProductForecast[]>([]);
  const [trends, setTrends] = useState<MarketTrendSignal[]>([]);
  const [analyticsPeriod, setAnalyticsPeriod] = useState<'all' | 'today' | '7d' | '30d' | '90d' | '1y'>('all');

  // Modals & Drawers
  const [isQuickSaleOpen, setIsQuickSaleOpen] = useState(false);
  const [isAddEditProductOpen, setIsAddEditProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Codey Assistant state
  const [codeyMessages, setCodeyMessages] = useState<CodeyMessage[]>([]);
  const [isCodeyLoading, setIsCodeyLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Data Loader
  const loadAllData = useCallback(async (period = analyticsPeriod) => {
    try {
      setIsLoading(true);
      const [profData, prodData, salesData, analyticsData, forecastData, trendsData] = await Promise.all([
        api.getProfile().catch(() => null),
        api.getProducts().catch(() => []),
        api.getSales(100, 0).catch(() => ({ sales: [], total: 0 })),
        api.getAnalytics(period).catch(() => null),
        api.getForecasts().catch(() => []),
        api.getTrends().catch(() => ({ businessDomain: '', region: 'IN', signals: [] })),
      ]);

      if (profData) setProfile(profData);
      setProducts(prodData);
      setSales(salesData.sales || []);
      setAnalytics(analyticsData);
      setForecasts(forecastData);
      setTrends(trendsData.signals || []);
    } catch (err) {
      console.error('Failed to load store data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [analyticsPeriod]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Handle analytics period change
  const handleSelectPeriod = async (period: 'all' | 'today' | '7d' | '30d' | '90d' | '1y') => {
    setAnalyticsPeriod(period);
    try {
      const updatedAnalytics = await api.getAnalytics(period);
      setAnalytics(updatedAnalytics);
    } catch (err) {
      console.error('Failed to update analytics period:', err);
    }
  };

  // Handle Sale Completed
  const handleSaleCompleted = async (saleResult: any) => {
    // Refresh products, sales, analytics, and forecasts immediately
    await loadAllData();
  };

  // Handle Product Saved (created or updated)
  const handleProductSaved = async (saved: Product) => {
    await loadAllData();
  };

  // Handle Product Delete
  const handleDeleteProduct = async (id: string) => {
    try {
      await api.deleteProduct(id);
      await loadAllData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete product');
    }
  };

  // Handle Stock Update directly from row
  const handleUpdateStock = async (product: Product, newStock: number) => {
    try {
      await api.updateProduct(product.id, { current_stock: Math.max(0, newStock) });
      await loadAllData();
    } catch (err: any) {
      alert(err.message || 'Failed to update stock');
    }
  };

  // Handle Codey Message
  const handleSendMessage = async (text: string) => {
    const userMsg: CodeyMessage = {
      id: `msg_${Date.now()}_u`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    setCodeyMessages(prev => [...prev, userMsg]);
    setIsCodeyLoading(true);

    try {
      const history = codeyMessages.map(m => ({ role: m.role, content: m.content }));
      const response = await api.askCodey(text, history);

      const assistantMsg: CodeyMessage = {
        id: `msg_${Date.now()}_a`,
        role: 'assistant',
        content: response.reply,
        timestamp: new Date().toISOString(),
        contextSummary: response.contextSummary,
      };

      setCodeyMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: CodeyMessage = {
        id: `msg_${Date.now()}_err`,
        role: 'assistant',
        content: `Error: ${err.message || 'Could not reach assistant service. Please check connection.'}`,
        timestamp: new Date().toISOString(),
      };
      setCodeyMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsCodeyLoading(false);
    }
  };

  // Connect Trend with Codey
  const handleAskCodeyTrend = async (trend: MarketTrendSignal) => {
    setCurrentTab('codey');
    const query = `External Google Trends shows "${trend.keyword}" is ${trend.trendDirection} (+${trend.growthPercentage}% in India). How should my store (${profile?.business_domain || 'Kirana'}) adjust inventory or capitalize on this?`;
    await handleSendMessage(query);
  };

  // Handle Profile Update
  const handleUpdateProfile = async (updated: Partial<SellerProfile>) => {
    await api.updateProfile(updated);
    await loadAllData();
  };

  // Handle Demo Seed
  const handleSeedDemo = async (domain: string) => {
    await api.seedDemo(domain, true);
    setCodeyMessages([]);
    await loadAllData();
  };

  // Handle Reset Data
  const handleResetData = async () => {
    await api.resetData();
    setCodeyMessages([]);
    await loadAllData();
  };

  // Calculate low stock count
  const lowStockCount = products.filter(p => p.current_stock <= p.reorder_threshold).length;

  // Header Titles
  const tabTitles: Record<string, { title: string; subtitle: string }> = {
    dashboard: { title: 'Store Overview & Health', subtitle: 'Realtime inventory, sales, and predictive stockout alerts' },
    inventory: { title: 'Product Catalog & Stock', subtitle: 'Manage prices, wholesale costs, reorder levels, and units' },
    sales: { title: 'Sales Register & POS', subtitle: 'Instant counter billing, historical rates, and profit tracking' },
    analytics: { title: 'Profit & Hero Product Analytics', subtitle: 'Verified store sales metrics and algorithmic hero SKUs' },
    forecast: { title: 'Demand Forecasting', subtitle: 'Statistical sales velocity models and replenishment dates' },
    trends: { title: 'India Market Demand Trends', subtitle: 'Supplementary Google Trends signals (geo = "IN")' },
    codey: { title: 'Codey AI Assistant', subtitle: 'Strictly data-grounded answers for Indian retail shopkeepers' },
    settings: { title: 'Business Profile & Domain', subtitle: 'Store parameters, location, and retail sandbox switching' },
  };

  const currentTabInfo = tabTitles[currentTab] || { title: 'InSight Retail', subtitle: 'Smart Inventory & POS' };

  return (
    <div className="flex h-screen bg-slate-100/60 text-slate-900 font-sans antialiased overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        profile={profile}
        lowStockCount={lowStockCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Header
          title={currentTabInfo.title}
          subtitle={currentTabInfo.subtitle}
          profile={profile}
          lowStockCount={lowStockCount}
          onOpenQuickSale={() => setIsQuickSaleOpen(true)}
          onOpenCodey={() => setCurrentTab('codey')}
          onNavigateTab={setCurrentTab}
        />

        <main className="flex-1 overflow-y-auto">
          {currentTab === 'dashboard' && (
            <DashboardPage
              analytics={analytics}
              forecasts={forecasts}
              trends={trends}
              profile={profile}
              onOpenQuickSale={() => setIsQuickSaleOpen(true)}
              onOpenAddProduct={() => {
                setEditingProduct(null);
                setIsAddEditProductOpen(true);
              }}
              onNavigateTab={setCurrentTab}
              onRefresh={() => loadAllData()}
              isLoading={isLoading}
            />
          )}

          {currentTab === 'inventory' && (
            <InventoryPage
              products={products}
              forecasts={forecasts}
              onOpenAddProduct={() => {
                setEditingProduct(null);
                setIsAddEditProductOpen(true);
              }}
              onEditProduct={(p) => {
                setEditingProduct(p);
                setIsAddEditProductOpen(true);
              }}
              onDeleteProduct={handleDeleteProduct}
              onQuickSaleProduct={(p) => setIsQuickSaleOpen(true)}
              onUpdateStock={handleUpdateStock}
            />
          )}

          {currentTab === 'sales' && (
            <SalesPage
              sales={sales}
              products={products}
              onOpenQuickSale={() => setIsQuickSaleOpen(true)}
              onRefreshSales={() => loadAllData()}
            />
          )}

          {currentTab === 'analytics' && (
            <AnalyticsPage
              analytics={analytics}
              selectedPeriod={analyticsPeriod}
              onSelectPeriod={handleSelectPeriod}
            />
          )}

          {currentTab === 'forecast' && (
            <ForecastPage
              forecasts={forecasts}
              onQuickSaleProduct={() => setIsQuickSaleOpen(true)}
              onNavigateTab={setCurrentTab}
            />
          )}

          {currentTab === 'trends' && (
            <TrendsPage
              trends={trends}
              profile={profile}
              onAskCodeyTrend={handleAskCodeyTrend}
              onNavigateTab={setCurrentTab}
            />
          )}

          {currentTab === 'codey' && (
            <CodeyPage
              messages={codeyMessages}
              onSendMessage={handleSendMessage}
              onClearChat={() => setCodeyMessages([])}
              isLoading={isCodeyLoading}
              profile={profile}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsPage
              profile={profile}
              onUpdateProfile={handleUpdateProfile}
              onSeedDemo={handleSeedDemo}
              onResetData={handleResetData}
            />
          )}
        </main>
      </div>

      {/* Quick Sale / Counter POS Modal */}
      <QuickSaleModal
        isOpen={isQuickSaleOpen}
        onClose={() => setIsQuickSaleOpen(false)}
        products={products}
        onSaleCompleted={handleSaleCompleted}
      />

      {/* Add / Edit Product Modal */}
      <AddEditProductModal
        isOpen={isAddEditProductOpen}
        onClose={() => {
          setIsAddEditProductOpen(false);
          setEditingProduct(null);
        }}
        productToEdit={editingProduct}
        businessDomain={profile?.business_domain || 'Kirana / Grocery'}
        onSaved={handleProductSaved}
      />
    </div>
  );
}
