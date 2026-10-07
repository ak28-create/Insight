import React, { useState } from 'react';
import {
  ShoppingCart,
  PlusCircle,
  Search,
  Filter,
  Calendar,
  Receipt,
  Download,
  IndianRupee,
  CheckCircle2,
} from 'lucide-react';
import { Sale, Product } from '../types';
import { formatINR, formatDateIST } from '../utils/formatters';

interface SalesPageProps {
  sales: Sale[];
  products: Product[];
  onOpenQuickSale: () => void;
  onRefreshSales: () => void;
}

export const SalesPage: React.FC<SalesPageProps> = ({
  sales,
  products,
  onOpenQuickSale,
  onRefreshSales,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | '7d' | '30d'>('all');

  const now = new Date();

  const filteredSales = sales.filter((s) => {
    const matchesSearch = (s.product_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (s.invoice_no || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (s.notes || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (dateFilter === 'today') {
      const todayStr = now.toISOString().split('T')[0];
      return s.sale_date.startsWith(todayStr);
    } else if (dateFilter === '7d') {
      const boundary = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return new Date(s.sale_date) >= boundary;
    } else if (dateFilter === '30d') {
      const boundary = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return new Date(s.sale_date) >= boundary;
    }

    return true;
  });

  const totalFilteredRevenue = filteredSales.reduce((sum, s) => sum + s.total_amount, 0);
  const totalFilteredProfit = filteredSales.reduce((sum, s) => sum + s.profit, 0);
  const totalFilteredUnits = filteredSales.reduce((sum, s) => sum + s.quantity, 0);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-amber-600" />
            <span>Sales & Counter POS Ledger</span>
          </h2>
          <p className="text-xs text-slate-500">
            Recorded store transactions, historical unit rates, and instant profit calculations.
          </p>
        </div>

        <button
          onClick={onOpenQuickSale}
          className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Record New Sale</span>
        </button>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Filtered Revenue</p>
          <p className="text-xl font-extrabold text-slate-900 mt-1">{formatINR(totalFilteredRevenue)}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">{totalFilteredUnits} units sold across {filteredSales.length} bills</p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Realized Net Profit</p>
          <p className="text-xl font-extrabold text-emerald-700 mt-1">+{formatINR(totalFilteredProfit)}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Margin: {totalFilteredRevenue > 0 ? ((totalFilteredProfit / totalFilteredRevenue) * 100).toFixed(1) : 0}%
          </p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Average Basket Value</p>
          <p className="text-xl font-extrabold text-slate-900 mt-1">
            {filteredSales.length > 0 ? formatINR(totalFilteredRevenue / filteredSales.length) : '₹0'}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Per counter invoice</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by invoice #, product title, or payment note..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg text-xs font-medium self-start md:self-auto">
          {[
            { id: 'all', label: 'All History' },
            { id: '30d', label: 'Last 30 Days' },
            { id: '7d', label: 'Last 7 Days' },
            { id: 'today', label: 'Today' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setDateFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                dateFilter === tab.id
                  ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sales Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {filteredSales.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Invoice #</th>
                  <th className="px-4 py-3.5">Date & Time (IST)</th>
                  <th className="px-4 py-3.5">Product Title</th>
                  <th className="px-4 py-3.5 text-center">Qty</th>
                  <th className="px-4 py-3.5 text-right">Selling Rate</th>
                  <th className="px-4 py-3.5 text-right">Cost Rate</th>
                  <th className="px-4 py-3.5 text-right font-bold text-slate-900">Total (₹)</th>
                  <th className="px-4 py-3.5 text-right font-bold text-emerald-800">Net Profit (₹)</th>
                  <th className="px-5 py-3.5 text-right">Payment / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSales.slice(0, 100).map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Invoice */}
                    <td className="px-5 py-3.5 font-mono text-[11px] font-semibold text-slate-700">
                      {s.invoice_no || `INV-${s.id.slice(-6)}`}
                    </td>

                    {/* Date IST */}
                    <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap">
                      {formatDateIST(s.sale_date, true)}
                    </td>

                    {/* Product Name */}
                    <td className="px-4 py-3.5 font-bold text-slate-900">
                      {s.product_name || 'Retail Item'}
                    </td>

                    {/* Quantity */}
                    <td className="px-4 py-3.5 text-center font-extrabold text-slate-800">
                      {s.quantity}
                    </td>

                    {/* Selling Price at Sale */}
                    <td className="px-4 py-3.5 text-right text-slate-700 font-medium">
                      {formatINR(s.selling_price_at_sale)}
                    </td>

                    {/* Cost Price at Sale */}
                    <td className="px-4 py-3.5 text-right text-slate-500">
                      {formatINR(s.cost_price_at_sale)}
                    </td>

                    {/* Total Amount */}
                    <td className="px-4 py-3.5 text-right font-extrabold text-slate-900">
                      {formatINR(s.total_amount)}
                    </td>

                    {/* Profit */}
                    <td className="px-4 py-3.5 text-right font-bold text-emerald-700">
                      +{formatINR(s.profit)}
                    </td>

                    {/* Notes */}
                    <td className="px-5 py-3.5 text-right text-slate-500 text-[11px] truncate max-w-[150px]">
                      {s.notes || 'POS Cash Sale'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-xs text-slate-400 space-y-3">
            <Receipt className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="font-medium text-slate-600">No transactions recorded for the selected filter.</p>
            <button
              onClick={onOpenQuickSale}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs"
            >
              <PlusCircle className="w-3.5 h-3.5" /> Record First Sale
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
