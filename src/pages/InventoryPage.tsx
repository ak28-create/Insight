import React, { useState } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  ArrowUpDown,
  ShoppingCart,
  PlusCircle,
} from 'lucide-react';
import { Product, ProductForecast } from '../types';
import { formatINR } from '../utils/formatters';

interface InventoryPageProps {
  products: Product[];
  forecasts: ProductForecast[];
  onOpenAddProduct: () => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onQuickSaleProduct: (product: Product) => void;
  onUpdateStock: (product: Product, newStock: number) => void;
}

export const InventoryPage: React.FC<InventoryPageProps> = ({
  products,
  forecasts,
  onOpenAddProduct,
  onEditProduct,
  onDeleteProduct,
  onQuickSaleProduct,
  onUpdateStock,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'low' | 'healthy' | 'critical'>('all');
  const [sortField, setSortField] = useState<'name' | 'stock' | 'price'>('name');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  // Extract unique categories
  const categories = Array.from(new Set(products.map(p => p.category))).filter(Boolean);

  // Create lookup map for forecasts
  const forecastMap = new Map<string, ProductForecast>();
  forecasts.forEach(f => forecastMap.set(f.productId, f));

  // Filter and sort products
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;

    let matchesStock = true;
    if (stockStatusFilter === 'critical') {
      matchesStock = p.current_stock <= 0;
    } else if (stockStatusFilter === 'low') {
      matchesStock = p.current_stock <= p.reorder_threshold;
    } else if (stockStatusFilter === 'healthy') {
      matchesStock = p.current_stock > p.reorder_threshold;
    }

    return matchesSearch && matchesCategory && matchesStock;
  }).sort((a, b) => {
    let cmp = 0;
    if (sortField === 'name') cmp = a.name.localeCompare(b.name);
    else if (sortField === 'stock') cmp = a.current_stock - b.current_stock;
    else if (sortField === 'price') cmp = a.selling_price - b.selling_price;
    return sortAsc ? cmp : -cmp;
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header bar in Stripe Style */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#0a2540] tracking-tight flex items-center gap-2">
            <Package className="w-5 h-5 text-[#635bff]" />
            <span>Product Inventory Catalog</span>
          </h2>
          <p className="text-xs text-[#425466]">
            Manage items, cost prices, selling rates, and real-time ledger stock levels.
          </p>
        </div>

        <button
          onClick={onOpenAddProduct}
          className="flex items-center gap-2 px-4 py-2 bg-[#635bff] hover:bg-[#5346e0] active:bg-[#4b3ecb] text-white rounded-lg text-xs font-semibold shadow-[0_2px_6px_rgba(99,91,255,0.3)] transition-all self-start sm:self-auto hover:-translate-y-0.5"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#e3e8ee] shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by product title or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-[#f6f9fc] border border-[#e3e8ee] rounded-lg text-[#0a2540] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#635bff] focus:bg-white transition-all"
            />
          </div>

          {/* Category Dropdown */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-xs bg-[#f6f9fc] border border-[#e3e8ee] rounded-lg px-3 py-2 text-[#0a2540] focus:outline-none focus:ring-2 focus:ring-[#635bff]"
            >
              <option value="all">All Categories ({products.length})</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c} ({products.filter(p => p.category === c).length})
                </option>
              ))}
            </select>

            {/* Stock status filter */}
            <select
              value={stockStatusFilter}
              onChange={(e) => setStockStatusFilter(e.target.value as any)}
              className="text-xs bg-[#f6f9fc] border border-[#e3e8ee] rounded-lg px-3 py-2 text-[#0a2540] focus:outline-none focus:ring-2 focus:ring-[#635bff]"
            >
              <option value="all">All Stock Statuses</option>
              <option value="healthy">Healthy Stock</option>
              <option value="low">Low Stock Alerts (&le; threshold)</option>
              <option value="critical">Out of Stock (0 units)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Table in Stripe Clean Table Style */}
      <div className="bg-white rounded-2xl border border-[#e3e8ee] shadow-sm overflow-hidden">
        {filteredProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#425466]">
              <thead className="bg-[#f6f9fc] border-b border-[#e3e8ee] text-[#0a2540] font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th
                    className="px-5 py-3.5 cursor-pointer hover:text-[#635bff] transition-colors"
                    onClick={() => {
                      if (sortField === 'name') setSortAsc(!sortAsc);
                      else { setSortField('name'); setSortAsc(true); }
                    }}
                  >
                    <div className="flex items-center gap-1">
                      <span>Product Title</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="px-4 py-3.5">Category</th>
                  <th
                    className="px-4 py-3.5 text-right cursor-pointer hover:text-[#635bff] transition-colors"
                    onClick={() => {
                      if (sortField === 'price') setSortAsc(!sortAsc);
                      else { setSortField('price'); setSortAsc(true); }
                    }}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Selling Price</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="px-4 py-3.5 text-right">Cost Price</th>
                  <th className="px-4 py-3.5 text-right">Unit Margin</th>
                  <th
                    className="px-4 py-3.5 text-center cursor-pointer hover:text-[#635bff] transition-colors"
                    onClick={() => {
                      if (sortField === 'stock') setSortAsc(!sortAsc);
                      else { setSortField('stock'); setSortAsc(true); }
                    }}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Current Stock</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="px-4 py-3.5 text-center">Forecast Countdown</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e3e8ee]">
                {filteredProducts.map((p) => {
                  const fc = forecastMap.get(p.id);
                  const isLow = p.current_stock <= p.reorder_threshold;
                  const isOut = p.current_stock <= 0;
                  const unitMargin = p.selling_price > 0
                    ? (((p.selling_price - p.cost_price) / p.selling_price) * 100).toFixed(1)
                    : '0';

                  return (
                    <tr key={p.id} className="hover:bg-[#f6f9fc]/80 transition-colors">
                      {/* Name */}
                      <td className="px-5 py-3.5 font-bold text-[#0a2540]">
                        <div className="flex items-center gap-2">
                          <span>{p.name}</span>
                          {isOut ? (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                              Out of Stock
                            </span>
                          ) : isLow ? (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                              Low Stock
                            </span>
                          ) : null}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3.5 text-[#425466]">
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-[#f6f9fc] text-[#0a2540] border border-[#e3e8ee]">
                          {p.category}
                        </span>
                      </td>

                      {/* Selling Price */}
                      <td className="px-4 py-3.5 text-right font-bold text-[#0a2540]">
                        {formatINR(p.selling_price)}
                      </td>

                      {/* Cost Price */}
                      <td className="px-4 py-3.5 text-right font-medium text-[#425466]">
                        {formatINR(p.cost_price)}
                      </td>

                      {/* Unit Margin */}
                      <td className="px-4 py-3.5 text-right">
                        <span className="text-[11px] font-bold text-[#059669] bg-emerald-50 border border-emerald-200/60 px-1.5 py-0.5 rounded">
                          +{formatINR(p.selling_price - p.cost_price)} ({unitMargin}%)
                        </span>
                      </td>

                      {/* Current Stock with Quick Adjust */}
                      <td className="px-4 py-3.5 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <span
                            className={`font-bold text-xs px-2 py-0.5 rounded-full ${
                              isOut
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : isLow
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-[#f6f9fc] text-[#0a2540] border border-[#e3e8ee]'
                            }`}
                          >
                            {p.current_stock} units
                          </span>
                          <button
                            title="Restock +10 units"
                            onClick={() => onUpdateStock(p, p.current_stock + 10)}
                            className="p-1 hover:bg-[#635bff]/10 text-slate-400 hover:text-[#635bff] rounded transition-colors"
                          >
                            <PlusCircle className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Forecast Countdown */}
                      <td className="px-4 py-3.5 text-center text-xs">
                        {fc && fc.hasEnoughHistory && fc.estimatedDaysUntilStockout !== null ? (
                          <div className="flex flex-col items-center">
                            <span className={`font-bold ${
                              fc.riskLevel === 'CRITICAL' ? 'text-rose-600' : fc.riskLevel === 'WARNING' ? 'text-amber-600' : 'text-[#0a2540]'
                            }`}>
                              ~{fc.estimatedDaysUntilStockout} days left
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {fc.salesVelocity} units/day
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">
                            Awaiting sales span
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right space-x-1 whitespace-nowrap">
                        <button
                          title="Record Sale"
                          onClick={() => onQuickSaleProduct(p)}
                          className="p-1.5 text-[#635bff] hover:bg-[#635bff]/10 rounded-lg transition-colors inline-block"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                        </button>
                        <button
                          title="Edit Details"
                          onClick={() => onEditProduct(p)}
                          className="p-1.5 text-[#425466] hover:bg-slate-100 hover:text-[#0a2540] rounded-lg transition-colors inline-block"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          title="Delete Product"
                          onClick={() => onDeleteProduct(p.id)}
                          className="p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors inline-block"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-xs text-slate-400 space-y-3">
            <Package className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="font-medium text-[#425466]">No products matching the selected filters.</p>
            <button
              onClick={onOpenAddProduct}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#635bff] hover:bg-[#5346e0] text-white rounded-lg text-xs font-semibold shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" /> Add New Product
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
