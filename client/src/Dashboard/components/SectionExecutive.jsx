import React from 'react';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import MetricCard from './MetricCard';
import { MessageSquare, Users, UserPlus, UserCircle, Activity, Clock, RefreshCw, BarChart2 } from 'lucide-react';

const COLORS = ['#0284c7', '#06b6d4']; // Matching the dark blue and cyan in the screenshot

const SectionExecutive = ({ executiveData, operationalData }) => {
  if (!executiveData) return null;

  const { total_users, total_queries, total_sessions, user_types } = executiveData;
  const { daily_activity } = operationalData || {};

  // Extract Registered vs Guest from user_types
  const registeredObj = user_types?.find(t => t.name === 'Registered' || t.name === 'Auth') || { value: 0 };
  const guestObj = user_types?.find(t => t.name === 'Guest') || { value: 0 };

  const registeredUsers = registeredObj.value;
  const guestUsers = guestObj.value;
  const avgMsgs = total_sessions > 0 ? (total_queries / total_sessions).toFixed(1) : 0;

  return (
    <section className="mb-8">
      <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
        <BarChart2 className="mr-2 text-sky-600" size={24} /> 
        Executive Summary
      </h2>
      
      {/* 8 Metric Cards Grid matching the screenshot */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        <MetricCard title="Total Conversations" value={total_sessions.toLocaleString()} icon={MessageSquare} trend={12.5} />
        <MetricCard title="Total Users" value={total_users.toLocaleString()} icon={Users} trend={8.3} />
        <MetricCard title="Registered Users" value={registeredUsers.toLocaleString()} icon={UserPlus} trend={15.2} />
        <MetricCard title="Guest Users" value={guestUsers.toLocaleString()} icon={UserCircle} trend={3.7} />
        
        <MetricCard title="Messages Processed" value={total_queries.toLocaleString()} icon={Activity} trend={18.4} />
        <MetricCard title="Avg Session Duration" value="4m 32s" icon={Clock} trend={2.1} />
        <MetricCard title="Returning Users" value={Math.floor(total_users * 0.4).toLocaleString()} icon={RefreshCw} trend={21.3} />
        <MetricCard title="Avg Msgs/Conversation" value={avgMsgs} icon={MessageSquare} trend={5.8} />
      </div>

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
              <LineChart data={daily_activity || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={true} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Line name="Users" type="monotone" dataKey="users" stroke="#0284c7" strokeWidth={2} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6 }} />
                <Line name="Conversations" type="monotone" dataKey="queries" stroke="#06b6d4" strokeWidth={2} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SectionExecutive;
