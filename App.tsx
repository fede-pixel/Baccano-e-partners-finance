import React, { useState, useMemo, useEffect } from 'react';
import { LayoutDashboard, Wallet, TrendingUp, Building2, BarChart3, Target, ArrowDownUp, CalendarDays, Settings, X, Save, RotateCcw, Trash } from 'lucide-react';
import TransactionForm from './components/TransactionForm';
import Dashboard from './components/Dashboard';
import ProjectDashboard from './components/ProjectDashboard';
import BudgetManager from './components/BudgetManager';
import TransactionList from './components/TransactionList';
import AIAdvisor from './components/AIAdvisor';
import AIChatAssistant from './components/AIChatAssistant';
import { Transaction, Category, TransactionType, ProjectBudget } from './types';
import { calculateKPIs } from './utils/calculations';

// --- INITIAL SAMPLE DATA (Used only on first load or reset) ---
const INITIAL_TRANSACTIONS: Transaction[] = [
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
];

const INITIAL_BUDGETS: ProjectBudget[] = [
  { projectName: 'Cantiere Campana', budgetRevenue: 28000, budgetCost: 20000 },
  { projectName: 'Cantiere Luogo', budgetRevenue: 12000, budgetCost: 8000 },
  { projectName: 'Progetto Silvia', budgetRevenue: 32000, budgetCost: 18000 }
];

const App: React.FC = () => {
  // Navigation State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'projects' | 'budget' | 'transactions'>('dashboard');
  
  // Date Filter State
  const [timeRange, setTimeRange] = useState<'ALL' | 'THIS_YEAR' | 'LAST_YEAR' | 'THIS_MONTH' | 'LAST_MONTH'>('ALL');

  // Settings / API Key State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [apiKey, setApiKey] = useState('');

  // --- STATE INITIALIZATION WITH PERSISTENCE ---

  // Transactions State
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('baccano_transactions');
      return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
    }
    return INITIAL_TRANSACTIONS;
  });

  // Budgets State
  const [budgets, setBudgets] = useState<ProjectBudget[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('baccano_budgets');
      return saved ? JSON.parse(saved) : INITIAL_BUDGETS;
    }
    return INITIAL_BUDGETS;
  });

  // --- PERSISTENCE EFFECTS ---

  // Load API Key
  useEffect(() => {
    const storedKey = localStorage.getItem('gemini_api_key');
    if (storedKey) setApiKey(storedKey);
  }, []);

  // Save Transactions on Change
  useEffect(() => {
    localStorage.setItem('baccano_transactions', JSON.stringify(transactions));
  }, [transactions]);

  // Save Budgets on Change
  useEffect(() => {
    localStorage.setItem('baccano_budgets', JSON.stringify(budgets));
  }, [budgets]);


  // --- HANDLERS ---

  const handleSaveApiKey = () => {
    localStorage.setItem('gemini_api_key', apiKey);
    setIsSettingsOpen(false);
    window.location.reload(); 
  };

  const handleResetData = () => {
    if (window.confirm('ATTENZIONE: Sei sicuro di voler cancellare tutti i dati inseriti e ripristinare i dati di esempio? Questa azione è irreversibile.')) {
      setTransactions(INITIAL_TRANSACTIONS);
      setBudgets(INITIAL_BUDGETS);
      // LocalStorage updates automatically via useEffect
      setIsSettingsOpen(false);
    }
  };

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

  // Filter Transactions based on Date Range
  const filteredTransactions = useMemo(() => {
    if (timeRange === 'ALL') return transactions;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    return transactions.filter(t => {
      const tDate = new Date(t.date);
      const tYear = tDate.getFullYear();
      const tMonth = tDate.getMonth();

      if (timeRange === 'THIS_YEAR') return tYear === currentYear;
      if (timeRange === 'LAST_YEAR') return tYear === currentYear - 1; 
      
      if (timeRange === 'THIS_MONTH') return tYear === currentYear && tMonth === currentMonth;
      if (timeRange === 'LAST_MONTH') {
        const targetMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const targetYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        return tYear === targetYear && tMonth === targetMonth;
      }
      return true;
    });
  }, [transactions, timeRange]);

  // Extract unique projects
  const existingProjects = useMemo(() => {
    const projects = new Set(transactions.map(t => t.project).filter(p => !!p));
    return Array.from(projects) as string[];
  }, [transactions]);

  // Calculate KPIs
  const kpis = useMemo(() => calculateKPIs(filteredTransactions), [filteredTransactions]);

  
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">B</div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight hidden md:block">Baccano & Partners <span className="text-slate-400 font-normal">Finance</span></h1>
          </div>
          
          <div className="flex items-center gap-4 overflow-x-auto flex-1 justify-end">
            {/* Date Filter */}
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
                <CalendarDays size={16} className="text-slate-500 ml-2" />
                <select 
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value as any)}
                    className="bg-transparent text-sm font-medium text-slate-700 outline-none p-1 pr-2"
                >
                    <option value="ALL">Tutto lo Storico</option>
                    <option value="THIS_YEAR">Anno Corrente ({new Date().getFullYear()})</option>
                    <option value="LAST_YEAR">Anno Scorso ({new Date().getFullYear() - 1})</option>
                    <option value="THIS_MONTH">Questo Mese</option>
                    <option value="LAST_MONTH">Mese Scorso</option>
                </select>
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
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

            {/* Settings Button */}
            <button 
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                title="Impostazioni"
            >
                <Settings size={20} />
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
                  <div className="flex items-center justify-between mb-4">
                     <div className="flex items-center gap-2">
                        <BarChart3 className="text-indigo-600" />
                        <h2 className="text-2xl font-bold text-slate-800">Panoramica {timeRange === 'ALL' ? 'Generale' : 'Periodo Selezionato'}</h2>
                     </div>
                     <span className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                        {filteredTransactions.length} Movimenti
                     </span>
                  </div>
                  <Dashboard transactions={filteredTransactions} />
                </>
              )}
              {activeTab === 'projects' && (
                 <>
                    <div className="mb-4">
                        <h2 className="text-2xl font-bold text-slate-800">Analisi Cantieri</h2>
                        <p className="text-sm text-slate-500">Dati filtrati in base al periodo: {timeRange === 'ALL' ? 'Tutto' : timeRange}</p>
                    </div>
                    <ProjectDashboard transactions={filteredTransactions} />
                 </>
              )}
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
                    transactions={filteredTransactions} 
                    onDelete={deleteTransaction}
                    onUpdate={updateTransaction}
                    existingProjects={existingProjects}
                />
              )}
           </div>
           
           <div className="space-y-6">
              {/* AI Advisor Context */}
              <AIAdvisor kpis={kpis} transactions={filteredTransactions} budgets={budgets} />
              
              {/* Mini List of Recent Transactions (Filtered) */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <TrendingUp size={16} />
                  Ultimi Movimenti (Periodo)
                </h3>
                <div className="space-y-3">
                  {filteredTransactions.slice(-5).reverse().map(t => (
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
                  {filteredTransactions.length === 0 && <p className="text-sm text-slate-400">Nessuna transazione nel periodo.</p>}
                </div>
              </div>
           </div>
        </div>

        {/* Data Entry Section - Always available */}
        <div className="mt-12 pt-8 border-t border-slate-200">
           <div className="flex items-center gap-2 mb-6">
             <Wallet className="text-indigo-600" />
             <h2 className="text-2xl font-bold text-slate-800">Aggiungi Movimento</h2>
           </div>
           <TransactionForm 
              onAddTransaction={addTransaction} 
              onBulkUpload={handleBulkUpload} 
              existingProjects={existingProjects} 
           />
        </div>

      </main>

      {/* Floating AI Assistant - Always available */}
      <AIChatAssistant transactions={filteredTransactions} kpis={kpis} budgets={budgets} />

      {/* API Key Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-[100] backdrop-blur-sm">
           <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md animate-in fade-in zoom-in duration-200">
              <div className="flex justify-between items-center mb-4">
                 <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Settings className="text-indigo-600" />
                    Configurazione
                 </h3>
                 <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-slate-600">
                    <X size={20} />
                 </button>
              </div>
              
              {/* API Key Section */}
              <div className="mb-6">
                 <label className="block text-xs font-medium text-slate-500 mb-1">Google Gemini API Key</label>
                 <div className="relative">
                    <input 
                        type="password" 
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="Lascia vuoto per Modalità Demo"
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-mono"
                    />
                 </div>
                 <div className="mt-2 text-xs text-slate-400">
                    La chiave viene salvata localmente nel browser.
                 </div>
              </div>

              {/* Data Management Section */}
              <div className="mb-6 pt-6 border-t border-slate-100">
                 <h4 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                    <RotateCcw size={14} /> Gestione Dati
                 </h4>
                 <p className="text-xs text-slate-500 mb-3">
                    Hai modificato i dati. L'app li salva automaticamente. Se vuoi ricominciare da zero:
                 </p>
                 <button 
                    onClick={handleResetData}
                    className="w-full py-2 px-4 border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                 >
                    <Trash size={16} />
                    Reset Dati di Fabbrica
                 </button>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                 <button 
                    onClick={() => setIsSettingsOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                 >
                    Chiudi
                 </button>
                 <button 
                    onClick={handleSaveApiKey}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-2"
                 >
                    <Save size={16} />
                    Salva Chiave
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;