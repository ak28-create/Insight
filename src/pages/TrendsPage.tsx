import React from 'react';
import {
  Compass,
  AlertCircle,
  Sparkles,
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
      {/* Header bar in Stripe Style */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#0a2540] tracking-tight flex items-center gap-2">
            <Compass className="w-5 h-5 text-[#635bff]" />
            <span>External Market Demand Trends</span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#635bff]/10 text-[#635bff] border border-[#635bff]/20">
              geo = &quot;IN&quot;
            </span>
          </h2>
          <p className="text-xs text-[#425466]">
            Real-world Google Trends search demand for &quot;{profile?.business_domain || 'Kirana / Grocery'}&quot; across India.
          </p>
        </div>

        <button
          onClick={() => onNavigateTab('settings')}
          className="text-xs text-[#0a2540] hover:text-[#635bff] px-3.5 py-2 rounded-lg border border-[#e3e8ee] bg-white hover:bg-slate-50 shadow-2xs font-medium self-start sm:self-auto transition-colors"
        >
          Change Retail Domain &rarr;
        </button>
      </div>

      {/* Grounding Policy Card */}
      <div className="p-4 bg-white border border-[#e3e8ee] rounded-2xl text-xs space-y-2 shadow-2xs">
        <div className="flex items-center gap-2 font-bold text-[#0a2540]">
          <AlertCircle className="w-4 h-4 text-[#635bff] shrink-0" />
          <span>Market Signals Grounding Policy</span>
        </div>
        <p className="text-[#425466] leading-relaxed">
          Google Trends data represents <strong>broader market search momentum across India</strong> and does not reflect your internal inventory. Use these signals as supplementary demand indicators alongside your real store data.
        </p>
      </div>

      {/* Signals Grid in Stripe Card Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {trends.map((t) => {
          return (
            <div
              key={t.id}
              className="bg-white rounded-2xl border border-[#e3e8ee] p-5 shadow-2xs flex flex-col justify-between space-y-4 hover:shadow-md hover:border-slate-300 transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#f6f9fc] text-[#0a2540] border border-[#e3e8ee]">
                    {t.category}
                  </span>
                  <span
                    className={`text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full ${
                      t.trendDirection === 'Rising'
                        ? 'bg-emerald-50 text-[#059669] border border-emerald-200'
                        : t.trendDirection === 'High Demand'
                        ? 'bg-[#635bff]/10 text-[#635bff] border border-[#635bff]/20'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {t.trendDirection}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-[#0a2540]">
                    &quot;{t.keyword}&quot;
                  </h3>
                  <p className="text-xs text-[#425466] mt-1 leading-relaxed">
                    {t.insightSummary}
                  </p>
                </div>

                {/* Search Volume Index Meter */}
                <div className="space-y-1.5 pt-2 border-t border-[#e3e8ee]">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#425466] font-medium">Search Volume Index</span>
                    <span className="font-bold text-[#0a2540]">{t.searchVolumeIndex} / 100</span>
                  </div>
                  <div className="w-full bg-[#f6f9fc] rounded-full h-2 overflow-hidden border border-[#e3e8ee]/80">
                    <div
                      className="bg-gradient-to-r from-[#635bff] to-[#00d4ff] h-full rounded-full transition-all"
                      style={{ width: `${t.searchVolumeIndex}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-[#425466]">
                    <span>Region: {t.geographicRegion}</span>
                    <span className="font-bold text-[#059669]">+{t.growthPercentage}% in 30d</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <button
                  onClick={() => onAskCodeyTrend(t)}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 bg-[#635bff]/10 hover:bg-[#635bff]/15 text-[#635bff] rounded-xl text-xs font-semibold border border-[#635bff]/20 transition-all hover:-translate-y-0.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
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
