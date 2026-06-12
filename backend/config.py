import os
from dotenv import load_dotenv

# Find the parent folder of backend/ and load the .env file
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
dotenv_path = os.path.join(BASE_DIR, ".env")
load_dotenv(dotenv_path)

class Settings:
    MONGODB_URL: str = os.getenv("MONGODB_URL") or os.getenv("MONGO_URI") or "mongodb://localhost:27017"
    DATABASE_NAME: str = os.getenv("DATABASE_NAME", "prince_form_db")
    PORT: int = int(os.getenv("PORT", "8000"))

settings = Settings()
