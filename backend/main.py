import os
import logging
from contextlib import asynccontextmanager
from typing import List, Dict, Any
from datetime import datetime, timedelta
import secrets
import re

from fastapi import FastAPI, Request, HTTPException, status, UploadFile, File, Response
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse
from fastapi.middleware.cors import CORSMiddleware

from .database import db
from .models import FormModel, ResponseModel, UserModel

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
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5000/","https://princeform.onrender.com/"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

@app.post("/api/auth/signup")
async def signup(credentials: Dict[str, str], response: Response):
    if db.db is None:
        raise HTTPException(status_code=503, detail="Database not connected")
    username = credentials.get("username", "").strip()
    password = credentials.get("password", "")
    
    if not username or not password:
        raise HTTPException(status_code=400, detail="Username and password are required")
        
    # Enforce password strength
    ok, err_msg = check_password_strength(password)
    if not ok:
        raise HTTPException(status_code=400, detail=err_msg)
        
    # Check if user already exists
    existing = await db.db["users"].find_one({"username": username})
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
        
    # Create user
    password_hash = hash_password(password)
    user_dict = {
        "username": username,
        "password_hash": password_hash,
        "failedAttempts": 0,
        "lockoutUntil": None
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
                {"$set": {"failedAttempts": 0, "lockoutUntil": None}}
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
                {"$set": {"failedAttempts": failed_attempts, "lockoutUntil": lockout_time}}
            )
            raise HTTPException(
                status_code=403,
                detail="Too many failed attempts. Account locked for 15 minutes."
            )
        else:
            await db.db["users"].update_one(
                {"_id": user["_id"]},
                {"$set": {"failedAttempts": failed_attempts}}
            )
            remaining_attempts = 5 - failed_attempts
            raise HTTPException(
                status_code=401,
                detail=f"Invalid username or password. ({remaining_attempts} attempts remaining)"
            )
            
    # Success: Reset failed attempts & lockout
    await db.db["users"].update_one(
        {"_id": user["_id"]},
        {"$set": {"failedAttempts": 0, "lockoutUntil": None}}
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

@app.get("/api/forms", response_model=List[FormModel])
async def list_forms(request: Request):
    """Retrieve all created forms for the current logged in user (sorted by creation date)."""
    if db.db is None:
        return []
        
    user_id = await get_current_user_id(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
        
    # Auto-migrate legacy unowned forms (where userId is missing or None) to this user
    await db.db["forms"].update_many(
        {"$or": [{"userId": {"$exists": False}}, {"userId": None}]},
        {"$set": {"userId": user_id}}
    )
        
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
