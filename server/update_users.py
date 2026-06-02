import asyncio
from datetime import datetime
from src.config.db import connect_to_mongo, get_db, close_mongo_connection
from dotenv import load_dotenv

load_dotenv()

async def update_users():
    await connect_to_mongo()
    db = get_db()
    if db is None:
        print("Database not connected")
        return
        
    users = await db["users"].find({"created_at": {"$exists": False}}).to_list(length=100)
    print(f"Found {len(users)} users without created_at field.")
    for user in users:
        await db["users"].update_one(
            {"_id": user["_id"]},
            {"$set": {"created_at": datetime.utcnow()}}
        )
        print(f"Updated user {user.get('email')}")
        
    await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(update_users())
