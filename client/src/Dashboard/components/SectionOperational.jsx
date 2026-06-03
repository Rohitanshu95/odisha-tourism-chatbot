import React from 'react';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import MetricCard from './MetricCard';
import { Activity, Users, TrendingUp, Database, Clock, CheckCircle, AlertCircle } from 'lucide-react';

const SectionOperational = ({ operationalData }) => {
  if (!operationalData) return null;

  const activityTrendData = operationalData?.daily_activity || [];
  const responseTimeData = operationalData?.response_time_trend || [];

  return (
    <section className="mb-8">
      <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
        <Activity className="mr-2 text-sky-600" size={24} /> 
        Operational Dashboard
      </h2>
      
      {/* 8 Metric Cards Grid matching the screenshot */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        <MetricCard title="Active Users Today" value={operationalData?.active_users_today?.toLocaleString() || "0"} icon={Activity} trend={0} />
        <MetricCard title="Daily Active Users" value={operationalData?.daily_active_users?.toLocaleString() || "0"} icon={Users} trend={0} />
        <MetricCard title="Monthly Active Users" value={operationalData?.monthly_active_users?.toLocaleString() || "0"} icon={TrendingUp} trend={0} />
        <MetricCard title="Total API Requests" value={operationalData?.total_api_requests?.toLocaleString() || "0"} icon={Database} trend={0} />
        
        <MetricCard title="Avg Response Time" value={`${operationalData?.avg_response_time_ms || 0}s`} icon={Clock} trend={0} />
        <MetricCard title="Query Success Rate" value={`${operationalData?.query_success_rate || 0}%`} icon={CheckCircle} trend={0} />
        <MetricCard title="Error Rate" value={`${operationalData?.error_rate || 0}%`} icon={AlertCircle} trend={0} />
        <MetricCard title="System Availability" value={`${operationalData?.system_availability || 0}%`} icon={Activity} trend={0} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Daily Activity Trend Stacked Area Chart */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-6">Daily Activity Trend</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={true} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Area name="Queries" type="monotone" dataKey="queries" stackId="1" stroke="#0369a1" fill="#0284c7" fillOpacity={0.7} />
                <Area name="Users" type="monotone" dataKey="users" stackId="1" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.9} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Response Time Trend Line Chart */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-6">Response Time Trend</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={responseTimeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={true} stroke="#e2e8f0" />
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={10} tickLine={true} axisLine={true} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={true} axisLine={true} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Line type="monotone" dataKey="timeValue" stroke="#06b6d4" strokeWidth={2} dot={{ r: 5, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 7 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </section>
  );
};

export default SectionOperational;
