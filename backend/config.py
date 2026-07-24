import os
import secrets
from dotenv import load_dotenv

# Find the parent folder of backend/ and load the .env file
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
dotenv_path = os.path.join(BASE_DIR, ".env")
load_dotenv(dotenv_path, override=True)

class Settings:
    MONGODB_URL: str = (os.getenv("MONGODB_URL") or os.getenv("MONGO_URI") or "mongodb://localhost:27017").strip()
    DATABASE_NAME: str = os.getenv("DATABASE_NAME", "prince_form_db").strip()
    PORT: int = int(os.getenv("PORT", "8000"))
    ALLOWED_ORIGINS: str = os.getenv("ALLOWED_ORIGINS", "http://localhost:5000,https://princeform.onrender.com").strip()
    
    # SMTP Configuration
    SMTP_HOST: str = os.getenv("SMTP_HOST", "smtp.gmail.com").strip()
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: str = os.getenv("SMTP_USER", "").strip()
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "").strip()
    SMTP_FROM_NAME: str = os.getenv("SMTP_FROM_NAME", "Prince Form").strip()

    # Google OAuth
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "").strip().strip('"').strip("'")
    SECRET_KEY: str = os.getenv("SECRET_KEY", secrets.token_hex(32)).strip()

settings = Settings()
