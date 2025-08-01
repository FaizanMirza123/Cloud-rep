import re
import secrets
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
import phonenumbers
from phonenumbers import NumberParseException
import os
from datetime import datetime, timedelta

class AuthUtils:
    @staticmethod
    def validate_password(password: str) -> tuple[bool, str]:
        """
        Validate password according to requirements:
        - Minimum 8 characters
        - At least 1 uppercase letter
        - At least 1 special character
        """
        if len(password) < 8:
            return False, "Password must be at least 8 characters long"
        
        if not re.search(r"[A-Z]", password):
            return False, "Password must contain at least one uppercase letter"
        
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
            return False, "Password must contain at least one special character"
        
        return True, "Password is valid"
    
    @staticmethod
    def validate_email(email: str) -> bool:
        """Basic email validation"""
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return re.match(pattern, email) is not None
    
    @staticmethod
    def validate_phone_number(phone_number: str, region: str = None) -> tuple[bool, str]:
        """
        Validate phone number for any country using phonenumbers library
        """
        try:
            parsed_number = phonenumbers.parse(phone_number, region)
            if phonenumbers.is_valid_number(parsed_number):
                formatted_number = phonenumbers.format_number(
                    parsed_number, phonenumbers.PhoneNumberFormat.E164
                )
                return True, formatted_number
            else:
                return False, "Invalid phone number"
        except NumberParseException:
            return False, "Unable to parse phone number"
    
    @staticmethod
    def generate_verification_token() -> str:
        """Generate a secure verification token"""
        return secrets.token_urlsafe(32)
    
    @staticmethod
    def generate_reset_token() -> str:
        """Generate a secure password reset token"""
        return secrets.token_urlsafe(32)
    
    @staticmethod
    def is_token_expired(token_expires: datetime) -> bool:
        """Check if a token has expired"""
        return datetime.utcnow() > token_expires

class EmailService:
    def __init__(self):
        self.smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_username = os.getenv("SMTP_USERNAME", "")
        self.smtp_password = os.getenv("SMTP_PASSWORD", "")
        self.from_email = os.getenv("FROM_EMAIL", "noreply@EmployAI.com")
    
    def send_verification_email(self, to_email: str, verification_token: str) -> bool:
        """Send email verification"""
        try:
            subject = "Verify Your EmployAI Account"
            verification_url = f"{os.getenv('FRONTEND_URL', 'https://cloud-rep-ten.vercel.app')}/verify-email?token={verification_token}"
            
            body = f"""
            <html>
                <body>
                    <h2>Welcome to EmployAI!</h2>
                    <p>Please click the link below to verify your email address:</p>
                    <a href="{verification_url}" style="background-color: #4CAF50; color: white; padding: 14px 20px; text-decoration: none; border-radius: 4px;">Verify Email</a>
                    <p>If you didn't create an account with EmployAI, please ignore this email.</p>
                    <p>This link will expire in 24 hours.</p>
                </body>
            </html>
            """
            
            return self._send_email(to_email, subject, body)
        except Exception as e:
            print(f"Error sending verification email: {e}")
            return False
    
    def send_password_reset_email(self, to_email: str, reset_token: str) -> bool:
        """Send password reset email"""
        try:
            subject = "Reset Your EmployAI Password"
            reset_url = f"{os.getenv('FRONTEND_URL', 'https://cloud-rep-ten.vercel.app')}/reset-password?token={reset_token}"
            
            body = f"""
            <html>
                <body>
                    <h2>Password Reset Request</h2>
                    <p>You requested to reset your password. Click the link below to set a new password:</p>
                    <a href="{reset_url}" style="background-color: #f44336; color: white; padding: 14px 20px; text-decoration: none; border-radius: 4px;">Reset Password</a>
                    <p>If you didn't request this password reset, please ignore this email.</p>
                    <p>This link will expire in 1 hour.</p>
                </body>
            </html>
            """
            
            return self._send_email(to_email, subject, body)
        except Exception as e:
            print(f"Error sending reset email: {e}")
            return False
    
    def _send_email(self, to_email: str, subject: str, body: str) -> bool:
        """Send email using SMTP"""
        try:
            msg = MIMEMultipart()
            msg['From'] = self.from_email
            msg['To'] = to_email
            msg['Subject'] = subject
            
            msg.attach(MIMEText(body, 'html'))
            
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_username, self.smtp_password)
                server.send_message(msg)
            
            return True
        except Exception as e:
            print(f"Error sending email: {e}")
            return False

class GoogleAuth:
    def __init__(self):
        self.client_id = os.getenv("GOOGLE_CLIENT_ID", "")
        self.client_secret = os.getenv("GOOGLE_CLIENT_SECRET", "")
    
    async def verify_google_token(self, token: str) -> Optional[dict]:
        """Verify Google OAuth token and return user info"""
        try:
            import httpx
            
            # Verify token with Google
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"https://www.googleapis.com/oauth2/v1/userinfo?access_token={token}"
                )
                
                if response.status_code == 200:
                    user_info = response.json()
                    return {
                        "google_id": user_info.get("id"),
                        "email": user_info.get("email"),
                        "name": user_info.get("name"),
                        "verified_email": user_info.get("verified_email", False)
                    }
                return None
        except Exception as e:
            print(f"Error verifying Google token: {e}")
            return None
