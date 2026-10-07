import React, { useState } from 'react';
import { formatINR } from '../utils/formatters';

interface TimeSeriesPoint {
  label: string;
  displayLabel: string;
  revenue: number;
  profit: number;
  unitsSold: number;
}

interface RevenueTrendChartProps {
  data: TimeSeriesPoint[];
  title?: string;
  height?: number;
}

export const RevenueTrendChart: React.FC<RevenueTrendChartProps> = ({
  data,
  title = 'Sales & Profit Trend (INR)',
  height = 240,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-xs text-[#425466] bg-[#f6f9fc] rounded-xl border border-dashed border-[#e3e8ee]">
        Record sales transactions to generate interactive revenue trend charts.
      </div>
    );
  }

  // Calculate scales
  const maxRevenue = Math.max(...data.map(d => d.revenue), 100);
  const maxY = Math.ceil(maxRevenue * 1.15); // headroom

  const padding = { top: 25, right: 20, bottom: 35, left: 65 };
  const width = 600; // viewBox width for SVG responsiveness

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const points = data.map((d, i) => {
    const x = padding.left + (i / Math.max(1, data.length - 1)) * chartWidth;
    const yRev = padding.top + chartHeight - (d.revenue / maxY) * chartHeight;
    const yProf = padding.top + chartHeight - (d.profit / maxY) * chartHeight;
    return { ...d, x, yRev, yProf };
  });

  const revLinePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.yRev}`).join(' ');
  const profLinePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.yProf}`).join(' ');

  // Gradient area path for revenue
  const revAreaPath = `${revLinePath} L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${points[0].x} ${padding.top + chartHeight} Z`;

  // Y-axis ticks
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(frac => {
    const val = maxY * frac;
    const y = padding.top + chartHeight - frac * chartHeight;
    return { val, y };
  });

  // Label interval for X-axis
  const step = Math.max(1, Math.floor(data.length / 6));

  const hoveredPoint = hoveredIdx !== null ? points[hoveredIdx] : null;

  return (
    <div className="w-full relative">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold text-[#0a2540] tracking-tight">{title}</h3>
        <div className="flex items-center gap-4 text-[11px] font-medium text-[#425466]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#635bff] inline-block shadow-xs"></span>
            <span>Gross Revenue</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#059669] inline-block shadow-xs"></span>
            <span>Net Profit</span>
          </div>
        </div>
      </div>

      <div className="w-full overflow-hidden bg-white rounded-xl border border-[#e3e8ee] p-2 shadow-2xs relative">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible select-none"
          preserveAspectRatio="none"
        >
          <defs>
            {/* Stripe blurple gradient */}
            <linearGradient id="stripeRevGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#635bff" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#635bff" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines and Y axis ticks */}
          {yTicks.map((tick, i) => (
            <g key={i}>
              <line
                x1={padding.left}
                y1={tick.y}
                x2={width - padding.right}
                y2={tick.y}
                stroke="#f1f5f9"
                strokeWidth="1"
                strokeDasharray={i === 0 ? 'none' : '3 3'}
              />
              <text
                x={padding.left - 8}
                y={tick.y + 3}
                textAnchor="end"
                className="text-[9px] fill-slate-400 font-mono font-medium"
              >
                {tick.val >= 1000 ? `₹${Math.round(tick.val / 1000)}k` : `₹${Math.round(tick.val)}`}
              </text>
            </g>
          ))}

          {/* Area fill */}
          <path d={revAreaPath} fill="url(#stripeRevGrad)" />

          {/* Revenue line (Stripe Blurple) */}
          <path
            d={revLinePath}
            fill="none"
            stroke="#635bff"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Profit line (Stripe Emerald) */}
          <path
            d={profLinePath}
            fill="none"
            stroke="#059669"
            strokeWidth="2"
            strokeDasharray="4 2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Interactive points & hover listeners */}
          {points.map((p, idx) => (
            <g
              key={idx}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              className="cursor-pointer"
            >
              <circle
                cx={p.x}
                cy={p.yRev}
                r={hoveredIdx === idx ? 5 : 3}
                fill="#ffffff"
                stroke="#635bff"
                strokeWidth={hoveredIdx === idx ? 3 : 2}
                className="transition-all"
              />
              <circle
                cx={p.x}
                cy={p.yProf}
                r={hoveredIdx === idx ? 4 : 2}
                fill="#ffffff"
                stroke="#059669"
                strokeWidth={hoveredIdx === idx ? 2.5 : 1.5}
                className="transition-all"
              />
              {/* Invisible wide hit area */}
              <rect
                x={p.x - 12}
                y={padding.top}
                width={24}
                height={chartHeight}
                fill="transparent"
              />
            </g>
          ))}

          {/* X axis labels */}
          {points.map((p, idx) => {
            if (idx % step === 0 || idx === points.length - 1) {
              return (
                <text
                  key={idx}
                  x={p.x}
                  y={height - 10}
                  textAnchor="middle"
                  className="text-[9px] fill-slate-400 font-mono"
                >
                  {p.displayLabel}
                </text>
              );
            }
            return null;
          })}
        </svg>

        {/* Hover Tooltip in Stripe Card Style */}
        {hoveredPoint && (
          <div
            className="absolute top-3 right-4 bg-white/95 backdrop-blur-sm border border-[#e3e8ee] rounded-xl p-3 shadow-[0_4px_14px_rgba(10,37,64,0.12)] text-xs space-y-1 pointer-events-none transition-all z-10"
          >
            <div className="font-bold text-[#0a2540] border-b border-[#e3e8ee] pb-1">
              {hoveredPoint.label}
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-[#425466]">Revenue:</span>
              <span className="font-bold text-[#635bff]">{formatINR(hoveredPoint.revenue)}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-[#425466]">Net Profit:</span>
              <span className="font-bold text-[#059669]">+{formatINR(hoveredPoint.profit)}</span>
            </div>
            <div className="flex items-center justify-between gap-4 text-[10px] text-slate-400 pt-0.5">
              <span>Units Sold:</span>
              <span className="font-medium">{hoveredPoint.unitsSold} units</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface CategoryBarChartProps {
  categories: {
    category: string;
    revenue: number;
    profit: number;
    unitsSold: number;
    productCount: number;
  }[];
}

export const CategoryBarChart: React.FC<CategoryBarChartProps> = ({ categories }) => {
  if (!categories || categories.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-xs text-[#425466] bg-[#f6f9fc] rounded-xl border border-dashed border-[#e3e8ee]">
        No category sales recorded yet.
      </div>
    );
  }

  const maxRevenue = Math.max(...categories.map(c => c.revenue), 10);

  return (
    <div className="space-y-3">
      {categories.map((cat) => {
        const revWidthPercent = Math.min(100, Math.max(6, (cat.revenue / maxRevenue) * 100));
        const profitMargin = cat.revenue > 0 ? ((cat.profit / cat.revenue) * 100).toFixed(1) : '0';

        return (
          <div key={cat.category} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[#0a2540]">{cat.category}</span>
                <span className="text-[10px] text-[#425466]">
                  ({cat.productCount} SKUs · {cat.unitsSold} units)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#0a2540]">{formatINR(cat.revenue)}</span>
                <span className="text-[10px] font-semibold text-[#059669]">
                  +{formatINR(cat.profit)} ({profitMargin}%)
                </span>
              </div>
            </div>

            {/* Gradient Bar in Stripe Style */}
            <div className="h-2.5 w-full bg-[#f6f9fc] rounded-full overflow-hidden border border-[#e3e8ee]/60">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#635bff] to-[#00d4ff] transition-all duration-500"
                style={{ width: `${revWidthPercent}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
