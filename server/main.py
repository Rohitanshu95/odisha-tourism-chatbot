import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from contextlib import asynccontextmanager
from dotenv import load_dotenv

load_dotenv()

from src.api.chat_routes import router as chat_router
from src.api.admin_routes import router as admin_router
from src.config.db import connect_to_mongo, close_mongo_connection

@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_to_mongo()
    yield
    await close_mongo_connection()

app = FastAPI(title="Odisha Tourism Chatbot API", lifespan=lifespan)

# Allow frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router, prefix="/api/v1")
app.include_router(admin_router, prefix="/api/v1/admin")

@app.get("/")
def read_root():
    return {"status": "Odisha Tourism Chatbot API is running"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
