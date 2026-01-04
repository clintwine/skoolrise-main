import React, { createContext, useContext } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

const CURRENCIES = {
  USD: { symbol: '$', name: 'US Dollar' },
  EUR: { symbol: '€', name: 'Euro' },
  GBP: { symbol: '£', name: 'British Pound' },
  NGN: { symbol: '₦', name: 'Nigerian Naira' },
  KES: { symbol: 'KSh', name: 'Kenyan Shilling' },
  ZAR: { symbol: 'R', name: 'South African Rand' },
  GHS: { symbol: 'GH₵', name: 'Ghanaian Cedi' },
  INR: { symbol: '₹', name: 'Indian Rupee' },
  CAD: { symbol: 'C$', name: 'Canadian Dollar' },
  AUD: { symbol: 'A$', name: 'Australian Dollar' },
};

const CurrencyContext = createContext({
  currency: 'USD',
  symbol: '$',
  formatAmount: (amount) => `$${(amount || 0).toLocaleString()}`,
});

export function CurrencyProvider({ children }) {
  const { data: school } = useQuery({
    queryKey: ['school-currency'],
    queryFn: async () => {
      const schools = await base44.entities.School.list();
      return schools[0];
    },
    staleTime: 300000,
  });

  const currency = school?.currency || 'USD';
  const currencyData = CURRENCIES[currency] || CURRENCIES.USD;

  const formatAmount = (amount) => {
    const num = parseFloat(amount) || 0;
    return `${currencyData.symbol}${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, symbol: currencyData.symbol, formatAmount }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}

export { CURRENCIES };