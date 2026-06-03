import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, ScatterChart, Scatter, ZAxis } from 'recharts';
import MetricCard from './MetricCard';
import { MapPin, Landmark, Map, Building2 } from 'lucide-react';

const PIE_COLORS = ['#0284c7', '#0ea5e9', '#06b6d4', '#f97316', '#3b82f6'];

const SectionDemand = ({ demandData }) => {
  if (!demandData) return null;
  const { top_destinations, tourism_categories } = demandData;

  const displayDestinations = top_destinations?.length > 0 ? top_destinations : [
    {name: 'Puri', value: 8430}, {name: 'Konark', value: 6320}, {name: 'Bhubaneswar', value: 5890},
    {name: 'Chilika', value: 4500}, {name: 'Gopalpur', value: 3900}, {name: 'Simlipal', value: 3500},
    {name: 'Sambalpur', value: 2900}, {name: 'Cuttack', value: 2650}, {name: 'Puri Beach', value: 2300},
    {name: 'Raghurajpur', value: 2100}
  ];

  const displayCategories = tourism_categories?.length > 0 ? tourism_categories : [
    {name: 'Temples & Heritage', value: 35}, {name: 'Beaches', value: 25}, {name: 'Wildlife', value: 18},
    {name: 'Festivals', value: 12}, {name: 'Food', value: 10}
  ];

  const heatMapData = [
    { x: 60, y: 30, z: 200 }, { x: 70, y: 40, z: 300 }, { x: 65, y: 35, z: 150 },
    { x: 50, y: 55, z: 80 }, { x: 45, y: 40, z: 120 }, { x: 80, y: 70, z: 250 },
    { x: 55, y: 20, z: 90 }, { x: 30, y: 60, z: 110 }
  ];

  return (
    <section className="mb-8">
      <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
        <MapPin className="mr-2 text-sky-600" size={24} /> 
        Tourism Information Demand Analytics
      </h2>
      
      {/* 4 Metric Cards Grid matching the screenshot */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        {/* MetricCard uses h-full internally if we updated it, but subtext requires special handling since we changed MetricCard to not take subtext, wait! I'll pass subtext as a fake trend string if needed, or I can just pass a string to 'value' and add a span manually. Actually I can just wrap it in a div and pass to value if it takes a node. Or I can modify MetricCard later. Let's just pass plain strings for now. */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 flex flex-col h-full">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-sky-50 p-2.5 rounded-lg text-sky-600"><MapPin size={20} strokeWidth={2.5} /></div>
          </div>
          <div className="mt-auto">
            <h3 className="text-sm font-medium text-slate-500 mb-1">Most Queried Destination</h3>
            <p className="text-2xl sm:text-3xl font-bold text-slate-800">Puri</p>
            <p className="text-xs text-slate-400 mt-1">8,430 queries</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 flex flex-col h-full">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-sky-50 p-2.5 rounded-lg text-sky-600"><Landmark size={20} strokeWidth={2.5} /></div>
          </div>
          <div className="mt-auto">
            <h3 className="text-sm font-medium text-slate-500 mb-1">Most Queried Category</h3>
            <p className="text-2xl sm:text-3xl font-bold text-slate-800">Temples</p>
            <p className="text-xs text-slate-400 mt-1">33% of queries</p>
          </div>
        </div>

        <MetricCard title="Destination Queries" value="34,560" icon={Map} trend={16.2} />
        <MetricCard title="Accommodation Queries" value="12,340" icon={Building2} trend={9.8} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top 10 Queried Destinations Bar Chart */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-6">Top 10 Queried Destinations</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={displayDestinations} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                <XAxis type="number" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={12} width={80} tickLine={false} axisLine={true} />
                <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="value" fill="#0369a1" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Heat Map Placeholder / Bubble Chart */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 relative">
          <h3 className="text-sm font-semibold text-slate-700 mb-6">Odisha District Tourism Heat Map</h3>
          <div className="h-72 w-full relative bg-slate-50 rounded-lg flex items-center justify-center overflow-hidden border border-slate-100">
            {/* Minimalistic SVG outline for map visual */}
            <svg viewBox="0 0 100 100" className="absolute w-64 h-64 text-sky-200/50" fill="currentColor">
              <path d="M 20 50 L 30 20 L 70 15 L 90 40 L 80 80 L 50 90 Z" />
            </svg>
            <ResponsiveContainer width="100%" height="100%" className="absolute inset-0">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <XAxis type="number" dataKey="x" hide domain={[0, 100]} />
                <YAxis type="number" dataKey="y" hide domain={[0, 100]} />
                <ZAxis type="number" dataKey="z" range={[100, 2000]} />
                <Tooltip cursor={{strokeDasharray: '3 3'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Scatter name="Queries" data={heatMapData} fill="#0ea5e9" opacity={0.7} />
              </ScatterChart>
            </ResponsiveContainer>
            {/* Legend Box */}
            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur border border-slate-200 p-2 rounded-md shadow-sm text-[10px]">
              <p className="font-semibold text-slate-600 mb-1">Query Intensity</p>
              <div className="flex items-center space-x-1 mb-1"><span className="w-2 h-2 rounded-sm bg-[#0369a1]"></span><span className="text-slate-500">Very High (80+)</span></div>
              <div className="flex items-center space-x-1 mb-1"><span className="w-2 h-2 rounded-sm bg-[#0ea5e9]"></span><span className="text-slate-500">High (60-79)</span></div>
              <div className="flex items-center space-x-1 mb-1"><span className="w-2 h-2 rounded-sm bg-[#38bdf8]"></span><span className="text-slate-500">Medium (40-59)</span></div>
              <div className="flex items-center space-x-1"><span className="w-2 h-2 rounded-sm bg-[#bae6fd]"></span><span className="text-slate-500">Low (&lt;40)</span></div>
            </div>
          </div>
        </div>

        {/* Tourism Category Pie Chart */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-6">Tourism Category Distribution</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={displayCategories}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({name, value}) => `${name}: ${value}%`}
                  labelLine={true}
                >
                  {displayCategories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SectionDemand;
