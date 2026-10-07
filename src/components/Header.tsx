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
    <header className="h-16 bg-white/95 backdrop-blur-md border-b border-[#e3e8ee] px-6 flex items-center justify-between sticky top-0 z-20">
      <div>
        <h1 className="text-base font-bold text-[#0a2540] tracking-tight flex items-center gap-2">
          {title}
        </h1>
        {subtitle && <p className="text-xs text-[#425466]">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {/* Currency & Market indicator */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-[#f6f9fc] border border-[#e3e8ee] rounded-lg text-xs font-medium text-[#0a2540]">
          <IndianRupee className="w-3.5 h-3.5 text-[#635bff]" />
          <span className="font-semibold">INR (₹)</span>
          <span className="text-slate-300">|</span>
          <span className="text-[#425466] text-[11px]">{profile?.city || 'India'}</span>
        </div>

        {/* Low Stock Alert */}
        {lowStockCount > 0 && (
          <button
            onClick={() => onNavigateTab('forecast')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100/80 border border-amber-200/90 rounded-lg text-xs font-semibold text-amber-900 transition-colors shadow-2xs"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
            <span>{lowStockCount} Restock Alert{lowStockCount > 1 ? 's' : ''}</span>
          </button>
        )}

        {/* Ask Codey AI */}
        <button
          onClick={onOpenCodey}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f6f9fc] hover:bg-[#e3e8ee]/70 text-[#0a2540] border border-[#e3e8ee] rounded-lg text-xs font-semibold transition-colors shadow-2xs group"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#635bff] group-hover:scale-110 transition-transform" />
          <span className="hidden md:inline">Ask Codey</span>
        </button>

        {/* Record Quick Sale (Stripe signature Blurple button) */}
        <button
          onClick={onOpenQuickSale}
          className="flex items-center gap-2 px-3.5 py-1.5 bg-[#635bff] hover:bg-[#5346e0] active:bg-[#4b3ecb] text-white rounded-lg text-xs font-semibold shadow-[0_2px_6px_rgba(99,91,255,0.3)] transition-all hover:-translate-y-0.5"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Record Sale</span>
        </button>
      </div>
    </header>
  );
};
