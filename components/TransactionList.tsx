import React, { useState, useMemo } from 'react';
import { Search, Trash2, Edit2, Save, X, ArrowDownUp } from 'lucide-react';
import { Transaction, TransactionType, Category } from '../types';
import { CATEGORY_LABELS } from '../constants';
import { formatCurrency } from '../utils/calculations';

interface TransactionListProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  onUpdate: (t: Transaction) => void;
  existingProjects: string[];
}

const TransactionList: React.FC<TransactionListProps> = ({ transactions, onDelete, onUpdate, existingProjects }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Transaction>>({});

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => 
      t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.project?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      CATEGORY_LABELS[t.category].toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, searchTerm]);

  const handleEditClick = (t: Transaction) => {
    setEditingId(t.id);
    setEditForm({ ...t });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleSaveEdit = () => {
    if (editingId && editForm.description && editForm.amount) {
      onUpdate(editForm as Transaction);
      setEditingId(null);
      setEditForm({});
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Sei sicuro di voler eliminare questa transazione? Questa azione influirà sui KPI.')) {
        onDelete(id);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in duration-500">
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4">
        <h3 className="font-semibold text-slate-700 flex items-center gap-2">
            <ArrowDownUp size={18} />
            Elenco Movimenti
        </h3>
        <div className="relative w-full sm:w-64">
           <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
           <input 
             type="text" 
             placeholder="Cerca spesa, ricavo o cantiere..." 
             value={searchTerm}
             onChange={e => setSearchTerm(e.target.value)}
             className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
           />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-slate-600">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50/50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3">Descrizione</th>
              <th className="px-4 py-3">Cantiere</th>
              <th className="px-4 py-3">Categoria</th>
              <th className="px-4 py-3 text-right">Importo</th>
              <th className="px-4 py-3 text-center">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.map(t => {
              const isEditing = editingId === t.id;
              
              return (
                <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  {/* DATE */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    {isEditing ? (
                       <input 
                         type="date" 
                         value={editForm.date ? new Date(editForm.date).toISOString().split('T')[0] : ''}
                         onChange={e => setEditForm({...editForm, date: new Date(e.target.value).toISOString()})}
                         className="w-full p-1 border border-slate-200 rounded"
                       />
                    ) : (
                       new Date(t.date).toLocaleDateString('it-IT')
                    )}
                  </td>

                  {/* DESCRIPTION */}
                  <td className="px-4 py-3 font-medium text-slate-900 max-w-xs truncate">
                    {isEditing ? (
                       <input 
                         type="text" 
                         value={editForm.description}
                         onChange={e => setEditForm({...editForm, description: e.target.value})}
                         className="w-full p-1 border border-slate-200 rounded"
                       />
                    ) : (
                       t.description
                    )}
                  </td>

                  {/* PROJECT */}
                  <td className="px-4 py-3 max-w-[150px] truncate">
                     {isEditing ? (
                       <input 
                         list="projects-list-edit"
                         value={editForm.project || ''}
                         onChange={e => setEditForm({...editForm, project: e.target.value})}
                         className="w-full p-1 border border-slate-200 rounded"
                         placeholder="Generale"
                       />
                    ) : (
                       t.project ? <span className="bg-slate-100 px-2 py-0.5 rounded text-xs text-slate-600">{t.project}</span> : <span className="text-slate-400 italic">Generale</span>
                    )}
                    {isEditing && (
                        <datalist id="projects-list-edit">
                            {existingProjects.map(p => <option key={p} value={p} />)}
                        </datalist>
                    )}
                  </td>

                  {/* CATEGORY & TYPE */}
                  <td className="px-4 py-3">
                     {isEditing ? (
                       <select
                         value={editForm.category}
                         onChange={e => setEditForm({...editForm, category: e.target.value as Category})}
                         className="w-full p-1 border border-slate-200 rounded text-xs"
                       >
                          {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                             <option key={k} value={k}>{v}</option>
                          ))}
                       </select>
                     ) : (
                       <div className="flex flex-col">
                           <span>{CATEGORY_LABELS[t.category]}</span>
                           <span className="text-[10px] uppercase tracking-wider text-slate-400">{t.type}</span>
                       </div>
                     )}
                  </td>

                  {/* AMOUNT */}
                  <td className="px-4 py-3 text-right font-mono font-medium">
                    {isEditing ? (
                       <input 
                         type="number" 
                         step="0.01"
                         value={editForm.amount}
                         onChange={e => setEditForm({...editForm, amount: parseFloat(e.target.value)})}
                         className="w-24 p-1 border border-slate-200 rounded text-right"
                       />
                    ) : (
                       <span className={t.type === TransactionType.REVENUE ? 'text-emerald-600' : 'text-slate-600'}>
                         {t.type === TransactionType.REVENUE ? '+' : '-'} {formatCurrency(t.amount)}
                       </span>
                    )}
                  </td>

                  {/* ACTIONS */}
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                        {isEditing ? (
                            <>
                                <button onClick={handleSaveEdit} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded transition-colors" title="Salva">
                                    <Save size={16} />
                                </button>
                                <button onClick={handleCancelEdit} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded transition-colors" title="Annulla">
                                    <X size={16} />
                                </button>
                            </>
                        ) : (
                            <>
                                <button onClick={() => handleEditClick(t)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors" title="Modifica">
                                    <Edit2 size={16} />
                                </button>
                                <button onClick={() => handleDelete(t.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Elimina">
                                    <Trash2 size={16} />
                                </button>
                            </>
                        )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredTransactions.length === 0 && (
                <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400 italic">
                        Nessun movimento trovato.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionList;