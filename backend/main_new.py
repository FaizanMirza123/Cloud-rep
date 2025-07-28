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
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
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
    phone: Optional[str] = None
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class GoogleAuthRequest(BaseModel):
    token: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class VerifyEmailRequest(BaseModel):
    token: str

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

class AgentUpdate(BaseModel):
    name: Optional[str] = None
    industry: Optional[str] = None
    role: Optional[str] = None
    description: Optional[str] = None
    systemPrompt: Optional[str] = None
    firstMessage: Optional[str] = None
    voice: Optional[str] = None
    model: Optional[str] = None
    language: Optional[str] = None

class PhoneNumberCreate(BaseModel):
    name: str
    areaCode: Optional[str] = None
    provider: str = "vapi"

class CallCreate(BaseModel):
    customer_number: str
    agent_id: str
    phone_number_id: Optional[str] = None

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

def get_current_user(user_email: str = Depends(verify_token), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_email).first()
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
        elif method == "PATCH":
            response = await client.patch(url, headers=headers, json=data)
        elif method == "DELETE":
            response = await client.delete(url, headers=headers)
        else:
            raise HTTPException(status_code=400, detail="Invalid HTTP method")
        
        if response.status_code >= 400:
            raise HTTPException(status_code=response.status_code, detail=response.text)
        
        return response.json()

# Auth routes
@app.post("/auth/register")
async def register(user_data: UserRegister, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    # Validate password
    is_valid, message = auth_utils.validate_password(user_data.password)
    if not is_valid:
        raise HTTPException(status_code=400, detail=message)
    
    # Validate phone if provided
    if user_data.phone:
        is_valid_phone, formatted_phone = auth_utils.validate_phone_number(user_data.phone)
        if not is_valid_phone:
            raise HTTPException(status_code=400, detail=formatted_phone)
        user_data.phone = formatted_phone
    
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password
    hashed_password = pwd_context.hash(user_data.password)
    
    # Generate verification token
    verification_token = auth_utils.generate_verification_token()
    
    # Create user
    user_id = str(uuid.uuid4())
    user = User(
        id=user_id,
        name=user_data.name,
        email=user_data.email,
        phone=user_data.phone,
        password_hash=hashed_password,
        verification_token=verification_token,
        is_verified=False
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Send verification email in background
    background_tasks.add_task(email_service.send_verification_email, user_data.email, verification_token)
    
    # Create access token
    access_token = create_access_token(data={"sub": user_data.email})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "phone": user.phone,
            "is_verified": user.is_verified
        }
    }

@app.post("/auth/login")
async def login(login_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not pwd_context.verify(login_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    access_token = create_access_token(data={"sub": login_data.email})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "phone": user.phone,
            "is_verified": user.is_verified
        }
    }

@app.post("/auth/google")
async def google_auth(auth_data: GoogleAuthRequest, db: Session = Depends(get_db)):
    # Verify Google token
    user_info = await google_auth.verify_google_token(auth_data.token)
    if not user_info:
        raise HTTPException(status_code=400, detail="Invalid Google token")
    
    # Check if user exists
    user = db.query(User).filter(User.email == user_info["email"]).first()
    
    if not user:
        # Create new user
        user_id = str(uuid.uuid4())
        user = User(
            id=user_id,
            name=user_info["name"],
            email=user_info["email"],
            password_hash="",  # No password for Google auth
            google_id=user_info["google_id"],
            is_verified=user_info["verified_email"]
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # Update Google ID if not set
        if not user.google_id:
            user.google_id = user_info["google_id"]
            db.commit()
    
    access_token = create_access_token(data={"sub": user.email})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "phone": user.phone,
            "is_verified": user.is_verified
        }
    }

@app.post("/auth/forgot-password")
async def forgot_password(request: ForgotPasswordRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        # Don't reveal if email exists or not
        return {"message": "If your email is registered, you will receive a password reset link"}
    
    # Generate reset token
    reset_token = auth_utils.generate_reset_token()
    reset_token_expires = datetime.utcnow() + timedelta(hours=1)
    
    user.reset_token = reset_token
    user.reset_token_expires = reset_token_expires
    db.commit()
    
    # Send reset email in background
    background_tasks.add_task(email_service.send_password_reset_email, request.email, reset_token)
    
    return {"message": "If your email is registered, you will receive a password reset link"}

@app.post("/auth/reset-password")
async def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.reset_token == request.token).first()
    if not user or auth_utils.is_token_expired(user.reset_token_expires):
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    
    # Validate new password
    is_valid, message = auth_utils.validate_password(request.new_password)
    if not is_valid:
        raise HTTPException(status_code=400, detail=message)
    
    # Update password
    user.password_hash = pwd_context.hash(request.new_password)
    user.reset_token = None
    user.reset_token_expires = None
    db.commit()
    
    return {"message": "Password reset successfully"}

@app.post("/auth/verify-email")
async def verify_email(request: VerifyEmailRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.verification_token == request.token).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid verification token")
    
    user.is_verified = True
    user.verification_token = None
    db.commit()
    
    return {"message": "Email verified successfully"}

# Agent routes
@app.get("/agents")
async def get_agents(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get all agents for the current user"""
    agents = db.query(Agent).filter(Agent.user_id == current_user.id).all()
    return agents

@app.post("/agents")
async def create_agent(agent_data: AgentCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
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
                        "content": agent_data.systemPrompt or f"You are {agent_data.name}, a helpful AI assistant working in the {agent_data.industry} industry."
                    }
                ]
            },
            "voice": {
                "provider": "openai",
                "voiceId": agent_data.voice
            },
            "firstMessage": agent_data.firstMessage or "Hello! How can I help you today?"
        }
        
        # Create agent in VAPI
        vapi_agent = await call_vapi_api("/assistant", method="POST", data=vapi_payload)
        
        # Store in local database
        agent_id = str(uuid.uuid4())
        agent = Agent(
            id=agent_id,
            vapi_id=vapi_agent.get("id"),
            user_id=current_user.id,
            name=agent_data.name,
            industry=agent_data.industry,
            role=agent_data.role,
            description=agent_data.description,
            system_prompt=agent_data.systemPrompt,
            first_message=agent_data.firstMessage,
            voice=agent_data.voice,
            model=agent_data.model,
            language=agent_data.language,
            status="active"
        )
        
        db.add(agent)
        db.commit()
        db.refresh(agent)
        
        return agent
        
    except Exception as e:
        # If VAPI call fails, still create in local DB with "error" status
        agent_id = str(uuid.uuid4())
        agent = Agent(
            id=agent_id,
            user_id=current_user.id,
            name=agent_data.name,
            industry=agent_data.industry,
            role=agent_data.role,
            description=agent_data.description,
            system_prompt=agent_data.systemPrompt,
            first_message=agent_data.firstMessage,
            voice=agent_data.voice,
            model=agent_data.model,
            language=agent_data.language,
            status="error"
        )
        
        db.add(agent)
        db.commit()
        db.refresh(agent)
        
        return agent

@app.get("/agents/{agent_id}")
async def get_agent(agent_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get a specific agent"""
    agent = db.query(Agent).filter(and_(Agent.id == agent_id, Agent.user_id == current_user.id)).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    # Try to get updated info from VAPI
    try:
        if agent.vapi_id:
            vapi_agent = await call_vapi_api(f"/assistant/{agent.vapi_id}")
            # Update local agent with VAPI data if needed
            agent.status = "active"
            db.commit()
    except:
        pass  # Continue with local data if VAPI call fails
    
    return agent

@app.put("/agents/{agent_id}")
async def update_agent(agent_id: str, agent_data: AgentUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Update an agent"""
    agent = db.query(Agent).filter(and_(Agent.id == agent_id, Agent.user_id == current_user.id)).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    # Update local agent
    for field, value in agent_data.dict(exclude_unset=True).items():
        if hasattr(agent, field.replace("systemPrompt", "system_prompt").replace("firstMessage", "first_message")):
            setattr(agent, field.replace("systemPrompt", "system_prompt").replace("firstMessage", "first_message"), value)
    
    agent.updated_at = datetime.utcnow()
    
    # Try to update in VAPI
    try:
        if agent.vapi_id:
            vapi_payload = {}
            if agent_data.name:
                vapi_payload["name"] = agent_data.name
            if agent_data.systemPrompt:
                vapi_payload["model"] = {
                    "provider": "openai",
                    "model": agent.model,
                    "messages": [{"role": "system", "content": agent_data.systemPrompt}]
                }
            if agent_data.firstMessage:
                vapi_payload["firstMessage"] = agent_data.firstMessage
            if agent_data.voice:
                vapi_payload["voice"] = {"provider": "openai", "voiceId": agent_data.voice}
            
            if vapi_payload:
                await call_vapi_api(f"/assistant/{agent.vapi_id}", method="PATCH", data=vapi_payload)
    except:
        pass  # Continue even if VAPI update fails
    
    db.commit()
    db.refresh(agent)
    
    return agent

@app.delete("/agents/{agent_id}")
async def delete_agent(agent_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Delete an agent"""
    agent = db.query(Agent).filter(and_(Agent.id == agent_id, Agent.user_id == current_user.id)).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    # Try to delete from VAPI
    try:
        if agent.vapi_id:
            await call_vapi_api(f"/assistant/{agent.vapi_id}", method="DELETE")
    except:
        pass  # Continue even if VAPI delete fails
    
    # Delete from local database
    db.delete(agent)
    db.commit()
    
    return {"message": "Agent deleted successfully"}

# Phone number routes
@app.get("/phone-numbers")
async def get_phone_numbers(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get all phone numbers for the current user"""
    phone_numbers = db.query(PhoneNumber).filter(PhoneNumber.user_id == current_user.id).all()
    return phone_numbers

@app.post("/phone-numbers")
async def create_phone_number(phone_data: PhoneNumberCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Create a new phone number using VAPI API"""
    try:
        vapi_payload = {"name": phone_data.name}
        if phone_data.areaCode:
            vapi_payload["areaCode"] = phone_data.areaCode
        
        # Create phone number in VAPI
        vapi_phone = await call_vapi_api("/phone-number", method="POST", data=vapi_payload)
        
        # Store in local database
        phone_id = str(uuid.uuid4())
        phone_number = PhoneNumber(
            id=phone_id,
            vapi_id=vapi_phone.get("id"),
            user_id=current_user.id,
            number=vapi_phone.get("number", ""),
            name=phone_data.name,
            area_code=phone_data.areaCode,
            provider=phone_data.provider,
            status="active"
        )
        
        db.add(phone_number)
        db.commit()
        db.refresh(phone_number)
        
        return phone_number
        
    except Exception as e:
        # If VAPI call fails, create mock entry
        phone_id = str(uuid.uuid4())
        phone_number = PhoneNumber(
            id=phone_id,
            user_id=current_user.id,
            number=f"+1{phone_data.areaCode or '555'}1234567",
            name=phone_data.name,
            area_code=phone_data.areaCode,
            provider=phone_data.provider,
            status="error"
        )
        
        db.add(phone_number)
        db.commit()
        db.refresh(phone_number)
        
        return phone_number

@app.delete("/phone-numbers/{phone_id}")
async def delete_phone_number(phone_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Delete a phone number"""
    phone_number = db.query(PhoneNumber).filter(and_(PhoneNumber.id == phone_id, PhoneNumber.user_id == current_user.id)).first()
    if not phone_number:
        raise HTTPException(status_code=404, detail="Phone number not found")
    
    # Try to delete from VAPI
    try:
        if phone_number.vapi_id:
            await call_vapi_api(f"/phone-number/{phone_number.vapi_id}", method="DELETE")
    except:
        pass
    
    # Delete from local database
    db.delete(phone_number)
    db.commit()
    
    return {"message": "Phone number deleted successfully"}

# Call routes
@app.get("/calls")
async def get_calls(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get all calls for the current user"""
    calls = db.query(Call).filter(Call.user_id == current_user.id).order_by(desc(Call.created_at)).all()
    return calls

@app.get("/calls/active")
async def get_active_calls(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get active calls"""
    active_calls = db.query(Call).filter(
        and_(Call.user_id == current_user.id, Call.status.in_(["queued", "ringing", "in-progress"]))
    ).all()
    return active_calls

@app.get("/calls/missed")
async def get_missed_calls(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get missed calls"""
    missed_calls = db.query(Call).filter(
        and_(Call.user_id == current_user.id, Call.ended_reason == "missed")
    ).order_by(desc(Call.created_at)).all()
    return missed_calls

@app.get("/calls/recordings")
async def get_call_recordings(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get calls with recordings"""
    recorded_calls = db.query(Call).filter(
        and_(Call.user_id == current_user.id, Call.recording_url.isnot(None))
    ).order_by(desc(Call.created_at)).all()
    return recorded_calls

@app.post("/calls")
async def create_call(call_data: CallCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Create a new outbound call"""
    try:
        # Get agent and phone number
        agent = db.query(Agent).filter(and_(Agent.id == call_data.agent_id, Agent.user_id == current_user.id)).first()
        if not agent:
            raise HTTPException(status_code=404, detail="Agent not found")
        
        vapi_payload = {
            "customer": {"number": call_data.customer_number},
            "assistantId": agent.vapi_id
        }
        
        if call_data.phone_number_id:
            phone_number = db.query(PhoneNumber).filter(
                and_(PhoneNumber.id == call_data.phone_number_id, PhoneNumber.user_id == current_user.id)
            ).first()
            if phone_number and phone_number.vapi_id:
                vapi_payload["phoneNumberId"] = phone_number.vapi_id
        
        # Create call in VAPI
        vapi_call = await call_vapi_api("/call", method="POST", data=vapi_payload)
        
        # Store in local database
        call_id = str(uuid.uuid4())
        call = Call(
            id=call_id,
            vapi_id=vapi_call.get("id"),
            user_id=current_user.id,
            agent_id=call_data.agent_id,
            phone_number_id=call_data.phone_number_id,
            customer_number=call_data.customer_number,
            direction="outbound",
            status=vapi_call.get("status", "queued"),
            started_at=datetime.utcnow()
        )
        
        db.add(call)
        db.commit()
        db.refresh(call)
        
        return call
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to create call: {str(e)}")

# Analytics routes
@app.get("/analytics/dashboard")
async def get_dashboard_analytics(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get dashboard analytics data"""
    # Get call statistics
    total_calls = db.query(Call).filter(Call.user_id == current_user.id).count()
    total_minutes = db.query(Call).filter(Call.user_id == current_user.id).with_entities(Call.duration).all()
    total_duration = sum([call.duration or 0 for call in total_minutes]) / 60  # Convert to minutes
    
    # Get agent and phone number counts
    active_agents = db.query(Agent).filter(and_(Agent.user_id == current_user.id, Agent.status == "active")).count()
    active_phone_numbers = db.query(PhoneNumber).filter(and_(PhoneNumber.user_id == current_user.id, PhoneNumber.status == "active")).count()
    
    # Calculate today's calls
    today = datetime.utcnow().date()
    calls_today = db.query(Call).filter(
        and_(Call.user_id == current_user.id, Call.created_at >= today)
    ).count()
    
    # Calculate this month's calls
    this_month = datetime.utcnow().replace(day=1)
    calls_this_month = db.query(Call).filter(
        and_(Call.user_id == current_user.id, Call.created_at >= this_month)
    ).count()
    
    return {
        "totalCallMinutes": round(total_duration, 2),
        "numberOfCalls": total_calls,
        "totalSpent": 0.0,  # Will need to calculate based on call costs
        "averageCostPerCall": 0.0,  # Will need to calculate based on call costs
        "callsToday": calls_today,
        "callsThisMonth": calls_this_month,
        "activeAgents": active_agents,
        "activePhoneNumbers": active_phone_numbers
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
