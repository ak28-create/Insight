import React, { useState } from 'react';
import {
  TrendingUp,
  Flame,
  Award,
  BarChart3,
  Calendar,
  Layers,
  ArrowUpRight,
  PieChart,
} from 'lucide-react';
import { AnalyticsData } from '../types';
import { formatINR } from '../utils/formatters';
import { RevenueTrendChart, CategoryBarChart } from '../components/Charts';

interface AnalyticsPageProps {
  analytics: AnalyticsData | null;
  selectedPeriod: 'all' | 'today' | '7d' | '30d' | '90d' | '1y';
  onSelectPeriod: (p: 'all' | 'today' | '7d' | '30d' | '90d' | '1y') => void;
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({
  analytics,
  selectedPeriod,
  onSelectPeriod,
}) => {
  const [chartMode, setChartMode] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  const periodOptions: { id: 'all' | 'today' | '7d' | '30d' | '90d' | '1y'; label: string }[] = [
    { id: 'all', label: 'All Time' },
    { id: '1y', label: '1 Year' },
    { id: '90d', label: '90 Days' },
    { id: '30d', label: '30 Days' },
    { id: '7d', label: '7 Days' },
    { id: 'today', label: 'Today' },
  ];

  // Prepare chart data based on active chartMode
  let chartData: { label: string; displayLabel: string; revenue: number; profit: number; unitsSold: number }[] = [];
  if (chartMode === 'daily' && analytics?.salesTrendDaily) {
    chartData = analytics.salesTrendDaily.slice(-30).map(d => ({
      label: d.date,
      displayLabel: d.formattedDate.substring(0, 5),
      revenue: d.revenue,
      profit: d.profit,
      unitsSold: d.unitsSold,
    }));
  } else if (chartMode === 'weekly' && analytics?.salesTrendWeekly) {
    chartData = analytics.salesTrendWeekly.map(w => ({
      label: w.week,
      displayLabel: w.startDate.substring(5), // MM-DD
      revenue: w.revenue,
      profit: w.profit,
      unitsSold: w.unitsSold,
    }));
  } else if (chartMode === 'monthly' && analytics?.salesTrendMonthly) {
    chartData = analytics.salesTrendMonthly.map(m => ({
      label: m.month,
      displayLabel: m.formattedMonth,
      revenue: m.revenue,
      profit: m.profit,
      unitsSold: m.unitsSold,
    }));
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-600" />
            <span>Sales & Profit Analytics</span>
          </h2>
          <p className="text-xs text-slate-500">
            Real database aggregations, margin distributions, and algorithmic hero product detection.
          </p>
        </div>

        {/* Date Filter Segmented Bar */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs font-medium self-start sm:self-auto">
          {periodOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => onSelectPeriod(opt.id)}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                selectedPeriod === opt.id
                  ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Sales (INR)</p>
          <p className="text-xl font-extrabold text-slate-900 mt-1">{formatINR(analytics?.totalSales)}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">{analytics?.totalUnitsSold.toLocaleString('en-IN')} units sold</p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gross Profit</p>
          <p className="text-xl font-extrabold text-emerald-700 mt-1">+{formatINR(analytics?.totalProfit)}</p>
          <p className="text-[11px] text-emerald-700 font-medium mt-0.5">{analytics?.profitMarginPercent}% overall margin</p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Identified Hero SKUs</p>
          <p className="text-xl font-extrabold text-amber-700 mt-1">{analytics?.heroProducts.length || 0}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Driving 60%+ of earnings</p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Categories</p>
          <p className="text-xl font-extrabold text-slate-900 mt-1">{analytics?.categoryBreakdown.length || 0}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Contributing retail segments</p>
        </div>
      </div>

      {/* Interactive Sales & Profit Trend Chart */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Revenue & Profit Progression</h3>
            <p className="text-xs text-slate-500">Historical database transactions across time windows</p>
          </div>
          <div className="flex items-center p-1 bg-slate-100 rounded-lg text-xs font-medium">
            <button
              onClick={() => setChartMode('daily')}
              className={`px-3 py-1 rounded-md transition-colors ${
                chartMode === 'daily' ? 'bg-white text-slate-900 font-semibold shadow-2xs' : 'text-slate-600'
              }`}
            >
              Daily
            </button>
            <button
              onClick={() => setChartMode('weekly')}
              className={`px-3 py-1 rounded-md transition-colors ${
                chartMode === 'weekly' ? 'bg-white text-slate-900 font-semibold shadow-2xs' : 'text-slate-600'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setChartMode('monthly')}
              className={`px-3 py-1 rounded-md transition-colors ${
                chartMode === 'monthly' ? 'bg-white text-slate-900 font-semibold shadow-2xs' : 'text-slate-600'
              }`}
            >
              Monthly
            </button>
          </div>
        </div>

        <RevenueTrendChart
          data={chartData}
          title={`Store ${chartMode.charAt(0).toUpperCase() + chartMode.slice(1)} Performance (INR)`}
          height={260}
        />
      </div>

      {/* HERO PRODUCT DETECTION DEEP DIVE */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-700 flex items-center justify-center">
              <Flame className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">Hero Product Detection</h3>
              <p className="text-xs text-slate-500">
                Formula: Composite Ranking = 55% Revenue Contribution + 45% Profit Contribution + Units Sold
              </p>
            </div>
          </div>
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 self-start sm:self-auto">
            Algorithm-Powered · Zero Hallucination
          </span>
        </div>

        {analytics?.heroProducts && analytics.heroProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-5 py-3">Rank</th>
                  <th className="px-4 py-3">Product Name</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3 text-center">Units Sold</th>
                  <th className="px-4 py-3 text-right">Revenue (₹)</th>
                  <th className="px-4 py-3 text-right">Revenue Share</th>
                  <th className="px-4 py-3 text-right font-bold text-emerald-800">Net Profit (₹)</th>
                  <th className="px-4 py-3 text-right">Profit Share</th>
                  <th className="px-5 py-3 text-right">Hero Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {analytics.heroProducts.map((hero) => (
                  <tr key={hero.productId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3 font-bold">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-extrabold ${
                        hero.rank === 1
                          ? 'bg-amber-100 text-amber-900 ring-2 ring-amber-400'
                          : hero.rank === 2
                          ? 'bg-slate-200 text-slate-800'
                          : hero.rank === 3
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        #{hero.rank}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900">{hero.name}</td>
                    <td className="px-4 py-3 text-slate-600">{hero.category}</td>
                    <td className="px-4 py-3 text-center font-extrabold text-slate-800">
                      {hero.unitsSold}
                    </td>
                    <td className="px-4 py-3 text-right font-extrabold text-slate-900">
                      {formatINR(hero.revenue)}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-700">
                      {hero.revenueContributionPercent}%
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-700">
                      +{formatINR(hero.profit)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-700">
                      {hero.profitContributionPercent}%
                    </td>
                    <td className="px-5 py-3 text-right font-mono font-bold text-amber-700">
                      {(hero.heroScore * 100).toFixed(0)} / 100
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-slate-400">
            {analytics?.messages.hero || 'Hero product insights will appear after sufficient sales data is available.'}
          </div>
        )}
      </div>

      {/* Category Performance Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <PieChart className="w-4 h-4 text-amber-600" />
              <span>Category Revenue Share</span>
            </h3>
            <span className="text-[11px] text-slate-500">Ranked by turnover</span>
          </div>

          <CategoryBarChart categories={analytics?.categoryBreakdown || []} />
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>Category Margin Performance</span>
            </h3>
            <span className="text-[11px] text-slate-500">Gross profit breakdown</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="px-3 py-2">Category</th>
                  <th className="px-3 py-2 text-right">Revenue</th>
                  <th className="px-3 py-2 text-right">Profit</th>
                  <th className="px-3 py-2 text-right">Margin %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(analytics?.categoryBreakdown || []).map((cat) => (
                  <tr key={cat.category} className="hover:bg-slate-50">
                    <td className="px-3 py-2.5 font-bold text-slate-900">{cat.category}</td>
                    <td className="px-3 py-2.5 text-right font-medium text-slate-800">{formatINR(cat.revenue)}</td>
                    <td className="px-3 py-2.5 text-right font-bold text-emerald-700">+{formatINR(cat.profit)}</td>
                    <td className="px-3 py-2.5 text-right font-semibold text-slate-700">{cat.profitMarginPercent}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
