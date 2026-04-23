from pydantic import BaseModel
from typing import Optional, Dict, List

class MeterReading(BaseModel):
    meter_id: str
    current_value: float
    customer_name: Optional[str] = None
    location: Optional[str] = None
    technician_id: Optional[str] = None
    address_detail: Optional[str] = None 
    residents_count: Optional[int] = 1
    phone: Optional[str] = None      
    email: Optional[str] = None

class Reading(BaseModel):
    meter_id: str
    value: float
    date: str
    technician: str

class Task(BaseModel):
    title: str
    description: Optional[str] = ""
    priority: str = "בינונית"
    status: str = "פתוח"
    assigned_to: Optional[str] = ""
    type: Optional[str] = "נזילה"
    location: Optional[str] = ""         # ישוב
    address: Optional[str] = ""          # כתובת
    neighborhood: Optional[str] = ""     # שכונה
    water_line: Optional[str] = ""       # קו מים
    depth: Optional[str] = ""            # עומק קו
    notes: Optional[str] = ""            # הערות
    due_date: Optional[str] = ""         
    # שדה המונים עבור סבב קריאות
    meters_to_read: Optional[List[Dict]] = []