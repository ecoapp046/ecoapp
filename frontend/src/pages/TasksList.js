import React, { useState, useEffect } from 'react';
import api from '../api/api'; // ייבוא ה-instance של axios
import { Plus, CheckCircle, Clock, Trash2, MapPin, Search } from 'lucide-react';
import CreateTaskModal from './modal/CreateTaskModal';
import { useIsMobile } from '../hooks/useIsMobile';

function TasksList() {
  const isMobile = useIsMobile();
  const [tasks, setTasks] = useState([]);
  const [settlements, setSettlements] = useState([]); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSettlement, setSelectedSettlement] = useState('הכל');
  const [selectedStatus, setSelectedStatus] = useState('הכל');

  useEffect(() => {
    fetchTasks();
    fetchSettlements();
  }, []);

  const fetchTasks = async () => {
    try {
      // שימוש בנתיב יחסי דרך api
      const res = await api.get('/get-tasks');
      setTasks(res.data);
    } catch (e) { console.error("Error fetching tasks", e); }
  };

  const fetchSettlements = async () => {
    try {
      const res = await api.get('/get-settlements');
      setSettlements(res.data);
    } catch (e) { console.error("Error fetching settlements", e); }
  };

  const deleteTask = async (taskId) => {
    if (window.confirm("למחוק משימה זו?")) {
      try {
        await api.delete(`/delete-task/${taskId}`);
        fetchTasks();
      } catch (e) { alert("שגיאה במחיקה"); }
    }
  };

  const toggleStatus = async (taskId, currentStatus) => {
    const newStatus = currentStatus === 'הושלם' ? 'בטיפול' : 'הושלם';
    try {
      await api.put(`/update-task-status/${taskId}`, { status: newStatus });
      fetchTasks();
    } catch (e) { alert("שגיאה בעדכון"); }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = 
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (task.address && task.address.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesSettlement = selectedSettlement === 'הכל' || task.location === selectedSettlement;
    const matchesStatus = selectedStatus === 'הכל' || 
                         (selectedStatus === 'בטיפול' && task.status !== 'הושלם') ||
                         (selectedStatus === 'הושלם' && task.status === 'הושלם');

    return matchesSearch && matchesSettlement && matchesStatus;
  });

  // --- לוגיקת עיצוב דינמית למובייל ---
  const dynamicFilterRow = {
    ...filterRowStyle,
    flexDirection: isMobile ? 'column' : 'row',
    alignItems: isMobile ? 'stretch' : 'center',
    gap: isMobile ? '10px' : '12px'
  };

  const dynamicGrid = {
    ...gridStyle,
    gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(350px, 1fr))'
  };

  const TaskCard = ({ task }) => (
    <div style={cardStyle}>
      <div style={cardHeader}>
        <span style={priorityBadge(task.priority)}>{task.priority}</span>
        <div style={{ display: 'flex', gap: '8px' }}>
             <button onClick={() => toggleStatus(task.id, task.status)} style={iconBtnStyle}>
                {task.status === 'הושלם' ? <CheckCircle size={18} color="#48bb78" /> : <Clock size={18} color="#cbd5e0" />}
             </button>
             <button onClick={() => deleteTask(task.id)} style={iconBtnStyle}>
                <Trash2 size={18} color="#e53e3e" />
             </button>
        </div>
      </div>
      
      <h3 style={cardTitle}>{task.title}</h3>
      <p style={cardDesc}>{task.description}</p>
      
      <div style={cardFooter}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#718096' }}>
          <MapPin size={14} />
          <span style={{ fontSize: '13px' }}>{task.location || 'ללא יישוב'} - {task.address}</span>
        </div>
        <span style={statusTag(task.status)}>{task.status}</span>
      </div>
    </div>
  );

  return (
    <div style={{ padding: isMobile ? '15px' : '30px', direction: 'rtl', backgroundColor: '#f7fafc', minHeight: '100vh', boxSizing: 'border-box' }}>
      
      <div style={headerStyle}>
        <div style={{textAlign: 'right'}}>
            <h1 style={{ fontSize: isMobile ? '24px' : '28px', fontWeight: 'bold', margin: 0 }}>תקלות</h1>
            <span style={{fontSize: '14px', color: '#718096'}}>{filteredTasks.length} תקלות במערכת</span>
        </div>
        <button onClick={() => setIsModalOpen(true)} style={addBtnStyle}>
          <Plus size={20} /> דיווח תקלה
        </button>
      </div>

      <div style={dynamicFilterRow}>
        <select style={{...selectStyle, width: isMobile ? '100%' : '160px'}} value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
          <option value="הכל">כל הסטטוסים</option>
          <option value="בטיפול">בטיפול</option>
          <option value="הושלם">הושלם</option>
        </select>

        <select style={{...selectStyle, width: isMobile ? '100%' : '160px'}} value={selectedSettlement} onChange={(e) => setSelectedSettlement(e.target.value)}>
          <option value="הכל">כל היישובים</option>
          {settlements.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
        </select>

        <div style={searchContainerStyle}>
          <Search size={18} style={searchIconStyle} />
          <input 
            type="text" 
            placeholder="חיפוש לפי תקלה, שם או כתובת..." 
            style={searchInputStyle}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div style={dynamicGrid}>
        {filteredTasks.length > 0 ? (
          filteredTasks.map(task => <TaskCard key={task.id} task={task} />)
        ) : (
          <p style={{ color: '#718096', gridColumn: '1/-1', textAlign: 'center', marginTop: '40px' }}>לא נמצאו תקלות</p>
        )}
      </div>

      <CreateTaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onTaskCreated={fetchTasks} />
    </div>
  );
}

// --- Styles (ללא שינוי, הוספתי רק boxSizing למעטפת) ---
const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' };
const addBtnStyle = { backgroundColor: '#0083c2', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' };
const filterRowStyle = { display: 'flex', marginBottom: '30px', width: '100%', boxSizing: 'border-box' };
const selectStyle = { padding: '10px 15px', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: 'white', color: '#4a5568', fontSize: '14px', outline: 'none', cursor: 'pointer' };
const searchContainerStyle = { position: 'relative', flex: 1, display: 'flex', alignItems: 'center' };
const searchInputStyle = { width: '100%', padding: '10px 40px 10px 15px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none', boxSizing: 'border-box' };
const searchIconStyle = { position: 'absolute', right: '12px', color: '#a0aec0' };
const gridStyle = { display: 'grid', gap: '20px' };
const cardStyle = { backgroundColor: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #edf2f7', display: 'flex', flexDirection: 'column', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' };
const cardHeader = { display: 'flex', justifyContent: 'space-between', marginBottom: '12px' };
const cardTitle = { fontSize: '17px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#1A202C' };
const cardDesc = { fontSize: '14px', color: '#718096', marginBottom: '15px', lineHeight: '1.4' };
const cardFooter = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f7fafc', paddingTop: '12px', marginTop: 'auto' };
const priorityBadge = (p) => ({ backgroundColor: p === 'דחוף' || p === 'קריטית' ? '#fff5f5' : '#fffaf0', color: p === 'דחוף' || p === 'קריטית' ? '#e53e3e' : '#dd6b20', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' });
const statusTag = (s) => ({ backgroundColor: s === 'הושלם' ? '#f0fff4' : '#fff5f5', color: s === 'הושלם' ? '#38a169' : '#e53e3e', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' });
const iconBtnStyle = { border: 'none', background: 'none', cursor: 'pointer', padding: '4px' };

export default TasksList;