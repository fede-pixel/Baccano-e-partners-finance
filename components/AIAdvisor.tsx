import React, { useState } from 'react';
import { Sparkles, RefreshCcw } from 'lucide-react';
import { FinancialKPIs } from '../types';
import { getFinancialAdvice } from '../services/geminiService';

interface AIAdvisorProps {
  kpis: FinancialKPIs;
  topCosts: { name: string; value: number }[];
}

const AIAdvisor: React.FC<AIAdvisorProps> = ({ kpis, topCosts }) => {
  const [advice, setAdvice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerateAdvice = async () => {
    setLoading(true);
    const result = await getFinancialAdvice(kpis, topCosts);
    setAdvice(result);
    setLoading(false);
  };

  return (
    <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 rounded-xl shadow-lg relative overflow-hidden">
      <div className="absolute top-0 right-0 p-8 opacity-10">
        <Sparkles size={120} />
      </div>
      
      <div className="relative z-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Sparkles className="text-yellow-400" />
            AI CFO Advisor
          </h2>
          <button 
            onClick={handleGenerateAdvice}
            disabled={loading}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            {loading ? (
              <RefreshCcw className="animate-spin" size={16} />
            ) : (
              <RefreshCcw size={16} />
            )}
            {advice ? 'Aggiorna Analisi' : 'Genera Analisi'}
          </button>
        </div>

        {!advice && !loading && (
          <p className="text-slate-300">
            Richiedi un'analisi intelligente dei tuoi KPI finanziari. L'IA analizzerà i tuoi costi e ricavi per suggerirti come ottimizzare il bilancio di Baccano & Partners.
          </p>
        )}

        {loading && (
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-white/20 rounded w-3/4"></div>
            <div className="h-4 bg-white/20 rounded w-full"></div>
            <div className="h-4 bg-white/20 rounded w-5/6"></div>
          </div>
        )}

        {advice && !loading && (
          <div className="bg-white/10 p-4 rounded-lg border border-white/10 text-slate-100 leading-relaxed whitespace-pre-line">
            {advice}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIAdvisor;