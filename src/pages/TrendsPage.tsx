import React from 'react';
import {
  Compass,
  TrendingUp,
  AlertCircle,
  ExternalLink,
  Sparkles,
  Info,
  Layers,
  ArrowUpRight,
  Globe2,
} from 'lucide-react';
import { MarketTrendSignal, SellerProfile } from '../types';

interface TrendsPageProps {
  trends: MarketTrendSignal[];
  profile: SellerProfile | null;
  onAskCodeyTrend: (trend: MarketTrendSignal) => void;
  onNavigateTab: (tab: string) => void;
}

export const TrendsPage: React.FC<TrendsPageProps> = ({
  trends,
  profile,
  onAskCodeyTrend,
  onNavigateTab,
}) => {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Compass className="w-5 h-5 text-blue-600" />
            <span>External Market Trends</span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              geo = &quot;IN&quot;
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            Real-world Google Trends search demand for &quot;{profile?.business_domain || 'Kirana / Grocery'}&quot; across India.
          </p>
        </div>

        <button
          onClick={() => onNavigateTab('settings')}
          className="text-xs text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 self-start sm:self-auto"
        >
          Change Retail Domain &rarr;
        </button>
      </div>

      {/* Strict Grounding Notice */}
      <div className="p-4 bg-amber-50/70 border border-amber-200/90 rounded-2xl text-xs space-y-2">
        <div className="flex items-center gap-2 font-bold text-amber-900">
          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
          <span>Market Signals Grounding Policy</span>
        </div>
        <p className="text-amber-800 leading-relaxed">
          Google Trends data represents <strong>broader market interest across India</strong> and does not reflect your internal inventory. Use these signals as supplementary demand indicators alongside your real store data.
        </p>
      </div>

      {/* Signals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {trends.map((t) => {
          const isHighGrowth = t.growthPercentage >= 8;
          return (
            <div
              key={t.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs flex flex-col justify-between space-y-4 hover:border-slate-300 transition-colors"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {t.category}
                  </span>
                  <span
                    className={`text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded ${
                      t.trendDirection === 'Rising'
                        ? 'bg-emerald-100 text-emerald-800'
                        : t.trendDirection === 'High Demand'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {t.trendDirection}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    &quot;{t.keyword}&quot;
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {t.insightSummary}
                  </p>
                </div>

                {/* Search Volume Index Meter */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Search Volume Index</span>
                    <span className="font-extrabold text-slate-900">{t.searchVolumeIndex} / 100</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full"
                      style={{ width: `${t.searchVolumeIndex}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Region: {t.geographicRegion}</span>
                    <span className="font-bold text-emerald-700">+{t.growthPercentage}% in 30d</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <button
                  onClick={() => onAskCodeyTrend(t)}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-xl text-xs font-semibold border border-amber-200 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Ask Codey How to Capitalize</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
