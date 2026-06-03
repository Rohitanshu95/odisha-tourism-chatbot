import React from 'react';

const MetricCard = ({ title, value, icon: Icon, trend }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 flex flex-col h-full">
      <div className="flex justify-between items-start mb-4">
        {Icon && (
          <div className="bg-sky-50 p-2.5 rounded-lg text-sky-600">
            <Icon size={20} strokeWidth={2.5} />
          </div>
        )}
        {trend !== undefined && (
          <div className={`flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-bold ${trend > 0 ? 'bg-emerald-50 text-emerald-600' : trend < 0 ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-600'}`}>
            <span>{trend > 0 ? '↑' : trend < 0 ? '↓' : ''} {Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      <div className="mt-auto">
        <h3 className="text-sm font-medium text-slate-500 mb-1">{title}</h3>
        <p className="text-2xl sm:text-3xl font-bold text-slate-800">{value}</p>
      </div>
    </div>
  );
};

export default MetricCard;
