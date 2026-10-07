import React, { useState } from 'react';
import {
  Brain,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar,
  Sparkles,
  Info,
  Package,
  TrendingUp,
  ShoppingCart,
  Filter,
} from 'lucide-react';
import { ProductForecast } from '../types';
import { formatINR, formatDateIST } from '../utils/formatters';

interface ForecastPageProps {
  forecasts: ProductForecast[];
  onQuickSaleProduct: (productId: string) => void;
  onNavigateTab: (tab: string) => void;
}

export const ForecastPage: React.FC<ForecastPageProps> = ({
  forecasts,
  onQuickSaleProduct,
  onNavigateTab,
}) => {
  const [riskFilter, setRiskFilter] = useState<'ALL' | 'CRITICAL' | 'WARNING' | 'HEALTHY'>('ALL');

  // Filter forecasts
  const filteredForecasts = forecasts.filter(f => {
    if (riskFilter === 'ALL') return true;
    if (riskFilter === 'CRITICAL') return f.riskLevel === 'CRITICAL';
    if (riskFilter === 'WARNING') return f.riskLevel === 'WARNING' || f.riskLevel === 'LOW_STOCK';
    if (riskFilter === 'HEALTHY') return f.riskLevel === 'HEALTHY';
    return true;
  });

  const criticalCount = forecasts.filter(f => f.riskLevel === 'CRITICAL').length;
  const warningCount = forecasts.filter(f => f.riskLevel === 'WARNING' || f.riskLevel === 'LOW_STOCK').length;
  const healthyCount = forecasts.filter(f => f.riskLevel === 'HEALTHY').length;

  // Calculate estimated restock capital needed
  const totalReorderCapital = forecasts
    .filter(f => f.riskLevel === 'CRITICAL' || f.riskLevel === 'WARNING' || f.riskLevel === 'LOW_STOCK')
    .reduce((sum, f) => sum + (f.recommendedReorderQuantity || 0) * f.costPrice, 0);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page Title & Methodology Accordion */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Brain className="w-5 h-5 text-amber-600" />
            <span>Demand Forecasting & Stockout Countdown</span>
          </h2>
          <p className="text-xs text-slate-500">
            Statistical sales velocity modeling and intelligent replenishment recommendations.
          </p>
        </div>

        <button
          onClick={() => onNavigateTab('codey')}
          className="flex items-center gap-2 px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-lg text-xs font-semibold border border-amber-200 shadow-2xs transition-colors self-start sm:self-auto"
        >
          <Sparkles className="w-4 h-4 text-amber-600" />
          <span>Ask Codey Restock Advice</span>
        </button>
      </div>

      {/* Methodology & Disclaimer Notice */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-2">
        <div className="flex items-center gap-2 font-bold text-slate-800">
          <Info className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Statistical Forecasting Methodology & Transparency</span>
        </div>
        <p className="text-slate-600 leading-relaxed">
          Forecasts use an <strong>exponentially weighted moving average</strong> (&alpha; = 0.35, combining 60% 7-day velocity with 40% 30-day baseline rate) to capture recent surges while smoothing anomalies. Standard Indian retail supplier lead time is factored at <strong>3 to 4 days</strong>.
        </p>
        <p className="text-[11px] text-slate-500 italic">
          Disclaimer: Demand forecasts are mathematical projections based strictly on historical store velocity. Unexpected local demand surges or seasonal spikes may alter actual stockout timing. Always cross-reference with supplier availability.
        </p>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div
          onClick={() => setRiskFilter('CRITICAL')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            riskFilter === 'CRITICAL' ? 'ring-2 ring-red-500 bg-red-50/50' : 'bg-white hover:bg-slate-50'
          } border-red-200 shadow-2xs`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-red-700">
            <span>Critical Risk (&le; 3 Days)</span>
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          <p className="text-2xl font-extrabold text-red-600 mt-1">{criticalCount}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Imminent stockout warning</p>
        </div>

        <div
          onClick={() => setRiskFilter('WARNING')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            riskFilter === 'WARNING' ? 'ring-2 ring-amber-500 bg-amber-50/50' : 'bg-white hover:bg-slate-50'
          } border-amber-200 shadow-2xs`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-amber-800">
            <span>Warning (&le; 7 Days)</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-extrabold text-amber-700 mt-1">{warningCount}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Plan supplier reorder now</p>
        </div>

        <div
          onClick={() => setRiskFilter('HEALTHY')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            riskFilter === 'HEALTHY' ? 'ring-2 ring-emerald-500 bg-emerald-50/50' : 'bg-white hover:bg-slate-50'
          } border-emerald-200 shadow-2xs`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-800">
            <span>Healthy Stock (&gt; 7 Days)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-700 mt-1">{healthyCount}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Sufficient inventory buffer</p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Restock Capital Needed</p>
          <p className="text-xl font-extrabold text-slate-900 mt-1">{formatINR(totalReorderCapital)}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">At wholesale cost price</p>
        </div>
      </div>

      {/* Risk Filter Buttons */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg text-xs font-medium">
          {(['ALL', 'CRITICAL', 'WARNING', 'HEALTHY'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRiskFilter(r)}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                riskFilter === r
                  ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {r === 'ALL' ? `All Items (${forecasts.length})` : r.charAt(0) + r.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Forecast Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {filteredForecasts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Product Title</th>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5 text-center">Current Stock</th>
                  <th className="px-4 py-3.5 text-center">Sales Velocity</th>
                  <th className="px-4 py-3.5 text-center">Days to Stockout</th>
                  <th className="px-4 py-3.5 text-center">Projected Stockout</th>
                  <th className="px-4 py-3.5 text-center">Reorder By Date</th>
                  <th className="px-4 py-3.5 text-right font-bold text-amber-900">Recommended Qty</th>
                  <th className="px-5 py-3.5 text-center">Risk Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredForecasts.map((f) => {
                  const isCritical = f.riskLevel === 'CRITICAL';
                  const isWarning = f.riskLevel === 'WARNING' || f.riskLevel === 'LOW_STOCK';

                  return (
                    <tr key={f.productId} className="hover:bg-slate-50/80 transition-colors">
                      {/* Product Name */}
                      <td className="px-5 py-3.5 font-bold text-slate-900">
                        {f.productName}
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3.5 text-slate-600">
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {f.category}
                        </span>
                      </td>

                      {/* Current Stock */}
                      <td className="px-4 py-3.5 text-center font-extrabold text-slate-800">
                        {f.currentStock} units
                      </td>

                      {/* Sales Velocity */}
                      <td className="px-4 py-3.5 text-center">
                        <span className="font-semibold text-slate-900">{f.salesVelocity}</span>
                        <span className="text-[10px] text-slate-400 block">units/day</span>
                      </td>

                      {/* Days until stockout */}
                      <td className="px-4 py-3.5 text-center font-bold">
                        {f.hasEnoughHistory && f.estimatedDaysUntilStockout !== null ? (
                          <span className={`px-2 py-0.5 rounded-full text-xs ${
                            isCritical ? 'bg-red-100 text-red-800' : isWarning ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {f.estimatedDaysUntilStockout <= 0 ? 'Out of Stock' : `${f.estimatedDaysUntilStockout} days`}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Insufficient data</span>
                        )}
                      </td>

                      {/* Projected Stockout Date */}
                      <td className="px-4 py-3.5 text-center text-slate-600 font-medium">
                        {formatDateIST(f.estimatedStockoutDate)}
                      </td>

                      {/* Recommended Reorder Date */}
                      <td className="px-4 py-3.5 text-center text-slate-600 font-medium">
                        {formatDateIST(f.recommendedReorderDate)}
                      </td>

                      {/* Recommended Reorder Quantity */}
                      <td className="px-4 py-3.5 text-right font-extrabold text-amber-900">
                        {f.recommendedReorderQuantity ? `+${f.recommendedReorderQuantity} units` : 'N/A'}
                        <span className="text-[10px] text-slate-400 block font-normal">
                          ({formatINR((f.recommendedReorderQuantity || 0) * f.costPrice)})
                        </span>
                      </td>

                      {/* Risk Level */}
                      <td className="px-5 py-3.5 text-center">
                        <span className={`text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded ${
                          isCritical
                            ? 'bg-red-100 text-red-800'
                            : isWarning
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {f.riskLevel.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-xs text-slate-400">
            No products matching the selected risk level.
          </div>
        )}
      </div>
    </div>
  );
};
