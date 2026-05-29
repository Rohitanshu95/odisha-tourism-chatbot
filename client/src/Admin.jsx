import { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, FileText, Activity } from 'lucide-react';
import './Admin.css';

function Admin() {
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSummaries = async () => {
      try {
        const response = await axios.get(`http://localhost:8000/api/v1/admin/summaries?t=${new Date().getTime()}`);
        setSummaries(response.data.summaries);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch admin data", err);
        setError("Failed to load dashboard data. Ensure backend is running.");
        setLoading(false);
      }
    };

    fetchSummaries();
  }, []);

  if (loading) {
    return <div className="admin-loading">Loading Dashboard...</div>;
  }

  if (error) {
    return <div className="admin-error">{error}</div>;
  }

  return (
    <div className="admin-container">
      <header className="admin-header">
        <h1>Odisha Tourism Analytics</h1>
        <div className="admin-stats">
          <div className="stat-card">
            <Users size={24} color="#0b5fff" />
            <div>
              <h3>Total Sessions</h3>
              <p>{summaries.length}</p>
            </div>
          </div>
          <div className="stat-card">
            <Activity size={24} color="#28a745" />
            <div>
              <h3>System Status</h3>
              <p>Online</p>
            </div>
          </div>
        </div>
      </header>

      <main className="admin-main">
        <h2>Recent Chat Summaries</h2>
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User Name</th>
                <th>Email</th>
                <th>Mobile</th>
                <th>Chat Summary</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {summaries.length === 0 ? (
                <tr>
                  <td colSpan="5" className="empty-state">No chat summaries found yet.</td>
                </tr>
              ) : (
                summaries.map((s) => (
                  <tr key={s._id}>
                    <td>{s.user_name}</td>
                    <td>{s.user_email || 'Guest'}</td>
                    <td>{s.user_mobile}</td>
                    <td className="summary-cell">{s.summary}</td>
                    <td>{new Date(s.created_at).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

export default Admin;
