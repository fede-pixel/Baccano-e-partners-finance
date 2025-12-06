import React, { useState, useMemo } from 'react';
import { LayoutDashboard, Wallet, TrendingUp, Building2, BarChart3, Target, ArrowDownUp } from 'lucide-react';
import TransactionForm from './components/TransactionForm';
import Dashboard from './components/Dashboard';
import ProjectDashboard from './components/ProjectDashboard';
import BudgetManager from './components/BudgetManager';
import TransactionList from './components/TransactionList';
import AIAdvisor from './components/AIAdvisor';
import AIChatAssistant from './components/AIChatAssistant';
import { Transaction, Category, TransactionType, ProjectBudget } from './types';
import { calculateKPIs } from './utils/calculations';
import { CATEGORY_LABELS } from './constants';

const App: React.FC = () => {
  // Navigation State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'projects' | 'budget' | 'transactions'>('dashboard');

  // Initial Sample Data updated with 'project' field
  const [transactions, setTransactions] = useState<Transaction[]>([
    // Claudio Campana
    { id: '1', date: '2023-10-15', description: 'Ricavi Commessa Claudio Campana', amount: 26650, type: TransactionType.REVENUE, category: Category.OTHER, project: 'Cantiere Campana' },
    { id: '2', date: '2023-10-18', description: 'Costi Cantiere Claudio Campana', amount: 21150, type: TransactionType.COST, category: Category.CONSTRUCTION, project: 'Cantiere Campana' },
    
    // Stefano Luogo
    { id: '3', date: '2023-11-05', description: 'Ricavi Commessa Stefano Luogo', amount: 8000, type: TransactionType.REVENUE, category: Category.OTHER, project: 'Cantiere Luogo' },
    
    // Angelo & Chiara
    { id: '4', date: '2023-11-20', description: 'Ricavi Commessa Angelo & Chiara', amount: 7000, type: TransactionType.REVENUE, category: Category.OTHER, project: 'Ristrutturazione Angelo & Chiara' },
    { id: '5', date: '2023-11-25', description: 'Costi Materiali Angelo & Chiara', amount: 1100, type: TransactionType.COST, category: Category.CONSTRUCTION, project: 'Ristrutturazione Angelo & Chiara' },
    
    // Silvia
    { id: '6', date: '2023-12-10', description: 'Ricavi Commessa Silvia', amount: 30500, type: TransactionType.REVENUE, category: Category.OTHER, project: 'Progetto Silvia' },
    { id: '7', date: '2023-12-15', description: 'Costi Ristrutturazione Silvia', amount: 14895, type: TransactionType.COST, category: Category.CONSTRUCTION, project: 'Progetto Silvia' },

    // Architetti Esterni (Spesa Generale o specifica)
    { id: '8', date: '2023-12-20', description: 'Costi Architetti Esterni', amount: 2000, type: TransactionType.COST, category: Category.HR, project: 'Spese Generali' },
  ]);

  // Sample Budgets
  const [budgets, setBudgets] = useState<ProjectBudget[]>([
    { projectName: 'Cantiere Campana', budgetRevenue: 28000, budgetCost: 20000 },
    { projectName: 'Cantiere Luogo', budgetRevenue: 12000, budgetCost: 8000 },
    { projectName: 'Progetto Silvia', budgetRevenue: 32000, budgetCost: 18000 }
  ]);

  const addTransaction = (t: Transaction) => {
    setTransactions(prev => [...prev, t]);
  };

  const updateTransaction = (updatedT: Transaction) => {
    setTransactions(prev => prev.map(t => t.id === updatedT.id ? updatedT : t));
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const handleBulkUpload = (newTransactions: Transaction[]) => {
    setTransactions(prev => [...prev, ...newTransactions]);
  };

  const handleUpdateBudget = (newBudget: ProjectBudget) => {
    setBudgets(prev => {
        const existing = prev.findIndex(b => b.projectName === newBudget.projectName);
        if (existing >= 0) {
            const updated = [...prev];
            updated[existing] = newBudget;
            return updated;
        }
        return [...prev, newBudget];
    });
  };

  // Extract unique projects for suggestions
  const existingProjects = useMemo(() => {
    const projects = new Set(transactions.map(t => t.project).filter(p => !!p));
    return Array.from(projects) as string[];
  }, [transactions]);

  const kpis = useMemo(() => calculateKPIs(transactions), [transactions]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">B</div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Baccano & Partners <span className="text-slate-400 font-normal">Finance</span></h1>
          </div>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg overflow-x-auto">
            <button 
                onClick={() => setActiveTab('dashboard')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'dashboard' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <LayoutDashboard size={16} />
                <span className="hidden sm:inline">Azienda</span>
            </button>
            <button 
                onClick={() => setActiveTab('projects')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'projects' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <Building2 size={16} />
                <span className="hidden sm:inline">Cantieri</span>
            </button>
            <button 
                onClick={() => setActiveTab('budget')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'budget' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <Target size={16} />
                <span className="hidden sm:inline">Budget</span>
            </button>
            <button 
                onClick={() => setActiveTab('transactions')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'transactions' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <ArrowDownUp size={16} />
                <span className="hidden sm:inline">Movimenti</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Top Section: AI & Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
           <div className="lg:col-span-2">
              {activeTab === 'dashboard' && (
                <>
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart3 className="text-indigo-600" />
                    <h2 className="text-2xl font-bold text-slate-800">Panoramica Finanziaria</h2>
                  </div>
                  <Dashboard transactions={transactions} />
                </>
              )}
              {activeTab === 'projects' && <ProjectDashboard transactions={transactions} />}
              {activeTab === 'budget' && (
                  <BudgetManager 
                    transactions={transactions} 
                    budgets={budgets} 
                    onUpdateBudget={handleUpdateBudget}
                    existingProjects={existingProjects} 
                  />
              )}
              {activeTab === 'transactions' && (
                <TransactionList 
                    transactions={transactions}
                    onDelete={deleteTransaction}
                    onUpdate={updateTransaction}
                    existingProjects={existingProjects}
                />
              )}
           </div>
           
           <div className="space-y-6">
              {/* AI Advisor now takes full transactions and budgets for Chat Context */}
              <AIAdvisor kpis={kpis} transactions={transactions} budgets={budgets} />
              
              {/* Mini List of Recent Transactions */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <TrendingUp size={16} />
                  Ultimi Movimenti
                </h3>
                <div className="space-y-3">
                  {transactions.slice(-5).reverse().map(t => (
                    <div key={t.id} className="flex justify-between items-center text-sm pb-2 border-b border-slate-50 last:border-0">
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="font-medium text-slate-700 truncate">{t.description}</div>
                        <div className="flex justify-between items-center mt-1">
                             <div className="text-xs text-slate-400">{new Date(t.date).toLocaleDateString('it-IT')}</div>
                             {t.project && <div className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 truncate max-w-[80px]">{t.project}</div>}
                        </div>
                      </div>
                      <div className={`font-mono font-medium whitespace-nowrap ${t.type === TransactionType.REVENUE ? 'text-emerald-600' : 'text-slate-600'}`}>
                        {t.type === TransactionType.REVENUE ? '+' : '-'}€{t.amount.toLocaleString()}
                      </div>
                    </div>
                  ))}
                  {transactions.length === 0 && <p className="text-sm text-slate-400">Nessuna transazione.</p>}
                </div>
              </div>
           </div>
        </div>

        {/* Data Entry Section */}
        <div className="mt-12">
           <div className="flex items-center gap-2 mb-6">
             <Wallet className="text-indigo-600" />
             <h2 className="text-2xl font-bold text-slate-800">Gestione Movimenti</h2>
           </div>
           <TransactionForm 
              onAddTransaction={addTransaction} 
              onBulkUpload={handleBulkUpload} 
              existingProjects={existingProjects} 
           />
        </div>

      </main>

      {/* Floating AI Assistant - Always available */}
      <AIChatAssistant transactions={transactions} kpis={kpis} budgets={budgets} />
    </div>
  );
};

export default App;