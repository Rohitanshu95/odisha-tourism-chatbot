import os
import requests
from langchain.tools import tool

# Helper function for geocoding (Fallback)
def get_coordinates(location: str):
    """Get latitude and longitude for a location using OpenStreetMap Nominatim API."""
    if "," in location:
        parts = location.split(",")
        if len(parts) == 2:
            try:
                return float(parts[0].strip()), float(parts[1].strip())
            except ValueError:
                pass

    url = f"https://nominatim.openstreetmap.org/search"
    headers = {'User-Agent': 'OdishaTourismChatbot/1.0'}
    params = {'q': f"{location}, Odisha, India", 'format': 'json', 'limit': 1}
    
    try:
        response = requests.get(url, headers=headers, params=params)
        data = response.json()
        if data and len(data) > 0:
            return float(data[0]['lat']), float(data[0]['lon'])
    except Exception as e:
        print(f"Geocoding error for {location}: {e}")
    return None, None

@tool
def get_current_weather(location: str) -> str:
    """Gets the REAL current weather for a specific location in Odisha."""
    # Try OpenWeatherMap first if key exists
    api_key = os.getenv("OPENWEATHER_API_KEY")
    if api_key:
        try:
            url = f"https://api.openweathermap.org/data/2.5/weather?q={location},IN&appid={api_key}&units=metric"
            response = requests.get(url)
            data = response.json()
            if response.status_code == 200:
                temp = data["main"]["temp"]
                desc = data["weather"][0]["description"]
                return f"According to OpenWeatherMap, the current weather in {location} is {temp}°C with {desc}."
        except Exception as e:
            print(f"OpenWeatherMap API error: {e}")
            
    # Fallback to Open-Meteo
    lat, lon = get_coordinates(location)
    if not lat or not lon:
        return f"Sorry, I couldn't find the location coordinates for {location} to check the weather."
        
    try:
        url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current_weather=true"
        response = requests.get(url)
        data = response.json()
        
        if 'current_weather' in data:
            temp = data['current_weather']['temperature']
            windspeed = data['current_weather']['windspeed']
            return f"The current real-time weather in {location} is {temp}°C with a wind speed of {windspeed} km/h."
    except Exception as e:
        print(f"Weather API error: {e}")
        
    return f"Sorry, I couldn't fetch the real-time weather for {location} at the moment."

@tool
def get_distance_and_route(origin: str, destination: str) -> str:
    """Gets the REAL driving distance and estimated travel time between two locations."""
    # Try Google Maps API first if key exists
    api_key = os.getenv("GOOGLE_MAPS_API_KEY")
    if api_key:
        try:
            url = f"https://maps.googleapis.com/maps/api/distancematrix/json?origins={origin}&destinations={destination}&key={api_key}"
            response = requests.get(url)
            data = response.json()
            if data.get("status") == "OK" and data["rows"][0]["elements"][0]["status"] == "OK":
                dist = data["rows"][0]["elements"][0]["distance"]["text"]
                dur = data["rows"][0]["elements"][0]["duration"]["text"]
                return f"According to Google Maps, the driving distance from {origin} to {destination} is {dist}, and it will take approximately {dur}."
        except Exception as e:
            print(f"Google Maps API error: {e}")

    # Fallback to OSRM
    lat1, lon1 = get_coordinates(origin)
    lat2, lon2 = get_coordinates(destination)
    
    if not lat1 or not lat2:
        return f"Sorry, I couldn't precisely locate either '{origin}' or '{destination}' to calculate the distance."
        
    try:
        url = f"http://router.project-osrm.org/route/v1/driving/{lon1},{lat1};{lon2},{lat2}?overview=false"
        response = requests.get(url)
        data = response.json()
        
        if data.get("code") == "Ok" and len(data["routes"]) > 0:
            distance_km = data["routes"][0]["distance"] / 1000
            duration_hrs = data["routes"][0]["duration"] / 3600
            return f"The actual driving distance from {origin} to {destination} is {distance_km:.1f} km. It will take approximately {duration_hrs:.1f} hours by road."
    except Exception as e:
        print(f"OSRM API error: {e}")
        
    return f"Sorry, I couldn't calculate the exact route between {origin} and {destination} right now."

@tool
def estimate_trip_budget(destination: str, days: int, travelers: int) -> str:
    """Estimates the minimum and recommended budget for a trip to a destination in Odisha."""
    # We still use a heuristic here, but we can make it more realistic
    base_cost_per_day = 1500  # Budget stay + food
    
    if "puri" in destination.lower():
        base_cost_per_day += 500 # Slightly more expensive
    elif "bhubaneswar" in destination.lower():
        base_cost_per_day += 800 # Capital city premium
        
    total_budget = base_cost_per_day * days * travelers
    total_premium = (base_cost_per_day + 2000) * days * travelers
    
    return f"For a {days}-day trip to {destination} for {travelers} person(s), a budget-friendly estimate is around ₹{total_budget} INR, while a more comfortable/premium trip would be around ₹{total_premium} INR."
