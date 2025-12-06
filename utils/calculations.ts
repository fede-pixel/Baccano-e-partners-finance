import { Transaction, TransactionType, Category, FinancialKPIs } from '../types';
import { TAX_RATE_IRES, TAX_RATE_IRAP, TAX_RATE_DIVIDEND } from '../constants';

export const calculateKPIs = (transactions: Transaction[]): FinancialKPIs => {
  let revenue = 0;
  let cogs = 0; // Cost of Goods Sold (Construction costs)
  let opex = 0; // Operating Expenses (Marketing, HR, Fixed, Other)

  transactions.forEach(t => {
    if (t.type === TransactionType.REVENUE) {
      revenue += t.amount;
    } else {
      if (t.category === Category.CONSTRUCTION) {
        cogs += t.amount;
      } else {
        opex += t.amount;
      }
    }
  });

  const grossMargin = revenue - cogs;
  const ebitda = grossMargin - opex; // Margine Operativo Lordo

  // For simplicity in this tool, we assume Amortization/Depreciation is 0 or manual adjustment
  // In a full tool, you'd add a Depreciation entry type.
  // We will treat EBITDA ~= EBIT for this simplified view unless specific "Depreciation" categories exist.
  const amortization = 0; 
  const ebit = ebitda - amortization; // Margine Operativo Netto

  // Italian Corporate Taxes
  // Simplified calculation: Taxes applied on Positive EBT. 
  const taxableBase = Math.max(0, ebit);
  const taxes = (taxableBase * TAX_RATE_IRES) + (taxableBase * TAX_RATE_IRAP);

  const netIncome = ebit - taxes;
  
  // Dividends calculation (on positive Net Income)
  const distributableIncome = Math.max(0, netIncome);
  const dividendTax = distributableIncome * TAX_RATE_DIVIDEND;
  const dividends = distributableIncome - dividendTax;

  return {
    revenue,
    cogs,
    grossMargin,
    opex,
    ebitda,
    ebit,
    taxes,
    netIncome,
    dividends,
    dividendTax
  };
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(amount);
};