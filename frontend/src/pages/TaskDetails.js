import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/api';
import EditTaskModal from './modal/EditTaskModal';
import { 
  ArrowRight, Camera, Info, Edit, Trash, 
  Clock, ShieldCheck, RotateCcw, MessageSquare, X, Loader2, MapPin
} from 'lucide-react';

function TaskDetails() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [meterDetails, setMeterDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  const [images, setImages] = useState([]);
  const [notes, setNotes] = useState("");
  const [selectedImg, setSelectedImg] = useState(null);

  // Fetch task and then fetch linked meter details
  const fetchTask = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/get-task/${taskId}`); 
      const taskData = res.data;
      setTask(taskData);
      setImages(taskData.images || []);

      if (taskData.selected_meter_id) {
        try {
          const meterRes = await api.get(`/get-meter/${taskData.selected_meter_id}`);
          setMeterDetails(meterRes.data);
        } catch (err) {
          console.error("Meter fetch failed:", err);
        }
      }
    } catch (e) { 
      console.error("Error fetching task:", e); 
    } finally { 
      setLoading(false); 
    }
  }, [taskId]);

  useEffect(() => {
    fetchTask();
  }, [fetchTask]);

  // Image compression to prevent payload issues
  const compressImage = (base64Str) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        let width = img.width;
        let height = img.height;
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
    });
  };

  const handleReportDone = async () => {
    setIsSubmitting(true);
    try {
      await api.put(`/update-task-status/${taskId}`, {
        status: 'ממתין לאישור',
        comment_text: notes || "המשימה בוצעה", 
        sender: 'worker',
        images: images 
      });
      alert("הדיווח נשלח בהצלחה");
      fetchTask();
    } catch (e) { 
      alert("שגיאה בשמירת הנתונים"); 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  const handleFinalClose = async () => {
    setIsSubmitting(true);
    try {
      await api.put(`/complete-task/${taskId}`);
      fetchTask();
    } catch (e) { alert("שגיאה בסגירה"); }
    finally { setIsSubmitting(false); }
  };

  if (loading) return <div style={fullPageCenter}>טוען...</div>;
  if (!task) return <div style={fullPageCenter}>משימה לא נמצאה</div>;

  const isOpen = task.status === 'פתוח';
  const isPendingApproval = task.status === 'ממתין לאישור';
  const isClosed = task.status === 'הושלם';

  return (
    <div style={{ direction: 'rtl', padding: '15px', backgroundColor: '#F7FAFC', minHeight: '100vh' }}>
      
      {/* Lightbox for viewing images */}
      {selectedImg && (
        <div style={lightboxOverlay} onClick={() => setSelectedImg(null)}>
          <div style={lightboxContent}>
            <button style={closeLightboxBtn} onClick={() => setSelectedImg(null)}><X size={30} /></button>
            <img src={selectedImg} style={fullImageStyle} alt="Enlarged" />
          </div>
        </div>
      )}

      {/* Header Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
        <button onClick={() => navigate(-1)} style={backBtnStyle}><ArrowRight /></button>
        <div style={{ display: 'flex', gap: '8px' }}>
          {isOpen && <button onClick={() => setIsEditModalOpen(true)} style={editBtnStyle}><Edit size={18} /> עריכה</button>}
          <button style={deleteBtnStyle} onClick={() => window.confirm("למחוק?") && api.delete(`/delete-task/${taskId}`).then(() => navigate(-1))}><Trash size={18} /></button>
        </div>
      </div>

      {/* Status Banners */}
      {isPendingApproval && (
        <div style={pendingBannerStyle}><Clock size={20} /> <div><strong>ממתין לאישור משרד</strong></div></div>
      )}
      {isClosed && (
        <div style={closedBannerStyle}><ShieldCheck size={20} /> <div><strong>משימה הושלמה</strong></div></div>
      )}

      <h2 style={{ marginBottom: '5px', color: '#2D3748' }}>{task.title}</h2>
      <div style={priorityBadge(task.priority)}>{task.priority}</div>

      {/* Task Basic Info */}
      <div style={cardStyle}>
        <h3 style={sectionTitle}><Info size={16} /> פרטי המשימה</h3>
        <div style={infoGrid}>
          <div>
            <div style={infoLabel}>ישוב</div>
            <div style={{fontSize: '14px'}}>{task.location || 'לא צוין'}</div>
          </div>
          <div>
            <div style={infoLabel}>כתובת/מיקום</div>
            <div style={{fontSize: '14px'}}>{task.address || 'לא צוין'}</div>
          </div>
        </div>
        {task.description && (
          <div style={descBox}>{task.description}</div>
        )}
      </div>

      {/* Simplified Meter Info Card */}
      {task.selected_meter_id && (
        <div style={{...cardStyle, borderRight: '4px solid #3182CE'}}>
          <h3 style={{...sectionTitle, color: '#2B6CB0'}}><MapPin size={16} /> מיקום מונה מקושר (ID: {task.selected_meter_id})</h3>
          <div style={infoGrid}>
            <div>
              <div style={infoLabel}>שם צרכן</div>
              <div style={{fontSize: '14px', fontWeight: 'bold'}}>{meterDetails?.customer_name || 'טוען...'}</div>
            </div>
            <div>
              <div style={infoLabel}>כתובת המונה</div>
              <div style={{fontSize: '14px'}}>{meterDetails?.address_detail || meterDetails?.location || 'לא צוין'}</div>
            </div>
          </div>
        </div>
      )}

      {/* Comment History */}
      <div style={cardStyle}>
        <h3 style={sectionTitle}><MessageSquare size={16} /> היסטוריית הערות</h3>
        <div style={commentThreadStyle}>
          {task.comments?.length > 0 ? (
            task.comments.slice().reverse().map((c, i) => (
              <div key={i} style={commentBox(c.sender)}>
                <div style={commentHeader}>
                  <span style={commentSenderName}>{c.sender === 'office' ? 'משרד' : 'עובד'}</span>
                  <span style={commentTime}>{c.display_date}</span>
                </div>
                <div style={commentText}>{c.text}</div>
              </div>
            ))
          ) : (
            <div style={{textAlign: 'center', color: '#A0AEC0', fontSize: '12px'}}>אין הערות</div>
          )}
        </div>
      </div>

      {/* Media & Reporting */}
      <div style={cardStyle}>
        <h3 style={sectionTitle}><Camera size={16} /> תיעוד בשטח</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '15px' }}>
          {images.map((img, i) => (
            <div key={i} style={{position: 'relative'}}>
              <img src={img} style={thumbStyle} onClick={() => setSelectedImg(img)} alt="task" />
              {isOpen && <button onClick={() => setImages(images.filter((_, idx) => idx !== i))} style={removeImgBtn}>×</button>}
            </div>
          ))}
          {isOpen && (
            <label style={addPhotoBox}>
              <Camera />
              <input type="file" capture="environment" accept="image/*" hidden onChange={async (e) => {
                const file = e.target.files[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = async () => {
                    const compressed = await compressImage(reader.result);
                    setImages(prev => [...prev, compressed]);
                  };
                  reader.readAsDataURL(file);
                }
              }} />
            </label>
          )}
        </div>
        <textarea 
          disabled={!isOpen}
          style={txtArea} 
          placeholder="הערות לביצוע..."
          value={notes} 
          onChange={e => setNotes(e.target.value)} 
        />
      </div>

      {/* Footer Action Buttons */}
      <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {isOpen && (
          <button onClick={handleReportDone} disabled={isSubmitting} style={mainActionBtn}>
            {isSubmitting ? <Loader2 className="animate-spin" /> : "דווח כבוצע"}
          </button>
        )}
        {isPendingApproval && (
          <>
            <button onClick={handleFinalClose} disabled={isSubmitting} style={{...mainActionBtn, backgroundColor: '#38A169'}}>אשר וסגור סופית</button>
            <button onClick={() => {
              const r = window.prompt("סיבת החזרה:");
              if(r) api.put(`/update-task-status/${taskId}`, {status:'פתוח', comment_text:r, sender:'office'}).then(fetchTask);
            }} style={rejectBtnStyle}><RotateCcw size={18} /> החזר לביצוע</button>
          </>
        )}
      </div>

      <EditTaskModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} taskToEdit={task} onTaskUpdated={fetchTask} />
    </div>
  );
}

// --- Styles ---
const fullPageCenter = { textAlign: 'center', padding: '50px', direction: 'rtl' };
const cardStyle = { backgroundColor: 'white', padding: '15px', borderRadius: '12px', marginBottom: '15px', border: '1px solid #E2E8F0' };
const sectionTitle = { fontSize: '14px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' };
const infoGrid = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' };
const infoLabel = { fontSize: '11px', color: '#718096', fontWeight: 'bold', marginBottom: '2px' };
const descBox = { marginTop: '10px', padding: '10px', backgroundColor: '#F7FAFC', borderRadius: '8px', fontSize: '13px', border: '1px dashed #CBD5E0', whiteSpace: 'pre-wrap' };
const thumbStyle = { width: '70px', height: '70px', borderRadius: '10px', objectFit: 'cover', cursor: 'pointer' };
const removeImgBtn = { position: 'absolute', top: '-5px', right: '-5px', background: 'red', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer' };
const addPhotoBox = { width: '70px', height: '70px', border: '2px dashed #CBD5E0', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A0AEC0', cursor: 'pointer' };
const txtArea = { width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0', minHeight: '80px', fontSize: '14px' };
const backBtnStyle = { border: '1px solid #E2E8F0', background: 'white', padding: '10px', borderRadius: '10px', cursor: 'pointer' };
const editBtnStyle = { background: '#EBF8FF', color: '#3182CE', border: '1px solid #BEE3F8', padding: '8px 15px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' };
const deleteBtnStyle = { background: '#FFF5F5', color: '#C53030', border: '1px solid #FED7D7', padding: '10px', borderRadius: '10px', cursor: 'pointer' };
const mainActionBtn = { width: '100%', padding: '16px', backgroundColor: '#3182CE', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center' };
const rejectBtnStyle = { width: '100%', padding: '16px', backgroundColor: 'white', color: '#C53030', border: '1px solid #C53030', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', gap: '8px' };
const commentThreadStyle = { display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' };
const commentBox = (s) => ({ padding: '10px', borderRadius: '8px', backgroundColor: s === 'office' ? '#FFF5F5' : '#EBF8FF', borderRight: s === 'office' ? '4px solid #C53030' : '4px solid #3182CE' });
const commentHeader = { display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '4px' };
const commentSenderName = { fontWeight: 'bold' };
const commentTime = { color: '#A0AEC0' };
const commentText = { fontSize: '13px' };
const lightboxOverlay = { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000 };
const lightboxContent = { position: 'relative' };
const fullImageStyle = { maxWidth: '90vw', maxHeight: '80vh', borderRadius: '8px' };
const closeLightboxBtn = { position: 'absolute', top: '-40px', left: '50%', transform: 'translateX(-50%)', color: 'white', background: 'none', border: 'none', cursor: 'pointer' };
const pendingBannerStyle = { backgroundColor: '#EBF8FF', color: '#2B6CB0', padding: '12px', borderRadius: '10px', marginBottom: '15px', display: 'flex', gap: '10px', fontSize: '14px' };
const closedBannerStyle = { backgroundColor: '#C6F6D5', color: '#22543D', padding: '12px', borderRadius: '10px', marginBottom: '15px', display: 'flex', gap: '10px', fontSize: '14px' };
const priorityBadge = (p) => ({ fontSize: '11px', backgroundColor: p === 'גבוהה' ? '#FEEBC8' : '#EDF2F7', color: p === 'גבוהה' ? '#9C4221' : '#4A5568', padding: '4px 12px', borderRadius: '15px', display: 'inline-block', marginBottom: '10px', fontWeight: 'bold' });

export default TaskDetails;