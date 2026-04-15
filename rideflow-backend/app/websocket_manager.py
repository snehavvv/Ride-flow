from fastapi import WebSocket
from typing import Dict
import json

class ConnectionManager:
    def __init__(self):
        # user_id (str UUID) -> WebSocket
        self.active_connections: Dict[str, WebSocket] = {}
        # Store metadata for filtering (role, gender, etc.)
        self.user_meta: Dict[str, dict] = {}

    async def connect(self, websocket: WebSocket, user_id: str, role: str, gender: str):
        await websocket.accept()
        self.active_connections[user_id] = websocket
        self.user_meta[user_id] = {"role": role, "gender": gender}
        print(f"✅ Connected: {user_id} | role={role} | gender={gender}")

    def disconnect(self, user_id: str):
        self.active_connections.pop(user_id, None)
        self.user_meta.pop(user_id, None)
        print(f"❌ Disconnected: {user_id}")

    async def broadcast_to_role(self, message: dict, role: str):
        """Standard broadcast helper matching existing backend needs"""
        for uid, meta in self.user_meta.items():
            if meta.get("role") == role:
                if uid in self.active_connections:
                    try:
                        await self.active_connections[uid].send_json(message)
                    except Exception as e:
                        print(f"Send failed for {uid}: {e}")
                        # Auto-cleanup on failure
                        self.disconnect(uid)

    async def send_personal_message(self, message: dict, user_id: str):
        if user_id in self.active_connections:
            await self.active_connections[user_id].send_json(message)

manager = ConnectionManager()
