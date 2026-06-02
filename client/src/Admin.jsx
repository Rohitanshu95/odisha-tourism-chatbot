import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { Users, AlertTriangle, CheckCircle, BarChart2, Settings, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Admin.css';

function Admin() {
  const [data, setData] = useState(null);
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard');
  
  const today = new Date();
  const formatDate = (d) => d.toISOString().split('T')[0];
  const [filterDate, setFilterDate] = useState(formatDate(today));
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData(filterDate);
    
    // Poll for real-time updates every 10 seconds
    const intervalId = setInterval(() => {
      fetchDashboardData(filterDate, false);
    }, 10000);
    
    return () => clearInterval(intervalId);
  }, [filterDate]);

  const fetchDashboardData = async (selectedDate, showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);
      let queryParam = selectedDate ? `&start_date=${selectedDate}&end_date=${selectedDate}` : '';
      const analyticsRes = await axios.get(`http://localhost:8000/api/v1/admin/analytics?t=${new Date().getTime()}${queryParam}`);
      const summariesRes = await axios.get(`http://localhost:8000/api/v1/admin/summaries?t=${new Date().getTime()}${queryParam}`);

      setData(analyticsRes.data);
      setSummaries(summariesRes.data.summaries);
      if (showLoading) setLoading(false);
    } catch (err) {
      console.error("Failed to fetch admin data", err);
      setError("Failed to fetch real-time data from database.");
      if (showLoading) setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!summaries || summaries.length === 0) return;
    const headers = ['User Name', 'Email', 'Mobile', 'Created At'];
    const rows = summaries.map(s => [
      `"${s.user_name || ''}"`, `"${s.user_email || ''}"`, `"${s.user_mobile || ''}"`, `"${s.created_at || ''}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'odisha_chatbot_users.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleLogout = () => {
    navigate('/login');
  };

  if (loading) return <div className="admin-loading">INITIALIZING...</div>;
  if (error) return <div className="admin-error">{error}</div>;
  if (!data) return <div className="admin-error">SYSTEM FAILURE</div>;

  return (
    <div className="admin-layout">
      {/* Sidebar Navigation */}
      <aside className="admin-sidebar">
        <div className="admin-logo">
          SYS<span>/ADMIN</span>
        </div>
        <nav className="admin-nav">
          <a href="#" className={`admin-nav-item ${currentView === 'dashboard' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setCurrentView('dashboard'); }}>
            <BarChart2 size={20} /> Dashboard
          </a>
          <a href="#" className={`admin-nav-item ${currentView === 'users' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setCurrentView('users'); }}>
            <Users size={20} /> Users
          </a>
          <a href="#" className="admin-nav-item">
            <Settings size={20} /> Configuration
          </a>
        </nav>
        <button onClick={handleLogout} className="admin-logout">
          <LogOut size={20} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} /> 
          Back to Login
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="admin-main">
        {/* Header */}
        <header className="admin-header">
          <div className="admin-header-title">
            <h1>COMMAND CENTER</h1>
            <p>Odisha Tourism Chatbot Intelligence & Analytics.</p>
          </div>
          <div className="admin-actions">
            <input 
              type="date" 
              className="admin-date-picker"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
            <button onClick={exportToCSV} className="admin-btn-primary">
              EXPORT DATA
            </button>
          </div>
        </header>

        {currentView === 'dashboard' ? (
          <>
            {/* Stats Grid */}
            <section className="admin-stats-grid">
          <div className="stat-card-brutal">
            <div className="stat-header">
              <h3 className="stat-title">Identities</h3>
              <Users size={24} color="var(--admin-text-muted)" />
            </div>
            <p className="stat-value">{data.overview.total_users ?? summaries.length}</p>
          </div>
          <div className="stat-card-brutal">
            <div className="stat-header">
              <h3 className="stat-title">Total Queries</h3>
              <BarChart2 size={24} color="var(--admin-text-muted)" />
            </div>
            <p className="stat-value">{data.overview.total_queries}</p>
          </div>
          <div className="stat-card-brutal danger">
            <div className="stat-header">
              <h3 className="stat-title">System Fallbacks</h3>
              <AlertTriangle size={24} color="var(--admin-danger)" />
            </div>
            <p className="stat-value" style={{ color: 'var(--admin-danger)' }}>{data.overview.total_fallbacks}</p>
          </div>
          <div className="stat-card-brutal">
            <div className="stat-header">
              <h3 className="stat-title">Success Rate</h3>
              <CheckCircle size={24} color="var(--admin-accent)" />
            </div>
            <p className="stat-value" style={{ color: 'var(--admin-accent)' }}>{data.overview.success_rate}%</p>
          </div>
        </section>

        {/* Charts Row */}
        <section className="admin-charts-row">
          <div className="admin-panel-box">
            <h2 className="admin-panel-title">Volume Matrix (Hourly)</h2>
            <div style={{ width: '100%', height: '300px' }}>
              <ResponsiveContainer>
                <LineChart data={data.time_series} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                  <XAxis dataKey="hour" stroke="#555" fontSize={12} tickLine={false} />
                  <YAxis stroke="#555" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', color: '#000', borderRadius: '0' }} 
                    itemStyle={{ color: '#0033ff' }}
                  />
                  <Line name="Queries" type="stepAfter" dataKey="queries" stroke="#0033ff" strokeWidth={2} dot={{ r: 4, fill: '#fff', stroke: '#0033ff' }} activeDot={{ r: 6 }} />
                  <Line name="Users" type="stepAfter" dataKey="users" stroke="#666" strokeWidth={2} dot={{ r: 4, fill: '#fff', stroke: '#666' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="admin-panel-box" style={{ overflowY: 'auto', maxHeight: '400px' }}>
            <h2 className="admin-panel-title">Top Vectors</h2>
            <div className="admin-table-wrapper">
              <table className="admin-brutal-table">
                <thead>
                  <tr>
                    <th>Query Target</th>
                    <th>Vol</th>
                  </tr>
                </thead>
                <tbody>
                  {data.top_queries.map((q, idx) => (
                    <tr key={idx}>
                      <td>{q._id}</td>
                      <td style={{ fontWeight: 800, color: 'var(--admin-accent)' }}>{q.count}</td>
                    </tr>
                  ))}
                  {data.top_queries.length === 0 && (
                    <tr><td colSpan="2" style={{ textAlign: 'center', color: '#888' }}>NO DATA</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Fallbacks Table */}
        <section className="admin-panel-box">
          <h2 className="admin-panel-title" style={{ color: 'var(--admin-danger)', borderBottomColor: 'var(--admin-danger)' }}>Critical Failures</h2>
          <div className="admin-table-wrapper">
            <table className="admin-brutal-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Classification</th>
                  <th>Failed Prompt</th>
                </tr>
              </thead>
              <tbody>
                {data.recent_failures.map((f, idx) => (
                  <tr key={idx}>
                    <td style={{ color: 'var(--admin-text-muted)' }}>{new Date(f.timestamp).toLocaleString()}</td>
                    <td>
                      <span className={`badge-brutal ${f.is_guest ? 'badge-guest' : 'badge-user'}`}>
                        {f.is_guest ? 'GUEST' : 'AUTH'}
                      </span>
                    </td>
                    <td>{f.query}</td>
                  </tr>
                ))}
                {data.recent_failures.length === 0 && (
                  <tr><td colSpan="3" style={{ textAlign: 'center', color: 'var(--admin-accent)', fontWeight: 'bold' }}>ALL SYSTEMS NOMINAL. ZERO FAILURES.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
        </>
        ) : (
          /* Users View */
          <section className="admin-panel-box">
            <h2 className="admin-panel-title">User Registry</h2>
            <div className="admin-table-wrapper" style={{ maxHeight: '600px', overflowY: 'auto' }}>
              <table className="admin-brutal-table">
                <thead style={{ position: 'sticky', top: 0, backgroundColor: 'var(--admin-panel)' }}>
                  <tr>
                    <th>Identity Name</th>
                    <th>Email</th>
                    <th>Mobile</th>
                    <th>Registered On</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from(new Map(summaries.filter(s => s.user_email && s.user_email !== "Guest").map(user => [user.user_email, user])).values()).map((user, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600 }}>{user.user_name}</td>
                      <td>{user.user_email}</td>
                      <td>{user.user_mobile}</td>
                      <td style={{ color: 'var(--admin-text-muted)' }}>{new Date(user.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                  {summaries.filter(s => s.user_email && s.user_email !== "Guest").length === 0 && (
                    <tr><td colSpan="4" style={{ textAlign: 'center', color: '#888' }}>NO USERS REGISTERED ON THIS DATE</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default Admin;
