from fastapi import FastAPI, HTTPException, Depends, status, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc
import os
import httpx
import jwt
import uuid
from datetime import datetime, timedelta
from passlib.context import CryptContext
import uvicorn

# Local imports
from database import get_db, create_tables, User, Agent, PhoneNumber, Call
from auth_utils import AuthUtils, EmailService, GoogleAuth

# Environment variables
VAPI_API_KEY = os.getenv("VAPI_API_KEY", "")
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-change-this-in-production")
VAPI_BASE_URL = "https://api.vapi.ai"

app = FastAPI(title="EmployAI API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://cloud-rep-ten.vercel.app", "http://localhost:3000"],  # Add your frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Initialize services
email_service = EmailService()
google_auth = GoogleAuth()
auth_utils = AuthUtils()

# Create database tables on startup
@app.on_event("startup")
async def startup_event():
    create_tables()

# Pydantic models
class UserRegister(BaseModel):
    name: str
    email: EmailStr
    phone: str
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class AgentCreate(BaseModel):
    name: str
    industry: str
    role: str = "Assistant"
    description: Optional[str] = None
    systemPrompt: Optional[str] = None
    firstMessage: Optional[str] = None
    voice: str = "alloy"
    model: str = "gpt-4"
    language: str = "en-US"

class PhoneNumberCreate(BaseModel):
    name: str
    areaCode: Optional[str] = None
    provider: str = "vapi"

class User(BaseModel):
    id: str
    name: str
    email: str
    phone: str
    created_at: datetime

class Agent(BaseModel):
    id: str
    name: str
    industry: str
    role: str
    description: Optional[str]
    status: str
    created_at: datetime
    user_id: str

class PhoneNumber(BaseModel):
    id: str
    number: str
    name: str
    provider: str
    status: str
    created_at: datetime
    user_id: str

# Helper functions
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=24)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm="HS256")
    return encoded_jwt

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=["HS256"])
        user_email: str = payload.get("sub")
        if user_email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_email
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

def get_current_user(user_email: str = Depends(verify_token)):
    user = fake_users_db.get(user_email)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user

async def call_vapi_api(endpoint: str, method: str = "GET", data: dict = None):
    """Helper function to make calls to VAPI API"""
    if not VAPI_API_KEY:
        raise HTTPException(status_code=500, detail="VAPI API key not configured")
    
    headers = {
        "Authorization": f"Bearer {VAPI_API_KEY}",
        "Content-Type": "application/json"
    }
    
    async with httpx.AsyncClient() as client:
        url = f"{VAPI_BASE_URL}{endpoint}"
        
        if method == "GET":
            response = await client.get(url, headers=headers)
        elif method == "POST":
            response = await client.post(url, headers=headers, json=data)
        elif method == "PUT":
            response = await client.put(url, headers=headers, json=data)
        elif method == "DELETE":
            response = await client.delete(url, headers=headers)
        else:
            raise HTTPException(status_code=400, detail="Invalid HTTP method")
        
        if response.status_code >= 400:
            raise HTTPException(status_code=response.status_code, detail=response.text)
        
        return response.json()

# Auth routes
@app.post("/auth/register")
async def register(user_data: UserRegister):
    # Check if user already exists
    if user_data.email in fake_users_db:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password
    hashed_password = pwd_context.hash(user_data.password)
    
    # Create user
    user_id = f"user_{len(fake_users_db) + 1}"
    user = {
        "id": user_id,
        "name": user_data.name,
        "email": user_data.email,
        "phone": user_data.phone,
        "password": hashed_password,
        "created_at": datetime.utcnow()
    }
    
    fake_users_db[user_data.email] = user
    
    # Create access token
    access_token = create_access_token(data={"sub": user_data.email})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "phone": user["phone"]
        }
    }

@app.post("/auth/login")
async def login(login_data: UserLogin):
    user = fake_users_db.get(login_data.email)
    if not user or not pwd_context.verify(login_data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    access_token = create_access_token(data={"sub": login_data.email})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "phone": user["phone"]
        }
    }

# Agent routes
@app.get("/agents")
async def get_agents(current_user: dict = Depends(get_current_user)):
    """Get all agents for the current user"""
    try:
        # In production, filter by user_id
        vapi_agents = await call_vapi_api("/assistant")
        return vapi_agents
    except Exception as e:
        # Return mock data if VAPI API is not available
        return [
            {
                "id": f"agent_{i}",
                "name": f"Agent {i}",
                "industry": "General",
                "role": "Assistant",
                "status": "active" if i % 2 == 0 else "creating",
                "created_at": datetime.utcnow().isoformat()
            }
            for i in range(1, 5)
        ]

@app.post("/agents")
async def create_agent(agent_data: AgentCreate, current_user: dict = Depends(get_current_user)):
    """Create a new agent using VAPI API"""
    try:
        vapi_payload = {
            "name": agent_data.name,
            "model": {
                "provider": "openai",
                "model": agent_data.model,
                "messages": [
                    {
                        "role": "system",
                        "content": agent_data.systemPrompt or f"You are {agent_data.name}, a helpful AI assistant."
                    }
                ]
            },
            "voice": {
                "provider": "openai",
                "voiceId": agent_data.voice
            },
            "firstMessage": agent_data.firstMessage or "Hello! How can I help you today?",
            "serverUrl": "https://your-server-url.com/webhook"  # Replace with your webhook URL
        }
        
        created_agent = await call_vapi_api("/assistant", method="POST", data=vapi_payload)
        return created_agent
    except Exception as e:
        # Return mock data if VAPI API is not available
        agent_id = f"agent_{len(fake_agents_db) + 1}"
        mock_agent = {
            "id": agent_id,
            "name": agent_data.name,
            "industry": agent_data.industry,
            "role": agent_data.role,
            "description": agent_data.description,
            "status": "creating",
            "created_at": datetime.utcnow().isoformat(),
            "user_id": current_user["id"]
        }
        fake_agents_db[agent_id] = mock_agent
        return mock_agent

@app.get("/agents/{agent_id}")
async def get_agent(agent_id: str, current_user: dict = Depends(get_current_user)):
    """Get a specific agent"""
    try:
        agent = await call_vapi_api(f"/assistant/{agent_id}")
        return agent
    except Exception as e:
        # Return mock data if not found or VAPI API is not available
        if agent_id in fake_agents_db:
            return fake_agents_db[agent_id]
        raise HTTPException(status_code=404, detail="Agent not found")

@app.delete("/agents/{agent_id}")
async def delete_agent(agent_id: str, current_user: dict = Depends(get_current_user)):
    """Delete an agent"""
    try:
        await call_vapi_api(f"/assistant/{agent_id}", method="DELETE")
        return {"message": "Agent deleted successfully"}
    except Exception as e:
        # Remove from mock database
        if agent_id in fake_agents_db:
            del fake_agents_db[agent_id]
            return {"message": "Agent deleted successfully"}
        raise HTTPException(status_code=404, detail="Agent not found")

# Phone number routes
@app.get("/phone-numbers")
async def get_phone_numbers(current_user: dict = Depends(get_current_user)):
    """Get all phone numbers for the current user"""
    try:
        phone_numbers = await call_vapi_api("/phone-number")
        return phone_numbers
    except Exception as e:
        # Return mock data if VAPI API is not available
        return [
            {
                "id": f"phone_{i}",
                "number": f"+1555{100 + i:03d}{200 + i:04d}",
                "name": f"Phone Number {i}",
                "provider": "vapi" if i % 2 == 0 else "twilio",
                "status": "active",
                "created_at": datetime.utcnow().isoformat()
            }
            for i in range(1, 4)
        ]

@app.post("/phone-numbers")
async def create_phone_number(phone_data: PhoneNumberCreate, current_user: dict = Depends(get_current_user)):
    """Create a new phone number using VAPI API"""
    try:
        vapi_payload = {
            "name": phone_data.name
        }
        
        if phone_data.areaCode:
            vapi_payload["areaCode"] = phone_data.areaCode
        
        created_phone = await call_vapi_api("/phone-number", method="POST", data=vapi_payload)
        return created_phone
    except Exception as e:
        # Return mock data if VAPI API is not available
        phone_id = f"phone_{len(fake_phone_numbers_db) + 1}"
        mock_phone = {
            "id": phone_id,
            "number": f"+1555{len(fake_phone_numbers_db):03d}1234",
            "name": phone_data.name,
            "provider": phone_data.provider,
            "status": "active",
            "created_at": datetime.utcnow().isoformat(),
            "user_id": current_user["id"]
        }
        fake_phone_numbers_db[phone_id] = mock_phone
        return mock_phone

@app.delete("/phone-numbers/{phone_id}")
async def delete_phone_number(phone_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a phone number"""
    try:
        await call_vapi_api(f"/phone-number/{phone_id}", method="DELETE")
        return {"message": "Phone number deleted successfully"}
    except Exception as e:
        # Remove from mock database
        if phone_id in fake_phone_numbers_db:
            del fake_phone_numbers_db[phone_id]
            return {"message": "Phone number deleted successfully"}
        raise HTTPException(status_code=404, detail="Phone number not found")

# Call routes
@app.get("/calls")
async def get_calls(current_user: dict = Depends(get_current_user)):
    """Get all calls for the current user"""
    try:
        calls = await call_vapi_api("/call")
        return calls
    except Exception as e:
        # Return mock data if VAPI API is not available
        return []

@app.post("/calls")
async def create_call(call_data: dict, current_user: dict = Depends(get_current_user)):
    """Create a new outbound call"""
    try:
        created_call = await call_vapi_api("/call", method="POST", data=call_data)
        return created_call
    except Exception as e:
        # Return mock data if VAPI API is not available
        return {
            "id": f"call_{datetime.utcnow().timestamp()}",
            "status": "queued",
            "created_at": datetime.utcnow().isoformat()
        }

# Analytics routes
@app.get("/analytics/dashboard")
async def get_dashboard_analytics(current_user: dict = Depends(get_current_user)):
    """Get dashboard analytics data"""
    return {
        "totalCallMinutes": 0.0,
        "numberOfCalls": 0,
        "totalSpent": 0.0,
        "averageCostPerCall": 0.0,
        "callsToday": 0,
        "callsThisMonth": 0,
        "activeAgents": len(fake_agents_db),
        "activePhoneNumbers": len(fake_phone_numbers_db)
    }

# Health check
@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

# Root endpoint
@app.get("/")
async def root():
    return {"message": "EmployAI API", "version": "1.0.0"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
