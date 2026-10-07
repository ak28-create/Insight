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
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, layer: 'Operational' },
    { id: 'inventory', label: 'Inventory', icon: Package, layer: 'Operational', badge: lowStockCount > 0 ? `${lowStockCount} low` : undefined, badgeColor: 'bg-amber-100 text-amber-800' },
    { id: 'sales', label: 'Sales & POS', icon: ShoppingCart, layer: 'Operational' },
    { id: 'analytics', label: 'Analytics & Hero', icon: TrendingUp, layer: 'Analytical' },
    { id: 'forecast', label: 'Forecasting', icon: Brain, layer: 'Intelligence' },
    { id: 'trends', label: 'Market Trends', icon: Compass, layer: 'Intelligence' },
    { id: 'codey', label: 'Codey Assistant', icon: Sparkles, layer: 'Intelligence', highlight: true },
    { id: 'settings', label: 'Business Profile', icon: Settings, layer: 'Settings' },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen shrink-0 sticky top-0 z-30 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center text-white font-bold text-xl shadow-sm">
            In
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-slate-900 tracking-tight text-lg">InSight</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                IN
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">Smart Retail & AI</p>
          </div>
        </div>
      </div>

      {/* Store Profile Strip */}
      <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-100 flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700 shadow-2xs">
          <Store className="w-4 h-4 text-amber-600" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-slate-800 truncate">
            {profile?.name || 'Sharma General Store'}
          </p>
          <p className="text-[11px] text-slate-500 truncate flex items-center gap-1">
            <span>{profile?.business_domain || 'Kirana / Grocery'}</span>
            <span aria-hidden="true">·</span>
            <span>{profile?.city || 'India'}</span>
          </p>
        </div>
      </div>

      {/* Navigation List grouped cleanly */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-1 pt-0 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Core Operations
        </div>
        {navItems.filter(i => i.layer === 'Operational').map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-amber-50 text-amber-900 font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-600' : 'text-slate-400'}`} />
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
          Intelligence & Analytics
        </div>
        {navItems.filter(i => i.layer === 'Analytical' || i.layer === 'Intelligence').map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-amber-50 text-amber-900 font-semibold shadow-2xs'
                  : item.highlight
                  ? 'text-amber-700 bg-amber-50/50 hover:bg-amber-100/50 font-medium'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-600' : item.highlight ? 'text-amber-500' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.highlight && !isActive && (
                <span className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 bg-amber-500 text-white rounded">
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
                  ? 'bg-amber-50 text-amber-900 font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Indian SMB Architecture Guarantee Badge */}
      <div className="p-3 m-3 bg-slate-50 border border-slate-200/70 rounded-xl text-left">
        <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-700 mb-1">
          <Layers className="w-3.5 h-3.5 text-amber-600" />
          <span>3-Layer InSight Stack</span>
        </div>
        <p className="text-[10px] text-slate-500 leading-tight">
          Operational · Analytical · AI Intelligence grounded in real store data.
        </p>
      </div>
    </aside>
  );
};
