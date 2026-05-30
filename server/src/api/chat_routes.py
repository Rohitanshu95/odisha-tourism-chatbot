from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from langchain_core.messages import HumanMessage, AIMessage

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
    
    # Save user to DB
    user_dict = user.model_dump()
    user_dict["_id"] = str(uuid.uuid4())
    await db["users"].insert_one(user_dict)
    
    # Update session metadata to authenticated
    if session_id not in session_metadata:
        session_metadata[session_id] = {"is_guest": False, "question_count": 0, "user_id": user_dict["_id"]}
    else:
        session_metadata[session_id]["is_guest"] = False
        session_metadata[session_id]["user_id"] = user_dict["_id"]
        
    return {"status": "success", "message": "User authenticated", "user_id": user_dict["_id"]}

@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    if not agent_executor:
        raise HTTPException(status_code=500, detail="Agent not initialized (missing API key?)")

    if request.session_id not in chat_histories:
        chat_histories[request.session_id] = []
        session_metadata[request.session_id] = {"is_guest": True, "question_count": 0}
        
    history = chat_histories[request.session_id]
    meta = session_metadata[request.session_id]
    
    requires_login = False
    if meta["is_guest"] and meta["question_count"] >= 5:
        requires_login = True
    
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
