#!/usr/bin/env python3
"""
Add sample transcript data to test the transcript UI
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import get_db, Call, Agent, User
from datetime import datetime, timedelta
import uuid

def add_sample_transcripts():
    """Add sample calls with transcripts for testing"""
    db = next(get_db())
    
    # Find a user to add calls to
    user = db.query(User).first()
    if not user:
        print("No users found. Please create a user first.")
        return
    
    # Find an agent
    agent = db.query(Agent).filter(Agent.user_id == user.id).first()
    if not agent:
        print("No agents found. Please create an agent first.")
        return
    
    # Sample transcripts in VAPI format
    sample_transcripts = [
        "AI: Hello! How can I help you today?\nUser: Hi, I'm interested in your services.\nAI: Great! I'd be happy to tell you about our offerings. What specific service are you looking for?\nUser: I need help with customer support automation.\nAI: Perfect! Our AI customer support can handle up to 80% of common inquiries automatically. Would you like to schedule a demo?\nUser: Yes, that sounds good. When are you available?\nAI: I can schedule you for this week. Are mornings or afternoons better for you?\nUser: Mornings work better.\nAI: Excellent! I'll send you a calendar link. Is there anything else I can help you with today?\nUser: No, that's all. Thank you!\nAI: You're welcome! Have a great day!",
        
        "AI: Hi there! Thanks for calling. How can I assist you?\nUser: I'm having trouble with my account.\nAI: I'm sorry to hear that. Can you tell me more about the specific issue you're experiencing?\nUser: I can't log in to my dashboard.\nAI: Let me help you with that. Have you tried resetting your password?\nUser: No, not yet.\nAI: I can send you a password reset link right now. What email address should I send it to?\nUser: john@example.com\nAI: Perfect! I've sent the reset link to john@example.com. You should receive it within a few minutes. Is there anything else I can help you with?\nUser: That should do it. Thanks!\nAI: You're very welcome! Don't hesitate to call if you need any more assistance.",
        
        "AI: Good afternoon! How may I help you today?\nUser: I want to cancel my subscription.\nAI: I understand you'd like to cancel. Before I process that, may I ask what's prompting this decision? Perhaps there's something we can address.\nUser: It's too expensive for what I'm getting.\nAI: I appreciate your feedback. We do have some lower-tier plans that might better fit your needs. Would you be interested in hearing about those options?\nUser: What are the options?\nAI: We have a basic plan at $29 per month that includes core features, and a standard plan at $49 that adds advanced analytics. Both are less than your current premium plan.\nUser: The basic plan sounds interesting. Can I switch to that instead?\nAI: Absolutely! I can make that change for you right now. You'll see the new rate on your next billing cycle. Is that acceptable?\nUser: Yes, that works. Thank you for the help!\nAI: My pleasure! Your plan has been updated. Is there anything else I can assist you with today?\nUser: No, that's everything. Thanks again!\nAI: Have a wonderful day!"
    ]
    
    # Create sample calls with transcripts
    for i, transcript in enumerate(sample_transcripts):
        call_id = str(uuid.uuid4())
        vapi_id = f"sample_call_{i+1}_{uuid.uuid4()}"
        
        call = Call(
            id=call_id,
            vapi_id=vapi_id,
            user_id=user.id,
            agent_id=agent.id,
            phone_number=f"+155500{i+1:04d}",
            customer_number=f"+155500{i+1:04d}",
            direction="inbound",
            status="completed",
            duration=300 + (i * 60),  # 5-7 minutes
            cost=0.25 + (i * 0.1),
            transcript=transcript,
            ended_reason="customer-ended-call",
            started_at=datetime.utcnow() - timedelta(days=i+1, hours=i*2),
            ended_at=datetime.utcnow() - timedelta(days=i+1, hours=i*2-1),
            created_at=datetime.utcnow() - timedelta(days=i+1),
            updated_at=datetime.utcnow()
        )
        
        db.add(call)
        print(f"Added sample call {i+1} with transcript")
    
    db.commit()
    print(f"Successfully added {len(sample_transcripts)} sample calls with transcripts")
    print(f"User: {user.email}")
    print(f"Agent: {agent.name}")

if __name__ == "__main__":
    add_sample_transcripts()
