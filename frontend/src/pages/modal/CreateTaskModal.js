import React, { useState, useEffect } from 'react';
import api from '../../api/api';
import { Upload, X } from 'lucide-react';
import { useIsMobile } from '../../hooks/useIsMobile';

const CreateTaskModal = ({ isOpen, onClose, onTaskCreated }) => {
  const isMobile = useIsMobile();
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '', type: 'נזילה', priority: 'בינונית', status: 'פתוח',
    assigned_to: '', description: '', location: '', address: '',
    neighborhood: '', water_line: '', depth: '', notes: ''
  });

  useEffect(() => {
    if (isOpen) {
      const fetchSettlements = async () => {
        try {
          const res = await api.get('/get-settlements');
          setSettlements(res.data);
        } catch (e) {
          console.error("Error fetching settlements", e);
        }
      };
      fetchSettlements();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/add-task', newTask);
      onTaskCreated();
      onClose();
      // איפוס טופס לאחר הצלחה
      setNewTask({
        title: '', type: 'נזילה', priority: 'בינונית', status: 'פתוח',
        assigned_to: '', description: '', location: '', address: '',
        neighborhood: '', water_line: '', depth: '', notes: ''
      });
    } catch (e) {
      alert("שגיאה ביצירת המשימה");
    } finally {
      setLoading(false);
    }
  };

  // לוגיקה לסידור הגריד במובייל
  const dynamicGridRow = {
    ...gridRow,
    gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr'
  };

  return (
    <div style={modalOverlayStyle}>
      <div style={{...modalContentStyle, padding: isMobile ? '20px' : '32px'}}>
        <div style={{...modalHeaderStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <h2 style={titleStyle}>דיווח תקלה חדשה</h2>
          <X cursor="pointer" onClick={onClose} size={20} color="#718096" />
        </div>

        <form onSubmit={handleSubmit} style={formStyle}>
          <div style={fieldGroup}>
            <label style={labelStyle}>כותרת *</label>
            <input 
              style={inputStyle} 
              placeholder="לדוגמה: נזילה ברחוב הירקון"
              required 
              value={newTask.title}
              onChange={e => setNewTask({...newTask, title: e.target.value})}
            />
          </div>

          <div style={dynamicGridRow}>
            <div style={fieldGroup}>
              <label style={labelStyle}>סוג תקלה</label>
              <select style={inputStyle} value={newTask.type} onChange={e => setNewTask({...newTask, type: e.target.value})}>
                <option value="נזילה">נזילה</option>
                <option value="פיצוץ">פיצוץ</option>
                <option value="התקנה">התקנה</option>
                <option value="אחר">אחר</option>
              </select>
            </div>
            <div style={fieldGroup}>
              <label style={labelStyle}>עדיפות</label>
              <select style={inputStyle} value={newTask.priority} onChange={e => setNewTask({...newTask, priority: e.target.value})}>
                <option value="נמוכה">נמוכה</option>
                <option value="בינונית">בינונית</option>
                <option value="דחוף">דחוף</option>
                <option value="קריטית">קריטית</option>
              </select>
            </div>
          </div>

          <div style={dynamicGridRow}>
            <div style={fieldGroup}>
              <label style={labelStyle}>סטטוס</label>
              <select style={inputStyle} value={newTask.status} onChange={e => setNewTask({...newTask, status: e.target.value})}>
                <option value="פתוח">פתוח</option>
                <option value="בטיפול">בטיפול</option>
              </select>
            </div>
            <div style={fieldGroup}>
              <label style={labelStyle}>מוקצה ל</label>
              <select style={inputStyle} value={newTask.assigned_to} onChange={e => setNewTask({...newTask, assigned_to: e.target.value})}>
                <option value="">בחר עובד</option>
                <option value="Tech_01">טכנאי שטח 1</option>
                <option value="Tech_02">טכנאי שטח 2</option>
              </select>
            </div>
          </div>

          <div style={fieldGroup}>
            <label style={labelStyle}>תיאור</label>
            <textarea 
              style={{...inputStyle, height: '60px', resize: 'none'}} 
              placeholder="פרט על התקלה..."
              value={newTask.description}
              onChange={e => setNewTask({...newTask, description: e.target.value})} 
            />
          </div>

          <div style={sectionDivider}>
            <span style={sectionTitle}>מיקום</span>
            <div style={lineStyle}></div>
          </div>

          <div style={dynamicGridRow}>
            <div style={fieldGroup}>
              <label style={labelStyle}>יישוב *</label>
              <select 
                style={inputStyle} 
                required
                value={newTask.location}
                onChange={e => setNewTask({...newTask, location: e.target.value})}
              >
                <option value="">בחר יישוב</option>
                {settlements.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </div>
            <div style={fieldGroup}>
              <label style={labelStyle}>כתובת</label>
              <input 
                style={inputStyle} 
                value={newTask.address}
                onChange={e => setNewTask({...newTask, address: e.target.value})} 
              />
            </div>
          </div>

          <div style={dynamicGridRow}>
            <div style={fieldGroup}>
              <label style={labelStyle}>שכונה</label>
              <input style={inputStyle} value={newTask.neighborhood} onChange={e => setNewTask({...newTask, neighborhood: e.target.value})} />
            </div>
            <div style={fieldGroup}>
              <label style={labelStyle}>קו מים</label>
              <input style={inputStyle} value={newTask.water_line} onChange={e => setNewTask({...newTask, water_line: e.target.value})} />
            </div>
          </div>

          <div style={dynamicGridRow}>
             <div style={fieldGroup}>
                <label style={labelStyle}>עומק קו (מטר)</label>
                <input type="number" step="0.1" style={inputStyle} value={newTask.depth} onChange={e => setNewTask({...newTask, depth: e.target.value})} />
             </div>
             <div style={fieldGroup}>
                <label style={labelStyle}>תמונות/סרטונים</label>
                <div style={uploadBoxStyle}>
                  <Upload size={16} color="#A0AEC0" />
                  <span style={{ color: '#A0AEC0', fontSize: '12px' }}>{isMobile ? 'צרף קובץ' : 'לחץ להוספת קבצים'}</span>
                  <input type="file" multiple style={{ position: 'absolute', opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }} />
                </div>
             </div>
          </div>

          <div style={{...modalActions, flexDirection: isMobile ? 'column-reverse' : 'row'}}>
            <button type="button" onClick={onClose} style={{...cancelBtn, width: isMobile ? '100%' : 'auto'}}>ביטול</button>
            <button type="submit" disabled={loading} style={{...saveBtn, width: isMobile ? '100%' : 'auto'}}>
              {loading ? "מעבד..." : "דיווח תקלה"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- CSS Objects ---
const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '10px', overflowY: 'auto', direction: 'rtl' };
const modalContentStyle = { backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '650px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', maxHeight: '95vh', overflowY: 'auto' };
const modalHeaderStyle = { marginBottom: '20px' };
const titleStyle = { margin: 0, fontSize: '20px', fontWeight: '700', color: '#1A202C' };
const formStyle = { display: 'flex', flexDirection: 'column', gap: '16px' };
const gridRow = { display: 'grid', gap: '16px' };
const fieldGroup = { display: 'flex', flexDirection: 'column', gap: '6px' };
const labelStyle = { fontSize: '13px', fontWeight: '600', color: '#4A5568' };
const inputStyle = { padding: '10px 12px', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '14px', outline: 'none', backgroundColor: '#F8FAFC' };
const sectionDivider = { display: 'flex', alignItems: 'center', gap: '10px', marginTop: '5px' };
const sectionTitle = { fontSize: '13px', fontWeight: 'bold', color: '#718096', whiteSpace: 'nowrap' };
const lineStyle = { flex: 1, height: '1px', backgroundColor: '#EDF2F7' };
const uploadBoxStyle = { border: '2px dashed #E2E8F0', borderRadius: '10px', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', position: 'relative', cursor: 'pointer', backgroundColor: '#F8FAFC' };
const modalActions = { display: 'flex', justifyContent: 'flex-start', gap: '12px', marginTop: '15px' };
const saveBtn = { padding: '12px 30px', borderRadius: '10px', border: 'none', cursor: 'pointer', backgroundColor: '#0083C2', color: 'white', fontWeight: 'bold', transition: 'opacity 0.2s' };
const cancelBtn = { padding: '12px 30px', borderRadius: '10px', border: '1px solid #E2E8F0', cursor: 'pointer', backgroundColor: 'white', color: '#4A5568' };

export default CreateTaskModal;