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
    # שים לב: עדיף להשתמש ב-reload=True בזמן פיתוח כדי שהשרת יתעדכן כשאתה שומר קבצים
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)