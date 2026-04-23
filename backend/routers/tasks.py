from fastapi import APIRouter, HTTPException
from typing import List, Dict
from database import db
from datetime import datetime

router = APIRouter()

@router.get("/get-tasks")
async def get_tasks():
    docs = db.collection("tasks").stream()
    tasks = [{**d.to_dict(), "id": d.id} for d in docs]
    tasks.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return tasks

@router.post("/add-task")
async def add_task(task_data: dict):
    task_data["created_at"] = datetime.now().isoformat()
    task_data["status"] = "פתוח"
    # שדות ברירת מחדל למונה המקושר
    task_data.setdefault("selected_meter_id", "")
    task_data.setdefault("meter_reading_done", False)
    task_data.setdefault("last_reading_value", "")
    
    new_doc_ref = db.collection("tasks").document()
    new_doc_ref.set(task_data)
    return {"status": "success", "id": new_doc_ref.id}

@router.put("/update-single-meter-reading/{task_id}")
async def update_single_meter_reading(task_id: str, data: dict):
    try:
        meter_id = data.get("meter_id")
        new_val = str(data.get("reading", "0"))
        now_str = datetime.now().strftime("%d/%m/%Y %H:%M")

        task_ref = db.collection("tasks").document(task_id)
        meter_ref = db.collection("meters").document(meter_id)
        
        meter_snap = meter_ref.get()
        prev_val = meter_snap.to_dict().get("current_reading", "0") if meter_snap.exists else "0"

        batch = db.batch()
        
        # 1. עדכון המשימה - המשימה נשארת פתוחה (כפי שביקשת)
        batch.update(task_ref, {
            "last_reading_value": new_val,
            "meter_reading_done": True,
            "updated_at": datetime.now().isoformat()
        })

        # 2. עדכון המונה הראשי במערכת
        batch.update(meter_ref, {
            "current_reading": new_val, 
            "last_reading": prev_val, 
            "current_reading_date": now_str
        })

        # 3. רישום להיסטוריית קריאות
        hist_ref = db.collection("readings").document()
        batch.set(hist_ref, {
            "meter_id": meter_id,
            "value": new_val,
            "previous_value": prev_val,
            "date_display": now_str,
            "timestamp": datetime.now(),
            "log_type": "READING",
            "note": f"עדכון מהשטח - משימה: {task_id}"
        })

        batch.commit()
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/complete-task/{task_id}")
async def complete_task(task_id: str, data: dict):
    try:
        task_ref = db.collection("tasks").document(task_id)
        task_ref.update({
            "status": "הושלם",
            "completed_at": datetime.now().isoformat(),
            "notes": data.get("notes", ""),
            "images": data.get("images", [])
        })
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/update-task/{task_id}")
async def update_task(task_id: str, data: dict):
    task_ref = db.collection("tasks").document(task_id)
    data["updated_at"] = datetime.now().isoformat()
    task_ref.update(data)
    return {"status": "success"}

@router.delete("/delete-task/{task_id}")
async def delete_task(task_id: str):
    db.collection("tasks").document(task_id).delete()
    return {"status": "success"}