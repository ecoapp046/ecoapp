from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from database import db 

router = APIRouter()

# --- עדכון המודל כך שיתאים לשדות החדשים בטופס הדיווח ---


@router.get("/get-tasks")
async def get_tasks():
    try:
        docs = db.collection("tasks").stream()
        tasks = []
        for d in docs:
            task_data = d.to_dict()
            task_data["id"] = d.id
            tasks.append(task_data)
        return tasks
    except Exception as e:
        print(f"Error fetching tasks: {e}")
        return []

@router.post("/add-task")
async def add_task(task: Task):
    try:
        # יצירת מזהה מסמך חדש באופן אוטומטי
        new_doc_ref = db.collection("tasks").document()
        # שמירת הנתונים ב-Firebase
        new_doc_ref.set(task.dict())
        return {"status": "success", "id": new_doc_ref.id}
    except Exception as e:
        print(f"Error adding task: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/update-task-status/{task_id}")
async def update_task_status(task_id: str, data: dict):
    try:
        db.collection("tasks").document(task_id).update({
            "status": data.get("status")
        })
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/delete-task/{task_id}")
async def delete_task(task_id: str):
    print(f"Attempting to delete task with ID: {task_id}")
    try:
        doc_ref = db.collection("tasks").document(task_id)
        if not doc_ref.get().exists:
            print("Document not found in Firebase!")
            raise HTTPException(status_code=404, detail="Task not found")
            
        doc_ref.delete()
        print("Delete successful")
        return {"status": "success"}
    except Exception as e:
        print(f"Error occurred: {e}")
        raise HTTPException(status_code=500, detail=str(e))