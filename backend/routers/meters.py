from fastapi import APIRouter, HTTPException
from typing import Dict, List, Optional
from database import db
from datetime import datetime

router = APIRouter()

# --- 1. קבלת כל המונים (עבור המשרד) ---
@router.get("/get-meters")
async def get_meters():
    try:
        # שליפת שמות היישובים למפה מהירה
        settlement_docs = db.collection("settlements").stream()
        settlements_map = {str(doc.id).strip(): doc.to_dict().get("settlement_name") for doc in settlement_docs}

        meter_docs = db.collection("meters").stream()
        meters_list = []

        for doc in meter_docs:
            data = doc.to_dict()
            s_id = str(data.get("settlement_id", "")).strip()
            
            # חישוב צריכה בטוח
            try:
                curr = float(data.get("current_reading", 0))
                last = float(data.get("last_reading", 0))
                consumption = round(curr - last, 2)
            except:
                consumption = 0

            meters_list.append({
                "id": doc.id,
                "customer_name": data.get("customer_name") or data.get("costumer_name") or "ללא שם",
                "settlement_name": settlements_map.get(s_id, "ללא יישוב"),
                "current_reading": data.get("current_reading", "0"),
                "current_reading_date": data.get("current_reading_date", "—"),
                "consumption": consumption,
                "status": data.get("status", "פעיל"),
                "address": data.get("address", "—")
            })
        return meters_list
    except Exception as e:
        print(f"Error fetching meters: {e}")
        raise HTTPException(status_code=500, detail="שגיאה בשליפת המונים")

# --- 2. שליפת מונה בודד ---
@router.get("/get-meter/{meter_id}")
async def get_meter(meter_id: str):
    try:
        doc = db.collection("meters").document(meter_id.strip()).get()
        if doc.exists:
            data = doc.to_dict()
            data["id"] = doc.id
            return data
        raise HTTPException(status_code=404, detail="המונה לא נמצא")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- 3. הוספת מונה חדש ---
@router.post("/add-meter")
async def add_meter(meter_data: Dict):
    try:
        m_id = str(meter_data.get("meter_id", "")).strip()
        if not m_id:
            raise HTTPException(status_code=400, detail="חובה להזין מספר מונה")

        doc_ref = db.collection("meters").document(m_id)
        if doc_ref.get().exists:
            raise HTTPException(status_code=400, detail=f"שגיאה: מונה מספר {m_id} כבר קיים במערכת!")

        doc_ref.set(meter_data)
        return {"status": "success", "message": "Meter added successfully"}
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Error adding meter: {e}")
        raise HTTPException(status_code=500, detail="שגיאה פנימית בשרת")

# --- 4. החלפת מונה (Full Replace) כולל היסטוריה ---
@router.put("/update-meter-full/{old_id}")
async def update_meter_full(old_id: str, data: dict):
    try:
        new_id = str(data.get("new_id", "")).strip()
        if not new_id:
            raise HTTPException(status_code=400, detail="חובה להזין מספר מונה חדש")        
        if new_id == old_id:
            raise HTTPException(status_code=400, detail="המספר החדש זהה למספר הקיים")
      
        old_ref = db.collection("meters").document(old_id)
        old_doc = old_ref.get()
        if not old_doc.exists:
            raise HTTPException(status_code=404, detail=f"מונה {old_id} לא נמצא במערכת")

        new_ref = db.collection("meters").document(new_id)
        if new_ref.get().exists:
            raise HTTPException(status_code=400, detail=f"שגיאה: מונה מספר {new_id} כבר קיים!")
       
        # הכנת נתוני המונה החדש
        meter_data = old_doc.to_dict()
        old_current_reading = meter_data.get("current_reading", "0")
        now_str = datetime.now().strftime("%d/%m/%Y %H:%M")

        meter_data.update({
            "meter_id": new_id,
            "current_reading": str(data.get("current_reading", "0")),
            "last_reading": "0", # מונה חדש פיזית
            "status": data.get("status", "פעיל"),
            "last_update": now_str,
            "update_note": f"החלפה ממונה {old_id}. קריאה אחרונה בישן: {old_current_reading}"
        })

        batch = db.batch()

        # א. העברת המונה
        batch.set(new_ref, meter_data)
        batch.delete(old_ref)

        # ב. העברת כל היסטוריית הקריאות ל-ID החדש
        old_readings = db.collection("readings").where("meter_id", "==", old_id).stream()
        for reading_doc in old_readings:
            reading_ref = db.collection("readings").document(reading_doc.id)
            batch.update(reading_ref, {"meter_id": new_id})

        # ג. יצירת שורת אירוע מיוחדת בהיסטוריה (עבור ה-React)
        history_ref = db.collection("readings").document()
        batch.set(history_ref, {
            "meter_id": new_id,
            "date_display": now_str,
            "timestamp": datetime.now(),
            "value": str(data.get("current_reading", "0")),
            "previous_value": str(old_current_reading),
            "technician": data.get("technician_name", "מערכת"),
            "log_type": "REPLACEMENT",  # המפתח שצובע בכתום ב-React
            "note": f"החלפת מונה פיזי. מונה ישן ({old_id}) הוסר עם קריאה סופית: {old_current_reading}"
        })

        batch.commit()
        return {"status": "id_changed", "new_id": new_id}

    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"❌ Error in replacement: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- 5. שליפת היסטוריית קריאות למונה ---
@router.get("/get-meter-history/{m_id}")
async def get_meter_history(m_id: str):
    try:
        docs = db.collection("readings").where("meter_id", "==", m_id.strip()).stream()
        history = []
        for doc in docs:
            d = doc.to_dict()
            
            # חישוב צריכה נקודתית לצורך התצוגה
            try:
                val = float(d.get("value", 0))
                prev = float(d.get("previous_value", 0))
                diff = round(val - prev, 2)
                if diff < 0: diff = 0 # מניעת ערכים שליליים בהחלפה
            except: diff = 0

            history.append({
                "date": d.get("date_display", "—"),
                "value": d.get("value", "0"),
                "consumption": diff,
                "timestamp": d.get("timestamp"),
                "technician": d.get("technician", "—"),
                "log_type": d.get("log_type", "READING"), # ברירת מחדל קריאה רגילה
                "note": d.get("note", "")
            })
        
        # מיון מהחדש לישן
        history.sort(key=lambda x: x['timestamp'] if x['timestamp'] else 0, reverse=True)
        return history
    except Exception as e:
        print(f"Error fetching history: {e}")
        return []

# --- 6. עדכון פרטי מונה (עריכה רגילה) ---
@router.put("/update-meter/{meter_id}")
async def update_meter(meter_id: str, data: dict):
    try:
        doc_ref = db.collection("meters").document(meter_id.strip())
        if not doc_ref.get().exists:
            raise HTTPException(status_code=404, detail="המונה לא נמצא")
        doc_ref.update(data)
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail="שגיאה בעדכון הנתונים")

# --- 7. מחיקת מונה ---
@router.delete("/delete-meter/{m_id}")
async def delete_meter(m_id: str):
    try:
        db.collection("meters").document(m_id.strip()).delete()
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail="שגיאה במחיקה")

# --- 8. שליפת רשימת יישובים ---
@router.get("/get-settlements")
async def get_settlements():
    try:
        docs = db.collection("settlements").stream()
        return [{"id": d.id, "name": d.to_dict().get("settlement_name", "ללא שם")} for d in docs]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))