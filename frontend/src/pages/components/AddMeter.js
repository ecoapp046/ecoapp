import React, { useState } from 'react';
import axios from 'axios';
import { X, Check, AlertCircle, Phone, Mail, Users, MapPin } from 'lucide-react';

const AddMeter = ({ isOpen, onClose, settlements, onMeterAdded }) => {
  const [formData, setFormData] = useState({
    meter_id: '',
    customer_name: '',
    settlement_id: '',
    address: '',
    address_detail: '', // שדה חדש
    phone: '',          // שדה חדש
    email: '',          // שדה חדש
    residents_count: 1, // שדה חדש
    current_reading: 0,
    status: 'פעיל',
    type: 'משני'
  });
  
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    const cleanId = formData.meter_id.trim();
    if (!cleanId) return setError("חובה להזין מספר מונה");
    if (!formData.settlement_id) return setError("חובה לבחור יישוב");

    setIsSaving(true);
    try {
      await axios.post('http://127.0.0.1:8000/add-meter', {
        ...formData,
        meter_id: cleanId,
        current_reading: formData.current_reading.toString(),
        // המרת מספר נפשות למספר שלם
        residents_count: parseInt(formData.residents_count) || 0
      });

      onMeterAdded(); 
      onClose();      
      resetForm();
    } catch (err) {
      const errorMsg = err.response?.data?.detail || "שגיאה בחיבור לשרת";
      setError(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      meter_id: '',
      customer_name: '',
      settlement_id: '',
      address: '',
      address_detail: '',
      phone: '',
      email: '',
      residents_count: 1,
      current_reading: 0,
      status: 'פעיל',
      type: 'משני'
    });
    setError('');
  };

  if (!isOpen) return null;

  return (
    <div style={modalOverlayStyle}>
      <div style={modalContentStyle}>
        <div style={modalHeaderStyle}>
          <button onClick={onClose} style={closeIconBtnStyle}><X size={20} /></button>
          <h2 style={{ margin: 0, fontSize: '20px' }}>הוספת מונה חדש למערכת</h2>
        </div>

        {error && (
          <div style={errorBannerStyle}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={formGridStyle}>
            {/* פרטי זיהוי */}
            <div style={inputGroupStyle}>
              <label style={labelStyle}>מספר מונה (ID) *</label>
              <input 
                required
                style={modalInputStyle}
                value={formData.meter_id}
                onChange={(e) => setFormData({...formData, meter_id: e.target.value})}
                placeholder="102030"
              />
            </div>
            
            <div style={inputGroupStyle}>
              <label style={labelStyle}>שם תושב/לקוח *</label>
              <input 
                required
                style={modalInputStyle}
                value={formData.customer_name}
                onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
                placeholder="ישראל ישראלי"
              />
            </div>

            {/* פרטי קשר */}
            <div style={inputGroupStyle}>
              <label style={labelStyle}>טלפון</label>
              <input 
                style={modalInputStyle}
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="050-0000000"
              />
            </div>

            <div style={inputGroupStyle}>
              <label style={labelStyle}>אימייל</label>
              <input 
                type="email"
                style={modalInputStyle}
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="example@mail.com"
              />
            </div>

            {/* מיקום */}
            <div style={inputGroupStyle}>
              <label style={labelStyle}>יישוב *</label>
              <select 
                required
                style={modalInputStyle}
                value={formData.settlement_id}
                onChange={(e) => setFormData({...formData, settlement_id: e.target.value})}
              >
                <option value="">בחר יישוב...</option>
                {settlements.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div style={inputGroupStyle}>
              <label style={labelStyle}>כתובת (רחוב ומספר)</label>
              <input 
                style={modalInputStyle}
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                placeholder="הכלנית 5"
              />
            </div>

            <div style={{...inputGroupStyle, gridColumn: 'span 2'}}>
              <label style={labelStyle}>מיקום מפורט (קומה, כניסה, הערות מיקום)</label>
              <input 
                style={modalInputStyle}
                value={formData.address_detail}
                onChange={(e) => setFormData({...formData, address_detail: e.target.value})}
                placeholder="כניסה ב', קומה 2 ליד המעלית"
              />
            </div>

            {/* נתונים טכניים */}
            <div style={inputGroupStyle}>
              <label style={labelStyle}>קריאה התחלתית</label>
              <input 
                type="number"
                style={modalInputStyle}
                value={formData.current_reading}
                onChange={(e) => setFormData({...formData, current_reading: e.target.value})}
              />
            </div>

            <div style={inputGroupStyle}>
              <label style={labelStyle}>מספר נפשות</label>
              <input 
                type="number"
                min="1"
                style={modalInputStyle}
                value={formData.residents_count}
                onChange={(e) => setFormData({...formData, residents_count: e.target.value})}
              />
            </div>

            <div style={inputGroupStyle}>
              <label style={labelStyle}>סוג מונה</label>
              <select 
                style={modalInputStyle}
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
              >
                <option value="משני">משני</option>
                <option value="ראשי">ראשי</option>
              </select>
            </div>

            <div style={inputGroupStyle}>
              <label style={labelStyle}>סטטוס ראשוני</label>
              <select 
                style={modalInputStyle}
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
              >
                <option value="פעיל">פעיל</option>
                <option value="מושבת">מושבת</option>
                <option value="תקול">תקול</option>
              </select>
            </div>
          </div>

          <div style={footerStyle}>
            <button type="submit" disabled={isSaving} style={saveBtnStyle}>
              {isSaving ? "שומר נתונים..." : <><Check size={18} /> יצירת מונה חדש</>}
            </button>
            <button type="button" onClick={onClose} style={cancelBtnStyle}>ביטול</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Styles (מעודכנים לחלונית רחבה יותר) ---
const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' };
const modalContentStyle = { backgroundColor: 'white', padding: '35px', borderRadius: '20px', width: '650px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', direction: 'rtl' };
const modalHeaderStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderBottom: '1px solid #f0f0f0', paddingBottom: '15px' };
const closeIconBtnStyle = { border: 'none', background: 'none', cursor: 'pointer', color: '#a0aec0', transition: 'color 0.2s' };
const errorBannerStyle = { backgroundColor: '#fff5f5', color: '#c53030', padding: '14px', borderRadius: '10px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', border: '1px solid #feb2b2' };
const formGridStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' };
const inputGroupStyle = { display: 'flex', flexDirection: 'column', gap: '6px' };
const labelStyle = { fontSize: '13px', fontWeight: '700', color: '#4a5568' };
const modalInputStyle = { padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '14px', backgroundColor: '#f8fafc', transition: 'all 0.2s' };
const footerStyle = { marginTop: '35px', display: 'flex', gap: '15px' };
const saveBtnStyle = { flex: 2, backgroundColor: '#3182ce', color: 'white', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 6px rgba(49, 130, 206, 0.3)' };
const cancelBtnStyle = { flex: 1, backgroundColor: '#f7fafc', color: '#718096', border: '1px solid #e2e8f0', padding: '14px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' };

export default AddMeter;