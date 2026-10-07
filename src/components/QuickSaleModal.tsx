import React, { useState } from 'react';
import { X, Check, AlertCircle, ShoppingCart, IndianRupee } from 'lucide-react';
import { Product } from '../types';
import { formatINR } from '../utils/formatters';

interface QuickSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onSaleCompleted: (saleResult: any) => void;
}

export const QuickSaleModal: React.FC<QuickSaleModalProps> = ({
  isOpen,
  onClose,
  products,
  onSaleCompleted,
}) => {
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const [quantity, setQuantity] = useState<number>(1);
  const [notes, setNotes] = useState<string>('Counter Cash Sale');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const selectedProduct = products.find(p => p.id === selectedProductId) || products[0];
  const isOutOfStock = selectedProduct ? selectedProduct.current_stock <= 0 : true;
  const isExceedingStock = selectedProduct ? quantity > selectedProduct.current_stock : false;

  const totalRevenue = selectedProduct ? selectedProduct.selling_price * quantity : 0;
  const totalCost = selectedProduct ? selectedProduct.cost_price * quantity : 0;
  const totalProfit = totalRevenue - totalCost;
  const marginPercent = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : '0';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    if (quantity <= 0) {
      setError('Please enter a valid quantity of at least 1 unit');
      return;
    }
    if (quantity > selectedProduct.current_stock) {
      setError(`Cannot record sale: requested ${quantity} units, but only ${selectedProduct.current_stock} units available in stock.`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: selectedProduct.id,
          quantity,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to record sale');
      }

      onSaleCompleted(data);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error occurred while recording transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-700 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Record Counter Sale</h2>
              <p className="text-xs text-slate-500">Live stock decrement & instant profit calculation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Product Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Select Product
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => {
                setSelectedProductId(e.target.value);
                setError(null);
              }}
              className="w-full text-xs font-medium bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.category}) - Stock: {p.current_stock} units - {formatINR(p.selling_price)}
                </option>
              ))}
            </select>
          </div>

          {/* Product Live Stock Status Box */}
          {selectedProduct && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-500">Current Available Stock:</span>
                <span className={`ml-2 font-bold ${
                  selectedProduct.current_stock <= 0
                    ? 'text-red-600'
                    : selectedProduct.current_stock <= selectedProduct.reorder_threshold
                    ? 'text-amber-600'
                    : 'text-emerald-700'
                }`}>
                  {selectedProduct.current_stock} units
                </span>
                {selectedProduct.current_stock <= selectedProduct.reorder_threshold && (
                  <span className="ml-2 text-[10px] text-amber-700 font-semibold bg-amber-100 px-1.5 py-0.5 rounded">
                    Low Stock
                  </span>
                )}
              </div>
              <div className="text-slate-600 font-medium">
                Price: <span className="font-bold text-slate-900">{formatINR(selectedProduct.selling_price)}</span>
              </div>
            </div>
          )}

          {/* Quantity Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Quantity Sold
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max={selectedProduct?.current_stock || 1}
                value={quantity}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setQuantity(isNaN(val) ? 1 : val);
                  setError(null);
                }}
                className={`w-full text-xs font-semibold bg-white border rounded-lg px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 ${
                  isExceedingStock
                    ? 'border-red-400 focus:ring-red-400'
                    : 'border-slate-300 focus:ring-amber-500'
                }`}
              />
              <div className="flex gap-1">
                {[1, 2, 5, 10].map(q => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => {
                      setQuantity(q);
                      setError(null);
                    }}
                    disabled={selectedProduct && q > selectedProduct.current_stock}
                    className="px-2.5 py-2 text-xs font-medium rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none"
                  >
                    +{q}
                  </button>
                ))}
              </div>
            </div>
            {isExceedingStock && (
              <p className="text-[11px] text-red-600 mt-1 font-medium">
                Requested quantity exceeds available stock ({selectedProduct?.current_stock} units available).
              </p>
            )}
          </div>

          {/* Transaction Value Preview in Indian Rupees */}
          <div className="p-4 bg-amber-50/50 border border-amber-200/80 rounded-xl space-y-2">
            <div className="text-xs font-bold text-amber-900 flex items-center justify-between border-b border-amber-200/60 pb-2">
              <span>Financial Impact (INR)</span>
              <span className="text-[11px] font-normal text-amber-800">IST Realtime Calculation</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center pt-1">
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Total Revenue</p>
                <p className="text-sm font-bold text-slate-900">{formatINR(totalRevenue)}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Cost Price</p>
                <p className="text-sm font-semibold text-slate-600">{formatINR(totalCost)}</p>
              </div>
              <div>
                <p className="text-[10px] text-emerald-700 uppercase tracking-wider font-semibold">Net Profit ({marginPercent}%)</p>
                <p className="text-sm font-bold text-emerald-700">+{formatINR(totalProfit)}</p>
              </div>
            </div>
          </div>

          {/* Transaction Note */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Payment & Note (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Counter Cash, UPI / PhonePe, Bill #104"
              className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || isOutOfStock || isExceedingStock}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50 disabled:pointer-events-none transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{loading ? 'Recording...' : 'Confirm & Record Sale'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
