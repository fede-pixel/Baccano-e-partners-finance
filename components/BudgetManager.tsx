import React, { useState, useMemo } from 'react';
import { Target, Save, AlertTriangle, TrendingDown, CheckCircle } from 'lucide-react';
import { Transaction, ProjectBudget, TransactionType } from '../types';
import { formatCurrency } from '../utils/calculations';

interface BudgetManagerProps {
  transactions: Transaction[];
  budgets: ProjectBudget[];
  onUpdateBudget: (budget: ProjectBudget) => void;
  existingProjects: string[];
}

const BudgetManager: React.FC<BudgetManagerProps> = ({ transactions, budgets, onUpdateBudget, existingProjects }) => {
  const [selectedProject, setSelectedProject] = useState('');
  const [budgetRev, setBudgetRev] = useState('');
  const [budgetCost, setBudgetCost] = useState('');

  // Combine Real Data with Budget Data
  const analysis = useMemo(() => {
    return existingProjects.map(projectName => {
      const budget = budgets.find(b => b.projectName === projectName);
      
      const actualRevenue = transactions
        .filter(t => t.project === projectName && t.type === TransactionType.REVENUE)
        .reduce((sum, t) => sum + t.amount, 0);

      const actualCost = transactions
        .filter(t => t.project === projectName && t.type === TransactionType.COST)
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        name: projectName,
        budgetRev: budget?.budgetRevenue || 0,
        budgetCost: budget?.budgetCost || 0,
        actualRevenue,
        actualCost,
        costProgress: budget?.budgetCost ? (actualCost / budget.budgetCost) * 100 : 0,
        revenueProgress: budget?.budgetRevenue ? (actualRevenue / budget.budgetRevenue) * 100 : 0,
        projectedMargin: (budget?.budgetRevenue || 0) - (budget?.budgetCost || 0),
        actualMargin: actualRevenue - actualCost
      };
    }).sort((a, b) => b.actualRevenue - a.actualRevenue); // Sort by active projects
  }, [transactions, budgets, existingProjects]);

  const handleSaveBudget = () => {
    if (!selectedProject || !budgetRev || !budgetCost) return;
    
    onUpdateBudget({
      projectName: selectedProject,
      budgetRevenue: parseFloat(budgetRev),
      budgetCost: parseFloat(budgetCost)
    });
    
    // Optional: clear inputs
    // setBudgetRev('');
    // setBudgetCost('');
  };

  const handleSelectProject = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const pName = e.target.value;
      setSelectedProject(pName);
      const existing = budgets.find(b => b.projectName === pName);
      if (existing) {
          setBudgetRev(existing.budgetRevenue.toString());
          setBudgetCost(existing.budgetCost.toString());
      } else {
          setBudgetRev('');
          setBudgetCost('');
      }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* 1. Set Budget Form */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
         <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
                <Target size={24} />
            </div>
            <div>
                <h2 className="text-lg font-bold text-slate-800">Imposta Budget Cantiere</h2>
                <p className="text-sm text-slate-500">Definisci Preventivo e Costi stimati per monitorare gli scostamenti</p>
            </div>
         </div>

         <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="w-full md:w-1/3">
                <label className="block text-xs font-medium text-slate-500 mb-1">Seleziona Cantiere</label>
                <select 
                    value={selectedProject}
                    onChange={handleSelectProject}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                >
                    <option value="">-- Seleziona --</option>
                    {existingProjects.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
            </div>
            <div className="w-full md:w-1/4">
                <label className="block text-xs font-medium text-slate-500 mb-1">Budget Ricavi (Preventivo)</label>
                <input 
                    type="number" 
                    value={budgetRev}
                    onChange={e => setBudgetRev(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                    placeholder="€"
                />
            </div>
            <div className="w-full md:w-1/4">
                <label className="block text-xs font-medium text-slate-500 mb-1">Budget Costi (Stima)</label>
                <input 
                    type="number" 
                    value={budgetCost}
                    onChange={e => setBudgetCost(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                    placeholder="€"
                />
            </div>
            <button 
                onClick={handleSaveBudget}
                disabled={!selectedProject}
                className="w-full md:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
                <Save size={18} />
                Salva
            </button>
         </div>
      </div>

      {/* 2. Analysis Cards */}
      <div className="grid grid-cols-1 gap-6">
         {analysis.map((item) => {
            const hasBudget = item.budgetRev > 0 || item.budgetCost > 0;
            if (!hasBudget && item.actualRevenue === 0 && item.actualCost === 0) return null;

            return (
                <div key={item.name} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="font-bold text-lg text-slate-800">{item.name}</h3>
                        <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                            item.actualMargin >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                        }`}>
                            Margine Attuale: {formatCurrency(item.actualMargin)}
                        </div>
                    </div>

                    {!hasBudget ? (
                        <div className="p-4 bg-slate-50 rounded-lg text-center text-slate-500 text-sm italic">
                            Nessun budget impostato per questo cantiere.
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Cost Bar */}
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-slate-600 font-medium">Costi Sostenuti vs Budget</span>
                                    <span className="text-slate-400">
                                        {formatCurrency(item.actualCost)} / <span className="text-slate-800 font-semibold">{formatCurrency(item.budgetCost)}</span>
                                    </span>
                                </div>
                                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full rounded-full transition-all duration-1000 ${
                                            item.costProgress > 100 ? 'bg-red-500' : 
                                            item.costProgress > 85 ? 'bg-amber-400' : 'bg-emerald-500'
                                        }`}
                                        style={{ width: `${Math.min(item.costProgress, 100)}%` }}
                                    ></div>
                                </div>
                                {item.costProgress > 100 && (
                                    <div className="mt-1 flex items-center gap-1 text-xs text-red-500 font-medium">
                                        <AlertTriangle size={12} />
                                        Budget Costi superato del {(item.costProgress - 100).toFixed(0)}%!
                                    </div>
                                )}
                            </div>

                            {/* Revenue Bar */}
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-slate-600 font-medium">Ricavi Fatturati vs Preventivo</span>
                                    <span className="text-slate-400">
                                        {formatCurrency(item.actualRevenue)} / <span className="text-slate-800 font-semibold">{formatCurrency(item.budgetRev)}</span>
                                    </span>
                                </div>
                                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-indigo-500 rounded-full transition-all duration-1000"
                                        style={{ width: `${Math.min(item.revenueProgress, 100)}%` }}
                                    ></div>
                                </div>
                            </div>
                            
                            {/* Summary Footer */}
                            <div className="pt-4 border-t border-slate-50 flex gap-4 text-xs text-slate-500">
                                <div className="flex items-center gap-1">
                                    <Target size={14} />
                                    Margine Previsto: <span className="font-semibold text-slate-700">{formatCurrency(item.projectedMargin)}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    {item.actualMargin < item.projectedMargin ? <TrendingDown size={14} className="text-red-400"/> : <CheckCircle size={14} className="text-emerald-400"/>}
                                    Scostamento Margine: <span className={`font-semibold ${item.actualMargin < item.projectedMargin ? 'text-red-500' : 'text-emerald-600'}`}>
                                        {formatCurrency(item.actualMargin - item.projectedMargin)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            );
         })}
      </div>
    </div>
  );
};

export default BudgetManager;