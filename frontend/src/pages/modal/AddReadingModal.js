import React, { useState } from 'react';
import api from '../../api/api';
import { X } from 'lucide-react';

function AddReadingModal({ isOpen, onClose, meterId, onSuccess }) {
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!value) return alert("נא להזין קריאה");

    setLoading(true);
    try {
      // שליחת הקריאה החדשה לשרת דרך ה-api המרכזי
      await api.post('/add-reading', {
        meter_id: meterId,
        value: parseFloat(value),
        date: new Date().toISOString(),
        technician: "מנהל מערכת"
      });
      
      onSuccess(); // רענון הנתונים בדף האב
      onClose();   // סגירת המודאל
      setValue('');
    } catch (error) {
      console.error("Error adding reading:", error);
      alert("שגיאה בהוספת הקריאה");
    }
    setLoading(false);
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={headerStyle}>
          <h3 style={{ margin: 0 }}>הוספת קריאה חדשה</h3>
          <X cursor="pointer" onClick={onClose} size={20} />
        </div>
        
        <form onSubmit={handleSubmit} style={formStyle}>
          <div style={{ marginBottom: '5px' }}>
            <label style={labelStyle}>מספר מונה: </label>
            <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{meterId}</span>
          </div>

          <input
            type="number"
            step="0.1"
            placeholder="הזן קריאה נוכחית (קו״ב)"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            style={inputStyle}
            autoFocus
            required
          />

          <div style={actionsStyle}>
            <button type="button" onClick={onClose} style={cancelBtn}>
              ביטול
            </button>
            <button type="submit" disabled={loading} style={submitBtn}>
              {loading ? "שומר..." : "שמור קריאה"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- Styles ---
const overlayStyle = { 
  position: 'fixed', 
  top: 0, 
  left: 0, 
  right: 0, 
  bottom: 0, 
  backgroundColor: 'rgba(0,0,0,0.5)', 
  display: 'flex', 
  justifyContent: 'center', 
  alignItems: 'center', 
  zIndex: 1000 
};

const modalStyle = { 
  backgroundColor: 'white', 
  padding: '25px', 
  borderRadius: '16px', 
  width: '350px', 
  direction: 'rtl',
  boxShadow: '0 10px 25px rgba(0,0,0,0.1)' 
};

const headerStyle = { 
  display: 'flex', 
  justifyContent: 'space-between', 
  alignItems: 'center',
  marginBottom: '20px' 
};

const formStyle = { 
  display: 'flex', 
  flexDirection: 'column', 
  gap: '15px' 
};

const labelStyle = { 
  fontSize: '14px', 
  color: '#666' 
};

const inputStyle = { 
  padding: '12px', 
  borderRadius: '8px', 
  border: '1px solid #ddd', 
  fontSize: '16px', 
  outline: 'none',
  textAlign: 'right' 
};

const actionsStyle = { 
  display: 'flex', 
  gap: '10px', 
  marginTop: '10px' 
};

const cancelBtn = { 
  flex: 1, 
  padding: '10px', 
  border: '1px solid #e2e8f0', 
  borderRadius: '8px', 
  cursor: 'pointer',
  backgroundColor: '#f8fafc',
  color: '#4a5568'
};

const submitBtn = { 
  flex: 2, 
  padding: '10px', 
  border: 'none', 
  borderRadius: '8px', 
  cursor: 'pointer', 
  backgroundColor: '#3182ce', 
  color: 'white', 
  fontWeight: 'bold' 
};

export default AddReadingModal;