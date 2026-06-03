import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import MetricCard from './MetricCard';
import { Globe, UserPlus, TrendingUp, CheckCircle } from 'lucide-react';

const COLORS = ['#0284c7', '#0ea5e9', '#06b6d4', '#f97316'];

const SectionDemographics = ({ demographicsData }) => {
  if (!demographicsData) return null;
  const { locations, languages } = demographicsData;

  // Split locations into states and countries (mocking logic here for UI)
  const states = locations?.filter(l => l.name === 'Odisha' || l.name === 'Maharashtra' || l.name === 'Delhi' || l.name === 'West Bengal' || l.name === 'Jharkhand' || l.name === 'Andhra Pradesh' || l.name === 'Chhattisgarh' || l.name === 'Karnataka') || [];
  const countries = locations?.filter(l => !states.includes(l)) || [];

  const displayStates = states;
  const displayCountries = countries;

  return (
    <section className="mb-8">
      <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
        <Globe className="mr-2 text-sky-600" size={24} /> 
        User Demographics & Registration Analytics
      </h2>
      
      {/* 3 Charts Grid matching the screenshot */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-6">State-wise User Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={displayStates} layout="vertical" margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                <XAxis type="number" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={12} width={90} tickLine={false} axisLine={true} />
                <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="value" fill="#0284c7" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-6">Country-wise User Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={displayCountries} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                <XAxis type="number" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={12} width={70} tickLine={false} axisLine={true} />
                <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="value" fill="#06b6d4" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-6">Language Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={languages || []}
                  cx="50%"
                  cy="50%"
                  outerRadius={85}
                  dataKey="value"
                  label={({value}) => `${value}`}
                  labelLine={true}
                >
                  {languages?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 4 Metric Cards Grid matching the screenshot */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard title="New Registered Users" value="0" icon={UserPlus} trend={0} />
        <MetricCard title="Returning Users" value="0" icon={TrendingUp} trend={0} />
        <MetricCard title="Registration Rate" value="0%" icon={CheckCircle} trend={0} />
        <MetricCard title="Multi-Language Users" value="0" icon={Globe} trend={0} />
      </div>
    </section>
  );
};

export default SectionDemographics;
