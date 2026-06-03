import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Settings, LogOut, Loader2, LayoutDashboard, BarChart2, Users, Map, BrainCircuit, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import SectionExecutive from './components/SectionExecutive';
import SectionDemographics from './components/SectionDemographics';
import SectionDemand from './components/SectionDemand';
import SectionKnowledge from './components/SectionKnowledge';
import SectionOperational from './components/SectionOperational';

const TABS = [
  { id: 'executive', label: 'Executive Summary', icon: BarChart2 },
  { id: 'demographics', label: 'User Demographics', icon: Users },
  { id: 'demand', label: 'Tourism Demand', icon: Map },
  { id: 'knowledge', label: 'AI Knowledge', icon: BrainCircuit },
  { id: 'operational', label: 'System Health', icon: Activity },
];

const Dashboard = () => {
  const [data, setData] = useState({
    executive: null,
    demographics: null,
    demand: null,
    knowledge: null,
    operational: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('executive');
  const navigate = useNavigate();

  useEffect(() => {
    let intervalId;

    const fetchDashboardData = async (showLoading = true) => {
      try {
        if (showLoading) setLoading(true);
        const [execRes, demoRes, demandRes, knowRes, opRes] = await Promise.all([
          axios.get('http://localhost:8000/api/v1/dashboard/executive'),
          axios.get('http://localhost:8000/api/v1/dashboard/demographics'),
          axios.get('http://localhost:8000/api/v1/dashboard/demand'),
          axios.get('http://localhost:8000/api/v1/dashboard/knowledge'),
          axios.get('http://localhost:8000/api/v1/dashboard/operational'),
        ]);

        setData({
          executive: execRes.data,
          demographics: demoRes.data,
          demand: demandRes.data,
          knowledge: knowRes.data,
          operational: opRes.data
        });
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        setError("Failed to load dashboard data. Ensure the backend is running.");
      } finally {
        if (showLoading) setLoading(false);
      }
    };

    fetchDashboardData(true);
    intervalId = setInterval(() => fetchDashboardData(false), 10000);

    return () => clearInterval(intervalId);
  }, []);

  const handleExportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `odisha_tourism_report_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-amber-600 mb-4" size={48} />
        <h2 className="text-xl font-semibold text-slate-700">Loading Intelligence...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-red-50 text-red-600 p-6 rounded-xl border border-red-200 text-center max-w-md shadow-lg">
          <h2 className="font-bold text-lg mb-2">System Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
      {/* Sleek Gradient Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all">
        <div className="flex items-center space-x-4">
          <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-2.5 rounded-xl shadow-md text-white">
            <LayoutDashboard size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 leading-tight">Odisha Tourism</h1>
            <p className="text-xs font-bold text-amber-600 uppercase tracking-widest">Command Center</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button 
            onClick={handleExportData}
            className="flex items-center space-x-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-xl font-medium transition-all shadow-sm"
          >
            <span>Export Report</span>
          </button>
          <button className="p-2.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-full transition-all">
            <Settings size={20} />
          </button>
          <button 
            onClick={() => navigate('/login')}
            className="flex items-center space-x-2 bg-white border border-slate-200 hover:border-red-200 hover:bg-red-50 hover:text-red-600 text-slate-600 px-5 py-2.5 rounded-xl font-medium transition-all shadow-sm"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Tabbed Navigation Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-[73px] z-40 shadow-sm">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <nav className="flex overflow-x-auto hide-scrollbar space-x-6">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                    isActive 
                      ? 'border-amber-500 text-amber-600' 
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <Icon size={18} className={isActive ? 'text-amber-500' : 'text-slate-400'} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content Dashboard */}
      <main className="w-full px-4 sm:px-6 lg:px-8 py-8 flex-1 bg-slate-50">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {activeTab === 'executive' && <SectionExecutive executiveData={data.executive} operationalData={data.operational} />}
          {activeTab === 'demographics' && <SectionDemographics demographicsData={data.demographics} />}
          {activeTab === 'demand' && <SectionDemand demandData={data.demand} />}
          {activeTab === 'knowledge' && <SectionKnowledge knowledgeData={data.knowledge} />}
          {activeTab === 'operational' && <SectionOperational operationalData={data.operational} />}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
