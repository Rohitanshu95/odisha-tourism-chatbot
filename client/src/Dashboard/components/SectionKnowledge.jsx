import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import MetricCard from './MetricCard';
import { Database, CheckCircle2, Server, AlertCircle, HelpCircle, MessageSquareWarning, TrendingUp } from 'lucide-react';

const SectionKnowledge = ({ knowledgeData }) => {
  if (!knowledgeData) return null;
  const { fallback_rate, knowledge_gaps, top_unanswered } = knowledgeData;

  const displayGaps = knowledge_gaps?.length > 0 ? knowledge_gaps : [
    {name: 'Destination Info', value: 145},
    {name: 'Accommodation', value: 95},
    {name: 'Transportation', value: 75},
    {name: 'Festival/Events', value: 50},
    {name: 'Local Cuisine', value: 35}
  ];

  const displayUnanswered = top_unanswered?.length > 0 ? top_unanswered : [
    {query: 'Best time to visit Daringbadi', count: 42},
    {query: 'Tribal homestays in Koraput', count: 38},
    {query: 'Ferry timings to Chilika islands', count: 31},
    {query: 'Helicopter booking to Puri', count: 28},
    {query: 'Eco-tourism packages Simlipal', count: 24}
  ];

  const topFaqs = [
    {query: 'How to reach Puri from Bhubaneswar?', count: 842},
    {query: 'Entry timings for Jagannath Temple?', count: 756},
    {query: 'Best hotels near Konark Sun Temple?', count: 683},
    {query: 'Chilika Lake boat ride charges?', count: 621},
    {query: 'Rath Yatra dates and booking?', count: 598},
    {query: 'Wildlife safari booking Simlipal?', count: 534}
  ];

  return (
    <section className="mb-8">
      <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
        <Database className="mr-2 text-sky-600" size={24} /> 
        AI Knowledge Analytics
      </h2>
      
      {/* 6 Metric Cards Grid matching the screenshot */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <MetricCard title="Successfully Answered" value={`${(100 - fallback_rate).toFixed(1)}%`} icon={CheckCircle2} trend={3.2} />
        <MetricCard title="Knowledge Coverage" value="87.5%" icon={Server} trend={5.1} />
        <MetricCard title="Unanswered Queries" value="409" icon={AlertCircle} trend={-12.4} />
        <MetricCard title="Low Confidence" value="1,234" icon={HelpCircle} trend={-8.2} />
        <MetricCard title="Repeated Questions" value="2,847" icon={MessageSquareWarning} trend={6.3} />
        <MetricCard title="Emerging Topics" value="34" icon={TrendingUp} trend={42.1} />
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
