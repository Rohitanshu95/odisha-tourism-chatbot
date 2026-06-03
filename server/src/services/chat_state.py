from src.agents.odisha_agent import create_odisha_agent

# Simple in-memory storage for chat history & metadata
chat_histories = {}
session_metadata = {}

# Initialize agent globally
try:
    agent_executor = create_odisha_agent()
except Exception as e:
    print(f"Warning: Failed to initialize agent. Error: {e}")
    agent_executor = None
