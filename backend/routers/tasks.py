from fastapi import APIRouter, HTTPException
from typing import List, Dict, Optional
from database import db
from datetime import datetime
from google.cloud import firestore # Required for ArrayUnion
import firebase_admin
from firebase_admin import storage

router = APIRouter()

@router.get("/get-tasks")
async def get_tasks():
    docs = db.collection("tasks").stream()
    tasks = [{**d.to_dict(), "id": d.id} for d in docs]
    tasks.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return tasks

@router.get("/get-task/{task_id}")
async def get_task(task_id: str):
    doc = db.collection("tasks").document(task_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Task not found")
    return {**doc.to_dict(), "id": doc.id}

@router.post("/add-task")
async def add_task(task_data: dict):
    task_data["created_at"] = datetime.now().isoformat()
    task_data["status"] = "פתוח"
    
    defaults = {
        "selected_meter_id": "",
        "meter_reading_done": False,
        "last_reading_value": "",
        "notes": "",
        "description": "",
        "office_notes": "",
        "images": []
    }
    for key, val in defaults.items():
        task_data.setdefault(key, val)
    
    new_doc_ref = db.collection("tasks").document()
    new_doc_ref.set(task_data)
    return {"status": "success", "id": new_doc_ref.id}

@router.put("/update-task-status/{task_id}")
async def update_task_status(task_id: str, data: dict):
    try:
        task_ref = db.collection("tasks").document(task_id)
        current_time = datetime.now().isoformat()
        display_time = datetime.now().strftime("%d/%m/%Y %H:%M")
        
        status = data.get("status")
        update_payload = {
            "status": status,
            "updated_at": current_time
        }

        # Explicitly save images if they are provided in the request
        if "images" in data:
            update_payload["images"] = data.get("images")

        # Handling the Comment History
        comment_text = data.get("comment_text")
        if comment_text:
            new_comment = {
                "text": comment_text,
                "timestamp": current_time,
                "display_date": display_time,
                "sender": data.get("sender", "system")
            }
            update_payload["comments"] = firestore.ArrayUnion([new_comment])

        if status == "ממתין לאישור":
            update_payload["reported_at"] = current_time

        task_ref.update(update_payload)
        return {"status": "success"}
    except Exception as e:
        print(f"Error: {e}") # This helps you see errors in the terminal
        raise HTTPException(status_code=500, detail=str(e))
    
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
        batch.update(task_ref, {
            "last_reading_value": new_val,
            "meter_reading_done": True,
            "updated_at": datetime.now().isoformat()
        })
        batch.update(meter_ref, {
            "current_reading": new_val, 
            "last_reading": prev_val, 
            "current_reading_date": now_str
        })
        
        hist_ref = db.collection("readings").document()
        batch.set(hist_ref, {
            "meter_id": meter_id,
            "value": new_val,
            "previous_value": prev_val,
            "date_display": now_str,
            "timestamp": datetime.now(),
            "log_type": "READING",
            "task_id": task_id
        })
        batch.commit()
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/complete-task/{task_id}")
async def complete_task(task_id: str):
    try:
        task_ref = db.collection("tasks").document(task_id)
        display_time = datetime.now().strftime("%d/%m/%Y %H:%M")
        
        # We also log the final closing as a comment in the history
        closing_log = {
            "text": "המשימה אושרה ונסגרה סופית על ידי המשרד.",
            "timestamp": datetime.now().isoformat(),
            "display_date": display_time,
            "sender": "system"
        }
        
        task_ref.update({
            "status": "הושלם",
            "completed_at": datetime.now().isoformat(),
            "comments": firestore.ArrayUnion([closing_log])
        })
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.put("/update-task/{task_id}")
async def update_task(task_id: str, data: dict):
    try:
        task_ref = db.collection("tasks").document(task_id)
        task_snap = task_ref.get()
        
        if not task_snap.exists:
            raise HTTPException(status_code=404, detail="Task not found")

        # Fields allowed to be updated
        allowed_fields = ["type", "title", "priority", "description", "selected_meter_id", "status"]
        update_payload = {k: v for k, v in data.items() if k in allowed_fields}
        
        update_payload["updated_at"] = datetime.now().isoformat()

        # We specifically do NOT include 'location' here to prevent changes
        task_ref.update(update_payload)
        
        return {"status": "success"}
    except Exception as e:
        print(f"Error updating task: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/delete-task/{task_id}")
async def delete_task(task_id: str):
    try:
        task_ref = db.collection("tasks").document(task_id)
        task_snap = task_ref.get()
        if not task_snap.exists:
            raise HTTPException(status_code=404, detail="Task not found")

        # Optional: Delete images from bucket if they are URLs
        images = task_snap.to_dict().get("images", [])
        for img_url in images:
            if "firebasestorage" in img_url:
                try:
                    bucket = storage.bucket()
                    blob_path = img_url.split("/o/")[1].split("?")[0].replace("%2F", "/")
                    bucket.blob(blob_path).delete()
                except: pass

        task_ref.delete()
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))