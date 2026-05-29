import os
from langchain_google_genai import ChatGoogleGenerativeAI
from src.config.settings import get_settings

# Ensure that the environment variable is explicitly set so langchain doesn't fail
settings = get_settings()
os.environ["GOOGLE_API_KEY"] = settings.GOOGLE_API_KEY

def get_llm(model_name: str = "gemini-2.5-flash", temperature: float = 0.0) -> ChatGoogleGenerativeAI:
    """
    Returns a configured Google Gemini Chat Model instance.
    This centralized wrapper allows us to inject resilient retry logic and
    manage parameters securely through Pydantic settings.
    """
    
    # Initialize the LLM with robust configurations (e.g. max retries for rate limits)
    llm = ChatGoogleGenerativeAI(
        model=model_name,
        temperature=temperature,
        max_retries=3, # Essential for Gemini's rate limits
        timeout=30.0   # SLA timeout budget
    )
    
    return llm
