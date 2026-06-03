import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import MetricCard from './MetricCard';
import { Database, CheckCircle2, Server, AlertCircle, HelpCircle, MessageSquareWarning, TrendingUp } from 'lucide-react';

const SectionKnowledge = ({ knowledgeData }) => {
  if (!knowledgeData) return null;
  const { fallback_rate, knowledge_gaps, top_unanswered } = knowledgeData;

  const displayGaps = knowledge_gaps || [];
  const displayUnanswered = top_unanswered || [];
  const topFaqs = knowledgeData?.top_faqs || [];

  return (
    <section className="mb-8">
      <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
        <Database className="mr-2 text-sky-600" size={24} /> 
        AI Knowledge Analytics
      </h2>
      
      {/* 6 Metric Cards Grid matching the screenshot */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <MetricCard title="Successfully Answered" value={`${(100 - (fallback_rate || 0)).toFixed(1)}%`} icon={CheckCircle2} trend={0} />
        <MetricCard title="Knowledge Coverage" value={`${knowledgeData?.knowledge_coverage || 0}%`} icon={Server} trend={0} />
        <MetricCard title="Unanswered Queries" value={knowledgeData?.unanswered_queries?.toLocaleString() || "0"} icon={AlertCircle} trend={0} />
        <MetricCard title="Low Confidence" value={knowledgeData?.low_confidence_count?.toLocaleString() || "0"} icon={HelpCircle} trend={0} />
        <MetricCard title="Repeated Questions" value={knowledgeData?.repeated_questions?.toLocaleString() || "0"} icon={MessageSquareWarning} trend={0} />
        <MetricCard title="Emerging Topics" value={knowledgeData?.emerging_topics?.toLocaleString() || "0"} icon={TrendingUp} trend={0} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Top Unanswered Queries Table */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 flex flex-col h-96">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Top Unanswered Queries</h3>
          <div className="overflow-y-auto flex-1 hide-scrollbar">
            <table className="w-full text-sm text-left">
              <thead className="text-[10px] font-bold text-slate-500 uppercase sticky top-0 bg-white z-10 border-b border-slate-100">
                <tr>
                  <th className="py-3 px-1">Query</th>
                  <th className="py-3 px-1 text-right w-16">Count</th>
                </tr>
              </thead>
              <tbody>
                {displayUnanswered.map((item, idx) => (
                  <tr key={idx} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                    <td className="py-3 px-1 text-slate-700 font-medium truncate max-w-[200px]" title={item.query}>{item.query}</td>
                    <td className="py-3 px-1 text-right text-sky-600 font-semibold">{item.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Knowledge Gap Categories Bar Chart */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 flex flex-col h-96">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Knowledge Gap Categories</h3>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={displayGaps} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={true} angle={-45} textAnchor="end" />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={true} />
                <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="value" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top 10 FAQs Table */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 flex flex-col h-96">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Top 10 FAQs</h3>
          <div className="overflow-y-scroll flex-1 pr-2 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
            <table className="w-full text-sm text-left">
              <thead className="text-[10px] font-bold text-slate-500 uppercase sticky top-0 bg-white z-10 border-b border-slate-100">
                <tr>
                  <th className="py-3 px-1">Question</th>
                  <th className="py-3 px-1 text-right w-16">Count</th>
                </tr>
              </thead>
              <tbody>
                {topFaqs.map((item, idx) => (
                  <tr key={idx} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                    <td className="py-3 px-1 text-slate-700 font-medium truncate max-w-[200px]" title={item.query}>{item.query}</td>
                    <td className="py-3 px-1 text-right text-sky-600 font-semibold">{item.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </section>
  );
};

export default SectionKnowledge;
