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
from datetime import datetime, timedelta
import uuid
from datetime import datetime, timedelta
from passlib.context import CryptContext
import uvicorn
from fastapi.responses import JSONResponse
from fastapi.requests import Request
from fastapi import status
# Local imports
from database import get_db, create_tables, User, Agent, PhoneNumber, Call
from auth_utils import AuthUtils, EmailService, GoogleAuth

# Environment variables
VAPI_API_KEY = "b53d60fd-f374-4af6-b586-3d2ff3463efa"
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-change-this-in-production")
VAPI_BASE_URL = "https://api.vapi.ai"

app = FastAPI(title="EmployAI API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://cloud-rep-ten.vercel.app"],
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

@app.get("/")
async def root():
    return {"message": "EmployAI API", "version": "1.0.0"}

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"Exception occurred: {exc}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal Server Error", "error": str(exc)},
    )
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
    voice: str = "29vD33N1CtxCmqQRPOHJ"  # Using ElevenLabs male voice ID
    voiceProvider: str = "11labs"  # Now using ElevenLabs as default
    voiceGender: Optional[str] = "male"
    model: str = "gpt-4o"
    modelProvider: str = "openai"
    language: str = "en-US"

class AgentUpdate(BaseModel):
    name: Optional[str] = None
    industry: Optional[str] = None
    role: Optional[str] = None
    description: Optional[str] = None
    systemPrompt: Optional[str] = None
    firstMessage: Optional[str] = None
    voice: Optional[str] = None
    voiceProvider: Optional[str] = None
    voiceGender: Optional[str] = None
    model: Optional[str] = None
    modelProvider: Optional[str] = None
    language: Optional[str] = None

class PhoneNumberCreate(BaseModel):
    name: str
    country: str = "US"
    areaCode: Optional[str] = None
    dialCode: Optional[str] = None
    provider: str = "byo-phone-number"
    number: Optional[str] = None  # For BYO numbers
    # Twilio specific fields
    accountSid: Optional[str] = None
    authToken: Optional[str] = None
    # General credential ID
    credentialId: Optional[str] = None

class CallCreate(BaseModel):
    customer_number: str
    agent_id: str
    phone_number_id: Optional[str] = None

class PhoneNumberUpdate(BaseModel):
    name: Optional[str] = None
    assistantId: Optional[str] = None  # Connect to an assistant

class WebhookData(BaseModel):
    # VAPI webhook data model
    call: Optional[dict] = None
    message: Optional[dict] = None

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

def get_safe_voice_config(provider: str, voice_id: str = None, gender: str = None, model: str = None):
    """
    Helper function to get a safe voice configuration that works with VAPI
    Returns a tuple of (provider, voice_id, model_params) that should be compatible
    """
    # Start with defaults
    safe_provider = "openai"
    safe_voice_id = "alloy"  # Default neutral
    model_params = None  # Additional model parameters
    
    # Log what was requested for debugging purposes
    print(f"Voice requested: provider={provider}, voice_id={voice_id}, gender={gender}, model={model}")
    
    # Handle each provider according to what we know works well with VAPI
    if provider == "openai":
        # OpenAI voices are well-supported
        safe_provider = "openai"
        
        # Use gender preferences if specified
        if gender == "male":
            safe_voice_id = "echo" 
        elif gender == "female":
            safe_voice_id = "nova"
        elif voice_id:
            # Use provided voice ID if specified
            safe_voice_id = voice_id
    
    elif provider == "azure":
        # Azure neural voices work well
        safe_provider = "azure"
        
        if gender == "male":
            safe_voice_id = "en-US-ChristopherNeural"
        elif gender == "female":
            safe_voice_id = "en-US-JennyNeural"
        elif voice_id:
            # Use provided voice ID if specified 
            safe_voice_id = voice_id
    
    elif provider == "11labs":
        # Now we'll use the specific ElevenLabs voice IDs directly with Flash v2.5 model
        safe_provider = "11labs"
        
        # Set the model to Flash v2.5 for 11labs with stability settings
        model_params = {
            "model": "eleven_flash_v2_5",  # Using ElevenLabs Flash v2.5 model
            "stability": 0.5,
            "similarityBoost": 0.75
        }
        
        if gender == "female" or (voice_id and voice_id.lower() in ["female", "female-voice", "rachel"]):
            # Use specified female voice ID
            safe_voice_id = "qBDvhofpxp92JgXJxDjB"
            print(f"Using specific 11labs female voice ID: {safe_voice_id} with Flash v2.5 model")
        elif gender == "male" or (voice_id and voice_id.lower() in ["male", "male-voice", "josh"]):
            # Use specified male voice ID
            safe_voice_id = "29vD33N1CtxCmqQRPOHJ"
            print(f"Using specific 11labs male voice ID: {safe_voice_id} with Flash v2.5 model")
        elif voice_id:
            # Use provided voice ID if specified and not a generic identifier
            safe_voice_id = voice_id
            print(f"Using provided 11labs voice ID: {safe_voice_id} with Flash v2.5 model")
        else:
            # Default to male voice if no specification
            safe_voice_id = "29vD33N1CtxCmqQRPOHJ"
            print(f"Using default 11labs male voice ID: {safe_voice_id} with Flash v2.5 model")
    
    print(f"Using safe voice configuration: provider={safe_provider}, voice_id={safe_voice_id}, model_params={model_params}")
    return safe_provider, safe_voice_id, model_params

async def call_vapi_api(endpoint: str, method: str = "GET", data: dict = None):
    """Helper function to make calls to VAPI API"""
    if not VAPI_API_KEY:
        print("WARNING: VAPI_API_KEY not configured")
        raise HTTPException(status_code=500, detail="VAPI API key not configured")
    
    headers = {
        "Authorization": f"Bearer {VAPI_API_KEY}",
        "Content-Type": "application/json"
    }
    
    # Special handling for voice configuration in the payload
    if data and "voice" in data:
        # Try to apply safe voice configuration
        voice_config = data["voice"]
        provider = voice_config.get("provider")
        voice_id = voice_config.get("voiceId")
        
        # For 11labs voices, ensure we're using the correct specific voice IDs
        if provider == "11labs":
            # Determine gender from voice_id if possible
            gender = None
            if voice_id:
                if "male" in voice_id.lower():
                    gender = "male"
                elif "female" in voice_id.lower():
                    gender = "female"
            
            # Get the appropriate voice ID using our helper function
            safe_provider, safe_voice_id, model_params = get_safe_voice_config(
                provider="11labs",  # Keep as 11labs since we now have specific IDs
                voice_id=voice_id,
                gender=gender,
                model="flash-v2.5"  # Specify we want Flash v2.5
            )
            
            # Update the payload with safe values
            data["voice"]["provider"] = safe_provider
            data["voice"]["voiceId"] = safe_voice_id
            
            # Add model parameters for Flash v2.5
            if model_params:
                for key, value in model_params.items():
                    data["voice"][key] = value
            
            print(f"Using specific 11labs voice ID: {safe_voice_id} with Flash v2.5 model")
    
    async with httpx.AsyncClient() as client:
        url = f"{VAPI_BASE_URL}{endpoint}"
        
        print(f"VAPI API Call: {method} {url}")  # Debug logging
        if data:
            print(f"VAPI Payload: {data}")  # Debug logging
        
        try:
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
            
            print(f"VAPI Response Status: {response.status_code}")  # Debug logging
            
            if response.status_code >= 400:
                error_text = response.text
                print(f"VAPI Error Response: {error_text}")  # Debug logging
                raise HTTPException(
                    status_code=response.status_code, 
                    detail=f"VAPI API Error: {error_text}"
                )
            
            return response.json() if response.content else {}
            
        except httpx.RequestError as e:
            print(f"VAPI Request Error: {str(e)}")  # Debug logging
            raise HTTPException(status_code=503, detail=f"VAPI API request failed: {str(e)}")
        except Exception as e:
            print(f"VAPI Unknown Error: {str(e)}")  # Debug logging
            raise HTTPException(status_code=500, detail=f"VAPI API call failed: {str(e)}")

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

@app.post("/auth/logout")
async def logout(current_user: User = Depends(get_current_user)):
    """Logout user (client-side token invalidation)"""
    return {"message": "Logged out successfully", "user": current_user.name}

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
        # Create simplified VAPI agent payload
        vapi_payload = {
            "name": agent_data.name,
            "firstMessage": agent_data.firstMessage or "Hello! How can I help you today?",
            "model": {
                "provider": agent_data.modelProvider or "openai",
                "model": agent_data.model or "gpt-4o",
                "messages": [
                    {
                        "role": "system",
                        "content": agent_data.systemPrompt or f"You are {agent_data.name}, a helpful AI assistant working in the {agent_data.industry} industry. {agent_data.description or ''}"
                    }
                ],
                "temperature": 0.7,
                "maxTokens": 500
            },
            "transcriber": {
                "provider": "deepgram",
                "model": "nova-3",
                "language": agent_data.language or "en-US"
            }
        }
        
        # Handle voice configuration using our helper function
        provider = agent_data.voiceProvider or "openai"
        voice_id = agent_data.voice
        gender = agent_data.voiceGender
        
        # Get safe voice configuration with model support
        safe_provider, safe_voice_id, model_params = get_safe_voice_config(
            provider=provider, 
            voice_id=voice_id, 
            gender=gender,
            model="flash-v2.5" if provider == "11labs" else None
        )
        
        # Update the payload with safe values
        vapi_payload["voice"] = {
            "provider": safe_provider,
            "voiceId": safe_voice_id
        }
        
        # Add model parameters if available (for ElevenLabs Flash v2.5)
        if model_params:
            for key, value in model_params.items():
                vapi_payload["voice"][key] = value
        
        # If we had to change the provider, update the agent data
        if safe_provider != provider:
            # Store what we're actually using, not what was requested
            agent_data.voiceProvider = safe_provider
            agent_data.voice = safe_voice_id
        
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
            voice_provider=agent_data.voiceProvider,
            voice_gender=agent_data.voiceGender,
            model=agent_data.model,
            model_provider=agent_data.modelProvider,
            language=agent_data.language,
            status="active"
        )
        
        db.add(agent)
        db.commit()
        db.refresh(agent)
        
        return agent
        
    except Exception as e:
        # If VAPI call fails, still create in local DB with "error" status
        print(f"VAPI API Error: {str(e)}")  # Debug logging
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
            voice_provider=agent_data.voiceProvider,
            voice_gender=agent_data.voiceGender,
            model=agent_data.model,
            model_provider=agent_data.modelProvider,
            language=agent_data.language,
            status="error"
        )
        
        db.add(agent)
        db.commit()
        db.refresh(agent)
        
        return agent

@app.get("/agents/{agent_id}")
async def get_agent(agent_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get a specific agent with latest data from VAPI"""
    agent = db.query(Agent).filter(and_(Agent.id == agent_id, Agent.user_id == current_user.id)).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    # Try to get updated info from VAPI and sync
    try:
        if agent.vapi_id:
            vapi_agent = await call_vapi_api(f"/assistant/{agent.vapi_id}")
            
            # Update local agent with latest VAPI data
            if vapi_agent:
                agent.name = vapi_agent.get("name", agent.name)
                agent.status = "active"  # If we can fetch it, it's active
                
                # Update first message if available
                if vapi_agent.get("firstMessage"):
                    agent.first_message = vapi_agent["firstMessage"]
                
                # Update model info if available
                if vapi_agent.get("model", {}).get("messages"):
                    system_message = next(
                        (msg for msg in vapi_agent["model"]["messages"] if msg.get("role") == "system"),
                        None
                    )
                    if system_message:
                        agent.system_prompt = system_message.get("content")
                
                # Update voice if available  
                if vapi_agent.get("voice", {}).get("voiceId"):
                    agent.voice = vapi_agent["voice"]["voiceId"]
                
                agent.updated_at = datetime.utcnow()
                db.commit()
                
    except Exception as e:
        print(f"Failed to sync agent from VAPI: {str(e)}")
        # Don't fail the request, just continue with local data
        pass
    
    return agent

@app.put("/agents/{agent_id}")
async def update_agent(agent_id: str, agent_data: AgentUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Update an agent"""
    agent = db.query(Agent).filter(and_(Agent.id == agent_id, Agent.user_id == current_user.id)).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    # Update local agent
    update_data = agent_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        # Convert camelCase to snake_case for database fields
        db_field = field
        if field == "systemPrompt":
            db_field = "system_prompt"
        elif field == "firstMessage":
            db_field = "first_message"
        elif field == "voiceProvider":
            db_field = "voice_provider"
        elif field == "voiceGender":
            db_field = "voice_gender"
        elif field == "modelProvider":
            db_field = "model_provider"
            
        if hasattr(agent, db_field):
            setattr(agent, db_field, value)
    
    agent.updated_at = datetime.utcnow()
    
    # Try to update in VAPI
    try:
        if agent.vapi_id:
            vapi_payload = {}
            
            if agent_data.name:
                vapi_payload["name"] = agent_data.name
                
            if agent_data.firstMessage:
                vapi_payload["firstMessage"] = agent_data.firstMessage
                
            if agent_data.systemPrompt or agent_data.model or agent_data.modelProvider:
                vapi_payload["model"] = {
                    "provider": agent_data.modelProvider or agent.model_provider or "openai",
                    "model": agent_data.model or agent.model or "gpt-4o",
                    "messages": [
                        {
                            "role": "system", 
                            "content": agent_data.systemPrompt or agent.system_prompt
                        }
                    ],
                    "temperature": 0.7,
                    "maxTokens": 500
                }
                
            if agent_data.voice or agent_data.voiceProvider or agent_data.voiceGender:
                provider = agent_data.voiceProvider or agent.voice_provider or "openai"
                
                # Get voice configuration details (from update data or existing agent data)
                voice_id = agent_data.voice or agent.voice
                gender = agent_data.voiceGender or agent.voice_gender
                
                # Get safe voice configuration using our helper function with model support
                safe_provider, safe_voice_id, model_params = get_safe_voice_config(
                    provider=provider, 
                    voice_id=voice_id, 
                    gender=gender,
                    model="flash-v2.5" if provider == "11labs" else None
                )
                
                # Update the payload with safe values
                vapi_payload["voice"] = {
                    "provider": safe_provider,
                    "voiceId": safe_voice_id
                }
                
                # Add model parameters if available (for ElevenLabs Flash v2.5)
                if model_params:
                    for key, value in model_params.items():
                        vapi_payload["voice"][key] = value
                
                # If we had to change the provider, update the agent data to be consistent
                if safe_provider != provider:
                    # Store what we're actually using, not what was requested
                    agent.voice_provider = safe_provider
                    agent.voice = safe_voice_id
            
            if agent_data.language:
                vapi_payload["transcriber"] = {
                    "provider": "deepgram",
                    "model": "nova-3", 
                    "language": agent_data.language
                }
            
            if vapi_payload:
                await call_vapi_api(f"/assistant/{agent.vapi_id}", method="PATCH", data=vapi_payload)
                agent.status = "active"  # Update status on successful VAPI update
            
    except Exception as e:
        print(f"VAPI Update Error: {str(e)}")  # Debug logging
        agent.status = "error"  # Mark as error if VAPI update fails
    
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

@app.post("/agents/{agent_id}/test")
async def test_agent(
    agent_id: str, 
    test_data: dict,
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """Test an agent with a sample call"""
    agent = db.query(Agent).filter(and_(Agent.id == agent_id, Agent.user_id == current_user.id)).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    try:
        # Validate phone number format
        phone_number = test_data.get("phoneNumber")
        if not phone_number:
            raise HTTPException(status_code=400, detail="Phone number is required for test call")
        
        # Ensure phone number is in E.164 format
        if not phone_number.startswith('+'):
            # If it's a US number without +1, add it
            if len(phone_number) == 10 and phone_number.isdigit():
                phone_number = f"+1{phone_number}"
            else:
                raise HTTPException(status_code=400, detail="Phone number must be in E.164 format (e.g., +1234567890)")
        
        # Create a test call via VAPI
        vapi_payload = {
            "assistantId": agent.vapi_id or agent.id,
            "phoneNumberId": test_data.get("phoneNumberId"),  # Optional
            "customer": {
                "number": phone_number
            },
            "metadata": {
                "test": True,
                "agentId": agent.id,
                "userId": current_user.id
            }
        }
        
        # Make test call via VAPI
        vapi_call = await call_vapi_api("/call", method="POST", data=vapi_payload)
        
        # Store test call in local database
        call_id = str(uuid.uuid4())
        call = Call(
            id=call_id,
            vapi_id=vapi_call.get("id"),
            user_id=current_user.id,
            agent_id=agent.id,
            phone_number=phone_number,
            direction="outbound",
            status="initiated",
            type="test"
        )
        
        db.add(call)
        db.commit()
        db.refresh(call)
        
        return {
            "message": "Test call initiated successfully",
            "callId": call.id,
            "vapiCallId": vapi_call.get("id"),
            "status": "initiated"
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to initiate test call: {str(e)}")

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
        # Create VAPI phone number payload based on provider type
        # Based on VAPI API documentation, each provider has specific required fields
        vapi_payload = {}
        
        if phone_data.provider == "byo-phone-number":
            if not phone_data.number:
                raise HTTPException(status_code=400, detail="Phone number is required for BYO provider")
            if not phone_data.credentialId:
                raise HTTPException(status_code=400, detail="Credential ID is required for BYO provider")
            
            vapi_payload = {
                "provider": "byo-phone-number",
                "number": phone_data.number,
                "credentialId": phone_data.credentialId
            }
            # Add name if provided
            if phone_data.name:
                vapi_payload["name"] = phone_data.name
        
        elif phone_data.provider == "twilio":
            # For Twilio, we need credentialId (either existing or create new one)
            credential_id = phone_data.credentialId
            
            if not credential_id and phone_data.accountSid and phone_data.authToken:
                # Create credentials first if not provided
                credential_payload = {
                    "provider": "twilio",
                    "accountSid": phone_data.accountSid,
                    "authToken": phone_data.authToken
                }
                
                print(f"Creating Twilio credential with payload: {credential_payload}")
                credential = await call_vapi_api("/credential", method="POST", data=credential_payload)
                credential_id = credential.get("id")
                print(f"Created credential with ID: {credential_id}")
            
            if not credential_id:
                raise HTTPException(status_code=400, detail="Twilio requires either credentialId or accountSid/authToken")
            
            vapi_payload = {
                "provider": "twilio",
                "credentialId": credential_id
            }
            
            # Add optional fields
            if phone_data.name:
                vapi_payload["name"] = phone_data.name
            if phone_data.areaCode:
                vapi_payload["areaCode"] = phone_data.areaCode
        
        elif phone_data.provider == "vonage":
            if not phone_data.credentialId:
                raise HTTPException(status_code=400, detail="Credential ID is required for Vonage provider")
            
            vapi_payload = {
                "provider": "vonage",
                "credentialId": phone_data.credentialId
            }
            
            # Add optional fields
            if phone_data.name:
                vapi_payload["name"] = phone_data.name
            if phone_data.areaCode:
                vapi_payload["areaCode"] = phone_data.areaCode
        
        elif phone_data.provider == "telnyx":
            if not phone_data.credentialId:
                raise HTTPException(status_code=400, detail="Credential ID is required for Telnyx provider")
            
            vapi_payload = {
                "provider": "telnyx",
                "credentialId": phone_data.credentialId
            }
            
            # Add optional fields
            if phone_data.name:
                vapi_payload["name"] = phone_data.name
            if phone_data.areaCode:
                vapi_payload["areaCode"] = phone_data.areaCode
        
        elif phone_data.provider == "vapi":
            # VAPI provider can create free SIP phone numbers with area code
            vapi_payload = {
                "provider": "vapi"
            }
            
            # Add name if provided
            if phone_data.name:
                vapi_payload["name"] = phone_data.name
            
            # Add area code for automatic number assignment
            if phone_data.areaCode:
                if len(phone_data.areaCode) != 3:
                    raise HTTPException(status_code=400, detail="Area code must be exactly 3 digits for VAPI provider")
                vapi_payload["numberDesiredAreaCode"] = phone_data.areaCode
                print(f"Requesting VAPI SIP number with area code: {phone_data.areaCode}")
            else:
                print("No area code specified for VAPI number - will create without direct phone number")
            
            # Optional: Link to assistant if provided
            if "assistantId" in phone_data.__dict__ and phone_data.assistantId:
                vapi_payload["assistantId"] = phone_data.assistantId
        
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported provider: {phone_data.provider}. Supported providers: byo-phone-number, twilio, vonage, telnyx, vapi")
        
        # Create phone number in VAPI
        print(f"Creating phone number with payload: {vapi_payload}")
        try:
            vapi_phone = await call_vapi_api("/phone-number", method="POST", data=vapi_payload)
            print(f"VAPI Phone Response: {vapi_phone}")  # Debug what VAPI returns
            
            # Validate that we got a proper response from VAPI
            if not vapi_phone or not vapi_phone.get("id"):
                raise HTTPException(status_code=500, detail="VAPI API did not return a valid phone number response")
            
            # For name updates, only do this if VAPI gave it a default name
            vapi_name = vapi_phone.get("name", "")
            if phone_data.name and (not vapi_name or vapi_name == "Untitled Phone Number" or vapi_name.startswith("Untitled")):
                try:
                    update_payload = {"name": phone_data.name}
                    print(f"Updating phone number name from '{vapi_name}' to '{phone_data.name}'")
                    updated_phone = await call_vapi_api(f"/phone-number/{vapi_phone['id']}", method="PATCH", data=update_payload)
                    # Use the updated response if successful
                    if updated_phone:
                        vapi_phone.update(updated_phone)
                    print("Phone number name updated successfully")
                except Exception as update_error:
                    print(f"Failed to update phone number name: {update_error}")
                    # Continue anyway, we can still use the phone number
                    
        except HTTPException as e:
            # More specific error handling for VAPI API errors
            if e.status_code == 400:
                error_detail = str(e.detail)
                if "areaCode should not exist" in error_detail:
                    raise HTTPException(status_code=400, detail=f"Area code not supported for {phone_data.provider} provider. Remove area code for this provider.")
                elif "credentialId should not exist" in error_detail:
                    raise HTTPException(status_code=400, detail=f"Credential ID not supported for {phone_data.provider} provider. This provider doesn't require credentials.")
                elif "number should not exist" in error_detail:
                    raise HTTPException(status_code=400, detail=f"Phone number should not be specified for {phone_data.provider} provider. Remove the number field.")
                elif "credentialId" in error_detail and "required" in error_detail:
                    raise HTTPException(status_code=400, detail=f"Credential ID is required for {phone_data.provider}. Please provide valid credentials.")
                else:
                    raise HTTPException(status_code=400, detail=f"VAPI API Error: {error_detail}")
            else:
                raise e
        
        # Store in local database
        phone_id = str(uuid.uuid4())
        
        # Extract the actual phone number from VAPI response with better handling
        actual_number = vapi_phone.get("number", "")
        phone_name = vapi_phone.get("name", phone_data.name)
        
        # Handle different provider responses
        if phone_data.provider == "vapi":
            # VAPI provider can create real SIP numbers or placeholders
            if not actual_number or actual_number in ["", "null", None]:
                if phone_data.areaCode:
                    actual_number = f"VAPI SIP Number (Area {phone_data.areaCode}) - Pending"
                else:
                    actual_number = "VAPI Placeholder (No Area Code Specified)"
            # If VAPI returned a SIP URI, keep it
            elif actual_number.startswith("sip:"):
                # This is a SIP URI, which is valid for VAPI
                pass
        elif phone_data.provider == "byo-phone-number":
            # BYO should keep the original number if VAPI doesn't return one
            if not actual_number:
                actual_number = phone_data.number
        elif phone_data.provider in ["twilio", "vonage", "telnyx"]:
            # These providers should provision real numbers
            if not actual_number:
                # This might indicate an issue, but store what we can
                actual_number = f"Pending ({phone_data.provider})"
        
        # Ensure we have some kind of number for display
        if not actual_number:
            actual_number = f"Unknown ({phone_data.provider})"
        
        phone_number = PhoneNumber(
            id=phone_id,
            vapi_id=vapi_phone.get("id"),
            user_id=current_user.id,
            number=actual_number,
            name=phone_name,  # Use the name from VAPI response (might be updated) or fallback to user input
            area_code=phone_data.areaCode,
            country=phone_data.country,
            provider=phone_data.provider,
            status=vapi_phone.get("status", "active")
        )
        
        db.add(phone_number)
        db.commit()
        db.refresh(phone_number)
        
        # Determine warning messages and capabilities
        warning_message = None
        can_initiate_calls = True
        
        if phone_data.provider == "vapi":
            if phone_data.areaCode:
                if "Pending" in actual_number:
                    warning_message = "VAPI SIP number is being provisioned - check back shortly"
                    can_initiate_calls = False
                elif actual_number.startswith("sip:"):
                    warning_message = None  # SIP numbers are valid
                    can_initiate_calls = True
                else:
                    warning_message = None  # Real number assigned
                    can_initiate_calls = True
            else:
                warning_message = "VAPI placeholder created - specify area code for real SIP number"
                can_initiate_calls = False
        elif not actual_number or "Pending" in actual_number or "Unknown" in actual_number:
            warning_message = "Phone number provisioning may still be in progress"
            can_initiate_calls = False
        elif "placeholder" in actual_number.lower():
            warning_message = "This appears to be a placeholder - verify with your provider"
            can_initiate_calls = False
        
        return {
            "id": phone_number.id,
            "vapi_id": phone_number.vapi_id,
            "number": phone_number.number,
            "name": phone_number.name,
            "provider": phone_number.provider,
            "status": phone_number.status,
            "can_initiate_calls": can_initiate_calls,
            "warning": warning_message,
            "success": True,
            "message": f"Phone number created successfully with {phone_data.provider} provider"
        }
        
    except HTTPException:
        raise  # Re-raise HTTP exceptions
    except Exception as e:
        print(f"Error creating phone number: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create phone number: {str(e)}")

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

@app.put("/phone-numbers/{phone_id}")
async def update_phone_number(
    phone_id: str, 
    phone_data: PhoneNumberUpdate, 
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """Update a phone number, including connecting to an assistant"""
    phone_number = db.query(PhoneNumber).filter(and_(PhoneNumber.id == phone_id, PhoneNumber.user_id == current_user.id)).first()
    if not phone_number:
        raise HTTPException(status_code=404, detail="Phone number not found")
    
    try:
        # Prepare VAPI update payload
        vapi_payload = {}
        
        if phone_data.name:
            vapi_payload["name"] = phone_data.name
            phone_number.name = phone_data.name
        
        if phone_data.assistantId:
            # Verify the assistant exists and belongs to the user
            agent = db.query(Agent).filter(and_(Agent.id == phone_data.assistantId, Agent.user_id == current_user.id)).first()
            if not agent:
                raise HTTPException(status_code=404, detail="Assistant not found")
            
            # Use the VAPI assistant ID if available, otherwise use our local ID
            assistant_vapi_id = agent.vapi_id if agent.vapi_id else agent.id
            vapi_payload["assistantId"] = assistant_vapi_id
            phone_number.assistant_id = phone_data.assistantId
        
        # Update in VAPI if we have a VAPI ID
        if phone_number.vapi_id and vapi_payload:
            updated_number = await call_vapi_api(f"/phone-number/{phone_number.vapi_id}", method="PATCH", data=vapi_payload)
            print(f"Updated phone number in VAPI: {updated_number}")
        
        # Update in local database
        phone_number.updated_at = datetime.utcnow()
        db.commit()
        
        return {
            "success": True,
            "message": "Phone number updated successfully",
            "phone_number": {
                "id": phone_number.id,
                "name": phone_number.name,
                "number": phone_number.number,
                "assistant_id": phone_number.assistant_id,
                "vapi_id": phone_number.vapi_id
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating phone number: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update phone number: {str(e)}")

@app.post("/phone-numbers/{phone_id}/test")
async def test_phone_number(phone_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Test if a phone number can make calls"""
    phone_number = db.query(PhoneNumber).filter(and_(PhoneNumber.id == phone_id, PhoneNumber.user_id == current_user.id)).first()
    if not phone_number:
        raise HTTPException(status_code=404, detail="Phone number not found")
    
    if not phone_number.vapi_id:
        raise HTTPException(status_code=400, detail="Phone number not properly configured with VAPI")
    
    try:
        # Try to get the phone number from VAPI to verify it exists and is active
        vapi_phone = await call_vapi_api(f"/phone-number/{phone_number.vapi_id}")
        
        return {
            "phone_number_id": phone_number.id,
            "vapi_id": phone_number.vapi_id,
            "number": phone_number.number,
            "status": vapi_phone.get("status", "unknown"),
            "can_make_calls": vapi_phone.get("status") == "active",
            "provider": phone_number.provider,
            "message": "Phone number is ready for calls" if vapi_phone.get("status") == "active" else "Phone number is not active"
        }
    except Exception as e:
        return {
            "phone_number_id": phone_number.id,
            "vapi_id": phone_number.vapi_id,
            "number": phone_number.number,
            "status": "error",
            "can_make_calls": False,
            "provider": phone_number.provider,
            "message": f"Error testing phone number: {str(e)}"
        }

async def sync_user_calls_from_vapi(current_user: User, db: Session = None):
    """Helper function to sync and filter user's calls from VAPI"""
    try:
        # Get user's phone numbers and agents to filter VAPI calls
        user_phone_numbers = db.query(PhoneNumber).filter(PhoneNumber.user_id == current_user.id).all()
        user_agents = db.query(Agent).filter(Agent.user_id == current_user.id).all()
        
        phone_vapi_ids = [pn.vapi_id for pn in user_phone_numbers if pn.vapi_id]
        agent_vapi_ids = [ag.vapi_id for ag in user_agents if ag.vapi_id]
        
        # Fetch all calls from VAPI
        vapi_calls = await call_vapi_api("/call")
        
        # Filter calls that belong to this user
        user_calls = []
        
        for vapi_call in vapi_calls:
            # Check if this call belongs to the user via phone number or assistant
            call_phone_id = vapi_call.get("phoneNumber", {}).get("id")
            call_assistant_id = vapi_call.get("assistant", {}).get("id")
            
            belongs_to_user = (
                call_phone_id in phone_vapi_ids or 
                call_assistant_id in agent_vapi_ids
            )
            
            if belongs_to_user:
                # Find matching local records
                phone_number = next((pn for pn in user_phone_numbers if pn.vapi_id == call_phone_id), None)
                agent = next((ag for ag in user_agents if ag.vapi_id == call_assistant_id), None)
                
                # Check if we have this call in local database
                local_call = db.query(Call).filter(Call.vapi_id == vapi_call.get("id")).first()
                
                if not local_call:
                    # Create new call record
                    call_id = str(uuid.uuid4())
                    local_call = Call(
                        id=call_id,
                        vapi_id=vapi_call.get("id"),
                        user_id=current_user.id,
                        agent_id=agent.id if agent else None,
                        phone_number_id=phone_number.id if phone_number else None,
                        phone_number=vapi_call.get("phoneNumber", {}).get("number"),
                        customer_number=vapi_call.get("customer", {}).get("number"),
                        direction=vapi_call.get("type", "unknown"),
                        status=vapi_call.get("status"),
                        duration=vapi_call.get("duration"),
                        cost=vapi_call.get("cost"),
                        recording_url=vapi_call.get("recordingUrl"),
                        transcript=vapi_call.get("transcript"),
                        ended_reason=vapi_call.get("endedReason"),
                        started_at=datetime.fromisoformat(vapi_call.get("startedAt").replace('Z', '+00:00')) if vapi_call.get("startedAt") else None,
                        ended_at=datetime.fromisoformat(vapi_call.get("endedAt").replace('Z', '+00:00')) if vapi_call.get("endedAt") else None,
                        created_at=datetime.fromisoformat(vapi_call.get("createdAt").replace('Z', '+00:00')) if vapi_call.get("createdAt") else datetime.utcnow(),
                        updated_at=datetime.fromisoformat(vapi_call.get("updatedAt").replace('Z', '+00:00')) if vapi_call.get("updatedAt") else datetime.utcnow()
                    )
                    db.add(local_call)
                else:
                    # Update existing call with latest VAPI data
                    local_call.status = vapi_call.get("status", local_call.status)
                    local_call.duration = vapi_call.get("duration", local_call.duration)
                    local_call.cost = vapi_call.get("cost", local_call.cost)
                    local_call.recording_url = vapi_call.get("recordingUrl", local_call.recording_url)
                    local_call.transcript = vapi_call.get("transcript", local_call.transcript)
                    local_call.ended_reason = vapi_call.get("endedReason", local_call.ended_reason)
                    if vapi_call.get("endedAt") and not local_call.ended_at:
                        local_call.ended_at = datetime.fromisoformat(vapi_call.get("endedAt").replace('Z', '+00:00'))
                    local_call.updated_at = datetime.utcnow()
                
                user_calls.append(local_call)
        
        db.commit()
        return user_calls
        
    except Exception as e:
        print(f"Error syncing calls from VAPI: {str(e)}")
        # Fallback to local database
        return db.query(Call).filter(Call.user_id == current_user.id).all()

# Call routes
@app.get("/calls")
async def get_calls(
    agent_id: Optional[str] = None,
    limit: Optional[int] = None,
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """Get all calls for the current user with optional filtering - synced from VAPI"""
    try:
        # Sync calls from VAPI
        calls = await sync_user_calls_from_vapi(current_user, db)
        
        # Apply agent filter if provided
        if agent_id:
            calls = [call for call in calls if call.agent_id == agent_id]
        
        # Sort by created_at descending
        calls.sort(key=lambda x: x.created_at or datetime.min, reverse=True)
        
        # Apply limit if provided
        if limit:
            calls = calls[:limit]
        
        return calls
        
    except Exception as e:
        print(f"Error fetching calls: {str(e)}")
        # Fallback to local database only
        query = db.query(Call).filter(Call.user_id == current_user.id)
        if agent_id:
            query = query.filter(Call.agent_id == agent_id)
        query = query.order_by(desc(Call.created_at))
        if limit:
            query = query.limit(limit)
        return query.all()

@app.get("/calls/active")
async def get_active_calls(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get active calls - synced from VAPI"""
    try:
        # Sync calls from VAPI
        all_calls = await sync_user_calls_from_vapi(current_user, db)
        
        # Filter for active statuses
        active_statuses = ["queued", "ringing", "in-progress", "forwarding", "speaking"]
        active_calls = [call for call in all_calls if call.status in active_statuses]
        
        # Sort by started_at or created_at
        active_calls.sort(key=lambda x: x.started_at or x.created_at or datetime.min, reverse=True)
        
        return active_calls
        
    except Exception as e:
        print(f"Error fetching active calls: {str(e)}")
        # Fallback to local database
        active_calls = db.query(Call).filter(
            and_(Call.user_id == current_user.id, Call.status.in_(["queued", "ringing", "in-progress", "forwarding", "speaking"]))
        ).order_by(desc(Call.started_at)).all()
        return active_calls

@app.get("/calls/missed")
async def get_missed_calls(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get missed calls - synced from VAPI"""
    try:
        # Sync calls from VAPI
        all_calls = await sync_user_calls_from_vapi(current_user, db)
        
        # Filter for missed calls (ended reason or status indicates missed)
        missed_calls = [
            call for call in all_calls 
            if call.ended_reason in ["no-answer", "missed", "busy"] or 
               (call.status == "ended" and call.duration == 0)
        ]
        
        # Sort by created_at descending
        missed_calls.sort(key=lambda x: x.created_at or datetime.min, reverse=True)
        
        return missed_calls
        
    except Exception as e:
        print(f"Error fetching missed calls: {str(e)}")
        # Fallback to local database
        missed_calls = db.query(Call).filter(
            and_(Call.user_id == current_user.id, Call.ended_reason.in_(["no-answer", "missed", "busy"]))
        ).order_by(desc(Call.created_at)).all()
        return missed_calls

@app.get("/calls/recordings")
async def get_call_recordings(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get calls with recordings - synced from VAPI and fetch recordings directly from VAPI API"""
    try:
        # Get user's agents to find their assistant IDs
        user_agents = db.query(Agent).filter(Agent.user_id == current_user.id).all()
        
        all_recordings = []
        
        # Fetch recordings from VAPI for each user's assistant
        for agent in user_agents:
            if agent.vapi_id:
                try:
                    # Fetch calls for this specific assistant from VAPI
                    vapi_calls = await call_vapi_api(f"/call?assistantId={agent.vapi_id}")
                    
                    if isinstance(vapi_calls, list):
                        for vapi_call in vapi_calls:
                            # Only include calls that have recordings
                            if vapi_call.get("recordingUrl"):
                                # Create or update local call record
                                local_call = db.query(Call).filter(Call.vapi_id == vapi_call.get("id")).first()
                                
                                if not local_call:
                                    # Create new call record
                                    call_id = str(uuid.uuid4())
                                    local_call = Call(
                                        id=call_id,
                                        vapi_id=vapi_call.get("id"),
                                        user_id=current_user.id,
                                        agent_id=agent.id,
                                        customer_number=vapi_call.get("customer", {}).get("number") if vapi_call.get("customer") else "Unknown",
                                        direction=vapi_call.get("type", "unknown"),
                                        status=vapi_call.get("status", "completed"),
                                        duration=vapi_call.get("duration"),
                                        cost=vapi_call.get("cost"),
                                        recording_url=vapi_call.get("recordingUrl"),
                                        transcript=vapi_call.get("transcript", ""),
                                        ended_reason=vapi_call.get("endedReason"),
                                        started_at=datetime.fromisoformat(vapi_call.get("startedAt").replace('Z', '+00:00')) if vapi_call.get("startedAt") else None,
                                        ended_at=datetime.fromisoformat(vapi_call.get("endedAt").replace('Z', '+00:00')) if vapi_call.get("endedAt") else None,
                                        created_at=datetime.fromisoformat(vapi_call.get("createdAt").replace('Z', '+00:00')) if vapi_call.get("createdAt") else datetime.utcnow(),
                                        updated_at=datetime.fromisoformat(vapi_call.get("updatedAt").replace('Z', '+00:00')) if vapi_call.get("updatedAt") else datetime.utcnow()
                                    )
                                    db.add(local_call)
                                else:
                                    # Update existing call with latest data
                                    local_call.recording_url = vapi_call.get("recordingUrl", local_call.recording_url)
                                    local_call.transcript = vapi_call.get("transcript", local_call.transcript)
                                    local_call.status = vapi_call.get("status", local_call.status)
                                    local_call.duration = vapi_call.get("duration", local_call.duration)
                                    local_call.cost = vapi_call.get("cost", local_call.cost)
                                    local_call.ended_reason = vapi_call.get("endedReason", local_call.ended_reason)
                                    local_call.updated_at = datetime.utcnow()
                                
                                # Add agent name for response
                                local_call.agent_name = agent.name
                                all_recordings.append(local_call)
                                
                except Exception as e:
                    print(f"Error fetching recordings for agent {agent.name} (VAPI ID: {agent.vapi_id}): {str(e)}")
                    continue
        
        # Commit all database changes
        db.commit()
        
        # Remove duplicates and sort by ended_at or created_at descending
        unique_recordings = {call.vapi_id: call for call in all_recordings}.values()
        sorted_recordings = sorted(unique_recordings, key=lambda x: x.ended_at or x.created_at or datetime.min, reverse=True)
        
        # Add agent names to the response by joining with agent data
        for recording in sorted_recordings:
            if recording.agent_id:
                agent = next((a for a in user_agents if a.id == recording.agent_id), None)
                if agent:
                    # Add agent_name as a temporary attribute for JSON serialization
                    recording.agent_name = agent.name
                else:
                    recording.agent_name = "Unknown Agent"
            else:
                recording.agent_name = "AI Assistant"
        
        return sorted_recordings
        
    except Exception as e:
        print(f"Error fetching call recordings: {str(e)}")
        # Fallback to local database
        recorded_calls = db.query(Call).filter(
            and_(Call.user_id == current_user.id, Call.recording_url.isnot(None))
        ).order_by(desc(Call.ended_at)).all()
        
        # Add agent names to fallback results
        user_agents = db.query(Agent).filter(Agent.user_id == current_user.id).all()
        for recording in recorded_calls:
            if recording.agent_id:
                agent = next((a for a in user_agents if a.id == recording.agent_id), None)
                if agent:
                    recording.agent_name = agent.name
                else:
                    recording.agent_name = "Unknown Agent"
            else:
                recording.agent_name = "AI Assistant"
        
        return recorded_calls

@app.post("/calls/recordings/refresh")
async def refresh_call_recordings(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Force refresh all call recordings from VAPI for user's assistants"""
    try:
        # Get user's agents to find their assistant IDs
        user_agents = db.query(Agent).filter(Agent.user_id == current_user.id).all()
        
        refreshed_count = 0
        
        # Fetch recordings from VAPI for each user's assistant
        for agent in user_agents:
            if agent.vapi_id:
                try:
                    # Fetch calls for this specific assistant from VAPI
                    vapi_calls = await call_vapi_api(f"/call?assistantId={agent.vapi_id}")
                    
                    if isinstance(vapi_calls, list):
                        for vapi_call in vapi_calls:
                            # Only process calls that have recordings
                            if vapi_call.get("recordingUrl"):
                                # Create or update local call record
                                local_call = db.query(Call).filter(Call.vapi_id == vapi_call.get("id")).first()
                                
                                if not local_call:
                                    # Create new call record
                                    call_id = str(uuid.uuid4())
                                    local_call = Call(
                                        id=call_id,
                                        vapi_id=vapi_call.get("id"),
                                        user_id=current_user.id,
                                        agent_id=agent.id,
                                        customer_number=vapi_call.get("customer", {}).get("number") if vapi_call.get("customer") else "Unknown",
                                        direction=vapi_call.get("type", "unknown"),
                                        status=vapi_call.get("status", "completed"),
                                        duration=vapi_call.get("duration"),
                                        cost=vapi_call.get("cost"),
                                        recording_url=vapi_call.get("recordingUrl"),
                                        transcript=vapi_call.get("transcript", ""),
                                        ended_reason=vapi_call.get("endedReason"),
                                        started_at=datetime.fromisoformat(vapi_call.get("startedAt").replace('Z', '+00:00')) if vapi_call.get("startedAt") else None,
                                        ended_at=datetime.fromisoformat(vapi_call.get("endedAt").replace('Z', '+00:00')) if vapi_call.get("endedAt") else None,
                                        created_at=datetime.fromisoformat(vapi_call.get("createdAt").replace('Z', '+00:00')) if vapi_call.get("createdAt") else datetime.utcnow(),
                                        updated_at=datetime.fromisoformat(vapi_call.get("updatedAt").replace('Z', '+00:00')) if vapi_call.get("updatedAt") else datetime.utcnow()
                                    )
                                    db.add(local_call)
                                    refreshed_count += 1
                                else:
                                    # Update existing call with latest data
                                    local_call.recording_url = vapi_call.get("recordingUrl", local_call.recording_url)
                                    local_call.transcript = vapi_call.get("transcript", local_call.transcript)
                                    local_call.status = vapi_call.get("status", local_call.status)
                                    local_call.duration = vapi_call.get("duration", local_call.duration)
                                    local_call.cost = vapi_call.get("cost", local_call.cost)
                                    local_call.ended_reason = vapi_call.get("endedReason", local_call.ended_reason)
                                    local_call.updated_at = datetime.utcnow()
                                    refreshed_count += 1
                                
                except Exception as e:
                    print(f"Error refreshing recordings for agent {agent.name} (VAPI ID: {agent.vapi_id}): {str(e)}")
                    continue
        
        # Commit all database changes
        db.commit()
        
        return {
            "message": f"Successfully refreshed {refreshed_count} call recordings",
            "refreshed_count": refreshed_count,
            "agents_processed": len([a for a in user_agents if a.vapi_id])
        }
        
    except Exception as e:
        print(f"Error refreshing call recordings: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to refresh recordings: {str(e)}")

@app.get("/calls/recordings/by-agent/{agent_id}")
async def get_recordings_by_agent(agent_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get recordings for a specific agent"""
    try:
        # Verify agent belongs to current user
        agent = db.query(Agent).filter(and_(Agent.id == agent_id, Agent.user_id == current_user.id)).first()
        if not agent:
            raise HTTPException(status_code=404, detail="Agent not found")
        
        # Get recordings for this agent
        recordings = db.query(Call).filter(
            and_(
                Call.user_id == current_user.id,
                Call.agent_id == agent_id,
                Call.recording_url.isnot(None)
            )
        ).order_by(desc(Call.ended_at)).all()
        
        return recordings
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching recordings by agent: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch recordings: {str(e)}")

@app.get("/calls/queues")
async def get_call_queues(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get queued calls - synced from VAPI"""
    try:
        # Sync calls from VAPI
        all_calls = await sync_user_calls_from_vapi(current_user, db)
        
        # Filter for queued calls
        queued_calls = [call for call in all_calls if call.status == "queued"]
        
        # Sort by created_at ascending (FIFO queue)
        queued_calls.sort(key=lambda x: x.created_at or datetime.min)
        
        return {
            "queued_calls": queued_calls,
            "queue_length": len(queued_calls),
            "total_wait_time": sum([
                (datetime.utcnow() - (call.created_at or datetime.utcnow())).total_seconds() 
                for call in queued_calls
            ])
        }
        
    except Exception as e:
        print(f"Error fetching call queues: {str(e)}")
        # Fallback to local database
        queued_calls = db.query(Call).filter(
            and_(Call.user_id == current_user.id, Call.status == "queued")
        ).order_by(Call.created_at).all()
        return {
            "queued_calls": queued_calls,
            "queue_length": len(queued_calls),
            "total_wait_time": 0
        }

@app.post("/calls")
async def create_call(call_data: CallCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Create a new outbound call"""
    try:
        # Get agent and phone number
        agent = db.query(Agent).filter(and_(Agent.id == call_data.agent_id, Agent.user_id == current_user.id)).first()
        if not agent:
            raise HTTPException(status_code=404, detail="Agent not found")
        
        # Validate phone number format
        customer_number = call_data.customer_number
        if not customer_number.startswith('+'):
            if len(customer_number) == 10 and customer_number.isdigit():
                customer_number = f"+1{customer_number}"
            else:
                raise HTTPException(status_code=400, detail="Customer phone number must be in E.164 format (e.g., +1234567890)")
        
        vapi_payload = {
            "customer": {"number": customer_number},
            "assistantId": agent.vapi_id or agent.id
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
            customer_number=customer_number,
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

@app.get("/calls/{call_id}")
async def get_call(call_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get a specific call with latest data from VAPI"""
    call = db.query(Call).filter(and_(Call.id == call_id, Call.user_id == current_user.id)).first()
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")
        
@app.get("/calls/vapi/{vapi_id}")
async def get_call_by_vapi_id(vapi_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get a call by its VAPI ID"""
    call = db.query(Call).filter(and_(Call.vapi_id == vapi_id, Call.user_id == current_user.id)).first()
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")
    
    try:
        # Try to get updated info from VAPI
        if call.vapi_id:
            vapi_call = await call_vapi_api(f"/call/{call.vapi_id}")
            
            if vapi_call:
                # Update local call with latest VAPI data
                call.status = vapi_call.get("status", call.status)
                call.duration = vapi_call.get("duration", call.duration)
                call.cost = vapi_call.get("cost", call.cost)
                call.recording_url = vapi_call.get("recordingUrl", call.recording_url)
                call.transcript = vapi_call.get("transcript", call.transcript)
                call.ended_reason = vapi_call.get("endedReason", call.ended_reason)
                
                if vapi_call.get("endedAt") and not call.ended_at:
                    call.ended_at = datetime.fromisoformat(vapi_call.get("endedAt").replace('Z', '+00:00'))
                
                call.updated_at = datetime.utcnow()
                db.commit()
                
    except Exception as e:
        print(f"Failed to sync call from VAPI: {str(e)}")
        # Continue with local data
    
    return call

@app.put("/calls/{call_id}")
async def update_call(
    call_id: str, 
    call_update: dict, 
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """Update a call with new data"""
    call = db.query(Call).filter(and_(Call.id == call_id, Call.user_id == current_user.id)).first()
    
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")
    
    # Update call fields
    for field, value in call_update.items():
        if hasattr(call, field):
            setattr(call, field, value)
    
    call.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(call)
    
    return call

@app.post("/calls/{call_id}/sync")
async def sync_call_with_vapi(
    call_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Force sync a call with VAPI to get latest data including recording URL"""
    call = db.query(Call).filter(and_(Call.id == call_id, Call.user_id == current_user.id)).first()
    
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")
    
    if not call.vapi_id:
        raise HTTPException(status_code=400, detail="Call has no VAPI ID to sync with")
    
    try:
        vapi_call = await call_vapi_api(f"/call/{call.vapi_id}")
        if not vapi_call:
            raise HTTPException(status_code=404, detail="Call not found in VAPI")
            
        # Update with latest data from VAPI
        call.status = vapi_call.get("status", call.status)
        call.duration = vapi_call.get("duration", call.duration)
        call.cost = vapi_call.get("cost", call.cost)
        call.recording_url = vapi_call.get("recordingUrl", call.recording_url)
        call.transcript = vapi_call.get("transcript", call.transcript)
        call.ended_reason = vapi_call.get("endedReason", call.ended_reason)
        
        if vapi_call.get("endedAt") and not call.ended_at:
            call.ended_at = datetime.fromisoformat(vapi_call.get("endedAt").replace('Z', '+00:00'))
        
        call.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(call)
        
        return {
            "message": "Call successfully synced with VAPI",
            "call": call
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Failed to sync call from VAPI: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to sync with VAPI: {str(e)}")

@app.patch("/calls/{call_id}/end")
async def end_call(call_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """End a call manually"""
    call = db.query(Call).filter(and_(Call.id == call_id, Call.user_id == current_user.id)).first()
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")
    
    if call.status in ["completed", "ended", "failed"]:
        raise HTTPException(status_code=400, detail="Call is already ended")
    
    try:
        # End call in VAPI
        if call.vapi_id:
            await call_vapi_api(f"/call/{call.vapi_id}/end", method="POST")
        
        # Update local call
        call.status = "ended"
        call.ended_at = datetime.utcnow()
        call.ended_reason = "manually-ended"
        call.updated_at = datetime.utcnow()
        
        db.commit()
        
        return {
            "message": "Call ended successfully",
            "call": call
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to end call: {str(e)}")

@app.get("/calls/{call_id}/transcript")
async def get_call_transcript(call_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get the transcript for a specific call"""
    call = db.query(Call).filter(and_(Call.id == call_id, Call.user_id == current_user.id)).first()
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")
    
    try:
        # Try to get latest transcript from VAPI
        if call.vapi_id:
            vapi_call = await call_vapi_api(f"/call/{call.vapi_id}")
            if vapi_call and vapi_call.get("transcript"):
                call.transcript = vapi_call.get("transcript")
                call.updated_at = datetime.utcnow()
                db.commit()
        
        return {
            "call_id": call.id,
            "transcript": call.transcript,
            "has_transcript": bool(call.transcript and call.transcript.strip())
        }
        
    except Exception as e:
        print(f"Failed to get transcript from VAPI: {str(e)}")
        return {
            "call_id": call.id,
            "transcript": call.transcript,
            "has_transcript": bool(call.transcript and call.transcript.strip())
        }

@app.get("/calls/{call_id}/recording")
async def get_call_recording(call_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get the recording URL for a specific call"""
    call = db.query(Call).filter(and_(Call.id == call_id, Call.user_id == current_user.id)).first()
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")
    
    try:
        # Try to get latest recording URL from VAPI
        if call.vapi_id:
            vapi_call = await call_vapi_api(f"/call/{call.vapi_id}")
            if vapi_call and vapi_call.get("recordingUrl"):
                call.recording_url = vapi_call.get("recordingUrl")
                call.updated_at = datetime.utcnow()
                db.commit()
        
        return {
            "call_id": call.id,
            "recording_url": call.recording_url,
            "has_recording": bool(call.recording_url and call.recording_url.strip())
        }
        
    except Exception as e:
        print(f"Failed to get recording from VAPI: {str(e)}")
        return {
            "call_id": call.id,
            "recording_url": call.recording_url,
            "has_recording": bool(call.recording_url and call.recording_url.strip())
        }

# Analytics routes
@app.get("/analytics/dashboard")
async def get_dashboard_analytics(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get dashboard analytics data specific to the current user - synced from VAPI"""
    try:
        # Sync calls from VAPI first
        all_calls = await sync_user_calls_from_vapi(current_user, db)
        
        # Calculate statistics from synced data
        total_calls = len(all_calls)
        
        # Calculate total duration and cost
        total_duration = sum([call.duration or 0 for call in all_calls]) / 60  # Convert to minutes
        total_cost = sum([float(call.cost or 0) for call in all_calls])
        
        # Get agent and phone number counts
        total_agents = db.query(Agent).filter(Agent.user_id == current_user.id).count()
        active_agents = db.query(Agent).filter(and_(Agent.user_id == current_user.id, Agent.status == "active")).count()
        active_phone_numbers = db.query(PhoneNumber).filter(and_(PhoneNumber.user_id == current_user.id, PhoneNumber.status == "active")).count()
        
        # Calculate recent calls (last 7 days)
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        recent_calls = len([
            call for call in all_calls 
            if call.created_at and call.created_at >= seven_days_ago
        ])
        
        # Calculate average call duration for completed calls
        completed_calls = [
            call for call in all_calls 
            if call.status in ["completed", "ended"] and call.duration and call.duration > 0
        ]
        
        avg_duration = 0
        if completed_calls:
            avg_duration = sum([call.duration or 0 for call in completed_calls]) / len(completed_calls) / 60  # in minutes
        
        # Calculate today's calls
        today = datetime.utcnow().date()
        calls_today = len([
            call for call in all_calls 
            if call.created_at and call.created_at.date() >= today
        ])
        
        # Calculate this month's calls
        this_month = datetime.utcnow().replace(day=1)
        calls_this_month = len([
            call for call in all_calls 
            if call.created_at and call.created_at >= this_month
        ])
        
        # Calculate active calls
        active_statuses = ["queued", "ringing", "in-progress", "forwarding", "speaking"]
        active_calls_count = len([
            call for call in all_calls 
            if call.status in active_statuses
        ])
        
        # Calculate missed calls
        missed_calls_count = len([
            call for call in all_calls 
            if call.ended_reason in ["no-answer", "missed", "busy"] or 
               (call.status == "ended" and (call.duration or 0) == 0)
        ])
        
        # Calculate recorded calls
        recorded_calls_count = len([
            call for call in all_calls 
            if call.recording_url and call.recording_url.strip()
        ])
        
        # Calculate queued calls
        queued_calls_count = len([
            call for call in all_calls 
            if call.status == "queued"
        ])
        
        # Average cost per call
        avg_cost_per_call = 0
        if total_calls > 0:
            avg_cost_per_call = total_cost / total_calls
        
        return {
            "totalAgents": total_agents,
            "activeAgents": active_agents,
            "totalCalls": total_calls,
            "recentCalls": recent_calls,
            "totalCost": round(total_cost, 2),
            "averageDuration": round(avg_duration, 2),
            "totalCallMinutes": round(total_duration, 2),
            "activePhoneNumbers": active_phone_numbers,
            "averageCostPerCall": round(avg_cost_per_call, 2),
            "callsToday": calls_today,
            "callsThisMonth": calls_this_month,
            "activeCalls": active_calls_count,
            "missedCalls": missed_calls_count,
            "recordedCalls": recorded_calls_count,
            "queuedCalls": queued_calls_count
        }
        
    except Exception as e:
        print(f"Error in dashboard analytics: {str(e)}")
        # Fallback to local database only
        total_calls = db.query(Call).filter(Call.user_id == current_user.id).count()
        total_minutes = db.query(Call).filter(Call.user_id == current_user.id).with_entities(Call.duration).all()
        total_duration = sum([call.duration or 0 for call in total_minutes]) / 60
        
        total_agents = db.query(Agent).filter(Agent.user_id == current_user.id).count()
        active_agents = db.query(Agent).filter(and_(Agent.user_id == current_user.id, Agent.status == "active")).count()
        active_phone_numbers = db.query(PhoneNumber).filter(and_(PhoneNumber.user_id == current_user.id, PhoneNumber.status == "active")).count()
        
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        recent_calls = db.query(Call).filter(
            and_(Call.user_id == current_user.id, Call.created_at >= seven_days_ago)
        ).count()
        
        calls_with_cost = db.query(Call).filter(Call.user_id == current_user.id).with_entities(Call.cost).all()
        total_cost = sum([float(call.cost or 0) for call in calls_with_cost])
        
        completed_calls = db.query(Call).filter(
            and_(Call.user_id == current_user.id, Call.status == "completed", Call.duration != None)
        ).all()
        
        avg_duration = 0
        if completed_calls:
            avg_duration = sum([call.duration or 0 for call in completed_calls]) / len(completed_calls) / 60
        
        today = datetime.utcnow().date()
        calls_today = db.query(Call).filter(
            and_(Call.user_id == current_user.id, Call.created_at >= today)
        ).count()
        
        this_month = datetime.utcnow().replace(day=1)
        calls_this_month = db.query(Call).filter(
            and_(Call.user_id == current_user.id, Call.created_at >= this_month)
        ).count()
        
        avg_cost_per_call = 0
        if total_calls > 0:
            avg_cost_per_call = total_cost / total_calls
        
        return {
            "totalAgents": total_agents,
            "activeAgents": active_agents,
            "totalCalls": total_calls,
            "recentCalls": recent_calls,
            "totalCost": round(total_cost, 2),
            "averageDuration": round(avg_duration, 2),
            "totalCallMinutes": round(total_duration, 2),
            "activePhoneNumbers": active_phone_numbers,
            "averageCostPerCall": round(avg_cost_per_call, 2),
            "callsToday": calls_today,
            "callsThisMonth": calls_this_month,
            "activeCalls": 0,
            "missedCalls": 0,
            "recordedCalls": 0,
            "queuedCalls": 0
        }
  
    

# Webhook endpoint for VAPI events
@app.post("/webhook/vapi")
async def vapi_webhook(webhook_data: dict, db: Session = Depends(get_db)):
    """Handle VAPI webhook events for call logging and status updates"""
    try:
        print(f"Received VAPI webhook: {webhook_data}")
        
        # Extract event type and data
        message_type = webhook_data.get("message", {}).get("type")
        call_data = webhook_data.get("message", {}).get("call", {})
        
        if not call_data:
            print("No call data in webhook")
            return {"status": "ignored", "reason": "no call data"}
        
        vapi_call_id = call_data.get("id")
        if not vapi_call_id:
            print("No call ID in webhook")
            return {"status": "ignored", "reason": "no call ID"}
        
        # Find or create call record
        call = db.query(Call).filter(Call.vapi_id == vapi_call_id).first()
        
        if message_type == "call-start":
            # Create new call record if it doesn't exist
            if not call:
                # Extract phone number and assistant info
                phone_number_data = call_data.get("phoneNumber", {})
                assistant_data = call_data.get("assistant", {})
                customer_data = call_data.get("customer", {})
                
                # Find the phone number in our database
                phone_number = None
                if phone_number_data.get("id"):
                    phone_number = db.query(PhoneNumber).filter(PhoneNumber.vapi_id == phone_number_data.get("id")).first()
                
                # Find the assistant in our database
                agent = None
                if assistant_data.get("id"):
                    agent = db.query(Agent).filter(Agent.vapi_id == assistant_data.get("id")).first()
                
                # Determine user_id from phone number or agent
                user_id = None
                if phone_number:
                    user_id = phone_number.user_id
                elif agent:
                    user_id = agent.user_id
                
                if user_id:
                    call = Call(
                        id=str(uuid.uuid4()),
                        vapi_id=vapi_call_id,
                        user_id=user_id,
                        agent_id=agent.id if agent else None,
                        phone_number_id=phone_number.id if phone_number else None,
                        phone_number=phone_number_data.get("number"),
                        customer_number=customer_data.get("number"),
                        direction=call_data.get("type", "inbound"),
                        status=call_data.get("status", "in-progress"),
                        started_at=datetime.utcnow() if call_data.get("startedAt") else None,
                        created_at=datetime.utcnow()
                    )
                    db.add(call)
                    db.commit()
                    print(f"Created new call record for {vapi_call_id}")
        
        elif message_type in ["call-end", "call-ended"]:
            # Update call with end information
            if call:
                call.status = call_data.get("status", "completed")
                call.ended_reason = call_data.get("endedReason")
                call.ended_at = datetime.utcnow()
                
                # Calculate duration if we have start and end times
                if call.started_at and call.ended_at:
                    duration_seconds = (call.ended_at - call.started_at).total_seconds()
                    call.duration = int(duration_seconds)
                
                # Extract cost information
                if "cost" in call_data:
                    call.cost = str(call_data.get("cost", 0))
                
                # Extract recording URL
                if "recordingUrl" in call_data:
                    call.recording_url = call_data.get("recordingUrl")
                
                # Extract transcript
                if "transcript" in call_data:
                    call.transcript = call_data.get("transcript")
                
                db.commit()
                print(f"Updated call record for {vapi_call_id}")
        
        elif message_type == "transcript":
            # Update transcript if call exists
            if call:
                transcript_text = webhook_data.get("message", {}).get("transcript", "")
                if transcript_text:
                    call.transcript = transcript_text
                    db.commit()
                    print(f"Updated transcript for call {vapi_call_id}")
        
        return {"status": "processed", "call_id": vapi_call_id}
        
    except Exception as e:
        print(f"Error processing VAPI webhook: {str(e)}")
        return {"status": "error", "error": str(e)}

@app.post("/sync/calls")
async def sync_calls_from_vapi(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Sync call data from VAPI for the current user"""
    try:
        # Get user's phone numbers and agents to filter VAPI calls
        user_phone_numbers = db.query(PhoneNumber).filter(PhoneNumber.user_id == current_user.id).all()
        user_agents = db.query(Agent).filter(Agent.user_id == current_user.id).all()
        
        phone_vapi_ids = [pn.vapi_id for pn in user_phone_numbers if pn.vapi_id]
        agent_vapi_ids = [ag.vapi_id for ag in user_agents if ag.vapi_id]
        
        # Fetch calls from VAPI
        vapi_calls = await call_vapi_api("/call")
        
        synced_count = 0
        
        for vapi_call in vapi_calls:
            vapi_call_id = vapi_call.get("id")
            if not vapi_call_id:
                continue
            
            # Check if this call belongs to the user
            call_phone_id = vapi_call.get("phoneNumber", {}).get("id")
            call_assistant_id = vapi_call.get("assistant", {}).get("id")
            
            if call_phone_id not in phone_vapi_ids and call_assistant_id not in agent_vapi_ids:
                continue  # This call doesn't belong to the current user
            
            # Check if we already have this call
            existing_call = db.query(Call).filter(Call.vapi_id == vapi_call_id).first()
            if existing_call:
                continue  # Already synced
            
            # Find matching phone number and agent
            phone_number = next((pn for pn in user_phone_numbers if pn.vapi_id == call_phone_id), None)
            agent = next((ag for ag in user_agents if ag.vapi_id == call_assistant_id), None)
            
            # Create call record
            new_call = Call(
                id=str(uuid.uuid4()),
                vapi_id=vapi_call_id,
                user_id=current_user.id,
                agent_id=agent.id if agent else None,
                phone_number_id=phone_number.id if phone_number else None,
                phone_number=vapi_call.get("phoneNumber", {}).get("number"),
                customer_number=vapi_call.get("customer", {}).get("number"),
                direction=vapi_call.get("type", "inbound"),
                status=vapi_call.get("status", "completed"),
                duration=vapi_call.get("duration", 0),
                cost=str(vapi_call.get("cost", 0)) if vapi_call.get("cost") else None,
                recording_url=vapi_call.get("recordingUrl"),
                transcript=vapi_call.get("transcript"),
                ended_reason=vapi_call.get("endedReason"),
                started_at=datetime.fromisoformat(vapi_call.get("startedAt").replace("Z", "+00:00")) if vapi_call.get("startedAt") else None,
                ended_at=datetime.fromisoformat(vapi_call.get("endedAt").replace("Z", "+00:00")) if vapi_call.get("endedAt") else None,
                created_at=datetime.fromisoformat(vapi_call.get("createdAt").replace("Z", "+00:00")) if vapi_call.get("createdAt") else datetime.utcnow()
            )
            
            db.add(new_call)
            synced_count += 1
        
        db.commit()
        
        return {
            "success": True,
            "message": f"Synced {synced_count} calls from VAPI",
            "synced_count": synced_count
        }
        
    except Exception as e:
        print(f"Error syncing calls from VAPI: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to sync calls: {str(e)}")

# Health check
@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

@app.get("/health/vapi")
async def vapi_health_check():
    """Check Vapi API connectivity"""
    try:
        # Test Vapi API connection
        assistants = await call_vapi_api("/assistant")
        return {
            "status": "connected",
            "message": "Vapi API is accessible",
            "assistants_count": len(assistants) if isinstance(assistants, list) else 0,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Vapi API connection failed: {str(e)}",
            "timestamp": datetime.utcnow().isoformat()
        }

@app.get("/health/voice-check")
async def voice_check(current_user: User = Depends(get_current_user)):
    """Run a quick check on voice compatibility with VAPI"""
    try:
        # Test a few key voice options (one from each provider)
        test_voices = [
            {"provider": "openai", "voice_id": "alloy", "description": "OpenAI Alloy"},
            {"provider": "azure", "voice_id": "en-US-ChristopherNeural", "description": "Azure Christopher"},
            {"provider": "11labs", "voice_id": "29vD33N1CtxCmqQRPOHJ", "description": "11Labs Male Voice (Custom)"},
            {"provider": "11labs", "voice_id": "qBDvhofpxp92JgXJxDjB", "description": "11Labs Female Voice (Custom)"}
        ]
        
        results = []
        
        # Create a simple test payload
        test_payload = {
            "name": "voice-health-check",
            "firstMessage": "Voice health check test.",
            "model": {
                "provider": "openai",
                "model": "gpt-4o",
                "messages": [{"role": "system", "content": "Voice health check."}]
            },
            "transcriber": {
                "provider": "deepgram",
                "model": "nova-3",
                "language": "en-US"
            }
        }
        
        # Test each voice option
        for voice in test_voices:
            result = {
                "provider": voice["provider"],
                "voice_id": voice["voice_id"],
                "description": voice["description"],
                "status": "failed",
                "message": None
            }
            
            try:
                # Set the voice configuration
                test_payload["voice"] = {
                    "provider": voice["provider"],
                    "voiceId": voice["voice_id"]
                }
                
                # Add Flash v2.5 model parameters for ElevenLabs
                if voice["provider"] == "11labs":
                    test_payload["voice"].update({
                        "model": "eleven_flash_v2_5",
                        "stability": 0.5,
                        "similarityBoost": 0.75
                    })
                
                # Try to create a temporary agent with this voice
                vapi_agent = await call_vapi_api("/assistant", method="POST", data=test_payload)
                
                # If we get here, it worked!
                result["status"] = "ok"
                result["message"] = "Voice compatible with VAPI"
                
                # Clean up the temporary agent
                if vapi_agent and vapi_agent.get("id"):
                    await call_vapi_api(f"/assistant/{vapi_agent['id']}", method="DELETE")
                
            except Exception as e:
                # This voice option didn't work
                result["message"] = str(e)
            
            results.append(result)
        
        # Determine overall status based on individual test results
        overall_status = "ok"
        if not any(r["status"] == "ok" for r in results):
            overall_status = "critical"  # All voice providers failed
        elif any(r["status"] == "failed" for r in results):
            overall_status = "degraded"  # Some voice providers failed
        
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "overall_status": overall_status,
            "voice_checks": results,
            "message": "Voice compatibility check completed",
            "recommended_provider": next((r["provider"] for r in results if r["status"] == "ok"), "openai")
        }
        
    except Exception as e:
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "overall_status": "error",
            "message": f"Voice check failed: {str(e)}"
        }

# Root endpoint
@app.get("/")
async def root():
    return {"message": "EmployAI API", "version": "1.0.0"}

@app.post("/webhook/vapi")
async def vapi_webhook(request: Request, db: Session = Depends(get_db)):
    """Handle VAPI webhook events for real-time call updates"""
    try:
        data = await request.json()
        message_type = data.get("message", {}).get("type")
        call_data = data.get("message", {}).get("call", {})
        
        if not call_data or not message_type:
            return {"status": "ignored", "reason": "no call data or message type"}
        
        vapi_id = call_data.get("id")
        if not vapi_id:
            return {"status": "ignored", "reason": "no VAPI call ID"}
        
        # Find the call in our database
        call = db.query(Call).filter(Call.vapi_id == vapi_id).first()
        
        if not call:
            # This might be a call initiated outside our system
            # Try to create a record if we can determine the user
            phone_number = call_data.get("phoneNumber", {}).get("number")
            if phone_number:
                # Try to find phone number in our system
                local_phone = db.query(PhoneNumber).filter(PhoneNumber.number == phone_number).first()
                if local_phone:
                    # Create a new call record
                    call_id = str(uuid.uuid4())
                    call = Call(
                        id=call_id,
                        vapi_id=vapi_id,
                        user_id=local_phone.user_id,
                        phone_number_id=local_phone.id,
                        customer_number=call_data.get("customer", {}).get("number", ""),
                        direction="inbound" if call_data.get("type") == "inboundPhoneCall" else "outbound",
                        status=call_data.get("status", "in-progress"),
                        started_at=datetime.utcnow()
                    )
                    
                    if call_data.get("assistantId"):
                        agent = db.query(Agent).filter(
                            and_(Agent.vapi_id == call_data.get("assistantId"), Agent.user_id == local_phone.user_id)
                        ).first()
                        if agent:
                            call.agent_id = agent.id
                    
                    db.add(call)
                    db.commit()
                    db.refresh(call)
            
            if not call:
                return {"status": "ignored", "reason": "call not found in system"}
        
        # Update call based on message type
        if message_type == "status-update":
            call.status = call_data.get("status", call.status)
            
        elif message_type == "transcript":
            # Append to existing transcript or create new
            new_transcript = call_data.get("transcript", "")
            if new_transcript:
                if call.transcript:
                    call.transcript += "\n" + new_transcript
                else:
                    call.transcript = new_transcript
            
        elif message_type == "hang":
            call.status = "completed"
            call.ended_at = datetime.utcnow()
            call.ended_reason = call_data.get("endedReason", "completed")
            
            # Update final call details
            if call_data.get("duration"):
                call.duration = call_data.get("duration")
            if call_data.get("cost"):
                call.cost = call_data.get("cost")
            if call_data.get("recordingUrl"):
                call.recording_url = call_data.get("recordingUrl")
            if call_data.get("transcript"):
                call.transcript = call_data.get("transcript")
        
        elif message_type == "speech-update":
            # Handle speech updates (optional, for real-time transcription)
            speech_data = call_data.get("speech", {})
            if speech_data.get("text"):
                # Could store intermediate transcripts here
                pass
        
        elif message_type == "function-call":
            # Handle function calls made by the assistant
            function_data = call_data.get("functionCall", {})
            # Log function calls for analytics
            print(f"Function called: {function_data.get('name')} with args: {function_data.get('parameters')}")
        
        # Update timestamp
        call.updated_at = datetime.utcnow()
        
        db.commit()
        
        return {
            "status": "success", 
            "message": f"Processed {message_type} for call {call.id}",
            "call_id": call.id
        }
        
    except Exception as e:
        print(f"Webhook error: {str(e)}")
        return {"status": "error", "message": str(e)}

@app.get("/calls/analytics")
async def get_call_analytics(
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db),
    days: int = 30
):
    """Get call analytics for the user"""
    try:
        # Sync recent calls first
        await sync_user_calls_from_vapi(current_user.id, db)
        
        # Calculate date range
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        # Get calls in date range
        calls = db.query(Call).filter(
            and_(
                Call.user_id == current_user.id,
                Call.started_at >= start_date,
                Call.started_at <= end_date
            )
        ).all()
        
        # Calculate analytics
        total_calls = len(calls)
        successful_calls = len([c for c in calls if c.status == "completed"])
        failed_calls = len([c for c in calls if c.status in ["failed", "no-answer", "busy"]])
        total_duration = sum([c.duration or 0 for c in calls])
        total_cost = sum([c.cost or 0 for c in calls])
        
        # Calls by day
        calls_by_day = {}
        for call in calls:
            day = call.started_at.date().isoformat()
            if day not in calls_by_day:
                calls_by_day[day] = {"inbound": 0, "outbound": 0}
            calls_by_day[day][call.direction] += 1
        
        # Calls by status
        calls_by_status = {}
        for call in calls:
            status = call.status or "unknown"
            calls_by_status[status] = calls_by_status.get(status, 0) + 1
        
        # Top agents by call volume
        agent_stats = {}
        for call in calls:
            if call.agent_id:
                agent = db.query(Agent).filter(Agent.id == call.agent_id).first()
                if agent:
                    agent_name = agent.name
                    if agent_name not in agent_stats:
                        agent_stats[agent_name] = {"total": 0, "successful": 0, "duration": 0}
                    agent_stats[agent_name]["total"] += 1
                    if call.status == "completed":
                        agent_stats[agent_name]["successful"] += 1
                    agent_stats[agent_name]["duration"] += call.duration or 0
        
        return {
            "period_days": days,
            "summary": {
                "total_calls": total_calls,
                "successful_calls": successful_calls,
                "failed_calls": failed_calls,
                "success_rate": round((successful_calls / total_calls * 100) if total_calls > 0 else 0, 2),
                "total_duration_minutes": round(total_duration / 60, 2) if total_duration else 0,
                "average_duration_minutes": round((total_duration / total_calls / 60), 2) if total_calls > 0 else 0,
                "total_cost": round(total_cost, 4) if total_cost else 0,
                "average_cost_per_call": round((total_cost / total_calls), 4) if total_calls > 0 else 0
            },
            "calls_by_day": calls_by_day,
            "calls_by_status": calls_by_status,
            "agent_statistics": agent_stats
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get analytics: {str(e)}")

@app.get("/voice-options")
async def list_voice_options(current_user: User = Depends(get_current_user)):
    """
    List all available voice options and test VAPI compatibility
    """
    try:
        # Define common voice options we want to check
        voice_options = [
            {"provider": "openai", "voice_id": "alloy", "description": "OpenAI Alloy - Neutral"},
            {"provider": "openai", "voice_id": "echo", "description": "OpenAI Echo - Male"},
            {"provider": "openai", "voice_id": "fable", "description": "OpenAI Fable - Male"},
            {"provider": "openai", "voice_id": "nova", "description": "OpenAI Nova - Female"},
            {"provider": "openai", "voice_id": "shimmer", "description": "OpenAI Shimmer - Female"},
            {"provider": "azure", "voice_id": "en-US-ChristopherNeural", "description": "Azure Christopher - Male"},
            {"provider": "azure", "voice_id": "en-US-JennyNeural", "description": "Azure Jenny - Female"},
            {"provider": "11labs", "voice_id": "29vD33N1CtxCmqQRPOHJ", "description": "11Labs Male Voice (Custom)"},
            {"provider": "11labs", "voice_id": "qBDvhofpxp92JgXJxDjB", "description": "11Labs Female Voice (Custom)"},
            {"provider": "11labs", "voice_id": "male-voice", "description": "11Labs Generic Male"},
            {"provider": "11labs", "voice_id": "female-voice", "description": "11Labs Generic Female"},
        ]
        
        results = []
        
        # Create a simple test payload for checking voice compatibility
        test_payload = {
            "name": "voice-test-agent",
            "firstMessage": "This is a test of voice compatibility.",
            "model": {
                "provider": "openai",
                "model": "gpt-4o",
                "messages": [
                    {
                        "role": "system",
                        "content": "You are a voice test agent."
                    }
                ]
            },
            "transcriber": {
                "provider": "deepgram",
                "model": "nova-3",
                "language": "en-US"
            }
        }
        
        # Test each voice option
        for option in voice_options:
            result = {
                "provider": option["provider"],
                "voice_id": option["voice_id"],
                "description": option["description"],
                "compatible": False,
                "error": None
            }
            
            try:
                # Set the voice configuration
                test_payload["voice"] = {
                    "provider": option["provider"],
                    "voiceId": option["voice_id"]
                }
                
                # Add Flash v2.5 model parameters for ElevenLabs
                if option["provider"] == "11labs":
                    test_payload["voice"].update({
                        "model": "eleven_flash_v2_5",
                        "stability": 0.5,
                        "similarityBoost": 0.75
                    })
                
                # Try to create a temporary agent with this voice
                vapi_agent = await call_vapi_api("/assistant", method="POST", data=test_payload)
                
                # If we get here, it worked!
                result["compatible"] = True
                
                # Clean up the temporary agent
                if vapi_agent and vapi_agent.get("id"):
                    await call_vapi_api(f"/assistant/{vapi_agent['id']}", method="DELETE")
                
            except Exception as e:
                # This voice option didn't work
                result["error"] = str(e)
            
            results.append(result)
            
        return {
            "voice_options": results,
            "safe_options": [r for r in results if r["compatible"]],
            "incompatible_options": [r for r in results if not r["compatible"]]
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to test voice options: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

