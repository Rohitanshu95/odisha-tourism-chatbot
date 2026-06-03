from fastapi import APIRouter, HTTPException
from datetime import datetime
import uuid
from src.models.user import UserCaptureModel
from src.config.db import get_db
from langchain_core.messages import messages_from_dict
from src.services.chat_state import chat_histories, session_metadata

router = APIRouter()

@router.post("/login")
async def login_user(user: UserCaptureModel, session_id: str):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    # Check if user exists
    clean_email = user.email.strip()
    clean_mobile = user.mobile.strip().lstrip('0')
    existing_user = await db["users"].find_one({"email": clean_email, "mobile": clean_mobile})
    
    if existing_user:
        user_id = existing_user["_id"]
    else:
        user_dict = user.model_dump()
        user_id = str(uuid.uuid4())
        user_dict["_id"] = user_id
        user_dict["email"] = clean_email
        user_dict["mobile"] = clean_mobile
        user_dict["created_at"] = datetime.utcnow()
        await db["users"].insert_one(user_dict)
        
    # Check for recent session within 24 hours
    twenty_four_hours_ago = datetime.utcnow().timestamp() - 86400
    from datetime import timedelta
    time_limit = datetime.utcnow() - timedelta(hours=24)
    
    recent_session = await db["chat_sessions"].find_one({
        "meta.user_id": user_id,
        "updated_at": {"$gte": time_limit}
    }, sort=[("updated_at", -1)])
    
    frontend_history = []
    returned_session_id = session_id
    
    if recent_session:
        returned_session_id = recent_session.get("session_id", session_id)
        # Parse langchain messages to frontend format
        langchain_msgs = recent_session.get("messages", [])
        for idx, msg in enumerate(langchain_msgs):
            sender = 'user' if msg.get("type") == "human" else 'bot'
            content = msg.get("data", {}).get("content", "")
            frontend_history.append({
                "id": int(datetime.utcnow().timestamp() * 1000) + idx,
                "text": content,
                "sender": sender
            })
            
        # Ensure it's in memory for immediate chat continuity
        chat_histories[returned_session_id] = messages_from_dict(langchain_msgs)
        session_metadata[returned_session_id] = recent_session.get("meta", {})
    else:
        # Update session metadata for new session
        chat_histories[returned_session_id] = []
        if returned_session_id not in session_metadata:
            session_metadata[returned_session_id] = {"is_guest": False, "question_count": 0, "user_id": user_id}
        else:
            session_metadata[returned_session_id]["is_guest"] = False
            session_metadata[returned_session_id]["user_id"] = user_id

    return {
        "status": "success", 
        "message": "User authenticated", 
        "user_id": user_id,
        "session_id": returned_session_id,
        "history": frontend_history
    }
