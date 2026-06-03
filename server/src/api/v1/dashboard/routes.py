from fastapi import APIRouter, HTTPException
from src.config.db import get_db
import logging
from datetime import datetime, timedelta

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/executive")
async def get_executive_summary():
    """Executive summary metrics."""
    try:
        db = get_db()
        
        # Total Users
        total_users = await db.users.count_documents({})
        # Total Queries
        total_queries = await db.telemetry.count_documents({})
        # Total Sessions (Chat Histories)
        total_sessions = await db.chat_sessions.count_documents({})
        
        # User Type Distribution
        # A simple aggregation based on is_guest field in chat_sessions meta
        pipeline_user_type = [
            {"$group": {"_id": "$meta.is_guest", "count": {"$sum": 1}}}
        ]
        user_type_cursor = db.chat_sessions.aggregate(pipeline_user_type)
        user_types_raw = await user_type_cursor.to_list(length=10)
        
        guest_count = 0
        registered_count = 0
        for doc in user_types_raw:
            if doc["_id"] is True:
                guest_count += doc["count"]
            else:
                registered_count += doc["count"]
                
        user_types = [
            {"name": "Registered", "value": registered_count},
            {"name": "Guest", "value": guest_count}
        ]

        return {
            "total_users": total_users,
            "total_queries": total_queries,
            "total_sessions": total_sessions,
            "user_types": user_types
        }
    except Exception as e:
        logger.error(f"Error fetching executive summary: {e}")
        raise HTTPException(status_code=500, detail="Error fetching data")

@router.get("/demographics")
async def get_demographics():
    """Demographics metrics (Locations, Languages)."""
    try:
        db = get_db()
        
        # States & Countries from session_locations
        location_pipeline = [
            {"$group": {"_id": "$location_detail", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 10}
        ]
        loc_cursor = db.session_locations.aggregate(location_pipeline)
        locations_raw = await loc_cursor.to_list(length=10)
        
        locations = [{"name": loc["_id"] or "Unknown", "value": loc["count"]} for loc in locations_raw]

        return {
            "locations": locations,
            "languages": [{"name": "English", "value": 80}, {"name": "Odia", "value": 20}] # Placeholder until language tracked
        }
    except Exception as e:
        logger.error(f"Error fetching demographics: {e}")
        raise HTTPException(status_code=500, detail="Error fetching data")

@router.get("/demand")
async def get_demand_analytics():
    """Demand analytics (Top destinations, categories)."""
    try:
        db = get_db()
        
        # Top Destinations
        dest_pipeline = [
            {"$match": {"destination": {"$ne": None}}},
            {"$group": {"_id": "$destination", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 10}
        ]
        dest_cursor = db.telemetry.aggregate(dest_pipeline)
        destinations = [{"name": doc["_id"], "value": doc["count"]} for doc in await dest_cursor.to_list(length=10)]
        
        # Top Categories
        cat_pipeline = [
            {"$match": {"tourism_category": {"$ne": None}}},
            {"$group": {"_id": "$tourism_category", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]
        cat_cursor = db.telemetry.aggregate(cat_pipeline)
        categories = [{"name": doc["_id"], "value": doc["count"]} for doc in await cat_cursor.to_list(length=10)]

        return {
            "top_destinations": destinations,
            "tourism_categories": categories
        }
    except Exception as e:
        logger.error(f"Error fetching demand analytics: {e}")
        raise HTTPException(status_code=500, detail="Error fetching data")

@router.get("/knowledge")
async def get_knowledge_analytics():
    """Knowledge analytics (Fallbacks, Unanswered queries)."""
    try:
        db = get_db()
        
        # Fallback rate
        total = await db.telemetry.count_documents({})
        fallbacks = await db.telemetry.count_documents({"is_fallback": True})
        fallback_rate = (fallbacks / total * 100) if total > 0 else 0
        
        # Knowledge Gaps
        gap_pipeline = [
            {"$match": {"is_fallback": True, "gap_category": {"$ne": None}}},
            {"$group": {"_id": "$gap_category", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]
        gap_cursor = db.telemetry.aggregate(gap_pipeline)
        gaps = [{"name": doc["_id"], "value": doc["count"]} for doc in await gap_cursor.to_list(length=10)]

        # Top Unanswered Queries
        unanswered_pipeline = [
            {"$match": {"is_fallback": True}},
            {"$group": {"_id": "$query", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 5}
        ]
        un_cursor = db.telemetry.aggregate(unanswered_pipeline)
        unanswered = [{"query": doc["_id"], "count": doc["count"]} for doc in await un_cursor.to_list(length=5)]

        return {
            "fallback_rate": round(fallback_rate, 2),
            "knowledge_gaps": gaps,
            "top_unanswered": unanswered
        }
    except Exception as e:
        logger.error(f"Error fetching knowledge analytics: {e}")
        raise HTTPException(status_code=500, detail="Error fetching data")

@router.get("/operational")
async def get_operational_metrics():
    """Operational metrics (Response times)."""
    try:
        db = get_db()
        
        # Avg Response Time
        resp_pipeline = [
            {"$match": {"response_time_ms": {"$ne": None}}},
            {"$group": {"_id": None, "avg_time": {"$avg": "$response_time_ms"}}}
        ]
        resp_cursor = db.telemetry.aggregate(resp_pipeline)
        resp_result = await resp_cursor.to_list(length=1)
        avg_response_time = resp_result[0]["avg_time"] if resp_result else 0
        
        # Daily Activity (Last 7 days)
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        daily_pipeline = [
            {"$match": {"timestamp": {"$gte": seven_days_ago}}},
            {"$project": {
                "date": {"$dateToString": {"format": "%Y-%m-%d", "date": "$timestamp"}}
            }},
            {"$group": {"_id": "$date", "count": {"$sum": 1}}},
            {"$sort": {"_id": 1}}
        ]
        daily_cursor = db.telemetry.aggregate(daily_pipeline)
        daily_activity = [{"date": doc["_id"], "queries": doc["count"]} for doc in await daily_cursor.to_list(length=10)]

        return {
            "avg_response_time_ms": round(avg_response_time, 2),
            "daily_activity": daily_activity
        }
    except Exception as e:
        logger.error(f"Error fetching operational metrics: {e}")
        raise HTTPException(status_code=500, detail="Error fetching data")
