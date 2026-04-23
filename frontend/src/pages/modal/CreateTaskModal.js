import React, { useState, useEffect } from 'react';
import api from '../../api/api';
import { X, ChevronLeft, ChevronRight, Check, Search, Activity } from 'lucide-react';
import { useIsMobile } from '../../hooks/useIsMobile';

const CreateTaskModal = ({ isOpen, onClose, onTaskCreated, taskToEdit = null }) => {
  const isMobile = useIsMobile();
  const isEdit = !!taskToEdit;
  
  const [step, setStep] = useState(1);
  const [settlements, setSettlements] = useState([]);
  const [allMeters, setAllMeters] = useState([]);
  const [filteredMeters, setFilteredMeters] = useState([]);
  const [meterSearch, setMeterSearch] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [newTask, setNewTask] = useState({
    type: 'נזילה', 
    custom_type: '', 
    priority: 'בינונית', 
    status: 'פתוח',
    assigned_to: '', 
    description: '', 
    location: '', 
    address: '',
    selected_meter_id: '' 
  });

  useEffect(() => {
    if (isOpen) {
      fetchInitialData();
      if (taskToEdit) {
        setNewTask(taskToEdit);
        setStep(1);
      } else {
        resetForm();
      }
    }
  }, [isOpen, taskToEdit]);

  const fetchInitialData = async () => {
    try {
      const [settlementsRes, metersRes] = await Promise.all([
        api.get('/get-settlements'),
        api.get('/get-meters')
      ]);
      setSettlements(settlementsRes.data);
      setAllMeters(metersRes.data);
    } catch (e) { console.error("שגיאה בטעינת נתונים", e); }
  };

  const resetForm = () => {
    setStep(1);
    setNewTask({
      type: 'נזילה', custom_type: '', priority: 'בינונית', status: 'פתוח',
      assigned_to: '', description: '', location: '', address: '',
      selected_meter_id: ''
    });
  };

  useEffect(() => {
    let filtered = allMeters.filter(m => m.settlement_name === newTask.location);
    if (meterSearch) {
      filtered = filtered.filter(m => m.id.toString().includes(meterSearch) || m.customer_name?.includes(meterSearch));
    }
    setFilteredMeters(filtered);
  }, [newTask.location, meterSearch, allMeters]);

  const handleMeterSelect = (meterId) => {
    setNewTask(prev => ({
      ...prev,
      selected_meter_id: prev.selected_meter_id === meterId ? '' : meterId
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    
    // קביעת הכותרת לפי סוג המשימה
    const taskType = newTask.type === 'אחר' ? newTask.custom_type : newTask.type;
    
    const taskData = {
      ...newTask,
      title: taskType, // הכותרת תהיה סוג המשימה
      type: taskType
    };

    try {
      if (isEdit) {
        await api.put(`/update-task/${taskToEdit.id}`, taskData);
      } else {
        await api.post('/add-task', taskData);
      }
      onTaskCreated();
      onClose();
    } catch (e) {
      alert("שגיאה בשמירת המשימה");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={modalOverlayStyle}>
      <div style={{...modalContentStyle, padding: isMobile ? '20px' : '30px'}}>
        
        <div style={modalHeaderStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h2 style={titleStyle}>{isEdit ? "עריכת משימה" : "משימה חדשה"} - {step}/3</h2>
            <X cursor="pointer" onClick={onClose} size={20} color="#718096" />
          </div>
          <div style={progressBarBg}><div style={{...progressBarFill, width: `${(step/3)*100}%`}}></div></div>
        </div>

        {/* שלב 1: מיקום וסוג */}
        {step === 1 && (
          <div style={stepContainer}>
            <div style={fieldGroup}>
              <label style={labelStyle}>בחר ישוב *</label>
              <select 
                style={inputStyle} 
                value={newTask.location}
                onChange={e => setNewTask({...newTask, location: e.target.value})}
              >
                <option value="">בחר מרשימה...</option>
                {settlements.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </div>

            <div style={fieldGroup}>
              <label style={labelStyle}>סוג משימה *</label>
              <select style={inputStyle} value={newTask.type} onChange={e => setNewTask({...newTask, type: e.target.value})}>
                <option value="נזילה">נזילה</option>
                <option value="פיצוץ">פיצוץ</option>
                <option value="התקנה">התקנה</option>
                <option value="קריאת מונים">קריאת מונה (פרטני)</option>
                <option value="אחר">אחר...</option>
              </select>
            </div>

            {newTask.type === 'אחר' && (
              <div style={fieldGroup}>
                <label style={labelStyle}>פרט איזה סוג משימה:</label>
                <input 
                  style={inputStyle} 
                  placeholder="הקלד סוג משימה..."
                  value={newTask.custom_type}
                  onChange={e => setNewTask({...newTask, custom_type: e.target.value})}
                />
              </div>
            )}
          </div>
        )}

        {/* שלב 2: שיוך מונה */}
        {step === 2 && (
          <div style={stepContainer}>
            <div style={meterSelectorArea}>
                <div style={searchHeader}>
                    <Search size={16} color="#A0AEC0" />
                    <input 
                        style={miniSearchInput} 
                        placeholder={newTask.type === 'קריאת מונים' ? "חובה לבחור מונה לקריאה..." : "קשר מונה רלוונטי (אופציונלי)..."} 
                        value={meterSearch}
                        onChange={e => setMeterSearch(e.target.value)}
                    />
                </div>
                <div style={meterListScroll}>
                  {filteredMeters.length === 0 ? <p style={{textAlign:'center', padding:'20px', fontSize:'12px', color:'#A0AEC0'}}>בחר ישוב תחילה או שנה חיפוש</p> : 
                    filteredMeters.map(m => (
                      <div 
                        key={m.id} 
                        onClick={() => handleMeterSelect(m.id)}
                        style={meterItemStyle(newTask.selected_meter_id === m.id)}
                      >
                        <div>
                            <div style={{fontSize: '13px', fontWeight:'bold'}}>{m.id}</div>
                            <div style={{fontSize: '11px'}}>{m.customer_name}</div>
                        </div>
                        {newTask.selected_meter_id === m.id && <Check size={16} color="#3182ce" />}
                      </div>
                    ))
                  }
                </div>
                {newTask.selected_meter_id && (
                    <div style={selectedInfo}>
                        <Activity size={12} /> מונה {newTask.selected_meter_id} קושר למשימה
                    </div>
                )}
            </div>
            <p style={{fontSize: '12px', color: '#718096', marginTop: '5px'}}>
               * במידה ומדובר בנזילה כללית בישוב, אין חובה לבחור מונה.
            </p>
          </div>
        )}

        {/* שלב 3: פרטים טכניים */}
        {step === 3 && (
          <div style={stepContainer}>
            <div style={fieldGroup}>
              <label style={labelStyle}>תיאור ופרטים נוספים</label>
              <textarea 
                style={{...inputStyle, height: '80px'}} 
                placeholder="הערות לטכנאי השטח (מיקום מדויק, הנחיות מיוחדות)..."
                value={newTask.description}
                onChange={e => setNewTask({...newTask, description: e.target.value})} 
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={fieldGroup}>
                    <label style={labelStyle}>דחיפות</label>
                    <select style={inputStyle} value={newTask.priority} onChange={e => setNewTask({...newTask, priority: e.target.value})}>
                        <option value="נמוכה">נמוכה</option>
                        <option value="בינונית">בינונית</option>
                        <option value="גבוהה">גבוהה</option>
                        <option value="דחוף מאוד">🚨 דחוף מאוד</option>
                    </select>
                </div>
                <div style={fieldGroup}>
                    <label style={labelStyle}>טכנאי אחראי</label>
                    <select style={inputStyle} value={newTask.assigned_to} onChange={e => setNewTask({...newTask, assigned_to: e.target.value})}>
                        <option value="">ללא הקצאה</option>
                        <option value="טכנאי 1">טכנאי 1</option>
                        <option value="טכנאי 2">טכנאי 2</option>
                    </select>
                </div>
            </div>
          </div>
        )}

        <div style={modalActions}>
          {step > 1 && (
            <button onClick={() => setStep(step - 1)} style={navBtn}>
              <ChevronRight size={18} /> הקודם
            </button>
          )}
          <div style={{ flex: 1 }}></div>
          {step < 3 ? (
            <button 
              disabled={step === 1 && (!newTask.location || (newTask.type === 'אחר' && !newTask.custom_type))}
              onClick={() => setStep(step + 1)} 
              style={{...navBtn, backgroundColor: '#3182ce', color: 'white', border: 'none'}}
            >
              המשך <ChevronLeft size={18} />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={loading} style={saveBtn}>
              {loading ? "שומר..." : "פתח משימה לביצוע"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Styles (ללא שינוי) ---
const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1200, direction: 'rtl' };
const modalContentStyle = { backgroundColor: 'white', borderRadius: '20px', width: '95%', maxWidth: '450px', maxHeight: '90vh', overflowY: 'auto' };
const modalHeaderStyle = { marginBottom: '20px' };
const titleStyle = { margin: 0, fontSize: '18px', fontWeight: 'bold' };
const progressBarBg = { height: '4px', backgroundColor: '#EDF2F7', borderRadius: '2px' };
const progressBarFill = { height: '100%', backgroundColor: '#3182ce', transition: 'width 0.3s' };
const stepContainer = { display: 'flex', flexDirection: 'column', gap: '15px', minHeight: '280px' };
const fieldGroup = { display: 'flex', flexDirection: 'column', gap: '5px' };
const labelStyle = { fontSize: '13px', fontWeight: 'bold', color: '#4A5568' };
const inputStyle = { padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '14px', outline: 'none' };
const meterSelectorArea = { border: '1px solid #E2E8F0', borderRadius: '10px', marginTop: '10px' };
const searchHeader = { display: 'flex', alignItems: 'center', padding: '10px', borderBottom: '1px solid #E2E8F0', gap: '8px' };
const miniSearchInput = { border: 'none', outline: 'none', fontSize: '13px', width: '100%' };
const meterListScroll = { height: '140px', overflowY: 'auto' };
const selectedInfo = { padding: '8px', backgroundColor: '#EBF8FF', color: '#2B6CB0', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px', borderRadius: '0 0 10px 10px' };
const meterItemStyle = (isSelected) => ({ padding: '10px 15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', borderBottom: '1px solid #F7FAFC', backgroundColor: isSelected ? '#F0F9FF' : 'transparent' });
const modalActions = { display: 'flex', gap: '10px', marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #F7FAFC' };
const navBtn = { display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 15px', borderRadius: '8px', border: '1px solid #E2E8F0', backgroundColor: 'white', cursor: 'pointer', fontSize: '14px' };
const saveBtn = { padding: '8px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#38A169', color: 'white', fontWeight: 'bold', cursor: 'pointer' };

export default CreateTaskModal;