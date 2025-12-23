import { useState, useEffect } from 'react';
import AlertCard from '../components/AlertCard';
import { fetchAlerts, remediate } from '../api/codaApi';

function Dashboard() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await fetchAlerts();
      setAlerts(data);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  async function fix(docId) {
    try {
      await remediate(docId);
      await load();
    } catch (error) {
      console.error('Failed to remediate:', error);
    }
  }

  return (
    <div className="dashboard">
      <h1>Coda Security Dashboard</h1>
        <button onClick={async () => {
            setLoading(true);
            await fetch("/api/rescan", { method: "POST" });
            await load();
            }}>
            Run Scan
        </button>

      {loading && <p className="loading">Loading...</p>}
      <div className="alerts-container">
        {alerts.length === 0 && !loading && <p className="no-alerts">No alerts</p>}
        {alerts.map(alert => (
          <AlertCard
            key={alert.docId}
            alert={alert}
            onFix={fix}
          />
        ))}
      </div>
    </div>
  );
}

export default Dashboard;
