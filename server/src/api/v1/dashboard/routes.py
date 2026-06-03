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
        
        # Monthly Growth (Mocking time series if no historical data exists, otherwise agg)
        six_months_ago = datetime.utcnow() - timedelta(days=180)
        monthly_pipeline = [
            {"$match": {"timestamp": {"$gte": six_months_ago}}},
            {"$project": {
                "month": {"$dateToString": {"format": "%Y-%m", "date": "$timestamp"}},
                "is_guest": "$is_guest"
            }},
            {"$group": {
                "_id": "$month", 
                "queries": {"$sum": 1},
                "users": {"$addToSet": "$session_id"} 
            }},
            {"$sort": {"_id": 1}}
        ]
        monthly_cursor = db.telemetry.aggregate(monthly_pipeline)
        monthly_growth = [{"name": doc["_id"], "users": len(doc["users"]), "conversations": doc["queries"]} for doc in await monthly_cursor.to_list(length=6)]

        # Averages
        avg_msgs_per_conv = (total_queries / total_sessions) if total_sessions > 0 else 0
        
        # Returning Users (Registered users with > 1 session)
        return_users_pipeline = [
            {"$match": {"meta.is_guest": False}},
            {"$group": {"_id": "$user_id", "session_count": {"$sum": 1}}},
            {"$match": {"session_count": {"$gt": 1}}}
        ]
        ret_cursor = db.chat_sessions.aggregate(return_users_pipeline)
        ret_docs = await ret_cursor.to_list(length=None)
        returning_users = len(ret_docs)

        # Avg Session Duration
        duration_pipeline = [
            {"$group": {
                "_id": "$session_id",
                "min_time": {"$min": "$timestamp"},
                "max_time": {"$max": "$timestamp"}
            }},
            {"$project": {
                "duration": {"$dateDiff": {"startDate": "$min_time", "endDate": "$max_time", "unit": "second"}}
            }},
            {"$group": {
                "_id": None,
                "avg_duration": {"$avg": "$duration"}
            }}
        ]
        dur_cursor = db.telemetry.aggregate(duration_pipeline)
        dur_docs = await dur_cursor.to_list(length=1)
        
        avg_session_duration_sec = dur_docs[0]["avg_duration"] if dur_docs and dur_docs[0].get("avg_duration") else 0
        minutes = int(avg_session_duration_sec // 60)
        seconds = int(avg_session_duration_sec % 60)
        avg_session_duration_str = f"{minutes}m {seconds}s"
        
        return {
            "total_users": total_users,
            "total_queries": total_queries,
            "total_sessions": total_sessions,
            "user_types": user_types,
            "monthly_growth": monthly_growth,
            "avg_msgs_per_conv": round(avg_msgs_per_conv, 1),
            "returning_users": returning_users,
            "avg_session_duration": avg_session_duration_str
        }
    except Exception as e:
        logger.error(f"Error fetching executive summary: {e}")
        raise HTTPException(status_code=500, detail="Error fetching data")

@router.get("/demographics")
async def get_demographics():
    """Demographics metrics (Locations, Languages)."""
    try:
        db = get_db()
        
        # State distribution
        state_pipeline = [
            {"$match": {"state": {"$ne": None}}},
            {"$group": {"_id": "$state", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 10}
        ]
        state_cursor = db.users.aggregate(state_pipeline)
        states = [{"name": doc["_id"], "value": doc["count"]} for doc in await state_cursor.to_list(length=10)]

        # Country distribution
        country_pipeline = [
            {"$match": {"country": {"$ne": None}}},
            {"$group": {"_id": "$country", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 10}
        ]
        country_cursor = db.users.aggregate(country_pipeline)
        countries = [{"name": doc["_id"], "value": doc["count"]} for doc in await country_cursor.to_list(length=10)]

        # Language distribution
        lang_pipeline = [
            {"$match": {"language_preference": {"$ne": None}}},
            {"$group": {"_id": "$language_preference", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]
        lang_cursor = db.users.aggregate(lang_pipeline)
        languages = [{"name": doc["_id"], "value": doc["count"]} for doc in await lang_cursor.to_list(length=10)]

        return {
            "locations": states + countries, 
            "languages": languages
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
        avg_response_time = (resp_result[0]["avg_time"]/1000) if resp_result else 0 # Convert to seconds
        
        # Daily Activity (Last 7 days)
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        daily_pipeline = [
            {"$match": {"timestamp": {"$gte": seven_days_ago}}},
            {"$project": {
                "date": {"$dateToString": {"format": "%Y-%m-%d", "date": "$timestamp"}},
                "session_id": "$session_id"
            }},
            {"$group": {
                "_id": "$date", 
                "queries": {"$sum": 1},
                "users": {"$addToSet": "$session_id"}
            }},
            {"$sort": {"_id": 1}}
        ]
        daily_cursor = db.telemetry.aggregate(daily_pipeline)
        daily_activity_docs = await daily_cursor.to_list(length=10)
        daily_activity = [{"date": doc["_id"], "queries": doc["queries"], "users": len(doc["users"])} for doc in daily_activity_docs]

        # Active Users Today (DAU for today)
        today = datetime.utcnow().strftime("%Y-%m-%d")
        today_activity = next((doc for doc in daily_activity if doc["date"] == today), None)
        active_users_today = today_activity["users"] if today_activity else 0
        
        # Daily Active Users (Avg over last 7 days)
        total_users_7d = sum([doc["users"] for doc in daily_activity])
        daily_active_users = int(total_users_7d / len(daily_activity)) if daily_activity else 0
        
        # Monthly Active Users (Distinct sessions last 30 days)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        mau_pipeline = [
            {"$match": {"timestamp": {"$gte": thirty_days_ago}}},
            {"$group": {"_id": "$session_id"}}
        ]
        mau_cursor = db.telemetry.aggregate(mau_pipeline)
        mau_docs = await mau_cursor.to_list(length=None)
        monthly_active_users = len(mau_docs)
        
        # Total API Requests & Error Rate
        total_api_requests = await db.telemetry.count_documents({})
        error_count = await db.telemetry.count_documents({"is_error": True})
        
        error_rate = (error_count / total_api_requests * 100) if total_api_requests > 0 else 0
        query_success_rate = 100 - error_rate if total_api_requests > 0 else 100
        
        # System Availability (pseudo-calculated based on errors)
        system_availability = 100 - (error_rate * 0.1) if total_api_requests > 0 else 100

        return {
            "avg_response_time_ms": round(avg_response_time, 2),
            "daily_activity": daily_activity,
            "active_users_today": active_users_today,
            "daily_active_users": daily_active_users,
            "monthly_active_users": monthly_active_users,
            "total_api_requests": total_api_requests,
            "query_success_rate": round(query_success_rate, 2),
            "error_rate": round(error_rate, 2),
            "system_availability": round(system_availability, 3)
        }
    except Exception as e:
        logger.error(f"Error fetching operational metrics: {e}")
        raise HTTPException(status_code=500, detail="Error fetching data")
