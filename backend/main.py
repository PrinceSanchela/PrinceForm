import os
import logging
import smtplib
import random
import csv
import io
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from contextlib import asynccontextmanager
from typing import List, Dict, Any
from datetime import datetime, timedelta, timezone
import secrets
import re

from fastapi import FastAPI, Request, HTTPException, status, UploadFile, File, Response, BackgroundTasks
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse
from fastapi.middleware.cors import CORSMiddleware

from .database import db
from .models import FormModel, ResponseModel, UserModel, ResetCodeModel
from .config import settings

is_prod = os.getenv("ENV") == "production"

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("prince_form.main")

# Password hashing and session helper functions
import hashlib
import os

def hash_password(password: str) -> str:
    salt = os.urandom(16)
    db_hash = hashlib.pbkdf2_hmac('sha256', password.encode(), salt, 100000)
    return salt.hex() + ":" + db_hash.hex()

def verify_password(password: str, hashed_password: str) -> bool:
    try:
        salt_hex, hash_hex = hashed_password.split(":")
        salt = bytes.fromhex(salt_hex)
        db_hash = hashlib.pbkdf2_hmac('sha256', password.encode(), salt, 100000)
        return db_hash.hex() == hash_hex
    except Exception:
        return False

def hash_otp_code(code: str) -> str:
    """Hash the OTP code using SHA-256 for secure storage."""
    return hashlib.sha256(code.encode('utf-8')).hexdigest()

def send_smtp_signup_otp_email(to_email: str, code: str):
    """Send a signup email verification OTP using SMTP credentials. Falls back to logging if unconfigured."""
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.warning(f"[MOCK MAIL] SMTP is not configured. Signup verification code for {to_email}: {code}")
        return
        
    try:
        # Create message container
        msg = MIMEMultipart('alternative')
        msg['Subject'] = "Verify your Prince Form Email Address"
        msg['From'] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_USER}>"
        msg['To'] = to_email
        msg['Reply-To'] = "contact.princeform@gmail.com"
        
        # HTML body template
        html = f"""
        <html>
        <body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; padding: 30px; margin: 0;">
            <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width: 500px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
                <tr>
                    <td style="background-color: #673ab7; padding: 24px; text-align: center;">
                        <h1 style="color: #ffffff; font-size: 24px; font-weight: 700; margin: 0; font-family: sans-serif;">Prince Form</h1>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 32px 24px; color: #1e293b;">
                        <h2 style="font-size: 20px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 16px;">Verify Your Email Address</h2>
                        <p style="font-size: 15px; line-height: 1.6; margin-bottom: 24px; color: #475569;">
                            Thank you for creating an account with Prince Form. Use the verification code below to complete your registration. This code will expire in <strong>10 minutes</strong>.
                        </p>
                        
                        <div style="background-color: #f1f5f9; border-radius: 12px; padding: 18px; text-align: center; margin-bottom: 24px;">
                            <span style="font-size: 32px; font-weight: 800; color: #673ab7; letter-spacing: 4px; font-family: monospace;">{code}</span>
                        </div>
                        
                        <div style="background-color: #f8fafc; border-left: 4px solid #673ab7; border-radius: 6px; padding: 14px; margin-bottom: 24px; font-size: 13px; color: #475569; line-height: 1.5;">
                            <strong>No-Reply Notice:</strong> This email was sent from a notification-only address (princeform.noreply@gmail.com) that cannot receive incoming mail. Please do not reply directly to this message.
                        </div>
                        
                        <p style="font-size: 13px; line-height: 1.5; color: #64748b; margin-top: 10px;">
                            If you have questions or need assistance, please contact support at <a href="mailto:contact.princeform@gmail.com" style="color: #673ab7; text-decoration: none;">contact.princeform@gmail.com</a>.
                        </p>
                    </td>
                </tr>
                <tr>
                    <td style="background-color: #f8fafc; padding: 16px 24px; border-top: 1px solid #f1f5f9; text-align: center; font-size: 12px; color: #94a3b8;">
                        &copy; 2026 Prince Form. All rights reserved.
                    </td>
                </tr>
            </table>
        </body>
        </html>
        """
        
        msg.attach(MIMEText(html, 'html'))
        
        # Connect and send
        if settings.SMTP_PORT == 465:
            server = smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10)
        else:
            server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10)
            server.starttls()
            
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.sendmail(settings.SMTP_USER, to_email, msg.as_string())
        server.quit()
        logger.info(f"Successfully sent SMTP signup verification email to {to_email}")
        
    except Exception as e:
        logger.error(f"Failed to send SMTP signup verification email to {to_email}: {str(e)}")

def send_smtp_reset_email(to_email: str, code: str):
    """Send a password reset email using SMTP credentials. Falls back to logging if unconfigured."""
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.warning(f"[MOCK MAIL] SMTP is not configured. Reset code for {to_email}: {code}")
        return
        
    try:
        # Create message container
        msg = MIMEMultipart('alternative')
        msg['Subject'] = "Reset your Prince Form Password"
        msg['From'] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_USER}>"
        msg['To'] = to_email
        msg['Reply-To'] = "contact.princeform@gmail.com"
        
        # HTML body template
        html = f"""
        <html>
        <body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; padding: 30px; margin: 0;">
            <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width: 500px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
                <tr>
                    <td style="background-color: #0077ff; padding: 24px; text-align: center;">
                        <h1 style="color: #ffffff; font-size: 24px; font-weight: 700; margin: 0; font-family: sans-serif;">Prince Form</h1>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 32px 24px; color: #1e293b;">
                        <h2 style="font-size: 20px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 16px;">Password Reset Request</h2>
                        <p style="font-size: 15px; line-height: 1.6; margin-bottom: 24px; color: #475569;">
                            We received a request to reset your account password. Use the verification code below to authorize the change. This code will expire in <strong>10 minutes</strong>.
                        </p>
                        
                        <div style="background-color: #f1f5f9; border-radius: 12px; padding: 18px; text-align: center; margin-bottom: 24px;">
                            <span style="font-size: 32px; font-weight: 800; color: #0077ff; letter-spacing: 4px; font-family: monospace;">{code}</span>
                        </div>
                        
                        <div style="background-color: #f8fafc; border-left: 4px solid #0077ff; border-radius: 6px; padding: 14px; margin-bottom: 24px; font-size: 13px; color: #475569; line-height: 1.5;">
                            <strong>No-Reply Notice:</strong> This email was sent from a notification-only address (princeform.noreply@gmail.com) that cannot receive incoming mail. Please do not reply directly to this message.
                        </div>
                        
                        <p style="font-size: 13px; line-height: 1.5; color: #64748b; margin-top: 10px;">
                            If you have questions, please contact support at <a href="mailto:contact.princeform@gmail.com" style="color: #0077ff; text-decoration: none;">contact.princeform@gmail.com</a>.
                        </p>
                    </td>
                </tr>
                <tr>
                    <td style="background-color: #f8fafc; padding: 16px 24px; border-top: 1px solid #f1f5f9; text-align: center; font-size: 12px; color: #94a3b8;">
                        &copy; 2026 Prince Form. All rights reserved.
                    </td>
                </tr>
            </table>
        </body>
        </html>
        """
        
        msg.attach(MIMEText(html, 'html'))
        
        # Connect and send
        if settings.SMTP_PORT == 465:
            server = smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10)
        else:
            server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10)
            server.starttls()
            
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.sendmail(settings.SMTP_USER, to_email, msg.as_string())
        server.quit()
        logger.info(f"Successfully sent SMTP verification email to {to_email}")
        
    except Exception as e:
        logger.error(f"Failed to send SMTP email to {to_email}: {str(e)}")

def send_smtp_password_changed_email(to_email: str, username: str):
    """Send an account security confirmation email when the password is successfully updated. Falls back to logging if unconfigured."""
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.warning(f"[MOCK MAIL] SMTP is not configured. Password changed notification for {to_email}")
        return
        
    try:
        # Create message container
        msg = MIMEMultipart('alternative')
        msg['Subject'] = "Security Alert: Prince Form Password Changed"
        msg['From'] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_USER}>"
        msg['To'] = to_email
        msg['Reply-To'] = "contact.princeform@gmail.com"
        
        # HTML body template
        html = f"""
        <html>
        <body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; padding: 30px; margin: 0;">
            <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width: 500px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
                <tr>
                    <td style="background-color: #ef4444; padding: 24px; text-align: center;">
                        <h1 style="color: #ffffff; font-size: 24px; font-weight: 700; margin: 0; font-family: sans-serif;">Security Alert</h1>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 32px 24px; color: #1e293b;">
                        <h2 style="font-size: 20px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 16px;">Password Changed Successfully</h2>
                        <p style="font-size: 15px; line-height: 1.6; margin-bottom: 18px; color: #475569;">
                            Hi <strong>{username}</strong>,
                        </p>
                        <p style="font-size: 15px; line-height: 1.6; margin-bottom: 24px; color: #475569;">
                            The password for your Prince Form account has been successfully reset.
                        </p>
                        
                        <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; border-radius: 6px; padding: 16px; margin-bottom: 24px;">
                            <strong style="color: #991b1b; font-size: 14px; display: block; margin-bottom: 4px;">Didn't authorize this change?</strong>
                            <span style="color: #b91c1c; font-size: 13px; line-height: 1.4; display: block;">
                                If you did not request this update, please contact support immediately at <a href="mailto:contact.princeform@gmail.com" style="color: #ef4444; text-decoration: underline;">contact.princeform@gmail.com</a> to lock and recover your account.
                            </span>
                        </div>
                        
                        <div style="background-color: #f8fafc; border-left: 4px solid #ef4444; border-radius: 6px; padding: 14px; margin-bottom: 24px; font-size: 13px; color: #475569; line-height: 1.5;">
                            <strong>No-Reply Notice:</strong> This email was sent from a notification-only address (princeform.noreply@gmail.com) that cannot receive incoming mail. Please do not reply directly to this message.
                        </div>
                        
                        <p style="font-size: 13px; line-height: 1.5; color: #64748b; margin-bottom: 0;">
                            This is an automated security notification. For any inquiries, write to us at <a href="mailto:contact.princeform@gmail.com" style="color: #0077ff; text-decoration: none;">contact.princeform@gmail.com</a>.
                        </p>
                    </td>
                </tr>
                <tr>
                    <td style="background-color: #f8fafc; padding: 16px 24px; border-top: 1px solid #f1f5f9; text-align: center; font-size: 12px; color: #94a3b8;">
                        &copy; 2026 Prince Form. All rights reserved.
                    </td>
                </tr>
            </table>
        </body>
        </html>
        """
        
        msg.attach(MIMEText(html, 'html'))
        
        # Connect and send
        if settings.SMTP_PORT == 465:
            server = smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10)
        else:
            server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10)
            server.starttls()
            
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.sendmail(settings.SMTP_USER, to_email, msg.as_string())
        server.quit()
        logger.info(f"Successfully sent password change security confirmation email to {to_email}")
        
    except Exception as e:
        logger.error(f"Failed to send password change confirmation to {to_email}: {str(e)}")

def check_password_strength(password: str) -> (bool, str):
    if len(password) < 8:
        return False, "Password must be at least 8 characters long."
    if not any(c.islower() for c in password):
        return False, "Password must contain at least one lowercase letter."
    if not any(c.isupper() for c in password):
        return False, "Password must contain at least one uppercase letter."
    if not any(c.isdigit() for c in password):
        return False, "Password must contain at least one digit."
    special_chars = "!@#$%^&*()-_=+[]{}|;:',.<>?/~`"
    if not any(c in special_chars for c in password):
        return False, "Password must contain at least one special character (e.g. !, @, #, $, etc.)."
    return True, ""

async def get_current_user_id(request: Request) -> str:
    """Helper to get current logged in user ID from secure HTTP-only session token."""
    session_id = request.cookies.get("session_token")
    if not session_id or db.db is None:
        return None
    
    # Verify session exists in DB and is not expired
    session = await db.db["sessions"].find_one({"_id": session_id})
    if not session:
        return None
        
    expires_at = session.get("expiresAt")
    if expires_at:
        # Convert if stored as string/isoformat
        if isinstance(expires_at, str):
            try:
                expires_at = datetime.fromisoformat(expires_at)
            except ValueError:
                pass
        
        if expires_at < datetime.utcnow():
            # Session expired, clean up
            await db.db["sessions"].delete_one({"_id": session_id})
            return None
            
    return session.get("userId")

# Setup folder directories
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
frontend_dir = os.path.join(BASE_DIR, "frontend")
static_dir = os.path.join(frontend_dir, "static")
templates_dir = os.path.join(frontend_dir, "templates")

# Ensure directories exist
os.makedirs(static_dir, exist_ok=True)
os.makedirs(templates_dir, exist_ok=True)
os.makedirs(os.path.join(static_dir, "css"), exist_ok=True)
os.makedirs(os.path.join(static_dir, "js"), exist_ok=True)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup connection
    try:
        await db.connect_db()
    except Exception as e:
        logger.error(f"Database connection failed at startup: {e}. Running without database connection.")
    yield
    # Shutdown connection
    await db.close_db()

app = FastAPI(
    title="Prince Form Builder",
    description="Custom Google Forms builder with dynamic branding",
    lifespan=lifespan,
    docs_url=None if is_prod else "/docs",
    redoc_url=None if is_prod else "/redoc"
)

# CORS configuration
origins = [org.strip() for org in settings.ALLOWED_ORIGINS.split(",") if org.strip()]
origins = [org.rstrip("/") for org in origins]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom HTTP Security Headers Middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline'; "
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
        "font-src 'self' https://fonts.gstatic.com; "
        "img-src 'self' data: https:; "
        "connect-src 'self';"
    )
    if is_prod:
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response

# Mount static files and templates
app.mount("/static", StaticFiles(directory=static_dir), name="static")
templates = Jinja2Templates(directory=templates_dir)

# =========================================================================
# WEB PAGES
# =========================================================================

@app.get("/", response_class=HTMLResponse)
async def admin_dashboard(request: Request):
    """Serve the Admin Creator & Analytics Dashboard."""
    session_id = request.cookies.get("session_token")
    if not session_id or db.db is None:
        return RedirectResponse(url="/login")
        
    session = await db.db["sessions"].find_one({"_id": session_id})
    if not session:
        response = RedirectResponse(url="/login")
        response.delete_cookie(key="session_token")
        response.delete_cookie(key="session_user")
        return response
        
    expires_at = session.get("expiresAt")
    if expires_at:
        if isinstance(expires_at, str):
            try:
                expires_at = datetime.fromisoformat(expires_at)
            except ValueError:
                pass
        if expires_at < datetime.utcnow():
            await db.db["sessions"].delete_one({"_id": session_id})
            response = RedirectResponse(url="/login")
            response.delete_cookie(key="session_token")
            response.delete_cookie(key="session_user")
            return response
            
    username = session.get("username", "Creator")
    return templates.TemplateResponse(request=request, name="dashboard.html", context={"username": username})

@app.get("/login", response_class=HTMLResponse)
async def auth_page(request: Request):
    """Serve the Authentication Page (Login/Signup)."""
    user_id = await get_current_user_id(request)
    if user_id:
        return RedirectResponse(url="/")
    return templates.TemplateResponse(request=request, name="auth.html")

@app.get("/terms", response_class=HTMLResponse)
async def terms_page(request: Request):
    """Serve the Terms and Conditions page."""
    return templates.TemplateResponse(request=request, name="terms.html")

@app.get("/privacy", response_class=HTMLResponse)
async def privacy_page(request: Request):
    """Serve the Privacy Policy page."""
    return templates.TemplateResponse(request=request, name="privacy.html")

@app.get("/security", response_class=HTMLResponse)
async def security_page(request: Request):
    """Serve the Security Guidelines page."""
    return templates.TemplateResponse(request=request, name="security.html")

@app.get("/form/{form_id}", response_class=HTMLResponse)
async def form_responder(request: Request, form_id: str):
    """Serve the public form responder page with dynamic custom branding."""
    if db.db is None:
        raise HTTPException(status_code=503, detail="Database not connected")
    
    form_doc = await db.db["forms"].find_one({"_id": form_id})
    if not form_doc:
        raise HTTPException(status_code=404, detail="Form not found")
        
    form_doc["id"] = form_doc["_id"]
    
    # Safely ensure branding configuration is populated with fallback values for legacy forms
    if "branding" not in form_doc or not form_doc["branding"]:
        form_doc["branding"] = {
            "themeColor": "#673ab7",
            "backgroundColor": "#f0ebf8",
            "textColor": "#202124",
            "buttonColor": "#673ab7",
            "fontFamily": "Inter",
            "logoUrl": None,
            "bannerUrl": None,
            "cardStyle": "elevated"
        }
    else:
        # Guarantee all individual config keys exist
        b = form_doc["branding"]
        if isinstance(b, dict):
            b.setdefault("themeColor", "#673ab7")
            b.setdefault("backgroundColor", "#f0ebf8")
            b.setdefault("textColor", "#202124")
            b.setdefault("buttonColor", "#673ab7")
            b.setdefault("fontFamily", "Inter")
            b.setdefault("logoUrl", None)
            b.setdefault("bannerUrl", None)
            b.setdefault("cardStyle", "elevated")
            
    return templates.TemplateResponse(request=request, name="form_view.html", context={"form": form_doc})

# =========================================================================
# =========================================================================
# USER AUTHENTICATION API
# =========================================================================

@app.get("/api/auth/me")
async def get_me(request: Request):
    session_id = request.cookies.get("session_token")
    if not session_id or db.db is None:
        raise HTTPException(status_code=401, detail="Not logged in")
        
    session = await db.db["sessions"].find_one({"_id": session_id})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")
        
    expires_at = session.get("expiresAt")
    if expires_at:
        if isinstance(expires_at, str):
            try:
                expires_at = datetime.fromisoformat(expires_at)
            except ValueError:
                pass
        if expires_at < datetime.utcnow():
            await db.db["sessions"].delete_one({"_id": session_id})
            raise HTTPException(status_code=401, detail="Session expired")
            
    return {"username": session["username"]}

@app.post("/api/auth/signup-otp")
async def signup_otp(credentials: Dict[str, str], background_tasks: BackgroundTasks):
    if db.db is None:
        raise HTTPException(status_code=503, detail="Database not connected")
    username = credentials.get("username", "").strip()
    password = credentials.get("password", "")
    email = credentials.get("email", "").strip().lower()
    
    if not username or not password or not email:
        raise HTTPException(status_code=400, detail="Username, email, and password are required")
        
    # Validate email format
    if not re.match(r"^[\w\.-]+@[\w\.-]+\.\w+$", email):
        raise HTTPException(status_code=400, detail="Please enter a valid email address")
        
    # Enforce password strength
    ok, err_msg = check_password_strength(password)
    if not ok:
        raise HTTPException(status_code=400, detail=err_msg)
        
    # Check if username already exists
    existing = await db.db["users"].find_one({"username": username})
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
        
    # Check if email is already taken
    existing_email = await db.db["users"].find_one({"email": email})
    if existing_email:
        raise HTTPException(status_code=400, detail="Email is already registered")
        
    # Rate Limit check: max 3 requests per 10 minutes for this email
    ten_mins_ago = datetime.utcnow() - timedelta(minutes=10)
    request_count = await db.db["signup_otps"].count_documents({
        "email": email,
        "createdAt": {"$gt": ten_mins_ago}
    })
    if request_count >= 3:
        raise HTTPException(
            status_code=429,
            detail="Too many verification requests. Please wait a few minutes before trying again."
        )

    # Cooldown check: 60 seconds
    last_otp = await db.db["signup_otps"].find_one({
        "email": email,
        "expiresAt": {"$gt": datetime.utcnow()}
    })
    if last_otp:
        creation_time = last_otp.get("createdAt") or (last_otp["expiresAt"] - timedelta(minutes=10))
        time_elapsed = datetime.utcnow() - creation_time
        if time_elapsed < timedelta(seconds=60):
            wait_seconds = 60 - int(time_elapsed.total_seconds())
            raise HTTPException(
                status_code=429,
                detail=f"Please wait {wait_seconds} second(s) before requesting another code."
            )
            
    # Generate 6-digit OTP code
    code = f"{random.randint(100000, 999999)}"
    expires_at = datetime.utcnow() + timedelta(minutes=10)
    code_hash = hash_otp_code(code)
    
    # Store OTP in DB (and invalidate any existing codes for this email)
    await db.db["signup_otps"].delete_many({"email": email})
    await db.db["signup_otps"].insert_one({
        "email": email,
        "username": username,
        "code_hash": code_hash,
        "createdAt": datetime.utcnow(),
        "expiresAt": expires_at,
        "failedAttempts": 0
    })
    
    # Send code using background tasks to prevent API blocking
    background_tasks.add_task(send_smtp_signup_otp_email, email, code)
    
    # Mask email helper for client feedback
    def mask_email(email_addr: str) -> str:
        try:
            parts = email_addr.split("@")
            if len(parts) != 2:
                return "******"
            name, domain = parts[0], parts[1]
            masked_name = name[:2] + "***" + name[-1] if len(name) > 2 else name + "***"
            
            domain_parts = domain.split(".")
            if len(domain_parts) >= 2:
                domain_name = domain_parts[0]
                domain_suffix = ".".join(domain_parts[1:])
                masked_domain = domain_name[:2] + "***" + "." + domain_suffix if len(domain_name) > 2 else domain_name + "***." + domain_suffix
            else:
                masked_domain = domain
            return f"{masked_name}@{masked_domain}"
        except Exception:
            return "******"
            
    masked_email = mask_email(email)
    
    resp = {
        "message": "Verification code sent successfully.",
        "emailHint": masked_email
    }
    
    # Return code in debugCode for testing when SMTP is not configured
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        resp["debugCode"] = code
        
    return resp

@app.post("/api/auth/signup")
async def signup(credentials: Dict[str, str], response: Response):
    if db.db is None:
        raise HTTPException(status_code=503, detail="Database not connected")
    username = credentials.get("username", "").strip()
    password = credentials.get("password", "")
    email = credentials.get("email", "").strip().lower()
    code = credentials.get("code", "").strip()
    
    if not username or not password or not email or not code:
        raise HTTPException(status_code=400, detail="Username, email, password, and verification code are required")
        
    # Validate email format
    if not re.match(r"^[\w\.-]+@[\w\.-]+\.\w+$", email):
        raise HTTPException(status_code=400, detail="Please enter a valid email address")
        
    # Enforce password strength
    ok, err_msg = check_password_strength(password)
    if not ok:
        raise HTTPException(status_code=400, detail=err_msg)
        
    # Check if username already exists
    existing = await db.db["users"].find_one({"username": username})
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
        
    # Check if email is already taken
    existing_email = await db.db["users"].find_one({"email": email})
    if existing_email:
        raise HTTPException(status_code=400, detail="Email is already registered")
        
    # Verify the signup OTP code exists and matches
    user_code_hash = hash_otp_code(code)
    otp_record = await db.db["signup_otps"].find_one({
        "email": email,
        "code_hash": user_code_hash
    })
    
    if not otp_record:
        # Check if there is an active code for this email to track guess attempts
        active_otp = await db.db["signup_otps"].find_one({
            "email": email,
            "expiresAt": {"$gt": datetime.utcnow()}
        })
        if active_otp:
            current_failures = active_otp.get("failedAttempts", 0) + 1
            if current_failures >= 5:
                # Delete the record entirely upon lockout
                await db.db["signup_otps"].delete_one({"_id": active_otp["_id"]})
                raise HTTPException(
                    status_code=400,
                    detail="Too many failed verification attempts. This verification code has been invalidated. Please request a new one."
                )
            else:
                await db.db["signup_otps"].update_one(
                    {"_id": active_otp["_id"]},
                    {"$set": {"failedAttempts": current_failures}}
                )
                attempts_left = 5 - current_failures
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid verification code. {attempts_left} attempt(s) remaining."
                )
        raise HTTPException(status_code=400, detail="Invalid or expired verification code")
        
    if datetime.utcnow() > otp_record["expiresAt"]:
        # Delete expired code
        await db.db["signup_otps"].delete_one({"_id": otp_record["_id"]})
        raise HTTPException(status_code=400, detail="Verification code has expired")
        
    # Delete OTP from DB immediately upon successful validation
    await db.db["signup_otps"].delete_one({"_id": otp_record["_id"]})
        
    # Create user
    password_hash = hash_password(password)
    now = datetime.utcnow()
    user_dict = {
        "username": username,
        "email": email,
        "password_hash": password_hash,
        "failedAttempts": 0,
        "lockoutUntil": None,
        "createdAt": now,
        "updatedAt": now
    }
    insert_result = await db.db["users"].insert_one(user_dict)
    user_id = str(insert_result.inserted_id)
    
    # Create session
    session_id = secrets.token_hex(32)
    session_doc = {
        "_id": session_id,
        "userId": user_id,
        "username": username,
        "createdAt": datetime.utcnow(),
        "expiresAt": datetime.utcnow() + timedelta(days=30)
    }
    await db.db["sessions"].insert_one(session_doc)
    
    # Cleanup legacy cookie
    response.delete_cookie(key="session_user")
    
    # Set session cookie
    response.set_cookie(
        key="session_token",
        value=session_id,
        httponly=True,
        max_age=30*24*60*60, # 30 days
        samesite="lax",
        secure=is_prod
    )
    return {"message": "Registration successful", "username": username}

@app.post("/api/auth/login")
async def login(credentials: Dict[str, str], response: Response):
    if db.db is None:
        raise HTTPException(status_code=503, detail="Database not connected")
    username = credentials.get("username", "").strip()
    password = credentials.get("password", "")
    
    if not username or not password:
        raise HTTPException(status_code=400, detail="Username and password are required")
        
    user = await db.db["users"].find_one({"username": username})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password")
        
    # Check brute-force lockout
    lockout_until = user.get("lockoutUntil")
    if lockout_until:
        if isinstance(lockout_until, str):
            try:
                lockout_until = datetime.fromisoformat(lockout_until)
            except ValueError:
                pass
        if lockout_until > datetime.utcnow():
            remaining_sec = int((lockout_until - datetime.utcnow()).total_seconds())
            remaining_min = (remaining_sec // 60) + 1
            raise HTTPException(
                status_code=403, 
                detail=f"Account locked due to too many failed attempts. Try again in {remaining_min} minute(s)."
            )
        else:
            # Lockout expired, reset it
            await db.db["users"].update_one(
                {"_id": user["_id"]},
                {"$set": {"failedAttempts": 0, "lockoutUntil": None, "updatedAt": datetime.utcnow()}}
            )
            user["failedAttempts"] = 0
            user["lockoutUntil"] = None
            
    # Verify password
    if not verify_password(password, user["password_hash"]):
        failed_attempts = user.get("failedAttempts", 0) + 1
        lockout_time = None
        if failed_attempts >= 5:
            lockout_time = datetime.utcnow() + timedelta(minutes=15)
            await db.db["users"].update_one(
                {"_id": user["_id"]},
                {"$set": {"failedAttempts": failed_attempts, "lockoutUntil": lockout_time, "updatedAt": datetime.utcnow()}}
            )
            raise HTTPException(
                status_code=403,
                detail="Too many failed attempts. Account locked for 15 minutes."
            )
        else:
            await db.db["users"].update_one(
                {"_id": user["_id"]},
                {"$set": {"failedAttempts": failed_attempts, "updatedAt": datetime.utcnow()}}
            )
            remaining_attempts = 5 - failed_attempts
            raise HTTPException(
                status_code=401,
                detail=f"Invalid username or password. ({remaining_attempts} attempts remaining)"
            )
            
    # Success: Reset failed attempts & lockout
    await db.db["users"].update_one(
        {"_id": user["_id"]},
        {"$set": {"failedAttempts": 0, "lockoutUntil": None, "updatedAt": datetime.utcnow()}}
    )
    
    # Create session
    session_id = secrets.token_hex(32)
    session_doc = {
        "_id": session_id,
        "userId": str(user["_id"]),
        "username": username,
        "createdAt": datetime.utcnow(),
        "expiresAt": datetime.utcnow() + timedelta(days=30)
    }
    await db.db["sessions"].insert_one(session_doc)
    
    # Cleanup legacy cookie
    response.delete_cookie(key="session_user")
    
    # Set session cookie
    response.set_cookie(
        key="session_token",
        value=session_id,
        httponly=True,
        max_age=30*24*60*60, # 30 days
        samesite="lax",
        secure=is_prod
    )
    return {"message": "Login successful", "username": username}

@app.post("/api/auth/logout")
async def logout(request: Request, response: Response):
    session_id = request.cookies.get("session_token")
    if session_id and db.db is not None:
        await db.db["sessions"].delete_one({"_id": session_id})
        
    response.delete_cookie(key="session_token")
    response.delete_cookie(key="session_user")
    return {"message": "Logged out successfully"}

@app.post("/api/auth/forgot-password")
async def forgot_password(payload: Dict[str, str], background_tasks: BackgroundTasks):
    """Generate 6-digit pin and email/log it for password recovery by username or email lookup."""
    if db.db is None:
        raise HTTPException(status_code=503, detail="Database not connected")
        
    username_or_email = (payload.get("email") or payload.get("username_or_email") or "").strip()
    if not username_or_email:
        raise HTTPException(status_code=400, detail="Username or email address is required")
        
    # Search for matching email or username (case-insensitive username)
    user = await db.db["users"].find_one({
        "$or": [
            {"email": username_or_email.lower()},
            {"username": {"$regex": f"^{re.escape(username_or_email)}$", "$options": "i"}}
        ]
    })
    
    if not user:
        raise HTTPException(status_code=404, detail="No account found with this username or email address")
        
    email = user.get("email", "").strip().lower()
        
    # Cool-down check: prevent requesting a code more than once per 60 seconds
    last_reset = await db.db["password_resets"].find_one({
        "email": email,
        "expiresAt": {"$gt": datetime.utcnow()}
    })
    if last_reset:
        creation_time = last_reset.get("createdAt") or (last_reset["expiresAt"] - timedelta(minutes=10))
        time_elapsed = datetime.utcnow() - creation_time
        if time_elapsed < timedelta(seconds=60):
            wait_seconds = 60 - int(time_elapsed.total_seconds())
            raise HTTPException(
                status_code=429,
                detail=f"Please wait {wait_seconds} second(s) before requesting another code."
            )
        
    # Generate 6-digit recovery code
    code = f"{random.randint(100000, 999999)}"
    expires_at = datetime.utcnow() + timedelta(minutes=10)
    code_hash = hash_otp_code(code)
    
    # Store code in DB (and invalidate any existing codes for this email)
    await db.db["password_resets"].delete_many({"email": email})
    await db.db["password_resets"].insert_one({
        "email": email,
        "code_hash": code_hash,
        "createdAt": datetime.utcnow(),
        "expiresAt": expires_at,
        "failedAttempts": 0
    })
    
    # Send code using background tasks to prevent API blocking
    background_tasks.add_task(send_smtp_reset_email, email, code)
    
    # Secure email masking helper
    def mask_email(email_addr: str) -> str:
        try:
            parts = email_addr.split("@")
            if len(parts) != 2:
                return "******"
            name, domain = parts[0], parts[1]
            masked_name = name[:2] + "***" + name[-1] if len(name) > 2 else name + "***"
            
            domain_parts = domain.split(".")
            if len(domain_parts) >= 2:
                domain_name = domain_parts[0]
                domain_suffix = ".".join(domain_parts[1:])
                masked_domain = domain_name[:2] + "***" + "." + domain_suffix if len(domain_name) > 2 else domain_name + "***." + domain_suffix
            else:
                masked_domain = domain
            return f"{masked_name}@{masked_domain}"
        except Exception:
            return "******"
            
    masked_email = mask_email(email)
    
    # Prepare response payload
    resp = {
        "message": "Verification code sent successfully.",
        "emailHint": masked_email
    }
    
    # Return code in debugCode for mock visual alerts when SMTP is not configured
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        resp["debugCode"] = code
        
    return resp

@app.post("/api/auth/reset-password")
async def reset_password(payload: Dict[str, str], background_tasks: BackgroundTasks):
    """Validate 6-digit verification code and reset password."""
    if db.db is None:
        raise HTTPException(status_code=503, detail="Database not connected")
        
    username_or_email = (payload.get("email") or payload.get("username_or_email") or "").strip()
    code = payload.get("code", "").strip()
    new_password = payload.get("newPassword", "")
    
    if not username_or_email or not code or not new_password:
        raise HTTPException(status_code=400, detail="Username/email, code, and new password are required")
        
    # Enforce password strength
    ok, err_msg = check_password_strength(new_password)
    if not ok:
        raise HTTPException(status_code=400, detail=err_msg)
        
    # Find user by username or email first
    user = await db.db["users"].find_one({
        "$or": [
            {"email": username_or_email.lower()},
            {"username": {"$regex": f"^{re.escape(username_or_email)}$", "$options": "i"}}
        ]
    })
    
    if not user:
        raise HTTPException(status_code=404, detail="No account found with this username or email address")
        
    email = user.get("email", "").strip().lower()
    if not email:
        raise HTTPException(status_code=400, detail="No recovery email is configured for this account.")
        
    # Verify the reset code exists and matches
    user_code_hash = hash_otp_code(code)
    reset_record = await db.db["password_resets"].find_one({
        "email": email,
        "code_hash": user_code_hash
    })
    if not reset_record:
        # Check if there is an active code for this email to track guess attempts
        active_reset = await db.db["password_resets"].find_one({
            "email": email,
            "expiresAt": {"$gt": datetime.utcnow()}
        })
        if active_reset:
            current_failures = active_reset.get("failedAttempts", 0) + 1
            if current_failures >= 5:
                # Delete reset document entirely on lockout threshold
                await db.db["password_resets"].delete_one({"_id": active_reset["_id"]})
                raise HTTPException(
                    status_code=400,
                    detail="Too many failed attempts. This verification code has been invalidated. Please request a new one."
                )
            else:
                await db.db["password_resets"].update_one(
                    {"_id": active_reset["_id"]},
                    {"$set": {"failedAttempts": current_failures}}
                )
                attempts_left = 5 - current_failures
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid verification code. {attempts_left} attempt(s) remaining before this code is invalidated."
                )
        raise HTTPException(status_code=400, detail="Invalid or expired verification code")
        
    if datetime.utcnow() > reset_record["expiresAt"]:
        # Delete expired code
        await db.db["password_resets"].delete_one({"_id": reset_record["_id"]})
        raise HTTPException(status_code=400, detail="Verification code has expired")
        
    # Hash new password and update user record
    password_hash = hash_password(new_password)
    await db.db["users"].update_one(
        {"_id": user["_id"]},
        {"$set": {
            "password_hash": password_hash,
            "failedAttempts": 0,
            "lockoutUntil": None,
            "updatedAt": datetime.utcnow()
        }}
    )
    
    # Delete reset code from DB immediately upon successful validation
    await db.db["password_resets"].delete_one({"_id": reset_record["_id"]})
    
    # Send transactional password change confirmation email
    background_tasks.add_task(send_smtp_password_changed_email, email, user["username"])
    
    return {"message": "Password reset successfully. You can now log in."}

# =========================================================================
# FORM MANAGEMENT API
# =========================================================================

@app.post("/api/forms", response_model=FormModel)
async def create_form(form: FormModel, request: Request):
    """Create a new form structure and branding configuration."""
    if db.db is None:
        raise HTTPException(status_code=503, detail="Database not connected")
        
    user_id = await get_current_user_id(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
        
    form.userId = user_id
    form_dict = form.model_dump(by_alias=True)
    form_dict["_id"] = form.id
    
    # Store in MongoDB
    await db.db["forms"].insert_one(form_dict)
    return form

async def run_legacy_migration(user_id: str):
    try:
        await db.db["forms"].update_many(
            {"$or": [{"userId": {"$exists": False}}, {"userId": None}]},
            {"$set": {"userId": user_id}}
        )
    except Exception as e:
        logger.error(f"Error migrating legacy forms: {e}")

@app.get("/api/forms", response_model=List[FormModel])
async def list_forms(request: Request, background_tasks: BackgroundTasks):
    """Retrieve all created forms for the current logged in user (sorted by creation date)."""
    if db.db is None:
        return []
        
    user_id = await get_current_user_id(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
        
    # Queue legacy migration in background to prevent request latency
    background_tasks.add_task(run_legacy_migration, user_id)
        
    forms = []
    cursor = db.db["forms"].find({"userId": user_id}).sort("createdAt", -1)
    async for doc in cursor:
        doc["id"] = doc["_id"]
        forms.append(FormModel(**doc))
    return forms

@app.get("/api/forms/{form_id}", response_model=FormModel)
async def get_form(form_id: str):
    """Retrieve form definition by ID (Public responder endpoint)."""
    if db.db is None:
        raise HTTPException(status_code=503, detail="Database not connected")
        
    form_doc = await db.db["forms"].find_one({"_id": form_id})
    if not form_doc:
        raise HTTPException(status_code=404, detail="Form not found")
        
    form_doc["id"] = form_doc["_id"]
    return FormModel(**form_doc)

@app.put("/api/forms/{form_id}", response_model=FormModel)
async def update_form(form_id: str, form: FormModel, request: Request):
    """Update form structure or branding configurations."""
    if db.db is None:
        raise HTTPException(status_code=503, detail="Database not connected")
        
    user_id = await get_current_user_id(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
        
    # Check ownership
    existing_form = await db.db["forms"].find_one({"_id": form_id})
    if not existing_form:
        raise HTTPException(status_code=404, detail="Form not found")
        
    if existing_form.get("userId") != user_id:
        raise HTTPException(status_code=403, detail="Forbidden: You do not own this form")
        
    form.userId = user_id
    form_dict = form.model_dump(by_alias=True)
    form_dict["_id"] = form_id
    form_dict.pop("id", None)
    
    result = await db.db["forms"].replace_one({"_id": form_id}, form_dict)
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Form not found")
        
    form.id = form_id
    return form

@app.delete("/api/forms/{form_id}")
async def delete_form(form_id: str, request: Request):
    """Delete a form configuration and all of its submitted responses."""
    if db.db is None:
        raise HTTPException(status_code=503, detail="Database not connected")
        
    user_id = await get_current_user_id(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
        
    # Check ownership
    existing_form = await db.db["forms"].find_one({"_id": form_id})
    if not existing_form:
        raise HTTPException(status_code=404, detail="Form not found")
        
    if existing_form.get("userId") != user_id:
        raise HTTPException(status_code=403, detail="Forbidden: You do not own this form")
        
    # Delete form config
    form_result = await db.db["forms"].delete_one({"_id": form_id})
    if form_result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Form not found")
        
    # Clean up responses
    await db.db["responses"].delete_many({"formId": form_id})
    return {"message": "Form and associated responses deleted successfully"}

# =========================================================================
@app.get("/api/forms/{form_id}/validate-unique")
async def validate_unique(form_id: str, question_id: str, value: str):
    """Check if a response value for a specific question ID is unique."""
    if db.db is None:
        return {"unique": True}
    
    # Handle string vs numeric type mismatches in DB queries
    query_values = [value]
    try:
        if "." in value:
            query_values.append(float(value))
        else:
            query_values.append(int(value))
    except ValueError:
        pass
        
    existing = await db.db["responses"].find_one({
        "formId": form_id,
        f"answers.{question_id}": {"$in": query_values}
    })
    return {"unique": existing is None}

@app.post("/api/forms/{form_id}/responses", response_model=ResponseModel)
async def submit_response(form_id: str, response: ResponseModel):
    """Submit responses to a specific form."""
    if db.db is None:
        raise HTTPException(status_code=503, detail="Database not connected")
        
    # Validate form exists
    form_exists = await db.db["forms"].find_one({"_id": form_id})
    if not form_exists:
        raise HTTPException(status_code=404, detail="Form not found")
        
    # Block submission if form is closed
    if not form_exists.get("acceptingResponses", True):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="This form is no longer accepting responses"
        )
        
    # Server-side regex pattern checks for security
    import re
    questions_dict = {q["id"]: q for q in form_exists.get("questions", [])}
    for q_id, answer in response.answers.items():
        if q_id in questions_dict:
            q_config = questions_dict[q_id]
            validations = q_config.get("validations", [])
            str_answer = str(answer) if answer is not None else ""
            
            if validations:
                for val in validations:
                    val_type = val.get("type", "none")
                    val_pattern = val.get("pattern", "")
                    
                    if val_type == "unique":
                        # Check if this answer already exists in DB for this form and this question ID
                        existing_response = await db.db["responses"].find_one({
                            "formId": form_id,
                            f"answers.{q_id}": answer
                        })
                        if existing_response:
                            err_msg = val.get("errorText") or f"You have already submitted this response for '{q_config.get('label')}'."
                            raise HTTPException(
                                status_code=status.HTTP_400_BAD_REQUEST,
                                detail=err_msg
                            )
                    elif val_type != "none" and val_pattern:
                        try:
                            regex = re.compile(val_pattern)
                        except Exception as e:
                            logger.error(f"Invalid regex pattern '{val_pattern}' on question {q_id}: {e}")
                            continue
                        
                        if not regex.match(str_answer):
                            err_msg = val.get("errorText") or f"Invalid format for field '{q_config.get('label')}'."
                            raise HTTPException(
                                status_code=status.HTTP_400_BAD_REQUEST,
                                detail=err_msg
                            )
            else:
                # Legacy fallback
                val_type = q_config.get("validationType", "none")
                val_pattern = q_config.get("validationPattern", "")
                
                if val_type != "none" and val_pattern:
                    try:
                        regex = re.compile(val_pattern)
                    except Exception as e:
                        logger.error(f"Invalid regex pattern '{val_pattern}' on question {q_id}: {e}")
                        continue
                    
                    if not regex.match(str_answer):
                        err_msg = q_config.get("validationErrorText") or f"Invalid format for field '{q_config.get('label')}'."
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=err_msg
                        )
        
    response.formId = form_id
    response_dict = response.model_dump(by_alias=True)
    response_dict["_id"] = response.id
    
    # Store response
    await db.db["responses"].insert_one(response_dict)
    return response

@app.get("/api/forms/{form_id}/responses", response_model=List[ResponseModel])
async def get_responses(form_id: str):
    """Retrieve all submissions for a given form."""
    if db.db is None:
        return []
        
    responses = []
    cursor = db.db["responses"].find({"formId": form_id}).sort("submittedAt", -1)
    async for doc in cursor:
        doc["id"] = doc["_id"]
        responses.append(ResponseModel(**doc))
    return responses

# =========================================================================
# FILE UPLOAD API
# =========================================================================
import shutil
import uuid

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    """Upload logo or banner images from device and return server URL path."""
    uploads_dir = os.path.join(static_dir, "uploads")
    os.makedirs(uploads_dir, exist_ok=True)
    
    # Validate extension
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Invalid file format. Only images (.png, .jpg, .jpeg, .gif, .webp, .svg) are allowed."
        )
        
    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(uploads_dir, filename)
    
    try:
        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        logger.error(f"Failed to save uploaded file: {e}")
        raise HTTPException(status_code=500, detail="Failed to save uploaded file.")
        
    return {"url": f"/static/uploads/{filename}"}

@app.get("/api/forms/{form_id}/export/csv")
async def export_csv(form_id: str, secret: str):
    """Secure public CSV export route for Google Sheets integration via IMPORTDATA."""
    if db.db is None:
        raise HTTPException(status_code=503, detail="Database not connected")
        
    form_doc = await db.db["forms"].find_one({"_id": form_id})
    if not form_doc:
        raise HTTPException(status_code=404, detail="Form not found")
        
    # Verify the secret token
    db_token = form_doc.get("responseShareToken")
    if not db_token or secret != db_token:
        raise HTTPException(status_code=403, detail="Forbidden: Invalid or expired integration secret")
        
    form = FormModel(**{**form_doc, "id": form_doc["_id"]})
    
    # Load all responses
    responses = []
    cursor = db.db["responses"].find({"formId": form_id}).sort("submittedAt", 1) # chronological order for sheets
    async for doc in cursor:
        responses.append(doc)
        
    # Generate CSV in memory
    output = io.StringIO()
    # Add UTF-8 BOM for Excel/Google Sheets compatibility
    output.write('\ufeff')
    writer = csv.writer(output, delimiter=',', quotechar='"', quoting=csv.QUOTE_MINIMAL)
    
    # Headers
    headers = ["Submitted At"]
    for q in form.questions:
        headers.append(q.label)
    writer.writerow(headers)
    
    # Rows
    for resp in responses:
        submitted_at = resp.get("submittedAt")
        submitted_at_str = ""
        if isinstance(submitted_at, datetime):
            submitted_at_str = "\t" + submitted_at.strftime("%Y-%m-%d %H:%M:%S")
        elif isinstance(submitted_at, str):
            submitted_at_str = "\t" + submitted_at
            
        answers = resp.get("answers", {})
        row = [submitted_at_str]
        for q in form.questions:
            ans = answers.get(q.id)
            if ans is None:
                row.append("")
            elif isinstance(ans, list):
                row.append("; ".join(map(str, ans)))
            else:
                val_str = str(ans)
                # Prevent Excel/Sheets auto-formatting phone/long numbers into scientific notation or dropping leading zeroes
                if re.match(r"^\+?\d{8,}$", val_str) or re.match(r"^0\d+$", val_str):
                    row.append(f"\t{val_str}")
                else:
                    row.append(val_str)
        writer.writerow(row)
        
    csv_data = output.getvalue()
    output.close()
    
    filename = f"{form.title.lower().replace(' ', '_')}_responses.csv"
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )

@app.post("/api/forms/{form_id}/link-sheets")
async def link_sheets(form_id: str, request: Request):
    """Enable Google Sheets integration and generate a unique CSV sync token."""
    if db.db is None:
        raise HTTPException(status_code=503, detail="Database not connected")
        
    user_id = await get_current_user_id(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
        
    existing_form = await db.db["forms"].find_one({"_id": form_id})
    if not existing_form:
        raise HTTPException(status_code=404, detail="Form not found")
        
    if existing_form.get("userId") != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
        
    # Generate unique token
    import uuid
    token = uuid.uuid4().hex
    
    await db.db["forms"].update_one(
        {"_id": form_id},
        {"$set": {
            "responseShareToken": token,
            "isLinkedToSheets": True
        }}
    )
    
    return {"responseShareToken": token}

@app.post("/api/forms/{form_id}/unlink-sheets")
async def unlink_sheets(form_id: str, request: Request):
    """Disable Google Sheets integration and revoke the CSV sync token."""
    if db.db is None:
        raise HTTPException(status_code=503, detail="Database not connected")
        
    user_id = await get_current_user_id(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
        
    existing_form = await db.db["forms"].find_one({"_id": form_id})
    if not existing_form:
        raise HTTPException(status_code=404, detail="Form not found")
        
    if existing_form.get("userId") != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
        
    await db.db["forms"].update_one(
        {"_id": form_id},
        {"$set": {
            "responseShareToken": None,
            "isLinkedToSheets": False
        }}
    )
    
    return {"message": "Sheets integration unlinked successfully."}

@app.delete("/api/forms/{form_id}/responses")
async def delete_responses(form_id: str, request: Request):
    """Permanently delete all responses for the form."""
    if db.db is None:
        raise HTTPException(status_code=503, detail="Database not connected")
        
    user_id = await get_current_user_id(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
        
    existing_form = await db.db["forms"].find_one({"_id": form_id})
    if not existing_form:
        raise HTTPException(status_code=404, detail="Form not found")
        
    if existing_form.get("userId") != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
        
    # Delete all responses matching the formId
    delete_res = await db.db["responses"].delete_many({"formId": form_id})
    
    return {"message": f"Successfully deleted {delete_res.deleted_count} response(s)."}

@app.get("/health")
@app.get("/api/health")
async def health_check():
    """Lightweight endpoint for keep-alive pings and cron health checks."""
    return {"status": "ok"}
