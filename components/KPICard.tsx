import React, { useState } from 'react';
import { Info } from 'lucide-react';
import { KPIInfo } from '../types';
import { formatCurrency } from '../utils/calculations';

interface KPICardProps {
  data: KPIInfo;
}

const KPICard: React.FC<KPICardProps> = ({ data }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">{data.label}</h3>
        <div 
          className="cursor-help text-slate-400 hover:text-indigo-600 transition-colors"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <Info size={18} />
        </div>
      </div>
      
      <div className={`text-2xl font-bold ${data.color || 'text-slate-800'}`}>
        {data.currency ? formatCurrency(data.value) : data.value}
        {data.percentage ? '%' : ''}
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute z-10 top-0 left-full ml-2 w-64 p-3 bg-slate-800 text-white text-xs rounded-lg shadow-xl animate-in fade-in zoom-in duration-200">
          <div className="font-semibold mb-1">{data.label}</div>
          {data.description}
          {/* Arrow */}
          <div className="absolute top-4 -left-1 w-2 h-2 bg-slate-800 transform rotate-45"></div>
        </div>
      )}
    </div>
  );
};

export default KPICard;