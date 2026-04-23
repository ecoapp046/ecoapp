import React, { useState, useEffect } from 'react';
import api from '../api/api';
import { useNavigate } from 'react-router-dom';
import { MapPin, ChevronLeft, Plus } from 'lucide-react';
import CreateTaskModal from './modal/CreateTaskModal';

function TasksList() {
  const [settlementStats, setSettlementStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tasksRes, settlementsRes] = await Promise.all([
        api.get('/get-tasks'),
        api.get('/get-settlements')
      ]);

      const tasks = tasksRes.data;
      const settlements = settlementsRes.data;

      // חישוב משימות פתוחות לכל יישוב
      const stats = {};
      settlements.forEach(s => stats[s.name] = 0);
      
      tasks.forEach(task => {
        if (task.status !== 'הושלם' && task.location) {
          stats[task.location] = (stats[task.location] || 0) + 1;
        }
      });

      setSettlementStats(stats);
    } catch (e) {
      console.error("Error fetching data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  return (
    <div style={{ padding: '30px', direction: 'rtl', backgroundColor: '#f7fafc', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: 0 }}>ניהול משימות לפי יישובים</h1>
          <p style={{ color: '#718096' }}>בחר יישוב לצפייה וניהול משימות</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} style={addBtnStyle}>
          <Plus size={20} /> משימה חדשה
        </button>
      </div>

      {loading ? <p>טוען נתונים...</p> : (
        <div style={{ display: 'grid', gap: '15px', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
          {Object.entries(settlementStats).map(([name, count]) => (
            <div key={name} onClick={() => navigate(`/tasks/${name}`)} style={settlementCardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={iconCircleStyle}><MapPin size={20} color="#3182ce" /></div>
                <div>
                  <div style={{ fontWeight: 'bold' }}>{name}</div>
                  <div style={{ fontSize: '13px', color: count > 0 ? '#e53e3e' : '#38a169' }}>
                    {count} משימות פתוחות
                  </div>
                </div>
              </div>
              <ChevronLeft size={20} color="#cbd5e0" />
            </div>
          ))}
        </div>
      )}
      <CreateTaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onTaskCreated={fetchData} />
    </div>
  );
}

// סטייל מקוצר (השתמש בסטיילים הקודמים שלך)
const settlementCardStyle = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px', backgroundColor: 'white', borderRadius: '16px', border: '1px solid #edf2f7', cursor: 'pointer' };
const iconCircleStyle = { width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#ebf8ff', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const addBtnStyle = { backgroundColor: '#0083c2', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' };

export default TasksList;