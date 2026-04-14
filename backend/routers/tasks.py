from fastapi import APIRouter, HTTPException
from typing import List, Dict
from database import db
from models import Task  # ייבוא המודל מהקובץ שעדכנו
from datetime import datetime
from google.cloud import firestore

router = APIRouter()

# --- 1. קבלת כל המשימות (ממוינות לפי תאריך יצירה) ---
@router.get("/get-tasks")
async def get_tasks():
    try:
        # שליפת משימות ממוינות (דורש אינדקס ב-Firestore)
        # אם עדיין אין אינדקס, אפשר להשתמש ב-stream() רגיל ולמיין ב-Python
        docs = db.collection("tasks").stream()
        tasks = []
        for d in docs:
            task_data = d.to_dict()
            task_data["id"] = d.id
            tasks.append(task_data)
        
        # מיון ב-Python (ליתר ביטחון אם אין אינדקס ב-DB)
        tasks.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        return tasks
    except Exception as e:
        print(f"Error fetching tasks: {e}")
        return []

# --- 2. הוספת משימה חדשה ---
@router.post("/add-task")
async def add_task(task: Task):
    try:
        task_dict = task.dict()
        
        # הוספת נתונים אוטומטיים שהטכנאי לא ממלא ידנית
        task_dict["created_at"] = datetime.now().isoformat()
        task_dict["status"] = task_dict.get("status") or "פתוח"
        
        # יצירת מסמך חדש
        new_doc_ref = db.collection("tasks").document()
        new_doc_ref.set(task_dict)
        
        return {"status": "success", "id": new_doc_ref.id}
    except Exception as e:
        print(f"Error adding task: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- 3. עדכון סטטוס משימה (למשל סגירת משימה) ---
@router.put("/update-task-status/{task_id}")
async def update_task_status(task_id: str, data: dict):
    try:
        new_status = data.get("status")
        if not new_status:
            raise HTTPException(status_code=400, detail="Missing status")

        db.collection("tasks").document(task_id).update({
            "status": new_status,
            "updated_at": datetime.now().isoformat()
        })
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- 4. מחיקת משימה ---
@router.delete("/delete-task/{task_id}")
async def delete_task(task_id: str):
    try:
        doc_ref = db.collection("tasks").document(task_id)
        if not doc_ref.get().exists:
            raise HTTPException(status_code=404, detail="Task not found")
            
        doc_ref.delete()
        return {"status": "success"}
    except Exception as e:
        print(f"Error deleting task: {e}")
        raise HTTPException(status_code=500, detail=str(e))