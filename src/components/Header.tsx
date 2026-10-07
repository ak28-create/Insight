import React from 'react';
import { PlusCircle, Sparkles, AlertTriangle, IndianRupee } from 'lucide-react';
import { SellerProfile } from '../types';

interface HeaderProps {
  title: string;
  subtitle?: string;
  profile: SellerProfile | null;
  lowStockCount: number;
  onOpenQuickSale: () => void;
  onOpenCodey: () => void;
  onNavigateTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  profile,
  lowStockCount,
  onOpenQuickSale,
  onOpenCodey,
  onNavigateTab,
}) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20">
      <div>
        <h1 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
          {title}
        </h1>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {/* Currency & Market indicator */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700">
          <IndianRupee className="w-3.5 h-3.5 text-amber-700" />
          <span>INR (₹)</span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-500 text-[11px]">{profile?.city || 'India'}</span>
        </div>

        {/* Low Stock Urgency Alert */}
        {lowStockCount > 0 && (
          <button
            onClick={() => onNavigateTab('forecast')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg text-xs font-semibold text-amber-800 transition-colors"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
            <span>{lowStockCount} Restock Alert{lowStockCount > 1 ? 's' : ''}</span>
          </button>
        )}

        {/* Ask Codey AI */}
        <button
          onClick={onOpenCodey}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-medium transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span className="hidden md:inline">Ask Codey</span>
        </button>

        {/* Record Quick Sale (POS action) */}
        <button
          onClick={onOpenQuickSale}
          className="flex items-center gap-2 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Record Sale</span>
        </button>
      </div>
    </header>
  );
};
