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
import { formatINR } from '../utils/formatters';
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
      {/* Stripe-style Ambient Top Banner */}
      <div className="relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white border border-[#e3e8ee] shadow-sm">
        {/* Subtle Stripe gradient mesh glow on banner corner */}
        <div className="absolute top-0 right-0 w-96 h-full bg-gradient-to-l from-[#635bff]/10 via-[#00d4ff]/5 to-transparent pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold text-[#0a2540] tracking-tight">
              Namaste, {profile?.name || 'Retail Partner'}!
            </h2>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#635bff]/10 text-[#635bff] border border-[#635bff]/20">
              {profile?.business_domain || 'Kirana'}
            </span>
          </div>
          <p className="text-xs text-[#425466] mt-1">
            Real-time retail health & automated demand forecasting for your store in {profile?.city || 'Lucknow'}, {profile?.state || 'Uttar Pradesh'}.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-2.5">
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-[#0a2540] text-xs font-semibold rounded-lg border border-[#e3e8ee] shadow-2xs transition-all hover:border-slate-300"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#635bff]' : 'text-[#425466]'}`} />
            <span>Sync Ledger</span>
          </button>
          <button
            onClick={onOpenQuickSale}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#635bff] hover:bg-[#5346e0] active:bg-[#4b3ecb] text-white text-xs font-semibold rounded-lg shadow-[0_2px_6px_rgba(99,91,255,0.3)] transition-all hover:-translate-y-0.5"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>New Sale</span>
          </button>
        </div>
      </div>

      {/* KPI Cards in Stripe Modern Dashboard Style */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        {/* Total Revenue */}
        <div className="p-4 bg-white rounded-xl border border-[#e3e8ee] shadow-2xs hover:shadow-md hover:border-slate-300 transition-all duration-200">
          <div className="flex items-center justify-between text-[#425466] text-xs font-medium mb-1">
            <span>Gross Revenue</span>
            <TrendingUp className="w-4 h-4 text-[#635bff]" />
          </div>
          <div className="text-xl font-bold text-[#0a2540] tracking-tight">
            {formatINR(analytics?.totalSales)}
          </div>
          <div className="mt-1 text-[11px] text-[#425466] flex items-center gap-1">
            <span className="text-[#059669] font-semibold">{analytics?.totalUnitsSold.toLocaleString('en-IN')} units</span>
            <span>sold</span>
          </div>
        </div>

        {/* Net Profit */}
        <div className="p-4 bg-white rounded-xl border border-[#e3e8ee] shadow-2xs hover:shadow-md hover:border-slate-300 transition-all duration-200">
          <div className="flex items-center justify-between text-[#425466] text-xs font-medium mb-1">
            <span>Net Profit</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              {analytics?.profitMarginPercent}% margin
            </span>
          </div>
          <div className="text-xl font-bold text-[#059669] tracking-tight">
            +{formatINR(analytics?.totalProfit)}
          </div>
          <div className="mt-1 text-[11px] text-[#425466]">
            Realized cash margin
          </div>
        </div>

        {/* Catalog Products */}
        <div className="p-4 bg-white rounded-xl border border-[#e3e8ee] shadow-2xs hover:shadow-md hover:border-slate-300 transition-all duration-200">
          <div className="flex items-center justify-between text-[#425466] text-xs font-medium mb-1">
            <span>Catalog Items</span>
            <Package className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl font-bold text-[#0a2540] tracking-tight">
            {analytics?.totalProductsCount || 0}
          </div>
          <div className="mt-1 text-[11px] text-[#425466] flex items-center justify-between">
            <span>Active SKUs</span>
            <button
              onClick={onOpenAddProduct}
              className="text-[#635bff] hover:text-[#5346e0] font-semibold text-[11px] flex items-center gap-0.5"
            >
              <Plus className="w-3 h-3" /> Add SKU
            </button>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="p-4 bg-white rounded-xl border border-[#e3e8ee] shadow-2xs hover:shadow-md hover:border-slate-300 transition-all duration-200">
          <div className="flex items-center justify-between text-[#425466] text-xs font-medium mb-1">
            <span>Low Stock</span>
            <AlertTriangle className={`w-4 h-4 ${analytics?.lowStockCount ? 'text-amber-500' : 'text-slate-300'}`} />
          </div>
          <div className={`text-xl font-bold tracking-tight ${analytics?.lowStockCount ? 'text-amber-600' : 'text-[#0a2540]'}`}>
            {analytics?.lowStockCount || 0}
          </div>
          <div className="mt-1 text-[11px] text-[#425466]">
            Below reorder level
          </div>
        </div>

        {/* Stockout Risk */}
        <div className="p-4 bg-white rounded-xl border border-[#e3e8ee] shadow-2xs hover:shadow-md hover:border-slate-300 transition-all duration-200 col-span-2 md:col-span-1">
          <div className="flex items-center justify-between text-[#425466] text-xs font-medium mb-1">
            <span>Imminent Risk</span>
            <Clock className="w-4 h-4 text-rose-500" />
          </div>
          <div className={`text-xl font-bold tracking-tight ${urgentAlerts.length > 0 ? 'text-rose-600' : 'text-[#0a2540]'}`}>
            {urgentAlerts.length}
          </div>
          <div className="mt-1 text-[11px] text-[#425466]">
            Stockout in &le; 7 days
          </div>
        </div>
      </div>

      {/* Main Grid: Revenue Trend Chart & Codey Prompt Box */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Stripe Financial Performance Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#e3e8ee] p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-bold text-[#0a2540] tracking-tight">Financial Performance (INR)</h3>
              <p className="text-xs text-[#425466]">Database-driven revenue vs realized net profit</p>
            </div>
            {/* Stripe Segmented Pill Control */}
            <div className="flex items-center p-1 bg-[#f6f9fc] rounded-lg text-xs font-medium border border-[#e3e8ee]/80">
              <button
                onClick={() => setTrendView('daily')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  trendView === 'daily'
                    ? 'bg-white text-[#0a2540] font-semibold shadow-2xs border border-[#e3e8ee]'
                    : 'text-[#425466] hover:text-[#0a2540]'
                }`}
              >
                Last 14 Days
              </button>
              <button
                onClick={() => setTrendView('monthly')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  trendView === 'monthly'
                    ? 'bg-white text-[#0a2540] font-semibold shadow-2xs border border-[#e3e8ee]'
                    : 'text-[#425466] hover:text-[#0a2540]'
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

        {/* Right Column: Codey Assistant Interactive Card in Stripe Gradient Style */}
        <div className="bg-gradient-to-br from-[#635bff]/8 via-white to-[#00d4ff]/5 rounded-2xl border border-[#635bff]/20 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#635bff] to-[#00d4ff] text-white flex items-center justify-center shadow-[0_2px_6px_rgba(99,91,255,0.3)]">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#0a2540]">Codey AI Business Assistant</h4>
                <p className="text-[11px] text-[#635bff] font-semibold">Grounded in verified store records</p>
              </div>
            </div>

            <p className="text-xs text-[#425466] leading-relaxed mb-4">
              Codey reads your live store inventory, sales velocity, and profit margins to answer shopkeeper questions without hallucination.
            </p>

            <div className="space-y-1.5">
              {[
                'What should I restock this week?',
                'Which products generate the most profit?',
                'What are my Top Hero Products?',
              ].map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => onNavigateTab('codey')}
                  className="w-full text-left p-2.5 bg-white hover:bg-[#635bff]/5 border border-[#e3e8ee] hover:border-[#635bff]/40 rounded-xl text-xs font-medium text-[#0a2540] transition-colors flex items-center justify-between group shadow-2xs"
                >
                  <span className="truncate">{prompt}</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#635bff] shrink-0 transition-colors" />
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#e3e8ee] flex items-center justify-between text-xs">
            <span className="text-[#425466] text-[11px]">Strict Anti-Hallucination active</span>
            <button
              onClick={() => onNavigateTab('codey')}
              className="text-[#635bff] font-bold hover:underline flex items-center gap-1"
            >
              Open Assistant &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* Hero Products & Stockout Alerts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* HERO PRODUCTS LEADERBOARD */}
        <div className="bg-white rounded-2xl border border-[#e3e8ee] p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-[#e3e8ee] pb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-[#0a2540] tracking-tight">Hero Products</h3>
                <p className="text-[11px] text-[#425466]">Ranked by revenue & profit contribution</p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('analytics')}
              className="text-xs text-[#635bff] hover:text-[#5346e0] font-semibold"
            >
              Full Analytics &rarr;
            </button>
          </div>

          {analytics?.heroProducts && analytics.heroProducts.length > 0 ? (
            <div className="space-y-2.5">
              {analytics.heroProducts.slice(0, 4).map((hero) => (
                <div
                  key={hero.productId}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#f6f9fc] border border-[#e3e8ee] hover:bg-slate-100/60 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 h-6 rounded-full bg-white border border-[#e3e8ee] flex items-center justify-center text-xs font-bold text-[#0a2540] shrink-0 shadow-2xs">
                      #{hero.rank}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#0a2540] truncate">{hero.name}</p>
                      <p className="text-[11px] text-[#425466] truncate">
                        {hero.category} · {hero.unitsSold} units sold
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold text-[#0a2540]">{formatINR(hero.revenue)}</p>
                    <p className="text-[11px] font-semibold text-[#059669]">+{formatINR(hero.profit)} margin</p>
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

        {/* RESTOCK & STOCKOUT COUNTDOWN */}
        <div className="bg-white rounded-2xl border border-[#e3e8ee] p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-[#e3e8ee] pb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-[#0a2540] tracking-tight">Restock Countdown</h3>
                <p className="text-[11px] text-[#425466]">Statistical velocity predictions based on store sales</p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('forecast')}
              className="text-xs text-[#635bff] hover:text-[#5346e0] font-semibold"
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
                      ? 'bg-rose-50/50 border-rose-200/80'
                      : 'bg-amber-50/50 border-amber-200/80'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-[#0a2540] truncate">{f.productName}</p>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        f.riskLevel === 'CRITICAL' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {f.estimatedDaysUntilStockout !== null
                          ? `${f.estimatedDaysUntilStockout}d left`
                          : 'Stockout Soon'}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#425466] mt-0.5">
                      Stock: <span className="font-semibold text-[#0a2540]">{f.currentStock} units</span> · Velocity: {f.salesVelocity} units/day
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Suggested Order</span>
                    <span className="text-xs font-extrabold text-[#635bff]">
                      +{f.recommendedReorderQuantity || 20} units
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-[#059669] flex flex-col items-center justify-center gap-1">
              <CheckCircle2 className="w-5 h-5" />
              <span>All catalog products are currently healthy and well-stocked!</span>
            </div>
          )}
        </div>
      </div>

      {/* External Market Trends Strip (India geo="IN") */}
      <div className="bg-white rounded-2xl border border-[#e3e8ee] p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-[#e3e8ee] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#635bff]/10 text-[#635bff] flex items-center justify-center">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-[#0a2540] tracking-tight">
                  External India Market Trends (geo = &quot;IN&quot;)
                </h3>
                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-[#635bff]/10 text-[#635bff] rounded border border-[#635bff]/20">
                  Google Trends India
                </span>
              </div>
              <p className="text-[11px] text-[#425466]">
                Supplementary consumer search demand for &quot;{profile?.business_domain || 'Kirana / Grocery'}&quot; across India.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('trends')}
            className="text-xs text-[#635bff] hover:text-[#5346e0] font-semibold"
          >
            Explore Trends &rarr;
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {trends.slice(0, 3).map((trend) => (
            <div
              key={trend.id}
              className="p-3 rounded-xl bg-[#f6f9fc] border border-[#e3e8ee] hover:bg-slate-100/60 transition-colors space-y-2"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#0a2540] truncate">{trend.category}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#635bff]/10 text-[#635bff]">
                  {trend.trendDirection}
                </span>
              </div>
              <p className="text-[11px] text-[#425466] leading-snug line-clamp-2">
                {trend.insightSummary}
              </p>
              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-[#e3e8ee]">
                <span>Keyword: &quot;{trend.keyword}&quot;</span>
                <span className="font-semibold text-[#059669]">+{trend.growthPercentage}% in India</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
