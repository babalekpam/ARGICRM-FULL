// Comprehensive currency definitions for the NODE CRM platform
// Includes all African currencies and major global currencies

export interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
  region: string;
}

export const CURRENCIES: CurrencyInfo[] = [
  // Major Global Currencies
  { code: "USD", name: "US Dollar", symbol: "$", region: "North America" },
  { code: "EUR", name: "Euro", symbol: "€", region: "Europe" },
  { code: "GBP", name: "British Pound", symbol: "£", region: "Europe" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥", region: "Asia" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥", region: "Asia" },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$", region: "North America" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$", region: "Oceania" },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF", region: "Europe" },
  { code: "INR", name: "Indian Rupee", symbol: "₹", region: "Asia" },
  { code: "BRL", name: "Brazilian Real", symbol: "R$", region: "South America" },
  
  // African Currencies (All 54 African Countries)
  { code: "DZD", name: "Algerian Dinar", symbol: "د.ج", region: "Africa" },
  { code: "AOA", name: "Angolan Kwanza", symbol: "Kz", region: "Africa" },
  { code: "BWP", name: "Botswana Pula", symbol: "P", region: "Africa" },
  { code: "BIF", name: "Burundian Franc", symbol: "FBu", region: "Africa" },
  { code: "XOF", name: "West African CFA Franc", symbol: "CFA", region: "Africa" }, // Benin, Burkina Faso, Côte d'Ivoire, Guinea-Bissau, Mali, Niger, Senegal, Togo
  { code: "CVE", name: "Cape Verdean Escudo", symbol: "$", region: "Africa" },
  { code: "XAF", name: "Central African CFA Franc", symbol: "FCFA", region: "Africa" }, // Cameroon, Central African Republic, Chad, Republic of the Congo, Equatorial Guinea, Gabon
  { code: "KMF", name: "Comorian Franc", symbol: "CF", region: "Africa" },
  { code: "CDF", name: "Congolese Franc", symbol: "FC", region: "Africa" },
  { code: "DJF", name: "Djiboutian Franc", symbol: "Fdj", region: "Africa" },
  { code: "EGP", name: "Egyptian Pound", symbol: "E£", region: "Africa" },
  { code: "ERN", name: "Eritrean Nakfa", symbol: "Nfk", region: "Africa" },
  { code: "SZL", name: "Eswatini Lilangeni", symbol: "L", region: "Africa" },
  { code: "ETB", name: "Ethiopian Birr", symbol: "Br", region: "Africa" },
  { code: "GMD", name: "Gambian Dalasi", symbol: "D", region: "Africa" },
  { code: "GHS", name: "Ghanaian Cedi", symbol: "₵", region: "Africa" },
  { code: "GNF", name: "Guinean Franc", symbol: "FG", region: "Africa" },
  { code: "KES", name: "Kenyan Shilling", symbol: "KSh", region: "Africa" },
  { code: "LSL", name: "Lesotho Loti", symbol: "L", region: "Africa" },
  { code: "LRD", name: "Liberian Dollar", symbol: "L$", region: "Africa" },
  { code: "LYD", name: "Libyan Dinar", symbol: "ل.د", region: "Africa" },
  { code: "MGA", name: "Malagasy Ariary", symbol: "Ar", region: "Africa" },
  { code: "MWK", name: "Malawian Kwacha", symbol: "MK", region: "Africa" },
  { code: "MRU", name: "Mauritanian Ouguiya", symbol: "UM", region: "Africa" },
  { code: "MUR", name: "Mauritian Rupee", symbol: "₨", region: "Africa" },
  { code: "MAD", name: "Moroccan Dirham", symbol: "د.م.", region: "Africa" },
  { code: "MZN", name: "Mozambican Metical", symbol: "MT", region: "Africa" },
  { code: "NAD", name: "Namibian Dollar", symbol: "N$", region: "Africa" },
  { code: "NGN", name: "Nigerian Naira", symbol: "₦", region: "Africa" },
  { code: "RWF", name: "Rwandan Franc", symbol: "RF", region: "Africa" },
  { code: "STN", name: "São Tomé and Príncipe Dobra", symbol: "Db", region: "Africa" },
  { code: "SCR", name: "Seychellois Rupee", symbol: "₨", region: "Africa" },
  { code: "SLL", name: "Sierra Leonean Leone", symbol: "Le", region: "Africa" },
  { code: "SOS", name: "Somali Shilling", symbol: "S", region: "Africa" },
  { code: "ZAR", name: "South African Rand", symbol: "R", region: "Africa" },
  { code: "SSP", name: "South Sudanese Pound", symbol: "£", region: "Africa" },
  { code: "SDG", name: "Sudanese Pound", symbol: "ج.س.", region: "Africa" },
  { code: "TZS", name: "Tanzanian Shilling", symbol: "TSh", region: "Africa" },
  { code: "TND", name: "Tunisian Dinar", symbol: "د.ت", region: "Africa" },
  { code: "UGX", name: "Ugandan Shilling", symbol: "USh", region: "Africa" },
  { code: "ZMW", name: "Zambian Kwacha", symbol: "ZK", region: "Africa" },
  { code: "ZWL", name: "Zimbabwean Dollar", symbol: "Z$", region: "Africa" },
];

// Helper functions
export const getCurrencyByCode = (code: string): CurrencyInfo | undefined => {
  return CURRENCIES.find(currency => currency.code === code);
};

export const getAfricanCurrencies = (): CurrencyInfo[] => {
  return CURRENCIES.filter(currency => currency.region === "Africa");
};

export const getGlobalCurrencies = (): CurrencyInfo[] => {
  return CURRENCIES.filter(currency => currency.region !== "Africa");
};

export const formatCurrencyDisplay = (currency: CurrencyInfo): string => {
  return `${currency.code} (${currency.symbol}) - ${currency.name}`;
};

// Format currency amount with symbol
export const formatCurrency = (amount: number, currencyCode: string = 'USD'): string => {
  const currency = getCurrencyByCode(currencyCode);
  const symbol = currency ? currency.symbol : '$';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
    currencyDisplay: 'symbol'
  }).format(amount).replace(/[A-Z]{3}/, symbol);
};

// Get currency symbol
export const getCurrencySymbol = (currencyCode: string): string => {
  const currency = getCurrencyByCode(currencyCode);
  return currency ? currency.symbol : '$';
};

// Get available currencies (alias for CURRENCIES for compatibility)
export const getAvailableCurrencies = (): CurrencyInfo[] => {
  return CURRENCIES;
};

// Default exchange rates (approximate, should be updated from real API)
export const DEFAULT_EXCHANGE_RATES: Record<string, number> = {
  USD: 1.0,
  EUR: 0.85,
  GBP: 0.73,
  JPY: 110.0,
  CNY: 7.2,
  CAD: 1.25,
  AUD: 1.35,
  CHF: 0.92,
  INR: 83.0,
  BRL: 5.0,
  
  // African currencies
  DZD: 135.0,
  AOA: 830.0,
  BWP: 13.5,
  BIF: 2800.0,
  CVE: 98.0,
  XAF: 580.0,
  XOF: 580.0,
  KMF: 435.0,
  CDF: 2700.0,
  DJF: 177.0,
  EGP: 30.9,
  ERN: 15.0,
  SZL: 18.5,
  ETB: 55.0,
  GMD: 65.0,
  GHS: 12.0,
  GNF: 8600.0,
  KES: 150.0,
  LSL: 18.5,
  LRD: 185.0,
  LYD: 4.8,
  MGA: 4500.0,
  MWK: 1200.0,
  MRU: 37.0,
  MUR: 45.0,
  MAD: 10.2,
  MZN: 64.0,
  NAD: 18.5,
  NGN: 760.0,
  RWF: 1250.0,
  STN: 23.0,
  SCR: 13.5,
  SLL: 20000.0,
  SOS: 580.0,
  ZAR: 18.5,
  SSP: 1300.0,
  SDG: 600.0,
  TZS: 2500.0,
  TND: 3.1,
  UGX: 3700.0,
  ZMW: 22.0,
  ZWL: 320.0,
};