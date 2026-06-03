import React from 'react';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import MetricCard from './MetricCard';
import { Activity, Users, TrendingUp, Database, Clock, CheckCircle, AlertCircle } from 'lucide-react';

const SectionOperational = ({ operationalData }) => {
  if (!operationalData) return null;

  // Mocked data to match the visual in the screenshot
  const activityTrendData = [
    { date: 'May 29', queries: 3200, users: 1200 },
    { date: 'May 30', queries: 3600, users: 1400 },
    { date: 'May 31', queries: 4200, users: 1700 },
    { date: 'Jun 1',  queries: 4800, users: 1900 },
    { date: 'Jun 2',  queries: 5200, users: 2100 },
    { date: 'Jun 3',  queries: 5800, users: 2300 }
  ];

  const responseTimeData = [
    { time: '9AM',  timeValue: 0.8 },
    { time: '12PM', timeValue: 1.2 },
    { time: '3PM',  timeValue: 1.1 },
    { time: '6PM',  timeValue: 1.5 },
    { time: '9PM',  timeValue: 0.9 }
  ];

  return (
    <section className="mb-8">
      <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
        <Activity className="mr-2 text-sky-600" size={24} /> 
        Operational Dashboard
      </h2>
      
      {/* 8 Metric Cards Grid matching the screenshot */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        <MetricCard title="Active Users Today" value="2,847" icon={Activity} trend={10.4} />
        <MetricCard title="Daily Active Users" value="8,520" icon={Users} trend={12.3} />
        <MetricCard title="Monthly Active Users" value="10,270" icon={TrendingUp} trend={15.7} />
        <MetricCard title="Total API Requests" value="184.5K" icon={Database} trend={18.4} />
        
        <MetricCard title="Avg Response Time" value="1.2s" icon={Clock} trend={-8.3} />
        <MetricCard title="Query Success Rate" value="98.7%" icon={CheckCircle} trend={1.2} />
        <MetricCard title="Error Rate" value="0.3%" icon={AlertCircle} trend={-42.1} />
        <MetricCard title="System Availability" value="99.97%" icon={Activity} trend={10.02} />
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
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={true} axisLine={true} domain={[0, 1.6]} ticks={[0, 0.4, 0.8, 1.2, 1.6]} />
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
