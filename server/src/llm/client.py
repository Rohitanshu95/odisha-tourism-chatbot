import os
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_openai import ChatOpenAI
from langchain_core.runnables import Runnable
from src.config.settings import get_settings

# Ensure that the environment variable is explicitly set so langchain doesn't fail
settings = get_settings()
os.environ["GOOGLE_API_KEY"] = settings.GOOGLE_API_KEY
if settings.OPENAI_API_KEY:
    os.environ["OPENAI_API_KEY"] = settings.OPENAI_API_KEY

def get_llm(model_name: str = "gemini-2.5-flash", temperature: float = 0.0) -> Runnable:
    """
    Returns a configured Google Gemini Chat Model instance with an OpenAI fallback.
    This centralized wrapper allows us to inject resilient retry logic and
    manage parameters securely through Pydantic settings.
    """
    
    # Initialize the LLM with robust configurations (e.g. max retries for rate limits)
    gemini_llm = ChatGoogleGenerativeAI(
        model=model_name,
        temperature=temperature,
        max_retries=3, # Essential for Gemini's rate limits
        timeout=30.0   # SLA timeout budget
    )
    
    # Initialize the fallback OpenAI LLM (e.g., using a fast/cheap model)
    openai_llm = ChatOpenAI(
        model="gpt-4o-mini",
        temperature=temperature,
        max_retries=3,
        timeout=30.0
    )
    
    # Configure the fallback: OpenAI as primary, Gemini as fallback
    llm_with_fallback = openai_llm.with_fallbacks([gemini_llm])
    
    return llm_with_fallback
