import os
from motor.motor_asyncio import AsyncIOMotorClient

class Database:
    client: AsyncIOMotorClient = None
    db = None

db_config = Database()

async def connect_to_mongo():
    mongo_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    db_name = os.getenv("MONGODB_DB_NAME", "pathik_ai")
    
    db_config.client = AsyncIOMotorClient(mongo_uri)
    db_config.db = db_config.client[db_name]
    print(f"Connected to MongoDB: {db_name}")

async def close_mongo_connection():
    if db_config.client:
        db_config.client.close()
        print("MongoDB connection closed")

def get_db():
    return db_config.db
