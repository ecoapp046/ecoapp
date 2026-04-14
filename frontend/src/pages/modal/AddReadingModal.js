import React, { useState } from 'react';
import axios from 'axios';
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
      // שליחת הקריאה החדשה לשרת
      await axios.post(`http://127.0.0.1:8000/add-reading`, {
        meter_id: meterId,
        value: parseFloat(value),
        date: new Date().toISOString(),
        technician: "מנהל מערכת" // אפשר לשנות בהמשך
      });
      
      onSuccess(); // רענון הנתונים בדף הראשי
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
          <X cursor="pointer" onClick={onClose} />
        </div>
        
        <form onSubmit={handleSubmit} style={formStyle}>
          <label style={labelStyle}>מספר מונה: {meterId}</label>
          <input
            type="number"
            step="0.1"
            placeholder="הזן קריאה נוכחית (קווב)"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            style={inputStyle}
            autoFocus
          />
          <div style={actionsStyle}>
            <button type="button" onClick={onClose} style={cancelBtn}>ביטול</button>
            <button type="submit" disabled={loading} style={submitBtn}>
              {loading ? "שומר..." : "שמור קריאה"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// סטיילים למודאל
const overlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const modalStyle = { backgroundColor: 'white', padding: '25px', borderRadius: '16px', width: '350px', direction: 'rtl' };
const headerStyle = { display: 'flex', justifyContent: 'space-between', marginBottom: '20px' };
const formStyle = { display: 'flex', flexDirection: 'column', gap: '15px' };
const labelStyle = { fontSize: '14px', color: '#666' };
const inputStyle = { padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '16px', outline: 'none' };
const actionsStyle = { display: 'flex', gap: '10px', marginTop: '10px' };
const cancelBtn = { flex: 1, padding: '10px', border: 'none', borderRadius: '8px', cursor: 'pointer' };
const submitBtn = { flex: 2, padding: '10px', border: 'none', borderRadius: '8px', cursor: 'pointer', backgroundColor: '#3182ce', color: 'white', fontWeight: 'bold' };

export default AddReadingModal;