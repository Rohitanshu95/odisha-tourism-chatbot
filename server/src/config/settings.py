import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    """
    Centralized configuration for the Pathik AI Backend using Pydantic BaseSettings.
    Loads from environment variables or a .env file.
    """
    # LLM Provider Keys
    GOOGLE_API_KEY: str

    # Environment
    ENVIRONMENT: str = "development"

    # Database
    MONGODB_URI: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "pathik_ai"

    # Optionally map GEMINI_API_KEY as an alias if needed, but GOOGLE_API_KEY is preferred by Langchain
    
    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

def get_settings() -> Settings:
    return Settings()
