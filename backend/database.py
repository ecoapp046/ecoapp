import firebase_admin
from firebase_admin import credentials, firestore
import os
import json

# פונקציה לאתחול ה-DB
def initialize_db():
    try:
        firebase_config_env = os.environ.get("FIREBASE_CONFIG")
        
        if firebase_config_env:
            cred_dict = json.loads(firebase_config_env)
            cred = credentials.Certificate(cred_dict)
            print("✅ Connected to Firebase using Environment Variables")
        else:
            cred = credentials.Certificate("serviceAccountKey.json")
            print("✅ Connected to Firebase using local JSON file")

     
        if not firebase_admin._apps:
            firebase_admin.initialize_app(cred)
            
        return firestore.client()

    except Exception as e:
        print(f"❌ Firebase connection error: {e}")
        return None


db = initialize_db()