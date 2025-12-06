import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Transaction, TransactionType, Category, KPIInfo } from '../types';
import { calculateKPIs } from '../utils/calculations';
import KPICard from './KPICard';
import { CATEGORY_COLORS, CATEGORY_LABELS } from '../constants';

interface DashboardProps {
  transactions: Transaction[];
}

const Dashboard: React.FC<DashboardProps> = ({ transactions }) => {
  const kpis = useMemo(() => calculateKPIs(transactions), [transactions]);

  const kpiDefinitions: KPIInfo[] = [
    {
      label: 'Fatturato Totale',
      value: kpis.revenue,
      currency: true,
      description: 'Valore totale delle vendite e dei servizi prestati (Ricavi). Indica il volume d\'affari.',
      color: 'text-emerald-600'
    },
    {
      label: 'Margine Op. Lordo (EBITDA)',
      value: kpis.ebitda,
      currency: true,
      description: 'Utile prima di interessi, tasse, deprezzamenti e ammortamenti. Misura la redditività operativa pura.',
      color: kpis.ebitda >= 0 ? 'text-indigo-600' : 'text-red-600'
    },
    {
      label: 'Margine Op. Netto (MON)',
      value: kpis.ebit,
      currency: true,
      description: 'Risultato operativo dopo gli ammortamenti (qui stimati a 0 per semplicità). Indica il reddito generato dalla gestione caratteristica.',
    },
    {
      label: 'Utile Netto (Stima)',
      value: kpis.netIncome,
      currency: true,
      description: 'Guadagno finale dopo le tasse (IRES 24% + IRAP 3.9% stimate). Ciò che rimane effettivamente in azienda.',
      color: kpis.netIncome >= 0 ? 'text-emerald-600' : 'text-red-600'
    },
    {
      label: 'Dividendi Prelevabili',
      value: kpis.dividends,
      currency: true,
      description: 'Importo netto che i soci possono prelevare dopo aver pagato la ritenuta del 26%.',
    },
    {
      label: 'Tasse Totali (Stima)',
      value: kpis.taxes + kpis.dividendTax,
      currency: true,
      description: 'Somma di IRES, IRAP e Tasse sui Dividendi (se distribuiti interamente).',
      color: 'text-amber-600'
    }
  ];

  // Prepare Chart Data
  const costData = useMemo(() => {
    const costsByCategory: Record<string, number> = {};
    transactions.filter(t => t.type === TransactionType.COST).forEach(t => {
      costsByCategory[t.category] = (costsByCategory[t.category] || 0) + t.amount;
    });

    return Object.keys(costsByCategory).map(key => ({
      name: CATEGORY_LABELS[key as Category],
      value: costsByCategory[key],
      color: CATEGORY_COLORS[key as Category]
    })).sort((a, b) => b.value - a.value);
  }, [transactions]);

  const revenueVsCostData = [
    { name: 'Ricavi', amount: kpis.revenue },
    { name: 'Costi Totali', amount: kpis.cogs + kpis.opex },
    { name: 'Utile Lordo', amount: kpis.ebitda }
  ];

  return (
    <div className="space-y-8">
      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {kpiDefinitions.map((kpi, idx) => (
          <KPICard key={idx} data={kpi} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Cost Breakdown */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">Analisi Costi per Categoria</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={costData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {costData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(value: number) => `€${value.toLocaleString()}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue vs Costs */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">Performance Finanziaria</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueVsCostData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12}} />
                <RechartsTooltip formatter={(value: number) => `€${value.toLocaleString()}`} />
                <Bar dataKey="amount" fill="#4f46e5" radius={[0, 4, 4, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;