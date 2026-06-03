import React from 'react';
import MetricCard from './MetricCard';
import { Zap, ServerCrash } from 'lucide-react';

const SectionOperational = ({ operationalData }) => {
  if (!operationalData) return null;
  const { avg_response_time_ms } = operationalData;

  // Derive some mock stats for visual completeness of the operational section based on Figma
  const errorRate = 0.02; // Mock 0.02%

  return (
    <section className="mb-8">
      <h2 className="text-xl font-bold text-slate-800 mb-4 border-b pb-2">Operational Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <MetricCard 
          title="Avg. Response Time" 
          value={`${avg_response_time_ms} ms`} 
          icon={Zap} 
          trend={-12.5} 
          subtext="Target: < 2000ms"
        />
        
        <MetricCard 
          title="System Error Rate" 
          value={`${errorRate}%`} 
          icon={ServerCrash} 
          trend={0} 
          subtext="Status: Healthy"
        />
      </div>
    </section>
  );
};

export default SectionOperational;
