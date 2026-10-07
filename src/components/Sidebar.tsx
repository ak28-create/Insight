import React from 'react';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  TrendingUp,
  Brain,
  Compass,
  Settings,
  Store,
  Sparkles,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { SellerProfile } from '../types';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  profile: SellerProfile | null;
  lowStockCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  profile,
  lowStockCount,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Overview & Health', icon: LayoutDashboard, layer: 'Core' },
    { id: 'inventory', label: 'Product Catalog', icon: Package, layer: 'Core', badge: lowStockCount > 0 ? `${lowStockCount} low` : undefined, badgeColor: 'bg-amber-50 text-amber-700 border border-amber-200' },
    { id: 'sales', label: 'Sales & POS', icon: ShoppingCart, layer: 'Core' },
    { id: 'analytics', label: 'Profit & Hero SKUs', icon: TrendingUp, layer: 'Intelligence' },
    { id: 'forecast', label: 'Demand Forecast', icon: Brain, layer: 'Intelligence' },
    { id: 'trends', label: 'Market Trends (IN)', icon: Compass, layer: 'Intelligence' },
    { id: 'codey', label: 'Codey AI Assistant', icon: Sparkles, layer: 'Intelligence', highlight: true },
    { id: 'settings', label: 'Store Settings', icon: Settings, layer: 'Settings' },
  ];

  return (
    <aside className="w-64 bg-white border-r border-[#e3e8ee] flex flex-col h-screen shrink-0 sticky top-0 z-30 select-none shadow-[1px_0_4px_rgba(0,0,0,0.02)]">
      {/* Stripe-style Brand Header */}
      <div className="p-5 border-b border-[#e3e8ee]/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#635bff] via-[#7a73ff] to-[#00d4ff] flex items-center justify-center text-white font-extrabold text-lg shadow-[0_2px_8px_rgba(99,91,255,0.35)]">
            In
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-[#0a2540] tracking-tight text-lg">InSight</span>
              <span className="text-[10px] font-bold tracking-wider px-1.5 py-0.2 rounded-sm bg-[#635bff]/10 text-[#635bff] border border-[#635bff]/20">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-[#425466] font-medium">Smart Retail & AI Engine</p>
          </div>
        </div>
      </div>

      {/* Store Profile Context Card */}
      <div className="px-4 py-3 mx-3 my-3 bg-[#f6f9fc] border border-[#e3e8ee] rounded-xl flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-white border border-[#e3e8ee] flex items-center justify-center text-[#635bff] shadow-2xs shrink-0">
          <Store className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-[#0a2540] truncate">
            {profile?.name || 'Sharma General Store'}
          </p>
          <p className="text-[11px] text-[#425466] truncate flex items-center gap-1">
            <span>{profile?.business_domain || 'Kirana'}</span>
            <span aria-hidden="true">·</span>
            <span>{profile?.city || 'India'}</span>
          </p>
        </div>
      </div>

      {/* Navigation List in Stripe visual hierarchy */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        <div className="px-3 pb-1 pt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Store Operations
        </div>
        {navItems.filter(i => i.layer === 'Core').map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-[#635bff]/10 text-[#635bff] font-semibold shadow-2xs'
                  : 'text-[#425466] hover:text-[#0a2540] hover:bg-[#f6f9fc]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#635bff]' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${item.badgeColor}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        <div className="px-3 pb-1 pt-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Analytics & Intelligence
        </div>
        {navItems.filter(i => i.layer === 'Intelligence').map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-[#635bff]/10 text-[#635bff] font-semibold shadow-2xs'
                  : item.highlight
                  ? 'text-[#635bff] bg-[#635bff]/5 hover:bg-[#635bff]/10 font-medium'
                  : 'text-[#425466] hover:text-[#0a2540] hover:bg-[#f6f9fc]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#635bff]' : item.highlight ? 'text-[#635bff]' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.highlight && !isActive && (
                <span className="text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 bg-gradient-to-r from-[#635bff] to-[#00d4ff] text-white rounded">
                  AI
                </span>
              )}
            </button>
          );
        })}

        <div className="px-3 pb-1 pt-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Configuration
        </div>
        {navItems.filter(i => i.layer === 'Settings').map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-[#635bff]/10 text-[#635bff] font-semibold shadow-2xs'
                  : 'text-[#425466] hover:text-[#0a2540] hover:bg-[#f6f9fc]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#635bff]' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Stripe-style Footer Stack Badge */}
      <div className="p-3.5 m-3 bg-[#f6f9fc] border border-[#e3e8ee] rounded-xl text-left">
        <div className="flex items-center gap-2 text-[11px] font-semibold text-[#0a2540] mb-1">
          <Layers className="w-3.5 h-3.5 text-[#635bff]" />
          <span>3-Layer InSight Stack</span>
        </div>
        <p className="text-[10px] text-[#425466] leading-tight">
          Operational · Analytical · AI Intelligence grounded in live SQLite ledger.
        </p>
      </div>
    </aside>
  );
};
