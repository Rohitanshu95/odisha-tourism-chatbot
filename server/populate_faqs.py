import asyncio
import os
import sys

sys.path.insert(0, os.getcwd())

from src.config.db import connect_to_mongo, get_db, close_mongo_connection
import datetime

async def run():
    await connect_to_mongo()
    db = get_db()
    
    # Insert some repeated queries to show up in FAQs
    queries = [
        "What is the best time to visit Puri?",
        "How to reach Konark Sun Temple?",
        "Are there any good hotels in Bhubaneswar?"
    ]
    
    docs = []
    for q in queries:
        # insert 3-5 times each
        for _ in range(4):
            docs.append({
                "session_id": "test_session_faq",
                "query": q,
                "is_guest": True,
                "is_fallback": False,
                "destination": "Puri" if "Puri" in q else "Konark" if "Konark" in q else "Bhubaneswar",
                "tourism_category": "Temples" if "Temple" in q else "Accommodation" if "hotels" in q else "General",
                "response_time_ms": 1500,
                "language": "en",
                "timestamp": datetime.datetime.utcnow()
            })
            
    await db.telemetry.insert_many(docs)
    print(f"Inserted {len(docs)} repeated queries for FAQ testing.")
    
    await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(run())
