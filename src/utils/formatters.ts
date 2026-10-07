/**
 * Formats a number according to the Indian Rupee numbering system (Lakhs, Crores).
 * Example: 125000 -> ₹1,25,000
 */
export function formatINR(amount: number | null | undefined, compact: boolean = false): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₹0';
  }

  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  if (compact) {
    if (absAmount >= 10000000) {
      const cr = (absAmount / 10000000).toFixed(2);
      return `${isNegative ? '-' : ''}₹${parseFloat(cr)}Cr`;
    }
    if (absAmount >= 100000) {
      const lakh = (absAmount / 100000).toFixed(2);
      return `${isNegative ? '-' : ''}₹${parseFloat(lakh)}L`;
    }
    if (absAmount >= 1000) {
      const k = (absAmount / 1000).toFixed(1);
      return `${isNegative ? '-' : ''}₹${parseFloat(k)}k`;
    }
    return `${isNegative ? '-' : ''}₹${absAmount.toFixed(0)}`;
  }

  // Exact Indian Currency Formatting
  const parts = absAmount.toFixed(2).split('.');
  let integerPart = parts[0];
  const decimalPart = parts[1];

  // Indian comma placement: last 3 digits, then groups of 2 digits
  let lastThree = integerPart.substring(integerPart.length - 3);
  const otherNumbers = integerPart.substring(0, integerPart.length - 3);
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  const formattedInteger = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;
  
  // Omit .00 for whole numbers to keep display clean
  const finalFraction = decimalPart === '00' ? '' : `.${decimalPart}`;

  return `${isNegative ? '-' : ''}₹${formattedInteger}${finalFraction}`;
}

/**
 * Format date in DD/MM/YYYY format as preferred by Indian businesses.
 */
export function formatDateIST(dateStr: string | null | undefined, includeTime: boolean = false): string {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();

    if (!includeTime) {
      return `${day}/${month}/${year}`;
    }

    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 hour is 12 AM
    const formattedHours = String(hours).padStart(2, '0');

    return `${day}/${month}/${year} ${formattedHours}:${minutes} ${ampm}`;
  } catch {
    return dateStr;
  }
}

/**
 * Common Indian retail domains
 */
export const INDIAN_RETAIL_DOMAINS = [
  'Kirana / Grocery',
  'FMCG',
  'Food & Beverages',
  'Dairy & Daily Essentials',
  'Personal Care',
  'Household & Cleaning',
  'Apparel',
  'Footwear',
  'Stationery',
  'Electronics',
  'Mobile Accessories',
  'Home & Kitchen',
  'General Retail',
  'Other',
] as const;

export const DOMAIN_SUGGESTED_CATEGORIES: Record<string, string[]> = {
  'Kirana / Grocery': [
    'Staples & Grains',
    'Edible Oils & Ghee',
    'Dairy & Daily Essentials',
    'Packaged Foods',
    'Biscuits & Snacks',
    'Tea & Coffee',
    'Spices & Masalas',
    'Household & Cleaning',
    'Personal Care',
  ],
  'FMCG': [
    'Personal Care',
    'Oral Care',
    'Soaps & Shampoos',
    'Household & Cleaning',
    'Packaged Foods',
    'Biscuits & Snacks',
    'Baby Care',
  ],
  'Mobile Accessories': [
    'Cables & Adapters',
    'Phone Cases',
    'Screen Protectors',
    'Audio & Wearables',
    'Power Banks',
    'Car Mounts & Chargers',
    'Memory & Storage',
  ],
  'Apparel': [
    'Ethnic Wear',
    'Casual Wear',
    'Formal Wear',
    'Bottom Wear',
    'Winter Wear',
    'Kids Wear',
    'Fabrics & Sarees',
  ],
  'Stationery': [
    'Notebooks & Registers',
    'Pens & Pencils',
    'Office Files & Folders',
    'A4 & Printing Paper',
    'Geometry & Art Supplies',
    'Adhesives & Tapes',
  ],
  'Food & Beverages': [
    'Cold Beverages & Sodas',
    'Fruit Juices',
    'Mineral Water',
    'Instant Coffee & Tea',
    'Chips & Savories',
    'Chocolates & Confectionery',
  ],
  'General Retail': [
    'Daily Needs',
    'Kitchen Utensils',
    'Plastic Goods',
    'Packaged Goods',
    'Stationery',
    'Personal Items',
  ],
};
