import asyncio
import os
import sys

sys.path.insert(0, os.getcwd())

from src.config.db import connect_to_mongo, get_db, close_mongo_connection

async def run():
    await connect_to_mongo()
    db = get_db()
    
    # Check what fields exist in a typical telemetry document
    doc = await db.telemetry.find_one()
    print("Sample Telemetry Doc:", doc)
    
    destinations = await db.telemetry.distinct("destination")
    print("DISTINCT DESTINATIONS:", destinations)
    
    categories = await db.telemetry.distinct("tourism_category")
    print("DISTINCT CATEGORIES:", categories)
    
    # Check if there's any other fields that might represent destination/category
    # e.g., 'category', 'location', 'intent'
    
    await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(run())
