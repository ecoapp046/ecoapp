from fastapi import APIRouter, HTTPException
from typing import Dict, List, Optional
from database import db
from datetime import datetime

router = APIRouter()

@router.get("/get-meters")
async def get_meters():
    try:
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
                "address": data.get("address", "—"),
                "type": data.get("type", "משני"), # הוספת סוג המונה לרשימה
                "walking_order": data.get("walking_order", 1) # הוספת סדר הליכה
            })
        return meters_list
    except Exception as e:
        raise HTTPException(status_code=500, detail="שגיאה בשליפת המונים")

@router.get("/get-meter/{meter_id}")
async def get_meter(meter_id: str):
    doc_ref = db.collection("meters").document(meter_id.strip()).get()
    if not doc_ref.exists:
        raise HTTPException(status_code=404, detail="המונה לא נמצא")
    
    data = doc_ref.to_dict()
    data["id"] = doc_ref.id
    
    s_id = str(data.get("settlement_id", "")).strip()
    if s_id:
        settlement_doc = db.collection("settlements").document(s_id).get()
        if settlement_doc.exists:
            data["settlement_name"] = settlement_doc.to_dict().get("settlement_name", "ללא יישוב")
        else:
            data["settlement_name"] = "יישוב לא נמצא במערכת"
    else:
        data["settlement_name"] = "לא הוגדר יישוב"

    try:
        curr = float(data.get("current_reading", 0))
        last = float(data.get("last_reading", 0))
        data["consumption"] = round(max(0, curr - last), 2)
    except:
        data["consumption"] = 0

    return data

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
    
    # עיבוד נתונים חדשים מהפרונטנד
    try:
        # המרת מספרים לפורמט תקין
        current_reading = str(meter_data.get("current_reading", "0"))
        walking_order = int(meter_data.get("walking_order", 1))
        residents_count = int(meter_data.get("residents_count", 1))
        
        # בניית אובייקט הנתונים לשמירה ב-Firestore
        final_data = {
            "meter_id": m_id,
            "customer_name": meter_data.get("customer_name", "ללא שם"),
            "settlement_id": str(meter_data.get("settlement_id", "")).strip(),
            "address": meter_data.get("address", ""),
            "address_detail": meter_data.get("address_detail", ""),
            "phone": meter_data.get("phone", ""),
            "email": meter_data.get("email", ""),
            "residents_count": residents_count,
            "current_reading": current_reading,
            "last_reading": "0",
            "status": meter_data.get("status", "פעיל"),
            "type": meter_data.get("type", "משני"), # שדה סוג מונה
            "walking_order": walking_order, # שדה סדר הליכה
            "created_at": now_str,
            "last_update": now_str
        }

        batch = db.batch()
        batch.set(doc_ref, final_data)
        
        # יצירת רשומת היסטוריה
        history_ref = db.collection("readings").document()
        batch.set(history_ref, {
            "meter_id": m_id,
            "date_display": now_str,
            "timestamp": now,
            "value": current_reading,
            "previous_value": "0",
            "log_type": "CREATION",
            "technician": "מערכת",
            "note": f"פתיחת מונה {final_data['type']} חדש (סדר הליכה: {walking_order})"
        })
        
        batch.commit()
        return {"status": "success", "created_at": now_str}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"שגיאה ביצירה: {str(e)}")

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

@router.put("/update-meter/{meter_id}")
async def update_meter(meter_id: str, data: dict):
    # הוספת עדכון תאריך עדכון אחרון
    data["last_update"] = datetime.now().strftime("%d/%m/%Y %H:%M")
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