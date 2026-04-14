import React, { useState, useEffect } from 'react';
import api from '../api/api'; // ייבוא ה-instance המרכזי
import { Droplets, Search, CheckCircle, ArrowRight, Hash, MapPin, Calendar } from 'lucide-react';
import { useIsMobile } from '../hooks/useIsMobile';

function TechnicianHome() {
  const isMobile = useIsMobile();
  const [meters, setMeters] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMeter, setSelectedMeter] = useState(null);
  const [currentValue, setCurrentValue] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchMeters = async () => {
    try {
      const response = await api.get('/get-meters');
      setMeters(response.data);
    } catch (error) {
      console.error("שגיאה במשיכת מונים:", error);
    }
  };

  useEffect(() => {
    fetchMeters();
  }, []);

  const filteredMeters = meters.filter(m => 
    m.id.toString().includes(searchTerm) || 
    (m.customer_name && m.customer_name.includes(searchTerm))
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMeter) return alert("אנא בחר מונה מהרשימה");

    // וולידציה בסיסית - מניעת הזנת קריאה נמוכה מהקודמת ללא אישור
    if (parseFloat(currentValue) < (parseFloat(selectedMeter.current_reading) || 0)) {
      if (!window.confirm("שים לב: הקריאה שהזנת נמוכה מהקריאה הקודמת. האם להמשיך?")) {
        return;
      }
    }

    setLoading(true);
    try {
      await api.post('/submit-reading', {
        meter_id: selectedMeter.id,
        customer_name: selectedMeter.customer_name,
        location: selectedMeter.settlement_name || "לא הוגדר",
        current_value: parseFloat(currentValue),
        technician_id: "Tech_Shomron_01" // כאן אפשר יהיה בעתיד למשוך את ה-ID מה-Context של המשתמש
      });

      alert(`הקריאה למונה ${selectedMeter.id} נשמרה בהצלחה!`);
      setSelectedMeter(null);
      setSearchTerm('');
      setCurrentValue('');
      fetchMeters(); 
    } catch (error) {
      alert("שגיאה בשמירה. וודא שהשרת פעיל.");
    }
    setLoading(false);
  };

  return (
    <div style={{ 
      padding: isMobile ? '15px' : '20px', 
      maxWidth: '600px', 
      margin: 'auto', 
      fontFamily: 'system-ui, sans-serif', 
      direction: 'rtl',
      minHeight: '100vh',
      boxSizing: 'border-box'
    }}>
      <header style={{ textAlign: 'center', marginBottom: isMobile ? '20px' : '30px' }}>
        <h2 style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          gap: '10px', 
          color: '#007bff', 
          margin: '0',
          fontSize: isMobile ? '22px' : '28px'
        }}>
          <Droplets size={isMobile ? 28 : 32} /> דיווח קריאות שטח
        </h2>
        <p style={{ color: '#666', marginTop: '5px', fontSize: '14px' }}>ניהול משק המים - שומרון</p>
      </header>

      {!selectedMeter ? (
        /* שלב א: חיפוש מונה */
        <div style={{ animation: 'fadeIn 0.3s' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            border: '2px solid #007bff', 
            borderRadius: '15px', 
            padding: '12px', 
            backgroundColor: 'white', 
            boxShadow: '0 4px 6px rgba(0,123,255,0.1)',
            boxSizing: 'border-box'
          }}>
            <Search size={20} color="#007bff" style={{ marginLeft: '10px' }} />
            <input 
              type="text" 
              placeholder="חפש מספר מונה או שם..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ border: 'none', outline: 'none', width: '100%', fontSize: '16px', backgroundColor: 'transparent' }}
            />
          </div>

          {searchTerm && (
            <div style={{ 
              marginTop: '15px', 
              border: '1px solid #ddd', 
              borderRadius: '15px', 
              maxHeight: isMobile ? '400px' : '500px', 
              overflowY: 'auto', 
              backgroundColor: '#fff', 
              boxShadow: '0 10px 25px rgba(0,0,0,0.1)' 
            }}>
              {filteredMeters.length > 0 ? (
                filteredMeters.map(m => (
                  <div 
                    key={m.id} 
                    onClick={() => setSelectedMeter(m)} 
                    style={{ 
                      padding: '16px', 
                      borderBottom: '1px solid #f0f0f0', 
                      cursor: 'pointer',
                      transition: 'background 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8fbff'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#fff'}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '16px' }}>{m.customer_name}</strong>
                      <span style={{ fontSize: '12px', color: '#007bff', fontWeight: 'bold', background: '#eef6ff', padding: '2px 8px', borderRadius: '6px' }}>#{m.id}</span>
                    </div>
                    <div style={{ fontSize: '13px', color: '#666', marginTop: '6px', display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={12} /> {m.settlement_name}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={12} /> {m.current_reading_date || "אין תאריך"}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>לא נמצאו מונים</div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* שלב ב: הזנת קריאה */
        <form onSubmit={handleSubmit} style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '20px', 
          background: '#fff', 
          padding: isMobile ? '20px' : '30px', 
          borderRadius: '25px', 
          boxShadow: '0 15px 35px rgba(0,0,0,0.08)', 
          border: '1px solid #eee', 
          animation: 'slideUp 0.3s',
          boxSizing: 'border-box'
        }}>
          <div>
            <button 
              type="button" 
              onClick={() => setSelectedMeter(null)} 
              style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '14px', padding: '0', marginBottom: '15px' }}
            >
              <ArrowRight size={18} /> חזור לחיפוש
            </button>
            <h3 style={{ margin: '0', fontSize: '20px' }}>{selectedMeter.customer_name}</h3>
            <div style={{ display: 'flex', gap: '15px', color: '#666', fontSize: '14px', marginTop: '6px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Hash size={14} /> מונה: {selectedMeter.id}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={14} /> {selectedMeter.settlement_name}</span>
            </div>
          </div>

          {/* כרטיס קריאה קודמת */}
          <div style={{ backgroundColor: '#f0f7ff', padding: '20px', borderRadius: '20px', textAlign: 'center', border: '1px dashed #007bff' }}>
            <span style={{ fontSize: '14px', color: '#0056b3', fontWeight: '500' }}>קריאה אחרונה במערכת:</span>
            <div style={{ fontSize: isMobile ? '36px' : '42px', fontWeight: '900', color: '#007bff', margin: '5px 0' }}>
              {selectedMeter.current_reading || 0} <small style={{ fontSize: '18px' }}>מ"ק</small>
            </div>
            <div style={{ fontSize: '12px', color: '#666', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
              <Calendar size={14} /> עודכן ב: {selectedMeter.current_reading_date || "לא ידוע"}
            </div>
          </div>

          <div>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px', fontSize: '16px', textAlign: 'center' }}>הזן קריאה נוכחית:</label>
            <input 
              type="number" 
              step="0.1"
              value={currentValue}
              onChange={(e) => setCurrentValue(e.target.value)}
              placeholder="0.0"
              style={{ 
                width: '100%', 
                padding: '15px', 
                fontSize: '32px', 
                borderRadius: '15px', 
                border: '2px solid #007bff', 
                textAlign: 'center', 
                fontWeight: 'bold', 
                outline: 'none', 
                boxSizing: 'border-box',
                backgroundColor: '#fff'
              }}
              required 
              autoFocus
            />
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            style={{ 
              backgroundColor: '#28a745', 
              color: 'white', 
              padding: '18px', 
              borderRadius: '15px', 
              border: 'none', 
              fontSize: '18px', 
              fontWeight: 'bold', 
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              boxShadow: '0 8px 20px rgba(40, 167, 69, 0.2)',
              marginTop: '10px'
            }}
          >
            {loading ? 'שומר נתונים...' : <><CheckCircle size={22} /> אישור ושמירה</>}
          </button>
        </form>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(15px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        /* הסתרת חיצים באינפוט מספרים */
        input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
      `}</style>
    </div>
  );
}

export default TechnicianHome;