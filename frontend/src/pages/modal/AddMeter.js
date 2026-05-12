import React, { useState } from 'react';
import api from '../../api/api';
import { X, Check, AlertCircle, ArrowLeft } from 'lucide-react';
import { useIsMobile } from '../../hooks/useIsMobile';

const AddMeter = ({ isOpen, onClose, settlements, onMeterAdded }) => {
  const isMobile = useIsMobile();
  const [step, setStep] = useState(1);
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
    type: 'משני',
    walking_order: 1 
  });

  const nextStep = () => {
    if (step === 1) {
      if (!formData.settlement_id) return setError("חובה לבחור יישוב לפני שממשיכים");
      setError('');
      setStep(2);
    }
  };

  const prevStep = () => {
    setError('');
    setStep(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    const cleanId = formData.meter_id.trim();
    const walkingOrderNum = parseInt(formData.walking_order);
    const residentsCountNum = parseInt(formData.residents_count);


    if (!cleanId) return setError("חובה להזין מספר מונה");
    if (walkingOrderNum < 1) return setError("סדר הליכה  (מינימום 1)");
    
    if (formData.type === 'משני' && residentsCountNum < 1) {
      return setError("מספר נפשות חייב להיות לפחות 1");
    }

    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        meter_id: cleanId,
        current_reading: formData.current_reading.toString(),
        walking_order: walkingOrderNum,
        residents_count: formData.type === 'ראשי' ? 0 : residentsCountNum,
        phone: formData.type === 'ראשי' ? '' : formData.phone,
        email: formData.type === 'ראשי' ? '' : formData.email,
      };

      await api.post('/add-meter', payload);
      onMeterAdded();
      resetForm();
      onClose();      
    } catch (err) {
      setError(err.response?.data?.detail || "שגיאה בשמירת הנתונים");
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      meter_id: '', customer_name: '', settlement_id: '',
      address: '', address_detail: '', phone: '',
      email: '', residents_count: 1, current_reading: 0,
      status: 'פעיל', type: 'משני', walking_order: 1
    });
    setStep(1);
    setError('');
  };

  if (!isOpen) return null;

  return (
    <div style={modalOverlayStyle}>
      <div style={{
        ...modalContentStyle,
        width: isMobile ? '95%' : '600px',
        padding: isMobile ? '20px' : '35px'
      }}>
        <div style={modalHeaderStyle}>
          <button onClick={onClose} style={closeIconBtnStyle}><X size={20} /></button>
          <h2 style={{ margin: 0, fontSize: isMobile ? '18px' : '22px' }}>
            {step === 1 ? 'שלב 1: סוג מונה ומיקום' : `שלב 2: פרטי מונה ${formData.type}`}
          </h2>
        </div>

        {error && (
          <div style={errorBannerStyle}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {step === 1 && (
            <div style={formGridStyle}>
              <div style={inputGroupStyle}>
                <label style={labelStyle}>בחר סוג מונה להקמה *</label>
                <div style={typeSelectorContainer}>
                  <div 
                    onClick={() => setFormData({...formData, type: 'משני'})}
                    style={formData.type === 'משני' ? activeTypeCard : typeCard}
                  >
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>🏠</div>
                    <div>מונה משני</div>
                    <div style={{ fontSize: '11px', fontWeight: 'normal', opacity: 0.8 }}>לצרכן קצה / דירה</div>
                  </div>
                  <div 
                    onClick={() => setFormData({...formData, type: 'ראשי'})}
                    style={formData.type === 'ראשי' ? activeTypeCard : typeCard}
                  >
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>🏢</div>
                    <div>מונה ראשי</div>
                    <div style={{ fontSize: '11px', fontWeight: 'normal', opacity: 0.8 }}>לכניסה / בניין / מרכז</div>
                  </div>
                </div>
              </div>

              <div style={inputGroupStyle}>
                <label style={labelStyle}>שיוך ליישוב *</label>
                <select 
                  required
                  style={modalInputStyle}
                  value={formData.settlement_id}
                  onChange={(e) => setFormData({...formData, settlement_id: e.target.value})}
                >
                  <option value="">בחר יישוב מהרשימה...</option>
                  {settlements?.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div style={footerStyle}>
                <button type="button" onClick={nextStep} style={saveBtnStyle}>
                  המשך לשלב הבא <ArrowLeft size={18} />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <>
              <div style={{ ...formGridStyle, gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }}>
                
                <div style={inputGroupStyle}>
                  <label style={labelStyle}>מספר מונה (ID) *</label>
                  <input required style={modalInputStyle} value={formData.meter_id} onChange={(e) => setFormData({...formData, meter_id: e.target.value})} placeholder="מספר סידורי" />
                </div>

                <div style={inputGroupStyle}>
                  <label style={labelStyle}>{formData.type === 'ראשי' ? 'תיאור המונה (למשל: כניסה א\')' : 'שם תושב / לקוח *'}</label>
                  <input required style={modalInputStyle} value={formData.customer_name} onChange={(e) => setFormData({...formData, customer_name: e.target.value})} placeholder="שם מזהה" />
                </div>

                <div style={inputGroupStyle}>
                  <label style={labelStyle}>סדר הליכה (מספר חיובי בלבד)</label>
                  <input 
                    type="number" 
                    min="1"
                    style={modalInputStyle} 
                    value={formData.walking_order} 
                    onChange={(e) => setFormData({...formData, walking_order: e.target.value})} 
                  />
                </div>

                <div style={inputGroupStyle}>
                  <label style={labelStyle}>קריאה נוכחית (m³)</label>
                  <input type="number" step="any" style={modalInputStyle} value={formData.current_reading} onChange={(e) => setFormData({...formData, current_reading: e.target.value})} />
                </div>

                <div style={{ ...inputGroupStyle, gridColumn: isMobile ? 'auto' : 'span 2' }}>
                  <label style={labelStyle}>כתובת ומיקום מפורט</label>
                  <input style={modalInputStyle} value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} placeholder="רחוב, מספר, קומה..." />
                </div>

                <div style={inputGroupStyle}>
                  <label style={labelStyle}>סטטוס ראשוני</label>
                  <select style={modalInputStyle} value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                    <option value="פעיל">✅ פעיל</option>
                    <option value="מושבת">❌ מושבת</option>
                    <option value="תקול">⚠️ תקול</option>
                  </select>
                </div>

                {formData.type === 'משני' && (
                  <>
                    <div style={inputGroupStyle}>
                      <label style={labelStyle}>טלפון ליצירת קשר</label>
                      <input type="tel" style={modalInputStyle} value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="050-0000000" />
                    </div>
                    <div style={inputGroupStyle}>
                      <label style={labelStyle}>מספר נפשות (מינימום 1)</label>
                      <input type="number" min="1" style={modalInputStyle} value={formData.residents_count} onChange={(e) => setFormData({...formData, residents_count: e.target.value})} />
                    </div>
                  </>
                )}
              </div>

              <div style={{ ...footerStyle, flexDirection: isMobile ? 'column-reverse' : 'row' }}>
                <button type="button" onClick={prevStep} style={cancelBtnStyle}>חזור</button>
                <button type="submit" disabled={isSaving} style={saveBtnStyle}>
                  {isSaving ? "שומר..." : <><Check size={18} /> סיום והוספת מונה</>}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

// --- Styles ---
const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' };
const modalContentStyle = { backgroundColor: 'white', borderRadius: '24px', maxHeight: '95vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', direction: 'rtl', boxSizing: 'border-box' };
const modalHeaderStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderBottom: '1px solid #f0f0f0', paddingBottom: '15px' };
const closeIconBtnStyle = { border: 'none', background: 'none', cursor: 'pointer', color: '#a0aec0', padding: '5px' };
const errorBannerStyle = { backgroundColor: '#fff5f5', color: '#c53030', padding: '12px', borderRadius: '12px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', border: '1px solid #feb2b2' };
const formGridStyle = { display: 'grid', gap: '15px' };
const inputGroupStyle = { display: 'flex', flexDirection: 'column', gap: '6px' };
const labelStyle = { fontSize: '12px', fontWeight: '700', color: '#4a5568', paddingRight: '2px' };
const modalInputStyle = { padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '14px', backgroundColor: '#f8fafc' };
const footerStyle = { marginTop: '30px', display: 'flex', gap: '12px' };
const saveBtnStyle = { flex: 2, backgroundColor: '#3182ce', color: 'white', border: 'none', padding: '14px', borderRadius: '14px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' };
const cancelBtnStyle = { flex: 1, backgroundColor: '#f7fafc', color: '#718096', border: '1px solid #e2e8f0', padding: '14px', borderRadius: '14px', fontWeight: 'bold', cursor: 'pointer' };
const typeSelectorContainer = { display: 'flex', gap: '12px', marginBottom: '10px' };
const typeCard = { flex: 1, padding: '20px', borderRadius: '16px', border: '2px solid #e2e8f0', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s', fontSize: '15px', fontWeight: 'bold', color: '#4a5568', backgroundColor: '#fff' };
const activeTypeCard = { ...typeCard, borderColor: '#3182ce', backgroundColor: '#ebf8ff', color: '#2b6cb0', boxShadow: '0 4px 12px rgba(49, 130, 206, 0.15)' };

export default AddMeter;