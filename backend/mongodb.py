import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL")

client = MongoClient(MONGO_URL)

db = client["coord_db"]

users_collection = db["users"]
projects_collection = db["projects"]
tasks_collection = db["tasks"]
resources_collection = db["resources"]
try:
    client.admin.command("ping")
    print("MongoDB connected successfully!")
except Exception as e:
    print("MongoDB connection failed:", e)
print("MongoDB connection object created")