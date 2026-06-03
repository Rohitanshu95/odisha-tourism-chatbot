import React from 'react';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import MetricCard from './MetricCard';
import { Users, MessageSquare, Activity, Clock } from 'lucide-react';

const COLORS = ['#0891b2', '#0369a1'];

const SectionExecutive = ({ executiveData, operationalData }) => {
  if (!executiveData) return null;

  const { total_users, total_queries, total_sessions, user_types } = executiveData;
  const { daily_activity } = operationalData || {};

  return (
    <section className="mb-8">
      <h2 className="text-xl font-bold text-slate-800 mb-4 border-b pb-2">Executive Summary</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard title="Total Users" value={total_users} icon={Users} trend={5.2} subtext="vs last month" />
        <MetricCard title="Total Queries" value={total_queries} icon={MessageSquare} trend={12.5} subtext="vs last month" />
        <MetricCard title="Total Sessions" value={total_sessions} icon={Activity} />
        <MetricCard title="Avg Session Time" value="4m 20s" icon={Clock} trend={-1.1} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-xl shadow-sm p-5">
          <h3 className="text-sm font-medium text-slate-500 mb-4">User Type Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={user_types}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {user_types?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center space-x-4 mt-2">
            {user_types?.map((entry, index) => (
              <div key={entry.name} className="flex items-center">
                <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                <span className="text-sm text-slate-600">{entry.name} ({entry.value})</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl shadow-sm p-5">
          <h3 className="text-sm font-medium text-slate-500 mb-4">Daily Activity Growth</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={daily_activity || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Line type="monotone" dataKey="queries" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SectionExecutive;
