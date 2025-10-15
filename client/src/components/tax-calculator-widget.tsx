import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calculator, DollarSign, MapPin, Percent, Info } from 'lucide-react';

interface TaxCalculationResult {
  subtotal: number;
  taxAmount: number;
  taxRate: number;
  taxRateName: string;
  total: number;
  appliedRules: string[];
  jurisdiction: string;
}

interface TaxCalculatorWidgetProps {
  amount: number;
  onTaxCalculated?: (result: TaxCalculationResult) => void;
  customerAddress?: {
    country?: string;
    state?: string;
    city?: string;
    zipCode?: string;
  };
  autoCalculate?: boolean;
}

export function TaxCalculatorWidget({ 
  amount, 
  onTaxCalculated, 
  customerAddress,
  autoCalculate = false 
}: TaxCalculatorWidgetProps) {
  const [calculation, setCalculation] = useState<TaxCalculationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateTax = async () => {
    if (amount <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    setIsCalculating(true);
    setError(null);

    try {
      const response = await fetch('/api/tax/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          customerAddress,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to calculate tax');
      }

      const result = await response.json();
      setCalculation(result);
      onTaxCalculated?.(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Tax calculation failed');
    } finally {
      setIsCalculating(false);
    }
  };

  useEffect(() => {
    if (autoCalculate && amount > 0) {
      calculateTax();
    }
  }, [amount, customerAddress, autoCalculate]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercentage = (rate: number) => {
    return `${(rate * 100).toFixed(2)}%`;
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          <Calculator className="h-5 w-5 text-blue-600" />
          <CardTitle className="text-lg">Tax Calculator</CardTitle>
        </div>
        {!autoCalculate && (
          <Button 
            onClick={calculateTax} 
            disabled={isCalculating || amount <= 0}
            size="sm"
            className="ml-auto"
          >
            {isCalculating ? 'Calculating...' : 'Calculate Tax'}
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {customerAddress && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <MapPin className="h-4 w-4" />
            <span>
              {[customerAddress.city, customerAddress.state, customerAddress.country]
                .filter(Boolean)
                .join(', ')}
            </span>
          </div>
        )}

        {calculation && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Subtotal:</span>
                  <span className="font-medium">{formatCurrency(calculation.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 flex items-center">
                    <Percent className="h-3 w-3 mr-1" />
                    Tax ({formatPercentage(calculation.taxRate)}):
                  </span>
                  <span className="font-medium">{formatCurrency(calculation.taxAmount)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="font-semibold flex items-center">
                    <DollarSign className="h-4 w-4 mr-1" />
                    Total:
                  </span>
                  <span className="font-bold text-lg">{formatCurrency(calculation.total)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Badge variant="outline" className="w-full justify-center">
                  {calculation.taxRateName}
                </Badge>
                <Badge variant="secondary" className="w-full justify-center text-xs">
                  {calculation.jurisdiction}
                </Badge>
              </div>
            </div>

            {calculation.appliedRules.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center space-x-2 mb-2">
                  <Info className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Applied Rules:</span>
                </div>
                <ul className="text-xs text-blue-800 space-y-1">
                  {calculation.appliedRules.map((rule, index) => (
                    <li key={index}>• {rule}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {!calculation && !error && amount > 0 && (
          <div className="text-center py-4 text-gray-500">
            <Calculator className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">
              {autoCalculate ? 'Calculating tax...' : 'Click "Calculate Tax" to see breakdown'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}