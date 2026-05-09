// Location → Currency mapping
const LOCATION_CURRENCY_MAP = {
  'USA': { symbol: '$', code: 'USD', locale: 'en-US' },
  'UK': { symbol: '£', code: 'GBP', locale: 'en-GB' },
  'India': { symbol: '₹', code: 'INR', locale: 'en-IN' },
  'Global': { symbol: '$', code: 'USD', locale: 'en-US' },
};

// Default currency
const DEFAULT_CURRENCY = { symbol: '$', code: 'USD', locale: 'en-US' };

/**
 * Extract country from location string (format: "City, State, Country")
 */
export const getCountryFromLocation = (location) => {
  if (!location) return null;
  const parts = location.split(',').map(p => p.trim());
  return parts[parts.length - 1] || null;
};

/**
 * Get currency info from a location string
 */
export const getCurrencyFromLocation = (location) => {
  const country = getCountryFromLocation(location);
  if (!country) return DEFAULT_CURRENCY;
  return LOCATION_CURRENCY_MAP[country] || DEFAULT_CURRENCY;
};

/**
 * Get just the symbol from a location string
 */
export const getCurrencySymbol = (location) => {
  return getCurrencyFromLocation(location).symbol;
};

/**
 * Format a value as currency based on location.
 * Uses compact notation for large values (e.g., $160k, ₹12L).
 */
export const formatCurrency = (value, location) => {
  if (value === undefined || value === null) return '-';
  
  const { symbol, code, locale } = getCurrencyFromLocation(location);

  // India uses Lakhs notation
  if (code === 'INR') {
    if (value >= 10000000) {
      return `${symbol}${(value / 10000000).toFixed(1)}Cr`;
    }
    if (value >= 100000) {
      return `${symbol}${(value / 100000).toFixed(1)}L`;
    }
    if (value >= 1000) {
      return `${symbol}${Math.round(value / 1000)}k`;
    }
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: code,
      maximumFractionDigits: 0,
    }).format(value);
  }

  // Standard Western notation
  if (value >= 1000000) {
    return `${symbol}${(value / 1000000).toFixed(1)}m`;
  }
  if (value >= 1000) {
    return `${symbol}${Math.round(value / 1000)}k`;
  }
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: code,
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatTC = (base, bonus, stock, location) => {
  return formatCurrency(base + bonus + stock, location);
};

export const standardizeLevel = (level) => {
  if (!level) return 'Unknown';
  if (/^L\d+$/.test(level) || /^E\d+$/.test(level) || /^ICT\d+$/.test(level)) {
    return level;
  }
  return level;
};

// Capitalize first letter of each word in a company name
export const capitalizeCompany = (name) => {
  if (!name) return '';
  return name.replace(/\b\w/g, c => c.toUpperCase());
};
