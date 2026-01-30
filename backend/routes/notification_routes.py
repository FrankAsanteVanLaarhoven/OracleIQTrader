# OracleIQTrader - Push Notification Routes
# Mobile and web push notification management

from fastapi import APIRouter

from modules.push_notifications import (
    push_notification_service, 
    NotificationPreferences, 
    DeviceRegistration
)

notification_router = APIRouter(prefix="/notifications", tags=["notifications"])


def init_notification_db(db):
    """Initialize the notification service with database"""
    push_notification_service.set_db(db)


@notification_router.post("/register")
async def register_device(data: dict):
    """Register device for push notifications"""
    try:
        registration = DeviceRegistration(
            token=data.get("token"),
            platform=data.get("platform"),
            device=data.get("device"),
            user_id=data.get("user_id")
        )
        success = await push_notification_service.register_device(registration)
        return {"success": success}
    except Exception as e:
        return {"success": False, "error": str(e)}


@notification_router.delete("/unregister")
async def unregister_device(token: str):
    """Unregister device from push notifications"""
    success = await push_notification_service.unregister_device(token)
    return {"success": success}


@notification_router.get("/preferences")
async def get_notification_preferences(user_id: str):
    """Get notification preferences for user"""
    prefs = push_notification_service.get_preferences(user_id)
    return prefs.model_dump()


@notification_router.post("/preferences")
async def update_notification_preferences(data: dict):
    """Update notification preferences"""
    user_id = data.pop("user_id", "demo_user")
    prefs = NotificationPreferences(**data)
    await push_notification_service.update_preferences(user_id, prefs)
    return {"success": True}


@notification_router.post("/send")
async def send_notification(data: dict):
    """Send push notification to user (admin only)"""
    user_id = data.get("user_id")
    title = data.get("title")
    body = data.get("body")
    notification_data = data.get("data", {})
    
    results = await push_notification_service.send_to_user(user_id, title, body, notification_data)
    return {"success": True, "sent": len(results)}


@notification_router.get("/stats")
async def get_notification_stats():
    """Get push notification statistics"""
    return push_notification_service.get_stats()
