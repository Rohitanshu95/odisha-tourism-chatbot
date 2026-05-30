from fastapi import APIRouter, HTTPException, Response
from src.config.db import get_db
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/summaries")
async def get_all_summaries(response: Response):
    """Fetch all users and their chat summaries for the admin dashboard."""
    try:
        db = get_db()
        
        # Fetch all users
        users_cursor = db.users.find()
        users = await users_cursor.to_list(length=1000)
        
        # Fetch all summaries
        summaries_cursor = db.chat_summaries.find()
        summaries = await summaries_cursor.to_list(length=1000)
        
        # Combine data
        # We'll return a list of summaries with user details attached
        enriched_summaries = []
        
        # Create a lookup dictionary for users by _id
        user_dict = {str(user["_id"]): user for user in users}
        
        seen_user_ids = set()
        
        for summary in summaries:
            # MongoDB _id is not JSON serializable by default without transformation, so we convert it to string
            summary["_id"] = str(summary["_id"])
            
            user_id_str = str(summary.get("user_id"))
            user_info = user_dict.get(user_id_str)
            if user_info:
                summary["user_name"] = user_info.get("name", "Unknown")
                summary["user_mobile"] = user_info.get("mobile", "Unknown")
                summary["user_email"] = user_info.get("email", "Unknown")
                seen_user_ids.add(user_id_str)
            else:
                summary["user_name"] = "Guest/Unknown"
                summary["user_mobile"] = "N/A"
                summary["user_email"] = "Guest"
                
            enriched_summaries.append(summary)
            
        # Add registered users who have no chat summaries
        from datetime import datetime
        for user_id_str, user_info in user_dict.items():
            if user_id_str not in seen_user_ids:
                enriched_summaries.append({
                    "_id": f"user_{user_id_str}",
                    "user_id": user_id_str,
                    "session_id": "N/A",
                    "summary": "User registered but has no completed chat sessions yet.",
                    "created_at": user_info.get("created_at", datetime.utcnow()),
                    "user_name": user_info.get("name", "Unknown"),
                    "user_email": user_info.get("email", "Unknown"),
                    "user_mobile": user_info.get("mobile", "Unknown")
                })
            
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        return {"summaries": enriched_summaries}
        
    except Exception as e:
        logger.error(f"Error fetching admin summaries: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch summaries from the database.")

from datetime import datetime, timedelta

@router.get("/analytics")
async def get_analytics_dashboard(response: Response, start_date: str = None, end_date: str = None):
    """Fetch telemetry data for the admin analytics dashboard."""
    try:
        db = get_db()
        if db is None:
            raise HTTPException(status_code=500, detail="Database not initialized")
            
        # Base query filter
        match_query = {}
        date_filter = {}
        if start_date:
            try:
                date_filter["$gte"] = datetime.strptime(start_date, "%Y-%m-%d")
            except ValueError:
                pass
        if end_date:
            try:
                # Add one day to include the entire end_date
                end_dt = datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1)
                date_filter["$lt"] = end_dt
            except ValueError:
                pass
                
        if date_filter:
            match_query = {"timestamp": date_filter}

        # 1. Total counts
        total_queries = await db.telemetry.count_documents(match_query)
        
        fallback_query = {"is_fallback": True}
        if match_query:
            fallback_query = {"$and": [match_query, {"is_fallback": True}]}
            
        total_fallbacks = await db.telemetry.count_documents(fallback_query)
        
        user_match_query = {}
        if date_filter:
            user_match_query = {"created_at": date_filter}
        total_users = await db.users.count_documents(user_match_query)
        # 2. Hourly aggregation (grouping by hour of day for the selected date)
        hourly_pipeline = []
        if match_query:
            hourly_pipeline.append({"$match": match_query})
            
        hourly_pipeline.extend([
            {
                "$project": {
                    "hour": {"$hour": "$timestamp"},
                    "session_id": 1
                }
            },
            {
                "$group": {
                    "_id": "$hour",
                    "queries": {"$sum": 1},
                    "unique_sessions": {"$addToSet": "$session_id"}
                }
            },
            {
                "$project": {
                    "hour": "$_id",
                    "queries": 1,
                    "users": {"$size": "$unique_sessions"}
                }
            },
            {
                "$sort": {"_id": 1}
            }
        ])
        time_cursor = db.telemetry.aggregate(hourly_pipeline)
        time_data_raw = await time_cursor.to_list(length=24)
        
        # Format for charts (00:00 to 23:00)
        time_data = [{"hour": f"{i:02d}:00", "queries": 0, "users": 0} for i in range(24)]
        for doc in time_data_raw:
            hour_idx = doc["_id"]
            if hour_idx is not None and 0 <= hour_idx < 24:
                time_data[hour_idx]["queries"] = doc.get("queries", 0)
                time_data[hour_idx]["users"] = doc.get("users", 0)

            
        # 3. Top frequent queries (simplistic aggregation by exact query match)
        query_pipeline = []
        if match_query:
            query_pipeline.append({"$match": match_query})
            
        query_pipeline.extend([
            {
                "$group": {
                    "_id": "$query",
                    "count": {"$sum": 1}
                }
            },
            {
                "$sort": {"count": -1}
            },
            {
                "$limit": 10
            }
        ])
        query_cursor = db.telemetry.aggregate(query_pipeline)
        top_queries = await query_cursor.to_list(length=10)
        
        # 4. Fetch recent system failures
        failures_query = {"is_fallback": True}
        if match_query:
            failures_query = {"$and": [match_query, {"is_fallback": True}]}
            
        failures_cursor = db.telemetry.find(failures_query).sort("timestamp", -1).limit(20)
        recent_failures = await failures_cursor.to_list(length=20)
        
        # Fix _id serialization for failures
        for f in recent_failures:
            f["_id"] = str(f["_id"])
            if "timestamp" in f and f["timestamp"]:
                f["timestamp"] = f["timestamp"].isoformat()
                
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        return {
            "overview": {
                "total_queries": total_queries,
                "total_fallbacks": total_fallbacks,
                "total_users": total_users,
                "success_rate": round(((total_queries - total_fallbacks) / max(total_queries, 1)) * 100, 1)
            },
            "time_series": time_data,
            "top_queries": top_queries,
            "recent_failures": recent_failures
        }
        
    except Exception as e:
        logger.error(f"Error fetching analytics data: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Failed to fetch analytics from the database.")
