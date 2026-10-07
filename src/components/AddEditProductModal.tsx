import React, { useState, useEffect } from 'react';
import { X, Check, PackagePlus, AlertCircle, Sparkles } from 'lucide-react';
import { Product } from '../types';
import { formatINR, DOMAIN_SUGGESTED_CATEGORIES } from '../utils/formatters';

interface AddEditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
  businessDomain: string;
  onSaved: (product: Product) => void;
}

export const AddEditProductModal: React.FC<AddEditProductModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
  businessDomain,
  onSaved,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [costPrice, setCostPrice] = useState<string>('');
  const [sellingPrice, setSellingPrice] = useState<string>('');
  const [currentStock, setCurrentStock] = useState<string>('');
  const [reorderThreshold, setReorderThreshold] = useState<string>('15');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Suggested categories based on selected domain
  const suggestedCategories = DOMAIN_SUGGESTED_CATEGORIES[businessDomain] || DOMAIN_SUGGESTED_CATEGORIES['Kirana / Grocery'];

  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name);
      setCategory(productToEdit.category);
      setCostPrice(String(productToEdit.cost_price));
      setSellingPrice(String(productToEdit.selling_price));
      setCurrentStock(String(productToEdit.current_stock));
      setReorderThreshold(String(productToEdit.reorder_threshold));
    } else {
      setName('');
      setCategory(suggestedCategories[0] || 'General');
      setCostPrice('');
      setSellingPrice('');
      setCurrentStock('20');
      setReorderThreshold('10');
    }
    setError(null);
  }, [productToEdit, isOpen, businessDomain]);

  if (!isOpen) return null;

  const costNum = parseFloat(costPrice) || 0;
  const sellNum = parseFloat(sellingPrice) || 0;
  const unitProfit = sellNum - costNum;
  const marginPercent = sellNum > 0 ? ((unitProfit / sellNum) * 100).toFixed(1) : '0';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a product title');
      return;
    }
    if (!category.trim()) {
      setError('Please provide or choose a category');
      return;
    }
    if (isNaN(costNum) || costNum < 0) {
      setError('Please enter a valid cost price');
      return;
    }
    if (isNaN(sellNum) || sellNum <= 0) {
      setError('Please enter a valid selling price greater than 0');
      return;
    }
    if (sellNum < costNum) {
      setError('Warning: Selling price is below cost price! Store would sell at a loss.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        name: name.trim(),
        category: category.trim(),
        cost_price: costNum,
        selling_price: sellNum,
        current_stock: parseInt(currentStock, 10) || 0,
        reorder_threshold: parseInt(reorderThreshold, 10) || 10,
      };

      const url = productToEdit ? `/api/products/${productToEdit.id}` : '/api/products';
      const method = productToEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save product');
      }

      onSaved(data.product);
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-700 flex items-center justify-center">
              <PackagePlus className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                {productToEdit ? 'Edit Product Details' : 'Add New Retail Product'}
              </h2>
              <p className="text-xs text-slate-500">Domain: {businessDomain}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Product Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Product Title & Pack Size *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Aashirvaad Atta 5kg, Amul Milk 1L, Type-C Cable"
              className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Category with suggestions */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                Category *
              </label>
              <span className="text-[11px] text-amber-700 font-medium flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                {businessDomain} suggestions
              </span>
            </div>
            <input
              type="text"
              required
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Select suggestion below or type custom category"
              className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 mb-2"
            />
            {/* Suggested chips */}
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto py-1">
              {suggestedCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`text-[11px] px-2.5 py-1 rounded-md border transition-colors ${
                    category === cat
                      ? 'bg-amber-100 border-amber-300 text-amber-900 font-semibold'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Prices Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Cost Price (₹) *
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                required
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                placeholder="₹ Supplier Rate"
                className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Selling Price (₹) *
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                required
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                placeholder="₹ Retail Rate"
                className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Margin Calculation Preview */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-500">Unit Profit:</span>
              <span className={`ml-1.5 font-bold ${unitProfit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                {unitProfit >= 0 ? `+${formatINR(unitProfit)}` : formatINR(unitProfit)}
              </span>
            </div>
            <div>
              <span className="text-slate-500">Profit Margin:</span>
              <span className={`ml-1.5 font-bold ${parseFloat(marginPercent) >= 15 ? 'text-emerald-700' : parseFloat(marginPercent) > 0 ? 'text-amber-700' : 'text-red-600'}`}>
                {marginPercent}%
              </span>
            </div>
          </div>

          {/* Stock & Reorder Threshold */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Current Stock (Units) *
              </label>
              <input
                type="number"
                min="0"
                required
                value={currentStock}
                onChange={(e) => setCurrentStock(e.target.value)}
                placeholder="e.g. 50"
                className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reorder Alert Level
              </label>
              <input
                type="number"
                min="1"
                value={reorderThreshold}
                onChange={(e) => setReorderThreshold(e.target.value)}
                placeholder="e.g. 15"
                className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <p className="text-[10px] text-slate-500 mt-1">Triggers low-stock & restock alerts</p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{loading ? 'Saving...' : productToEdit ? 'Save Changes' : 'Add to Inventory'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
