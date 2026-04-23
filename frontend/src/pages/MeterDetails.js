import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/api'; 
import { 
  ArrowRight, Edit2, RefreshCw, Trash2, Calendar, User, 
  MapPin, Droplets, Clock, History, Plus, Phone, Mail, Users, Info 
} from 'lucide-react';

import AddReadingModal from './modal/AddReadingModal';
import EditMeterModal from './modal/EditMeterModal';
import { useIsMobile } from '../hooks/useIsMobile';

function MeterDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  const [meter, setMeter] = useState(null);
  const [history, setHistory] = useState([]); 
  const [loading, setLoading] = useState(true);
  
  const [isReadingModalOpen, setIsReadingModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // פונקציה לטעינת הנתונים מהשרת
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [meterRes, historyRes] = await Promise.all([
        api.get(`/get-meter/${id}`),
        api.get(`/get-meter-history/${id}`)
      ]);
      setMeter(meterRes.data);
      setHistory(historyRes.data);
    } catch (error) {
      console.error("Fetch error:", error);
      alert("שגיאה בטעינת נתונים");
      navigate('/meters');
    }
    setLoading(false);
  }, [id, navigate]);

  useEffect(() => { 
    fetchData(); 
  }, [fetchData]);

  const handleEdit = () => setIsEditModalOpen(true);
  
  const handleReplace = async () => {
    const newId = prompt("הזן מספר מונה פיזי חדש:");
    if (!newId || newId.trim() === id) return;

    if (window.confirm(`האם להעביר את הנתונים למונה חדש שמספרו ${newId}?`)) {
      try {
        await api.put(`/update-meter-full/${id}`, {
          new_id: newId.trim(),
          status: "פעיל",
          current_reading: "0",
          technician_name: "מנהל מערכת" 
        });
        
        alert("המונה הוחלף בהצלחה!");
        navigate(`/meter/${newId.trim()}`);
      } catch (e) { 
        alert(e.response?.data?.detail || "שגיאה בתהליך ההחלפה"); 
      }
    }
  };

  const handleDelete = async () => {
    if (window.confirm("מחיקת מונה היא פעולה סופית. האם להמשיך?")) {
      try {
        await api.delete(`/delete-meter/${id}`);
        navigate('/meters');
      } catch (e) { 
        alert("שגיאה במחיקה"); 
      }
    }
  };

  if (loading) return (
    <div style={centerStyle}>
      <RefreshCw className="spin" size={32} color="#3182ce" />
      <span style={{ marginTop: '10px', fontWeight: 'bold' }}>טוען נתונים...</span>
    </div>
  );

  if (!meter) return null;

  return (
    <div style={{...containerStyle, padding: isMobile ? '12px' : '30px'}}>
      
      {/* תפריט עליון ופעולות */}
      <div style={{
        ...topNavStyle, 
        flexDirection: isMobile ? 'column' : 'row', 
        alignItems: isMobile ? 'stretch' : 'center', 
        gap: isMobile ? '15px' : '20px'
      }}>
        <button onClick={() => navigate('/meters')} style={backBtnStyle}>
          <ArrowRight size={20} /> חזרה לרשימה
        </button>
        
        <div style={{
          ...actionButtonsGroup, 
          width: isMobile ? '100%' : 'auto', 
          justifyContent: isMobile ? 'space-between' : 'flex-end'
        }}>
          <button onClick={handleEdit} style={actionBtn("#3182ce", isMobile)}>
            <Edit2 size={16} /> {!isMobile && 'עריכת פרטים'}
          </button>
          <button onClick={handleReplace} style={actionBtn("#4a5568", isMobile)}>
            <RefreshCw size={16} /> {!isMobile && 'החלפת מונה'}
          </button>
          <button onClick={handleDelete} style={actionBtn("#e53e3e", isMobile)}>
            <Trash2 size={16} /> {!isMobile && 'מחיקה'}
          </button>
        </div>
      </div>

      <div style={{
        ...mainGrid, 
        gridTemplateColumns: isMobile ? '1fr' : '1.2fr 1fr'
      }}>
        
        {/* כרטיס פרטים אישיים */}
        <div style={cardStyle}>
          <div style={cardHeader}>
            <div>
              <h2 style={{margin:0, fontSize: isMobile ? '18px' : '22px'}}>כרטיס מונה: {id}</h2>
              <div style={{display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', color: '#718096', fontSize: '13px'}}>
                <MapPin size={14} color="#e53e3e" />
                <span style={{fontWeight: '500'}}>{meter.settlement_name || 'יישוב לא הוגדר'}</span>
              </div>
            </div>
            <span style={statusBadge(meter.status)}>{meter.status}</span>
          </div>
          
          <div style={{
            ...detailsGrid, 
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr'
          }}>
            <InfoItem icon={<User color="#3182ce" size={18}/>} label="שם לקוח" value={meter.customer_name} />
            <PhoneItem label="טלפון" value={meter.phone} />
            <InfoItem icon={<Mail color="#805ad5" size={18}/>} label="אימייל" value={meter.email} />
            <InfoItem icon={<Users color="#dd6b20" size={18}/>} label="נפשות" value={meter.residents_count} />
            <InfoItem icon={<MapPin color="#3182ce" size={18}/>} label="יישוב" value={meter.settlement_name} />
            <InfoItem icon={<MapPin color="#e53e3e" size={18}/>} label="כתובת" value={meter.address} />
            <InfoItem icon={<Info color="#718096" size={18}/>} label="מיקום מפורט" value={meter.address_detail} />
            <InfoItem icon={<Calendar color="#3182ce" size={18}/>} label="סוג מונה" value={meter.type || 'משני'} />
          </div>
        </div>

        {/* כרטיס נתוני צריכה */}
        <div style={cardStyle}>
          <div style={cardHeader}>
            <h2 style={{margin:0, fontSize: isMobile ? '18px' : '22px'}}>נתוני צריכה</h2>
            <Droplets size={24} color="#3182ce" />
          </div>
          <div style={{...statsGrid, gridTemplateColumns: '1fr 1fr'}}>
            <StatBox label="קריאה נוכחית" value={meter.current_reading} unit='קו"ב' sub={meter.current_reading_date} isMobile={isMobile} />
            <StatBox label="קריאה קודמת" value={meter.last_reading} unit='קו"ב' sub={meter.last_reading_date} isMobile={isMobile} />
            <StatBox label='צריכה' value={meter.consumption} unit='קו"ב' highlight isMobile={isMobile} />
            {meter.residents_count > 0 && (
              <StatBox label='לנפש' value={(meter.consumption / meter.residents_count).toFixed(1)} unit='קו"ב' isMobile={isMobile} />
            )}
          </div>
        </div>
      </div>

      {/* היסטוריית קריאות */}
      <div style={{...cardStyle, marginTop: '25px', padding: isMobile ? '15px' : '24px'}}>
        <div style={{
          ...historyHeaderStyle, 
          flexDirection: isMobile ? 'column' : 'row', 
          alignItems: isMobile ? 'stretch' : 'center', 
          gap: '15px'
        }}>
          <h2 style={{margin:0, display:'flex', alignItems:'center', gap:'10px', fontSize: isMobile ? '18px' : '22px'}}>
            <History /> היסטוריית קריאות
          </h2>
          <button onClick={() => setIsReadingModalOpen(true)} style={{...addReadingBtnStyle, width: isMobile ? '100%' : 'auto'}}>
            <Plus size={18} /> קריאה חדשה
          </button>
        </div>

        <div style={{overflowX: 'auto', WebkitOverflowScrolling: 'touch'}}>
          <table style={{...tableStyle, minWidth: isMobile ? '450px' : '100%'}}>
            <thead>
              <tr style={thStyle}>
                <th style={{padding:'12px'}}>תאריך</th>
                <th>קריאה</th>
                <th>צריכה</th>
                <th>טכנאי / אירוע</th>
              </tr>
            </thead>
            <tbody>
              {history.length > 0 ? history.map((item, index) => {
                const isReplacement = item.log_type === 'REPLACEMENT' || item.type === 'REPLACEMENT_LOG' || (item.note && item.note.includes("החלפת מונה"));
                return (
                  <tr key={index} style={{...trStyle, backgroundColor: isReplacement ? '#fff5f5' : 'transparent', borderRight: isReplacement ? '5px solid #e53e3e' : 'none'}}>
                    <td style={{padding:'12px'}}>
                      <div style={{display:'flex', alignItems:'center', gap:'8px', fontSize: '13px'}}>
                        {isReplacement && <RefreshCw size={14} color="#e53e3e" />}
                        {item.date || item.date_display}
                      </div>
                    </td>
                    <td style={{fontWeight: isReplacement ? 'bold' : 'normal'}}>{item.value}</td>
                    <td style={{color: isReplacement ? '#e53e3e' : '#2b6cb0', fontWeight: 'bold'}}>
                      {isReplacement ? 'החלפה' : `+${item.consumption}`}
                    </td>
                    <td style={{fontSize: '13px'}}>
                      <div style={{display:'flex', flexDirection:'column'}}>
                        <span>{item.technician || '—'}</span>
                        {isReplacement && item.note && <small style={{color: '#c53030', fontSize: '11px'}}>{item.note}</small>}
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr><td colSpan="4" style={{textAlign:'center', padding:'40px', color:'#a0aec0'}}>אין נתונים</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* מודלים של עריכה והוספה */}
      <AddReadingModal 
        isOpen={isReadingModalOpen} 
        onClose={() => setIsReadingModalOpen(false)} 
        meterId={id} 
        onSuccess={fetchData} 
      />
      <EditMeterModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        meterData={{...meter, id}} 
        onSuccess={fetchData} 
      />
      
      {/* אנימציית סיבוב ועיצוב טבלה */}
      <style>{`
        .spin { animation: spin 1s linear infinite; } 
        @keyframes spin { to { transform: rotate(360deg); } }
        tbody tr:hover { background-color: #f7fafc; transition: background 0.2s; }
      `}</style>
    </div>
  );
}

// --- קומפוננטות עזר פנימיות ---

const InfoItem = ({icon, label, value}) => (
  <div style={infoItemStyle}>
    {icon}
    <div style={{overflow: 'hidden'}}>
      <div style={infoLabel}>{label}</div>
      <div style={{...infoValue, textOverflow: 'ellipsis', whiteSpace: 'nowrap'}} title={value}>{value || '—'}</div>
    </div>
  </div>
);

const PhoneItem = ({label, value}) => (
  <div style={infoItemStyle}>
    <Phone color="#38a169" size={18}/>
    <div>
      <div style={infoLabel}>{label}</div>
      <a href={`tel:${value}`} style={{...infoValue, color: '#3182ce', textDecoration: 'none'}}>{value || '—'}</a>
    </div>
  </div>
);

const StatBox = ({label, value, unit, sub, highlight, isMobile}) => (
  <div style={{
    ...statBoxStyle, 
    backgroundColor: highlight ? '#ebf8ff' : '#f7fafc', 
    border: highlight ? '1px solid #bee3f8' : '1px solid transparent',
    padding: isMobile ? '8px' : '15px'
  }}>
    <div style={infoLabel}>{label}</div>
    <div style={{
      ...infoValue, 
      fontSize: isMobile ? '18px' : '20px', 
      color: highlight ? '#2b6cb0' : '#2d3748'
    }}>
      {value} <small style={{fontSize:'10px'}}>{unit}</small>
    </div>
    {sub && <div style={{fontSize:'10px', color:'#a0aec0', marginTop:'4px'}}>
      <Clock size={10} style={{verticalAlign:'middle'}}/> {sub}
    </div>}
  </div>
);

// --- אובייקטי עיצוב (Styles) ---

const containerStyle = { direction: 'rtl', backgroundColor: '#f0f2f5', minHeight: '100vh', boxSizing: 'border-box', maxWidth: '100%', overflowX: 'hidden' };
const topNavStyle = { display: 'flex', justifyContent: 'space-between', marginBottom: '25px' };
const actionButtonsGroup = { display: 'flex', gap: '8px' };
const actionBtn = (color, isMobile) => ({ backgroundColor: color, color: 'white', border: 'none', padding: isMobile ? '12px' : '10px 18px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: '600', flex: isMobile ? 1 : 'none' });
const backBtnStyle = { border: 'none', background: 'none', cursor: 'pointer', color: '#4a5568', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 0' };
const mainGrid = { display: 'grid', gap: '20px' };
const cardStyle = { backgroundColor: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', boxSizing: 'border-box' };
const cardHeader = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #f0f0f0', paddingBottom: '15px' };
const historyHeaderStyle = { display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f0f0f0', paddingBottom: '15px' };
const addReadingBtnStyle = { backgroundColor: '#3182ce', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: '600', fontSize: '14px' };
const detailsGrid = { display: 'grid', gap: '15px' };
const infoItemStyle = { display: 'flex', gap: '12px', alignItems: 'center', minWidth: 0 };
const infoLabel = { fontSize: '11px', color: '#718096', fontWeight: 'bold' };
const infoValue = { fontSize: '14px', color: '#2d3748', fontWeight: '600' };
const statsGrid = { display: 'grid', gap: '10px' };
const statBoxStyle = { borderRadius: '12px', textAlign: 'center' };
const tableStyle = { width: '100%', borderCollapse: 'collapse', textAlign: 'right' };
const thStyle = { color: '#a0aec0', fontSize: '12px', padding: '12px', borderBottom: '2px solid #f0f0f0' };
const trStyle = { borderBottom: '1px solid #f0f0f0' };
const centerStyle = { display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh' };
const statusBadge = (s) => ({ padding: '6px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold', backgroundColor: s === 'פעיל' ? '#c6f6d5' : '#fed7d7', color: s === 'פעיל' ? '#22543d' : '#822727' });

export default MeterDetails;