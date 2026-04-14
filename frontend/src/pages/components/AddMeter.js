import React, { useState } from 'react';
import api from '../../api/api';
import { X, Check, AlertCircle } from 'lucide-react';
import { useIsMobile } from '../../hooks/useIsMobile';

const AddMeter = ({ isOpen, onClose, settlements, onMeterAdded }) => {
  const isMobile = useIsMobile();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    const cleanId = formData.meter_id.trim();
    if (!cleanId) return setError("חובה להזין מספר מונה");
    if (!formData.settlement_id) return setError("חובה לבחור יישוב");

    setIsSaving(true);
    try {
      // שימוש ב-API המרכזי
      await api.post('/add-meter', {
        ...formData,
        meter_id: cleanId,
        current_reading: formData.current_reading.toString(),
        residents_count: parseInt(formData.residents_count) || 1
      });

      onMeterAdded(); 
      resetForm();
      onClose();      
    } catch (err) {
      const errorMsg = err.response?.data?.detail || "שגיאה בשמירת הנתונים";
      setError(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      meter_id: '', customer_name: '', settlement_id: '',
      address: '', address_detail: '', phone: '',
      email: '', residents_count: 1, current_reading: 0,
      status: 'פעיל', type: 'משני'
    });
    setError('');
  };

  if (!isOpen) return null;

  return (
    <div style={modalOverlayStyle}>
      <div style={{
        ...modalContentStyle,
        width: isMobile ? '95%' : '650px',
        padding: isMobile ? '20px' : '35px'
      }}>
        <div style={modalHeaderStyle}>
          <button onClick={onClose} style={closeIconBtnStyle}><X size={20} /></button>
          <h2 style={{ margin: 0, fontSize: isMobile ? '18px' : '20px' }}>הוספת מונה חדש</h2>
        </div>

        {error && (
          <div style={errorBannerStyle}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{
            ...formGridStyle,
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr'
          }}>
            {/* פרטי זיהוי */}
            <div style={inputGroupStyle}>
              <label style={labelStyle}>מספר מונה (ID) *</label>
              <input 
                required
                style={modalInputStyle}
                value={formData.meter_id}
                onChange={(e) => setFormData({...formData, meter_id: e.target.value})}
                placeholder="לדוגמה: 102030"
              />
            </div>
            
            <div style={inputGroupStyle}>
              <label style={labelStyle}>שם תושב/לקוח *</label>
              <input 
                required
                style={modalInputStyle}
                value={formData.customer_name}
                onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
                placeholder="שם מלא"
              />
            </div>

            {/* פרטי קשר */}
            <div style={inputGroupStyle}>
              <label style={labelStyle}>טלפון</label>
              <input 
                type="tel"
                style={modalInputStyle}
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="05X-XXXXXXX"
              />
            </div>

            <div style={inputGroupStyle}>
              <label style={labelStyle}>אימייל</label>
              <input 
                type="email"
                style={modalInputStyle}
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="mail@example.com"
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
                placeholder="לדוגמה: הכלנית 5"
              />
            </div>

            <div style={{...inputGroupStyle, gridColumn: isMobile ? 'auto' : 'span 2'}}>
              <label style={labelStyle}>מיקום מפורט (דירה/הערות הגעה)</label>
              <input 
                style={modalInputStyle}
                value={formData.address_detail}
                onChange={(e) => setFormData({...formData, address_detail: e.target.value})}
                placeholder="כניסה ב', קומה 2..."
              />
            </div>

            {/* נתונים טכניים */}
            <div style={inputGroupStyle}>
              <label style={labelStyle}>קריאה התחלתית (m³)</label>
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
                <option value="משני">משני (דירתי)</option>
                <option value="ראשי">ראשי (בנייני)</option>
              </select>
            </div>

            <div style={inputGroupStyle}>
              <label style={labelStyle}>סטטוס ראשוני</label>
              <select 
                style={modalInputStyle}
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
              >
                <option value="פעיל">✅ פעיל</option>
                <option value="מושבת">❌ מושבת</option>
                <option value="תקול">⚠️ תקול</option>
              </select>
            </div>
          </div>

          <div style={{
            ...footerStyle,
            flexDirection: isMobile ? 'column-reverse' : 'row'
          }}>
            <button type="button" onClick={onClose} style={cancelBtnStyle}>ביטול</button>
            <button type="submit" disabled={isSaving} style={saveBtnStyle}>
              {isSaving ? "שומר נתונים..." : <><Check size={18} /> הוסף מונה</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Styles ---
const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' };
const modalContentStyle = { backgroundColor: 'white', borderRadius: '20px', maxHeight: '95vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', direction: 'rtl' };
const modalHeaderStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderBottom: '1px solid #f0f0f0', paddingBottom: '15px' };
const closeIconBtnStyle = { border: 'none', background: 'none', cursor: 'pointer', color: '#a0aec0' };
const errorBannerStyle = { backgroundColor: '#fff5f5', color: '#c53030', padding: '12px', borderRadius: '10px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', border: '1px solid #feb2b2' };
const formGridStyle = { display: 'grid', gap: '15px' };
const inputGroupStyle = { display: 'flex', flexDirection: 'column', gap: '4px' };
const labelStyle = { fontSize: '12px', fontWeight: '700', color: '#4a5568', paddingRight: '2px' };
const modalInputStyle = { padding: '10px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '14px', backgroundColor: '#f8fafc' };
const footerStyle = { marginTop: '30px', display: 'flex', gap: '12px' };
const saveBtnStyle = { flex: 2, backgroundColor: '#3182ce', color: 'white', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' };
const cancelBtnStyle = { flex: 1, backgroundColor: '#f7fafc', color: '#718096', border: '1px solid #e2e8f0', padding: '14px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' };

export default AddMeter;