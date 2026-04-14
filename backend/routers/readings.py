from fastapi import APIRouter, HTTPException
from datetime import datetime
from database import db
from models import MeterReading, Reading

router = APIRouter()

# --- שליחת קריאה מהאפליקציה ---
@router.post("/submit-reading")
async def submit_reading(reading: MeterReading):
    try:
        m_id = str(reading.meter_id).strip()
        meter_ref = db.collection("meters").document(m_id)
        meter_doc = meter_ref.get()

        if not meter_doc.exists:
            raise HTTPException(status_code=404, detail=f"מונה {m_id} לא נמצא")

        current_data = meter_doc.to_dict()
        old_value = current_data.get("current_reading", "0")
        old_date = current_data.get("current_reading_date", "—")
        now_str = datetime.now().strftime("%d/%m/%Y %H:%M")

        meter_ref.update({
            "last_reading": str(old_value),
            "last_reading_date": old_date,
            "current_reading": str(reading.current_value),
            "current_reading_date": now_str
        })

        db.collection("readings").document().set({
            "meter_id": m_id,
            "value": str(reading.current_value),
            "previous_value": str(old_value),
            "timestamp": datetime.now(),
            "date_display": now_str,
            "technician": reading.technician_id,
            "log_type": "READING" # סוג רגיל
        })
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- הוספת קריאה ידנית מהמחשב ---
@router.post("/add-reading")
async def add_reading(reading: Reading):
    try:
        m_id = str(reading.meter_id).strip()
        meter_ref = db.collection("meters").document(m_id)
        meter_doc = meter_ref.get()
        
        if not meter_doc.exists:
            raise HTTPException(status_code=404, detail="המונה לא נמצא")

        current_data = meter_doc.to_dict()
        old_value = current_data.get("current_reading", "0")
        old_date = current_data.get("current_reading_date", "—")
        now_str = datetime.now().strftime("%d/%m/%Y %H:%M")

        meter_ref.update({
            "last_reading": str(old_value),
            "last_reading_date": old_date,
            "current_reading": str(reading.value),
            "current_reading_date": now_str
        })

        db.collection("readings").document().set({
            "meter_id": m_id,
            "value": str(reading.value),
            "previous_value": str(old_value),
            "timestamp": datetime.now(),
            "date_display": now_str,
            "technician": reading.technician,
            "log_type": "READING" # סוג רגיל
        })
        return {"status": "success"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

# --- שליפת היסטוריה - כאן השינוי העיקרי! ---
@router.get("/get-meter-history/{m_id}")
async def get_meter_history(m_id: str):
    try:
        docs = db.collection("readings").where("meter_id", "==", m_id.strip()).stream()
        history = []
        for doc in docs:
            d = doc.to_dict()
            l_type = d.get("log_type", "READING") # שליפת סוג הלוג
            
            try:
                val = float(d.get("value", 0))
                prev = float(d.get("previous_value", 0))
                
                # אם זו החלפה, אנחנו לא רוצים חישוב צריכה שיקפוץ למינוס או פלוס ענק
                if l_type == "REPLACEMENT":
                    diff = 0 
                else:
                    diff = round(val - prev, 2)
            except: 
                diff = 0

            history.append({
                "date": d.get("date_display", "—"),
                "value": d.get("value", "0"),
                "consumption": diff,
                "timestamp": d.get("timestamp"),
                "technician": d.get("technician", "מערכת"),
                "log_type": l_type, # חשוב מאוד עבור ה-React!
                "note": d.get("note", "") # הוספת הערה אם קיימת
            })
            
        history.sort(key=lambda x: x['timestamp'] if x['timestamp'] else 0, reverse=True)
        return history
    except Exception as e:
        print(f"Error: {e}")
        return []