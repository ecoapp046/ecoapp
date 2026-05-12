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
    location: Optional[str] = ""      
    address: Optional[str] = ""          
    neighborhood: Optional[str] = ""     
    water_line: Optional[str] = ""     
    depth: Optional[str] = ""         
    notes: Optional[str] = ""           
    due_date: Optional[str] = ""         
    meters_to_read: Optional[List[Dict]] = []
    selected_meter_id: Optional[str] = None # Important for the link