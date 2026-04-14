import firebase_admin
from firebase_admin import credentials, firestore

try:
    cred = credentials.Certificate("serviceAccountKey.json")
    firebase_admin.initialize_app(cred)
    db = firestore.client()
    print("✅ Connected to Firebase successfully")
except Exception as e:
    print(f"❌ Firebase connection error: {e}")
    db = None