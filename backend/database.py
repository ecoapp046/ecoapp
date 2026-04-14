import firebase_admin
from firebase_admin import credentials, firestore
import os
import json

# פונקציה לאתחול ה-DB
def initialize_db():
    try:
        # 1. ניסיון קריאה ממשתנה סביבה (עבור Render/Railway)
        firebase_config_env = os.environ.get("FIREBASE_CONFIG")
        
        if firebase_config_env:
            # המרת הטקסט מהמשתנה חזרה למילון Python
            cred_dict = json.loads(firebase_config_env)
            cred = credentials.Certificate(cred_dict)
            print("✅ Connected to Firebase using Environment Variables")
        else:
            # 2. שימוש בקובץ מקומי (עבור פיתוח במחשב)
            # וודא שהנתיב נכון יחסית לתיקיית הריצה
            cred = credentials.Certificate("backend/serviceAccountKey.json")
            print("✅ Connected to Firebase using local JSON file")

        # אתחול ה-App רק אם הוא לא אותחל כבר
        if not firebase_admin._apps:
            firebase_admin.initialize_app(cred)
            
        return firestore.client()

    except Exception as e:
        print(f"❌ Firebase connection error: {e}")
        return None

# יצירת מופע של ה-DB לשימוש בשאר הראוטרים
db = initialize_db()