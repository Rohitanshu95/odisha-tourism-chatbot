from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import requests
from datetime import datetime
from src.config.db import get_db
from src.services.chat_state import session_metadata

router = APIRouter()

class LocationRequest(BaseModel):
    session_id: str
    latitude: float
    longitude: float

@router.post("/")
async def save_location(request: LocationRequest):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")

    lat = request.latitude
    lon = request.longitude
    
    # Reverse geocoding using Nominatim
    url = f"https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lon}"
    headers = {"User-Agent": "OdishaTourismChatbot/1.0"}
    
    location_detail = f"{lat},{lon}"
    
    try:
        response = requests.get(url, headers=headers, timeout=5)
        if response.status_code == 200:
            data = response.json()
            address = data.get("address", {})
            country = address.get("country", "")
            if country.lower() == "india":
                state = address.get("state", address.get("state_district", country))
                location_detail = state
            elif country:
                location_detail = country
    except Exception as e:
        print(f"Geocoding error: {e}")

    # Store in chat session metadata
    meta = session_metadata.get(request.session_id, {})
    meta["location_detail"] = location_detail
    session_metadata[request.session_id] = meta

    # Store in database
    location_doc = {
        "session_id": request.session_id,
        "latitude": lat,
        "longitude": lon,
        "location_detail": location_detail,
        "created_at": datetime.utcnow()
    }
    
    await db["session_locations"].insert_one(location_doc)
    
    # Also update chat session meta if exists in DB
    await db["chat_sessions"].update_one(
        {"session_id": request.session_id},
        {"$set": {"meta.location_detail": location_detail}},
        upsert=False
    )
    
    return {"status": "success", "location": location_detail}
