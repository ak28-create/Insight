import React, { useState } from 'react';
import {
  TrendingUp,
  Package,
  AlertTriangle,
  Flame,
  ArrowUpRight,
  Sparkles,
  Compass,
  ShoppingCart,
  Plus,
  RefreshCw,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { AnalyticsData, ProductForecast, MarketTrendSignal, SellerProfile } from '../types';
import { formatINR, formatDateIST } from '../utils/formatters';
import { RevenueTrendChart } from '../components/Charts';

interface DashboardPageProps {
  analytics: AnalyticsData | null;
  forecasts: ProductForecast[];
  trends: MarketTrendSignal[];
  profile: SellerProfile | null;
  onOpenQuickSale: () => void;
  onOpenAddProduct: () => void;
  onNavigateTab: (tab: string) => void;
  onRefresh: () => void;
  isLoading: boolean;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  analytics,
  forecasts,
  trends,
  profile,
  onOpenQuickSale,
  onOpenAddProduct,
  onNavigateTab,
  onRefresh,
  isLoading,
}) => {
  const [trendView, setTrendView] = useState<'daily' | 'monthly'>('daily');

  // Filter urgent stockout alerts (< 7 days)
  const urgentAlerts = forecasts
    .filter(f => f.riskLevel === 'CRITICAL' || f.riskLevel === 'WARNING' || f.currentStock <= f.reorderThreshold)
    .sort((a, b) => (a.estimatedDaysUntilStockout ?? 99) - (b.estimatedDaysUntilStockout ?? 99));

  // Prepare chart data
  const chartData = trendView === 'daily'
    ? (analytics?.salesTrendDaily.slice(-14).map(d => ({
        label: d.date,
        displayLabel: d.formattedDate.substring(0, 5), // DD/MM
        revenue: d.revenue,
        profit: d.profit,
        unitsSold: d.unitsSold,
      })) || [])
    : (analytics?.salesTrendMonthly.map(m => ({
        label: m.month,
        displayLabel: m.formattedMonth,
        revenue: m.revenue,
        profit: m.profit,
        unitsSold: m.unitsSold,
      })) || []);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner with Store Greeting and Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent p-5 rounded-2xl border border-amber-200/60">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Namaste, {profile?.name || 'Retail Partner'}!
            </h2>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
              {profile?.business_domain || 'Kirana / Grocery'}
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Real-time business performance overview for your store in {profile?.city || 'Lucknow'}, {profile?.state || 'Uttar Pradesh'}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 shadow-2xs transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-600' : 'text-slate-500'}`} />
            <span>Sync Live Data</span>
          </button>
          <button
            onClick={onOpenQuickSale}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>New Sale</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        {/* Total Revenue */}
        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Total Sales (INR)</span>
            <TrendingUp className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-extrabold text-slate-900 tracking-tight">
            {formatINR(analytics?.totalSales)}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 flex items-center gap-1">
            <span className="text-emerald-700 font-semibold">{analytics?.totalUnitsSold.toLocaleString('en-IN')} units</span>
            <span>recorded</span>
          </div>
        </div>

        {/* Total Net Profit */}
        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Net Profit</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800">
              {analytics?.profitMarginPercent}% margin
            </span>
          </div>
          <div className="text-xl font-extrabold text-emerald-700 tracking-tight">
            +{formatINR(analytics?.totalProfit)}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Realized gross profit
          </div>
        </div>

        {/* Catalog Products */}
        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Total Catalog</span>
            <Package className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl font-extrabold text-slate-900 tracking-tight">
            {analytics?.totalProductsCount || 0}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Active SKUs</span>
            <button
              onClick={onOpenAddProduct}
              className="text-amber-700 hover:text-amber-800 font-semibold text-[11px] flex items-center gap-0.5"
            >
              <Plus className="w-3 h-3" /> Add SKU
            </button>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Low Stock</span>
            <AlertTriangle className={`w-4 h-4 ${analytics?.lowStockCount ? 'text-amber-600' : 'text-slate-300'}`} />
          </div>
          <div className={`text-xl font-extrabold tracking-tight ${analytics?.lowStockCount ? 'text-amber-700' : 'text-slate-900'}`}>
            {analytics?.lowStockCount || 0}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Below reorder threshold
          </div>
        </div>

        {/* Imminent Stockouts */}
        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-2xs col-span-2 md:col-span-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Stockout Risk</span>
            <Clock className="w-4 h-4 text-red-500" />
          </div>
          <div className={`text-xl font-extrabold tracking-tight ${urgentAlerts.length > 0 ? 'text-red-600' : 'text-slate-900'}`}>
            {urgentAlerts.length}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Stockout in &le; 7 days
          </div>
        </div>
      </div>

      {/* Main Grid: Chart & Urgency Column */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Interactive Revenue & Profit Trend Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">Financial Performance (INR)</h3>
              <p className="text-xs text-slate-500">Database-driven revenue vs realized profit</p>
            </div>
            <div className="flex items-center p-1 bg-slate-100 rounded-lg text-xs font-medium">
              <button
                onClick={() => setTrendView('daily')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  trendView === 'daily'
                    ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Last 14 Days
              </button>
              <button
                onClick={() => setTrendView('monthly')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  trendView === 'monthly'
                    ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Monthly Trend
              </button>
            </div>
          </div>

          <RevenueTrendChart
            data={chartData}
            title={trendView === 'daily' ? 'Daily Sales vs Net Profit' : 'Monthly Aggregated Sales vs Profit'}
            height={240}
          />
        </div>

        {/* Right Column: Codey Assistant Assistant Prompt Card */}
        <div className="bg-gradient-to-br from-amber-500/10 via-white to-amber-50/50 rounded-2xl border border-amber-200/80 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Codey AI Business Assistant</h4>
                <p className="text-[11px] text-amber-800 font-medium">Grounded in your store records</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Codey reads your inventory, sales velocity, and profit margins to recommend restocking and answer retail questions without hallucination.
            </p>

            <div className="space-y-1.5">
              {[
                'What should I restock this week?',
                'Which products generate the most profit?',
                'Are my edible oil sales on track?',
              ].map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => onNavigateTab('codey')}
                  className="w-full text-left p-2.5 bg-white hover:bg-amber-50 border border-slate-200 hover:border-amber-300 rounded-xl text-xs font-medium text-slate-700 transition-colors flex items-center justify-between group"
                >
                  <span className="truncate">{prompt}</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600 shrink-0" />
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-amber-200/60 flex items-center justify-between text-xs">
            <span className="text-slate-500 text-[11px]">Strict Anti-Hallucination active</span>
            <button
              onClick={() => onNavigateTab('codey')}
              className="text-amber-800 font-bold hover:underline flex items-center gap-1"
            >
              Open Codey &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* Hero Products & Stockout Alerts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* HERO PRODUCTS CARD */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-700 flex items-center justify-center">
                <Flame className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 tracking-tight">Hero Products</h3>
                <p className="text-[11px] text-slate-500">Ranked by revenue & profit contribution</p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('analytics')}
              className="text-xs text-amber-700 hover:text-amber-800 font-semibold"
            >
              Full Analytics &rarr;
            </button>
          </div>

          {analytics?.heroProducts && analytics.heroProducts.length > 0 ? (
            <div className="space-y-2.5">
              {analytics.heroProducts.slice(0, 4).map((hero) => (
                <div
                  key={hero.productId}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 border border-slate-200/60 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-700 shrink-0">
                      #{hero.rank}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{hero.name}</p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {hero.category} · {hero.unitsSold} units sold
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold text-slate-900">{formatINR(hero.revenue)}</p>
                    <p className="text-[11px] font-semibold text-emerald-700">+{formatINR(hero.profit)} profit</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">
              Hero products will be automatically calculated when sales are recorded.
            </div>
          )}
        </div>

        {/* RESTOCK & STOCKOUT URGENCY ALERTS */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-red-500/10 text-red-700 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 tracking-tight">Restock & Stockout Countdown</h3>
                <p className="text-[11px] text-slate-500">Forecasting engine predictions based on sales velocity</p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('forecast')}
              className="text-xs text-amber-700 hover:text-amber-800 font-semibold"
            >
              All Forecasts &rarr;
            </button>
          </div>

          {urgentAlerts.length > 0 ? (
            <div className="space-y-2.5">
              {urgentAlerts.slice(0, 4).map((f) => (
                <div
                  key={f.productId}
                  className={`flex items-center justify-between p-3 rounded-xl border ${
                    f.riskLevel === 'CRITICAL'
                      ? 'bg-red-50/50 border-red-200/80'
                      : 'bg-amber-50/50 border-amber-200/80'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-slate-900 truncate">{f.productName}</p>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        f.riskLevel === 'CRITICAL' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {f.estimatedDaysUntilStockout !== null
                          ? `${f.estimatedDaysUntilStockout}d left`
                          : 'Stockout Soon'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Stock: <span className="font-semibold text-slate-800">{f.currentStock} units</span> · Velocity: {f.salesVelocity} units/day
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Suggested Order</span>
                    <span className="text-xs font-extrabold text-amber-800">
                      +{f.recommendedReorderQuantity || 20} units
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-emerald-700 flex flex-col items-center justify-center gap-1">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>All catalog products are currently healthy and well-stocked!</span>
            </div>
          )}
        </div>
      </div>

      {/* External Market Trends Strip (India geo="IN") */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-700 flex items-center justify-center">
              <Compass className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-slate-900 tracking-tight">
                  External India Market Trends (geo = &quot;IN&quot;)
                </h3>
                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-blue-50 text-blue-800 rounded border border-blue-200">
                  Google Trends India
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Supplementary market interest for &quot;{profile?.business_domain || 'Kirana / Grocery'}&quot; across India.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('trends')}
            className="text-xs text-blue-700 hover:text-blue-800 font-semibold"
          >
            Explore Trends &rarr;
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {trends.slice(0, 3).map((trend) => (
            <div
              key={trend.id}
              className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/70 hover:bg-slate-50 transition-colors space-y-2"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900 truncate">{trend.category}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                  {trend.trendDirection}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-snug line-clamp-2">
                {trend.insightSummary}
              </p>
              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200/50">
                <span>Keyword: &quot;{trend.keyword}&quot;</span>
                <span className="font-semibold text-emerald-700">+{trend.growthPercentage}% in India</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
