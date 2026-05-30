import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch Analytics
      const analyticsRes = await fetch('http://localhost:8000/api/v1/admin/analytics');
      if (!analyticsRes.ok) throw new Error('Failed to fetch analytics');
      const analyticsData = await analyticsRes.json();
      
      // Fetch Summaries (for export)
      const summariesRes = await fetch('http://localhost:8000/api/v1/admin/summaries');
      if (!summariesRes.ok) throw new Error('Failed to fetch summaries');
      const summariesData = await summariesRes.json();

      setData(analyticsData);
      setSummaries(summariesData.summaries);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!summaries || summaries.length === 0) return;
    
    // Define headers
    const headers = ['User Name', 'Email', 'Mobile', 'Created At', 'Chat Summary'];
    
    // Map data to rows
    const rows = summaries.map(s => [
      `"${s.user_name || ''}"`,
      `"${s.user_email || ''}"`,
      `"${s.user_mobile || ''}"`,
      `"${s.created_at || ''}"`,
      `"${(s.summary || '').replace(/"/g, '""')}"`
    ]);
    
    // Combine headers and rows
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    // Create Blob and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'odisha_chatbot_users.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <div className="p-8 text-center">Loading dashboard data...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;
  if (!data) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Analytics Dashboard</h1>
            <p className="text-gray-500">Real-time performance and user insights</p>
          </div>
          <button 
            onClick={exportToCSV}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded shadow transition-colors"
          >
            Export User Details (CSV)
          </button>
        </div>

        {/* Top Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-sm font-medium text-gray-500">Total Queries</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{data.overview.total_queries}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-sm font-medium text-gray-500">System Failures (Fallbacks)</h3>
            <p className="text-3xl font-bold text-red-600 mt-2">{data.overview.total_fallbacks}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-sm font-medium text-gray-500">Success Rate</h3>
            <p className="text-3xl font-bold text-green-600 mt-2">{data.overview.success_rate}%</p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Time Series Chart */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold mb-4">Query Volume by Time of Day</h2>
            <div className="h-80 w-full">
              <ResponsiveContainer>
                <LineChart data={data.time_series} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="hour" stroke="#6b7280" fontSize={12} tickLine={false} />
                  <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Line type="monotone" dataKey="queries" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Queries Table */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <h2 className="text-xl font-semibold mb-4">Most Frequent Queries</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Query</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Count</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.top_queries.map((q, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900 truncate max-w-xs">{q._id}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">{q.count}</td>
                    </tr>
                  ))}
                  {data.top_queries.length === 0 && (
                    <tr><td colSpan="2" className="px-6 py-4 text-sm text-gray-500 text-center">No queries recorded yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Fallbacks Table */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <h2 className="text-xl font-semibold mb-4 text-red-700">Recent System Failures</h2>
          <p className="text-sm text-gray-500 mb-4">Queries where the AI failed to generate a response and triggered the fallback message.</p>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-red-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-red-800 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-red-800 uppercase tracking-wider">User Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-red-800 uppercase tracking-wider">Failed Query</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.recent_failures.map((f, idx) => (
                  <tr key={idx} className="hover:bg-red-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(f.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${f.is_guest ? 'bg-gray-100 text-gray-800' : 'bg-blue-100 text-blue-800'}`}>
                        {f.is_guest ? 'Guest' : 'User'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 break-words">{f.query}</td>
                  </tr>
                ))}
                {data.recent_failures.length === 0 && (
                  <tr><td colSpan="3" className="px-6 py-4 text-sm text-gray-500 text-center">Great job! No system failures recorded recently.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
