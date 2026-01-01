import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")

if not MONGO_URI:
    raise RuntimeError("MONGO_URI environment variable not set")

client = MongoClient(
    MONGO_URI,
    serverSelectionTimeoutMS=5000  # 5 sec timeout
)

try:
    client.admin.command("ping")
    print("MongoDB connected successfully")
except Exception as e:
    raise RuntimeError(f"MongoDB connection failed: {e}")

db = client["beyondchats"]
articles_collection = db["articles"]
