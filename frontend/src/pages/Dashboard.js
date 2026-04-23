import React, { useState, useEffect } from 'react';
import api from '../api/api';
import { useNavigate } from 'react-router-dom';
import { 
  CheckSquare, 
  PlusCircle, 
  ClipboardList,
  MapPin,
  ChevronLeft,
  LayoutDashboard
} from 'lucide-react';
import { useIsMobile } from '../hooks/useIsMobile';

const Dashboard = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [tasksBySettlement, setTasksBySettlement] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // שינוי מקור הנתונים ל-get-tasks כדי לקבל את המשימות האמיתיות
        const res = await api.get('/get-tasks');
        const tasks = res.data;
        
        // קיבוץ משימות שאינן "הושלם" לפי יישוב
        const grouped = tasks.reduce((acc, task) => {
          if (task.status !== 'הושלם') {
            const settlement = task.location || 'ללא יישוב';
            acc[settlement] = (acc[settlement] || 0) + 1;
          }
          return acc;
        }, {});

        setTasksBySettlement(grouped);
      } catch (error) {
        console.error("שגיאה בטעינת נתונים לדשבורד:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div style={{...containerStyle, padding: isMobile ? '15px' : '30px'}}>
      <header style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <LayoutDashboard size={24} color="#0083c2" />
            <h1 style={{...titleStyle, fontSize: isMobile ? '24px' : '28px'}}>דשבורד תפעולי</h1>
        </div>
        <p style={subtitleStyle}>ריכוז משימות פתוחות וניהול שטח</p>
      </header>

      <h3 style={{...cardTitleStyle, marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px'}}>
        סטטוס משימות לפי יישובים
      </h3>
      
      {loading ? (
        <p>טוען נתונים...</p>
      ) : Object.keys(tasksBySettlement).length > 0 ? (
        <div style={{
          ...settlementsGridStyle, 
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))',
          marginBottom: '30px'
        }}>
          {Object.entries(tasksBySettlement).map(([name, count]) => (
            <SettlementCard 
              key={name}
              name={name}
              count={count}
              onClick={() => navigate(`/tasks/${name}`)} 
            />
          ))}
        </div>
      ) : (
        <div style={{...noTasksStyle, marginBottom: '30px'}}>
          <CheckSquare size={40} color="#38a169" />
          <p style={{ fontWeight: '600', marginTop: '10px' }}>אין משימות פתוחות!</p>
          <p style={{ fontSize: '13px', margin: 0 }}>כל המשימות ביישובים הושלמו בהצלחה.</p>
        </div>
      )}

      <div style={cardStyle}>
        <h3 style={cardTitleStyle}>פעולות מהירות</h3>
        <div style={{
          ...actionsGridStyle, 
          flexDirection: isMobile ? 'column' : 'row'
        }}>
          <button onClick={() => navigate('/meters')} style={actionButtonStyle}>
            <PlusCircle size={20} color="#0083c2" /> הוספת קריאה/מונה
          </button>
          <button onClick={() => navigate('/technician-report')} style={actionButtonStyle}>
            <ClipboardList size={20} color="#0083c2" /> דיווח מהשטח
          </button>
        </div>
      </div>
    </div>
  );
};

const SettlementCard = ({ name, count, onClick }) => (
  <div 
    onClick={onClick} 
    style={settlementCardStyle}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-3px)';
      e.currentTarget.style.boxShadow = '0 8px 15px rgba(0,0,0,0.08)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)';
    }}
  >
    <div style={settlementInfoStyle}>
      <div style={iconCircleStyle}>
        <MapPin size={20} color="#3182ce" />
      </div>
      <div>
        <div style={settlementNameStyle}>{name}</div>
        <div style={{...settlementCountStyle, color: count > 3 ? '#e53e3e' : '#3182ce'}}>
            {count} משימות פתוחות
        </div>
      </div>
    </div>
    <ChevronLeft size={20} color="#cbd5e0" />
  </div>
);

// --- Styles (נשארים זהים עם שיפור קטן לכרטיס) ---
const containerStyle = { direction: 'rtl', minHeight: '100vh', backgroundColor: '#f7fafc', boxSizing: 'border-box' };
const headerStyle = { marginBottom: '25px' };
const titleStyle = { fontWeight: 'bold', color: '#1a202c', margin: 0 };
const subtitleStyle = { color: '#718096', marginTop: '5px', fontSize: '14px' };
const cardStyle = { backgroundColor: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', border: '1px solid #edf2f7' };
const cardTitleStyle = { fontSize: '17px', fontWeight: 'bold', marginBottom: '15px', color: '#2d3748' };
const actionsGridStyle = { display: 'flex', gap: '15px' };
const actionButtonStyle = { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: 'white', cursor: 'pointer', fontWeight: '600', color: '#2d3748', fontSize: '14px', transition: 'all 0.2s' };

const settlementsGridStyle = { display: 'grid', gap: '15px' };
const settlementCardStyle = { 
  display: 'flex', 
  alignItems: 'center', 
  justifyContent: 'space-between', 
  padding: '18px', 
  backgroundColor: 'white', 
  borderRadius: '16px', 
  boxShadow: '0 2px 4px rgba(0,0,0,0.02)', 
  border: '1px solid #edf2f7',
  cursor: 'pointer',
  transition: 'all 0.2s ease-in-out'
};

const settlementInfoStyle = { display: 'flex', alignItems: 'center', gap: '15px' };
const iconCircleStyle = { width: '42px', height: '42px', borderRadius: '12px', backgroundColor: '#ebf8ff', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const settlementNameStyle = { fontWeight: 'bold', fontSize: '16px', color: '#2d3748' };
const settlementCountStyle = { fontSize: '13px', fontWeight: '600' };
const noTasksStyle = { textAlign: 'center', padding: '40px', backgroundColor: '#f0fff4', borderRadius: '16px', color: '#276749', border: '1px solid #c6f6d5' };

export default Dashboard;