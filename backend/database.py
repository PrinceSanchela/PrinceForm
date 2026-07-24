import logging
from motor.motor_asyncio import AsyncIOMotorClient
from .config import settings

logger = logging.getLogger("prince_form.database")

class DatabaseHelper:
    def __init__(self):
        self.client = None
        self.db = None

    async def connect_db(self):
        """Establish asynchronous connection to MongoDB and ensure indexes."""
        try:
            self.client = AsyncIOMotorClient(
                settings.MONGODB_URL,
                maxPoolSize=50,
                minPoolSize=10,
                serverSelectionTimeoutMS=5000,
                connectTimeoutMS=5000
            )
            self.db = self.client[settings.DATABASE_NAME]
            
            # Ping database to verify connection
            await self.db.command("ping")
            logger.info("Successfully connected to MongoDB!")
            
            # Ensure indexes for fast queries
            await self.db["forms"].create_index("createdAt")
            await self.db["forms"].create_index([("userId", 1), ("createdAt", -1)])
            
            await self.db["responses"].create_index("formId")
            await self.db["responses"].create_index("submittedAt")
            
            # Unique user indices for fast lookup queries
            try:
                await self.db["users"].create_index("username", unique=True)
            except Exception:
                logger.warning("Could not create unique index on users.username, possibly due to existing duplicates.")
                await self.db["users"].create_index("username")

            try:
                await self.db["users"].create_index("email", unique=True)
            except Exception:
                logger.warning("Could not create unique index on users.email, possibly due to existing duplicates.")
                await self.db["users"].create_index("email")
            
            # TTL indexes to automatically prune expired sessions and recovery codes
            await self.db["sessions"].create_index("createdAt", expireAfterSeconds=30*24*60*60)
            await self.db["password_resets"].create_index("expiresAt", expireAfterSeconds=0)
            await self.db["password_resets"].create_index("email")
            
            # Signup verification OTP indexes
            await self.db["signup_otps"].create_index("expiresAt", expireAfterSeconds=0)
            await self.db["signup_otps"].create_index("email")
            
            
        except Exception as e:
            logger.error(f"Error connecting to MongoDB: {str(e)}")
            self.client = None
            self.db = None
            raise e

    async def close_db(self):
        """Close MongoDB client connection."""
        if self.client:
            self.client.close()
            logger.info("Closed MongoDB connection.")

db = DatabaseHelper()
