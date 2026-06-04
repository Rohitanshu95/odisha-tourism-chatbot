import React from 'react';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from 'recharts';
import MetricCard from './MetricCard';
import { MessageSquare, Users, UserPlus, UserCircle, Activity, Clock, RefreshCw, BarChart2, Star } from 'lucide-react';

const COLORS = ['#0284c7', '#06b6d4']; // Matching the dark blue and cyan in the screenshot

const SectionExecutive = ({ executiveData, operationalData, satisfactionData }) => {
  if (!executiveData) return null;

  const { total_users, total_queries, total_sessions, user_types } = executiveData;
  const { daily_activity } = operationalData || {};

  // Extract Registered vs Guest from user_types
  const registeredObj = user_types?.find(t => t.name === 'Registered' || t.name === 'Auth') || { value: 0 };
  const guestObj = user_types?.find(t => t.name === 'Guest') || { value: 0 };

  const registeredUsers = executiveData.registered_users ?? registeredObj.value ?? 0;
  const guestUsers = executiveData.guest_users ?? guestObj.value ?? 0;
  const avgMsgs = executiveData.avg_msgs_per_conv ?? (total_sessions > 0 ? Number(total_queries / total_sessions).toFixed(1) : 0);
  const formatNumber = (value) => Number(value ?? 0).toLocaleString();

  return (
    <section className="mb-8">
      <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
        <BarChart2 className="mr-2 text-sky-600" size={24} /> 
        Executive Summary
      </h2>
      
      {/* Metric Cards Grid matching the screenshot */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        <MetricCard title="Total Conversations" value={formatNumber(total_sessions)} icon={MessageSquare} trend={0} />
        <MetricCard title="Total Users" value={formatNumber(total_users)} icon={Users} trend={0} />
        <MetricCard title="Registered Users" value={formatNumber(registeredUsers)} icon={UserPlus} trend={0} />
        <MetricCard title="Guest Users" value={formatNumber(guestUsers)} icon={UserCircle} trend={0} />
        
        <MetricCard title="Messages Processed" value={formatNumber(total_queries)} icon={Activity} trend={0} />
        <MetricCard title="Avg Session Duration" value={executiveData.avg_session_duration ?? "0m 0s"} icon={Clock} trend={0} />
        <MetricCard title="Returning Users" value={formatNumber(executiveData.returning_users)} icon={RefreshCw} trend={0} />
        <MetricCard title="Avg Msgs/Conversation" value={String(avgMsgs ?? 0)} icon={MessageSquare} trend={0} />
      </div>

      {/* Customer Satisfaction Strip */}
      {satisfactionData && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 mb-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-6 flex items-center">
            <Star className="mr-2 text-amber-500" size={18} />
            Customer Satisfaction (CSAT) Breakdown
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 flex flex-col justify-center space-y-4">
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                <div className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Overall Satisfaction</div>
                <div className="text-3xl font-bold text-slate-800">{satisfactionData.overall_csat}%</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-sky-50 p-3 rounded-lg border border-sky-100">
                  <div className="text-[10px] text-sky-600 font-bold uppercase mb-1">Guest CSAT</div>
                  <div className="text-xl font-bold text-sky-900">{satisfactionData.breakdown.find(b => b.user_type === 'Guest Users')?.csat}%</div>
                </div>
                <div className="bg-cyan-50 p-3 rounded-lg border border-cyan-100">
                  <div className="text-[10px] text-cyan-600 font-bold uppercase mb-1">Registered CSAT</div>
                  <div className="text-xl font-bold text-cyan-900">{satisfactionData.breakdown.find(b => b.user_type === 'Registered Users')?.csat}%</div>
                </div>
              </div>
            </div>
            
            <div className="lg:col-span-2 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={satisfactionData.breakdown} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={true} />
                  <YAxis dataKey="user_type" type="category" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={true} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="satisfied" name="Satisfied" stackId="a" fill="#10b981" radius={[4, 0, 0, 4]} />
                  <Bar dataKey="dissatisfied" name="Dissatisfied" stackId="a" fill="#ef4444" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Type Distribution Pie Chart */}
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-xl shadow-sm p-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-6">User Type Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Registered Users', value: registeredUsers },
                    { name: 'Guest Users', value: guestUsers }
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  <Cell fill="#0284c7" />
                  <Cell fill="#06b6d4" />
                </Pie>
                <Tooltip />
                <Legend iconType="square" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Monthly User & Conversation Growth Line Chart */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl shadow-sm p-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-6">Monthly User & Conversation Growth</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={executiveData?.monthly_growth || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={true} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Line name="Users" type="monotone" dataKey="users" stroke="#0284c7" strokeWidth={2} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6 }} />
                <Line name="Conversations" type="monotone" dataKey="conversations" stroke="#06b6d4" strokeWidth={2} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SectionExecutive;
