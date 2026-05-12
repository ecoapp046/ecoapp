import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/api';
import { useNavigate } from 'react-router-dom';
import { MapPin, ChevronLeft, Plus } from 'lucide-react';
import CreateTaskModal from './modal/CreateTaskModal';

function TasksList() {
  const [settlementStats, setSettlementStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [tasksRes, settlementsRes] = await Promise.all([
        api.get('/get-tasks'),
        api.get('/get-settlements')
      ]);

      const tasks = Array.isArray(tasksRes.data) ? tasksRes.data : [];
      const settlements = Array.isArray(settlementsRes.data) ? settlementsRes.data : [];

      const stats = {};
      
      settlements.forEach(s => {
        if (s.name) stats[s.name] = 0;
      });
      
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
  }, []);

  useEffect(() => { 
    fetchData(); 
  }, [fetchData]);

  return (
    <div style={containerStyle}>
      {/* Header Section */}
      <div style={headerContainerStyle}>
        <div>
          <h1 style={titleStyle}>ניהול משימות לפי יישובים</h1>
          <p style={subtitleStyle}>בחר יישוב לצפייה וניהול משימות</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} style={addBtnStyle}>
          <Plus size={20} /> משימה חדשה
        </button>
      </div>

      {loading ? (
        <div style={messageStyle}>טוען נתונים...</div>
      ) : Object.keys(settlementStats).length === 0 ? (
        <div style={messageStyle}>לא נמצאו יישובים במערכת</div>
      ) : (
        <div style={gridStyle}>
          {Object.entries(settlementStats).map(([name, count]) => (
            <div 
              key={name} 
              onClick={() => navigate(`/tasks/${name}`)} 
              style={settlementCardStyle}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={iconCircleStyle}>
                  <MapPin size={20} color="#3182ce" />
                </div>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#2D3748' }}>{name}</div>
                  <div style={{ 
                    fontSize: '13px', 
                    fontWeight: '600',
                    color: count > 0 ? '#E53E3E' : '#38A169' 
                  }}>
                    {count === 0 ? 'אין משימות פתוחות' : `${count} משימות פתוחות`}
                  </div>
                </div>
              </div>
              <ChevronLeft size={20} color="#cbd5e0" />
            </div>
          ))}
        </div>
      )}

      <CreateTaskModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onTaskCreated={fetchData} 
      />
    </div>
  );
}

// --- Styles ---

const containerStyle = { 
  padding: '30px', 
  direction: 'rtl', 
  backgroundColor: '#f7fafc', 
  minHeight: '100vh' 
};

const headerContainerStyle = { 
  display: 'flex', 
  justifyContent: 'space-between', 
  alignItems: 'center', 
  marginBottom: '30px' 
};

const titleStyle = { 
  fontSize: '28px', 
  fontWeight: 'bold', 
  margin: 0, 
  color: '#1a202c' 
};

const subtitleStyle = { 
  color: '#718096', 
  marginTop: '5px' 
};

const gridStyle = { 
  display: 'grid', 
  gap: '15px', 
  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' 
};

const settlementCardStyle = { 
  display: 'flex', 
  alignItems: 'center', 
  justifyContent: 'space-between', 
  padding: '20px', 
  backgroundColor: 'white', 
  borderRadius: '16px', 
  border: '1px solid #edf2f7', 
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
};

const iconCircleStyle = { 
  width: '40px', 
  height: '40px', 
  borderRadius: '50%', 
  backgroundColor: '#ebf8ff', 
  display: 'flex', 
  alignItems: 'center', 
  justifyContent: 'center' 
};

const addBtnStyle = { 
  backgroundColor: '#0083c2', 
  color: 'white', 
  border: 'none', 
  padding: '12px 24px', 
  borderRadius: '12px', 
  cursor: 'pointer', 
  display: 'flex', 
  alignItems: 'center', 
  gap: '8px', 
  fontWeight: 'bold',
  boxShadow: '0 4px 6px rgba(0, 131, 194, 0.2)'
};

const messageStyle = {
  textAlign: 'center',
  padding: '40px',
  color: '#718096',
  fontSize: '18px'
};

export default TasksList;