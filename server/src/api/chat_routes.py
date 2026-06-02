from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from langchain_core.messages import HumanMessage, AIMessage, messages_from_dict, messages_to_dict
from datetime import datetime
from src.agents.odisha_agent import create_odisha_agent

router = APIRouter()

from pydantic import BaseModel, field_validator

class ChatRequest(BaseModel):
    session_id: str
    message: str
    user_location: Optional[str] = None
    
    @field_validator("message")
    @classmethod
    def sanitize_message(cls, v: str) -> str:
        import bleach
        return bleach.clean(v, strip=True)

class ChatResponse(BaseModel):
    response: str
    requires_login: bool = False

# Simple in-memory storage for chat history & metadata
chat_histories = {}
session_metadata = {}

from src.models.user import UserCaptureModel, TelemetryLog, ChatSummaryModel
from src.config.db import get_db
import uuid

# Initialize agent globally
try:
    agent_executor = create_odisha_agent()
except Exception as e:
    print(f"Warning: Failed to initialize agent. Error: {e}")
    agent_executor = None

@router.post("/auth/login")
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
        await db["users"].insert_one(user_dict)
        
    # Check for recent session within 24 hours
    twenty_four_hours_ago = datetime.utcnow().timestamp() - 86400
    # MongoDB stores updated_at as ISODate or datetime object. 
    # We will search by user_id in meta and updated_at
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

@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    if not agent_executor:
        raise HTTPException(status_code=500, detail="Agent not initialized (missing API key?)")

    db = get_db()

    if request.session_id not in chat_histories:
        history_loaded = False
        if db is not None:
            session_doc = await db["chat_sessions"].find_one({"session_id": request.session_id})
            if session_doc:
                chat_histories[request.session_id] = messages_from_dict(session_doc.get("messages", []))
                session_metadata[request.session_id] = session_doc.get("meta", {"is_guest": True, "question_count": 0})
                history_loaded = True
                
        if not history_loaded:
            chat_histories[request.session_id] = []
            session_metadata[request.session_id] = {"is_guest": True, "question_count": 0}
            
    history = chat_histories[request.session_id]
    meta = session_metadata[request.session_id]
    
    requires_login = False
    if meta["is_guest"] and meta["question_count"] >= 5:
        requires_login = True
        return ChatResponse(
            response="You have reached the guest limit of 5 queries. Please log in to continue your journey.",
            requires_login=True
        )
    
    meta["question_count"] += 1

    try:
        # Contextualize the message if user location is available
        enriched_message = request.message
        if request.user_location:
            enriched_message += f"\n\n[SYSTEM NOTE: The user is currently located at coordinates {request.user_location}. You can use these exact coordinates as their origin location for weather or distance calculations if they do not specify one.]"

        # For langgraph react agent, state is just a list of messages
        messages = history + [HumanMessage(content=enriched_message)]
        
        result = await agent_executor.ainvoke({"messages": messages})
        
        # The last message in the returned state is the AI's response
        output_content = result["messages"][-1].content
        if isinstance(output_content, list):
            output_message = " ".join([
                item.get("text", "") for item in output_content 
                if isinstance(item, dict) and item.get("type") == "text"
            ])
        else:
            output_message = str(output_content)
        
        history.append(HumanMessage(content=request.message))
        history.append(AIMessage(content=output_message))
        
        if len(history) > 20:
            chat_histories[request.session_id] = history[-20:]
            history = chat_histories[request.session_id]
            
        if db is not None:
            await db["chat_sessions"].update_one(
                {"session_id": request.session_id},
                {
                    "$set": {
                        "messages": messages_to_dict(history),
                        "meta": meta,
                        "updated_at": datetime.utcnow()
                    }
                },
                upsert=True
            )
            
        # Log Telemetry asynchronously
        db = get_db()
        if db is not None:
            log_entry = TelemetryLog(
                session_id=request.session_id,
                query=request.message,
                is_guest=meta["is_guest"],
                is_fallback=False
            )
            await db["telemetry"].insert_one(log_entry.model_dump())
            
        return ChatResponse(response=output_message, requires_login=requires_login)
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Agent error: {e}")
        
        # Log the failure in telemetry
        db = get_db()
        if db is not None:
            fallback_log = TelemetryLog(
                session_id=request.session_id,
                query=request.message,
                is_guest=meta.get("is_guest", True),
                is_fallback=True
            )
            await db["telemetry"].insert_one(fallback_log.model_dump())
            
        return ChatResponse(response="I'm having trouble retrieving that specific information right now. Please [click here for more info](https://odishatourism.gov.in) on the official portal.")

class EndSessionRequest(BaseModel):
    session_id: str

@router.post("/chat/end")
async def end_session(request: EndSessionRequest):
    session_id = request.session_id
    meta = session_metadata.get(session_id, {})
    history = chat_histories.get(session_id, [])
    
    # Database saving of chat has been intentionally removed per Phase 2 requirements (Zero persistence).
                
    # Clean up ephemeral memory
    if session_id in chat_histories:
        del chat_histories[session_id]
    if session_id in session_metadata:
        del session_metadata[session_id]
        
    return {"status": "success", "message": "Session ended and memory cleared"}
