import React, { useState, useEffect } from 'react';
import api from '../../api/api';
import { X, Save, User, Phone, Mail, Users, MapPin, Info, Edit3 } from 'lucide-react';
import { useIsMobile } from '../../hooks/useIsMobile';

function EditMeterModal({ isOpen, onClose, meterData, onSuccess }) {
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    customer_name: '',
    address: '',
    phone: '',
    email: '',
    residents_count: 1,
    address_detail: '',
    status: 'פעיל'
  });

  // טעינת הנתונים הקיימים לתוך הטופס כשהמודאל נפתח
  useEffect(() => {
    if (meterData && isOpen) {
      setFormData({
        customer_name: meterData.customer_name || '',
        address: meterData.address || '',
        phone: meterData.phone || '',
        email: meterData.email || '',
        residents_count: meterData.residents_count || 1,
        address_detail: meterData.address_detail || '',
        status: meterData.status || 'פעיל'
      });
    }
  }, [meterData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const dataToSend = {
        ...formData,
        residents_count: parseInt(formData.residents_count) || 0
      };
      
      // שימוש ב-api.put עם נתיב יחסי
      await api.put(`/update-meter/${meterData.id}`, dataToSend);
      
      onSuccess(); // רענון הנתונים בדף הראשי
      onClose();   // סגירת המודאל
    } catch (error) {
      console.error("Update error:", error);
      alert("שגיאה בעדכון המונה. וודא שהשרת פעיל.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={modalOverlayStyle}>
      <div style={{
        ...modalContentStyle, 
        width: isMobile ? '95%' : '480px',
        maxHeight: isMobile ? '90vh' : 'auto',
        overflowY: 'auto'
      }}>
        <div style={modalHeaderStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Edit3 size={20} color="#3182ce" />
            <h3 style={{ margin: 0, fontSize: isMobile ? '18px' : '20px' }}>עריכת מונה {meterData?.id}</h3>
          </div>
          <X onClick={onClose} style={{ cursor: 'pointer', color: '#a0aec0' }} />
        </div>
        
        <form onSubmit={handleSubmit} style={formStyle}>
          
          {/* סעיף פרטי לקוח */}
          <div style={sectionTitleStyle}><User size={14}/> פרטי לקוח</div>
          <div style={{...gridRow, gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr'}}>
            <div style={inputGroup}>
              <label style={labelStyle}>שם לקוח</label>
              <input 
                type="text" 
                value={formData.customer_name}
                onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
                style={inputStyle}
                placeholder="שם מלא"
                required
              />
            </div>
            <div style={inputGroup}>
              <label style={labelStyle}>טלפון</label>
              <input 
                type="tel" 
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                style={inputStyle}
                placeholder="05X-XXXXXXX"
              />
            </div>
          </div>

          <div style={inputGroup}>
            <label style={labelStyle}>אימייל</label>
            <input 
              type="email" 
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              style={inputStyle}
              placeholder="example@mail.com"
            />
          </div>

          {/* סעיף מיקום ומגורים */}
          <div style={{...sectionTitleStyle, marginTop: '10px'}}><MapPin size={14}/> מיקום ומגורים</div>
          <div style={{...gridRow, gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr'}}>
            <div style={inputGroup}>
              <label style={labelStyle}>כתובת (רחוב)</label>
              <input 
                type="text" 
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                style={inputStyle}
              />
            </div>
            <div style={inputGroup}>
              <label style={labelStyle}>מספר נפשות</label>
              <input 
                type="number" 
                min="1"
                value={formData.residents_count}
                onChange={(e) => setFormData({...formData, residents_count: e.target.value})}
                style={inputStyle}
              />
            </div>
          </div>

          <div style={inputGroup}>
            <label style={labelStyle}>מיקום מפורט (דירה/כניסה/הערות)</label>
            <input 
              type="text" 
              value={formData.address_detail}
              onChange={(e) => setFormData({...formData, address_detail: e.target.value})}
              style={inputStyle}
              placeholder="לדוגמה: כניסה ב', קומה 2"
            />
          </div>

          {/* סטטוס */}
          <div style={{...inputGroup, marginTop: '10px'}}>
            <label style={labelStyle}>סטטוס מונה</label>
            <select 
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value})}
              style={{...inputStyle, backgroundColor: formData.status === 'מושבת' ? '#fff5f5' : '#fff'}}
            >
              <option value="פעיל">✅ פעיל</option>
              <option value="מושבת">❌ מושבת</option>
              <option value="בתיקון">🛠️ בתיקון</option>
            </select>
          </div>

          <div style={{
            ...footerActions, 
            flexDirection: isMobile ? 'column-reverse' : 'row',
            gap: isMobile ? '12px' : '10px'
          }}>
            <button type="button" onClick={onClose} style={{...cancelBtnStyle, width: isMobile ? '100%' : 'auto'}}>
              ביטול
            </button>
            <button type="submit" disabled={loading} style={{...saveBtnStyle, width: isMobile ? '100%' : 'auto'}}>
              <Save size={18} /> {loading ? "מעדכן..." : "שמירת שינויים"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- Styles ---
const modalOverlayStyle = { 
  position: 'fixed', 
  top: 0, left: 0, right: 0, bottom: 0, 
  backgroundColor: 'rgba(0,0,0,0.6)', 
  display: 'flex', 
  justifyContent: 'center', 
  alignItems: 'center', 
  zIndex: 1000, 
  backdropFilter: 'blur(2px)' 
};

const modalContentStyle = { 
  backgroundColor: 'white', 
  padding: '25px', 
  borderRadius: '16px', 
  direction: 'rtl', 
  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' 
};

const modalHeaderStyle = { 
  display: 'flex', 
  justifyContent: 'space-between', 
  alignItems: 'center',
  marginBottom: '20px', 
  borderBottom: '1px solid #f0f0f0', 
  paddingBottom: '15px' 
};

const formStyle = { display: 'flex', flexDirection: 'column', gap: '12px' };
const gridRow = { display: 'grid', gap: '15px' };
const inputGroup = { display: 'flex', flexDirection: 'column', gap: '5px' };
const labelStyle = { fontSize: '13px', fontWeight: '700', color: '#4a5568', marginRight: '4px', textAlign: 'right' };
const inputStyle = { padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '15px', outline: 'none', transition: 'border 0.2s', textAlign: 'right' };
const sectionTitleStyle = { fontSize: '12px', fontWeight: '800', color: '#3182ce', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '5px', borderBottom: '1px solid #ebf8ff', paddingBottom: '5px', textAlign: 'right' };
const footerActions = { display: 'flex', justifyContent: 'flex-end', marginTop: '20px', borderTop: '1px solid #f0f0f0', paddingTop: '15px' };
const saveBtnStyle = { backgroundColor: '#3182ce', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 'bold' };
const cancelBtnStyle = { backgroundColor: '#edf2f7', color: '#4a5568', border: 'none', padding: '12px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', textAlign: 'center' };

export default EditMeterModal;