import React, { useState, useEffect } from 'react';
import api from '../api/api'; // הייבוא החדש שלך
import { useNavigate } from 'react-router-dom';
import { 
  Droplets, 
  Users, 
  AlertCircle, 
  TrendingUp, 
  PlusCircle, 
  ClipboardList 
} from 'lucide-react';
import { useIsMobile } from '../hooks/useIsMobile';

const Dashboard = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [stats, setStats] = useState({
    totalMeters: 0,
    activeMeters: 0,
    alerts: 0,
    monthlyConsumption: '1,240' 
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // עכשיו משתמשים ב-api.get ולא צריך כתובת מלאה
        const res = await api.get('/get-meters');
        const meters = res.data;
        
        setStats(prev => ({
          ...prev,
          totalMeters: meters.length,
          activeMeters: meters.filter(m => m.status === 'פעיל').length,
          alerts: meters.filter(m => m.status === 'תקול').length
        }));
      } catch (error) {
        console.error("שגיאה בטעינת נתונים לדשבורד:", error);
      }
    };
    fetchStats();
  }, []);

  return (
    <div style={{...containerStyle, padding: isMobile ? '15px' : '30px'}}>
      <header style={headerStyle}>
        <h1 style={{...titleStyle, fontSize: isMobile ? '24px' : '28px'}}>סקירה כללית</h1>
        <p style={subtitleStyle}>ברוך הבא למערכת ניהול המים.</p>
      </header>

      <div style={{
        ...statsGridStyle, 
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))'
      }}>
        <StatCard 
          icon={<Droplets color="#3182ce" />} 
          label="סה-כ מונים" 
          value={stats.totalMeters} 
          color="#ebf8ff" 
        />
        <StatCard 
          icon={<Users color="#38a169" />} 
          label="מונים פעילים" 
          value={stats.activeMeters} 
          color="#f0fff4" 
        />
        <StatCard 
          icon={<AlertCircle color="#e53e3e" />} 
          label="תקלות פתוחות" 
          value={stats.alerts} 
          color="#fff5f5" 
        />
        <StatCard 
          icon={<TrendingUp color="#805ad5" />} 
          label='צריכה חודשית (קו"ב)' 
          value={stats.monthlyConsumption} 
          color="#faf5ff" 
        />
      </div>

      <div style={{
        ...contentGridStyle, 
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr'
      }}>
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

        <div style={cardStyle}>
          <h3 style={cardTitleStyle}>עדכונים אחרונים</h3>
          <div style={updateItemStyle}>
            <div style={dotStyle}></div>
            <span>המערכת סונכרנה בהצלחה מול השרת.</span>
          </div>
          <div style={updateItemStyle}>
            <div style={dotStyle}></div>
            <span>לא זוהו חריגות צריכה ב-24 השעות האחרונות.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// רכיב פנימי לכרטיס סטטיסטיקה
const StatCard = ({ icon, label, value, color }) => (
  <div style={statCardStyle}>
    <div style={{ ...iconContainerStyle, backgroundColor: color }}>
      {icon}
    </div>
    <div>
      <div style={statLabelStyle}>{label}</div>
      <div style={statValueStyle}>{value}</div>
    </div>
  </div>
);

// --- Styles ---
const containerStyle = { direction: 'rtl', minHeight: '100vh', backgroundColor: '#f7fafc', boxSizing: 'border-box' };
const headerStyle = { marginBottom: '25px' };
const titleStyle = { fontWeight: 'bold', color: '#2d3748', margin: 0 };
const subtitleStyle = { color: '#718096', marginTop: '5px', fontSize: '14px' };
const statsGridStyle = { display: 'grid', gap: '20px', marginBottom: '30px' };
const statCardStyle = { padding: '20px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '15px', backgroundColor: 'white', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', border: '1px solid #edf2f7' };
const iconContainerStyle = { width: '50px', height: '50px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 };
const statLabelStyle = { fontSize: '13px', color: '#718096', fontWeight: '500' };
const statValueStyle = { fontSize: '22px', fontWeight: 'bold', color: '#2d3748' };
const contentGridStyle = { display: 'grid', gap: '20px' };
const cardStyle = { backgroundColor: 'white', padding: '25px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', border: '1px solid #edf2f7', boxSizing: 'border-box' };
const cardTitleStyle = { fontSize: '18px', fontWeight: 'bold', marginBottom: '20px', color: '#2d3748' };
const actionsGridStyle = { display: 'flex', gap: '15px' };
const actionButtonStyle = { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', cursor: 'pointer', fontWeight: '600', color: '#2d3748', fontSize: '14px' };
const updateItemStyle = { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', fontSize: '13px', color: '#4a5568' };
const dotStyle = { width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3182ce', flexShrink: 0 };

export default Dashboard;