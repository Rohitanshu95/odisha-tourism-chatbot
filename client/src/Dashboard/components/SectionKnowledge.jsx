import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import MetricCard from './MetricCard';
import { BrainCircuit } from 'lucide-react';

const SectionKnowledge = ({ knowledgeData }) => {
  if (!knowledgeData) return null;
  const { fallback_rate, knowledge_gaps, top_unanswered } = knowledgeData;

  return (
    <section className="mb-8">
      <h2 className="text-xl font-bold text-slate-800 mb-4 border-b pb-2">AI Knowledge Analytics</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="md:col-span-1">
          <MetricCard 
            title="Global AI Fallback Rate" 
            value={`${fallback_rate}%`} 
            icon={BrainCircuit} 
            trend={fallback_rate > 5 ? fallback_rate : -1.2} 
            subtext="Target: <5%"
          />
        </div>
        
        <div className="md:col-span-2 bg-white border border-slate-200 rounded-xl shadow-sm p-5">
          <h3 className="text-sm font-medium text-slate-500 mb-4">Knowledge Gap Categories</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={knowledge_gaps} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                <XAxis type="number" stroke="#94a3b8" fontSize={12} />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={12} width={100} />
                <Tooltip cursor={{fill: '#f1f5f9'}} />
                <Bar dataKey="value" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
        <h3 className="text-sm font-medium text-slate-500 mb-4">Top Unanswered Queries (Action Required)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50">
              <tr>
                <th className="px-4 py-3 rounded-tl-lg">Query</th>
                <th className="px-4 py-3">Frequency</th>
                <th className="px-4 py-3 rounded-tr-lg text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {top_unanswered?.map((item, idx) => (
                <tr key={idx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{item.query}</td>
                  <td className="px-4 py-3 text-slate-600">
                    <span className="bg-red-100 text-red-700 font-bold px-2 py-1 rounded-full text-xs">
                      {item.count} hits
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button className="text-sky-600 hover:text-sky-800 font-medium">Train AI</button>
                  </td>
                </tr>
              ))}
              {(!top_unanswered || top_unanswered.length === 0) && (
                <tr>
                  <td colSpan="3" className="px-4 py-8 text-center text-slate-500">
                    No unanswered queries recorded recently.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default SectionKnowledge;
