import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Upload, X } from 'lucide-react';

const CreateTaskModal = ({ isOpen, onClose, onTaskCreated }) => {
  const [settlements, setSettlements] = useState([]);
  const [newTask, setNewTask] = useState({
    title: '', type: 'נזילה', priority: 'בינונית', status: 'פתוח',
    assigned_to: '', description: '', location: '', address: '',
    neighborhood: '', water_line: '', depth: '', notes: ''
  });

  useEffect(() => {
    if (isOpen) {
      const fetchSettlements = async () => {
        try {
          const res = await axios.get('http://127.0.0.1:8000/get-settlements');
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
    try {
      await axios.post('http://127.0.0.1:8000/add-task', newTask);
      onTaskCreated();
      onClose();
    } catch (e) {
      alert("שגיאה ביצירת המשימה");
    }
  };

  return (
    <div style={modalOverlayStyle}>
      <div style={modalContentStyle}>
        <div style={modalHeaderStyle}>
          <h2 style={titleStyle}>דיווח תקלה חדשה</h2>
        </div>

        <form onSubmit={handleSubmit} style={formStyle}>
          {/* כותרת המשימה */}
          <div style={fieldGroup}>
            <label style={labelStyle}>כותרת *</label>
            <input 
              style={inputStyle} 
              placeholder="הזן כותרת"
              required 
              onChange={e => setNewTask({...newTask, title: e.target.value})}
            />
          </div>

          <div style={gridRow}>
            <div style={fieldGroup}>
              <label style={labelStyle}>סוג תקלה</label>
              <select style={inputStyle} onChange={e => setNewTask({...newTask, type: e.target.value})}>
                <option value="נזילה">נזילה</option>
                <option value="פיצוץ">פיצוץ</option>
                <option value="התקנה">התקנה</option>
              </select>
            </div>
            <div style={fieldGroup}>
              <label style={labelStyle}>עדיפות</label>
              <select style={inputStyle} onChange={e => setNewTask({...newTask, priority: e.target.value})}>
                <option value="בינונית">בינונית</option>
                <option value="דחוף">דחוף</option>
                <option value="נמוכה">נמוכה</option>
              </select>
            </div>
          </div>

          <div style={gridRow}>
            <div style={fieldGroup}>
              <label style={labelStyle}>סטטוס</label>
              <select style={inputStyle} onChange={e => setNewTask({...newTask, status: e.target.value})}>
                <option value="פתוח">פתוח</option>
                <option value="בטיפול">בטיפול</option>
              </select>
            </div>
            <div style={fieldGroup}>
              <label style={labelStyle}>מוקצה ל</label>
              <select style={inputStyle} onChange={e => setNewTask({...newTask, assigned_to: e.target.value})}>
                <option value="">בחר עובד</option>
                <option value="עובד 1">עובד 1</option>
              </select>
            </div>
          </div>

          <div style={fieldGroup}>
            <label style={labelStyle}>תיאור</label>
            <textarea style={{...inputStyle, height: '80px', resize: 'none'}} onChange={e => setNewTask({...newTask, description: e.target.value})} />
          </div>

          <div style={sectionDivider}>
            <span style={sectionTitle}>מיקום</span>
            <div style={lineStyle}></div>
          </div>

          <div style={gridRow}>
            <div style={fieldGroup}>
              <label style={labelStyle}>יישוב</label>
              <select 
                style={inputStyle} 
                required
                onChange={e => setNewTask({...newTask, location: e.target.value})}
              >
                <option value="">בחר יישוב</option>
                {settlements.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </div>
            <div style={fieldGroup}>
              <label style={labelStyle}>כתובת</label>
              <input style={inputStyle} onChange={e => setNewTask({...newTask, address: e.target.value})} />
            </div>
          </div>

          <div style={gridRow}>
            <div style={fieldGroup}>
              <label style={labelStyle}>שכונה</label>
              <input style={inputStyle} onChange={e => setNewTask({...newTask, neighborhood: e.target.value})} />
            </div>
            <div style={fieldGroup}>
              <label style={labelStyle}>קו מים</label>
              <input style={inputStyle} onChange={e => setNewTask({...newTask, water_line: e.target.value})} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
             <div style={fieldGroup}>
                <label style={labelStyle}>עומק קו (מטר)</label>
                <input type="number" style={inputStyle} onChange={e => setNewTask({...newTask, depth: e.target.value})} />
             </div>
             <div></div> {/* שומר על הסימטריה של הגריד */}
          </div>

          <div style={fieldGroup}>
            <label style={labelStyle}>הערות</label>
            <textarea style={{...inputStyle, height: '60px', resize: 'none'}} onChange={e => setNewTask({...newTask, notes: e.target.value})} />
          </div>

          <div style={fieldGroup}>
            <label style={labelStyle}>תמונות/סרטונים</label>
            <div style={uploadBoxStyle}>
              <span style={{ color: '#A0AEC0' }}>לחץ להוספת תמונות או סרטון</span>
              <Upload size={18} color="#A0AEC0" />
              <input type="file" multiple style={{ position: 'absolute', opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }} />
            </div>
          </div>

          <div style={modalActions}>
            <button type="submit" style={saveBtn}>דיווח</button>
            <button type="button" onClick={onClose} style={cancelBtn}>ביטול</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- CSS Objects (מבוסס על התמונות) ---
const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.3)', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', zIndex: 1000, padding: '20px', overflowY: 'auto', direction: 'rtl' };
const modalContentStyle = { backgroundColor: 'white', padding: '32px', borderRadius: '12px', width: '100%', maxWidth: '600px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' };
const modalHeaderStyle = { marginBottom: '24px', textAlign: 'right' };
const titleStyle = { margin: 0, fontSize: '22px', fontWeight: '700', color: '#1A202C' };
const formStyle = { display: 'flex', flexDirection: 'column', gap: '18px' };
const gridRow = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' };
const fieldGroup = { display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'right' };
const labelStyle = { fontSize: '13px', fontWeight: '600', color: '#4A5568' };
const inputStyle = { padding: '10px 14px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '14px', backgroundColor: '#FFFFFF', outline: 'none' };
const sectionDivider = { display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' };
const sectionTitle = { fontSize: '14px', fontWeight: 'bold', color: '#2D3748', whiteSpace: 'nowrap' };
const lineStyle = { flex: 1, height: '1px', backgroundColor: '#E2E8F0' };
const uploadBoxStyle = { border: '1.5px dashed #E2E8F0', borderRadius: '8px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', position: 'relative', cursor: 'pointer' };
const modalActions = { display: 'flex', justifyContent: 'flex-start', gap: '12px', marginTop: '10px' };
const saveBtn = { padding: '10px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer', backgroundColor: '#0083C2', color: 'white', fontWeight: 'bold', fontSize: '15px' };
const cancelBtn = { padding: '10px 24px', borderRadius: '8px', border: '1px solid #E2E8F0', cursor: 'pointer', backgroundColor: 'white', color: '#4A5568', fontWeight: '500' };

export default CreateTaskModal;