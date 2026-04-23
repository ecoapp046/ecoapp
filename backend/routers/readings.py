from fastapi import APIRouter, HTTPException
from datetime import datetime
from database import db
from models import MeterReading, Reading

router = APIRouter()

async def process_reading(m_id: str, new_value: float, technician: str):
    meter_ref = db.collection("meters").document(m_id)
    meter_doc = meter_ref.get()
    if not meter_doc.exists:
        raise HTTPException(status_code=404, detail="המונה לא נמצא")

    data = meter_doc.to_dict()
    old_value = data.get("current_reading", "0")
    now_str = datetime.now().strftime("%d/%m/%Y %H:%M")

    # עדכון המונה
    meter_ref.update({
        "last_reading": str(old_value),
        "current_reading": str(new_value),
        "current_reading_date": now_str
    })

    # רישום היסטוריה
    db.collection("readings").document().set({
        "meter_id": m_id,
        "value": str(new_value),
        "previous_value": str(old_value),
        "timestamp": datetime.now(),
        "date_display": now_str,
        "technician": technician,
        "log_type": "READING"
    })

@router.post("/submit-reading")
async def submit_reading(reading: MeterReading):
    await process_reading(reading.meter_id.strip(), reading.current_value, reading.technician_id)
    return {"status": "success"}

@router.post("/add-reading")
async def add_reading(reading: Reading):
    await process_reading(reading.meter_id.strip(), reading.value, reading.technician)
    return {"status": "success"}

@router.get("/get-meter-history/{m_id}")
async def get_meter_history(m_id: str):
    try:
        docs = db.collection("readings").where("meter_id", "==", m_id.strip()).stream()
        history = []
        for doc in docs:
            d = doc.to_dict()
            l_type = d.get("log_type", "READING")
            
            item = {
                "date": d.get("date_display", "—"),
                "value": d.get("value", "0"),
                "timestamp": d.get("timestamp"),
                "technician": d.get("technician", "מערכת"),
                "log_type": l_type,
                "note": d.get("note", "")
            }

            # הוספת המידע המיוחד של ההחלפה אם קיים
            if l_type == "REPLACEMENT":
                item["old_meter_id"] = d.get("old_meter_id", "—")
                item["final_reading_old"] = d.get("final_reading_old", "0")
                item["consumption"] = 0
            else:
                try:
                    diff = round(float(d.get("value", 0)) - float(d.get("previous_value", 0)), 2)
                    item["consumption"] = max(0, diff)
                except:
                    item["consumption"] = 0

            history.append(item)
            
        history.sort(key=lambda x: x['timestamp'] if x['timestamp'] else 0, reverse=True)
        return history
    except Exception as e:
        return []