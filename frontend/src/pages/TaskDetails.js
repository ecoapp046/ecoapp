import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/api';
import CreateTaskModal from './modal/CreateTaskModal';
import { 
  ArrowRight, Camera, CheckCircle, 
  MapPin, Info, Edit, Trash, Clock, AlertCircle, Hash
} from 'lucide-react';

function TaskDetails() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  const [images, setImages] = useState([]);
  const [notes, setNotes] = useState("");

  const isClosed = task?.status === 'הושלם';
  const isMeterReadingTask = task?.type === 'קריאת מונים';

  const fetchTask = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/get-tasks`); 
      const foundTask = res.data.find(t => t.id === taskId);
      setTask(foundTask);
      setNotes(foundTask?.notes || "");
      setImages(foundTask?.images || []);
    } catch (e) { 
      console.error(e); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { fetchTask(); }, [taskId]);

  const handleDeleteTask = async () => {
    if (!window.confirm("למחוק את המשימה לצמיתות?")) return;
    try {
      await api.delete(`/delete-task/${taskId}`);
      navigate(-1);
    } catch (e) { alert("שגיאה במחיקה"); }
  };

  const handleManualReading = async () => {
    // מאפשר עדכון רק אם זו משימת קריאה והיא לא סגורה
    if (isClosed || !isMeterReadingTask || !task.selected_meter_id) return;
    
    const reading = window.prompt(`עדכון קריאה נוכחית עבור מונה ${task.selected_meter_id}:`);
    if (reading === null || reading === "" || isNaN(reading)) return;
    
    try {
      await api.put(`/update-single-meter-reading/${taskId}`, { 
        reading,
        meter_id: task.selected_meter_id 
      });
      fetchTask();
    } catch (e) { alert("שגיאה בעדכון הקריאה"); }
  };

  const handlePhoto = (e) => {
    if (isClosed) return;
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImages([...images, reader.result]);
      reader.readAsDataURL(file);
    }
  };

  const handleCompleteTask = async () => {
    if (isMeterReadingTask && !task.meter_reading_done) {
        if (!window.confirm("לא הוזנה קריאת מונה. האם לסגור את המשימה בכל זאת?")) return;
    }
    try {
      await api.put(`/complete-task/${taskId}`, {
        notes, 
        images
      });
      alert("המשימה נסגרה בהצלחה");
      fetchTask();
    } catch (e) { alert("שגיאה בסגירת המשימה"); }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '50px', direction: 'rtl' }}>טוען נתוני משימה...</div>;
  if (!task) return <div style={{ textAlign: 'center', padding: '50px', direction: 'rtl' }}>משימה לא קיימת</div>;

  return (
    <div style={{ direction: 'rtl', padding: '15px', backgroundColor: '#F7FAFC', minHeight: '100vh' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
        <button onClick={() => navigate(-1)} style={backBtnStyle}><ArrowRight /></button>
        <div style={{ display: 'flex', gap: '8px' }}>
          {!isClosed && (
            <button onClick={() => setIsEditModalOpen(true)} style={editBtnStyle}>
              <Edit size={18} /> עריכה
            </button>
          )}
          <button onClick={handleDeleteTask} style={deleteBtnStyle}><Trash size={18} /></button>
        </div>
      </div>

      {isClosed && (
        <div style={closedBannerStyle}>
          <CheckCircle size={20} />
          <div>
            <strong>המשימה הושלמה</strong>
            <div style={{ fontSize: '11px', opacity: 0.9 }}>נסגרה ב: {task.completed_at ? new Date(task.completed_at).toLocaleString('he-IL') : "—"}</div>
          </div>
        </div>
      )}

      <h2 style={{ marginBottom: '5px', color: '#2D3748' }}>{task.title}</h2>
      <div style={priorityBadge(task.priority)}>{task.priority}</div>

      {/* Details Card */}
      <div style={cardStyle}>
        <h3 style={sectionTitle}><Info size={16} /> פרטי משימה</h3>
        <div style={infoGrid}>
          <div><label style={infoLabel}>סוג:</label> <div>{task.type}</div></div>
          <div><label style={infoLabel}>יישוב:</label> <div>{task.location}</div></div>
          <div><label style={infoLabel}>כתובת:</label> <div>{task.address || "-"}</div></div>
          <div><label style={infoLabel}>טכנאי:</label> <div>{task.assigned_to || "כללי"}</div></div>
        </div>
        {task.description && (
            <div style={{marginTop: '10px'}}>
                <label style={infoLabel}>תיאור:</label>
                <div style={{fontSize: '14px', color: '#4A5568'}}>{task.description}</div>
            </div>
        )}
      </div>

      {/* Meter Section */}
      {task.selected_meter_id && (
        <div style={cardStyle}>
          <h3 style={sectionTitle}>
              {isMeterReadingTask ? <AlertCircle size={16} color="#3182CE" /> : <Hash size={16} />} 
              {isMeterReadingTask ? "ביצוע קריאת מונה" : "מונה משויך למיקום"}
          </h3>
          <div 
            onClick={handleManualReading} 
            style={meterRow(task.meter_reading_done, isClosed, isMeterReadingTask)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {task.meter_reading_done ? <CheckCircle size={16} color="#48BB78" /> : <Clock size={16} color="#CBD5E0" />}
              <span>מספר מונה: <strong>{task.selected_meter_id}</strong></span>
            </div>
            <div style={{fontWeight: 'bold'}}>
                {task.last_reading_value ? `ערך: ${task.last_reading_value}` : 
                 (isMeterReadingTask && !isClosed ? "לחץ לעדכון +" : "ללא קריאה")}
            </div>
          </div>
          {isMeterReadingTask && !isClosed && (
              <p style={{fontSize: '11px', color: '#718096', marginTop: '8px'}}>* לחץ על השורה לעיל כדי להזין את המספר המופיע על הצג.</p>
          )}
        </div>
      )}

      {/* Documentation */}
      <div style={cardStyle}>
        <h3 style={sectionTitle}><Camera size={16} /> תיעוד מהשטח</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '15px' }}>
            {images.map((img, i) => <img key={i} src={img} style={thumbStyle} alt="work" />)}
            {!isClosed && (
                <label style={addPhotoBox}>
                    <Camera /><input type="file" capture="environment" hidden onChange={handlePhoto} />
                </label>
            )}
        </div>
        
        <label style={infoLabel}>הערות לסיכום:</label>
        <textarea 
            disabled={isClosed}
            style={{...txtArea, backgroundColor: isClosed ? '#F1F5F9' : 'white'}} 
            placeholder="תאר את הפעולות שבוצעו..."
            value={notes} 
            onChange={e => setNotes(e.target.value)} 
        />
      </div>

      {!isClosed && (
        <div style={{ marginTop: '20px', paddingBottom: '30px' }}>
          <button onClick={handleCompleteTask} style={mainActionBtn}>סיום וסגירת משימה</button>
        </div>
      )}

      <CreateTaskModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        taskToEdit={task} 
        onTaskCreated={fetchTask} 
      />
    </div>
  );
}

// --- Styles ---
const cardStyle = { backgroundColor: 'white', padding: '15px', borderRadius: '12px', marginBottom: '15px', border: '1px solid #E2E8F0' };
const infoGrid = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', fontSize: '14px' };
const infoLabel = { fontSize: '11px', color: '#718096', fontWeight: 'bold', display: 'block', marginBottom: '2px' };
const sectionTitle = { fontSize: '15px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' };
const closedBannerStyle = { backgroundColor: '#C6F6D5', color: '#22543D', padding: '12px', borderRadius: '12px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' };
const meterRow = (done, closed, isReading) => ({ 
  display: 'flex', justifyContent: 'space-between', padding: '15px', 
  backgroundColor: done ? '#F0FFF4' : '#F8FAFC', 
  borderRadius: '10px', 
  cursor: (closed || !isReading) ? 'default' : 'pointer', 
  border: isReading ? '1.5px solid #3182CE' : '1px solid #E2E8F0',
  boxShadow: isReading && !closed ? '0 2px 4px rgba(49, 130, 206, 0.1)' : 'none'
});
const backBtnStyle = { border: 'none', background: 'white', padding: '10px', borderRadius: '12px', cursor: 'pointer' };
const editBtnStyle = { border: 'none', backgroundColor: '#EBF8FF', color: '#3182CE', padding: '8px 15px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' };
const deleteBtnStyle = { border: 'none', backgroundColor: '#FFF5F5', color: '#C53030', padding: '10px', borderRadius: '8px', cursor: 'pointer' };
const thumbStyle = { width: '75px', height: '75px', borderRadius: '12px', objectFit: 'cover' };
const addPhotoBox = { width: '75px', height: '75px', border: '2px dashed #CBD5E0', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#A0AEC0' };
const txtArea = { width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0', minHeight: '100px', boxSizing: 'border-box', fontSize: '14px', outline: 'none' };
const mainActionBtn = { width: '100%', padding: '18px', backgroundColor: '#38A169', color: 'white', border: 'none', borderRadius: '15px', fontWeight: 'bold', fontSize: '18px', cursor: 'pointer', boxShadow: '0 4px 6px rgba(56, 161, 105, 0.2)' };
const priorityBadge = (p) => {
    let bg = '#EDF2F7', co = '#4A5568';
    if (p === 'גבוהה') { bg = '#FEEBC8'; co = '#9C4221'; }
    if (p === 'דחוף מאוד') { bg = '#FED7D7'; co = '#9B2C2C'; }
    return { fontSize: '12px', backgroundColor: bg, color: co, padding: '5px 14px', borderRadius: '20px', display: 'inline-block', marginBottom: '15px', fontWeight: 'bold' };
};

export default TaskDetails;