from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import readings, meters, tasks

app = FastAPI()

# הגדרות CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# חיבור הראוטרים - כאן היה חסר ה-tasks
app.include_router(readings.router, tags=["Readings"])
app.include_router(meters.router, tags=["Meters"])
app.include_router(tasks.router, tags=["Tasks"]) # <--- הוסף את השורה הזו!

@app.get("/")
def home():
    return {"message": "Water Management API is running"}

if __name__ == "__main__":
    import uvicorn
    import os

    # בענן, השרת יספק לנו את הפורט דרך משתנה סביבה שנקרא PORT
    # אם אנחנו במחשב האישי, נשתמש בברירת מחדל 8000
    port = int(os.environ.get("PORT", 8000))
    
    # שינוי ה-host ל-0.0.0.0 מאפשר גישה חיצונית
    # חשוב: ב-Production (ענן) נהוג לכבות את ה-reload
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)