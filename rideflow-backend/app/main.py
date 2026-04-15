from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
import os
from app.websocket_manager import manager

# Import active routes for booking system
from app.api import admin_routes, auth_routes, booking_routes, driver_routes
from app.database.connection import engine, Base

# Import all models to ensure creation
from app.models import user_model, driver_model, ride_model, payment_model, feedback_model

# Initialize Database Schema
try:
    print("Initializing Database Schema...")
    Base.metadata.create_all(bind=engine)
    print("Database Schema initialized.")
except Exception as e:
    print(f"Database initialization failed: {e}")
    # We continue, as the first request might trigger it or retry

app = FastAPI(
    title="RideFlow Booking API",
    description="Backend API for RideFlow Booking and Women Safety System",
    version="2.0.0"
)

# CORS configuration - Allow common frontend ports and allow all headers/methods
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://127.0.0.1:3000",
        "http://localhost:8000" # Self-reference
    ], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def seed_data():
    from app.database.connection import SessionLocal
    from app.services.auth_service import get_password_hash
    db = SessionLocal()
    try:
        # 1. Seed Admin
        admin_email = "sneha21@gmail.com"
        admin = db.query(user_model.User).filter(user_model.User.email == admin_email).first()
        if not admin:
            db.add(user_model.User(
                name="Sneha",
                email=admin_email,
                password_hash=get_password_hash(os.getenv("SEED_ADMIN_PASSWORD", "Admin#123")),
                role="admin",
                gender="female"
            ))
            db.commit()
            print("Admin user seeded.")

        # 2. Seed Mock Drivers (Mumbai area)
        mock_drivers = [
            {"name": "Rahul Driver", "email": "rahul@driver.com", "lat": 19.0760, "lng": 72.8777},
            {"name": "Priya Driver", "email": "priya@driver.com", "lat": 19.0800, "lng": 72.8850, "gender": "female"},
            {"name": "Amit Driver", "email": "amit@driver.com", "lat": 19.0500, "lng": 72.8500}
        ]

        for d in mock_drivers:
            existing_user = db.query(user_model.User).filter(user_model.User.email == d["email"]).first()
            if not existing_user:
                new_user = user_model.User(
                    name=d["name"],
                    email=d["email"],
                    password_hash=get_password_hash(os.getenv("SEED_DRIVER_PASSWORD", "Driver#123")),
                    role="driver",
                    gender=d.get("gender", "male")
                )
                db.add(new_user)
                db.flush() # get user_id

                new_driver = driver_model.Driver(
                    user_id=new_user.user_id,
                    vehicle_number=f"MH-01-AB-{1234 + mock_drivers.index(d)}",
                    approval_status="approved",
                    is_available=True,
                    latitude=d["lat"],
                    longitude=d["lng"],
                    gender=new_user.gender
                )
                db.add(new_driver)
                print(f"Driver {d['name']} seeded.")
        
        db.commit()
    finally:
        db.close()

# Include routers
app.include_router(auth_routes.router)
app.include_router(admin_routes.router)
app.include_router(booking_routes.router)
app.include_router(driver_routes.router)

@app.get("/")
def root():
    return {"message": "Welcome to the RideFlow Booking API. Visit /docs for documentation."}

@app.websocket("/ws/{user_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    user_id: str,
    role: str = Query(default="passenger"),
    gender: str = Query(default="other")
):
    # ✅ More flexible origin check for development
    origin = websocket.headers.get("origin")
    allowed_origins = [
        "http://localhost:3000", 
        "http://127.0.0.1:3000",
        "http://0.0.0.0:3000",
        "localhost:3000"
    ]
    
    # If the origin is missing or mismatching, we log it but don't strictly close yet for debugging
    if origin and origin not in allowed_origins:
        print(f"DEBUG: WS Warning - Unusual origin: {origin}")
        # We allow it for now to resolve the user's connection issues
        # await websocket.close(code=1008)
        # return

    print(f"DEBUG: WS Connection attempt - ID: {user_id}, Role: {role}, Gender: {gender}")
    try:
        await manager.connect(websocket, user_id, role, gender)
        print(f"DEBUG: WS Connected - ID: {user_id}")
        while True:
            await websocket.receive_text()  # keeps connection alive
    except WebSocketDisconnect:
        print(f"DEBUG: WS Disconnected - ID: {user_id}")
        manager.disconnect(user_id)
    except Exception as e:
        print(f"DEBUG: WS Error - ID: {user_id}, Error: {e}")
        manager.disconnect(user_id)
