import asyncio
import os
import sys
import random

sys.path.insert(0, os.getcwd())

from src.config.db import connect_to_mongo, get_db, close_mongo_connection

async def run():
    await connect_to_mongo()
    db = get_db()
    
    destinations = ["Bhubaneswar", "Puri", "Konark", "Cuttack", "Chilika", "Rourkela", "Sambalpur", "Berhampur"]
    categories = ["Temples", "Beaches", "Wildlife", "Heritage", "Nature", "Accommodation", "Food"]
    
    # Fetch some telemetry docs that have None for destination and category
    cursor = db.telemetry.find({"$or": [{"destination": None}, {"tourism_category": None}]}).limit(50)
    docs = await cursor.to_list(length=50)
    
    updates = 0
    for doc in docs:
        dest = random.choice(destinations)
        cat = random.choice(categories)
        
        # 30% chance to leave as None to be realistic, but we want to populate most of them
        if random.random() < 0.1: dest = None
        if random.random() < 0.1: cat = None
            
        await db.telemetry.update_one(
            {"_id": doc["_id"]},
            {"$set": {"destination": dest, "tourism_category": cat}}
        )
        updates += 1
        
    print(f"Populated {updates} telemetry records with random destinations and categories for testing.")
    
    await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(run())
