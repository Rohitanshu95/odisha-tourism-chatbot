from langgraph.prebuilt import create_react_agent
from src.llm.client import get_llm
from langchain.tools import tool

from src.tools import get_current_weather, get_distance_and_route, estimate_trip_budget
from src.rag_pipeline import get_retriever
from src.prompts.odisha_prompts import ODISHA_TOURISM_SYSTEM_PROMPT

@tool
def odisha_tourism_knowledge(query: str) -> str:
    """Search for information about Odisha heritage, culture, food, and dress codes."""
    retriever = get_retriever()
    docs = retriever.invoke(query)
    
    result = []
    for doc in docs:
        source_url = doc.metadata.get("url", "https://odishatourism.gov.in/")
        result.append(f"Content: {doc.page_content}\nSource URL: {source_url}")
        
    return "\n\n".join(result)

def create_odisha_agent():
    # 1. Setup tools
    weather_tool = get_current_weather
    distance_tool = get_distance_and_route
    budget_tool = estimate_trip_budget
    rag_tool = odisha_tourism_knowledge
    
    tools = [weather_tool, distance_tool, budget_tool, rag_tool]
    
    # 2. Setup LLM via central client
    llm = get_llm(model_name="gemini-2.5-flash", temperature=0)
    
    # 3. Create Agent using LangGraph
    agent_executor = create_react_agent(llm, tools, prompt=ODISHA_TOURISM_SYSTEM_PROMPT)
    
    return agent_executor
