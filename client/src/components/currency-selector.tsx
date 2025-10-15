import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CURRENCIES, formatCurrencyDisplay } from "@shared/currencies";

interface CurrencySelectorProps {
  value?: string;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
  placeholder?: string;
  disabled?: boolean;
  includeSymbols?: boolean;
  africaFirst?: boolean;
  className?: string;
}

export function CurrencySelector({
  value,
  onValueChange,
  defaultValue = "USD",
  placeholder = "Select currency",
  disabled = false,
  includeSymbols = true,
  africaFirst = false,
  className
}: CurrencySelectorProps) {
  const majorCurrencies = [
    { code: "USD", name: "US Dollar", symbol: "$" },
    { code: "EUR", name: "Euro", symbol: "€" },
    { code: "GBP", name: "British Pound", symbol: "£" },
    { code: "CAD", name: "Canadian Dollar", symbol: "C$" },
    { code: "AUD", name: "Australian Dollar", symbol: "A$" },
    { code: "JPY", name: "Japanese Yen", symbol: "¥" },
    { code: "CNY", name: "Chinese Yuan", symbol: "¥" },
    { code: "CHF", name: "Swiss Franc", symbol: "CHF" },
  ];

  const africanCurrencies = CURRENCIES.filter(c => c.region === "Africa");

  const formatCurrency = (currency: any) => {
    if (includeSymbols) {
      return `${currency.code} (${currency.symbol}) - ${currency.name}`;
    }
    return `${currency.code} - ${currency.name}`;
  };

  return (
    <Select 
      value={value} 
      onValueChange={onValueChange} 
      defaultValue={defaultValue}
      disabled={disabled}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {africaFirst && (
          <>
            {/* African Currencies First */}
            {africanCurrencies.map((currency) => (
              <SelectItem key={currency.code} value={currency.code}>
                {formatCurrency(currency)}
              </SelectItem>
            ))}
            {africanCurrencies.length > 0 && (
              <div className="border-t border-gray-200 my-1" />
            )}
          </>
        )}
        
        {/* Major Global Currencies */}
        {majorCurrencies.map((currency) => (
          <SelectItem key={currency.code} value={currency.code}>
            {formatCurrency(currency)}
          </SelectItem>
        ))}
        
        {!africaFirst && africanCurrencies.length > 0 && (
          <>
            <div className="border-t border-gray-200 my-1" />
            {/* African Currencies */}
            {africanCurrencies.map((currency) => (
              <SelectItem key={currency.code} value={currency.code}>
                {formatCurrency(currency)}
              </SelectItem>
            ))}
          </>
        )}
      </SelectContent>
    </Select>
  );
}

// Compact version for smaller spaces
export function CompactCurrencySelector({
  value,
  onValueChange,
  defaultValue = "USD",
  disabled = false,
  className
}: Pick<CurrencySelectorProps, 'value' | 'onValueChange' | 'defaultValue' | 'disabled' | 'className'>) {
  const popularCurrencies = [
    { code: "USD", symbol: "$" },
    { code: "EUR", symbol: "€" },
    { code: "GBP", symbol: "£" },
    { code: "NGN", symbol: "₦" },
    { code: "ZAR", symbol: "R" },
    { code: "EGP", symbol: "E£" },
    { code: "KES", symbol: "KSh" },
    { code: "GHS", symbol: "₵" },
    { code: "MAD", symbol: "د.م." },
  ];

  const africanCurrencies = CURRENCIES.filter(c => 
    c.region === "Africa" && !popularCurrencies.some(p => p.code === c.code)
  );

  return (
    <Select 
      value={value} 
      onValueChange={onValueChange} 
      defaultValue={defaultValue}
      disabled={disabled}
    >
      <SelectTrigger className={className}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {/* Popular Currencies */}
        {popularCurrencies.map((currency) => (
          <SelectItem key={currency.code} value={currency.code}>
            {currency.symbol} {currency.code}
          </SelectItem>
        ))}
        
        {africanCurrencies.length > 0 && (
          <>
            <div className="border-t border-gray-200 my-1" />
            {/* Other African Currencies */}
            {africanCurrencies.map((currency) => (
              <SelectItem key={currency.code} value={currency.code}>
                {currency.symbol} {currency.code}
              </SelectItem>
            ))}
          </>
        )}
      </SelectContent>
    </Select>
  );
}

export default CurrencySelector;