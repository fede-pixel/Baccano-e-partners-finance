import React, { useState, useRef } from 'react';
import { Plus, Upload, FileText, Calendar, HardHat } from 'lucide-react';
import { Transaction, TransactionType, Category } from '../types';
import { CATEGORY_LABELS } from '../constants';

interface TransactionFormProps {
  onAddTransaction: (t: Transaction) => void;
  onBulkUpload: (t: Transaction[]) => void;
  existingProjects: string[];
}

const TransactionForm: React.FC<TransactionFormProps> = ({ onAddTransaction, onBulkUpload, existingProjects }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<TransactionType>(TransactionType.COST);
  const [category, setCategory] = useState<Category>(Category.CONSTRUCTION);
  const [project, setProject] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description || !date) return;

    const newTransaction: Transaction = {
      id: Date.now().toString(),
      date: new Date(date).toISOString(),
      amount: parseFloat(amount),
      description,
      type,
      category: type === TransactionType.REVENUE ? Category.OTHER : category,
      project: project.trim() || undefined
    };

    onAddTransaction(newTransaction);
    setAmount('');
    setDescription('');
    // We keep date and project for easier consecutive entry
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');
      const transactions: Transaction[] = [];
      
      lines.forEach((line, index) => {
        if (index === 0) return; // Skip header
        const cols = line.split(',');
        if (cols.length >= 3) {
           const typeStr = cols[3]?.trim().toUpperCase();
           const catStr = cols[4]?.trim().toUpperCase();
           const projStr = cols[5]?.trim(); // Assuming column 5 is project
           
           let tType = TransactionType.COST;
           if (typeStr === 'REVENUE' || typeStr === 'RICAVO') tType = TransactionType.REVENUE;

           let tCat = Category.OTHER;
           const validCats = Object.values(Category);
           if (validCats.includes(catStr as Category)) {
             tCat = catStr as Category;
           }

           if (cols[2] && !isNaN(parseFloat(cols[2]))) {
             transactions.push({
               id: `csv-${Date.now()}-${index}`,
               date: cols[0] || new Date().toISOString(),
               description: cols[1] || 'Imported',
               amount: parseFloat(cols[2]),
               type: tType,
               category: tCat,
               project: projStr || undefined
             });
           }
        }
      });
      onBulkUpload(transactions);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <FileText size={20} className="text-indigo-600"/>
          Inserimento Dati
        </h2>
        
        <div className="flex items-center gap-2">
          <input 
            type="file" 
            accept=".csv" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <Upload size={16} />
            Carica CSV
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-slate-500 mb-1">Data</label>
          <input 
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-slate-500 mb-1">Tipo</label>
          <select 
            value={type}
            onChange={(e) => setType(e.target.value as TransactionType)}
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
          >
            <option value={TransactionType.COST}>Costo</option>
            <option value={TransactionType.REVENUE}>Ricavo</option>
          </select>
        </div>

        <div className="md:col-span-3">
          <label className="block text-xs font-medium text-slate-500 mb-1 flex items-center gap-1">
            <HardHat size={12}/> Cantiere / Progetto
          </label>
          <input 
            list="projects-list"
            type="text"
            value={project}
            onChange={(e) => setProject(e.target.value)}
            placeholder="Generale (nessuno)"
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
          />
          <datalist id="projects-list">
            {existingProjects.map(p => <option key={p} value={p} />)}
          </datalist>
        </div>

        {type === TransactionType.COST && (
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-500 mb-1">Categoria</label>
            <select 
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
            >
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        )}

        <div className={type === TransactionType.REVENUE ? "md:col-span-3" : "md:col-span-3"}>
          <label className="block text-xs font-medium text-slate-500 mb-1">Descrizione</label>
          <input 
            type="text" 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Es. Acconto lavori..."
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-slate-500 mb-1">Importo (€)</label>
          <input 
            type="number" 
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-mono"
          />
        </div>

        <div className="md:col-span-12 lg:col-span-12 flex justify-end">
            <button 
              type="submit"
              className="flex justify-center items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors text-sm"
            >
              <Plus size={18} />
              Aggiungi Transazione
            </button>
        </div>
      </form>
    </div>
  );
};

export default TransactionForm;