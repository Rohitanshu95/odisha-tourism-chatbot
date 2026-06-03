import React from 'react';

const MetricCard = ({ title, value, subtext, icon: Icon, trend }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 flex flex-col justify-between">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-sm font-medium text-slate-500">{title}</h3>
        {Icon && <Icon size={20} className="text-sky-600" />}
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
        {(subtext || trend) && (
          <div className="flex items-center mt-2 space-x-2">
            {trend && (
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${trend > 0 ? 'bg-emerald-50 text-emerald-600' : trend < 0 ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-600'}`}>
                {trend > 0 ? '+' : ''}{trend}%
              </span>
            )}
            {subtext && <span className="text-xs text-slate-400">{subtext}</span>}
          </div>
        )}
      </div>
    </div>
  );
};

export default MetricCard;
