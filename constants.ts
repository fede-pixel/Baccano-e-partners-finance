import { Category } from './types';

export const TAX_RATE_IRES = 0.24; // 24%
export const TAX_RATE_IRAP = 0.039; // 3.9%
export const TAX_RATE_DIVIDEND = 0.26; // 26%

export const CATEGORY_LABELS: Record<Category, string> = {
  [Category.CONSTRUCTION]: 'Costi Cantiere (Diretti)',
  [Category.MARKETING]: 'Marketing & Ads',
  [Category.HR]: 'Dipendenti & Collaboratori',
  [Category.FIXED]: 'Costi Fissi/Struttura',
  [Category.OTHER]: 'Altro'
};

export const CATEGORY_COLORS: Record<Category, string> = {
  [Category.CONSTRUCTION]: '#ef4444', // Red-500
  [Category.MARKETING]: '#f59e0b', // Amber-500
  [Category.HR]: '#3b82f6', // Blue-500
  [Category.FIXED]: '#6366f1', // Indigo-500
  [Category.OTHER]: '#9ca3af' // Gray-400
};