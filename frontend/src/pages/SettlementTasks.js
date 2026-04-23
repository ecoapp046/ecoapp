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
      
      {/* Header הנקי החדש */}
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

        {/* עמודת היסטוריה - ברורה וחדה */}
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
  return (
    <div style={taskCardStyle} onClick={onClick}>
      <div style={cardHeader}>
        <span style={typeTag(task.type, isDone)}>{task.type}</span>
        {task.priority === 'דחוף מאוד' && !isDone && <span style={urgentTag}>דחוף</span>}
      </div>

      <h4 style={cardTitle}>{task.title}</h4>
      
      <div style={cardBody}>
        <div style={infoItem}>
          <MapPin size={14} />
          <span>{task.address || "ללא כתובת"}</span>
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
          <span>{isDone ? 'הושלם' : 'נוצר'}: {new Date(isDone ? task.completed_at : task.created_at).toLocaleDateString('he-IL')}</span>
        </div>
        <ArrowLeft size={16} color="#cbd5e0" />
      </div>
    </div>
  );
};

// --- Styles (Clean & Modern) ---

const containerStyle = {
  padding: '24px',
  direction: 'rtl',
  backgroundColor: '#fcfcfc',
  minHeight: '100vh',
  fontFamily: 'system-ui, -apple-system, sans-serif'
};

const headerStyle = {
  marginBottom: '32px',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px'
};

const titleGroup = { borderRight: '4px solid #3182ce', paddingRight: '16px' };
const mainTitle = { margin: 0, fontSize: '28px', fontWeight: '800', color: '#1a202c' };
const subTitle = { margin: 0, fontSize: '14px', color: '#718096' };

const gridLayout = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
  gap: '40px'
};

const columnStyle = { display: 'flex', flexDirection: 'column', gap: '20px' };

const columnLabel = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontSize: '15px',
  fontWeight: 'bold',
  color: '#2d3748',
  paddingBottom: '10px',
  borderBottom: '2px solid #edf2f7'
};

const listStyle = { display: 'flex', flexDirection: 'column', gap: '16px' };

const taskCardStyle = {
  backgroundColor: 'white',
  padding: '16px',
  borderRadius: '12px',
  border: '1px solid #e2e8f0',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
};

const cardHeader = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const cardTitle = { margin: 0, fontSize: '16px', fontWeight: '700', color: '#2d3748' };
const cardBody = { display: 'flex', flexDirection: 'column', gap: '8px' };

const infoItem = { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#718096' };

const meterTag = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  backgroundColor: '#f7fafc',
  padding: '6px 10px',
  borderRadius: '6px',
  fontSize: '12px',
  color: '#4a5568',
  border: '1px solid #edf2f7'
};

const typeTag = (type, isDone) => ({
  fontSize: '11px',
  fontWeight: 'bold',
  padding: '4px 8px',
  borderRadius: '4px',
  backgroundColor: isDone ? '#f0fdf4' : (type === 'נזילה' ? '#fff5f5' : '#ebf8ff'),
  color: isDone ? '#166534' : (type === 'נזילה' ? '#c53030' : '#2b6cb0'),
});

const urgentTag = { backgroundColor: '#feb2b2', color: '#9b2c2c', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' };

const cardFooter = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingTop: '12px',
  borderTop: '1px solid #f7fafc'
};

const dateGroup = { display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#a0aec0' };

const emptyCard = { padding: '30px', textAlign: 'center', color: '#a0aec0', fontSize: '14px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px dashed #e2e8f0' };

const backBtnStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  width: 'fit-content',
  border: 'none',
  background: '#edf2f7',
  color: '#4a5568',
  padding: '6px 12px',
  borderRadius: '8px',
  cursor: 'pointer',
  fontSize: '13px',
  fontWeight: '600'
};

const loadingStyle = { padding: '50px', textAlign: 'center', fontSize: '18px', color: '#718096' };

export default SettlementTasks;