import React, { useState } from 'react';
import {
  Settings,
  Trash2,
  Check,
  AlertTriangle,
  Database,
} from 'lucide-react';
import { SellerProfile } from '../types';
import { INDIAN_RETAIL_DOMAINS } from '../utils/formatters';

interface SettingsPageProps {
  profile: SellerProfile | null;
  onUpdateProfile: (updated: Partial<SellerProfile>) => Promise<void>;
  onSeedDemo: (domain: string) => Promise<void>;
  onResetData: () => Promise<void>;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  profile,
  onUpdateProfile,
  onSeedDemo,
  onResetData,
}) => {
  const [storeName, setStoreName] = useState(profile?.name || 'Sharma General Store');
  const [businessDomain, setBusinessDomain] = useState(profile?.business_domain || 'Kirana / Grocery');
  const [customDomain, setCustomDomain] = useState(profile?.custom_domain || '');
  const [city, setCity] = useState(profile?.city || 'Lucknow');
  const [state, setState] = useState(profile?.state || 'Uttar Pradesh');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [seedingDomain, setSeedingDomain] = useState<string | null>(null);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    try {
      await onUpdateProfile({
        name: storeName.trim(),
        business_domain: businessDomain,
        custom_domain: businessDomain === 'Other' ? customDomain.trim() : null,
        city: city.trim(),
        state: state.trim(),
      });
      setSuccessMsg('Business profile and retail domain updated successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSeed = async (domain: string) => {
    setSeedingDomain(domain);
    try {
      await onSeedDemo(domain);
      setSuccessMsg(`Successfully loaded ${domain} retail sandbox!`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } finally {
      setSeedingDomain(null);
    }
  };

  const handleReset = async () => {
    await onResetData();
    setSuccessMsg('Database cleared successfully.');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header bar in Stripe Style */}
      <div>
        <h2 className="text-xl font-bold text-[#0a2540] tracking-tight flex items-center gap-2">
          <Settings className="w-5 h-5 text-[#635bff]" />
          <span>Business Profile & Domain Configuration</span>
        </h2>
        <p className="text-xs text-[#425466]">
          Configure your Indian retail store identity, localization parameters, and industry vertical.
        </p>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-[#059669] flex items-center gap-2">
          <Check className="w-4 h-4 text-[#059669]" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleProfileSubmit} className="bg-white rounded-2xl border border-[#e3e8ee] p-6 shadow-sm space-y-5">
        <div className="border-b border-[#e3e8ee] pb-3">
          <h3 className="text-sm font-bold text-[#0a2540]">Store Identification</h3>
          <p className="text-xs text-[#425466]">Used across POS invoices, Codey assistant, and reporting</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#0a2540] mb-1">
              Store Name / Business Trade Name *
            </label>
            <input
              type="text"
              required
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="w-full text-xs bg-[#f6f9fc] border border-[#e3e8ee] rounded-lg px-3 py-2 text-[#0a2540] focus:outline-none focus:ring-2 focus:ring-[#635bff] focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0a2540] mb-1">
              Primary Business Domain *
            </label>
            <select
              value={businessDomain}
              onChange={(e) => setBusinessDomain(e.target.value)}
              className="w-full text-xs bg-[#f6f9fc] border border-[#e3e8ee] rounded-lg px-3 py-2 text-[#0a2540] focus:outline-none focus:ring-2 focus:ring-[#635bff]"
            >
              {INDIAN_RETAIL_DOMAINS.map((dom) => (
                <option key={dom} value={dom}>
                  {dom}
                </option>
              ))}
            </select>
          </div>
        </div>

        {businessDomain === 'Other' && (
          <div>
            <label className="block text-xs font-semibold text-[#0a2540] mb-1">
              Custom Domain Name *
            </label>
            <input
              type="text"
              required
              value={customDomain}
              onChange={(e) => setCustomDomain(e.target.value)}
              placeholder="e.g. Ayurvedic Pharmacy, Pet Supplies, Hardware Store"
              className="w-full text-xs bg-[#f6f9fc] border border-[#e3e8ee] rounded-lg px-3 py-2 text-[#0a2540] focus:outline-none focus:ring-2 focus:ring-[#635bff] focus:bg-white transition-all"
            />
          </div>
        )}

        {/* Location & Localization */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-[#0a2540] mb-1">
              City
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full text-xs bg-[#f6f9fc] border border-[#e3e8ee] rounded-lg px-3 py-2 text-[#0a2540] focus:outline-none focus:ring-2 focus:ring-[#635bff] focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0a2540] mb-1">
              State
            </label>
            <input
              type="text"
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full text-xs bg-[#f6f9fc] border border-[#e3e8ee] rounded-lg px-3 py-2 text-[#0a2540] focus:outline-none focus:ring-2 focus:ring-[#635bff] focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0a2540] mb-1">
              Currency & Region
            </label>
            <div className="text-xs bg-[#f6f9fc] border border-[#e3e8ee] rounded-lg px-3 py-2 text-[#425466] font-medium">
              INR (₹) · India (Locked)
            </div>
          </div>
        </div>

        {/* Confirmation note on domain change */}
        <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <span>
            Note: Changing the business domain dynamically updates external India Google Trends queries and Codey conversational focus. Your existing catalog and sales data are preserved.
          </span>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#635bff] hover:bg-[#5346e0] active:bg-[#4b3ecb] text-white rounded-lg text-xs font-semibold shadow-[0_2px_6px_rgba(99,91,255,0.3)] disabled:opacity-50 transition-all hover:-translate-y-0.5"
          >
            <Check className="w-4 h-4" />
            <span>{saving ? 'Updating...' : 'Save Profile Changes'}</span>
          </button>
        </div>
      </form>

      {/* Demo Sandbox & Testing Switcher in Stripe Style */}
      <div className="bg-white rounded-2xl border border-[#e3e8ee] p-6 shadow-sm space-y-4">
        <div className="border-b border-[#e3e8ee] pb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#0a2540]">Retail Sandbox & Demo Data</h3>
            <p className="text-xs text-[#425466]">
              Instantly seed verified 180-day sales histories and real Indian product catalogs across different sectors.
            </p>
          </div>
          <Database className="w-5 h-5 text-slate-400" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-4 rounded-xl border border-[#e3e8ee] bg-[#f6f9fc] space-y-2 flex flex-col justify-between hover:border-slate-300 transition-colors">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                Kirana / Grocery
              </span>
              <h4 className="text-xs font-bold text-[#0a2540] mt-2">Sharma General Store</h4>
              <p className="text-[11px] text-[#425466] leading-tight">
                15 FMCG items (Atta, Dal, Mustard Oil, Amul Milk, Parle-G, Maggi) with 180 days sales.
              </p>
            </div>
            <button
              type="button"
              disabled={seedingDomain !== null}
              onClick={() => handleSeed('Kirana / Grocery')}
              className="w-full mt-2 py-2 px-3 bg-white hover:bg-[#635bff]/10 text-[#0a2540] hover:text-[#635bff] rounded-lg text-xs font-semibold border border-[#e3e8ee] transition-all shadow-2xs"
            >
              {seedingDomain === 'Kirana / Grocery' ? 'Loading...' : 'Load Kirana Demo'}
            </button>
          </div>

          <div className="p-4 rounded-xl border border-[#e3e8ee] bg-[#f6f9fc] space-y-2 flex flex-col justify-between hover:border-slate-300 transition-colors">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#635bff] bg-[#635bff]/10 px-2 py-0.5 rounded-full">
                Mobile Accessories
              </span>
              <h4 className="text-xs font-bold text-[#0a2540] mt-2">Gupta Mobile Zone</h4>
              <p className="text-[11px] text-[#425466] leading-tight">
                10 Tech items (65W Fast Charger, Tempered Glass, boAt Rockerz, braided cables) with 180 days sales.
              </p>
            </div>
            <button
              type="button"
              disabled={seedingDomain !== null}
              onClick={() => handleSeed('Mobile Accessories')}
              className="w-full mt-2 py-2 px-3 bg-white hover:bg-[#635bff]/10 text-[#0a2540] hover:text-[#635bff] rounded-lg text-xs font-semibold border border-[#e3e8ee] transition-all shadow-2xs"
            >
              {seedingDomain === 'Mobile Accessories' ? 'Loading...' : 'Load Mobile Demo'}
            </button>
          </div>

          <div className="p-4 rounded-xl border border-[#e3e8ee] bg-[#f6f9fc] space-y-2 flex flex-col justify-between hover:border-slate-300 transition-colors">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                Apparel & Fashion
              </span>
              <h4 className="text-xs font-bold text-[#0a2540] mt-2">Kalyan Fashion & Sarees</h4>
              <p className="text-[11px] text-[#425466] leading-tight">
                8 Garment lines (Cotton Kurtis, Banarasi Silk Sarees, Linen Shirts, Slim Fit Jeans) with 180 days sales.
              </p>
            </div>
            <button
              type="button"
              disabled={seedingDomain !== null}
              onClick={() => handleSeed('Apparel')}
              className="w-full mt-2 py-2 px-3 bg-white hover:bg-[#635bff]/10 text-[#0a2540] hover:text-[#635bff] rounded-lg text-xs font-semibold border border-[#e3e8ee] transition-all shadow-2xs"
            >
              {seedingDomain === 'Apparel' ? 'Loading...' : 'Load Apparel Demo'}
            </button>
          </div>
        </div>

        {/* Clear Database */}
        <div className="pt-4 border-t border-[#e3e8ee] flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#0a2540]">Empty State Testing</p>
            <p className="text-[11px] text-[#425466]">Clear all records to test fresh onboarding experience</p>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 transition-colors shadow-2xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Reset All Data</span>
          </button>
        </div>
      </div>
    </div>
  );
};
