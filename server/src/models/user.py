from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional
from datetime import datetime

class UserCaptureModel(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    mobile: str = Field(..., min_length=10, max_length=15)
    
    @field_validator("name")
    @classmethod
    def sanitize_name(cls, v: str) -> str:
        import bleach
        from better_profanity import profanity
        v = bleach.clean(v, strip=True)
        if profanity.contains_profanity(v):
            return "Sreeman/Srimati"
        return v
        
class UserInDB(UserCaptureModel):
    id: str = Field(alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
class TelemetryLog(BaseModel):
    session_id: str
    query: str
    intent: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    is_guest: bool = True
    is_fallback: bool = False
    
class ChatSummaryModel(BaseModel):
    user_id: str
    session_id: str
    summary: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
