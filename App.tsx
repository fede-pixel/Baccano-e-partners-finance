import React, { useState, useMemo } from 'react';
import { LayoutDashboard, Wallet, TrendingUp } from 'lucide-react';
import TransactionForm from './components/TransactionForm';
import Dashboard from './components/Dashboard';
import AIAdvisor from './components/AIAdvisor';
import { Transaction, Category, TransactionType } from './types';
import { calculateKPIs } from './utils/calculations';
import { CATEGORY_LABELS } from './constants';

const App: React.FC = () => {
  // Initial Sample Data based on user input (October - Today)
  const [transactions, setTransactions] = useState<Transaction[]>([
    // Claudio Campana
    { id: '1', date: '2023-10-15', description: 'Ricavi Commessa Claudio Campana', amount: 26650, type: TransactionType.REVENUE, category: Category.OTHER },
    { id: '2', date: '2023-10-18', description: 'Costi Cantiere Claudio Campana', amount: 21150, type: TransactionType.COST, category: Category.CONSTRUCTION },
    
    // Stefano Luogo
    { id: '3', date: '2023-11-05', description: 'Ricavi Commessa Stefano Luogo', amount: 8000, type: TransactionType.REVENUE, category: Category.OTHER },
    
    // Angelo & Chiara
    { id: '4', date: '2023-11-20', description: 'Ricavi Commessa Angelo & Chiara', amount: 7000, type: TransactionType.REVENUE, category: Category.OTHER },
    { id: '5', date: '2023-11-25', description: 'Costi Materiali Angelo & Chiara', amount: 1100, type: TransactionType.COST, category: Category.CONSTRUCTION },
    
    // Silvia
    { id: '6', date: '2023-12-10', description: 'Ricavi Commessa Silvia', amount: 30500, type: TransactionType.REVENUE, category: Category.OTHER },
    { id: '7', date: '2023-12-15', description: 'Costi Ristrutturazione Silvia', amount: 14895, type: TransactionType.COST, category: Category.CONSTRUCTION },

    // Architetti Esterni
    { id: '8', date: '2023-12-20', description: 'Costi Architetti Esterni', amount: 2000, type: TransactionType.COST, category: Category.HR },
  ]);

  const addTransaction = (t: Transaction) => {
    setTransactions(prev => [...prev, t]);
  };

  const handleBulkUpload = (newTransactions: Transaction[]) => {
    setTransactions(prev => [...prev, ...newTransactions]);
  };

  // Prepare data for AI Advisor (Top 3 Costs)
  const topCosts = useMemo(() => {
    const costMap: Record<string, number> = {};
    transactions
      .filter(t => t.type === TransactionType.COST)
      .forEach(t => {
        const label = CATEGORY_LABELS[t.category];
        costMap[label] = (costMap[label] || 0) + t.amount;
      });
    
    return Object.entries(costMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 3);
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
          <div className="text-sm text-slate-500 hidden sm:block">Controllo di Gestione SRLS</div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Top Section: AI & Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
           <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <LayoutDashboard className="text-indigo-600" />
                <h2 className="text-2xl font-bold text-slate-800">Panoramica Finanziaria</h2>
              </div>
              <Dashboard transactions={transactions} />
           </div>
           
           <div className="space-y-6">
              <AIAdvisor kpis={kpis} topCosts={topCosts} />
              
              {/* Mini List of Recent Transactions */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <TrendingUp size={16} />
                  Ultime Transazioni
                </h3>
                <div className="space-y-3">
                  {transactions.slice(-5).reverse().map(t => (
                    <div key={t.id} className="flex justify-between items-center text-sm pb-2 border-b border-slate-50 last:border-0">
                      <div>
                        <div className="font-medium text-slate-700">{t.description}</div>
                        <div className="text-xs text-slate-400">{new Date(t.date).toLocaleDateString('it-IT')}</div>
                      </div>
                      <div className={`font-mono font-medium ${t.type === TransactionType.REVENUE ? 'text-emerald-600' : 'text-slate-600'}`}>
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
           <TransactionForm onAddTransaction={addTransaction} onBulkUpload={handleBulkUpload} />
        </div>

      </main>
    </div>
  );
};

export default App;