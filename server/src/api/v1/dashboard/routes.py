from fastapi import APIRouter, HTTPException, Response
from src.config.db import get_db
import logging
from datetime import datetime, timedelta

router = APIRouter()
logger = logging.getLogger(__name__)

def get_required_db():
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    return db

@router.get("/executive")
async def get_executive_summary(response: Response):
    """Executive summary metrics."""
    try:
        db = get_required_db()
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
        
        # Total registered users
        registered_users = await db.users.count_documents({})
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
        for doc in user_types_raw:
            if doc["_id"] is True:
                guest_count += doc["count"]
                
        user_types = [
            {"name": "Registered", "value": registered_users},
            {"name": "Guest", "value": guest_count}
        ]
        total_users = registered_users + guest_count
        
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
            {"$group": {"_id": "$meta.user_id", "session_count": {"$sum": 1}}},
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
            }}
        ]
        dur_cursor = db.telemetry.aggregate(duration_pipeline)
        dur_docs = await dur_cursor.to_list(length=None)
        
        durations = []
        for doc in dur_docs:
            min_time = doc.get("min_time")
            max_time = doc.get("max_time")
            if isinstance(min_time, datetime) and isinstance(max_time, datetime):
                durations.append((max_time - min_time).total_seconds())

        avg_session_duration_sec = (sum(durations) / len(durations)) if durations else 0
        minutes = int(avg_session_duration_sec // 60)
        seconds = int(avg_session_duration_sec % 60)
        avg_session_duration_str = f"{minutes}m {seconds}s"
        
        return {
            "total_users": total_users,
            "registered_users": registered_users,
            "guest_users": guest_count,
            "total_queries": total_queries,
            "total_sessions": total_sessions,
            "user_types": user_types,
            "monthly_growth": monthly_growth,
            "avg_msgs_per_conv": round(avg_msgs_per_conv, 1),
            "returning_users": returning_users,
            "avg_session_duration": avg_session_duration_str,
            "refreshed_at": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Error fetching executive summary: {e}")
        raise HTTPException(status_code=500, detail="Error fetching data")

@router.get("/demographics")
async def get_demographics():
    """Demographics metrics (Locations, Languages)."""
    try:
        db = get_required_db()
        
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
        # Language distribution
        lang_pipeline = [
            {"$match": {"language": {"$ne": None, "$nin": ["unknown"]}}},
            {"$group": {"_id": {"session": "$session_id", "lang": "$language"}}},
            {"$group": {"_id": "$_id.lang", "count": {"$sum": 1}}}
        ]
        lang_cursor = db.telemetry.aggregate(lang_pipeline)
        
        bucketed = {}
        
        indian_lang_map = {
            'bn': 'Bengali', 'bengali': 'Bengali',
            'mr': 'Marathi', 'marathi': 'Marathi',
            'te': 'Telugu', 'telugu': 'Telugu',
            'ta': 'Tamil', 'tamil': 'Tamil',
            'gu': 'Gujarati', 'gujarati': 'Gujarati',
            'kn': 'Kannada', 'kannada': 'Kannada',
            'ml': 'Malayalam', 'malayalam': 'Malayalam',
            'pa': 'Punjabi', 'punjabi': 'Punjabi',
            'as': 'Assamese', 'assamese': 'Assamese',
            'ur': 'Urdu', 'urdu': 'Urdu',
            'sa': 'Sanskrit', 'sanskrit': 'Sanskrit'
        }

        for doc in await lang_cursor.to_list(length=1000):
            lang_val = doc["_id"].lower() if isinstance(doc["_id"], str) else str(doc["_id"])
            count = doc["count"]
            
            if lang_val in ('or', 'ory', 'odia', 'oriya'):
                bucketed["Odia"] = bucketed.get("Odia", 0) + count
            elif lang_val in ('en', 'eng', 'english'):
                bucketed["English"] = bucketed.get("English", 0) + count
            elif lang_val in ('hi', 'hin', 'hindi'):
                bucketed["Hindi"] = bucketed.get("Hindi", 0) + count
            elif lang_val in indian_lang_map:
                mapped_name = indian_lang_map[lang_val]
                bucketed[mapped_name] = bucketed.get(mapped_name, 0) + count
            else:
                bucketed["Others"] = bucketed.get("Others", 0) + count
                
        languages = [{"name": k, "value": v} for k, v in bucketed.items() if v > 0]
        languages.sort(key=lambda x: x["value"], reverse=True)

        # New Registered Users (Last 7 days)
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        new_registered = await db.users.count_documents({"created_at": {"$gte": seven_days_ago}})
        
        # Total Users
        total_users = await db.users.count_documents({})
        total_guests = await db.chat_sessions.count_documents({"meta.is_guest": True}) # rough estimate of guest sessions
        # Registration rate
        total_unique = total_users + total_guests
        registration_rate = (total_users / total_unique * 100) if total_unique > 0 else 0
        
        # Returning Users
        return_users_pipeline = [
            {"$match": {"meta.is_guest": False}},
            {"$group": {"_id": "$meta.user_id", "session_count": {"$sum": 1}}},
            {"$match": {"session_count": {"$gt": 1}}}
        ]
        ret_cursor = db.chat_sessions.aggregate(return_users_pipeline)
        ret_docs = await ret_cursor.to_list(length=None)
        returning_users = len(ret_docs)
        
        # Multi-Language Users (users with queries in languages other than English)
        multi_lang_users_pipeline = [
            {"$match": {"language": {"$nin": ["en", "unknown", None]}}},
            {"$group": {"_id": "$session_id"}}
        ]
        multi_lang_cursor = db.telemetry.aggregate(multi_lang_users_pipeline)
        multi_lang_users = len(await multi_lang_cursor.to_list(length=None))

        return {
            "locations": states + countries, 
            "languages": languages,
            "new_registered_users": new_registered,
            "returning_users": returning_users,
            "registration_rate": round(registration_rate, 1),
            "multi_language_users": multi_lang_users
        }
    except Exception as e:
        logger.error(f"Error fetching demographics: {e}")
        raise HTTPException(status_code=500, detail="Error fetching data")

@router.get("/demand")
async def get_demand_analytics(response: Response):
    """Demand analytics (Top destinations, categories, heat map)."""
    try:
        db = get_required_db()
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
        
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

        # Destination Queries (Total where destination is not null)
        destination_queries = await db.telemetry.count_documents({"destination": {"$ne": None}})
        
        # Accommodation Queries (Total where category is Accommodation)
        accommodation_queries = await db.telemetry.count_documents({"tourism_category": "Accommodation"})

        # Heat Map Data Generation
        # Map common destinations to approximate (x, y) coordinates on a 0-100 grid of Odisha
        geo_map = {
            "Bhubaneswar": {"x": 70, "y": 50},
            "Puri": {"x": 75, "y": 60},
            "Cuttack": {"x": 72, "y": 45},
            "Konark": {"x": 80, "y": 55},
            "Chilika": {"x": 65, "y": 70},
            "Rourkela": {"x": 30, "y": 15},
            "Sambalpur": {"x": 40, "y": 30},
            "Berhampur": {"x": 55, "y": 80},
            "Balasore": {"x": 85, "y": 20}
        }
        
        heat_map_data = []
        for dest in destinations:
            name = dest["name"]
            # Default to center if unknown location to still show it on the map
            coords = geo_map.get(name, {"x": 50, "y": 50})
            heat_map_data.append({
                "x": coords["x"],
                "y": coords["y"],
                "z": dest["value"] * 20, # Scale up for bubble size visually
                "name": name
            })

        return {
            "top_destinations": destinations,
            "tourism_categories": categories,
            "destination_queries": destination_queries,
            "accommodation_queries": accommodation_queries,
            "heat_map_data": heat_map_data
        }
    except Exception as e:
        logger.error(f"Error fetching demand analytics: {e}")
        raise HTTPException(status_code=500, detail="Error fetching data")

@router.get("/knowledge")
async def get_knowledge_analytics():
    """Knowledge analytics (Fallbacks, Unanswered queries)."""
    try:
        db = get_required_db()
        
        # Fallback rate & Unanswered Queries
        total = await db.telemetry.count_documents({})
        fallbacks = await db.telemetry.count_documents({"is_fallback": True})
        fallback_rate = (fallbacks / total * 100) if total > 0 else 0
        
        # Knowledge Coverage
        knowledge_coverage = 100 - fallback_rate
        
        # Low Confidence
        low_confidence_count = await db.telemetry.count_documents({"confidence_score": {"$lt": 0.7}})
        
        # Repeated Questions (Queries asked > 1 time)
        repeated_pipeline = [
            {"$group": {"_id": "$query", "count": {"$sum": 1}}},
            {"$match": {"count": {"$gt": 1}}}
        ]
        rep_cursor = db.telemetry.aggregate(repeated_pipeline)
        rep_docs = await rep_cursor.to_list(length=None)
        repeated_questions = len(rep_docs)
        
        # Emerging Topics (Queries asked > 0 times in last 7 days that were not asked before, simplified here to recent unique gaps)
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        emerging_pipeline = [
            {"$match": {"timestamp": {"$gte": seven_days_ago}, "is_fallback": True, "gap_category": {"$ne": None}}},
            {"$group": {"_id": "$gap_category"}}
        ]
        em_cursor = db.telemetry.aggregate(emerging_pipeline)
        em_docs = await em_cursor.to_list(length=None)
        emerging_topics = len(em_docs)
        
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
        
        # Top FAQs
        faq_pipeline = [
            {"$match": {"is_fallback": False}},
            {"$project": {"query_lower": {"$toLower": "$query"}}},
            {"$group": {"_id": "$query_lower", "count": {"$sum": 1}}},
            {"$match": {"count": {"$gt": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 10}
        ]
        faq_cursor = db.telemetry.aggregate(faq_pipeline)
        faqs = [{"query": doc["_id"], "count": doc["count"]} for doc in await faq_cursor.to_list(length=10)]

        return {
            "fallback_rate": round(fallback_rate, 2),
            "knowledge_coverage": round(knowledge_coverage, 2),
            "unanswered_queries": fallbacks,
            "low_confidence_count": low_confidence_count,
            "repeated_questions": repeated_questions,
            "emerging_topics": emerging_topics,
            "knowledge_gaps": gaps,
            "top_unanswered": unanswered,
            "top_faqs": faqs
        }
    except Exception as e:
        logger.error(f"Error fetching knowledge analytics: {e}")
        raise HTTPException(status_code=500, detail="Error fetching data")

@router.get("/operational")
async def get_operational_metrics():
    """Operational metrics (Response times)."""
    try:
        db = get_required_db()
        
        # Avg Response Time
        resp_pipeline = [
            {"$match": {"response_time_ms": {"$ne": None}}},
            {"$group": {"_id": None, "avg_time": {"$avg": "$response_time_ms"}}}
        ]
        resp_cursor = db.telemetry.aggregate(resp_pipeline)
        resp_result = await resp_cursor.to_list(length=1)
        avg_response_time = ((resp_result[0].get("avg_time") or 0) / 1000) if resp_result else 0 # Convert to seconds
        
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

        # Response Time Trend
        trend_pipeline = [
            {"$match": {"timestamp": {"$gte": seven_days_ago}, "response_time_ms": {"$ne": None}}},
            {"$project": {
                "date": {"$dateToString": {"format": "%Y-%m-%d", "date": "$timestamp"}},
                "response_time_sec": {"$divide": ["$response_time_ms", 1000]}
            }},
            {"$group": {
                "_id": "$date",
                "avg_time": {"$avg": "$response_time_sec"}
            }},
            {"$sort": {"_id": 1}}
        ]
        trend_cursor = db.telemetry.aggregate(trend_pipeline)
        trend_docs = await trend_cursor.to_list(length=10)
        response_time_trend = [{"time": doc["_id"][-5:], "timeValue": round(doc["avg_time"], 2)} for doc in trend_docs]

        return {
            "avg_response_time_ms": round(avg_response_time, 2),
            "daily_activity": daily_activity,
            "active_users_today": active_users_today,
            "daily_active_users": daily_active_users,
            "monthly_active_users": monthly_active_users,
            "total_api_requests": total_api_requests,
            "query_success_rate": round(query_success_rate, 2),
            "error_rate": round(error_rate, 2),
            "system_availability": round(system_availability, 3),
            "response_time_trend": response_time_trend
        }
    except Exception as e:
        logger.error(f"Error fetching operational metrics: {e}")
        raise HTTPException(status_code=500, detail="Error fetching data")

@router.get("/satisfaction")
async def get_satisfaction_metrics():
    try:
        db = get_required_db()
        
        async def get_stats_for_group(match_query):
            explicit_pos = await db.telemetry.count_documents({**match_query, "explicit_feedback": "Positive"})
            explicit_neg = await db.telemetry.count_documents({**match_query, "explicit_feedback": "Negative"})
            implicit_pos = await db.telemetry.count_documents({**match_query, "sentiment_score": {"$gte": -0.2}})
            implicit_neg = await db.telemetry.count_documents({**match_query, "sentiment_score": {"$lt": -0.2}})
            
            total_signals = explicit_pos + explicit_neg + implicit_pos + implicit_neg
            total_positive = explicit_pos + implicit_pos
            csat = (total_positive / total_signals) * 100.0 if total_signals > 0 else 100.0
            
            return {
                "satisfied": total_positive,
                "dissatisfied": explicit_neg + implicit_neg,
                "csat": round(csat, 1)
            }
        
        overall = await get_stats_for_group({})
        guests = await get_stats_for_group({"is_guest": True})
        registered = await get_stats_for_group({"is_guest": False})
            
        # Sentiment Category Distribution
        sentiment_pipeline = [
            {"$match": {"sentiment_category": {"$ne": None}}},
            {"$group": {"_id": "$sentiment_category", "count": {"$sum": 1}}}
        ]
        sentiment_cursor = db.telemetry.aggregate(sentiment_pipeline)
        sentiment_docs = await sentiment_cursor.to_list(length=None)
        
        distribution = {"Positive": 0, "Negative": 0, "Neutral": 0}
        for doc in sentiment_docs:
            if doc["_id"] in distribution:
                distribution[doc["_id"]] = doc["count"]
                
        return {
            "overall_csat": overall["csat"],
            "breakdown": [
                { "user_type": "Guest Users", "satisfied": guests["satisfied"], "dissatisfied": guests["dissatisfied"], "csat": guests["csat"] },
                { "user_type": "Registered Users", "satisfied": registered["satisfied"], "dissatisfied": registered["dissatisfied"], "csat": registered["csat"] }
            ],
            "sentiment_distribution": [
                {"name": "Positive", "value": distribution["Positive"]},
                {"name": "Neutral", "value": distribution["Neutral"]},
                {"name": "Negative", "value": distribution["Negative"]}
            ]
        }
    except Exception as e:
        logger.error(f"Error fetching satisfaction metrics: {e}")
        raise HTTPException(status_code=500, detail="Error fetching data")
