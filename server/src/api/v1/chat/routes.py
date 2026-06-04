from fastapi import APIRouter, HTTPException
from typing import Optional
from pydantic import BaseModel, field_validator
from datetime import datetime
from langchain_core.messages import HumanMessage, AIMessage, messages_from_dict, messages_to_dict
from src.config.db import get_db
from src.models.user import TelemetryLog, ChatSummaryModel
from src.services.chat_state import chat_histories, session_metadata, agent_executor
import logging
import time
import re
from langdetect import detect, LangDetectException

logger = logging.getLogger(__name__)

router = APIRouter()

def extract_telemetry(query: str):
    query_lower = query.lower()
    
    destinations = ["puri", "bhubaneswar", "konark", "cuttack", "chilika", "gopalpur", "simlipal", "bhitarkanika", "daringbadi", "rourkela", "sambalpur", "balasore", "berhampur", "keonjhar", "mayurbhanj", "koraput"]
    categories = {
        "temples": ["temple", "mandir", "jagannath", "lingaraj", "mukteshwar", "rajrani"],
        "beaches": ["beach", "sea", "ocean", "puri beach", "chandrabhaga", "gopalpur"],
        "wildlife": ["wildlife", "tiger", "sanctuary", "national park", "simlipal", "bhitarkanika", "crocodile", "bird"],
        "heritage": ["heritage", "monument", "cave", "khandagiri", "udayagiri", "museum", "history"],
        "nature": ["waterfall", "hill", "lake", "chilika", "daringbadi", "nature", "scenic"]
    }
    
    found_dest = None
    for d in destinations:
        if d in query_lower:
            found_dest = d.capitalize()
            break
            
    found_cat = None
    for cat, keywords in categories.items():
        if any(k in query_lower for k in keywords):
            found_cat = cat.capitalize()
            break
            
    return found_dest, found_cat


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

@router.post("", response_model=ChatResponse)
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
    
    # Ensure keys exist for older sessions
    meta.setdefault("is_guest", True)
    meta.setdefault("question_count", 0)
    
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
        
        start_time = time.time()
        result = await agent_executor.ainvoke({"messages": messages})
        end_time = time.time()
        
        response_time_ms = int((end_time - start_time) * 1000)
        
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
            dest, cat = extract_telemetry(request.message)

            detected_language = "unknown"
            try:
                detected_language = detect(request.message)
            except LangDetectException:
                logger.warning(f"Could not detect language for session {request.session_id}")

            log_entry = TelemetryLog(
                session_id=request.session_id,
                query=request.message,
                is_guest=meta["is_guest"],
                is_fallback=False,
                destination=dest,
                tourism_category=cat,
                response_time_ms=response_time_ms,
                language=detected_language
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
            dest, cat = extract_telemetry(request.message)
            gap_cat = "Unknown"
            if cat:
                gap_cat = f"{cat} Knowledge"
            elif dest:
                gap_cat = f"{dest} Details"

            detected_language = "unknown"
            try:
                detected_language = detect(request.message)
            except LangDetectException:
                logger.warning(f"Could not detect language for session {request.session_id} on fallback")

            fallback_log = TelemetryLog(
                session_id=request.session_id,
                query=request.message,
                is_guest=meta.get("is_guest", True),
                is_fallback=True,
                is_error=True,
                destination=dest,
                tourism_category=cat,
                gap_category=gap_cat,
                response_time_ms=int((time.time() - start_time) * 1000) if "start_time" in locals() else None,
                language=detected_language
            )
            await db["telemetry"].insert_one(fallback_log.model_dump())

        return ChatResponse(
            response="Sorry, I ran into an issue while processing your request. Please try again.",
            requires_login=requires_login
        )

class EndSessionRequest(BaseModel):
    session_id: str

@router.post("/end")
async def end_session(request: EndSessionRequest):
    session_id = request.session_id
    meta = session_metadata.get(session_id, {})
    history = chat_histories.get(session_id, [])
    
    db = get_db()
    if history and db is not None:
        try:
            transcript_lines = []
            conversation_data = []
            for msg in history:
                role = "User" if msg.type == "human" else "Assistant"
                transcript_lines.append(f"{role}: {msg.content}")
                conversation_data.append({"role": role, "content": msg.content})
            
            transcript = "\n".join(transcript_lines)
            
            from src.llm.client import get_llm
            from langchain_core.messages import HumanMessage
            
            llm = get_llm(temperature=0.0)
            prompt = f"Summarize the following conversation in 1-2 concise sentences, focusing on the user's intent and the outcome.\n\n{transcript}"
            ai_msg = await llm.ainvoke([HumanMessage(content=prompt)])
            summary_text = ai_msg.content
            
            summary_doc = {
                "user_id": meta.get("user_id", "guest"),
                "session_id": session_id,
                "summary": summary_text,
                "conversation": conversation_data,
                "created_at": datetime.utcnow()
            }
            await db["chat_summaries"].insert_one(summary_doc)
        except Exception as e:
            logger.error(f"Failed to generate summary on chat end: {e}")
                
    # Clean up ephemeral memory
    if session_id in chat_histories:
        del chat_histories[session_id]
    if session_id in session_metadata:
        del session_metadata[session_id]
        
    return {"status": "success", "message": "Session ended and memory cleared"}
