import React, { useMemo, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, Legend 
} from 'recharts';
import { Transaction, TransactionType, ProjectStats, Category } from '../types';
import { formatCurrency } from '../utils/calculations';
import { CATEGORY_COLORS, CATEGORY_LABELS } from '../constants';
import { Briefcase, AlertCircle, CheckCircle2 } from 'lucide-react';

interface ProjectDashboardProps {
  transactions: Transaction[];
}

const ProjectDashboard: React.FC<ProjectDashboardProps> = ({ transactions }) => {
  const [selectedProject, setSelectedProject] = useState<string>('all');

  // 1. Extract Projects and Calculate Stats per Project
  const projectStats = useMemo(() => {
    const statsMap: Record<string, ProjectStats> = {};

    transactions.forEach(t => {
      // Use 'Generale' for transactions without a project
      const pName = t.project || 'Spese Generali / Altro';
      
      if (!statsMap[pName]) {
        statsMap[pName] = { name: pName, revenue: 0, costs: 0, margin: 0, marginPercent: 0 };
      }

      if (t.type === TransactionType.REVENUE) {
        statsMap[pName].revenue += t.amount;
      } else {
        statsMap[pName].costs += t.amount;
      }
    });

    // Calculate margins
    Object.values(statsMap).forEach(stat => {
      stat.margin = stat.revenue - stat.costs;
      stat.marginPercent = stat.revenue > 0 ? (stat.margin / stat.revenue) * 100 : 0;
    });

    return Object.values(statsMap).sort((a, b) => b.revenue - a.revenue);
  }, [transactions]);

  const projects = projectStats.filter(p => p.name !== 'Spese Generali / Altro').map(p => p.name);
  
  // 2. Filter data for Selected Project
  const selectedStats = selectedProject === 'all' 
    ? null 
    : projectStats.find(p => p.name === selectedProject);

  const filteredTransactions = useMemo(() => {
    if (selectedProject === 'all') return transactions;
    return transactions.filter(t => (t.project || 'Spese Generali / Altro') === selectedProject);
  }, [selectedProject, transactions]);

  // Chart Data: Cost Breakdown for selected project
  const costBreakdownData = useMemo(() => {
    const breakdown: Record<string, number> = {};
    filteredTransactions
      .filter(t => t.type === TransactionType.COST)
      .forEach(t => {
        breakdown[t.category] = (breakdown[t.category] || 0) + t.amount;
      });

    return Object.keys(breakdown).map(k => ({
      name: CATEGORY_LABELS[k as Category],
      value: breakdown[k],
      color: CATEGORY_COLORS[k as Category]
    }));
  }, [filteredTransactions]);

  // Chart Data: Revenue vs Cost for selected project
  const performanceData = selectedStats ? [
    { name: 'Ricavi', value: selectedStats.revenue, fill: '#10b981' },
    { name: 'Costi', value: selectedStats.costs, fill: '#ef4444' },
    { name: 'Margine', value: selectedStats.margin, fill: '#6366f1' },
  ] : [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Project Selector */}
      <div className="flex flex-col sm:flex-row items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-200 gap-4">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
                <Briefcase size={24} />
            </div>
            <div>
                <h2 className="text-lg font-bold text-slate-800">Analisi Cantieri</h2>
                <p className="text-sm text-slate-500">Monitoraggio KPI per singola commessa</p>
            </div>
        </div>
        
        <select
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          className="w-full sm:w-64 p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium"
        >
          <option value="all">-- Riepilogo Tutti i Cantieri --</option>
          {projects.map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
          <option value="Spese Generali / Altro">Spese Generali / Altro</option>
        </select>
      </div>

      {/* VIEW: ALL PROJECTS SUMMARY TABLE */}
      {selectedProject === 'all' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-600">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 font-semibold">Cantiere / Progetto</th>
                            <th className="px-6 py-4 font-semibold text-right">Ricavi Totali</th>
                            <th className="px-6 py-4 font-semibold text-right">Costi Diretti</th>
                            <th className="px-6 py-4 font-semibold text-right">Margine (€)</th>
                            <th className="px-6 py-4 font-semibold text-right">Margine (%)</th>
                            <th className="px-6 py-4 font-semibold text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {projectStats.map((stat) => (
                            <tr key={stat.name} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4 font-medium text-slate-900">{stat.name}</td>
                                <td className="px-6 py-4 text-right font-mono text-emerald-600">{formatCurrency(stat.revenue)}</td>
                                <td className="px-6 py-4 text-right font-mono text-red-500">{formatCurrency(stat.costs)}</td>
                                <td className={`px-6 py-4 text-right font-mono font-bold ${stat.margin >= 0 ? 'text-indigo-600' : 'text-red-600'}`}>
                                    {formatCurrency(stat.margin)}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <span className={`px-2 py-1 rounded text-xs font-semibold ${stat.marginPercent >= 20 ? 'bg-emerald-100 text-emerald-700' : stat.marginPercent > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                        {stat.marginPercent.toFixed(1)}%
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    {stat.margin > 0 ? (
                                        <CheckCircle2 size={18} className="mx-auto text-emerald-500" />
                                    ) : (
                                        <AlertCircle size={18} className="mx-auto text-red-400" />
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      )}

      {/* VIEW: SINGLE PROJECT DASHBOARD */}
      {selectedProject !== 'all' && selectedStats && (
        <>
            {/* KPI Cards for Project */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Valore Commessa</div>
                    <div className="text-2xl font-bold text-slate-800">{formatCurrency(selectedStats.revenue)}</div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Costi Sostenuti</div>
                    <div className="text-2xl font-bold text-red-500">{formatCurrency(selectedStats.costs)}</div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Margine Operativo</div>
                    <div className={`text-2xl font-bold ${selectedStats.margin >= 0 ? 'text-indigo-600' : 'text-red-600'}`}>
                        {formatCurrency(selectedStats.margin)}
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">ROS (Return on Sales)</div>
                    <div className={`text-2xl font-bold ${selectedStats.marginPercent >= 20 ? 'text-emerald-500' : 'text-amber-500'}`}>
                        {selectedStats.marginPercent.toFixed(1)}%
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Performance Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-800 mb-6">Performance Economica</h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={performanceData} layout="vertical" margin={{ left: 40 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={80} tick={{fontSize: 12}} />
                                <RechartsTooltip formatter={(value: number) => `€${value.toLocaleString()}`} />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={40}>
                                    {performanceData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Cost Breakdown Pie */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-800 mb-6">Composizione Costi</h3>
                    <div className="h-64 w-full">
                         {costBreakdownData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={costBreakdownData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {costBreakdownData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip formatter={(value: number) => `€${value.toLocaleString()}`} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                         ) : (
                             <div className="h-full flex items-center justify-center text-slate-400 text-sm">Nessun costo registrato</div>
                         )}
                    </div>
                </div>
            </div>
            
            {/* Transaction List for Project */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50">
                    <h3 className="font-semibold text-slate-700">Storico Movimenti: {selectedProject}</h3>
                </div>
                <div className="max-h-80 overflow-y-auto">
                    {filteredTransactions.map(t => (
                        <div key={t.id} className="flex justify-between items-center p-4 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                            <div>
                                <div className="font-medium text-slate-800">{t.description}</div>
                                <div className="text-xs text-slate-400 flex gap-2">
                                    <span>{new Date(t.date).toLocaleDateString()}</span>
                                    <span>•</span>
                                    <span>{CATEGORY_LABELS[t.category]}</span>
                                </div>
                            </div>
                            <div className={`font-mono font-bold ${t.type === TransactionType.REVENUE ? 'text-emerald-600' : 'text-slate-600'}`}>
                                {t.type === TransactionType.REVENUE ? '+' : '-'} {formatCurrency(t.amount)}
                            </div>
                        </div>
                    ))}
                    {filteredTransactions.length === 0 && (
                        <div className="p-8 text-center text-slate-400">Nessun movimento trovato per questo cantiere.</div>
                    )}
                </div>
            </div>
        </>
      )}
    </div>
  );
};

export default ProjectDashboard;