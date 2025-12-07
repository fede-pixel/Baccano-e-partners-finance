import React, { useState, useMemo, useEffect } from 'react';
import { LayoutDashboard, Wallet, TrendingUp, Building2, BarChart3, Target, ArrowDownUp, CalendarDays, Settings, X, Save, RotateCcw, Trash, Database, Cloud, CloudOff, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import TransactionForm from './components/TransactionForm';
import Dashboard from './components/Dashboard';
import ProjectDashboard from './components/ProjectDashboard';
import BudgetManager from './components/BudgetManager';
import TransactionList from './components/TransactionList';
import AIAdvisor from './components/AIAdvisor';
import AIChatAssistant from './components/AIChatAssistant';
import { Transaction, Category, TransactionType, ProjectBudget } from './types';
import { calculateKPIs } from './utils/calculations';
import { initSupabase, loadFromCloud, saveToCloud, saveToLocal, loadFromLocal, DbConfig, checkConnection } from './services/storageService';

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
  const [timeRange, setTimeRange] = useState<'ALL' | 'THIS_YEAR' | 'LAST_YEAR' | 'THIS_MONTH' | 'LAST_MONTH'>('ALL');

  // Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [apiKey, setApiKey] = useState('');
  
  // Database State
  const [dbConfig, setDbConfig] = useState<DbConfig>({ url: '', key: '' });
  const [isDbConnected, setIsDbConnected] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'saved' | 'error'>('idle');
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  // Data State
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [budgets, setBudgets] = useState<ProjectBudget[]>(INITIAL_BUDGETS);
  const [isInitialized, setIsInitialized] = useState(false);

  // --- INITIALIZATION ---
  useEffect(() => {
    // 1. Load API Key
    const storedKey = localStorage.getItem('gemini_api_key');
    if (storedKey) setApiKey(storedKey);

    // 2. Load DB Config
    const storedDb = localStorage.getItem('supabase_config');
    let hasDb = false;
    if (storedDb) {
      try {
          const parsed = JSON.parse(storedDb);
          setDbConfig(parsed);
          hasDb = initSupabase(parsed);
          setIsDbConnected(hasDb);
      } catch(e) { console.error("Error parsing stored db config"); }
    }

    // 3. Load Data (Strategy: Try Cloud -> Fallback Local -> Fallback Initial)
    const loadData = async () => {
      let loadedTransactions = null;
      let loadedBudgets = null;

      if (hasDb) {
        setSyncStatus('syncing');
        const cloudTrans = await loadFromCloud('transactions');
        const cloudBudgets = await loadFromCloud('budgets');
        
        if (cloudTrans) loadedTransactions = cloudTrans;
        if (cloudBudgets) loadedBudgets = cloudBudgets;
        
        // If we tried cloud and got nothing, maybe connection error?
        // We will assume success if we didn't crash, but status update happens after.
        setSyncStatus(cloudTrans ? 'saved' : 'idle');
      }

      // If no cloud data, try local
      if (!loadedTransactions) {
        loadedTransactions = loadFromLocal('baccano_transactions');
      }
      if (!loadedBudgets) {
        loadedBudgets = loadFromLocal('baccano_budgets');
      }

      // Set State
      setTransactions(loadedTransactions || INITIAL_TRANSACTIONS);
      setBudgets(loadedBudgets || INITIAL_BUDGETS);
      setIsInitialized(true);
    };

    loadData();
  }, []);

  // --- PERSISTENCE ---

  // Save Transactions
  useEffect(() => {
    if (!isInitialized) return;

    // Local
    saveToLocal('baccano_transactions', transactions);

    // Cloud (Debounced)
    if (isDbConnected) {
      setSyncStatus('syncing');
      const timer = setTimeout(() => {
        saveToCloud('transactions', transactions).then(ok => {
            setSyncStatus(ok ? 'saved' : 'error');
            if (ok) setTimeout(() => setSyncStatus('idle'), 2000);
        });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [transactions, isDbConnected, isInitialized]);

  // Save Budgets
  useEffect(() => {
    if (!isInitialized) return;

    saveToLocal('baccano_budgets', budgets);

    if (isDbConnected) {
      setSyncStatus('syncing');
      const timer = setTimeout(() => {
        saveToCloud('budgets', budgets).then(ok => {
            setSyncStatus(ok ? 'saved' : 'error');
            if (ok) setTimeout(() => setSyncStatus('idle'), 2000);
        });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [budgets, isDbConnected, isInitialized]);

  // --- HANDLERS ---

  const handleSaveSettings = async () => {
    localStorage.setItem('gemini_api_key', apiKey);
    
    // Save DB Config
    if (dbConfig.url && dbConfig.key) {
        setIsTestingConnection(true);
        // Initialize client first
        initSupabase(dbConfig);
        
        // Test REAL connection
        const isConnected = await checkConnection();
        setIsTestingConnection(false);

        if (isConnected) {
            localStorage.setItem('supabase_config', JSON.stringify(dbConfig));
            setIsDbConnected(true);
            alert('Database collegato con successo! I dati verranno sincronizzati.');
            
            // Trigger initial save to ensure cloud has latest
            saveToCloud('transactions', transactions);
            saveToCloud('budgets', budgets);
            setIsSettingsOpen(false);
        } else {
            setIsDbConnected(false);
            initSupabase(null); // Reset client
            alert('Errore connessione database. Verifica URL, API Key e di aver eseguito lo script SQL.');
        }
    } else {
        localStorage.removeItem('supabase_config');
        setIsDbConnected(false);
        initSupabase(null);
        setIsSettingsOpen(false);
    }
    
    // We don't force reload unless necessary, state updates should handle it
  };

  const handleResetData = () => {
    if (window.confirm('ATTENZIONE: Cancellerai TUTTI i dati (Locali e Database). Azione irreversibile.')) {
      setTransactions(INITIAL_TRANSACTIONS);
      setBudgets(INITIAL_BUDGETS);
      setIsSettingsOpen(false);
      // Effects will trigger save to cloud with initial data
    }
  };

  const addTransaction = (t: Transaction) => setTransactions(prev => [...prev, t]);
  const updateTransaction = (updatedT: Transaction) => setTransactions(prev => prev.map(t => t.id === updatedT.id ? updatedT : t));
  const deleteTransaction = (id: string) => setTransactions(prev => prev.filter(t => t.id !== id));
  const handleBulkUpload = (newTransactions: Transaction[]) => setTransactions(prev => [...prev, ...newTransactions]);
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

  // Logic
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

  const existingProjects = useMemo(() => {
    const projects = new Set(transactions.map(t => t.project).filter(p => !!p));
    return Array.from(projects) as string[];
  }, [transactions]);

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
             {/* Sync Indicator */}
             <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg border transition-colors ${
                 syncStatus === 'error' ? 'bg-red-50 border-red-200 text-red-600' : 'bg-slate-50 border-slate-100'
             }`} title={isDbConnected ? "Database Connesso" : "Salvataggio Locale"}>
                {isDbConnected ? (
                    <>
                        {syncStatus === 'syncing' ? <Cloud className="text-indigo-500 animate-pulse" size={14} /> : 
                         syncStatus === 'saved' ? <CheckCircle2 className="text-emerald-500" size={14} /> :
                         syncStatus === 'error' ? <AlertTriangle className="text-red-500" size={14} /> :
                         <Cloud className="text-indigo-500" size={14} />
                        }
                        <span className={`hidden sm:inline ${syncStatus === 'error' ? 'text-red-600' : 'text-indigo-600'}`}>
                            {syncStatus === 'error' ? 'Errore Sync' : 'Cloud'}
                        </span>
                    </>
                ) : (
                    <>
                        <CloudOff className="text-slate-400" size={14} />
                        <span className="hidden sm:inline text-slate-400">Locale</span>
                    </>
                )}
             </div>

            {/* Date Filter */}
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
                <CalendarDays size={16} className="text-slate-500 ml-2" />
                <select 
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value as any)}
                    className="bg-transparent text-sm font-medium text-slate-700 outline-none p-1 pr-2"
                >
                    <option value="ALL">Tutto lo Storico</option>
                    <option value="THIS_YEAR">Anno Corrente</option>
                    <option value="LAST_YEAR">Anno Scorso</option>
                    <option value="THIS_MONTH">Questo Mese</option>
                </select>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                <button onClick={() => setActiveTab('dashboard')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'dashboard' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                    <LayoutDashboard size={16} /><span className="hidden sm:inline">Azienda</span>
                </button>
                <button onClick={() => setActiveTab('projects')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'projects' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                    <Building2 size={16} /><span className="hidden sm:inline">Cantieri</span>
                </button>
                <button onClick={() => setActiveTab('budget')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'budget' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                    <Target size={16} /><span className="hidden sm:inline">Budget</span>
                </button>
                <button onClick={() => setActiveTab('transactions')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'transactions' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                    <ArrowDownUp size={16} /><span className="hidden sm:inline">Movimenti</span>
                </button>
            </div>

            {/* Settings Button */}
            <button 
                onClick={() => setIsSettingsOpen(true)}
                className={`p-2 rounded-lg transition-colors ${isSettingsOpen ? 'bg-indigo-100 text-indigo-600' : 'text-slate-500 hover:text-indigo-600 hover:bg-indigo-50'}`}
                title="Impostazioni"
            >
                <Settings size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
           <div className="lg:col-span-2">
              {activeTab === 'dashboard' && <Dashboard transactions={filteredTransactions} />}
              {activeTab === 'projects' && <ProjectDashboard transactions={filteredTransactions} />}
              {activeTab === 'budget' && <BudgetManager transactions={transactions} budgets={budgets} onUpdateBudget={handleUpdateBudget} existingProjects={existingProjects} />}
              {activeTab === 'transactions' && <TransactionList transactions={filteredTransactions} onDelete={deleteTransaction} onUpdate={updateTransaction} existingProjects={existingProjects} />}
           </div>
           <div className="space-y-6">
              <AIAdvisor kpis={kpis} transactions={filteredTransactions} budgets={budgets} />
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <TrendingUp size={16} /> Ultimi Movimenti
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
                </div>
              </div>
           </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-200">
           <div className="flex items-center gap-2 mb-6">
             <Wallet className="text-indigo-600" />
             <h2 className="text-2xl font-bold text-slate-800">Aggiungi Movimento</h2>
           </div>
           <TransactionForm onAddTransaction={addTransaction} onBulkUpload={handleBulkUpload} existingProjects={existingProjects} />
        </div>
      </main>

      <AIChatAssistant transactions={filteredTransactions} kpis={kpis} budgets={budgets} />

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-[100] backdrop-blur-sm">
           <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg animate-in fade-in zoom-in duration-200 overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Settings className="text-indigo-600" /> Impostazioni & Database
                 </h3>
                 <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-slate-600">
                    <X size={20} />
                 </button>
              </div>
              
              <div className="space-y-6">
                 {/* AI Key */}
                 <div className="p-4 bg-indigo-50/50 rounded-lg border border-indigo-100">
                     <h4 className="text-sm font-bold text-indigo-900 mb-2">1. Intelligenza Artificiale (Google Gemini)</h4>
                     <label className="block text-xs font-medium text-slate-500 mb-1">API Key</label>
                     <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="AIzaSy..." className="w-full p-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-mono" />
                     <p className="text-[10px] text-slate-400 mt-1">Lascia vuoto per usare la modalità demo.</p>
                 </div>

                 {/* DB Sync */}
                 <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                     <div className="flex items-center gap-2 mb-2">
                         <Database className="text-slate-700" size={16} />
                         <h4 className="text-sm font-bold text-slate-800">2. Database Cloud (Supabase)</h4>
                     </div>
                     <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                        Per salvare i dati permanentemente (anche se cancelli la cache), collegati a un database Supabase.
                     </p>
                     
                     <div className="space-y-3">
                         <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Project URL</label>
                            <input type="text" value={dbConfig.url} onChange={(e) => setDbConfig({...dbConfig, url: e.target.value})} placeholder="https://xyz.supabase.co" className="w-full p-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-mono" />
                         </div>
                         <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Anon / API Key</label>
                            <input type="password" value={dbConfig.key} onChange={(e) => setDbConfig({...dbConfig, key: e.target.value})} placeholder="eyJhbGciOiJIUzI1NiIsIn..." className="w-full p-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-mono" />
                         </div>
                     </div>
                     
                     <div className="mt-4 text-[10px] text-slate-500 bg-white p-2 rounded border border-slate-200">
                        <strong>Setup Rapido:</strong> Crea progetto su Supabase.com, poi in SQL Editor esegui:<br/>
                        <code className="block mt-1 bg-slate-100 p-1 rounded text-indigo-600 break-all">
                           create table if not exists app_data (key text primary key, value jsonb, updated_at timestamptz default now()); alter table app_data enable row level security; create policy "Public" on app_data for all using (true);
                        </code>
                     </div>
                 </div>

                 {/* Reset */}
                 <div className="pt-4 border-t border-slate-100">
                     <button onClick={handleResetData} className="w-full py-2 px-4 border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors">
                        <Trash size={16} /> Reset Totale Dati
                     </button>
                 </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                 <button onClick={() => setIsSettingsOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg">Annulla</button>
                 <button 
                    onClick={handleSaveSettings} 
                    disabled={isTestingConnection}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-2 disabled:opacity-70"
                 >
                    {isTestingConnection ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} 
                    {isTestingConnection ? 'Verifica...' : 'Salva Configurazione'}
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;