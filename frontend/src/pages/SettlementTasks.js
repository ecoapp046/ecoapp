import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/api';
import { 
  ChevronRight, CheckCircle, Clock, MapPin, 
  Activity, Hash, History, ArrowLeft, Eye
} from 'lucide-react';

function SettlementTasks() {
  const { settlementName } = useParams();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSettlementTasks = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/get-tasks`); 
      // סינון המשימות לפי היישוב שנבחר ב-URL
      const filtered = res.data.filter(t => t.location === settlementName);
      setTasks(filtered);
    } catch (e) { 
      console.error("Error fetching tasks:", e); 
    } finally { 
      setLoading(false); 
    }
  }, [settlementName]);

  useEffect(() => { 
    fetchSettlementTasks(); 
  }, [fetchSettlementTasks]);

  const openTasks = tasks.filter(t => t.status === 'פתוח');
  const pendingApprovalTasks = tasks.filter(t => t.status === 'ממתין לאישור');
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
          <p style={subTitle}>ניהול משימות בשלושה שלבים</p>
        </div>
      </header>

      <div style={gridLayout}>
        
        <div style={columnStyle}>
          <div style={columnLabel}>
            <Activity size={18} color="#3182ce" />
            <span>לביצוע ({openTasks.length})</span>
          </div>
          <div style={listStyle}>
            {openTasks.length === 0 ? (
              <div style={emptyCard}>אין משימות פתוחות</div>
            ) : (
              openTasks.map(t => (
                <TaskCard 
                  key={t.id} 
                  task={t} 
                  onClick={() => navigate(`/task/${t.id}`)} 
                />
              ))
            )}
          </div>
        </div>

        <div style={columnStyle}>
          <div style={{...columnLabel, color: '#d69e2e', borderBottomColor: '#f6e05e'}}>
            <Eye size={18} color="#d69e2e" />
            <span>ממתין לאישור משרד ({pendingApprovalTasks.length})</span>
          </div>
          <div style={listStyle}>
            {pendingApprovalTasks.length === 0 ? (
              <div style={emptyCard}>אין משימות הממתינות לאישור</div>
            ) : (
              pendingApprovalTasks.map(t => (
                <TaskCard 
                  key={t.id} 
                  task={t} 
                  isPending 
                  onClick={() => navigate(`/task/${t.id}`)} 
                />
              ))
            )}
          </div>
        </div>

        <div style={columnStyle}>
          <div style={{...columnLabel, color: '#48bb78'}}>
            <History size={18} color="#48bb78" />
            <span>הושלמו ({closedTasks.length})</span>
          </div>
          <div style={listStyle}>
            {closedTasks.length === 0 ? (
              <div style={emptyCard}>טרם הושלמו משימות</div>
            ) : (
              closedTasks.map(t => (
                <TaskCard 
                  key={t.id} 
                  task={t} 
                  isDone 
                  onClick={() => navigate(`/task/${t.id}`)} 
                />
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

const TaskCard = ({ task, isDone, isPending, onClick }) => {
  // פונקציית עזר להצגת תאריך רלוונטי לפי סטטוס
  const getDateLabel = () => {
    if (isDone && task.completed_at) {
      return `נסגר ב: ${new Date(task.completed_at).toLocaleDateString('he-IL')}`;
    }
    if (isPending && task.reported_at) {
      return `דווח ב: ${new Date(task.reported_at).toLocaleDateString('he-IL')}`;
    }
    return `נפתח ב: ${new Date(task.created_at).toLocaleDateString('he-IL')}`;
  };

  return (
    <div style={{
      ...taskCardStyle, 
      borderRight: isPending ? '4px solid #ecc94b' : isDone ? '4px solid #48bb78' : '1px solid #e2e8f0'
    }} onClick={onClick}>
      <div style={cardHeader}>
        <div style={{ display: 'flex', gap: '6px' }}>
            <span style={priorityBadge(task.priority, isDone)}>{task.priority}</span>
            {isPending && <span style={pendingBadge}>בוצע בשטח</span>}
            {isDone && <span style={doneBadge}>מאושר</span>}
        </div>
        <ArrowLeft size={16} color="#cbd5e0" />
      </div>

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
          <span>{getDateLabel()}</span>
        </div>
      </div>
    </div>
  );
};

// --- Styles ---
const containerStyle = { padding: '20px', direction: 'rtl', backgroundColor: '#f7fafc', minHeight: '100vh' };
const headerStyle = { marginBottom: '25px', display: 'flex', flexDirection: 'column', gap: '10px' };
const titleGroup = { borderRight: '4px solid #3182ce', paddingRight: '16px' };
const mainTitle = { margin: 0, fontSize: '24px', fontWeight: '800', color: '#1a202c' };
const subTitle = { margin: 0, fontSize: '13px', color: '#718096' };

const gridLayout = { 
  display: 'grid', 
  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
  gap: '20px' 
};

const columnStyle = { display: 'flex', flexDirection: 'column', gap: '15px' };
const columnLabel = { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 'bold', borderBottom: '2px solid #edf2f7', paddingBottom: '8px' };
const listStyle = { display: 'flex', flexDirection: 'column', gap: '12px' };

const taskCardStyle = {
  backgroundColor: 'white',
  padding: '15px',
  borderRadius: '12px',
  border: '1px solid #e2e8f0',
  cursor: 'pointer',
  transition: 'all 0.2s',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
};

const cardHeader = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' };
const cardTitle = { margin: '2px 0', fontSize: '16px', fontWeight: 'bold', color: '#2d3748' };
const cardBody = { display: 'flex', flexDirection: 'column', gap: '6px' };
const infoItem = { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#718096' };
const meterTag = { display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#ebf8ff', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', color: '#2b6cb0', border: '1px solid #bee3f8' };

const priorityBadge = (priority, isDone) => {
  const isUrgent = priority === 'דחוף מאוד' || priority === 'גבוהה';
  return {
    fontSize: '10px',
    fontWeight: 'bold',
    padding: '2px 8px',
    borderRadius: '12px',
    backgroundColor: isDone ? '#f7fafc' : (isUrgent ? '#fff5f5' : '#f0fff4'),
    color: isDone ? '#a0aec0' : (isUrgent ? '#e53e3e' : '#38a169'),
    border: `1px solid ${isDone ? '#e2e8f0' : (isUrgent ? '#feb2b2' : '#c6f6d5')}`
  };
};

const pendingBadge = { fontSize: '10px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '12px', backgroundColor: '#fffaf0', color: '#975a16', border: '1px solid #fbd38d' };
const doneBadge = { fontSize: '10px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '12px', backgroundColor: '#f0fdf4', color: '#166534', border: '1px solid #bcf0da' };
const cardFooter = { marginTop: '5px', paddingTop: '10px', borderTop: '1px solid #f7fafc' };
const dateGroup = { display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#a0aec0' };
const emptyCard = { padding: '20px', textAlign: 'center', color: '#a0aec0', fontSize: '13px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px dashed #e2e8f0' };
const backBtnStyle = { display: 'flex', alignItems: 'center', gap: '4px', width: 'fit-content', border: 'none', background: 'white', color: '#4a5568', padding: '5px 10px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' };
const loadingStyle = { padding: '50px', textAlign: 'center', fontSize: '16px', color: '#718096' };

export default SettlementTasks;