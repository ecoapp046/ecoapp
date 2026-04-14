import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Save, User, Phone, Mail, Users, MapPin, Info } from 'lucide-react';

function EditMeterModal({ isOpen, onClose, meterData, onSuccess }) {
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
    try {
      // המרה של מספר נפשות למספר לפני השליחה
      const dataToSend = {
        ...formData,
        residents_count: parseInt(formData.residents_count) || 0
      };
      
      await axios.put(`http://127.0.0.1:8000/update-meter/${meterData.id}`, dataToSend);
      onSuccess(); // רענון הנתונים בדף הראשי
      onClose();   // סגירת המודאל
    } catch (error) {
      console.error("Update error:", error);
      alert("שגיאה בעדכון המונה. וודא שהשרת פעיל.");
    }
  };

  return (
    <div style={modalOverlayStyle}>
      <div style={modalContentStyle}>
        <div style={modalHeaderStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Edit3 size={20} color="#3182ce" />
            <h3 style={{ margin: 0 }}>עריכת פרטי מונה {meterData?.id}</h3>
          </div>
          <X onClick={onClose} style={{ cursor: 'pointer', color: '#a0aec0' }} />
        </div>
        
        <form onSubmit={handleSubmit} style={formStyle}>
          
          {/* סעיף פרטי לקוח */}
          <div style={sectionTitleStyle}><User size={14}/> פרטי לקוח</div>
          <div style={gridRow}>
            <div style={inputGroup}>
              <label style={labelStyle}>שם לקוח</label>
              <input 
                type="text" 
                value={formData.customer_name}
                onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
                style={inputStyle}
                placeholder="שם מלא"
              />
            </div>
            <div style={inputGroup}>
              <label style={labelStyle}>טלפון</label>
              <input 
                type="tel" 
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                style={inputStyle}
                placeholder="050-0000000"
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
          <div style={gridRow}>
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
              style={inputStyle}
            >
              <option value="פעיל">✅ פעיל</option>
              <option value="מושבת">❌ מושבת</option>
              <option value="בתיקון">🛠️ בתיקון</option>
            </select>
          </div>

          <div style={footerActions}>
            <button type="button" onClick={onClose} style={cancelBtnStyle}>ביטול</button>
            <button type="submit" style={saveBtnStyle}>
              <Save size={18} /> שמירת שינויים
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- Icons Helper ---
const Edit3 = ({size, color}) => <Info size={size} color={color} />;

// --- Styles ---
const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(2px)' };
const modalContentStyle = { backgroundColor: 'white', padding: '25px', borderRadius: '16px', width: '480px', direction: 'rtl', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' };
const modalHeaderStyle = { display: 'flex', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid #f0f0f0', paddingBottom: '15px' };
const formStyle = { display: 'flex', flexDirection: 'column', gap: '12px' };
const gridRow = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' };
const inputGroup = { display: 'flex', flexDirection: 'column', gap: '5px' };
const labelStyle = { fontSize: '13px', fontWeight: '700', color: '#4a5568', marginRight: '4px' };
const inputStyle = { padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '15px', outline: 'none', transition: 'border 0.2s' };
const sectionTitleStyle = { fontSize: '12px', fontWeight: '800', color: '#3182ce', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '5px', borderBottom: '1px solid #ebf8ff', paddingBottom: '5px' };
const footerActions = { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px', borderTop: '1px solid #f0f0f0', paddingTop: '15px' };
const saveBtnStyle = { backgroundColor: '#3182ce', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' };
const cancelBtnStyle = { backgroundColor: '#edf2f7', color: '#4a5568', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' };

export default EditMeterModal;