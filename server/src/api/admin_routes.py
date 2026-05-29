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
