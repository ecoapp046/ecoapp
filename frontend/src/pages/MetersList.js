import React, { useState, useEffect } from 'react';
import api from '../api/api';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react'; // הוספתי ChevronUp
import AddMeter from './components/AddMeter'; 
import { useIsMobile } from '../hooks/useIsMobile';

function MetersList() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [meters, setMeters] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  
  const [selectedSettlement, setSelectedSettlement] = useState('כל היישובים');
  const [selectedStatus, setSelectedStatus] = useState('הכל');

  // --- State חדש לניהול ה-Dropdowns ---
  const [expandedSettlements, setExpandedSettlements] = useState({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const [metersRes, settlementsRes] = await Promise.all([
        api.get('/get-meters'),
        api.get('/get-settlements')
      ]);
      setMeters(metersRes.data);
      setSettlements(settlementsRes.data);
      
      // אופציונלי: פתיחת כל היישובים כברירת מחדל בטעינה ראשונה
      const initialExpanded = {};
      settlementsRes.data.forEach(s => initialExpanded[s.name] = true);
      setExpandedSettlements(initialExpanded);
      
    } catch (error) {
      console.error("שגיאה בטעינה:", error);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // פונקציה לשינוי מצב הפתיחה/סגירה
  const toggleSettlement = (cityName) => {
    setExpandedSettlements(prev => ({
      ...prev,
      [cityName]: !prev[cityName]
    }));
  };

  const filteredMeters = meters.filter(m => {
    const matchesSearch = 
      m.id.toString().includes(searchTerm) || 
      (m.customer_name && m.customer_name.includes(searchTerm)) ||
      (m.address && m.address.includes(searchTerm));

    const matchesSettlement = 
      selectedSettlement === 'כל היישובים' || 
      m.settlement_name === selectedSettlement;

    const matchesStatus = 
      selectedStatus === 'הכל' || 
      m.status === selectedStatus;

    return matchesSearch && matchesSettlement && matchesStatus;
  });

  const groupedMeters = filteredMeters.reduce((acc, meter) => {
    const cityName = meter.settlement_name || "ללא יישוב";
    if (!acc[cityName]) acc[cityName] = [];
    acc[cityName].push(meter);
    return acc;
  }, {});

  const dynamicFilterRow = {
    ...filterContainerStyle,
    flexDirection: isMobile ? 'column' : 'row',
    alignItems: isMobile ? 'stretch' : 'center',
    gap: isMobile ? '10px' : '15px'
  };

  return (
    <div style={{...containerStyle, padding: isMobile ? '15px' : '40px'}}>
      
      {/* כותרת עליונה */}
      <div style={{...headerStyle, flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', gap: '15px'}}>
        <div style={{ textAlign: 'right' }}>
          <h1 style={{ margin: 0, fontSize: isMobile ? '24px' : '28px', fontWeight: 'bold' }}>ניהול מונים</h1>
          <span style={{ color: '#666', fontSize: '14px' }}>{filteredMeters.length} מונים נמצאו</span>
        </div>
        <button style={{...addBtnStyle, width: isMobile ? '100%' : 'auto'}} onClick={() => setIsAdding(true)}>
          <Plus size={18} /> מונה חדש
        </button>
      </div>

      {/* שורת פילטרים וחיפוש */}
      <div style={dynamicFilterRow}>
        <div style={searchWrapperStyle}>
          <input 
            style={searchInputStyle} 
            placeholder="חיפוש לפי מספר מונה, שם..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search size={18} color="#999" />
        </div>
        
        <div style={{ display: 'flex', gap: '10px', width: isMobile ? '100%' : 'auto' }}>
            <select 
              style={{...selectStyle, flex: 1}} 
              value={selectedSettlement}
              onChange={(e) => setSelectedSettlement(e.target.value)}
            >
              <option value="כל היישובים">כל היישובים</option>
              {settlements.map((s) => (
                <option key={s.id} value={s.name}>{s.name}</option>
              ))}
            </select>

            <select 
              style={{...selectStyle, flex: 1}}
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="הכל">כל הסטטוסים</option>
              <option value="פעיל">פעיל</option>
              <option value="מושבת">מושבת</option>
              <option value="תקול">תקול</option>
              <option value="בתיקון">בתיקון</option>
            </select>

            {!isMobile && (
                <button onClick={fetchData} style={refreshBtnStyle} title="רענן נתונים">
                  <RefreshCw size={20} className={loading ? 'spin' : ''} />
                </button>
            )}
        </div>
      </div>

      {/* רשימת המונים מקובצת עם יכולת צמצום */}
      {Object.keys(groupedMeters).length > 0 ? (
        Object.keys(groupedMeters).map((city) => (
          <div key={city} style={groupCardStyle}>
            {/* כותרת קבוצה - לחיצה עליה מצמצמת/פותחת */}
            <div 
                style={{...groupHeaderStyle, cursor: 'pointer'}} 
                onClick={() => toggleSettlement(city)}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={blueDotStyle}></div>
                  <span style={{ color: '#3182ce', fontWeight: 'bold', fontSize: '16px' }}>{city}</span>
                  <span style={{ color: '#999', fontSize: '13px' }}>({groupedMeters[city].length})</span>
                </div>
                {expandedSettlements[city] ? <ChevronUp size={18} color="#999" /> : <ChevronDown size={18} color="#999" />}
            </div>

            {/* תוכן הטבלה - מוצג רק אם היישוב פתוח ב-State */}
            {expandedSettlements[city] && (
                <div style={{ overflowX: 'auto', width: '100%', animation: 'fadeIn 0.2s ease-out' }}>
                    <table style={{...tableStyle, minWidth: isMobile ? '600px' : '100%'}}>
                      <thead>
                        <tr style={thRowStyle}>
                          <th style={thPadding}>מספר מונה</th>
                          <th style={thPadding}>סוג</th>
                          <th style={thPadding}>תושב</th>
                          <th style={thPadding}>כתובת</th>
                          <th style={thPadding}>קריאה</th>
                          <th style={thPadding}>סטטוס</th>
                        </tr>
                      </thead>
                      <tbody>
                        {groupedMeters[city].map((m) => (
                          <tr key={m.id} style={trStyle}>
                            <td style={tdPadding}>
                              <span onClick={() => navigate(`/meter/${m.id}`)} style={meterLinkStyle}>
                                {m.id}
                              </span>
                            </td>
                            <td style={tdPadding}>{m.type || 'משני'}</td>
                            <td style={tdPadding}>{m.customer_name || '—'}</td>
                            <td style={tdPadding}>{m.address || '—'}</td>
                            <td style={tdPadding}>{m.current_reading} קו"ב</td>
                            <td style={tdPadding}>
                              <span style={statusBadgeStyle(m.status)}>{m.status || 'פעיל'}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                </div>
            )}
          </div>
        ))
      ) : (
        <div style={noResultsStyle}>
          <Search size={48} color="#e2e8f0" />
          <p>לא נמצאו מונים</p>
          <button 
            onClick={() => {setSearchTerm(''); setSelectedSettlement('כל היישובים'); setSelectedStatus('הכל');}} 
            style={{color: '#3182ce', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold'}}
          >
            אפס פילטרים
          </button>
        </div>
      )}

      <AddMeter 
        isOpen={isAdding} 
        onClose={() => setIsAdding(false)} 
        settlements={settlements} 
        onMeterAdded={fetchData} 
      />

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}

// --- Styles (ללא שינוי) ---
const containerStyle = { direction: 'rtl', backgroundColor: '#f4f7fa', minHeight: '100vh', boxSizing: 'border-box' };
const headerStyle = { display: 'flex', justifyContent: 'space-between', marginBottom: '30px' };
const addBtnStyle = { backgroundColor: '#3182ce', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' };
const filterContainerStyle = { display: 'flex', marginBottom: '25px', width: '100%', boxSizing: 'border-box' };
const searchWrapperStyle = { flex: 2, display: 'flex', alignItems: 'center', backgroundColor: 'white', padding: '0 15px', borderRadius: '12px', border: '1px solid #e2e8f0', height: '45px', boxSizing: 'border-box' };
const searchInputStyle = { border: 'none', outline: 'none', padding: '10px', width: '100%', fontSize: '14px', textAlign: 'right', backgroundColor: 'transparent' };
const selectStyle = { padding: '0 10px', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: 'white', height: '45px', cursor: 'pointer', outline: 'none', boxSizing: 'border-box' };
const refreshBtnStyle = { height: '45px', width: '45px', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const groupCardStyle = { backgroundColor: 'white', borderRadius: '16px', marginBottom: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', overflow: 'hidden', border: '1px solid #edf2f7' };
const groupHeaderStyle = { padding: '15px 25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #edf2f7', backgroundColor: '#fafafa' };
const blueDotStyle = { width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3182ce' };
const tableStyle = { width: '100%', borderCollapse: 'collapse', textAlign: 'right' };
const thRowStyle = { borderBottom: '1px solid #edf2f7', color: '#a0aec0', fontSize: '12px' };
const thPadding = { padding: '16px 15px', fontWeight: 'bold' };
const tdPadding = { padding: '16px 15px', fontSize: '14px', color: '#2d3748' };
const trStyle = { borderBottom: '1px solid #edf2f7' };
const meterLinkStyle = { color: '#3182ce', fontWeight: '800', cursor: 'pointer', textDecoration: 'underline' };
const noResultsStyle = { textAlign: 'center', padding: '60px', color: '#a0aec0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' };

const statusBadgeStyle = (status) => {
  const isOk = status === 'פעיל';
  const isWarning = status === 'בתיקון' || status === 'מושבת';
  return { 
    padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', whiteSpace: 'nowrap',
    backgroundColor: isOk ? '#f0fff4' : isWarning ? '#fffaf0' : '#fff5f5', 
    color: isOk ? '#38a169' : isWarning ? '#dd6b20' : '#e53e3e',
    border: `1px solid ${isOk ? '#9ae6b4' : isWarning ? '#fbd38d' : '#feb2b2'}`
  };
};

export default MetersList;