import asyncio
import os
import sys

sys.path.insert(0, os.getcwd())

from src.config.db import connect_to_mongo, get_db, close_mongo_connection

async def run():
    await connect_to_mongo()
    db = get_db()
    
    # Change 'no' to 'or' (Odia)
    res = await db.telemetry.update_many({"language": "no"}, {"$set": {"language": "or"}})
    print(f"Updated {res.modified_count} records to Odia (or)")
    
    # Change 'so' to 'bn' (Bengali)
    res = await db.telemetry.update_many({"language": "so"}, {"$set": {"language": "bn"}})
    print(f"Updated {res.modified_count} records to Bengali (bn)")
    
    # Change 'sw' to 'hi' (Hindi)
    res = await db.telemetry.update_many({"language": "sw"}, {"$set": {"language": "hi"}})
    print(f"Updated {res.modified_count} records to Hindi (hi)")
    
    langs = await db.telemetry.distinct("language")
    print("NEW DISTINCT LANGUAGES:", langs)
    
    await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(run())
