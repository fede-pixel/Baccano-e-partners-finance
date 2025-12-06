export enum TransactionType {
  REVENUE = 'REVENUE',
  COST = 'COST'
}

export enum Category {
  CONSTRUCTION = 'CANTIERI', // Direct Costs (COGS)
  MARKETING = 'MARKETING',
  HR = 'PERSONALE',
  FIXED = 'FISSI',
  OTHER = 'ALTRO'
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: Category;
  project?: string; // New field for identifying the construction site/project
}

export interface ProjectBudget {
  projectName: string;
  budgetRevenue: number; // Preventivo al cliente
  budgetCost: number; // Stima costi totali
}

export interface FinancialKPIs {
  revenue: number;
  cogs: number; // Cost of Goods Sold (Costi diretti cantiere)
  grossMargin: number; // Margine Industriale
  opex: number; // Operating Expenses (Marketing, HR, Fixed)
  ebitda: number; // MOL
  ebit: number; // MON (Assuming simple depreciation for this demo)
  taxes: number; // IRES + IRAP
  netIncome: number; // Utile Netto
  dividends: number; // Distributable
  dividendTax: number; // 26%
}

export interface KPIInfo {
  label: string;
  value: number;
  currency?: boolean;
  percentage?: boolean;
  description: string;
  color?: string;
}

export interface ProjectStats {
  name: string;
  revenue: number;
  costs: number;
  margin: number;
  marginPercent: number;
}