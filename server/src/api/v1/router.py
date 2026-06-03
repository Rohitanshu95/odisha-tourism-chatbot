from fastapi import APIRouter
from src.api.v1.auth.routes import router as auth_router
from src.api.v1.chat.routes import router as chat_router
from src.api.v1.location.routes import router as location_router
from src.api.v1.admin.routes import router as admin_router
from src.api.v1.dashboard.routes import router as dashboard_router

api_router = APIRouter()

api_router.include_router(auth_router, prefix="/auth", tags=["Auth"])
api_router.include_router(chat_router, prefix="/chat", tags=["Chat"])
api_router.include_router(location_router, prefix="/location", tags=["Location"])
api_router.include_router(admin_router, prefix="/admin", tags=["Admin"])
api_router.include_router(dashboard_router, prefix="/dashboard", tags=["Dashboard"])
