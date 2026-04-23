from fastapi import APIRouter, HTTPException
from typing import Dict, List, Optional
from database import db
from datetime import datetime

router = APIRouter()

# --- 1. קבלת כל המונים (עבור המשרד) ---
@router.get("/get-meters")
async def get_meters():
    try:
        # שליפת שמות היישובים מראש לייעול
        settlement_docs = db.collection("settlements").stream()
        settlements_map = {str(doc.id).strip(): doc.to_dict().get("settlement_name") for doc in settlement_docs}

        meter_docs = db.collection("meters").stream()
        meters_list = []

        for doc in meter_docs:
            data = doc.to_dict()
            s_id = str(data.get("settlement_id", "")).strip()
            
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
                "consumption": max(0, consumption),
                "status": data.get("status", "פעיל"),
                "address": data.get("address", "—")
            })
        return meters_list
    except Exception as e:
        raise HTTPException(status_code=500, detail="שגיאה בשליפת המונים")

# --- 2. שליפת מונה בודד (מתוקן עם שם יישוב) ---
@router.get("/get-meter/{meter_id}")
async def get_meter(meter_id: str):
    doc_ref = db.collection("meters").document(meter_id.strip()).get()
    if not doc_ref.exists:
        raise HTTPException(status_code=404, detail="המונה לא נמצא")
    
    data = doc_ref.to_dict()
    data["id"] = doc_ref.id
    
    # הצלבת שם היישוב - התיקון כאן:
    s_id = str(data.get("settlement_id", "")).strip()
    if s_id:
        settlement_doc = db.collection("settlements").document(s_id).get()
        if settlement_doc.exists:
            data["settlement_name"] = settlement_doc.to_dict().get("settlement_name", "ללא יישוב")
        else:
            data["settlement_name"] = "יישוב לא נמצא במערכת"
    else:
        data["settlement_name"] = "לא הוגדר יישוב"

    # חישוב צריכה מהיר לתצוגה
    try:
        curr = float(data.get("current_reading", 0))
        last = float(data.get("last_reading", 0))
        data["consumption"] = round(max(0, curr - last), 2)
    except:
        data["consumption"] = 0

    return data

# --- 3. הוספת מונה חדש ---
@router.post("/add-meter")
async def add_meter(meter_data: Dict):
    m_id = str(meter_data.get("meter_id", "")).strip()
    if not m_id:
        raise HTTPException(status_code=400, detail="חובה מספר מונה")
    
    doc_ref = db.collection("meters").document(m_id)
    if doc_ref.get().exists:
        raise HTTPException(status_code=400, detail="המונה כבר קיים")

    now = datetime.now()
    now_str = now.strftime("%d/%m/%Y %H:%M")
    
    # הגדרת ערכי ברירת מחדל
    meter_data.setdefault("current_reading", "0")
    meter_data.setdefault("last_reading", "0")
    meter_data["created_at"] = now_str  # הוספת תאריך יצירה למונה עצמו

    try:
        batch = db.batch()
        
        # 1. יצירת המונה
        batch.set(doc_ref, meter_data)
        
        # 2. יצירת רשומת היסטוריה ראשונה - "פתיחת מונה"
        history_ref = db.collection("readings").document()
        batch.set(history_ref, {
            "meter_id": m_id,
            "date_display": now_str,
            "timestamp": now,
            "value": meter_data.get("current_reading", "0"),
            "previous_value": "0",
            "log_type": "CREATION",
            "technician": "מערכת",
            "note": "פתיחת מונה חדש במערכת"
        })
        
        batch.commit()
        return {"status": "success", "created_at": now_str}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"שגיאה ביצירה: {str(e)}")

# --- 4. החלפת מונה (Full Replace) ---
@router.put("/update-meter-full/{old_id}")
async def update_meter_full(old_id: str, data: dict):
    try:
        new_id = str(data.get("new_id", "")).strip()
        old_ref = db.collection("meters").document(old_id)
        old_doc = old_ref.get()
        if not old_doc.exists: 
            raise HTTPException(status_code=404, detail="מונה מקור לא נמצא")

        new_ref = db.collection("meters").document(new_id)
        meter_data = old_doc.to_dict()
        
        old_final_reading = meter_data.get("current_reading", "0")
        now_str = datetime.now().strftime("%d/%m/%Y %H:%M")

        batch = db.batch()
        
        meter_data.update({
            "meter_id": new_id,
            "current_reading": str(data.get("current_reading", "0")),
            "last_reading": "0",
            "last_update": now_str,
            "replaced_from": old_id
        })
        
        batch.set(new_ref, meter_data)
        batch.delete(old_ref)

        old_readings = db.collection("readings").where("meter_id", "==", old_id).stream()
        for r in old_readings:
            batch.update(db.collection("readings").document(r.id), {"meter_id": new_id})

        history_ref = db.collection("readings").document()
        batch.set(history_ref, {
            "meter_id": new_id,
            "date_display": now_str,
            "timestamp": datetime.now(),
            "value": str(data.get("current_reading", "0")),
            "previous_value": "0", 
            "log_type": "REPLACEMENT",
            "technician": data.get("technician_name", "מערכת"),
            "old_meter_id": old_id,
            "final_reading_old": old_final_reading,
            "note": f"החלפה ממונה {old_id} (קריאה סופית: {old_final_reading})"
        })
        
        batch.commit()
        return {"status": "success", "new_id": new_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- 5. עדכון/מחיקה/יישובים ---
@router.put("/update-meter/{meter_id}")
async def update_meter(meter_id: str, data: dict):
    db.collection("meters").document(meter_id.strip()).update(data)
    return {"status": "success"}

@router.delete("/delete-meter/{m_id}")
async def delete_meter(m_id: str):
    try:
        meter_id_clean = m_id.strip()
        readings_ref = db.collection("readings").where("meter_id", "==", meter_id_clean).stream()
        
        batch = db.batch()
        count = 0
        
        for doc in readings_ref:
            batch.delete(doc.reference)
            count += 1
            if count >= 400:
                batch.commit()
                batch = db.batch()
                count = 0
        
        batch.delete(db.collection("meters").document(meter_id_clean))
        batch.commit()
        
        return {"status": "success", "message": f"Meter and history records deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/get-settlements")
async def get_settlements():
    docs = db.collection("settlements").stream()
    return [{"id": d.id, "name": d.to_dict().get("settlement_name", "ללא שם")} for d in docs]