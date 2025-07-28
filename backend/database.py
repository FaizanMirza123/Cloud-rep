from sqlalchemy import create_engine, Column, String, DateTime, Boolean, Text, Integer
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os

# Database URL
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./EmployAI.db")

# Create engine
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

# Create SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create Base class
Base = declarative_base()

# Database Models
class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    phone = Column(String, nullable=True)
    password_hash = Column(String, nullable=False)
    is_verified = Column(Boolean, default=False)
    verification_token = Column(String, nullable=True)
    reset_token = Column(String, nullable=True)
    reset_token_expires = Column(DateTime, nullable=True)
    google_id = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Agent(Base):
    __tablename__ = "agents"
    
    id = Column(String, primary_key=True, index=True)
    vapi_id = Column(String, unique=True, nullable=True)  # VAPI assistant ID
    user_id = Column(String, nullable=False)
    name = Column(String, nullable=False)
    industry = Column(String, nullable=False)
    role = Column(String, default="Assistant")
    description = Column(Text, nullable=True)
    system_prompt = Column(Text, nullable=True)
    first_message = Column(Text, nullable=True)
    voice = Column(String, default="alloy")
    model = Column(String, default="gpt-4")
    language = Column(String, default="en-US")
    status = Column(String, default="creating")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class PhoneNumber(Base):
    __tablename__ = "phone_numbers"
    
    id = Column(String, primary_key=True, index=True)
    vapi_id = Column(String, unique=True, nullable=True)  # VAPI phone number ID
    user_id = Column(String, nullable=False)
    number = Column(String, nullable=False)
    name = Column(String, nullable=False)
    country = Column(String, default="US")
    area_code = Column(String, nullable=True)
    provider = Column(String, default="byo-phone-number")
    type = Column(String, default="voice")
    status = Column(String, default="active")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Call(Base):
    __tablename__ = "calls"
    
    id = Column(String, primary_key=True, index=True)
    vapi_id = Column(String, unique=True, nullable=True)  # VAPI call ID
    user_id = Column(String, nullable=False)
    agent_id = Column(String, nullable=True)
    phone_number_id = Column(String, nullable=True)
    phone_number = Column(String, nullable=True)  # The actual phone number
    customer_number = Column(String, nullable=True)
    direction = Column(String, nullable=False)  # inbound/outbound
    type = Column(String, default="call")  # call/test
    status = Column(String, nullable=False)
    duration = Column(Integer, default=0)  # seconds
    cost = Column(String, nullable=True)
    recording_url = Column(String, nullable=True)
    transcript = Column(Text, nullable=True)
    ended_reason = Column(String, nullable=True)
    started_at = Column(DateTime, nullable=True)
    ended_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Create tables
def create_tables():
    Base.metadata.create_all(bind=engine)

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
