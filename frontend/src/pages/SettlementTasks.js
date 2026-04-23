import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/api';
import { 
  ChevronRight, CheckCircle, Clock, MapPin, 
  Activity, Hash, History, ArrowLeft
} from 'lucide-react';

function SettlementTasks() {
  const { settlementName } = useParams();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSettlementTasks = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/get-tasks`); 
      const filtered = res.data.filter(t => t.location === settlementName);
      setTasks(filtered);
    } catch (e) { 
      console.error(e); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { fetchSettlementTasks(); }, [settlementName]);

  const openTasks = tasks.filter(t => t.status !== 'הושלם');
  const closedTasks = tasks.filter(t => t.status === 'הושלם');

  if (loading) return <div style={loadingStyle}>טוען נתונים...</div>;

  return (
    <div style={containerStyle}>
      
      {/* Header */}
      <header style={headerStyle}>
        <button onClick={() => navigate(-1)} style={backBtnStyle}>
          <ChevronRight size={18} /> חזרה
        </button>
        <div style={titleGroup}>
          <h1 style={mainTitle}>{settlementName}</h1>
          <p style={subTitle}>ניהול משימות ודיווחים</p>
        </div>
      </header>

      <div style={gridLayout}>
        {/* עמודת משימות פתוחות */}
        <div style={columnStyle}>
          <div style={columnLabel}>
            <Activity size={18} color="#3182ce" />
            <span>משימות לביצוע ({openTasks.length})</span>
          </div>
          
          <div style={listStyle}>
            {openTasks.length === 0 ? (
              <div style={emptyCard}>אין משימות פתוחות</div>
            ) : (
              openTasks.map(t => <TaskCard key={t.id} task={t} onClick={() => navigate(`/task/${t.id}`)} />)
            )}
          </div>
        </div>

        {/* עמודת היסטוריה */}
        <div style={columnStyle}>
          <div style={{...columnLabel, color: '#48bb78'}}>
            <History size={18} color="#48bb78" />
            <span>הושלמו לאחרונה ({closedTasks.length})</span>
          </div>

          <div style={listStyle}>
            {closedTasks.length === 0 ? (
              <div style={emptyCard}>טרם הושלמו משימות</div>
            ) : (
              closedTasks.map(t => <TaskCard key={t.id} task={t} isDone onClick={() => navigate(`/task/${t.id}`)} />)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const TaskCard = ({ task, isDone, onClick }) => {
  // הכותרת היא סוג המשימה (כפי ששמרנו ב-CreateTaskModal)
  return (
    <div style={taskCardStyle} onClick={onClick}>
      <div style={cardHeader}>
        {/* במקום תגית סוג, נציג כאן את העדיפות או סטטוס קטן */}
        <div style={{ display: 'flex', gap: '6px' }}>
            <span style={priorityBadge(task.priority, isDone)}>{task.priority}</span>
            {isDone && <span style={doneBadge}>הושלם</span>}
        </div>
        <ArrowLeft size={16} color="#cbd5e0" />
      </div>

      {/* הכותרת כעת מציגה את הסוג - בולט וגדול */}
      <h4 style={cardTitle}>{task.title || task.type}</h4>
      
      <div style={cardBody}>
        <div style={infoItem}>
          <MapPin size={14} />
          <span>{task.address || "כתובת לא צוינה"}</span>
        </div>
        
        {task.selected_meter_id && (
          <div style={meterTag}>
            <Hash size={12} />
            <span>מונה {task.selected_meter_id}</span>
            {task.meter_reading_done && <CheckCircle size={12} color="#48bb78" style={{marginRight:'auto'}} />}
          </div>
        )}
      </div>

      <div style={cardFooter}>
        <div style={dateGroup}>
          <Clock size={12} />
          <span>{isDone ? 'בוצע' : 'נפתח'}: {new Date(isDone ? task.completed_at : task.created_at).toLocaleDateString('he-IL')}</span>
        </div>
      </div>
    </div>
  );
};

// --- Styles ---

const containerStyle = { padding: '24px', direction: 'rtl', backgroundColor: '#fcfcfc', minHeight: '100vh' };
const headerStyle = { marginBottom: '32px', display: 'flex', flexDirection: 'column', gap: '12px' };
const titleGroup = { borderRight: '4px solid #3182ce', paddingRight: '16px' };
const mainTitle = { margin: 0, fontSize: '28px', fontWeight: '800', color: '#1a202c' };
const subTitle = { margin: 0, fontSize: '14px', color: '#718096' };
const gridLayout = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '40px' };
const columnStyle = { display: 'flex', flexDirection: 'column', gap: '20px' };
const columnLabel = { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: 'bold', borderBottom: '2px solid #edf2f7', paddingBottom: '10px' };
const listStyle = { display: 'flex', flexDirection: 'column', gap: '16px' };

const taskCardStyle = {
  backgroundColor: 'white',
  padding: '18px',
  borderRadius: '16px',
  border: '1px solid #e2e8f0',
  cursor: 'pointer',
  transition: 'transform 0.2s, box-shadow 0.2s',
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
};

const cardHeader = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' };
const cardTitle = { margin: '4px 0', fontSize: '18px', fontWeight: '800', color: '#2d3748' };
const cardBody = { display: 'flex', flexDirection: 'column', gap: '8px' };
const infoItem = { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#718096' };

const meterTag = {
  display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#ebf8ff',
  padding: '6px 10px', borderRadius: '8px', fontSize: '12px', color: '#2b6cb0', border: '1px solid #bee3f8'
};

const priorityBadge = (priority, isDone) => {
  const isUrgent = priority === 'דחוף מאוד' || priority === 'גבוהה';
  return {
    fontSize: '10px',
    fontWeight: 'bold',
    padding: '3px 8px',
    borderRadius: '20px',
    backgroundColor: isDone ? '#f7fafc' : (isUrgent ? '#fff5f5' : '#f0fff4'),
    color: isDone ? '#a0aec0' : (isUrgent ? '#e53e3e' : '#38a169'),
    border: `1px solid ${isDone ? '#e2e8f0' : (isUrgent ? '#feb2b2' : '#c6f6d5')}`
  };
};

const doneBadge = { fontSize: '10px', fontWeight: 'bold', padding: '3px 8px', borderRadius: '20px', backgroundColor: '#f0fdf4', color: '#166534', border: '1px solid #bcf0da' };
const cardFooter = { marginTop: '8px', paddingTop: '12px', borderTop: '1px solid #f7fafc' };
const dateGroup = { display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#a0aec0' };
const emptyCard = { padding: '40px', textAlign: 'center', color: '#a0aec0', fontSize: '14px', backgroundColor: '#f8fafc', borderRadius: '16px', border: '1px dashed #e2e8f0' };
const backBtnStyle = { display: 'flex', alignItems: 'center', gap: '4px', width: 'fit-content', border: 'none', background: '#edf2f7', color: '#4a5568', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' };
const loadingStyle = { padding: '50px', textAlign: 'center', fontSize: '18px', color: '#718096' };

export default SettlementTasks;