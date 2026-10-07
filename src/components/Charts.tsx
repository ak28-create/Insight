import React, { useState } from 'react';
import { formatINR } from '../utils/formatters';

interface TimeSeriesPoint {
  label: string; // date or month string
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
      <div className="h-48 flex items-center justify-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
        Record sales transactions to generate interactive revenue trend charts.
      </div>
    );
  }

  // Calculate scales
  const maxRevenue = Math.max(...data.map(d => d.revenue), 100);
  const maxProfit = Math.max(...data.map(d => d.profit), 50);
  const maxY = Math.ceil(maxRevenue * 1.15); // Add headroom for top label

  const padding = { top: 25, right: 20, bottom: 35, left: 60 };
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
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-bold text-slate-800 tracking-tight">{title}</h3>
        <div className="flex items-center gap-4 text-[11px] font-medium text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-600 inline-block"></span>
            <span>Revenue</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block"></span>
            <span>Net Profit</span>
          </div>
        </div>
      </div>

      <div className="w-full overflow-hidden bg-white rounded-xl border border-slate-200/80 p-2">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible select-none"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#d97706" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#d97706" stopOpacity="0.0" />
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
                stroke="#e2e8f0"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
              <text
                x={padding.left - 8}
                y={tick.y + 3}
                textAnchor="end"
                className="text-[10px] fill-slate-400 font-mono"
              >
                {formatINR(tick.val, true)}
              </text>
            </g>
          ))}

          {/* Revenue Area Fill */}
          <path d={revAreaPath} fill="url(#revGrad)" />

          {/* Revenue Line */}
          <path
            d={revLinePath}
            fill="none"
            stroke="#d97706"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Profit Line */}
          <path
            d={profLinePath}
            fill="none"
            stroke="#059669"
            strokeWidth="2"
            strokeDasharray="4 2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* X axis labels */}
          {points.map((p, i) => {
            if (i % step === 0 || i === points.length - 1) {
              return (
                <text
                  key={i}
                  x={p.x}
                  y={height - 10}
                  textAnchor="middle"
                  className="text-[10px] fill-slate-500 font-medium"
                >
                  {p.displayLabel}
                </text>
              );
            }
            return null;
          })}

          {/* Interactive hover columns */}
          {points.map((p, i) => (
            <rect
              key={i}
              x={p.x - (chartWidth / points.length) / 2}
              y={padding.top}
              width={chartWidth / points.length}
              height={chartHeight}
              fill="transparent"
              className="cursor-pointer"
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            />
          ))}

          {/* Active hover crosshair and points */}
          {hoveredPoint && (
            <g>
              <line
                x1={hoveredPoint.x}
                y1={padding.top}
                x2={hoveredPoint.x}
                y2={padding.top + chartHeight}
                stroke="#94a3b8"
                strokeWidth="1.5"
                strokeDasharray="2 2"
              />
              <circle cx={hoveredPoint.x} cy={hoveredPoint.yRev} r="4.5" fill="#d97706" stroke="#fff" strokeWidth="2" />
              <circle cx={hoveredPoint.x} cy={hoveredPoint.yProf} r="4" fill="#059669" stroke="#fff" strokeWidth="2" />
            </g>
          )}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredPoint && (
          <div
            className="absolute top-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white rounded-lg px-3 py-2 text-xs shadow-xl pointer-events-none z-10 flex flex-col gap-1 border border-slate-700 font-sans"
          >
            <div className="font-semibold text-slate-200 border-b border-slate-700 pb-1 flex items-center justify-between gap-4">
              <span>{hoveredPoint.displayLabel}</span>
              <span className="text-[10px] text-slate-400">{hoveredPoint.unitsSold} units sold</span>
            </div>
            <div className="flex items-center justify-between gap-6">
              <span className="text-amber-400">Total Revenue:</span>
              <span className="font-bold">{formatINR(hoveredPoint.revenue)}</span>
            </div>
            <div className="flex items-center justify-between gap-6">
              <span className="text-emerald-400">Net Profit:</span>
              <span className="font-bold">+{formatINR(hoveredPoint.profit)}</span>
            </div>
            <div className="text-[10px] text-slate-400 text-right">
              Margin: {hoveredPoint.revenue > 0 ? ((hoveredPoint.profit / hoveredPoint.revenue) * 100).toFixed(1) : 0}%
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
    profitMarginPercent: number;
  }[];
}

export const CategoryBarChart: React.FC<CategoryBarChartProps> = ({ categories }) => {
  if (!categories || categories.length === 0) {
    return (
      <div className="h-44 flex items-center justify-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
        No category sales data recorded yet.
      </div>
    );
  }

  const maxRev = Math.max(...categories.map(c => c.revenue), 1);

  return (
    <div className="space-y-3">
      {categories.slice(0, 6).map((cat, idx) => {
        const revPercent = Math.max(8, (cat.revenue / maxRev) * 100);
        return (
          <div key={idx} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-800 truncate max-w-[200px]">{cat.category}</span>
              <div className="flex items-center gap-3">
                <span className="font-bold text-slate-900">{formatINR(cat.revenue)}</span>
                <span className="text-[11px] text-emerald-700 font-medium">+{formatINR(cat.profit)}</span>
              </div>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden flex">
              <div
                className="bg-amber-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${revPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span>{cat.unitsSold} units sold</span>
              <span>{cat.profitMarginPercent}% profit margin</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
