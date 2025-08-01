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
from api.database import get_db, create_tables, User, Agent, PhoneNumber, Call
from api.auth_utils import AuthUtils, EmailService, GoogleAuth

# Environment variables
VAPI_API_KEY = "b53d60fd-f374-4af6-b586-3d2ff3463efa"
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-change-this-in-production")
VAPI_BASE_URL = "https://api.vapi.ai"

app = FastAPI(title="EmployAI API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
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
        print("WARNING: VAPI_API_KEY not configured")
        raise HTTPException(status_code=500, detail="VAPI API key not configured")
    
    headers = {
        "Authorization": f"Bearer {VAPI_API_KEY}",
        "Content-Type": "application/json"
    }
    
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
                "provider": "openai",
                "model": agent_data.model or "gpt-4",
                "messages": [
                    {
                        "role": "system",
                        "content": agent_data.systemPrompt or f"You are {agent_data.name}, a helpful AI assistant working in the {agent_data.industry} industry. {agent_data.description or ''}"
                    }
                ],
                "temperature": 0.7,
                "maxTokens": 500
            },
            "voice": {
                "provider": "openai",
                "voiceId": agent_data.voice or "alloy"
            },
            "transcriber": {
                "provider": "deepgram",
                "model": "nova-2",
                "language": agent_data.language or "en"
            }
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
        db_field = field.replace("systemPrompt", "system_prompt").replace("firstMessage", "first_message")
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
                
            if agent_data.systemPrompt or agent_data.model:
                vapi_payload["model"] = {
                    "provider": "openai",
                    "model": agent_data.model or agent.model,
                    "messages": [
                        {
                            "role": "system", 
                            "content": agent_data.systemPrompt or agent.system_prompt
                        }
                    ],
                    "temperature": 0.7,
                    "maxTokens": 500
                }
                
            if agent_data.voice:
                vapi_payload["voice"] = {
                    "provider": "openai",
                    "voiceId": agent_data.voice
                }
            
            if agent_data.language:
                vapi_payload["transcriber"] = {
                    "provider": "deepgram",
                    "model": "nova-2", 
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
        # Create a test call via VAPI
        vapi_payload = {
            "assistantId": agent.vapi_id or agent.id,
            "phoneNumberId": test_data.get("phoneNumberId"),  # Optional
            "customer": {
                "number": test_data.get("phoneNumber", "+1234567890")  # Demo number
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
            phone_number=test_data.get("phoneNumber", "+1234567890"),
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

# Call routes
@app.get("/calls")
async def get_calls(
    agent_id: Optional[str] = None,
    limit: Optional[int] = None,
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """Get all calls for the current user with optional filtering"""
    query = db.query(Call).filter(Call.user_id == current_user.id)
    
    # Apply additional filters if provided
    if agent_id:
        query = query.filter(Call.agent_id == agent_id)
    
    # Apply ordering
    query = query.order_by(desc(Call.created_at))
    
    # Apply limit if provided
    if limit:
        query = query.limit(limit)
    
    calls = query.all()
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
    """Get dashboard analytics data specific to the current user"""
    # Get call statistics
    total_calls = db.query(Call).filter(Call.user_id == current_user.id).count()
    total_minutes = db.query(Call).filter(Call.user_id == current_user.id).with_entities(Call.duration).all()
    total_duration = sum([call.duration or 0 for call in total_minutes]) / 60  # Convert to minutes
    
    # Get agent and phone number counts
    total_agents = db.query(Agent).filter(Agent.user_id == current_user.id).count()
    active_agents = db.query(Agent).filter(and_(Agent.user_id == current_user.id, Agent.status == "active")).count()
    active_phone_numbers = db.query(PhoneNumber).filter(and_(PhoneNumber.user_id == current_user.id, PhoneNumber.status == "active")).count()
    
    # Calculate recent calls (last 7 days)
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    recent_calls = db.query(Call).filter(
        and_(Call.user_id == current_user.id, Call.created_at >= seven_days_ago)
    ).count()
    
    # Calculate total cost (sample calculation, adjust as needed)
    calls_with_cost = db.query(Call).filter(Call.user_id == current_user.id).with_entities(Call.cost).all()
    total_cost = sum([call.cost or 0 for call in calls_with_cost])
    
    # Calculate average call duration for completed calls
    completed_calls = db.query(Call).filter(
        and_(Call.user_id == current_user.id, Call.status == "completed", Call.duration != None)
    ).all()
    
    avg_duration = 0
    if completed_calls:
        avg_duration = sum([call.duration or 0 for call in completed_calls]) / len(completed_calls) / 60  # in minutes
    
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
    
    # Average cost per call
    avg_cost_per_call = 0
    if total_calls > 0:
        avg_cost_per_call = total_cost / total_calls
    
    return {
        "totalAgents": total_agents,
        "activeAgents": active_agents,
        "totalCalls": total_calls,
        "recentCalls": recent_calls,
        "totalCost": total_cost,
        "averageDuration": avg_duration,
        "totalCallMinutes": round(total_duration, 2),
        "activePhoneNumbers": active_phone_numbers,
        "averageCostPerCall": round(avg_cost_per_call, 2),
        "callsToday": calls_today,
        "callsThisMonth": calls_this_month
    }

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

# Root endpoint
@app.get("/")
async def root():
    return {"message": "EmployAI API", "version": "1.0.0"}

