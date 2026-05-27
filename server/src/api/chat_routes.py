from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from langchain_core.messages import HumanMessage, AIMessage

from src.agents.odisha_agent import create_odisha_agent

router = APIRouter()

class ChatRequest(BaseModel):
    session_id: str
    message: str

class ChatResponse(BaseModel):
    response: str

# Simple in-memory storage for chat history
chat_histories = {}

# Initialize agent globally
try:
    agent_executor = create_odisha_agent()
except Exception as e:
    print(f"Warning: Failed to initialize agent. Error: {e}")
    agent_executor = None

@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    if not agent_executor:
        raise HTTPException(status_code=500, detail="Agent not initialized (missing API key?)")

    if request.session_id not in chat_histories:
        chat_histories[request.session_id] = []
        
    history = chat_histories[request.session_id]

    try:
        # For langgraph react agent, state is just a list of messages
        messages = history + [HumanMessage(content=request.message)]
        
        result = agent_executor.invoke({"messages": messages})
        
        # The last message in the returned state is the AI's response
        output_message = result["messages"][-1].content
        
        history.append(HumanMessage(content=request.message))
        history.append(AIMessage(content=output_message))
        
        if len(history) > 20:
            chat_histories[request.session_id] = history[-20:]
            
        return ChatResponse(response=output_message)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
