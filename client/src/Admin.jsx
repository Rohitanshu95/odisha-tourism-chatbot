import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { Users, AlertTriangle, CheckCircle } from 'lucide-react';
import './Admin.css';

function Admin() {
  const [data, setData] = useState(null);
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Set default date to today
  const today = new Date();
  const formatDate = (d) => d.toISOString().split('T')[0];
  const [filterDate, setFilterDate] = useState(formatDate(today));

  useEffect(() => {
    fetchDashboardData(filterDate);
  }, [filterDate]);

  const fetchDashboardData = async (selectedDate) => {
    try {
      setLoading(true);
      // Fetch Analytics
      let queryParam = '';
      if (selectedDate) {
        queryParam += `&start_date=${selectedDate}&end_date=${selectedDate}`;
      }
      const analyticsRes = await axios.get(`http://localhost:8000/api/v1/admin/analytics?t=${new Date().getTime()}${queryParam}`);
      
      // Fetch Summaries (for export)
      const summariesRes = await axios.get(`http://localhost:8000/api/v1/admin/summaries?t=${new Date().getTime()}`);

      setData(analyticsRes.data);
      setSummaries(summariesRes.data.summaries);
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch admin data", err);
      setError("Failed to load dashboard data. Ensure backend is running.");
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!summaries || summaries.length === 0) return;
    
    const headers = ['User Name', 'Email', 'Mobile', 'Created At', 'Chat Summary'];
    const rows = summaries.map(s => [
      `"${s.user_name || ''}"`,
      `"${s.user_email || ''}"`,
      `"${s.user_mobile || ''}"`,
      `"${s.created_at || ''}"`,
      `"${(s.summary || '').replace(/"/g, '""')}"`
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
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

  if (loading) return <div className="admin-loading">Loading Dashboard...</div>;
  if (error) return <div className="admin-error">{error}</div>;
  if (!data) return null;

  return (
    <div className="admin-container" style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Header */}
      <header className="admin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2rem', color: '#1f2937' }}>Odisha Tourism Analytics</h1>
          <p style={{ margin: '0.5rem 0', color: '#6b7280' }}>Real-time performance and user insights</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', backgroundColor: 'white', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db' }}>
            <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Date:</span>
            <input 
              type="date" 
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              style={{ border: 'none', outline: 'none', color: '#374151', fontSize: '0.875rem' }}
            />
          </div>
          
          <button 
            onClick={exportToCSV}
            style={{ 
              backgroundColor: '#0ea5e9', color: 'white', border: 'none', 
              padding: '0.75rem 1.5rem', borderRadius: '0.375rem', fontWeight: 'bold', 
              cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' 
            }}
          >
            Export User Details (CSV)
          </button>
        </div>
      </header>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div className="stat-card" style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Users size={32} color="#8b5cf6" />
          <div>
            <h3 style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280', textTransform: 'uppercase' }}>Total Users</h3>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '1.875rem', fontWeight: 'bold', color: '#111827' }}>{data.overview.total_users ?? summaries.length}</p>
          </div>
        </div>
        <div className="stat-card" style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Users size={32} color="#0b5fff" />
          <div>
            <h3 style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280', textTransform: 'uppercase' }}>Total Queries</h3>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '1.875rem', fontWeight: 'bold', color: '#111827' }}>{data.overview.total_queries}</p>
          </div>
        </div>
        <div className="stat-card" style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <AlertTriangle size={32} color="#dc2626" />
          <div>
            <h3 style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280', textTransform: 'uppercase' }}>System Fallbacks</h3>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '1.875rem', fontWeight: 'bold', color: '#dc2626' }}>{data.overview.total_fallbacks}</p>
          </div>
        </div>
        <div className="stat-card" style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <CheckCircle size={32} color="#16a34a" />
          <div>
            <h3 style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280', textTransform: 'uppercase' }}>Success Rate</h3>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '1.875rem', fontWeight: 'bold', color: '#16a34a' }}>{data.overview.success_rate}%</p>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2.5rem' }}>
        
        {/* Time Series Chart */}
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb' }}>
          <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem', color: '#111827' }}>Hourly Query & User Volume</h2>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer>
              <LineChart data={data.time_series} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="hour" stroke="#6b7280" fontSize={12} tickLine={false} />
                <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Line name="Total Queries" type="monotone" dataKey="queries" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line name="Unique Users" type="monotone" dataKey="users" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Queries Table */}
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem', color: '#111827' }}>Most Frequent Queries</h2>
          <div className="table-responsive">
            <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: '#6b7280' }}>Query</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: '#6b7280' }}>Count</th>
                </tr>
              </thead>
              <tbody>
                {data.top_queries.map((q, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '1rem', color: '#111827', fontSize: '0.875rem' }}>{q._id}</td>
                    <td style={{ padding: '1rem', color: '#111827', fontSize: '0.875rem', fontWeight: 'bold' }}>{q.count}</td>
                  </tr>
                ))}
                {data.top_queries.length === 0 && (
                  <tr><td colSpan="2" style={{ padding: '1rem', textAlign: 'center', color: '#6b7280' }}>No queries recorded yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Fallbacks Table */}
      <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', color: '#dc2626' }}>Recent System Failures</h2>
        <p style={{ margin: '0 0 1.5rem 0', color: '#6b7280', fontSize: '0.875rem' }}>Queries where the AI failed to generate a response and triggered the fallback message.</p>
        <div className="table-responsive">
          <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#fef2f2', borderBottom: '1px solid #fca5a5' }}>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: '#991b1b' }}>Time</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: '#991b1b' }}>User Type</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: '#991b1b' }}>Failed Query</th>
              </tr>
            </thead>
            <tbody>
              {data.recent_failures.map((f, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '1rem', color: '#6b7280', fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
                    {new Date(f.timestamp).toLocaleString()}
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                    <span style={{ 
                      padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 'bold',
                      backgroundColor: f.is_guest ? '#f3f4f6' : '#dbeafe',
                      color: f.is_guest ? '#1f2937' : '#1e40af'
                    }}>
                      {f.is_guest ? 'Guest' : 'User'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', color: '#111827', fontSize: '0.875rem' }}>{f.query}</td>
                </tr>
              ))}
              {data.recent_failures.length === 0 && (
                <tr><td colSpan="3" style={{ padding: '1rem', textAlign: 'center', color: '#6b7280' }}>Great job! No system failures recorded recently.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Database Data Details Table */}
      <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb', overflow: 'hidden', marginTop: '2.5rem' }}>
        <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', color: '#111827' }}>User Database Details</h2>
        <p style={{ margin: '0 0 1.5rem 0', color: '#6b7280', fontSize: '0.875rem' }}>Detailed list of all registered users and their information.</p>
        <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
          <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f9fafb', zIndex: 1 }}>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: '#6b7280' }}>Name</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: '#6b7280' }}>Email</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: '#6b7280' }}>Mobile</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: '#6b7280' }}>Created At</th>
              </tr>
            </thead>
            <tbody>
              {summaries.length === 0 ? (
                <tr><td colSpan="4" style={{ padding: '1rem', textAlign: 'center', color: '#6b7280' }}>No users found.</td></tr>
              ) : (
                summaries.map((user, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '1rem', color: '#111827', fontSize: '0.875rem', fontWeight: '500' }}>{user.user_name}</td>
                    <td style={{ padding: '1rem', color: '#6b7280', fontSize: '0.875rem' }}>{user.user_email}</td>
                    <td style={{ padding: '1rem', color: '#6b7280', fontSize: '0.875rem' }}>{user.user_mobile}</td>
                    <td style={{ padding: '1rem', color: '#6b7280', fontSize: '0.875rem' }}>{new Date(user.created_at).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

export default Admin;
