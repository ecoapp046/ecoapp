import React, { useState, useEffect } from 'react';
import api from '../../api/api';
import { X, ChevronLeft, ChevronRight, Check, Search, Activity } from 'lucide-react';
import { useIsMobile } from '../../hooks/useIsMobile';

const EditTaskModal = ({ isOpen, onClose, taskToEdit, onTaskUpdated }) => {
  const isMobile = useIsMobile();
  
  const [step, setStep] = useState(1);
  const [settlements, setSettlements] = useState([]);
  const [allMeters, setAllMeters] = useState([]);
  const [filteredMeters, setFilteredMeters] = useState([]);
  const [meterSearch, setMeterSearch] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    type: 'נזילה', 
    custom_type: '', 
    priority: 'בינונית', 
    status: 'פתוח',
    description: '', 
    location: '', 
    address: '',
    selected_meter_id: '' 
  });

  useEffect(() => {
    if (isOpen && taskToEdit) {
      fetchInitialData();
      const knownTypes = ["נזילה", "בדיקת תקינות מונה", "קריאת מונה", "שיוך מונה לצרכן", "התקנת מונה"];
      const isCustom = !knownTypes.includes(taskToEdit.type);
      
      setFormData({
        ...taskToEdit,
        type: isCustom ? 'אחר' : (taskToEdit.type || 'נזילה'),
        custom_type: isCustom ? taskToEdit.type : '',
        priority: taskToEdit.priority || 'בינונית',
        location: taskToEdit.location || '',
        description: taskToEdit.description || '',
        selected_meter_id: taskToEdit.selected_meter_id || ''
      });
      setStep(1);
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

  useEffect(() => {
    let filtered = allMeters.filter(m => m.settlement_name === formData.location);
    if (meterSearch) {
      filtered = filtered.filter(m => 
        m.id.toString().includes(meterSearch) || 
        m.customer_name?.includes(meterSearch)
      );
    }
    setFilteredMeters(filtered);
  }, [formData.location, meterSearch, allMeters]);

  const handleMeterSelect = (meterId) => {
    setFormData(prev => ({
      ...prev,
      selected_meter_id: prev.selected_meter_id === meterId ? '' : meterId
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    const taskType = formData.type === 'אחר' ? formData.custom_type : formData.type;
    
    const updatedData = {
      ...formData,
      title: taskType,
      type: taskType
    };

    try {
      await api.put(`/update-task/${taskToEdit.id}`, updatedData);
      alert("המשימה עודכנה בהצלחה");
      onTaskUpdated();
      onClose();
    } catch (e) {
      alert("שגיאה בעדכון המשימה");
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
            <h2 style={titleStyle}>עריכת משימה - {step}/3</h2>
            <X cursor="pointer" onClick={onClose} size={20} color="#718096" />
          </div>
          <div style={progressBarBg}><div style={{...progressBarFill, width: `${(step/3)*100}%`}}></div></div>
        </div>

        {step === 1 && (
          <div style={stepContainer}>
            <div style={fieldGroup}>
              <label style={labelStyle}>יישוב *</label>
              <select 
                style={inputStyle} 
                value={formData.location}
                onChange={e => setFormData({...formData, location: e.target.value})}
              >
                <option value="">בחר מרשימה...</option>
                {settlements.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </div>

            <div style={fieldGroup}>
              <label style={labelStyle}>סוג משימה *</label>
              <select style={inputStyle} value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                <option value="נזילה">נזילה</option>
                <option value="בדיקת תקינות מונה">בדיקת תקינות מונה</option>
                <option value="קריאת מונה">קריאת מונה</option>
                <option value="שיוך מונה לצרכן">שיוך מונה לצרכן</option>
                <option value="התקנת מונה">התקנת מונה</option>
                <option value="אחר">אחר...</option>
              </select>
            </div>

            {formData.type === 'אחר' && (
              <div style={fieldGroup}>
                <label style={labelStyle}>פרט איזה סוג משימה:</label>
                <input 
                  style={inputStyle} 
                  placeholder="הקלד סוג משימה..."
                  value={formData.custom_type}
                  onChange={e => setFormData({...formData, custom_type: e.target.value})}
                />
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div style={stepContainer}>
            <div style={meterSelectorArea}>
                <div style={searchHeader}>
                    <Search size={16} color="#A0AEC0" />
                    <input 
                        style={miniSearchInput} 
                        placeholder="חפש מונה או שם צרכן..." 
                        value={meterSearch}
                        onChange={e => setMeterSearch(e.target.value)}
                    />
                </div>
                <div style={meterListScroll}>
                  {filteredMeters.length === 0 ? <p style={{textAlign:'center', padding:'20px', fontSize:'12px', color:'#A0AEC0'}}>אין מונים ביישוב זה</p> : 
                    filteredMeters.map(m => (
                      <div 
                        key={m.id} 
                        onClick={() => handleMeterSelect(m.id)}
                        style={meterItemStyle(formData.selected_meter_id === m.id)}
                      >
                        <div>
                            <div style={{fontSize: '13px', fontWeight:'bold'}}>{m.id}</div>
                            <div style={{fontSize: '11px'}}>{m.customer_name}</div>
                        </div>
                        {formData.selected_meter_id === m.id && <Check size={16} color="#3182ce" />}
                      </div>
                    ))
                  }
                </div>
                {formData.selected_meter_id && (
                    <div style={selectedInfo}>
                        <Activity size={12} /> מונה {formData.selected_meter_id} נבחר
                    </div>
                )}
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={stepContainer}>
            <div style={fieldGroup}>
              <label style={labelStyle}>תיאור ופרטים נוספים</label>
              <textarea 
                style={{...inputStyle, height: '120px'}} 
                placeholder="הערות..."
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})} 
              />
            </div>
            <div style={fieldGroup}>
                <label style={labelStyle}>דחיפות</label>
                <select style={inputStyle} value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})}>
                    <option value="נמוכה">נמוכה</option>
                    <option value="בינונית">בינונית</option>
                    <option value="גבוהה">גבוהה</option>
                    <option value="דחוף מאוד">🚨 דחוף מאוד</option>
                </select>
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
              disabled={step === 1 && (!formData.location || (formData.type === 'אחר' && !formData.custom_type))}
              onClick={() => setStep(step + 1)} 
              style={{...navBtn, backgroundColor: '#3182ce', color: 'white', border: 'none'}}
            >
              המשך <ChevronLeft size={18} />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={loading} style={saveBtn}>
              {loading ? "מעדכן..." : "שמור שינויים"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, direction: 'rtl' };
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

export default EditTaskModal;