import React, { useState, useEffect } from 'react';
import api from '../api/api';
import { useNavigate } from 'react-router-dom';
import { 
  AlertCircle, 
  PlusCircle, 
  ClipboardList,
  MapPin,
  ChevronLeft
} from 'lucide-react';
import { useIsMobile } from '../hooks/useIsMobile';

const Dashboard = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [alertsBySettlement, setAlertsBySettlement] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await api.get('/get-meters');
        const meters = res.data;
        
        // קיבוץ תקלות לפי יישוב
        const grouped = meters.reduce((acc, meter) => {
          if (meter.status === 'תקול') {
            const settlement = meter.settlement || 'ללא יישוב';
            acc[settlement] = (acc[settlement] || 0) + 1;
          }
          return acc;
        }, {});

        setAlertsBySettlement(grouped);
      } catch (error) {
        console.error("שגיאה בטעינת נתונים לדשבורד:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAlerts();
  }, []);

  return (
    <div style={{...containerStyle, padding: isMobile ? '15px' : '30px'}}>
      <header style={headerStyle}>
        <h1 style={{...titleStyle, fontSize: isMobile ? '24px' : '28px'}}>ניהול תקלות לפי יישובים</h1>
        <p style={subtitleStyle}>מרכז בקרה ותפעול שטח</p>
      </header>

      {/* חלק הפעולות המהירות - נשאר למעלה לגישה נוחה */}
      <div style={cardStyle}>
        <h3 style={cardTitleStyle}>פעולות מהירות</h3>
        <div style={{
          ...actionsGridStyle, 
          flexDirection: isMobile ? 'column' : 'row'
        }}>
          <button onClick={() => navigate('/meters')} style={actionButtonStyle}>
            <PlusCircle size={20} /> הוספת קריאה/מונה
          </button>
          <button onClick={() => navigate('/technician-report')} style={actionButtonStyle}>
            <ClipboardList size={20} /> דיווח מהשטח
          </button>
        </div>
      </div>

      <h3 style={{...cardTitleStyle, marginTop: '30px'}}>תקלות פתוחות</h3>
      
      {loading ? (
        <p>טוען נתונים...</p>
      ) : Object.keys(alertsBySettlement).length > 0 ? (
        <div style={{
          ...settlementsGridStyle, 
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(250px, 1fr))'
        }}>
          {Object.entries(alertsBySettlement).map(([name, count]) => (
            <SettlementCard 
              key={name}
              name={name}
              count={count}
              onClick={() => navigate(`/alerts/${name}`)} // ניתוב לדף תקלות יישוב
            />
          ))}
        </div>
      ) : (
        <div style={noAlertsStyle}>
          <AlertCircle size={40} color="#38a169" />
          <p>אין תקלות פתוחות כרגע. עבודה טובה!</p>
        </div>
      )}
    </div>
  );
};

// רכיב כרטיס יישוב
const SettlementCard = ({ name, count, onClick }) => (
  <div onClick={onClick} style={settlementCardStyle}>
    <div style={settlementInfoStyle}>
      <div style={iconCircleStyle}>
        <MapPin size={20} color="#3182ce" />
      </div>
      <div>
        <div style={settlementNameStyle}>{name}</div>
        <div style={settlementCountStyle}>{count} תקלות פתוחות</div>
      </div>
    </div>
    <ChevronLeft size={20} color="#cbd5e0" />
  </div>
);

// --- Styles ---
const containerStyle = { direction: 'rtl', minHeight: '100vh', backgroundColor: '#f7fafc', boxSizing: 'border-box' };
const headerStyle = { marginBottom: '25px' };
const titleStyle = { fontWeight: 'bold', color: '#2d3748', margin: 0 };
const subtitleStyle = { color: '#718096', marginTop: '5px', fontSize: '14px' };
const cardStyle = { backgroundColor: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', border: '1px solid #edf2f7' };
const cardTitleStyle = { fontSize: '18px', fontWeight: 'bold', marginBottom: '15px', color: '#2d3748' };
const actionsGridStyle = { display: 'flex', gap: '15px' };
const actionButtonStyle = { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', cursor: 'pointer', fontWeight: '600', color: '#2d3748', fontSize: '14px' };

const settlementsGridStyle = { display: 'grid', gap: '15px' };
const settlementCardStyle = { 
  display: 'flex', 
  alignItems: 'center', 
  justifyContent: 'space-between', 
  padding: '20px', 
  backgroundColor: 'white', 
  borderRadius: '16px', 
  boxShadow: '0 2px 4px rgba(0,0,0,0.02)', 
  border: '1px solid #edf2f7',
  cursor: 'pointer',
  transition: 'transform 0.2s, box-shadow 0.2s'
};

const settlementInfoStyle = { display: 'flex', alignItems: 'center', gap: '15px' };
const iconCircleStyle = { width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#ebf8ff', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const settlementNameStyle = { fontWeight: 'bold', fontSize: '16px', color: '#2d3748' };
const settlementCountStyle = { fontSize: '13px', color: '#e53e3e', fontWeight: '500' };
const noAlertsStyle = { textAlign: 'center', padding: '40px', backgroundColor: 'white', borderRadius: '16px', color: '#718096' };

export default Dashboard;